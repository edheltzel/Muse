import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import * as fs from "node:fs/promises";
import { chmod, cp, mkdtemp, readFile, readdir, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { servePlan } from "../plugins/Muse/skills/muse/tools/interactive-plan/server.ts";
import {
  addComment,
  approvePlan,
  readComments,
  readReviewState,
  resolveComment,
  updateReviewState,
} from "../plugins/Muse/skills/muse/tools/interactive-plan/state-store.ts";

const repoRoot = join(import.meta.dir, "..");
const fixturesRoot = join(repoRoot, "tests", "fixtures", "interactive-plans");

afterEach(() => {
  mock.restore();
});

async function copyFixture(name: string): Promise<string> {
  const planDir = await mkdtemp(join(tmpdir(), `ve-ip-${name}-`));
  await cp(join(fixturesRoot, name), planDir, { recursive: true });
  return planDir;
}

async function withFixture<T>(name: string, run: (planDir: string) => Promise<T>): Promise<T> {
  const planDir = await copyFixture(name);
  try {
    return await run(planDir);
  } finally {
    await rm(planDir, { recursive: true, force: true });
  }
}

function expectNoForbiddenRuntimeReferences(html: string): void {
  expect(html).not.toContain("@agent-native/");
  expect(html).not.toMatch(/\bAgent Native\b/);
  expect(html).not.toMatch(/\breact\b/i);
  expect(html).not.toMatch(/\breact-dom\b/i);
}

describe("interactive plan MDX loading", () => {
  test("loads every checked-in fixture through schema validation", async () => {
    const fixtureExpectations = [
      { name: "minimal-plan", kind: "plan", slug: "minimal-plan", blockIds: ["summary", "decisions", "flow", "files", "questions", "checks", "approval"], hasCanvas: false },
      { name: "recap-with-diff", kind: "recap", slug: "recap-with-diff", blockIds: ["summary", "files", "diffs", "approval"], hasCanvas: false },
      { name: "ui-plan-with-canvas", kind: "plan", slug: "ui-plan-with-canvas", blockIds: ["summary", "before-after", "approval"], hasCanvas: true },
      {
        name: "component-library-showcase",
        kind: "styleguide",
        slug: "component-library-showcase",
        blockIds: [
          "summary",
          "status",
          "design-principle",
          "decisions",
          "flow",
          "timeline",
          "risks",
          "file-map",
          "file-tree",
          "code",
          "diffs",
          "api",
          "data-model",
          "before-after",
          "wireframe",
          "states",
          "component-table",
          "questions",
          "checks",
          "approval",
          "component-anchor",
        ],
        hasCanvas: true,
      },
    ] as const;

    for (const fixture of fixtureExpectations) {
      const plan = await loadPlanFolder(join(fixturesRoot, fixture.name));
      expect(plan.manifest.kind).toBe(fixture.kind);
      expect(plan.manifest.slug).toBe(fixture.slug);
      expect(plan.manifest.localOnly).toBe(true);
      expect(plan.plan.blocks.map((block) => block.id)).toEqual([...fixture.blockIds]);
      expect(Boolean(plan.canvas)).toBe(fixture.hasCanvas);
    }
  });

  test("rejects unknown MDX components and duplicate component ids before rendering", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-invalid-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `---\ntitle: Invalid Plan\nslug: invalid-plan\n---\n\n<PlanSummary id="summary" title="Summary">\nValid block.\n</PlanSummary>\n\n<UnknownWidget id="mystery" />\n\n<Checklist id="summary" title="Duplicate">\nconfirm | Confirm the plan\n</Checklist>\n`);

      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("Invalid plan source");
      expect(message).toContain("Unknown MDX component 'UnknownWidget' at block 'mystery'");
      expect(message).toContain("Duplicate MDX component id 'summary'");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });
});

