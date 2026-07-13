import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { MDX_COMPONENT_META, MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
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
const expectedFontAssets = {
  "bricolage-grotesque-latin-500-normal.woff2": {
    sha256: "b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f",
    sha384: "qn7O2kwYDNO8BB07VtIMUe0lUqq3WYJ/okIrACPResGQn0vViFROEt3SGde7RySe",
  },
  "bricolage-grotesque-latin-600-normal.woff2": {
    sha256: "b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca",
    sha384: "Ilh1L/tmtUzFnpC1cwkNgBNnW+urzfbLETMexxhppi4RurOQbreAwtqAuodE8gcS",
  },
  "bricolage-grotesque-latin-700-normal.woff2": {
    sha256: "4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206",
    sha384: "I1AMB8Mhv2nNTsttl0xrwLBvxe4XMocWs9FDGXH6AqBsgZTPNWagTukzMpe7LPST",
  },
  "fragment-mono-latin-400-normal.woff2": {
    sha256: "44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56",
    sha384: "5pPJBXVgEAccmDzYsxRokikcIMqnLiJSV7qWM3TpHdoPoqSh8vUGD1DWsnEZB0BL",
  },
} as const;

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

      for (const [filename, expectedHashes] of Object.entries(expectedFontAssets)) {
        const assetPath = join(planDir, "dist", "assets", filename);
        const bytes = await readFile(assetPath);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(expectedHashes.sha256);
        expect(createHash("sha384").update(bytes).digest("base64")).toBe(expectedHashes.sha384);
        expect(indexHtml).toContain(`url("/assets/${filename}")`);
      }
      expect(indexHtml).not.toContain("fonts.googleapis.com");
      expect(indexHtml).not.toContain("fonts.gstatic.com");
      expect(indexHtml).toContain('integrity="sha384-T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E"');
      expect(staticHtml).toContain("data:font/woff2;base64,");
      expect(staticHtml).not.toContain('url("/assets/');

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
      const canonicalTypes = [...MDX_COMPONENT_NAMES].sort();
      const renderedTypes = Array.from(
        indexHtml.matchAll(/<section[^>]*data-component-category="[^"]+"[^>]*data-block-type="([^"]+)"/g),
        (match) => match[1],
      ).sort();
      const declaredCount = Number(indexHtml.match(/data-component-count="(\d+)"/)?.[1]);

      expect(renderedTypes).toEqual(canonicalTypes);
      expect(new Set(renderedTypes).size).toBe(MDX_COMPONENT_NAMES.length);
      expect(declaredCount).toBe(MDX_COMPONENT_NAMES.length);
      expect(indexHtml).toContain(`${MDX_COMPONENT_NAMES.length} examples · ${MDX_COMPONENT_NAMES.length} unique of canonical ${MDX_COMPONENT_NAMES.length}`);
      expect(indexHtml).toContain(`data-component-search-text="PlanSummary ${MDX_COMPONENT_META.PlanSummary.category} ${MDX_COMPONENT_META.PlanSummary.summary}"`);
      expect(indexHtml).toContain("Canonical denominator: MDX_COMPONENT_NAMES");

      for (const html of [indexHtml, staticHtml]) {
        expect(html).toContain(`<h2 id="component-explorer-title">Catalog</h2>`);
        expect(html).toContain(`aria-labelledby="summary-title"`);
        expect(html).toContain(`<h2 id="summary-title">Review Scenario</h2>`);
        expect(html).toContain(`aria-labelledby="component-table-title"`);
        expect(html).toContain(`<h2 id="component-table-title">QA / reference inventory</h2>`);
        expect(html).not.toMatch(/<strong>\d+\s*\/\s*\d+<\/strong><span>Review coverage/);
      }
    });
  });
  test("reports rendered and canonical inventory counts for partial and duplicate style guides", async () => {
    const cases = [
      {
        name: "partial",
        blocks: `<PlanSummary id="summary" title="Summary">\nPartial catalog.\n</PlanSummary>`,
        examples: 1,
        unique: 1,
      },
      {
        name: "duplicate",
        blocks: `<PlanSummary id="summary-a" title="First summary">\nFirst example.\n</PlanSummary>\n\n<PlanSummary id="summary-b" title="Second summary">\nSecond example.\n</PlanSummary>`,
        examples: 2,
        unique: 1,
      },
    ];

    for (const inventory of cases) {
      await withFixture("component-library-showcase", async (planDir) => {
        await writeFile(join(planDir, "plan.mdx"), `---\ntitle: ${inventory.name} component library\nkind: styleguide\nslug: ${inventory.name}-component-library\n---\n\n${inventory.blocks}\n`);
        const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
        const htmlOutputs = [
          await readFile(indexPath, "utf8"),
          await readFile(staticExportPath, "utf8"),
        ];

        for (const html of htmlOutputs) {
          expect(html).toContain(`data-component-example-count="${inventory.examples}"`);
          expect(html).toContain(`data-component-count="${inventory.unique}"`);
          expect(html).toContain(`data-component-canonical-count="${MDX_COMPONENT_NAMES.length}"`);
          expect(html).toContain(`${inventory.examples} ${inventory.examples === 1 ? "example" : "examples"} · ${inventory.unique} unique of canonical ${MDX_COMPONENT_NAMES.length}`);
        }
      });
    }
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
