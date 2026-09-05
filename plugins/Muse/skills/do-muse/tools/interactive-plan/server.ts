import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { isFontAsset } from "./assets";
import { renderPlanFolder } from "./render";
import {
  addComment,
  approvePlan,
  readPublishedArtifact,
  readReviewSnapshot,
  resolveComment,
  ReviewOperationError,
  ReviewWaiterLimitError,
  subscribeReviewChanges,
  updateReviewState,
  waitForReviewGeneration,
} from "./state-store";
import { validateReviewStatePatch } from "./schema";

type Presence = "listening" | "working" | "waiting";
type ServerEvent = "presence" | "agent-reply" | "review-update";
type EventPayload = Record<string, unknown>;

interface EventConnection {
  send: (event: ServerEvent, payload: EventPayload) => void;
  close: () => void;
}

interface ReviewSession {
  presence: Presence;
  waiterCount: number;
  connections: Set<EventConnection>;
}

const reviewSessions = new Map<string, ReviewSession>();

function sessionFor(planDir: string): ReviewSession {
  const existing = reviewSessions.get(planDir);
  if (existing) return existing;
  const created: ReviewSession = { presence: "waiting", waiterCount: 0, connections: new Set() };
  reviewSessions.set(planDir, created);
  return created;
}

function emitServerEvent(planDir: string, event: ServerEvent, payload: EventPayload): void {
  for (const connection of sessionFor(planDir).connections) connection.send(event, payload);
}

function setPresence(planDir: string, presence: Presence): void {
  const session = sessionFor(planDir);
  if (session.presence === presence) return;
  session.presence = presence;
  emitServerEvent(planDir, "presence", { presence });
}

function agentWaitParked(planDir: string): void {
  const session = sessionFor(planDir);
  session.waiterCount += 1;
  setPresence(planDir, "listening");
}

function agentWaitDelivered(planDir: string): void {
  const session = sessionFor(planDir);
  session.waiterCount = Math.max(0, session.waiterCount - 1);
  if (session.waiterCount === 0) setPresence(planDir, "working");
}

function agentWaitCancelled(planDir: string): void {
  const session = sessionFor(planDir);
  session.waiterCount = Math.max(0, session.waiterCount - 1);
  if (session.waiterCount === 0) setPresence(planDir, "waiting");
}

function sseFrame(event: ServerEvent, payload: EventPayload): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function eventStream(
  planDir: string,
  requestSignal: AbortSignal,
  lifecycleSignal: AbortSignal,
  registerCleanup: (cleanup: () => void) => void,
): Response {
  let cleanup: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | undefined;
      const session = sessionFor(planDir);
      const connection: EventConnection = {
        send: (event, payload) => {
          if (!closed) controller.enqueue(sseFrame(event, payload));
        },
        close: () => {
          if (closed) return;
          closed = true;
          unsubscribe?.();
          requestSignal.removeEventListener("abort", abort);
          lifecycleSignal.removeEventListener("abort", abort);
          session.connections.delete(connection);
          try {
            controller.close();
          } catch {
            // The browser may already have closed the stream.
          }
        },
      };
      const abort = () => connection.close();
      cleanup = connection.close;
      registerCleanup(connection.close);
      session.connections.add(connection);
      requestSignal.addEventListener("abort", abort, { once: true });
      lifecycleSignal.addEventListener("abort", abort, { once: true });
      connection.send("presence", { presence: session.presence });
      try {
        unsubscribe = subscribeReviewChanges(planDir, ({ generation }) => {
          connection.send("review-update", { generation });
        });
      } catch {
        connection.close();
      }
    },
    cancel() {
      cleanup?.();
    },
  });
  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-store",
      "connection": "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}

async function json(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Response("JSON body must be an object", { status: 400 });
  return value as Record<string, unknown>;
}

