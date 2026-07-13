import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderPlanFolder } from "./render";
import { addComment, approvePlan, readComments, readPublishedArtifact, readReviewState, resolveComment, updateReviewState } from "./state-store";

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
        if (url.pathname === "/api/state" && request.method === "POST") {
          return Response.json(await updateReviewState(planDir, await json(request)));
        }
        if (url.pathname === "/api/comments" && request.method === "POST") {
          const body = jsonObject(await json(request));
          if (body.resolveId) return Response.json(await resolveComment(planDir, String(body.resolveId)));
          if (!body.blockId || !body.body) return new Response("blockId and body are required", { status: 400 });
          return Response.json(await addComment(planDir, { blockId: String(body.blockId), anchor: body.anchor ? String(body.anchor) : undefined, body: String(body.body) }));
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
