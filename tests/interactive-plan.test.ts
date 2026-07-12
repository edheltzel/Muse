import { describe, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
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
          "reference-tabs",
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
    ];

    for (const fixture of fixtureExpectations) {
      const plan = await loadPlanFolder(join(fixturesRoot, fixture.name));
      expect(plan.manifest.kind).toBe(fixture.kind);
      expect(plan.manifest.slug).toBe(fixture.slug);
      expect(plan.manifest.localOnly).toBe(true);
      expect(plan.plan.blocks.map((block) => block.id)).toEqual(fixture.blockIds);
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
  test("renders the style guide as a searchable, copyable component explorer", async () => {
    await withFixture("component-library-showcase", async (planDir) => {
      const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
      const indexHtml = await readFile(indexPath, "utf8");
      const staticHtml = await readFile(staticExportPath, "utf8");

      expect(indexHtml).toContain("data-component-explorer");
      expect(indexHtml).toContain("data-component-search");
      expect(indexHtml).toContain("data-component-filter");
      expect(indexHtml).toContain("data-component-results");
      expect(indexHtml).toContain("data-copy-mdx");
      expect(indexHtml).toContain("class=\"ve-ip-source\"");
      expect(indexHtml).toContain("navigator.clipboard");
      expect(staticHtml).toContain("data-component-explorer");

      for (const componentName of MDX_COMPONENT_NAMES) {
        expect(indexHtml).toContain(`data-block-type="${componentName}"`);
      }
    });
  });

});

describe("interactive plan review state and handoff", () => {
  test("persists answers, checklist values, comment resolution, and approval handoff files", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await updateReviewState(planDir, {
        answers: { runtime: "Use the local Vite Plus bridge with Bun." },
        checklist: { schema: true, render: true },
      });

      let state = await readReviewState(planDir);
      expect(state.status).toBe("draft");
      expect(state.answers.runtime).toBe("Use the local Vite Plus bridge with Bun.");
      expect(state.checklist).toEqual({ schema: true, render: true });

      const comment = await addComment(planDir, {
        id: "c-review-scope",
        blockId: "summary",
        anchor: "scope",
        body: "Clarify whether approval is local-only before handoff.",
      });
      expect(comment.status).toBe("open");

      state = await readReviewState(planDir);
      expect(state.unresolvedCommentIds).toEqual(["c-review-scope"]);

      const resolvedComments = await resolveComment(planDir, "c-review-scope");
      expect(resolvedComments).toHaveLength(1);
      expect(resolvedComments[0]).toMatchObject({ id: "c-review-scope", status: "resolved", blockId: "summary" });
      expect(resolvedComments[0].resolvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(await readComments(planDir)).toEqual(resolvedComments);

      state = await readReviewState(planDir);
      expect(state.unresolvedCommentIds).toEqual([]);

      const handoff = await approvePlan(planDir, "tester");
      expect(handoff.status).toBe("approved");
      expect(handoff.planSlug).toBe("minimal-plan");
      expect(handoff.answers).toEqual({ runtime: "Use the local Vite Plus bridge with Bun." });
      expect(handoff.decisions).toEqual([
        "Use local MDX | Keeps source portable | accepted",
        "Use Vite Plus | Keeps browser pipeline explicit | accepted",
      ]);
      expect(handoff.verification).toEqual(["schema | Schema validates", "render | HTML renders"]);
      expect(handoff.openRisks).toEqual([]);

      const approvedState = await readReviewState(planDir);
      expect(approvedState).toMatchObject({ status: "approved", reviewer: "tester" });
      expect(approvedState.approvedAt).toBe(handoff.approvedAt);

      const handoffJson = JSON.parse(await readFile(join(planDir, "agent-handoff.json"), "utf8"));
      expect(handoffJson).toEqual(handoff);

      const handoffMarkdown = await readFile(join(planDir, "agent-handoff.md"), "utf8");
      expect(handoffMarkdown).toContain("# Agent Handoff: minimal-plan");
      expect(handoffMarkdown).toContain("Status: approved");
      expect(handoffMarkdown).toContain("Use local MDX | Keeps source portable | accepted");
      expect(handoffMarkdown).toContain('"runtime": "Use the local Vite Plus bridge with Bun."');
      expect(handoffMarkdown).toContain("schema | Schema validates");
      expect(handoffMarkdown).toContain("## Open Risks\n\n- None recorded");
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