function requireMutationRequest(request: Request, url: URL, serverPort: number): void {
  const origin = request.headers.get("origin");
  if (origin !== null) {
    let parsedOrigin: URL | undefined;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      // Invalid and opaque origins are both foreign to the local review server.
    }
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (!parsedOrigin || origin === "null" || parsedOrigin.origin !== url.origin || !loopback || Number(url.port) !== serverPort) {
      throw new Response("Foreign mutation origin", { status: 403 });
    }
  }
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new Response("Mutating API requests require application/json", { status: 415 });
  }
}

function validateCommentBody(body: Record<string, unknown>, idempotencyKey: string | null): {
  mode: "resolve";
  resolveId: string;
} | {
  mode: "add";
  id?: string;
  blockId: string;
  anchor?: string;
  body: string;
} {
  const keys = Object.keys(body);
  if ("resolveId" in body) {
    if (keys.length !== 1 || typeof body.resolveId !== "string" || body.resolveId.trim().length === 0) {
      throw new Response("Comment resolution body must be exactly { resolveId: nonblank string }", { status: 400 });
    }
    return { mode: "resolve", resolveId: body.resolveId };
  }
  const id = body.id ?? idempotencyKey ?? undefined;
  if (
    keys.some((key) => key !== "id" && key !== "blockId" && key !== "anchor" && key !== "body")
    || (id !== undefined && (typeof id !== "string" || id.trim().length === 0))
    || (idempotencyKey !== null && (idempotencyKey.trim().length === 0 || id !== idempotencyKey))
    || typeof body.blockId !== "string"
    || body.blockId.trim().length === 0
    || typeof body.body !== "string"
    || body.body.trim().length === 0
    || (body.anchor !== undefined && (typeof body.anchor !== "string" || body.anchor.trim().length === 0))
  ) {
    throw new Response("Comment body must contain matching optional id/idempotency-key plus nonblank blockId, body, and optional anchor", { status: 400 });
  }
  return {
    mode: "add",
    id: id as string | undefined,
    blockId: body.blockId,
    anchor: body.anchor as string | undefined,
    body: body.body,
  };
}

