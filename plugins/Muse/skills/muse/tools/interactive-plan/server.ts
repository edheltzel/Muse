import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderPlanFolder } from "./render";
import { addComment, approvePlan, readComments, readPublishedArtifact, readReviewState, resolveComment, ReviewOperationError, updateReviewState } from "./state-store";
import { validateReviewStatePatch } from "./schema";

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

export async function servePlan(planDir: string, port = 7374) {
  await renderPlanFolder(planDir);
  const server = Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url);
      try {
        if (url.pathname === "/" || url.pathname === "/index.html") {
          return new Response(await readFile(join(planDir, "dist", "index.html"), "utf8"), { headers: { "content-type": "text/html; charset=utf-8" } });
        }
        if (url.pathname === "/plan-state.json") {
          return Response.json(await readReviewState(planDir));
        }
        if (url.pathname === "/comments.json") {
          return Response.json(await readComments(planDir));
        }
        if (url.pathname === "/agent-handoff.json") {
          return new Response(await readPublishedArtifact(planDir, "agent-handoff.json"), { headers: { "content-type": "application/json; charset=utf-8" } });
        }
        if (url.pathname === "/agent-handoff.md") {
          return new Response(await readPublishedArtifact(planDir, "agent-handoff.md"), { headers: { "content-type": "text/markdown; charset=utf-8" } });
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
  return server;
}

if (import.meta.main) {
  const dir = process.argv[2];
  const port = Number(process.argv[3] ?? 7374);
  if (!dir) throw new Error("Usage: bun server.ts <plan-dir> [port]");
  const server = await servePlan(dir, port);
  console.log(`Muse plan review: http://localhost:${server.port}/`);
}
