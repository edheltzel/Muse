import { describe, expect, test } from "bun:test";

import {
  runProcess,
  startServerProcess,
  terminateProcess,
  type LifecycleProcess,
} from "./support/process-lifecycle.ts";

const timeoutMs = 10;

interface FakeProcess extends LifecycleProcess {
  events: string[];
  exit: (code: number) => void;
}

function stream(text: string, events: string[], name: string, stall = false, stallCancel = false): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      if (text) controller.enqueue(new TextEncoder().encode(text));
      if (!stall) controller.close();
    },
    cancel() {
      events.push(`cancel:${name}`);
      return stallCancel ? Promise.withResolvers<void>().promise : undefined;
    },
  });
}

function fakeProcess(options: {
  stdout?: string;
  stderr?: string;
  stallStdout?: boolean;
  stallStderr?: boolean;
  stallCancel?: boolean;
  exitCode?: number;
  exitOn?: "SIGTERM" | "SIGKILL";
} = {}): FakeProcess {
  const events: string[] = [];
  const exitState = Promise.withResolvers<number>();
  if (options.exitCode !== undefined) queueMicrotask(() => exitState.resolve(options.exitCode!));
  return {
    events,
    exited: exitState.promise,
    stdout: stream(options.stdout ?? "", events, "stdout", options.stallStdout, options.stallCancel),
    stderr: stream(options.stderr ?? "", events, "stderr", options.stallStderr, options.stallCancel),
    exit: exitState.resolve,
    kill(signal) {
      events.push(`kill:${signal}`);
      if (options.exitOn === signal) exitState.resolve(143);
    },
  };
}

function errorsOf(error: unknown): unknown[] {
  return error instanceof AggregateError ? error.errors : [error];
}

describe("process lifecycle helpers", () => {
  test("returns normal stdout and stderr after a zero exit", async () => {
    const child = fakeProcess({ stdout: "ready\n", stderr: "note\n", exitCode: 0 });
    const result = await runProcess({ command: ["fixture"], label: "fixture", spawn: () => child, operationTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs });
    expect(result).toEqual({ exitCode: 0, stdout: "ready\n", stderr: "note\n" });
    expect(child.events).toEqual([]);
  });

  test("terminates with SIGTERM when the process cooperates", async () => {
    const child = fakeProcess({ exitOn: "SIGTERM" });
    await terminateProcess(child, "fixture", timeoutMs);
    expect(child.events).toEqual(["kill:SIGTERM"]);
  });

  test("escalates from SIGTERM to SIGKILL", async () => {
    const child = fakeProcess({ exitOn: "SIGKILL" });
    await terminateProcess(child, "fixture", timeoutMs);
    expect(child.events).toEqual(["kill:SIGTERM", "kill:SIGKILL"]);
  });

  test("reports both signal timeouts when SIGKILL cannot terminate", async () => {
    const child = fakeProcess();
    const error = await terminateProcess(child, "fixture", timeoutMs).catch((value) => value);
    expect(error).toBeInstanceOf(AggregateError);
    expect(errorsOf(error).map(String)).toEqual([
      "Error: fixture ignored SIGTERM",
      "Error: fixture did not exit after SIGKILL",
    ]);
  });

  test("bounds stdout and stderr drain and terminates before cancelling readers", async () => {
    const child = fakeProcess({ exitCode: 0, stallStdout: true, stallStderr: true, stallCancel: true, exitOn: "SIGTERM" });
    const error = await runProcess({ command: ["fixture"], label: "fixture", spawn: () => child, operationTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs }).catch((value) => value);
    expect(error).toBeInstanceOf(AggregateError);
    expect(errorsOf(error).map(String)).toEqual([
      "Error: fixture stdout did not drain",
      "Error: fixture stdout did not drain after termination",
      "Error: fixture stdout cancellation timed out",
      "Error: fixture stderr did not drain after termination",
      "Error: fixture stderr cancellation timed out",
    ]);
    expect(child.events.slice(0, 3)).toEqual(["kill:SIGTERM", "cancel:stdout", "cancel:stderr"]);
  });

  test("reports a server exit before it publishes a port", async () => {
    const child = fakeProcess({ stdout: "booting\n", stderr: "bind failed\n", exitCode: 2 });
    const error = await startServerProcess({ command: ["server"], label: "server", spawn: () => child, parsePort: (output) => output.match(/port=(\d+)/)?.[1], startupTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs }).catch((value) => value);
    expect(String(error)).toContain("server exited with 2 before publishing a port");
    expect(String(error)).toContain("bind failed");
  });

  test("bounds server startup and terminates before stream cancellation", async () => {
    const child = fakeProcess({ stallStdout: true, stallStderr: true, stallCancel: true, exitOn: "SIGTERM" });
    const error = await startServerProcess({ command: ["server"], label: "server", spawn: () => child, parsePort: () => undefined, startupTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs }).catch((value) => value);
    expect(error).toBeInstanceOf(AggregateError);
    expect(String(errorsOf(error)[0])).toBe("Error: server did not start within 10ms");
    expect(child.events.slice(0, 3)).toEqual(["kill:SIGTERM", "cancel:stdout", "cancel:stderr"]);
  });

  test("preserves primary error before ordered cleanup errors", async () => {
    const child = fakeProcess({ stallStdout: true, stallStderr: true, stallCancel: true });
    const error = await runProcess({ command: ["fixture"], label: "fixture", spawn: () => child, operationTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs }).catch((value) => value);
    expect(error).toBeInstanceOf(AggregateError);
    expect(errorsOf(error).map(String)).toEqual([
      "Error: fixture exceeded 10ms",
      "AggregateError: fixture could not be terminated",
      "Error: fixture stdout did not drain after termination",
      "Error: fixture stdout cancellation timed out",
      "Error: fixture stderr did not drain after termination",
      "Error: fixture stderr cancellation timed out",
    ]);
  });

  test("returns a stoppable server after observing its published port", async () => {
    const child = fakeProcess({ stdout: "port=7375\n", exitOn: "SIGTERM" });
    const server = await startServerProcess({ command: ["server"], label: "server", spawn: () => child, parsePort: (output) => output.match(/port=(\d+)/)?.[1], startupTimeoutMs: timeoutMs, cleanupTimeoutMs: timeoutMs });
    expect(server.port).toBe(7375);
    await server.stop();
    expect(child.events).toEqual(["kill:SIGTERM"]);
  });
});
