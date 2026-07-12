import { describe, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Window } from "happy-dom";

import { renderBlock } from "../plugins/Muse/skills/muse/tools/interactive-plan/components.ts";
import { interactivePlanInteractionScript } from "../plugins/Muse/skills/muse/tools/interactive-plan/client.ts";
import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
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

function tabBlock(type: string, id: string): string {
  return renderBlock({
    id,
    type,
    props: { title: `${type} interaction contract` },
    body: "First\nfirst body\n---\nSecond\nsecond body\n---\nThird\nthird body",
  }, { staticMode: false });
}

function pressTabKey(
  window: Window,
  target: Element,
  key: string,
  modifiers: Partial<Pick<KeyboardEventInit, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">> = {},
): KeyboardEvent {
  const event = new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers });
  target.dispatchEvent(event);
  return event;
}

function expectActiveTab(document: Document, blockId: string, index: number): void {
  const tabs = [...document.querySelectorAll(`#${blockId} > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]`)];
  const panels = [...document.querySelectorAll(`#${blockId} > .ve-ip-body > .ve-ip-tabs > [role="tabpanel"]`)];
  tabs.forEach((tab, tabIndex) => {
    expect(tab.getAttribute("aria-selected")).toBe(String(tabIndex === index));
    expect(tab.getAttribute("tabindex")).toBe(tabIndex === index ? "0" : "-1");
    expect(panels[tabIndex].hasAttribute("hidden")).toBe(tabIndex !== index);
  });
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
          "tabs",
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

  test("rejects unsafe, duplicate, renderer-owned, and generated id collisions", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-id-collision-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Tabs id="tabs">\nFirst\n---\nSecond\n</Tabs>\n<Callout id="shared">Plan block</Callout>\n<Callout id="tabs-panel-0">Authored collision</Callout>\n<Callout id="unsafe id">Unsafe identifier</Callout>\n<Callout id="canvas">Canvas wrapper collision</Callout>\n`);
      await writeFile(join(planDir, "canvas.mdx"), `<Callout id="shared">Canvas block</Callout>\n`);

      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("Duplicate MDX component id 'shared'");
      expect(message).toContain("Generated HTML id 'tabs-panel-0' for Tabs 'tabs' collides with an authored block id");
      expect(message).toContain("MDX component 'Callout' has unsafe id 'unsafe id'");
      expect(message).toContain("MDX component id 'canvas' collides with renderer-owned id 'canvas'");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("rejects empty, separator-only, and blank tab panels", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-empty-tabs-"));
    const cases = [
      { body: "", position: 1 },
      { body: "---", position: 1 },
      { body: "---\nFirst", position: 1 },
      { body: "First\n---\n \n---\nSecond", position: 2 },
      { body: "First\n---", position: 2 },
    ];
    try {
      for (const item of cases) {
        await writeFile(join(planDir, "plan.mdx"), `<Tabs id="bad-tabs">\n${item.body}\n</Tabs>\n`);
        let message = "";
        try {
          await loadPlanFolder(planDir);
        } catch (error) {
          message = error instanceof Error ? error.message : String(error);
        }
        expect(message).toContain(`Tabs 'bad-tabs' contains an empty panel at position ${item.position}`);
      }
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
  test.each(["Tabs", "DiffTabs"])("%s emits complete tab and panel relationships", (type) => {
    const blockId = `${type.toLowerCase()}-contract`;
    const html = renderBlock({
      id: blockId,
      type,
      props: { title: `${type} contract` },
      body: "file: alpha.ts\nalpha body\n---\nfile: beta.ts\nbeta body\n---\nfile: gamma.ts\ngamma body",
    }, { staticMode: false });
    const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(([tag]) => tag);
    const panels = [...html.matchAll(/<div\b[^>]*role="tabpanel"[^>]*>/g)].map(([tag]) => tag);

    expect(tabs).toHaveLength(3);
    expect(panels).toHaveLength(3);
    expect(new Set(tabs.map((tag) => tag.match(/\bid="([^"]+)"/)?.[1])).size).toBe(3);
    expect(new Set(panels.map((tag) => tag.match(/\bid="([^"]+)"/)?.[1])).size).toBe(3);

    tabs.forEach((tab, index) => {
      const tabId = `${blockId}-tab-${index}`;
      const panelId = `${blockId}-panel-${index}`;
      expect(tab).toContain(`id="${tabId}"`);
      expect(tab).toContain(`aria-controls="${panelId}"`);
      expect(tab).toContain(`aria-selected="${index === 0}"`);
      expect(tab).toContain(`tabindex="${index === 0 ? 0 : -1}"`);
      expect(panels[index]).toContain(`id="${panelId}"`);
      expect(panels[index]).toContain(`aria-labelledby="${tabId}"`);
      expect(panels[index].includes(" hidden")).toBe(index !== 0);
    });
  });

  test.each(["Tabs", "DiffTabs"])("%s static output exposes every labeled panel in source order", (type) => {
    const html = renderBlock({
      id: `${type.toLowerCase()}-static`,
      type,
      props: { title: `${type} static contract` },
      body: "file: alpha.ts\nalpha body\n---\nfile: beta.ts\nbeta body\n---\nfile: gamma.ts\ngamma body",
    }, { staticMode: true });

    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('role="tab"');
    expect(html).not.toContain('role="tabpanel"');
    expect(html).not.toContain("data-tab-target");
    expect(html).not.toMatch(/\s(?:hidden|aria-hidden)(?:\s|=|>)/);
    expect(html.match(/class="ve-ip-static-tab-panel"/g)).toHaveLength(3);

    const orderedContent = ["alpha.ts", "alpha body", "beta.ts", "beta body", "gamma.ts", "gamma body"];
    let previousIndex = -1;
    for (const content of orderedContent) {
      const index = html.indexOf(content);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  });

  test.each([
    ["Tabs", "Panel 1"],
    ["DiffTabs", "Diff 1"],
  ])("%s gives a prefix-only panel a fallback label", (type, fallbackLabel) => {
    for (const staticMode of [false, true]) {
      const html = renderBlock({
        id: `${type.toLowerCase()}-fallback`,
        type,
        props: {},
        body: "file:\npanel body",
      }, { staticMode });
      expect(html).toContain(`>${fallbackLabel}<`);
      expect(html).not.toContain("<h3></h3>");
    }
  });

  test.each(["Tabs", "DiffTabs"])("%s executes keyboard, click, and ownership behavior", (type) => {
    const window = new Window();
    const document = window.document;
    try {
      document.body.innerHTML = tabBlock(type, "primary") + tabBlock(type, "secondary");
      const primaryPanel = document.querySelector("#primary-panel-0");
      if (!primaryPanel) throw new Error("Primary panel was not rendered");
      primaryPanel.insertAdjacentHTML("beforeend", tabBlock(type, "nested"));
      const installInteractions = new Function("window", "document", "HTMLElement", "HTMLInputElement", interactivePlanInteractionScript);
      installInteractions(window, document, window.HTMLElement, window.HTMLInputElement);

      const primaryTabs = [...document.querySelectorAll('#primary > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]')];
      const primaryTablist = primaryTabs[0].parentElement;
      if (!primaryTablist) throw new Error("Primary tablist was not rendered");

      primaryTabs[0].focus();
      expect(pressTabKey(window, primaryTabs[0], "ArrowLeft").defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(primaryTabs[2]);
      expectActiveTab(document, "primary", 2);

      expect(pressTabKey(window, primaryTabs[2], "ArrowRight").defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(primaryTabs[0]);
      expectActiveTab(document, "primary", 0);

      expect(pressTabKey(window, primaryTabs[0], "End").defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(primaryTabs[2]);
      expectActiveTab(document, "primary", 2);

      expect(pressTabKey(window, primaryTabs[2], "Home").defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(primaryTabs[0]);
      expectActiveTab(document, "primary", 0);

      for (const modifiers of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
        expect(pressTabKey(window, primaryTabs[0], "ArrowRight", modifiers).defaultPrevented).toBe(false);
        expectActiveTab(document, "primary", 0);
      }

      expect(pressTabKey(window, primaryTabs[0], "Tab").defaultPrevented).toBe(false);
      expectActiveTab(document, "primary", 0);

      const orphan = document.createElement("button");
      orphan.setAttribute("role", "tab");
      orphan.setAttribute("data-tab-target", "missing-panel");
      primaryTablist.append(orphan);
      expect(pressTabKey(window, primaryTabs[2], "ArrowRight").defaultPrevented).toBe(false);
      orphan.remove();
      expectActiveTab(document, "primary", 0);

      primaryTabs[1].click();
      expectActiveTab(document, "primary", 1);
      expectActiveTab(document, "nested", 0);
      expectActiveTab(document, "secondary", 0);

      const nestedTabs = [...document.querySelectorAll('#nested > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]')];
      nestedTabs[1].click();
      expectActiveTab(document, "nested", 1);
      expectActiveTab(document, "primary", 1);
      expectActiveTab(document, "secondary", 0);
    } finally {
      window.close();
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
