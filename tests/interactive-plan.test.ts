import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import * as fs from "node:fs/promises";
import type { PathLike } from "node:fs";
import { chmod, cp, lstat, mkdtemp, readFile, readdir, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { decodeMarkdownText, encodeMarkdownText, formatAgentHandoffMarkdown, parseAgentHandoffMarkdown } from "../plugins/Muse/skills/muse/tools/interactive-plan/handoff.ts";
import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { acquirePlanLock } from "../plugins/Muse/skills/muse/tools/interactive-plan/plan-lock.ts";
import type { AgentHandoff, ReviewState } from "../plugins/Muse/skills/muse/tools/interactive-plan/schema.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { servePlan } from "../plugins/Muse/skills/muse/tools/interactive-plan/server.ts";
import {
  addComment,
  approvePlan,
  readComments,
  readPublishedArtifact,
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

  async function post(server: { port: number | undefined }, path: string, body: unknown): Promise<Response> {
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

  async function currentBundlePath(planDir: string): Promise<string> {
    const store = join(planDir, ".muse-review");
    return join(store, await readlink(join(store, "current")));
  }

  const canonicalId = "123e4567-e89b-42d3-a456-426614174000";

  async function replaceSymlink(path: string, target: string): Promise<void> {
    await rm(path);
    await fs.symlink(target, path);
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

  test("keeps an approved generation byte-identical across repeated and concurrent resolution", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const id = "c-idempotent-resolution";
      await addComment(planDir, { id, blockId: "summary", body: "Resolve once before approval." });
      const [resolved] = await resolveComment(planDir, id);
      const handoff = await approvePlan(planDir, "tester");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const committedTarget = await readlink(pointer);
      const bundle = join(store, committedTarget);
      const files = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"];
      const committedBytes = await Promise.all(files.map((file) => readFile(join(bundle, file))));

      const [first, second] = await Promise.all([
        resolveComment(planDir, id),
        resolveComment(planDir, id),
      ]);

      expect(first).toEqual(second);
      expect(first[0]?.resolvedAt).toBe(resolved.resolvedAt);
      expect(await readlink(pointer)).toBe(committedTarget);
      const currentBytes = await Promise.all(files.map((file) => readFile(join(bundle, file))));
      expect(currentBytes).toEqual(committedBytes);
      expect(await readReviewState(planDir)).toMatchObject({
        status: "approved",
        approvedAt: handoff.approvedAt,
        approvalDigest: handoff.approvalDigest,
      });
      expect(JSON.parse(await readPublishedArtifact(planDir, "agent-handoff.json"))).toEqual(handoff);
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

  test("rejects a semantically contradictory legacy handoff pair", async () => {
    let approvedState: ReviewState | undefined;
    let handoffJson = "";
    let handoffMarkdown = "";
    await withFixture("minimal-plan", async (sourceDir) => {
      await approvePlan(sourceDir, "source-reviewer");
      approvedState = await readReviewState(sourceDir);
      handoffJson = await readFile(join(sourceDir, "agent-handoff.json"), "utf8");
      handoffMarkdown = `${await readFile(join(sourceDir, "agent-handoff.md"), "utf8")}\nContradictory trailing approval claim.\n`;
    });

    await withFixture("minimal-plan", async (planDir) => {
      await writeFile(join(planDir, "plan-state.json"), JSON.stringify(approvedState));
      await writeFile(join(planDir, "agent-handoff.json"), handoffJson);
      await writeFile(join(planDir, "agent-handoff.md"), handoffMarkdown);
      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
      await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow();
    });
  });

  test("restores every legacy root path when compatibility installation fails", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const legacyState = `${JSON.stringify({ status: "in_review", answers: {}, checklist: {}, unresolvedCommentIds: [] }, null, 2)}\n`;
      const legacyComments = "[]\n";
      await writeFile(join(planDir, "plan-state.json"), legacyState);
      await writeFile(join(planDir, "comments.json"), legacyComments);
      const originalRename = fs.rename;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(to) === join(planDir, "comments.json")) throw new Error("compatibility rename failure");
        return originalRename(from, to);
      });

      await expect(readReviewState(planDir)).rejects.toThrow("compatibility rename failure");
      expect((await lstat(join(planDir, "plan-state.json"))).isFile()).toBe(true);
      expect((await lstat(join(planDir, "comments.json"))).isFile()).toBe(true);
      expect(await readFile(join(planDir, "plan-state.json"), "utf8")).toBe(legacyState);
      expect(await readFile(join(planDir, "comments.json"), "utf8")).toBe(legacyComments);
    });
  });

  test("retries failed compatibility migration from the latest legacy bytes", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      await writeFile(statePath, `${JSON.stringify({
        status: "in_review",
        answers: { operator: "before failure" },
        checklist: {},
        unresolvedCommentIds: [],
      }, null, 2)}\n`);
      await writeFile(join(planDir, "comments.json"), "[]\n");
      const originalRename = fs.rename;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(to) === join(planDir, "comments.json")) throw new Error("compatibility rename failure");
        return originalRename(from, to);
      });

      await expect(readReviewState(planDir)).rejects.toThrow("compatibility rename failure");
      mock.restore();
      await writeFile(statePath, `${JSON.stringify({
        status: "in_review",
        answers: { operator: "latest edit" },
        checklist: {},
        unresolvedCommentIds: [],
      }, null, 2)}\n`);

      expect((await readReviewState(planDir)).answers.operator).toBe("latest edit");
    });
  });

  test("abandons and retries a migration candidate when legacy bytes change before replacement", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      const state = {
        status: "in_review",
        answers: { operator: "captured" },
        checklist: {},
        unresolvedCommentIds: [],
      };
      await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
      await writeFile(join(planDir, "comments.json"), "[]\n");
      const originalSymlink = fs.symlink;
      let raced = false;
      spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
        const result = await originalSymlink(target, path, type);
        if (!raced && String(path).includes(".plan-state.json.") && String(path).endsWith(".link")) {
          raced = true;
          await writeFile(statePath, `${JSON.stringify({ ...state, answers: { operator: "concurrent edit" } }, null, 2)}\n`);
        }
        return result;
      });

      expect((await readReviewState(planDir)).answers.operator).toBe("concurrent edit");
      expect(await readlink(statePath)).toBe(".muse-review/current/plan-state.json");
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);
    });
  });

  test("rejects a missing current handoff half before serving state or artifacts", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const current = join(planDir, ".muse-review", "current");
      await rm(join(planDir, ".muse-review", await readlink(current), "agent-handoff.md"));

      await expect(readReviewState(planDir)).rejects.toThrow(/coherent|handoff/i);
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
      await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow();
    });
  });

  test("removes a completed bundle left unreachable by failed pointer publication", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      await readReviewState(planDir);
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const currentIdentity = (await readlink(pointer)).split("/").at(-1);
      if (!currentIdentity) throw new Error("Current bundle identity is missing");
      const originalRename = fs.rename;
      const originalRm = fs.rm;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(to) === pointer) throw new Error("pointer failure");
        return originalRename(from, to);
      });
      spyOn(fs, "rm").mockImplementation(async (path, options) => {
        if (String(path).includes("/bundles/") && !String(path).endsWith(".staging") && !String(path).endsWith(String(currentIdentity))) {
          throw new Error("bundle cleanup failure");
        }
        return originalRm(path, options);
      });

      await expect(approvePlan(planDir, "faulted")).rejects.toThrow("pointer failure");
      expect((await readdir(join(store, "bundles"))).length).toBeGreaterThan(1);
      mock.restore();
      await readReviewState(planDir);
      expect(await readdir(join(store, "bundles"))).toEqual([currentIdentity]);
    });
  });

  test("rejects noncanonical current targets before cleanup without touching bundles", async () => {
    const invalidTargets = [
      "bundles/..",
      "../bundles/123e4567-e89b-42d3-a456-426614174000",
      "/tmp/123e4567-e89b-42d3-a456-426614174000",
      "bundles/123e4567-e89b-42d3-a456-426614174000/extra",
      "bundles/123e4567-e89b-42d3-a456-426614174000.json",
      "bundles/not-a-generated-id",
    ];
    for (const target of invalidTargets) {
      await withFixture("minimal-plan", async (planDir) => {
        await approvePlan(planDir, "tester");
        const store = join(planDir, ".muse-review");
        const current = join(store, "current");
        const bundlesBefore = await readdir(join(store, "bundles"));
        await replaceSymlink(current, target);

        await expect(readReviewState(planDir)).rejects.toThrow(/Invalid current review bundle target/);
        expect(await readlink(current)).toBe(target);
        expect(await readdir(join(store, "bundles"))).toEqual(bundlesBefore);
      });
    }
  });

  test("rejects symlinked bundle members before reading them", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const bundle = await currentBundlePath(planDir);
      const outside = join(planDir, "outside-state.json");
      await writeFile(outside, "{}");
      await rm(join(bundle, "plan-state.json"));
      await fs.symlink(outside, join(bundle, "plan-state.json"));

      await expect(readReviewState(planDir)).rejects.toThrow(/regular non-symlink|regular file/i);
      expect(await readFile(outside, "utf8")).toBe("{}");
    });
  });

  test("rejects symlinked review-store ancestors without touching external sentinels", async () => {
    for (const ancestor of ["store", "bundles"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        const external = await mkdtemp(join(tmpdir(), "ve-ip-external-store-"));
        const sentinel = join(external, "sentinel.txt");
        try {
          await writeFile(sentinel, "operator-owned\n");
          if (ancestor === "store") {
            await fs.symlink(external, join(planDir, ".muse-review"));
          } else {
            await readReviewState(planDir);
            const bundles = join(planDir, ".muse-review", "bundles");
            await rm(bundles, { recursive: true });
            await fs.symlink(external, bundles);
          }

          await expect(readReviewState(planDir)).rejects.toThrow(/non-symlink|bundles root|review store/i);
          expect(await readFile(sentinel, "utf8")).toBe("operator-owned\n");
        } finally {
          await rm(external, { recursive: true, force: true });
        }
      });
    }
  });

  test("rejects in-place bundle member mutation observed through retained handles", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await updateReviewState(planDir, { answers: { race: "A" } });
      const bundle = await currentBundlePath(planDir);
      const state = join(bundle, "plan-state.json");
      const originalOpen = fs.open;
      const originalWriteFile = fs.writeFile;
      let mutated = false;
      spyOn(fs, "open").mockImplementation(async (path, flags, mode) => {
        const handle = await originalOpen(path, flags, mode);
        if (!mutated && String(path).endsWith("/comments.json")) {
          const originalHandleReadFile = handle.readFile.bind(handle);
          spyOn(handle, "readFile").mockImplementation((async (options?: unknown) => {
            const result = await originalHandleReadFile(options as never);
            mutated = true;
            const source = await readFile(state, "utf8");
            await originalWriteFile(state, source.replace('"A"', '"B"'));
            await fs.utimes(state, new Date(0), new Date(0));
            return result;
          }) as typeof handle.readFile);
        }
        return handle;
      });

      const error = await readReviewState(planDir).then(() => undefined, (reason) => reason);
      expect(mutated).toBe(true);
      expect(String(error)).toMatch(/member 'plan-state\.json' changed/i);
    });
  });

  test("fails closed when initialized pointers, core files, or compatibility paths are replaced", async () => {
    for (const missingFile of ["plan-state.json", "comments.json"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        await approvePlan(planDir, "tester");
        await rm(join(await currentBundlePath(planDir), missingFile));
        await expect(readReviewState(planDir)).rejects.toThrow(new RegExp(`missing ${missingFile}`, "i"));
      });
    }

    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const current = join(planDir, ".muse-review", "current");
      await rm(current);
      await expect(readReviewState(planDir)).rejects.toThrow();
      expect((await readdir(join(planDir, ".muse-review", "bundles"))).length).toBeGreaterThan(0);
    });

    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const current = join(planDir, ".muse-review", "current");
      await rm(current);
      await fs.symlink(join("bundles", "missing-generation"), current);
      await expect(readReviewState(planDir)).rejects.toThrow();
    });

    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const compatibilityState = join(planDir, "plan-state.json");
      await rm(compatibilityState);
      await writeFile(compatibilityState, "operator-owned regular file\n");
      await expect(updateReviewState(planDir, { answers: { unsafe: "change" } })).rejects.toThrow(/compatibility paths/i);
      expect(await readFile(compatibilityState, "utf8")).toBe("operator-owned regular file\n");
    });
  });

  test("enforces unique collision-safe comment identities and unambiguous resolution", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const first = await addComment(planDir, { blockId: "summary", body: "First" });
      const second = await addComment(planDir, { blockId: "summary", body: "Second" });
      expect(first.id).not.toBe(second.id);
      expect(first.id).toMatch(/^c-[0-9a-f-]+$/);
      await expect(addComment(planDir, { id: first.id, blockId: "summary", body: "Duplicate" })).rejects.toThrow(/Duplicate comment id/);
      await expect(resolveComment(planDir, "missing-comment")).rejects.toThrow(/Unknown or ambiguous comment id/);
    });

    await withFixture("minimal-plan", async (planDir) => {
      const duplicate = {
        id: "same-id",
        blockId: "summary",
        body: "Duplicate",
        status: "open",
        createdAt: "2026-07-01T12:00:00.000Z",
      };
      await writeFile(join(planDir, "comments.json"), JSON.stringify([duplicate, duplicate]));
      await expect(readComments(planDir)).rejects.toThrow(/unique nonblank ids/i);
    });
  });

  test("strictly validates manifest paths, scalar types, enums, arrays, and unknown fields", async () => {
    const invalidManifests: Record<string, unknown>[] = [
      { kind: "unknown" },
      { source: ["valid", 42] },
      { slug: "two\nlines" },
      { title: "two\nlines" },
      { entry: "../outside.mdx" },
      { entry: "/absolute/plan.mdx" },
      { unexpected: true },
    ];
    for (const patch of invalidManifests) {
      await withFixture("minimal-plan", async (planDir) => {
        const path = join(planDir, "visual-explainer.json");
        const manifest = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
        await writeFile(path, JSON.stringify({ ...manifest, ...patch }));
        await expect(loadPlanFolder(planDir)).rejects.toThrow(/manifest|kind|source|slug|title|entry|unknown/i);
      });
    }
  });

  test("rejects unknown comment fields and incoherent resolution timestamps", async () => {
    const base = {
      id: "c-invalid",
      blockId: "summary",
      body: "Invalid persisted comment",
      status: "open",
      createdAt: "2026-07-01T12:00:00.000Z",
    };
    const invalidComments = [
      { ...base, unexpected: true },
      { ...base, resolvedAt: "2026-07-01T12:01:00.000Z" },
      { ...base, status: "resolved" },
      { ...base, status: "resolved", resolvedAt: "not-a-date" },
      { ...base, createdAt: "not-a-date" },
    ];
    for (const comment of invalidComments) {
      await withFixture("minimal-plan", async (planDir) => {
        await writeFile(join(planDir, "comments.json"), JSON.stringify([comment]));
        await expect(readComments(planDir)).rejects.toThrow(/comment|timestamp|resolved|unknown/i);
      });
    }
  });

  test("validates canonical handoff plan identity and nested runtime fields", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const handoff = await approvePlan(planDir, "tester");
      const state = await readReviewState(planDir);
      const malformed = { ...handoff, approvedScope: [42] } as unknown as AgentHandoff;
      const bundle = await currentBundlePath(planDir);
      await writeFile(join(bundle, "agent-handoff.json"), `${JSON.stringify(malformed, null, 2)}\n`);
      await writeFile(join(bundle, "agent-handoff.md"), formatAgentHandoffMarkdown(malformed));
      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
      expect(state.status).toBe("approved");
    });

    let sourceState: ReviewState | undefined;
    let wrongIdentity: AgentHandoff | undefined;
    await withFixture("minimal-plan", async (sourceDir) => {
      const handoff = await approvePlan(sourceDir, "tester");
      sourceState = await readReviewState(sourceDir);
      wrongIdentity = { ...handoff, planSlug: "wrong-plan" };
    });
    await withFixture("minimal-plan", async (planDir) => {
      await writeFile(join(planDir, "plan-state.json"), JSON.stringify(sourceState));
      await writeFile(join(planDir, "agent-handoff.json"), JSON.stringify(wrongIdentity));
      await writeFile(join(planDir, "agent-handoff.md"), formatAgentHandoffMarkdown(wrongIdentity!));
      expect((await readReviewState(planDir)).status).toBe("needs_revision");
    });
  });

  test("round-trips every handoff field through injective structural-safe Markdown", () => {
    const handoff: AgentHandoff = {
      status: "approved",
      planSlug: "safe\n## Forged",
      planPath: "/tmp/plan\rStatus: rejected",
      approvedAt: "2026-07-01T12:00:00.000Z",
      approvedScope: ["Scope\u0000entry"],
      decisions: ["<script>unsafe</script>"],
      answers: { "\\u000a": ["line\nbreak"] },
      implementationEntry: "/tmp/implementation\n## Forged",
      approvalDigest: "a".repeat(64),
      verification: [],
      openRisks: [],
    };

    const markdown = formatAgentHandoffMarkdown(handoff);

    expect(parseAgentHandoffMarkdown(markdown)).toEqual(handoff);
    expect(markdown).toContain(`Implementation-Entry: ${encodeMarkdownText(handoff.implementationEntry)}`);
    expect(markdown).toContain(`Approval-Digest: ${handoff.approvalDigest}`);
    expect(markdown).not.toContain("\n## Forged");
    expect(markdown).not.toContain("<script>");
    expect(encodeMarkdownText("\n")).not.toBe(encodeMarkdownText("\\u000a"));
    expect(decodeMarkdownText(encodeMarkdownText("\\u000a\n"))).toBe("\\u000a\n");
  });

  test("revalidates approved state against current plan and canonical handoff content", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const original = await approvePlan(planDir, "tester");
      const path = join(planDir, "plan.mdx");
      const source = await readFile(path, "utf8");
      await writeFile(path, source.replace("Use local MDX", "Use a changed rendering policy"));

      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
      await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow();
      expect(original.status).toBe("approved");
    });

    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      await setReadinessPolicy(planDir);

      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
    });
  });

  test("rejects unknown, malformed, and incoherent persisted approval metadata", async () => {
    const invalidStates = [
      {
        status: "approved",
        approvedAt: "not-an-iso-date",
        reviewer: "tester",
        answers: {},
        checklist: {},
        unresolvedCommentIds: [],
      },
      {
        status: "approved",
        approvedAt: "2026-07-01T12:00:00.000Z",
        reviewer: " ",
        answers: {},
        checklist: {},
        unresolvedCommentIds: [],
      },
      {
        status: "in_review",
        approvedAt: "2026-07-01T12:00:00.000Z",
        reviewer: "stale-reviewer",
        answers: {},
        checklist: {},
        unresolvedCommentIds: [],
      },
      {
        status: "draft",
        answers: {},
        checklist: {},
        unresolvedCommentIds: [],
        unexpected: true,
      },
    ];

    for (const state of invalidStates) {
      await withFixture("minimal-plan", async (planDir) => {
        await writeFile(join(planDir, "plan-state.json"), JSON.stringify(state));
        await expect(readReviewState(planDir)).rejects.toThrow(/unknown|approvedAt|reviewer|metadata|approved/i);
      });
    }
  });

  test("serializes OS-backed locks without renaming or deleting a successor pathname", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const lockPath = join(planDir, ".muse-review.lock");
      const originalRename = fs.rename;
      const originalRm = fs.rm;
      const destructiveLockOperations: string[] = [];
      const originalOpen = fs.open;
      let openCount = 0;
      let expectedAttempt = 2;
      let attemptGate = Promise.withResolvers<void>();
      spyOn(fs, "open").mockImplementation((async (path: PathLike, flags: string | number, mode?: number) => {
        const handle = await originalOpen(path, flags, mode);
        if (String(path).endsWith("/.muse-review.lock") && ++openCount >= expectedAttempt) attemptGate.resolve();
        return handle;
      }) as typeof fs.open);
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(from) === lockPath || String(to) === lockPath) destructiveLockOperations.push("rename");
        return originalRename(from, to);
      });
      spyOn(fs, "rm").mockImplementation(async (path, options) => {
        if (String(path) === lockPath) destructiveLockOperations.push("remove");
        return originalRm(path, options);
      });

      const first = await acquirePlanLock(planDir);
      let secondAcquired = false;
      const secondPending = acquirePlanLock(planDir).then((lock) => {
        secondAcquired = true;
        return lock;
      });
      await attemptGate.promise;
      expect(secondAcquired).toBe(false);
      await first.release();
      const second = await secondPending;
      await first.release();

      let thirdAcquired = false;
      expectedAttempt = openCount + 1;
      attemptGate = Promise.withResolvers<void>();
      const thirdPending = acquirePlanLock(planDir).then((lock) => {
        thirdAcquired = true;
        return lock;
      });
      await attemptGate.promise;
      expect(thirdAcquired).toBe(false);
      await second.release();
      const third = await thirdPending;
      await third.release();

      expect((await lstat(lockPath)).isFile()).toBe(true);
      expect(destructiveLockOperations).toEqual([]);
    });
  });

  test("rejects a symlinked lock path without touching its target", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const externalDir = await mkdtemp(join(tmpdir(), "ve-ip-external-lock-"));
      const external = join(externalDir, "owner");
      const lockPath = join(planDir, ".muse-review.lock");
      try {
        await writeFile(external, "operator-owned\n");
        await fs.symlink(external, lockPath);

        await expect(acquirePlanLock(planDir)).rejects.toThrow();
        expect(await readFile(external, "utf8")).toBe("operator-owned\n");
        expect(await readlink(lockPath)).toBe(external);
      } finally {
        await rm(externalDir, { recursive: true, force: true });
      }
    });
  });

  test("recovers the OS lock when its owning process exits", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const owner = Bun.spawn([process.execPath, join(repoRoot, "tests", "helpers", "review-lock-owner.ts"), planDir], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      const ready = await owner.stdout.getReader().read();
      expect(new TextDecoder().decode(ready.value)).toContain("ready");
      owner.kill();
      await owner.exited;

      const successor = await acquirePlanLock(planDir);
      await successor.release();
      expect((await lstat(join(planDir, ".muse-review.lock"))).isFile()).toBe(true);
    });
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

  test("returns committed approval when post-pointer bundle cleanup is deferred", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first-reviewer");
      const originalRm = fs.rm;
      let failed = false;
      spyOn(fs, "rm").mockImplementation(async (path, options) => {
        if (!failed && String(path).includes("/bundles/") && !String(path).endsWith(".staging")) {
          failed = true;
          throw new Error("post-commit cleanup failure");
        }
        return originalRm(path, options);
      });
      const warning = spyOn(console, "warn").mockImplementation(() => undefined);

      const handoff = await approvePlan(planDir, "committed-reviewer");

      expect(handoff.status).toBe("approved");
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("Approval committed; deferred review-store cleanup"));
      expect((await readReviewState(planDir)).reviewer).toBe("committed-reviewer");
      mock.restore();
      await readReviewState(planDir);
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);
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
        const malformedPatches = [
          [],
          "string-patch",
          null,
          42,
          { answers: ["array-smuggled"] },
          { answers: "string-smuggled" },
          { answers: null },
          { answers: { runtime: [42] } },
          { checklist: [false, true] },
          { checklist: "string-smuggled" },
          { checklist: null },
          { checklist: { schema: "true" } },
        ];
        for (const malformedPatch of malformedPatches) {
          const response = await post(server, "/api/state", malformedPatch);
          expect(response.ok).toBe(false);
          expect(await response.text()).toMatch(/patch|object|answers|checklist/i);
        }
        expect(await readReviewState(planDir)).toMatchObject({ status: "draft", answers: {}, checklist: {} });

        for (const reviewer of [" ", 42]) {
          const invalidReviewer = await post(server, "/api/approve", { reviewer });
          expect(invalidReviewer.ok).toBe(false);
          expect(await invalidReviewer.text()).toMatch(/reviewer.*nonblank/i);
        }

        const bypass = await post(server, "/api/state", { status: "approved", approvedAt: "fake", reviewer: "attacker" });
        expect(bypass.status).toBe(409);
        expect(await bypass.text()).toMatch(/only be set through \/api\/approve/i);

        const blocked = await post(server, "/api/approve", { reviewer: "tester" });
        expect(blocked.status).toBe(422);
        expect(await blocked.text()).toMatch(/unresolved blocking comments/i);
        await post(server, "/api/comments", { resolveId: "c-durable" });

        const required = await post(server, "/api/approve", { reviewer: "tester" });
        expect(required.status).toBe(422);
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

  test("rejects foreign and null browser origins before simple mutations change authority", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await readReviewState(planDir);
      const pointer = join(planDir, ".muse-review", "current");
      const committedPointer = await readlink(pointer);
      const committedState = await readReviewState(planDir);
      const server = await servePlan(planDir, 0);
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        for (const origin of ["https://foreign.invalid", "null"]) {
          for (const path of ["/api/state", "/api/comments", "/api/approve"]) {
            const response = await fetch(`http://localhost:${server.port}${path}`, {
              method: "POST",
              headers: { origin, "content-type": "text/plain" },
              body: "{}",
            });
            expect(response.status).toBe(403);
          }
        }
        expect(await readlink(pointer)).toBe(committedPointer);
        expect(await readReviewState(planDir)).toEqual(committedState);
      } finally {
        server.stop(true);
      }
    });
  });

  test("supports trusted originless JSON clients and rejects their non-JSON mutations", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const trusted = await post(server, "/api/state", { answers: { localCli: "supported" } });
        expect(trusted.status).toBe(200);
        expect((await trusted.json()).answers.localCli).toBe("supported");

        for (const path of ["/api/state", "/api/comments", "/api/approve"]) {
          const response = await fetch(`http://localhost:${server.port}${path}`, {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: "{}",
          });
          expect(response.status).toBe(415);
        }
      } finally {
        server.stop(true);
      }
    });
  });

  test("rejects malformed comment and state bodies with HTTP 400 and no mutation", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        const beforeState = await readReviewState(planDir);
        const beforeComments = await readComments(planDir);
        const malformedComments = [
          {},
          { blockId: 42, body: "valid" },
          { blockId: "summary", body: " " },
          { blockId: "summary", body: "valid", unknown: true },
          { resolveId: "missing", body: "mixed" },
          { resolveId: 42 },
        ];
        for (const body of malformedComments) {
          const response = await post(server, "/api/comments", body);
          expect(response.status).toBe(400);
        }
        const unknownComment = await post(server, "/api/comments", { resolveId: "missing" });
        expect(unknownComment.status).toBe(404);
        for (const body of [null, [], { unknown: true }, { answers: 42 }, { checklist: { schema: "yes" } }]) {
          const response = await post(server, "/api/state", body);
          expect(response.status).toBe(400);
        }
        expect(await readReviewState(planDir)).toEqual(beforeState);
        expect(await readComments(planDir)).toEqual(beforeComments);

        const originalWriteFile = fs.writeFile;
        spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
          if (String(path).includes(".staging/plan-state.json")) throw new Error("operational write failure");
          return originalWriteFile(path, data, options);
        });
        const operational = await post(server, "/api/state", { answers: { valid: "shape" } });
        expect(operational.status).toBe(500);
      } finally {
        server.stop(true);
      }
    });
  });

  test("invalid approval leaves the authoritative pointer and state bytes unchanged", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first");
      const pointer = join(planDir, ".muse-review", "current");
      const committedTarget = await readlink(pointer);
      const committedStatePath = join(planDir, ".muse-review", committedTarget, "plan-state.json");
      const committedState = await readFile(committedStatePath);
      await setReadinessPolicy(planDir);

      await expect(approvePlan(planDir, "blocked")).rejects.toThrow(/runtime|schema/i);
      expect(await readlink(pointer)).toBe(committedTarget);
      expect(await readFile(committedStatePath)).toEqual(committedState);
    });
  });

  test("fails closed on a canonical dangling current target without cleaning bundles", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const store = join(planDir, ".muse-review");
      const current = join(store, "current");
      const bundlesBefore = await readdir(join(store, "bundles"));
      const dangling = join("bundles", canonicalId);
      await replaceSymlink(current, dangling);

      await expect(readReviewState(planDir)).rejects.toThrow();
      expect(await readlink(current)).toBe(dangling);
      expect(await readdir(join(store, "bundles"))).toEqual(bundlesBefore);
    });
  });

  test("binds approval to exact plan, canvas, manifest, readiness, and complete state values", async () => {
    const mutations: Array<{
      setup?: (planDir: string) => Promise<void>;
      mutate: (planDir: string) => Promise<void>;
    }> = [
      {
        mutate: async (planDir) => {
          await fs.appendFile(join(planDir, "plan.mdx"), "\n<Callout id=\"unprojected\" title=\"Unprojected\">Changed.</Callout>\n");
        },
      },
      {
        mutate: async (planDir) => {
          const path = join(planDir, "plan.mdx");
          await writeFile(path, (await readFile(path, "utf8")).replace("title: Minimal Interactive Plan", "title: Changed Frontmatter"));
        },
      },
      {
        mutate: async (planDir) => {
          const path = join(planDir, "plan.mdx");
          await writeFile(path, (await readFile(path, "utf8")).replace('status="Draft"', 'status="Changed"'));
        },
      },
      { mutate: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas\">Created</Callout>\n") },
      {
        setup: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas\">Original</Callout>\n"),
        mutate: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas\">Edited</Callout>\n"),
      },
      {
        setup: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas\">Original</Callout>\n"),
        mutate: async (planDir) => rm(join(planDir, "canvas.mdx")),
      },
      {
        setup: async (planDir) => {
          await setReadinessPolicy(planDir);
          await updateReviewState(planDir, { answers: { runtime: "Bun" }, checklist: { schema: true } });
        },
        mutate: async (planDir) => {
          const path = join(planDir, "plan.mdx");
          await writeFile(path, (await readFile(path, "utf8"))
            .replace("freeform | required", "freeform | advisory")
            .replace("Schema validates | required", "Schema validates | advisory"));
        },
      },
      {
        mutate: async (planDir) => {
          const bundle = await currentBundlePath(planDir);
          const statePath = join(bundle, "plan-state.json");
          const state = JSON.parse(await readFile(statePath, "utf8")) as ReviewState;
          state.checklist.render = true;
          await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
        },
      },
    ];

    for (const mutation of mutations) {
      await withFixture("minimal-plan", async (planDir) => {
        await mutation.setup?.(planDir);
        await approvePlan(planDir, "tester");
        await mutation.mutate(planDir);
        expect((await readReviewState(planDir)).status).toBe("needs_revision");
        await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
        await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow();
      });
    }
  });

  test("revalidates approval identity through every approved read API", async () => {
    const readers = [
      async (planDir: string) => readReviewState(planDir),
      async (planDir: string) => readComments(planDir),
      async (planDir: string) => readPublishedArtifact(planDir, "agent-handoff.json"),
      async (planDir: string) => readPublishedArtifact(planDir, "agent-handoff.md"),
    ];
    for (const readApproved of readers) {
      await withFixture("minimal-plan", async (planDir) => {
        await approvePlan(planDir, "tester");
        await fs.appendFile(join(planDir, "plan.mdx"), "\nUnprojected source mutation.\n");
        await readApproved(planDir).catch(() => undefined);
        expect((await readReviewState(planDir)).status).toBe("needs_revision");
      });
    }
  });

  test("detects source mutation after immutable capture during approval and approved reads", async () => {
    for (const phase of ["approval", "read"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        if (phase === "read") await approvePlan(planDir, "tester");
        else await readReviewState(planDir);
        const pointer = join(planDir, ".muse-review", "current");
        const committedTarget = await readlink(pointer);
        const planPath = join(planDir, "plan.mdx");
        const originalWriteFile = fs.writeFile;
        let mutated = false;

        if (phase === "approval") {
          spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
            const result = await originalWriteFile(path, data, options);
            if (!mutated && String(path).includes(".staging/agent-handoff.md")) {
              mutated = true;
              await originalWriteFile(planPath, `${await readFile(planPath, "utf8")}\nRaced source mutation.\n`);
            }
            return result;
          });
          await expect(approvePlan(planDir, "raced")).rejects.toThrow(/changed during approval/i);
          expect(await readlink(pointer)).toBe(committedTarget);
        } else {
          const originalOpen = fs.open;
          spyOn(fs, "open").mockImplementation((async (path: PathLike, flags: string | number, mode?: number) => {
            if (!mutated && String(path).includes(".muse-review/bundles/") && String(path).endsWith("/plan-state.json")) {
              mutated = true;
              await originalWriteFile(planPath, `${await readFile(planPath, "utf8")}\nRaced source mutation.\n`);
            }
            return originalOpen(path, flags, mode);
          }) as typeof fs.open);
          await expect(readReviewState(planDir)).rejects.toThrow(/changed|identity/i);
        }
        mock.restore();
      });
    }
  });

  test("restores the exact prior approval when postcommit source verification fails", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const original = await approvePlan(planDir, "first");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const committedTarget = await readlink(pointer);
      const priorBundle = join(store, committedTarget);
      const files = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"];
      const committedBytes = await Promise.all(files.map((file) => readFile(join(priorBundle, file))));
      const planPath = join(planDir, "plan.mdx");
      const originalRename = fs.rename;
      let mutated = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (!mutated && String(to) === pointer) {
          mutated = true;
          await writeFile(planPath, `${await readFile(planPath, "utf8")}\nPostcommit mutation.\n`);
        }
        return result;
      });

      await expect(approvePlan(planDir, "second")).rejects.toThrow(/changed during approval/i);

      expect(await readlink(pointer)).toBe(committedTarget);
      expect(await Promise.all(files.map((file) => readFile(join(priorBundle, file))))).toEqual(committedBytes);
      expect(JSON.parse(await readFile(join(priorBundle, "agent-handoff.json"), "utf8"))).toEqual(original);
    });
  });

  test("quarantines invalid approved authority until needs-revision recovery commits", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      await fs.appendFile(join(planDir, "plan.mdx"), "\nInvalidating source edit.\n");
      const pointer = join(planDir, ".muse-review", "current");
      const originalWriteFile = fs.writeFile;
      spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
        if (String(path).includes(".staging/plan-state.json")) throw new Error("invalidation publication failure");
        return originalWriteFile(path, data, options);
      });

      await expect(readReviewState(planDir)).rejects.toThrow("invalidation publication failure");
      await expect(lstat(pointer)).rejects.toThrow();
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();

      mock.restore();
      expect((await readReviewState(planDir)).status).toBe("needs_revision");
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
    });
  });

  test("validates final generated state and handoff before replacing current", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await readReviewState(planDir);
      const pointer = join(planDir, ".muse-review", "current");
      const committedTarget = await readlink(pointer);
      await writeFile(join(planDir, "visual-explainer.json"), JSON.stringify({ slug: "" }));

      await expect(approvePlan(planDir, "tester")).rejects.toThrow(/manifest|slug/i);
      expect(await readlink(pointer)).toBe(committedTarget);
    });
  });

  test("rejects bundle member replacement while reading from no-follow handles", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const bundle = await currentBundlePath(planDir);
      const statePath = join(bundle, "plan-state.json");
      const originalOpen = fs.open;
      let swapped = false;
      spyOn(fs, "open").mockImplementation((async (path, flags, mode) => {
        if (!swapped && String(path).endsWith("comments.json")) {
          swapped = true;
          const replacement = join(bundle, "replacement-state.json");
          await writeFile(replacement, await readFile(statePath));
          await fs.rename(replacement, statePath);
        }
        return originalOpen(path, flags, mode);
      }) as typeof fs.open);

      await expect(readReviewState(planDir)).rejects.toThrow(/changed|rebound/i);
    });
  });

  test("rejects pathname replacement of the current bundle directory generation", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const bundle = await currentBundlePath(planDir);
      const replacement = `${bundle}.replacement`;
      const displaced = `${bundle}.displaced`;
      await cp(bundle, replacement, { recursive: true });
      const originalOpen = fs.open;
      let swapped = false;
      spyOn(fs, "open").mockImplementation((async (path, flags, mode) => {
        const handle = await originalOpen(path, flags, mode);
        if (!swapped && String(path).endsWith("/comments.json") && String(path).startsWith(bundle)) {
          swapped = true;
          await fs.rename(bundle, displaced);
          await fs.rename(replacement, bundle);
        }
        return handle;
      }) as typeof fs.open);

      await expect(readReviewState(planDir)).rejects.toThrow(/generation|rebound|changed|stable regular/i);
    });
  });

  test("strictly validates approval request bodies and preserves current", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        await readReviewState(planDir);
        const pointer = join(planDir, ".muse-review", "current");
        const committedTarget = await readlink(pointer);
        const invalidBodies = [
          { reviewer: "" },
          { reviewer: " " },
          { reviewer: 42 },
          { reviewer: "valid", extra: true },
          { unknown: true },
        ];
        for (const body of invalidBodies) {
          const response = await post(server, "/api/approve", body);
          expect(response.status).toBe(400);
          expect(await response.text()).toMatch(/exactly|nonblank/i);
          expect(await readlink(pointer)).toBe(committedTarget);
        }
      } finally {
        server.stop(true);
      }
    });
  });

  test("restores mixed compatibility originals after faults at every replacement position", async () => {
    for (const failedFile of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        const statePath = join(planDir, "plan-state.json");
        const commentsPath = join(planDir, "comments.json");
        const jsonPath = join(planDir, "agent-handoff.json");
        const markdownPath = join(planDir, "agent-handoff.md");
        const originalState = Buffer.from(`${JSON.stringify({
          status: "in_review",
          answers: {},
          checklist: {},
          unresolvedCommentIds: [],
        }, null, 2)}\n`);
        await writeFile(statePath, originalState);
        await writeFile(commentsPath, "[]\n");
        await writeFile(jsonPath, "operator-owned\n");
        const originalRename = fs.rename;
        spyOn(fs, "rename").mockImplementation(async (from, to) => {
          if (String(to) === join(planDir, failedFile)) throw new Error(`fault at ${failedFile}`);
          return originalRename(from, to);
        });

        await expect(readReviewState(planDir)).rejects.toThrow(`fault at ${failedFile}`);
        expect(await readFile(statePath)).toEqual(originalState);
        expect(await readFile(commentsPath, "utf8")).toBe("[]\n");
        expect(await readFile(jsonPath, "utf8")).toBe("operator-owned\n");
        expect(await Bun.file(markdownPath).exists()).toBe(false);
        mock.restore();
      });
    }
  });
  test("serializes burst state updates so every accepted patch reaches authoritative state", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        const updates = Array.from({ length: 20 }, (_, index) => [`burst-${index}`, `value-${index}`] as const);
        const responses = await Promise.all(
          updates.map(([key, value]) => post(server, "/api/state", { answers: { [key]: value } })),
        );
        expect(responses.every((response) => response.ok)).toBe(true);
        const acceptedStates = await Promise.all(responses.map((response) => response.json() as Promise<ReviewState>));
        for (let index = 0; index < updates.length; index += 1) {
          const [key, value] = updates[index];
          expect(acceptedStates[index].answers[key]).toBe(value);
        }
        const authoritative = await readReviewState(planDir);
        expect(authoritative.answers).toEqual(Object.fromEntries(updates));
        expect(await temporaryPublicationEntries(planDir)).toEqual([]);
      } finally {
        server.stop(true);
      }
    });
  });

  test("publishes approved to needs-revision as one metadata and artifact revocation", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        await approvePlan(planDir, "reviewer");
        const pointer = join(planDir, ".muse-review", "current");
        const approvedTarget = await readlink(pointer);
        const response = await post(server, "/api/state", { status: "needs_revision" });
        expect(response.ok).toBe(true);
        const revised = await response.json() as ReviewState;
        expect(revised).toEqual({
          status: "needs_revision",
          answers: {},
          checklist: {},
          unresolvedCommentIds: [],
        });
        expect(await readlink(pointer)).not.toBe(approvedTarget);
        expect(await readReviewState(planDir)).toEqual(revised);
        for (const artifact of ["agent-handoff.json", "agent-handoff.md"]) {
          const artifactResponse = await fetch(`http://localhost:${server.port}/${artifact}`);
          expect(artifactResponse.ok).toBe(false);
        }
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
