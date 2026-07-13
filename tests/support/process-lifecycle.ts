export type ProcessSignal = "SIGTERM" | "SIGKILL";

export interface LifecycleProcess {
  exited: Promise<number>;
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  kill(signal: ProcessSignal): void;
}

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ProcessOptions {
  command: string[];
  label: string;
  spawn(command: string[]): LifecycleProcess;
  operationTimeoutMs: number;
  cleanupTimeoutMs: number;
}

interface ServerOptions extends Omit<ProcessOptions, "operationTimeoutMs"> {
  parsePort(output: string): string | undefined;
  startupTimeoutMs: number;
}

interface OutputCapture {
  readonly text: string;
  readonly done: Promise<string>;
  readonly complete: boolean;
  cancel(): Promise<void>;
}

export async function bounded<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  const timeout = Promise.withResolvers<never>();
  const timeoutId = setTimeout(() => timeout.reject(new Error(message)), timeoutMs);
  try {
    return await Promise.race([promise, timeout.promise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function captureOutput(stream: ReadableStream<Uint8Array>): OutputCapture {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let complete = false;
  const done = (async () => {
    while (true) {
      const chunk = await reader.read();
      text += decoder.decode(chunk.value, { stream: !chunk.done });
      if (chunk.done) {
        complete = true;
        return text;
      }
    }
  })();
  return {
    get text() {
      return text;
    },
    get complete() {
      return complete;
    },
    done,
    cancel: () => reader.cancel(),
  };
}

export async function terminateProcess(child: LifecycleProcess, label: string, timeoutMs: number): Promise<void> {
  child.kill("SIGTERM");
  try {
    await bounded(child.exited, timeoutMs, `${label} ignored SIGTERM`);
  } catch (termError) {
    child.kill("SIGKILL");
    try {
      await bounded(child.exited, timeoutMs, `${label} did not exit after SIGKILL`);
    } catch (killError) {
      throw new AggregateError([termError, killError], `${label} could not be terminated`);
    }
  }
}

async function terminateThenDrain(
  child: LifecycleProcess,
  label: string,
  timeoutMs: number,
  captures: ReadonlyArray<readonly ["stdout" | "stderr", OutputCapture]>,
): Promise<unknown[]> {
  const errors: unknown[] = [];
  try {
    await terminateProcess(child, label, timeoutMs);
  } catch (error) {
    errors.push(error);
  }
  for (const [name, capture] of captures) {
    if (capture.complete) continue;
    try {
      await bounded(capture.done, timeoutMs, `${label} ${name} did not drain after termination`);
      continue;
    } catch (error) {
      errors.push(error);
    }
    try {
      await bounded(capture.cancel(), timeoutMs, `${label} ${name} cancellation timed out`);
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}

function combinePrimaryAndCleanup(primaryError: unknown, cleanupErrors: unknown[], message: string): never {
  if (cleanupErrors.length > 0) throw new AggregateError([primaryError, ...cleanupErrors], message);
  throw primaryError;
}

export async function runProcess(options: ProcessOptions): Promise<ProcessResult> {
  const child = options.spawn(options.command);
  const stdout = captureOutput(child.stdout);
  const stderr = captureOutput(child.stderr);
  try {
    const exitCode = await bounded(child.exited, options.operationTimeoutMs, `${options.label} exceeded ${options.operationTimeoutMs}ms`);
    const stdoutText = await bounded(stdout.done, options.cleanupTimeoutMs, `${options.label} stdout did not drain`);
    const stderrText = await bounded(stderr.done, options.cleanupTimeoutMs, `${options.label} stderr did not drain`);
    return { exitCode, stdout: stdoutText, stderr: stderrText };
  } catch (primaryError) {
    const cleanupErrors = await terminateThenDrain(child, options.label, options.cleanupTimeoutMs, [["stdout", stdout], ["stderr", stderr]]);
    combinePrimaryAndCleanup(primaryError, cleanupErrors, `${options.label} failed and cleanup was incomplete`);
  }
}

async function waitForPort(child: LifecycleProcess, capture: OutputCapture, options: ServerOptions): Promise<number> {
  while (true) {
    const parsed = options.parsePort(capture.text);
    if (parsed !== undefined) return Number(parsed);
    if (capture.complete) {
      const exitCode = await child.exited;
      throw new Error(`${options.label} exited with ${exitCode} before publishing a port`);
    }
    const tick = Promise.withResolvers<void>();
    setTimeout(tick.resolve, 1);
    await tick.promise;
  }
}

export async function startServerProcess(options: ServerOptions): Promise<{ port: number; stop(): Promise<void> }> {
  const child = options.spawn(options.command);
  const stdout = captureOutput(child.stdout);
  const stderr = captureOutput(child.stderr);
  try {
    const port = await bounded(
      waitForPort(child, stdout, options),
      options.startupTimeoutMs,
      `${options.label} did not start within ${options.startupTimeoutMs}ms`,
    );
    return {
      port,
      async stop() {
        const cleanupErrors = await terminateThenDrain(child, options.label, options.cleanupTimeoutMs, [["stdout", stdout], ["stderr", stderr]]);
        if (cleanupErrors.length > 0) throw new AggregateError(cleanupErrors, `${options.label} cleanup failed`);
      },
    };
  } catch (primaryError) {
    const cleanupErrors = await terminateThenDrain(child, options.label, options.cleanupTimeoutMs, [["stdout", stdout], ["stderr", stderr]]);
    if (stdout.text || stderr.text) {
      const detail = stderr.text || stdout.text;
      if (primaryError instanceof Error && !primaryError.message.includes(detail.trim())) primaryError.message += `:\n${detail}`;
    }
    combinePrimaryAndCleanup(primaryError, cleanupErrors, `${options.label} startup failed and cleanup was incomplete`);
  }
}