describe("interactive plan rendering", () => {
  test("renders the minimal fixture to interactive and static HTML with review chrome", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
      const indexHtml = await readFile(indexPath, "utf8");
      const staticHtml = await readFile(staticExportPath, "utf8");

      expect(indexPath.endsWith(join("dist", "index.html"))).toBe(true);
      expect(staticExportPath.endsWith(join("dist", "static-export.html"))).toBe(true);

      expect(indexHtml).toContain("Minimal Interactive Plan");
      expect(indexHtml).toContain("Muse interactive plan");
      expect(indexHtml).toContain("data-block-type=\"PlanSummary\"");
      expect(indexHtml).toContain("class=\"ve-ip-block ve-ip-hero\"");
      expect(indexHtml).toContain("data-theme-toggle");
      expect(indexHtml).toContain("data-plan-questions");
      expect(indexHtml).toContain("data-checklist-id=\"schema\"");
      expect(indexHtml).toContain("data-approve-plan");
      expect(indexHtml).toContain("class=\"mermaid-wrap\"");
      expect(indexHtml).toContain("class=\"mermaid-canvas\"");
      expect(indexHtml).toContain("mermaid.min.js");
      expect(indexHtml).toContain("postJson(\"/api/state\"");

      expect(staticHtml).toContain("Static export. Interactive persistence requires the local review bridge.");
      expect(staticHtml).toContain("Static export: copy this page with the generated handoff packet.");
      expect(staticHtml).not.toContain("postJson(\"/api/state\"");
      expect(staticHtml).toContain("data-theme-toggle");
      expect(staticHtml).toContain("mermaid.min.js");

      expectNoForbiddenRuntimeReferences(indexHtml);
      expectNoForbiddenRuntimeReferences(staticHtml);
    });
  });
});