export async function servePlan(planDir: string, port = 7374, signal?: AbortSignal) {
  planDir = await realpath(planDir);
  await renderPlanFolder(planDir);
  signal?.throwIfAborted();
  const lifecycleController = new AbortController();
  const streamCleanups = new Set<() => void>();
  const server = Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url);
      try {
        if (url.pathname.startsWith("/assets/")) {
          const filename = url.pathname.slice("/assets/".length);
          if (!isFontAsset(filename)) return new Response("Not found", { status: 404 });
          return new Response(await readFile(join(planDir, "dist", "assets", filename)), {
            headers: {
              "cache-control": "public, max-age=31536000, immutable",
              "content-type": "font/woff2",
            },
          });
        }
        if (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/static-export.html") {
          const filename = url.pathname === "/static-export.html" ? "static-export.html" : "index.html";
          return new Response(await readFile(join(planDir, "dist", filename), "utf8"), { headers: { "content-type": "text/html; charset=utf-8" } });
        }
        if (url.pathname === "/plan-state.json") {
          const snapshot = await readReviewSnapshot(planDir);
          return Response.json(snapshot.state, { headers: { "x-muse-review-generation": snapshot.generation } });
        }
        if (url.pathname === "/comments.json") {
          const snapshot = await readReviewSnapshot(planDir);
          return Response.json(snapshot.comments, { headers: { "x-muse-review-generation": snapshot.generation } });
        }
        if (url.pathname === "/agent-handoff.json") {
          return new Response(await readPublishedArtifact(planDir, "agent-handoff.json"), { headers: { "content-type": "application/json; charset=utf-8" } });
        }
        if (url.pathname === "/agent-handoff.md") {
          return new Response(await readPublishedArtifact(planDir, "agent-handoff.md"), { headers: { "content-type": "text/markdown; charset=utf-8" } });
        }
        if (url.pathname === "/api/events" && request.method === "GET") {
          return eventStream(planDir, request.signal, lifecycleController.signal, (cleanup) => streamCleanups.add(cleanup));
        }
        if (url.pathname === "/api/wait" && request.method === "GET") {
          const since = url.searchParams.get("since") ?? "";
          try {
            const snapshot = await waitForReviewGeneration(planDir, since, {
              signal: AbortSignal.any([request.signal, lifecycleController.signal]),
              onParked: () => agentWaitParked(planDir),
              onDelivered: () => agentWaitDelivered(planDir),
              onCancelled: () => agentWaitCancelled(planDir),
            });
            return Response.json({
              generation: snapshot.generation,
              state: snapshot.state,
              comments: snapshot.comments,
            }, { headers: { "x-muse-review-generation": snapshot.generation } });
          } catch (error) {
            if (error instanceof ReviewWaiterLimitError) {
              return new Response(error.message, { status: 503 });
            }
            if (request.signal.aborted || lifecycleController.signal.aborted) {
              return new Response(null, { status: 204 });
            }
            throw error;
          }
        }
        if (url.pathname.startsWith("/api/") && request.method === "POST") {
          requireMutationRequest(request, url, server.port ?? port);
        }
        if (url.pathname === "/api/state" && request.method === "POST") {
          const body = await json(request);
          if (body && typeof body === "object" && !Array.isArray(body)) {
            const candidate = body as Record<string, unknown>;
            if (candidate.status === "approved" || "approvedAt" in candidate || "reviewer" in candidate || "approvalDigest" in candidate) {
              throw new Response("Approval status and metadata can only be set through /api/approve", { status: 409 });
            }
          }
          const errors = validateReviewStatePatch(body);
          if (errors.length) throw new Response(errors.join("\n"), { status: 400 });
          return Response.json(await updateReviewState(planDir, body));
        }
        if (url.pathname === "/api/comments" && request.method === "POST") {
          const body = validateCommentBody(jsonObject(await json(request)), request.headers.get("idempotency-key"));
          if (body.mode === "resolve") return Response.json(await resolveComment(planDir, body.resolveId));
          return Response.json(await addComment(planDir, {
            id: body.id,
            blockId: body.blockId,
            anchor: body.anchor,
            body: body.body,
          }));
        }
        if (url.pathname === "/api/approve" && request.method === "POST") {
          const body = jsonObject(await json(request));
          const keys = Object.keys(body);
          const reviewer = body.reviewer;
          if (
            keys.some((key) => key !== "reviewer")
            || keys.length > 1
            || (reviewer !== undefined && (typeof reviewer !== "string" || reviewer.trim().length === 0))
          ) {
            return new Response("Approval body must be exactly {} or { reviewer: nonblank string }", { status: 400 });
          }
          return Response.json(await approvePlan(planDir, reviewer));
        }
        return new Response("Not found", { status: 404 });
      } catch (error) {
        if (error instanceof Response) return error;
        if (error instanceof ReviewOperationError) {
          const status = error.failure === "not_found" ? 404 : error.failure === "conflict" ? 409 : 422;
          return new Response(error.message, { status });
        }
        return new Response(error instanceof Error ? error.message : String(error), { status: 500 });
      }
    },
  });
  const originalStop = server.stop.bind(server);
  let stopped = false;
  const stop = (closeActiveConnections = true) => {
    if (!stopped) {
      stopped = true;
      lifecycleController.abort();
      for (const cleanup of streamCleanups) cleanup();
      streamCleanups.clear();
    }
    return originalStop(closeActiveConnections);
  };
  server.stop = stop;
  const stopOnAbort = () => stop(true);
  signal?.addEventListener("abort", stopOnAbort, { once: true });
  if (signal?.aborted) {
    stopOnAbort();
    signal.throwIfAborted();
  }
  return server;
}

if (import.meta.main) {
  const dir = process.argv[2];
  const port = Number(process.argv[3] ?? 7374);
  if (!dir) throw new Error("Usage: bun server.ts <plan-dir> [port]");
  const server = await servePlan(dir, port);
  console.log(`Muse plan review: http://localhost:${server.port}/`);
}