describe("interactive plan review state and handoff", () => {
  async function setReadinessPolicy(planDir: string): Promise<void> {
    const path = join(planDir, "plan.mdx");
    const source = await readFile(path, "utf8");
    await writeFile(
      path,
      source
        .replace("runtime | Which lightweight runtime should U2 choose? | freeform", "runtime | Which lightweight runtime should U2 choose? | freeform | required")
        .replace("schema | Schema validates", "schema | Schema validates | required")
        .replace("render | HTML renders", "render | HTML renders | advisory"),
    );
  }

  async function post(server: { port: number | undefined }, path: string, body: Record<string, unknown>): Promise<Response> {
    if (server.port === undefined) throw new Error("Test server did not bind a port");
    return fetch(`http://localhost:${server.port}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function temporaryPublicationEntries(planDir: string): Promise<string[]> {
    const store = join(planDir, ".muse-review");
    const bundles = await readdir(join(store, "bundles"));
    const entries = await readdir(store);
    return [...bundles, ...entries].filter((entry) => entry.endsWith(".staging") || entry.endsWith(".pointer") || entry.includes(".restore"));
  }

  test("persists review values and treats durable open comments as authoritative", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await updateReviewState(planDir, {
        answers: { runtime: "Use the local Vite Plus bridge with Bun." },
        checklist: { schema: true, render: true },
        unresolvedCommentIds: ["stale-cache-entry"],
      });
      expect((await readReviewState(planDir)).unresolvedCommentIds).toEqual([]);

      const comment = await addComment(planDir, {
        id: "c-review-scope",
        blockId: "summary",
        body: "Clarify whether approval is local-only before handoff.",
      });
      expect(comment.status).toBe("open");
      expect((await readReviewState(planDir)).unresolvedCommentIds).toEqual(["c-review-scope"]);
      await expect(approvePlan(planDir, "tester")).rejects.toThrow(/unresolved blocking comments/i);

      const resolvedComments = await resolveComment(planDir, "c-review-scope");
      expect(resolvedComments[0]).toMatchObject({ id: "c-review-scope", status: "resolved" });
      expect(await readComments(planDir)).toEqual(resolvedComments);
      expect((await readReviewState(planDir)).unresolvedCommentIds).toEqual([]);
    });
  });

  test("serializes state mutations across processes without losing either revision", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const worker = join(repoRoot, "tests", "helpers", "review-state-writer.ts");
      const first = Bun.spawn([process.execPath, worker, planDir, "first", "one"], { cwd: repoRoot, stderr: "pipe" });
      const second = Bun.spawn([process.execPath, worker, planDir, "second", "two"], { cwd: repoRoot, stderr: "pipe" });
      const exitCodes = await Promise.all([first.exited, second.exited]);
      if (exitCodes[0] !== 0) throw new Error(await new Response(first.stderr).text());
      if (exitCodes[1] !== 0) throw new Error(await new Response(second.stderr).text());

      expect((await readReviewState(planDir)).answers).toMatchObject({ first: "one", second: "two" });
    });
  });

  test("validates required, advisory, omitted, scalar, array, checklist, and canvas readiness", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await writeFile(join(planDir, "canvas.mdx"), `<QuestionForm id="canvas-questions">\ncanvas-owner | Who owns the canvas? | freeform | required\n</QuestionForm>`);
      await updateReviewState(planDir, {
        answers: { runtime: [" "], "canvas-owner": " " },
        checklist: { schema: false, render: false },
      });

      await expect(approvePlan(planDir, "tester")).rejects.toThrow(/^(?=[\s\S]*runtime)(?=[\s\S]*schema)(?=[\s\S]*canvas-owner)/);
      await updateReviewState(planDir, {
        answers: { runtime: [" ", "Use Bun."], "canvas-owner": "Design team" },
        checklist: { schema: true },
      });
      const handoff = await approvePlan(planDir, "tester");

      expect(handoff.answers.runtime).toEqual([" ", "Use Bun."]);
      expect(await readReviewState(planDir)).toMatchObject({ status: "approved", reviewer: "tester" });
      expect(JSON.parse(await readFile(join(planDir, "agent-handoff.json"), "utf8"))).toEqual(handoff);
      expect(await readFile(join(planDir, "agent-handoff.md"), "utf8")).toContain(`Approved: ${handoff.approvedAt}`);
    });

    await withFixture("minimal-plan", async (planDir) => {
      const handoff = await approvePlan(planDir, "implicit-advisory");
      expect(handoff.status).toBe("approved");
    });
  });

  test("rejects malformed readiness grammar, blank or duplicate IDs, and invalid runtime values", async () => {
    const invalidLines = [
      "runtime | Prompt | required",
      "runtime | Prompt | freeform |",
      "runtime | Prompt | freeform | required | trailing",
      " | Prompt | freeform | required",
    ];
    for (const line of invalidLines) {
      await withFixture("minimal-plan", async (planDir) => {
        const path = join(planDir, "plan.mdx");
        const source = await readFile(path, "utf8");
        await writeFile(path, source.replace("runtime | Which lightweight runtime should U2 choose? | freeform", line));
        await expect(loadPlanFolder(planDir)).rejects.toThrow(/invalid|blank|required field|field count|mode field/i);
      });
    }

    await withFixture("minimal-plan", async (planDir) => {
      await writeFile(join(planDir, "canvas.mdx"), `<Checklist id="canvas-checks">\nschema | Duplicate across documents | required\n</Checklist>`);
      await expect(loadPlanFolder(planDir)).rejects.toThrow(/Duplicate readiness item id 'schema'/);
    });

    await withFixture("minimal-plan", async (planDir) => {
      await writeFile(join(planDir, "plan-state.json"), JSON.stringify({
        status: "in_review",
        answers: { runtime: ["valid", 42] },
        checklist: {},
        unresolvedCommentIds: [],
      }));
      await expect(readReviewState(planDir)).rejects.toThrow(/string or string array/);
    });
  });

  test("migrates missing and mixed legacy artifacts fail-closed behind compatibility paths", async () => {
    for (const existingArtifact of [undefined, "agent-handoff.json", "agent-handoff.md", "both"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        await writeFile(join(planDir, "plan-state.json"), JSON.stringify({
          status: "approved",
          approvedAt: "2026-07-01T12:00:00.000Z",
          reviewer: "legacy",
          answers: {},
          checklist: {},
          unresolvedCommentIds: [],
        }));
        if (existingArtifact === "both") {
          await writeFile(join(planDir, "agent-handoff.json"), "{}");
          await writeFile(join(planDir, "agent-handoff.md"), "# mismatched");
        } else if (existingArtifact) {
          await writeFile(join(planDir, existingArtifact), existingArtifact.endsWith(".json") ? "{}" : "# stale");
        }

        expect((await readReviewState(planDir)).status).toBe("needs_revision");
        expect(await Bun.file(join(planDir, "agent-handoff.json")).exists()).toBe(false);
        expect(await Bun.file(join(planDir, "agent-handoff.md")).exists()).toBe(false);
        expect(await readlink(join(planDir, "plan-state.json"))).toBe(".muse-review/current/plan-state.json");
        expect(await temporaryPublicationEntries(planDir)).toEqual([]);
      });
    }
  });

  test("uses one pointer commit and cleans write, partial-write, rename, cleanup, and permission faults", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const first = await approvePlan(planDir, "first-reviewer");
      const pointer = join(planDir, ".muse-review", "current");
      const committedPointer = await readlink(pointer);
      const committedState = await readReviewState(planDir);
      const originalWriteFile = fs.writeFile;
      const originalRename = fs.rename;
      const originalRm = fs.rm;

      for (const partial of [false, true]) {
        spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
          if (String(path).includes(".staging/agent-handoff.md")) {
            if (partial) await originalWriteFile(path, String(data).slice(0, 8), options);
            throw Object.assign(new Error(partial ? "partial write" : "write failure"), { code: partial ? "ENOSPC" : "EACCES" });
          }
          return originalWriteFile(path, data, options);
        });
        await expect(approvePlan(planDir, "faulted-reviewer")).rejects.toThrow(partial ? "partial write" : "write failure");
        expect(await readlink(pointer)).toBe(committedPointer);
        expect(await readReviewState(planDir)).toEqual(committedState);
        expect(await temporaryPublicationEntries(planDir)).toEqual([]);
        mock.restore();
      }

      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(to) === pointer) throw Object.assign(new Error("rename failure"), { code: "EACCES" });
        return originalRename(from, to);
      });
      await expect(approvePlan(planDir, "rename-fault")).rejects.toThrow("rename failure");
      expect(await readlink(pointer)).toBe(committedPointer);
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);
      mock.restore();

      spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
        if (String(path).includes(".staging/agent-handoff.md")) throw new Error("primary write failure");
        return originalWriteFile(path, data, options);
      });
      spyOn(fs, "rm").mockImplementation(async (path, options) => {
        if (String(path).endsWith(".staging")) throw new Error("cleanup failure");
        return originalRm(path, options);
      });
      await expect(approvePlan(planDir, "cleanup-fault")).rejects.toThrow("primary write failure");
      expect(await readlink(pointer)).toBe(committedPointer);
      mock.restore();
      await updateReviewState(planDir, { answers: { cleanup: "recovered" } });
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);

      const bundles = join(planDir, ".muse-review", "bundles");
      await chmod(bundles, 0o500);
      try {
        await expect(approvePlan(planDir, "permission-fault")).rejects.toThrow();
      } finally {
        await chmod(bundles, 0o700);
      }
      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      expect(first.status).toBe("approved");
    });
  });

  test("approval routes reject bypasses and blockers, agree on success, and serialize races", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await writeFile(join(planDir, "comments.json"), JSON.stringify([{
        id: "c-durable",
        blockId: "summary",
        body: "Durable blocker",
        status: "open",
        createdAt: "2026-07-01T12:00:00.000Z",
      }]));
      const server = await servePlan(planDir, 0);
      try {
        const bypass = await post(server, "/api/state", { status: "approved", approvedAt: "fake", reviewer: "attacker" });
        expect(bypass.ok).toBe(false);
        expect(await bypass.text()).toMatch(/only be set through \/api\/approve/i);

        const blocked = await post(server, "/api/approve", { reviewer: "tester" });
        expect(blocked.ok).toBe(false);
        expect(await blocked.text()).toMatch(/unresolved blocking comments/i);
        await post(server, "/api/comments", { resolveId: "c-durable" });

        const required = await post(server, "/api/approve", { reviewer: "tester" });
        expect(required.ok).toBe(false);
        expect(await required.text()).toMatch(/runtime|schema/i);

        const [stateResponse, racedApproval] = await Promise.all([
          post(server, "/api/state", { answers: { runtime: "Bun" }, checklist: { schema: true } }),
          post(server, "/api/approve", { reviewer: "raced-reviewer" }),
        ]);
        expect(stateResponse.ok).toBe(true);
        if (!racedApproval.ok) expect(await racedApproval.text()).toMatch(/runtime|schema/i);
        expect((await readReviewState(planDir)).answers.runtime).toBe("Bun");

        const approvedResponse = await post(server, "/api/approve", { reviewer: "final-reviewer" });
        expect(approvedResponse.ok).toBe(true);
        const approved = await approvedResponse.json();
        const routedState = await (await fetch(`http://localhost:${server.port}/plan-state.json`)).json();
        const routedJson = await (await fetch(`http://localhost:${server.port}/agent-handoff.json`)).json();
        const routedMarkdown = await (await fetch(`http://localhost:${server.port}/agent-handoff.md`)).text();
        expect(routedJson).toEqual(approved);
        expect(routedState.approvedAt).toBe(approved.approvedAt);
        expect(routedMarkdown).toContain(`Approved: ${approved.approvedAt}`);

        const committedPointer = await readlink(join(planDir, ".muse-review", "current"));
        const originalWriteFile = fs.writeFile;
        spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
          if (String(path).includes(".staging/agent-handoff.md")) throw new Error("route publication failure");
          return originalWriteFile(path, data, options);
        });
        const failedPublication = await post(server, "/api/approve", { reviewer: "faulted-route" });
        expect(failedPublication.ok).toBe(false);
        expect(await readlink(join(planDir, ".muse-review", "current"))).toBe(committedPointer);
        expect((await readReviewState(planDir)).approvedAt).toBe(approved.approvedAt);
        mock.restore();

        const reapprovedResponse = await post(server, "/api/approve", { reviewer: "second-reviewer" });
        expect(reapprovedResponse.ok).toBe(true);
        const reapproved = await reapprovedResponse.json();
        expect((await readReviewState(planDir))).toMatchObject({ approvedAt: reapproved.approvedAt, reviewer: "second-reviewer" });

        const concurrentApprovals = await Promise.all([
          post(server, "/api/approve", { reviewer: "concurrent-a" }),
          post(server, "/api/approve", { reviewer: "concurrent-b" }),
        ]);
        expect(concurrentApprovals.every((response) => response.ok)).toBe(true);
        const concurrentHandoffs = await Promise.all(concurrentApprovals.map((response) => response.json()));
        const finalHandoff = await (await fetch(`http://localhost:${server.port}/agent-handoff.json`)).json();
        expect(concurrentHandoffs).toContainEqual(finalHandoff);
        expect((await readReviewState(planDir)).approvedAt).toBe(finalHandoff.approvedAt);

        const [commentResponse] = await Promise.all([
          post(server, "/api/comments", { blockId: "summary", body: "Concurrent blocker" }),
          post(server, "/api/approve", { reviewer: "concurrent-reviewer" }),
        ]);
        expect(commentResponse.ok).toBe(true);
        expect((await readReviewState(planDir)).status).toBe("needs_revision");
        expect(await Bun.file(join(planDir, "agent-handoff.json")).exists()).toBe(false);
        expect(await Bun.file(join(planDir, "agent-handoff.md")).exists()).toBe(false);
      } finally {
        server.stop(true);
      }
    });
  });
});

describe("interactive command documentation contracts", () => {
  test("/generate-visual-plan documents MDX, local bridge review, and dependency boundaries", async () => {
    const doc = await readFile(join(repoRoot, "plugins", "Muse", "commands", "generate-visual-plan.md"), "utf8");

    expect(doc).toMatch(/interactive MDX visual implementation plan/i);
    expect(doc).toMatch(/plan\.mdx/);
    expect(doc).toMatch(/local review/i);
    expect(doc).toMatch(/local bridge|local review URL|server\.ts/i);
    expect(doc).toMatch(/Do not use Agent Native|No Agent Native/i);
    expect(doc).toMatch(/Do not add React|No React/i);
    expect(doc).toMatch(/React DOM/i);
    expect(doc).toMatch(/@agent-native\/\*/);
  });

  test("/visual-recap documents MDX recap artifacts, local rendering, and dependency boundaries", async () => {
    const doc = await readFile(join(repoRoot, "plugins", "Muse", "commands", "visual-recap.md"), "utf8");

    expect(doc).toMatch(/interactive Muse recap/i);
    expect(doc).toMatch(/plan\.mdx/);
    expect(doc).toMatch(/visual-explainer\.json/);
    expect(doc).toMatch(/Render and serve locally|interactive-plan tools|local/i);
    expect(doc).toMatch(/No Agent Native|Do not use Agent Native/i);
    expect(doc).toMatch(/No React|Do not add React/i);
    expect(doc).toMatch(/hosted Plan MCP/i);
  });
});
