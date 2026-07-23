import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import type { PathLike } from "node:fs";
import { chmod, cp, lstat, mkdir, mkdtemp, readFile, readdir, readlink, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  Browser,
  Window,
  type Document as HappyDocument,
  type Element as HappyElement,
  type HTMLElement as HappyHTMLElement,
  type HTMLInputElement as HappyHTMLInputElement,
  type IKeyboardEventInit,
  type KeyboardEvent as HappyKeyboardEvent,
} from "happy-dom";

import { renderBlock } from "../plugins/Muse/skills/muse/tools/interactive-plan/components.ts";
import { interactivePlanInteractionScript, interactivePlanReviewScript, staticPlanClientScript } from "../plugins/Muse/skills/muse/tools/interactive-plan/client.ts";
import { decodeMarkdownText, encodeMarkdownText, formatAgentHandoffMarkdown, parseAgentHandoffMarkdown } from "../plugins/Muse/skills/muse/tools/interactive-plan/handoff.ts";
import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { acquirePlanLock, tryUnixFlockForTesting } from "../plugins/Muse/skills/muse/tools/interactive-plan/plan-lock.ts";
import type { AgentHandoff, ReviewState } from "../plugins/Muse/skills/muse/tools/interactive-plan/schema.ts";
import { validateRenderedHtmlIds } from "../plugins/Muse/skills/muse/tools/interactive-plan/schema.ts";
import { renderPlanFolder, renderPlanHtml } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { servePlan } from "../plugins/Muse/skills/muse/tools/interactive-plan/server.ts";
import { MDX_COMPONENT_META, MDX_COMPONENT_NAMES, RAW_BODY_MDX_COMPONENTS } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
import {
  addComment,
  MAX_REVIEW_WAITERS,
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

const fontAssetRoot = join(repoRoot, "plugins", "Muse", "skills", "muse", "tools", "interactive-plan", "assets");
const expectedFontAssets = {
  "bricolage-grotesque-latin-500-normal.woff2": {
    sha256: "b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f",
    sha384: "qn7O2kwYDNO8BB07VtIMUe0lUqq3WYJ/okIrACPResGQn0vViFROEt3SGde7RySe",
    package: "@fontsource/bricolage-grotesque",
    version: "5.2.10",
    notice: "notices/fontsource-bricolage-grotesque-5.2.10-LICENSE.txt",
  },
  "bricolage-grotesque-latin-600-normal.woff2": {
    sha256: "b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca",
    sha384: "Ilh1L/tmtUzFnpC1cwkNgBNnW+urzfbLETMexxhppi4RurOQbreAwtqAuodE8gcS",
    package: "@fontsource/bricolage-grotesque",
    version: "5.2.10",
    notice: "notices/fontsource-bricolage-grotesque-5.2.10-LICENSE.txt",
  },
  "bricolage-grotesque-latin-700-normal.woff2": {
    sha256: "4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206",
    sha384: "I1AMB8Mhv2nNTsttl0xrwLBvxe4XMocWs9FDGXH6AqBsgZTPNWagTukzMpe7LPST",
    package: "@fontsource/bricolage-grotesque",
    version: "5.2.10",
    notice: "notices/fontsource-bricolage-grotesque-5.2.10-LICENSE.txt",
  },
  "fragment-mono-latin-400-normal.woff2": {
    sha256: "44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56",
    sha384: "5pPJBXVgEAccmDzYsxRokikcIMqnLiJSV7qWM3TpHdoPoqSh8vUGD1DWsnEZB0BL",
    package: "@fontsource/fragment-mono",
    version: "5.2.8",
    notice: "notices/fontsource-fragment-mono-5.2.8-LICENSE.txt",
  },
} as const;

const expectedFontNotices = {
  "notices/fontsource-bricolage-grotesque-5.2.10-LICENSE.txt": {
    sha256: "923f4ddf0fd39f9b7794ab0df7332f3d95dc43e8ad7ec2289d6d9e8491177f51",
    copyright: "Copyright 2022 The Bricolage Grotesque Project Authors (https://github.com/ateliertriay/bricolage)",
  },
  "notices/fontsource-fragment-mono-5.2.8-LICENSE.txt": {
    sha256: "d5e728d99896c101da6fe5bdffcdc8cf2618523643b99bd4e9190075f0a0c22e",
    copyright: "Copyright 2022 The Fragment-Mono Project Authors (https://github.com/weiweihuanghuang/fragment-mono) FragmentMono-Italic.ttf: Copyright 2022 The Fragment-Mono Project Authors (https://github.com/weiweihuanghuang/fragment-mono)",
  },
} as const;

async function copyFixture(name: string): Promise<string> {
  const planDir = await mkdtemp(join(tmpdir(), `ve-ip-${name}-`));
  await cp(join(fixturesRoot, name), planDir, { recursive: true });
  return fs.realpath(planDir);
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

type ClientFetch = (url: string, init?: RequestInit) => Promise<Response>;

function installReviewClient(
  html: string,
  baseUrl: string,
  clientFetch: ClientFetch,
  prompt: () => string | null = () => null,
): Window {
  const window = new Window({ url: baseUrl });
  window.document.write(html);
  const install = new Function(
    "window",
    "document",
    "fetch",
    "CSS",
    "crypto",
    "HTMLElement",
    "HTMLInputElement",
    "prompt",
    interactivePlanReviewScript,
  ) as (...args: unknown[]) => void;
  install(
    window,
    window.document,
    clientFetch,
    window.CSS,
    window.crypto,
    window.HTMLElement,
    window.HTMLInputElement,
    prompt,
  );
  return window;
}

function clickReviewControl(window: Window, selector: string): void {
  const control = window.document.querySelector(selector);
  if (!control) throw new Error(`Missing review control: ${selector}`);
  control.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

interface ClientFetchTracker {
  fetch: ClientFetch;
  waitForCompleted(count: number): Promise<void>;
}

function trackClientFetch(
  baseUrl: string,
  request: ClientFetch = (url, init) => fetch(new URL(url, baseUrl), init),
): ClientFetchTracker {
  let completed = 0;
  const waiters: Array<{ count: number; resolve: () => void }> = [];
  return {
    async fetch(url, init) {
      try {
        return await request(url, init);
      } finally {
        completed += 1;
        for (let index = waiters.length - 1; index >= 0; index -= 1) {
          if (completed < waiters[index].count) continue;
          waiters[index].resolve();
          waiters.splice(index, 1);
        }
      }
    },
    waitForCompleted(count) {
      if (completed >= count) return Promise.resolve();
      const pending = Promise.withResolvers<void>();
      waiters.push({ count, resolve: pending.resolve });
      return pending.promise;
    },
  };
}

async function settleClientRequests(tracker: ClientFetchTracker, completed: number): Promise<void> {
  await tracker.waitForCompleted(completed);
  const turn = Promise.withResolvers<void>();
  setImmediate(turn.resolve);
  await turn.promise;
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
  target: HappyElement,
  key: string,
  modifiers: Partial<Pick<IKeyboardEventInit, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">> = {},
): HappyKeyboardEvent {
  const event = new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers });
  target.dispatchEvent(event);
  return event;
}

function expectActiveTab(document: HappyDocument, blockId: string, index: number): void {
  const tabs = [...document.querySelectorAll(`#${blockId} > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]`)];
  const panels = [...document.querySelectorAll(`#${blockId} > .ve-ip-body > .ve-ip-tabs > [role="tabpanel"]`)];
  tabs.forEach((tab, tabIndex) => {
    expect(tab.getAttribute("aria-selected")).toBe(String(tabIndex === index));
    expect(tab.getAttribute("tabindex")).toBe(tabIndex === index ? "0" : "-1");
    expect(panels[tabIndex].hasAttribute("hidden")).toBe(tabIndex !== index);
  });
}

function queryHtml(document: HappyDocument, selector: string): HappyHTMLElement | null {
  return document.querySelector(selector) as HappyHTMLElement | null;
}
const emittedIdCollisionCases = [
  {
    component: "ArchitectureDiagram",
    body: "flowchart LR\nA --> B",
    emittedIds: ["diagram-title", "diagram-instructions", "ve-mermaid-diagram"],
  },
  {
    component: "DiffTabs",
    body: "file: first.ts\n+ first\n---\nfile: second.ts\n+ second",
    emittedIds: ["diagram-title", "diagram-tab-0", "diagram-tab-1", "diagram-panel-0", "diagram-panel-1"],
  },
  {
    component: "Tabs",
    body: "First\n---\nSecond",
    emittedIds: ["diagram-title", "diagram-tab-0", "diagram-tab-1", "diagram-panel-0", "diagram-panel-1"],
  },
].flatMap(({ component, body, emittedIds }) => {
  const generated = `<${component} id="diagram">${body}</${component}>`;
  return emittedIds.flatMap((emittedId) => {
    const authored = `<Callout id="${emittedId}">Collision</Callout>`;
    return [
      { direction: `${component}: authored → emitted in plan`, planBlocks: [authored, generated], canvasBlocks: [], emittedId },
      { direction: `${component}: emitted → authored in plan`, planBlocks: [generated, authored], canvasBlocks: [], emittedId },
      { direction: `${component}: plan authored → canvas emitted`, planBlocks: [authored], canvasBlocks: [generated], emittedId },
      { direction: `${component}: plan emitted → canvas authored`, planBlocks: [generated], canvasBlocks: [authored], emittedId },
    ];
  });
});

function escapeExpectedHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
          "component-anchor",
          "questions",
          "checks",
          "approval",
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
  test("rejects noncanonical and unconfined manifest identity fields", async () => {
    const invalidValues = [
      { createdAt: "2026-07-01" },
      { source: [""] },
      { source: ["../outside"] },
      { source: ["line\nbreak"] },
      { dist: "../dist" },
      { dist: "/tmp/dist" },
      { entry: "other.mdx" },
    ];
    for (const patch of invalidValues) {
      await withFixture("minimal-plan", async (planDir) => {
        const path = join(planDir, "visual-explainer.json");
        const manifest = JSON.parse(await readFile(path, "utf8"));
        await writeFile(path, JSON.stringify({ ...manifest, ...patch }));
        await expect(loadPlanFolder(planDir)).rejects.toThrow(/createdAt|source|dist|entry/i);
      });
    }
  });

  test("overlays partial manifests on canonical defaults", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await writeFile(join(planDir, "visual-explainer.json"), JSON.stringify({ slug: "legacy" }));
      const loaded = await loadPlanFolder(planDir);
      expect(loaded.manifest).toMatchObject({
        kind: "plan",
        slug: "legacy",
        entry: "plan.mdx",
        dist: "dist",
        localOnly: true,
      });
      expect(loaded.manifest.createdAt).toMatch(/Z$/);
    });
  });


  test.each([
    ["Tabs", "tab-0"],
    ["Tabs", "panel-0"],
    ["DiffTabs", "tab-0"],
    ["DiffTabs", "panel-0"],
  ])("rejects %s generated %s collisions during load and at the final HTML boundary", async (type, generatedSuffix) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-id-collision-"));
    const blockId = type.toLowerCase();
    const generatedId = `${blockId}-${generatedSuffix}`;
    try {
      await writeFile(join(planDir, "plan.mdx"), `<${type} id="${blockId}">\nfile: alpha.ts\nalpha\n---\nfile: beta.ts\nbeta\n</${type}>\n<Callout id="${generatedId}">Authored collision</Callout>\n`);

      let loadMessage = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        loadMessage = error instanceof Error ? error.message : String(error);
      }
      expect(loadMessage).toContain(`Generated HTML id '${generatedId}' for ${type} '${blockId}' collides with an authored block id`);

      await writeFile(join(planDir, "plan.mdx"), `<${type} id="${blockId}">\nfile: alpha.ts\nalpha\n---\nfile: beta.ts\nbeta\n</${type}>\n`);
      const plan = await loadPlanFolder(planDir);
      const shell = `<!doctype html><html><body><div id="${generatedId}"></div>{{CONTENT}}<script>{{CLIENT}}</script></body></html>`;
      let renderMessage = "";
      try {
        await renderPlanHtml(plan, false, shell);
      } catch (error) {
        renderMessage = error instanceof Error ? error.message : String(error);
      }
      expect(renderMessage).toContain(`Rendered HTML contains duplicate id '${generatedId}'`);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("rejects unsafe, duplicate, and renderer-owned authored ids", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-authored-ids-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="shared">Plan block</Callout>\n<Callout id="unsafe id">Unsafe identifier</Callout>\n<Callout id="canvas">Renderer collision</Callout>\n`);
      await writeFile(join(planDir, "canvas.mdx"), `<Callout id="shared">Canvas block</Callout>\n`);

      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("Duplicate MDX component id 'shared'");
      expect(message).toContain("MDX component 'Callout' has unsafe id 'unsafe id'");
      expect(message).toContain("MDX component id 'canvas' collides with renderer-owned id 'canvas'");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });


  test("rejects valueless ids and Wireframe descendant collisions", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-wireframe-ids-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Tabs id="tabs">\nFirst\n---\nSecond\n</Tabs>\n<Callout id="shared">Authored block</Callout>\n<Callout id>Missing id value</Callout>\n<Wireframe id="wireframe">\n<div id="tabs-panel-0"></div>\n<div id="shared"></div>\n<div id="canvas"></div>\n<div id="unsafe id"></div>\n<div id></div>\n</Wireframe>\n`);
      await writeFile(join(planDir, "canvas.mdx"), `<Callout id="canvas-content">Canvas block</Callout>\n`);

      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("MDX component 'Callout' is missing required id");
      expect(message).toContain("Wireframe descendant id 'tabs-panel-0' in 'wireframe' collides with another emitted id");
      expect(message).toContain("Wireframe descendant id 'shared' in 'wireframe' collides with another emitted id");
      expect(message).toContain("Wireframe descendant id 'canvas' in 'wireframe' collides with another emitted id");
      expect(message).toContain("Wireframe descendant has unsafe id 'unsafe id' in 'wireframe'");
      expect(message).toContain("Wireframe 'wireframe' contains an id attribute without a value");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("rejects a mismatched Tabs block even when another block is valid", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-malformed-tabs-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="valid">Valid block</Callout>\n<Tabs id="broken">\nFirst\n---\nSecond\n</DiffTabs>\n`);
      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toContain("Malformed MDX component source");
      expect(message).toContain("closing 'DiffTabs' does not match open 'Tabs'");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });
  test("parses quoted tag closers and opaque non-Muse JSX inside supported blocks", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-quoted-tags-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="comparison" title="A > B">Comparison body</Callout>
<AnnotatedCode id="button-code" file="Button.tsx">
<Button title="A > B">Choose</Button>
</AnnotatedCode>
`);

      const plan = await loadPlanFolder(planDir);
      expect(plan.plan.blocks.map(({ id, type }) => ({ id, type }))).toEqual([
        { id: "comparison", type: "Callout" },
        { id: "button-code", type: "AnnotatedCode" },
      ]);
      expect(plan.plan.blocks[0].props.title).toBe("A > B");
      expect(plan.plan.blocks[1].body).toContain('<Button title="A > B">Choose</Button>');
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each([
    {
      type: "AnnotatedCode",
      body: "const tabs = `<Tabs id=\"example\">Panel</Tabs>`;\nconst note = <Callout id=\"note\">Read me</Callout>;\nconst malformed = \"<Callout>\";",
    },
    {
      type: "Tabs",
      body: "file: example.tsx\nconst nested = `<Tabs id=\"example\">Panel</Tabs>`;\n---\nfile: callout.tsx\nconst note = <Callout id=\"note\">Read me</Callout>;",
    },
  ])("preserves supported Muse tags as literal content inside $type", async ({ type, body }) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-literal-body-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<${type} id="literal">\n${body}\n</${type}>\n`);
      const plan = await loadPlanFolder(planDir);
      expect(plan.plan.blocks).toHaveLength(1);
      expect(plan.plan.blocks[0].type).toBe(type);
      expect(plan.plan.blocks[0].body).toBe(body);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("backtracks past standalone literal raw closing examples", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-raw-closing-"));
    const source = `<AnnotatedCode id="annotated">\nconst example = \`\n</AnnotatedCode>\n\`;\n</AnnotatedCode>\n<Tabs id="tabs">\nfile: tabs.tsx\nconst example = \`\n</Tabs>\n\`;\n</Tabs>\n<DiffTabs id="diffs">\nfile: diff.ts\nconst example = \`\n</DiffTabs>\n\`;\n</DiffTabs>\n<AnnotatedCode id="following">\nconst following = true;\n</AnnotatedCode>\n`;
    try {
      await writeFile(join(planDir, "plan.mdx"), source);

      const plan = await loadPlanFolder(planDir);

      expect(plan.plan.blocks.map(({ id, type }) => ({ id, type }))).toEqual([
        { id: "annotated", type: "AnnotatedCode" },
        { id: "tabs", type: "Tabs" },
        { id: "diffs", type: "DiffTabs" },
        { id: "following", type: "AnnotatedCode" },
      ]);
      expect(plan.plan.blocks[0].body).toContain("\n</AnnotatedCode>\n");
      expect(plan.plan.blocks[1].body).toContain("\n</Tabs>\n");
      expect(plan.plan.blocks[2].body).toContain("\n</DiffTabs>\n");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each(
    ["\n", "\r\n"].flatMap((newline) =>
      Object.keys(RAW_BODY_MDX_COMPONENTS).flatMap((type) => [
        { newline, order: "inline then multiline", type },
        { newline, order: "multiline then inline", type },
      ]),
    ),
  )("materializes both $type blocks when $order with $newline line endings", async ({ newline, order, type }) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-mixed-raw-"));
    const first = `<${type} id="first">First</${type}>`;
    const second = `<${type} id="second">${newline}Second${newline}</${type}>`;
    const source = order === "inline then multiline"
      ? `${first}${newline}${second}${newline}`
      : `${second}${newline}${first}${newline}`;
    try {
      await writeFile(join(planDir, "plan.mdx"), source);
      const plan = await loadPlanFolder(planDir);
      const html = await renderPlanHtml(plan);

      expect(plan.plan.blocks.map(({ id, type: blockType }) => ({ id, type: blockType }))).toEqual([
        { id: order === "inline then multiline" ? "first" : "second", type },
        { id: order === "inline then multiline" ? "second" : "first", type },
      ]);
      expect(html).toContain('id="first"');
      expect(html).toContain('id="second"');
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each(["\n", "\r\n"])("preserves literal closers while mixed raw types retain source order with %j", async (newline) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-mixed-raw-types-"));
    const lines = [
      '<AnnotatedCode id="code">const inline = "</AnnotatedCode>";',
      "const standalone = `",
      "</AnnotatedCode>",
      "`;",
      "</AnnotatedCode>",
      '<Tabs id="tabs">First</Tabs>',
      '<DiffTabs id="diffs">',
      "file: before.ts",
      "before",
      "---",
      "file: after.ts",
      "after",
      "</DiffTabs>",
      '<Wireframe id="wireframe"><div>Preview</div></Wireframe>',
    ];
    try {
      await writeFile(join(planDir, "plan.mdx"), `${lines.join(newline)}${newline}`);
      const plan = await loadPlanFolder(planDir);
      const html = await renderPlanHtml(plan);

      expect(plan.plan.blocks.map(({ id, type }) => ({ id, type }))).toEqual([
        { id: "code", type: "AnnotatedCode" },
        { id: "tabs", type: "Tabs" },
        { id: "diffs", type: "DiffTabs" },
        { id: "wireframe", type: "Wireframe" },
      ]);
      expect(plan.plan.blocks[0].body).toContain('"</AnnotatedCode>"');
      expect(plan.plan.blocks[0].body).toContain(`${newline}</AnnotatedCode>${newline}`);
      for (const id of ["code", "tabs", "diffs", "wireframe"]) {
        expect(html).toContain(`id="${id}"`);
      }
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each(["\n", "\r\n"])("keeps raw and opaque JSX boundaries intact with %j line endings", async (newline) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-parser-boundaries-"));
    const lines = [
      '<Tabs.Panel id="opaque-tab">Dotted</Tabs.Panel>',
      '<UI:Callout id="opaque-callout">Namespaced</UI:Callout>',
      '<AnnotatedCode id="raw">',
      'const close = "</AnnotatedCode>";',
      '</AnnotatedCode>',
      '<DiffTabs id="diffs">',
      "file: before.ts",
      "before",
      "---",
      "file: after.ts",
      "after",
      "</DiffTabs>",
    ];
    try {
      await writeFile(join(planDir, "plan.mdx"), `${lines.join(newline)}${newline}`);

      const plan = await loadPlanFolder(planDir);

      expect(plan.plan.blocks.map(({ id, type }) => ({ id, type }))).toEqual([
        { id: "raw", type: "AnnotatedCode" },
        { id: "diffs", type: "DiffTabs" },
      ]);
      expect(plan.plan.blocks[0].body).toBe('const close = "</AnnotatedCode>";');
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("keeps dotted and namespaced JSX names opaque", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-opaque-jsx-"));
    try {
      const source = `<Tabs.Panel id="tab">Dotted</Tabs.Panel>\n<UI:Callout id="note">Namespaced</UI:Callout>`;
      await writeFile(join(planDir, "plan.mdx"), source);
      const plan = await loadPlanFolder(planDir);
      expect(plan.plan.blocks).toHaveLength(1);
      expect(plan.plan.blocks[0].type).toBe("Callout");
      expect(plan.plan.blocks[0].body).toBe(source);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each([
    {
      name: "nested supported block",
      source: `<Callout id="outer"><Tabs id="inner">Panel</Tabs></Callout>`,
      error: "nested 'Tabs' inside 'Callout' is not supported",
    },
    {
      name: "unclosed supported block",
      source: `<Tabs id="broken">Panel`,
      error: "unclosed 'Tabs'",
    },
    {
      name: "unexpected supported closing tag",
      source: `Plain prose</Tabs>`,
      error: "unexpected closing 'Tabs'",
    },
    {
      name: "closing tag suffix",
      source: `<Tabs id="broken">Panel</Tabs extra>`,
      error: "malformed closing 'Tabs'",
    },
    {
      name: "component-like fallback",
      source: `<Tabs id="broken"`,
      error: "incomplete tag '<Tabs'",
    },
    {
      name: "supported component bang continuation",
      source: `<Tabs! id="broken">Panel</Tabs!>`,
      error: "illegal continuation '!' after supported component name 'Tabs'",
    },
    {
      name: "supported component equals continuation",
      source: `<Callout="broken">Panel</Callout>`,
      error: "illegal continuation '=' after supported component name 'Callout'",
    },
  ])("rejects $name instead of silently recovering", async ({ source, error }) => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-malformed-component-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), source);
      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (caught) {
        message = caught instanceof Error ? caught.message : String(caught);
      }
      expect(message).toContain("Malformed MDX component source");
      expect(message).toContain(error);
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
  test("inventories StateGallery ids with authored, generated, renderer, and canvas ids", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-state-gallery-ids-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Tabs id="tabs">First\n---\nSecond</Tabs>
<Callout id="shared">Authored block</Callout>
<StateGallery id="states">
<div title="A > B" id="tabs-panel-0"></div>
<div id="shared"></div>
<div id="canvas"></div>
<div id="unsafe id"></div>
<div id></div>
</StateGallery>
`);
      await writeFile(join(planDir, "canvas.mdx"), `<Callout id="canvas-content">Canvas</Callout>`);

      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("StateGallery descendant id 'tabs-panel-0' in 'states' collides with another emitted id");
      expect(message).toContain("StateGallery descendant id 'shared' in 'states' collides with another emitted id");
      expect(message).toContain("StateGallery descendant id 'canvas' in 'states' collides with another emitted id");
      expect(message).toContain("StateGallery descendant has unsafe id 'unsafe id' in 'states'");
      expect(message).toContain("StateGallery 'states' contains an id attribute without a value");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("ignores id-like text in raw HTML comments and quoted attributes", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-opaque-ids-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="shared">Authored block</Callout>
<StateGallery id="states">
<!-- <div id="shared"></div> -->
<div title="example id=shared > comparison"></div>
</StateGallery>
`);

      const plan = await loadPlanFolder(planDir);
      expect(plan.plan.blocks.map((block) => block.id)).toEqual(["shared", "states"]);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each([
    ["script", "const value = '<div id=\"shared\"></div>';"],
    ["style", "#example[id=\"shared\"] { color: red; }"],
    ["textarea", '<div id="shared"></div>'],
    ["title", '<div id="shared"></div>'],
    ["xmp", '<div id="shared"></div>'],
    ["iframe", '<div id="shared"></div>'],
    ["noembed", '<div id="shared"></div>'],
    ["noframes", '<div id="shared"></div>'],
  ])("matches HTML raw/RCDATA semantics for %s descendant ID inventory", async (tag, contents) => {
    const planDir = await mkdtemp(join(tmpdir(), `ve-ip-${tag}-ids-`));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="shared">Authored block</Callout>\n<StateGallery id="states">\n<${tag}>${contents}</${tag}>\n</StateGallery>\n`);

      const plan = await loadPlanFolder(planDir);

      expect(plan.plan.blocks.map((block) => block.id)).toEqual(["shared", "states"]);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test.each([
    ["script", "const value = '<div id=\"opaque\"></div>';"],
    ["style", "#example[id=\"opaque\"] { color: red; }"],
    ["textarea", '<div id="opaque"></div>'],
    ["title", '<div id="opaque"></div>'],
    ["xmp", '<div id="opaque"></div>'],
    ["iframe", '<div id="opaque"></div>'],
    ["noembed", '<div id="opaque"></div>'],
    ["noframes", '<div id="opaque"></div>'],
    ["plaintext", '<div id="opaque"></div>'],
  ])("matches final browser-document raw/RCDATA semantics for %s", (tag, contents) => {
    expect(validateRenderedHtmlIds(`<div id="live"></div><${tag}>${contents}</${tag}>`)).toEqual([]);
  });

  test.each([
    ["comment", "<!--"],
    ["iframe", "<iframe>"],
    ["noembed", "<noembed>"],
    ["noframes", "<noframes>"],
    ["plaintext", "<plaintext>"],
    ["script", '<script type="text/plain">'],
    ["style", "<style>"],
    ["textarea", "<textarea>"],
    ["title", "<title>"],
    ["xmp", "<xmp>"],
  ])("rejects unterminated %s state before raw fragments can swallow following blocks", async (context, opening) => {
    const planDir = await mkdtemp(join(tmpdir(), `ve-ip-unclosed-${context}-`));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<StateGallery id="states">\n${opening}<div id="hidden"></div>\n</StateGallery>\n<Tabs id="tabs">\nFirst\n---\nSecond\n</Tabs>\n`);
      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain(`StateGallery 'states' contains unterminated ${context}`);
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("requires every expected renderer ID to survive browser parsing exactly once", () => {
    const errors = validateRenderedHtmlIds(
      '<!doctype html><html><body><textarea><section id="required"></section></textarea></body></html>',
      ["required"],
    );

    expect(errors).toContain("Expected rendered HTML id 'required' to materialize exactly once; found 0");
  });

  test("validates IDs within light DOM, template, and declarative shadow scopes", () => {
    const scoped = '<div id="shared"></div><template><div id="shared"></div></template><section><template shadowrootmode="open"><div id="shared"></div></template></section>';
    expect(validateRenderedHtmlIds(scoped, ["shared"])).toEqual([]);
    expect(validateRenderedHtmlIds('<template><div id="duplicate"></div><div id="duplicate"></div></template>'))
      .toContain("Rendered HTML scope 'template 1' contains duplicate id 'duplicate'");
    expect(validateRenderedHtmlIds('<section><template shadowrootmode="open"><div id="duplicate"></div><div id="duplicate"></div></template></section>'))
      .toContain("Rendered HTML scope 'shadow root 1' contains duplicate id 'duplicate'");
  });

  test("applies scoped ID semantics while validating raw fragments", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-scoped-fragment-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), '<StateGallery id="states">\n<div id="shared"></div>\n<template><div id="shared"></div></template>\n<section><template shadowrootmode="open"><div id="shared"></div></template></section>\n</StateGallery>\n');
      expect((await loadPlanFolder(planDir)).plan.blocks.map(({ id }) => id)).toEqual(["states"]);

      await writeFile(join(planDir, "plan.mdx"), '<StateGallery id="states">\n<template><div id="duplicate"></div><div id="duplicate"></div></template>\n</StateGallery>\n');
      let message = "";
      try {
        await loadPlanFolder(planDir);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toContain("StateGallery 'states' template 1 contains duplicate id 'duplicate'");
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("rendering rejects expected IDs swallowed by shell tokenizer state", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-swallowed-render-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), '<Tabs id="tabs">\nFirst\n---\nSecond\n</Tabs>\n');
      const plan = await loadPlanFolder(planDir);
      const shell = '<!doctype html><html><body><textarea>{{CONTENT}}</textarea><script>{{CLIENT}}</script></body></html>';
      let message = "";
      try {
        await renderPlanHtml(plan, false, shell);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      for (const expectedId of ["tabs", "tabs-tab-0", "tabs-panel-0", "tabs-tab-1", "tabs-panel-1"]) {
        expect(message).toContain(`Expected rendered HTML id '${expectedId}' to materialize exactly once; found 0`);
      }
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("uses parsed document semantics for duplicate html and body start tags", () => {
    const html = '<!doctype html><html id="structure"><html id="structure"><body id="page"><body id="page"><main id="content"></main></body></html>';
    expect(validateRenderedHtmlIds(html, ["structure", "page", "content"])).toEqual([]);
  });

  test("audits only parsed HTML elements at the final rendered boundary", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-final-html-ids-"));
    try {
      await writeFile(join(planDir, "plan.mdx"), `<Callout id="shell-owned">Body</Callout>`);
      const plan = await loadPlanFolder(planDir);
      const shell = `<!doctype html><html><head><title><div id="title-id"></div></title><style>#example[id="style-id"] { color: red; }</style></head><body><!-- <div id="comment-id"></div> --><textarea><div id="textarea-id"></div></textarea><xmp><div id="xmp-id"></div></xmp><script>const example = '<div id="script-id"></div>';</script><header id="shell-owned"></header><div id></div><div id="unsafe id"></div>{{CONTENT}}<script>{{CLIENT}}</script></body></html>`;
      let message = "";
      try {
        await renderPlanHtml(plan, false, shell);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toContain("Rendered HTML contains duplicate id 'shell-owned'");
      expect(message).toContain("Rendered HTML contains empty id");
      expect(message).toContain("Rendered HTML contains unsafe id 'unsafe id'");
      for (const opaqueId of ["title-id", "style-id", "comment-id", "textarea-id", "xmp-id", "script-id"]) {
        expect(message).not.toContain(opaqueId);
      }
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("rejects duplicate ids across plan and canvas before rendering", async () => {
    let message = "";
    try {
      await loadPlanFolder(join(fixturesRoot, "invalid-cross-source-duplicates"));
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("Invalid plan source");
    expect(message).toContain("Duplicate MDX component id 'shared-block'");
    expect(message).toContain("Duplicate MDX component id 'shared-diagram'");
    expect(message).toContain("Duplicate MDX component id 'canvas'");
  });

  test.each(emittedIdCollisionCases)(
    "rejects $direction id collisions",
    async ({ planBlocks, canvasBlocks, emittedId }) => {
      const planDir = await mkdtemp(join(tmpdir(), "ve-ip-derived-id-collision-"));
      try {
        await writeFile(join(planDir, "plan.mdx"), planBlocks.join("\n\n"));
        if (canvasBlocks.length > 0) {
          await writeFile(join(planDir, "canvas.mdx"), canvasBlocks.join("\n\n"));
        }

        await expect(loadPlanFolder(planDir)).rejects.toThrow(`Duplicate rendered id '${emittedId}'`);
      } finally {
        await rm(planDir, { recursive: true, force: true });
      }
    },
  );
});

describe("interactive plan rendering", () => {
  test("renders the minimal fixture to interactive and static HTML with review chrome", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
      const indexHtml = await readFile(indexPath, "utf8");
      const staticHtml = await readFile(staticExportPath, "utf8");

      expect(indexPath.endsWith(join("dist", "index.html"))).toBe(true);
      expect(staticExportPath.endsWith(join("dist", "static-export.html"))).toBe(true);

      const vendoredFontFiles = (await readdir(fontAssetRoot)).filter((filename) => filename.endsWith(".woff2")).sort();
      expect(vendoredFontFiles).toEqual(Object.keys(expectedFontAssets).sort());

      const expectedNoticeManifest = {
        assets: Object.entries(expectedFontAssets).map(([asset, metadata]) => ({
          asset,
          package: metadata.package,
          version: metadata.version,
          notice: metadata.notice,
        })),
      };
      const sourceNoticeManifest = JSON.parse(await readFile(join(fontAssetRoot, "notices", "manifest.json"), "utf8"));
      const distributedNoticeManifest = JSON.parse(await readFile(join(planDir, "dist", "assets", "notices", "manifest.json"), "utf8"));
      expect(sourceNoticeManifest).toEqual(expectedNoticeManifest);
      expect(distributedNoticeManifest).toEqual(expectedNoticeManifest);

      for (const [filename, expectedMetadata] of Object.entries(expectedFontAssets)) {
        const assetPath = join(planDir, "dist", "assets", filename);
        const bytes = await readFile(assetPath);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(expectedMetadata.sha256);
        expect(createHash("sha384").update(bytes).digest("base64")).toBe(expectedMetadata.sha384);
        expect(indexHtml).toContain(`url("/assets/${filename}")`);

        const noticeMetadata = expectedFontNotices[expectedMetadata.notice];
        const sourceNotice = await readFile(join(fontAssetRoot, expectedMetadata.notice), "utf8");
        const distributedNotice = await readFile(join(planDir, "dist", "assets", expectedMetadata.notice), "utf8");
        expect(distributedNotice).toBe(sourceNotice);
        expect(createHash("sha256").update(sourceNotice).digest("hex")).toBe(noticeMetadata.sha256);
        expect(sourceNotice).toContain(noticeMetadata.copyright);
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
  test("scopes CommentAnchor title IDs to component explorer cards", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-comment-anchor-render-"));
    const source = '<CommentAnchor id="comment-target" />\n<Callout id="comment-target-title">Valid sibling</Callout>';
    try {
      await writeFile(join(planDir, "plan.mdx"), source);
      const plan = await loadPlanFolder(planDir);
      for (const staticMode of [false, true]) {
        const html = await renderPlanHtml(plan, staticMode);
        expect(html).toContain('id="comment-target"');
        expect(validateRenderedHtmlIds(html, ["comment-target", "comment-target-title", "comment-target-title-title"])).toEqual([]);
      }

      await writeFile(join(planDir, "visual-explainer.json"), JSON.stringify({ kind: "styleguide" }));
      const styleguide = await loadPlanFolder(planDir);
      for (const staticMode of [false, true]) {
        await expect(renderPlanHtml(styleguide, staticMode)).rejects.toThrow("Rendered HTML contains duplicate id 'comment-target-title'");
      }
    } finally {
      await rm(planDir, { recursive: true, force: true });
    }
  });

  test("renders explicit accessible readiness policies in interactive and static output", async () => {
    await withFixture("component-library-showcase", async (planDir) => {
      const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
      for (const html of [await readFile(indexPath, "utf8"), await readFile(staticExportPath, "utf8")]) {
        expect(html).toContain("data-readiness-policy=\"required\"");
        expect(html).toContain("data-readiness-policy=\"advisory\"");
        expect(html).toContain("class=\"ve-ip-readiness-policy ve-ip-readiness-policy--required\">Required</span>");
        expect(html).toContain("class=\"ve-ip-readiness-policy ve-ip-readiness-policy--advisory\">Advisory</span>");
      }
    });
  });

  test("renders review controls behind an explicit hydration authority gate", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const { indexPath, staticExportPath } = await renderPlanFolder(planDir);
      const indexHtml = await readFile(indexPath, "utf8");
      const staticHtml = await readFile(staticExportPath, "utf8");

      expect(indexHtml).toContain('data-review-authority="loading"');
      expect(indexHtml).toContain("Loading saved review");
      expect(indexHtml).toContain("Review controls unlock after server state and comments load.");
      expect(indexHtml).toMatch(/data-review-control[^>]*disabled|disabled[^>]*data-review-control/);
      expect(indexHtml).toContain('data-review-retry');

      expect(staticHtml).toContain('data-review-authority="static"');
      expect(staticHtml).not.toContain("Loading saved review");
    });
  });

  test("renders persistence feedback, readiness, and a human approval receipt", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const { indexPath } = await renderPlanFolder(planDir);
      const indexHtml = await readFile(indexPath, "utf8");

      expect(indexHtml).toContain('data-persistence-key="answer:runtime"');
      expect(indexHtml).toContain('data-persistence-key="checklist:schema"');
      expect(indexHtml).toContain('data-persistence-state="loading"');
      expect(indexHtml).toContain('data-persistence-retry');
      expect(indexHtml).toContain('data-operation-key="answer:runtime"');
      expect(indexHtml).toContain("Saving…");
      expect(indexHtml).toContain("Saved");
      expect(indexHtml).toContain("Save failed; saved value restored.");
      expect(indexHtml).toContain('data-approval-readiness');
      expect(indexHtml).toContain("Required values gate approval; advisory values are saved but never block it.");
      expect(indexHtml).toContain('data-approval-receipt');
      expect(indexHtml).toContain("Approval recorded");
      expect(indexHtml).toContain("agent-handoff.json");
      expect(indexHtml).toContain("agent-handoff.md");
      expect(indexHtml).toContain("Technical details");
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
    const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>.*?<\/button>/g)].map(([tag]) => tag);
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
      expect(tab).toContain(`>${["alpha.ts", "beta.ts", "gamma.ts"][index]}</button>`);
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

      const primaryTabs = [...document.querySelectorAll('#primary > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]')] as HappyHTMLElement[];
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
      primaryTabs[0].focus();
      orphan.click();
      expect(document.activeElement).toBe(primaryTabs[0]);
      orphan.remove();
      expectActiveTab(document, "primary", 0);

      primaryTabs[1].click();
      expect(document.activeElement).toBe(primaryTabs[0]);
      expectActiveTab(document, "primary", 1);
      expectActiveTab(document, "nested", 0);
      expectActiveTab(document, "secondary", 0);

      const nestedTabs = [...document.querySelectorAll('#nested > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]')] as HappyHTMLElement[];
      nestedTabs[1].click();
      expect(document.activeElement).toBe(primaryTabs[0]);
      expectActiveTab(document, "nested", 1);
      expectActiveTab(document, "primary", 1);
      expectActiveTab(document, "secondary", 0);
    } finally {
      window.close();
    }
  });
});

describe("generic table and Mermaid accessibility", () => {
  test.each(["ApiSurface", "DataModel", "Table"])("%s uses its first row as column headers", (type) => {
    const html = renderBlock({
      id: `${type.toLowerCase()}-test`,
      type,
      props: { title: `${type} test` },
      body: "Name | Type\nstatus | string",
    }, { staticMode: false });

    expect(html).toContain("<thead><tr><th scope=\"col\">Name</th><th scope=\"col\">Type</th></tr></thead>");
    expect(html).toContain("<tbody><tr><td>status</td><td>string</td></tr></tbody>");
  });

  test("generic tables remain valid with empty or header-only input", () => {
    const empty = renderBlock({
      id: "empty-table",
      type: "Table",
      props: { title: "Empty table" },
      body: "",
    }, { staticMode: false });
    const headerOnly = renderBlock({
      id: "header-only-table",
      type: "Table",
      props: { title: "Header-only table" },
      body: "Name | Type",
    }, { staticMode: false });

    expect(empty).toContain("<table><tbody></tbody></table>");
    expect(empty).not.toContain("<thead>");
    expect(headerOnly).toContain("<thead><tr><th scope=\"col\">Name</th><th scope=\"col\">Type</th></tr></thead><tbody></tbody>");
  });

  test.each([
    ["ApiSurface", "Endpoint | Method\n/api/state | POST | extra", 3, 2],
    ["DataModel", "Field | Type | Notes\nstatus | string", 2, 3],
    ["Table", "Name | Type\nstatus | string | extra", 3, 2],
  ])("%s rejects ragged row widths", (type, body, actualColumns, expectedColumns) => {
    expect(() => renderBlock({
      id: `${type.toLowerCase()}-ragged`,
      type,
      props: { title: `${type} ragged test` },
      body: String(body),
    }, { staticMode: false })).toThrow(
      `${type} '${type.toLowerCase()}-ragged' row 2 has ${actualColumns} columns; expected ${expectedColumns}`,
    );
  });

  test("diagram controls and viewport expose descriptive keyboard affordances", () => {
    const html = renderBlock({
      id: "keyboard-diagram",
      type: "ArchitectureDiagram",
      props: { title: "Keyboard diagram" },
      body: "flowchart LR\nA --> B",
    }, { staticMode: false });

    expect(html).toContain("aria-label=\"Zoom out\"");
    expect(html).toContain("aria-label=\"Reset zoom and position\"");
    expect(html).toContain("aria-label=\"Zoom in\"");
    expect(html).toContain("aria-label=\"Expand diagram\"");
    expect(html).toContain("tabindex=\"0\"");
    expect(html).toContain("aria-describedby=\"keyboard-diagram-instructions\"");
    expect(html).toContain("id=\"keyboard-diagram-instructions\"");
    expect(html).toContain("Use arrow keys to pan. Hold Ctrl or Command while scrolling to zoom");
  });

  test("focused diagram viewports pan through real focus and keyboard event dispatch", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    try {
      page.content = renderBlock({
        id: "keyboard-runtime-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Keyboard runtime diagram" },
        body: "flowchart LR\nA --> B",
      }, { staticMode: false });
      Object.assign(page.mainFrame.window, { Math, WeakMap });
      page.evaluate(staticPlanClientScript);
      const window = page.mainFrame.window;

      const viewport = queryHtml(window.document, ".mermaid-viewport");
      const canvas = queryHtml(window.document, ".mermaid-canvas");
      expect(viewport).not.toBeNull();
      expect(canvas).not.toBeNull();
      if (!viewport || !canvas) throw new Error("Rendered diagram is missing its viewport or canvas");

      viewport.focus();
      expect(window.document.activeElement).toBe(viewport);
      expect(canvas.style.transform).toBe("translate(0px, 0px) scale(1)");

      const right = new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      viewport.dispatchEvent(right);
      expect(right.defaultPrevented).toBe(true);
      expect(canvas.style.transform).toBe("translate(-40px, 0px) scale(1)");

      const down = new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      viewport.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);
      expect(canvas.style.transform).toBe("translate(-40px, -40px) scale(1)");

      for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
        const modifiedArrow = new window.KeyboardEvent("keydown", {
          key: "ArrowLeft",
          bubbles: true,
          cancelable: true,
          [modifier]: true,
        });
        viewport.dispatchEvent(modifiedArrow);
        expect(modifiedArrow.defaultPrevented).toBe(false);
        expect(canvas.style.transform).toBe("translate(-40px, -40px) scale(1)");
      }

      const unrelated = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      viewport.dispatchEvent(unrelated);
      expect(unrelated.defaultPrevented).toBe(false);
      expect(canvas.style.transform).toBe("translate(-40px, -40px) scale(1)");

      const input = window.document.createElement("input");
      viewport.appendChild(input);
      input.focus();
      expect(window.document.activeElement).toBe(input);
      const editableArrow = new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
      input.dispatchEvent(editableArrow);
      expect(editableArrow.defaultPrevented).toBe(false);
      expect(canvas.style.transform).toBe("translate(-40px, -40px) scale(1)");
    } finally {
      await browser.close();
    }
  });

  test("pointer drag, modified wheel zoom, and reset preserve expected default handling", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    try {
      page.content = renderBlock({
        id: "interaction-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Interaction diagram" },
        body: "flowchart LR\nA --> B",
      }, { staticMode: false });
      Object.assign(page.mainFrame.window, { Math, WeakMap });
      page.evaluate(staticPlanClientScript);
      const window = page.mainFrame.window;
      const viewport = queryHtml(window.document, ".mermaid-viewport");
      const canvas = queryHtml(window.document, ".mermaid-canvas");
      const reset = queryHtml(window.document, '[data-zoom="reset"]');
      if (!viewport || !canvas || !reset) throw new Error("Rendered diagram is missing interaction controls");
      Object.assign(viewport, { setPointerCapture() {} });

      const pointerDown = new window.PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        bubbles: true,
        cancelable: true,
      });
      viewport.dispatchEvent(pointerDown);
      const pointerMove = new window.PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 35,
        clientY: 55,
        bubbles: true,
        cancelable: true,
      });
      viewport.dispatchEvent(pointerMove);
      viewport.dispatchEvent(new window.PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
      expect(pointerDown.defaultPrevented).toBe(false);
      expect(pointerMove.defaultPrevented).toBe(false);
      expect(canvas.style.transform).toBe("translate(25px, 35px) scale(1)");

      const plainWheel = new window.Event("wheel", { bubbles: true, cancelable: true });
      Object.defineProperty(plainWheel, "deltaY", { value: -1 });
      viewport.dispatchEvent(plainWheel);
      expect(plainWheel.defaultPrevented).toBe(false);
      expect(canvas.style.transform).toBe("translate(25px, 35px) scale(1)");

      const ctrlWheel = new window.Event("wheel", { bubbles: true, cancelable: true });
      Object.defineProperties(ctrlWheel, {
        ctrlKey: { value: true },
        metaKey: { value: false },
        deltaY: { value: -1 },
      });
      viewport.dispatchEvent(ctrlWheel);
      expect(ctrlWheel.defaultPrevented).toBe(true);
      expect(canvas.style.transform).toBe("translate(25px, 35px) scale(1.1)");

      reset.click();
      expect(canvas.style.transform).toBe("translate(0px, 0px) scale(1)");
      expect(reset.textContent).toBe("100%");

      const metaWheel = new window.Event("wheel", { bubbles: true, cancelable: true });
      Object.defineProperties(metaWheel, {
        ctrlKey: { value: false },
        metaKey: { value: true },
        deltaY: { value: 1 },
      });
      viewport.dispatchEvent(metaWheel);
      expect(metaWheel.defaultPrevented).toBe(true);
      expect(canvas.style.transform).toBe("translate(0px, 0px) scale(0.9)");
    } finally {
      await browser.close();
    }
  });

  test("expand opens rendered SVG using the deterministic Mermaid render id", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    const writes: string[] = [];
    const renderIds: string[] = [];
    try {
      page.content = renderBlock({
        id: "expand-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Expand diagram" },
        body: "flowchart LR\nA --> B",
      }, { staticMode: false });
      Object.assign(page.mainFrame.window, {
        Array,
        Math,
        String,
        WeakMap,
        mermaid: {
          initialize() {},
          render(id: string) {
            renderIds.push(id);
            return Promise.resolve({ svg: '<svg data-expanded="true"></svg>' });
          },
        },
        open() {
          return {
            document: {
              write(value: string) { writes.push(value); },
              close() {},
            },
          };
        },
      });
      page.evaluate(staticPlanClientScript);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      queryHtml(page.mainFrame.window.document, "[data-expand]")?.click();
      expect(renderIds).toEqual(["ve-mermaid-expand-diagram"]);
      expect(writes).toHaveLength(1);
      expect(writes[0]).toContain('<svg data-expanded="true"></svg>');
      expect(writes[0]).toContain("<title>Muse diagram</title>");
    } finally {
      await browser.close();
    }
  });

  test("missing Mermaid runtime expands authored markup as inert source text", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    const writes: string[] = [];
    const source = "flowchart LR\nA --> <img id=\"fallback-injection\" alt=\"injected fallback\">";
    try {
      page.content = renderBlock({
        id: "fallback-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Fallback diagram" },
        body: source,
      }, { staticMode: false });
      Object.assign(page.mainFrame.window, {
        Math,
        WeakMap,
        open() {
          return {
            document: {
              write(value: string) { writes.push(value); },
              close() {},
            },
          };
        },
      });
      page.evaluate(staticPlanClientScript);

      const window = page.mainFrame.window;
      expect(window.document.querySelector(".mermaid-wrap")?.getAttribute("data-render-state")).toBe("missing-runtime");
      queryHtml(window.document, "[data-expand]")?.click();
      expect(writes).toHaveLength(1);
      expect(writes[0]).toContain("<pre");
      expect(writes[0]).toContain("&lt;img id=\"fallback-injection\" alt=\"injected fallback\"&gt;");
      expect(writes[0]).not.toContain("<img");
      expect(writes[0]).not.toContain("<svg");
    } finally {
      await browser.close();
    }
  });

  test("Mermaid errors preserve authored source without creating live markup", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    const malformedSource = "flowchart LR\nA --> <img data-authored-error>";
    try {
      page.content = renderBlock({
        id: "malformed-runtime-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Malformed runtime diagram" },
        body: malformedSource,
      }, { staticMode: false });
      Object.assign(page.mainFrame.window, {
        Array,
        Math,
        String,
        WeakMap,
        mermaid: {
          initialize() {},
          render(_id: string, source: string) {
            throw new Error(`Parse error near ${source}`);
          },
        },
      });
      page.evaluate(staticPlanClientScript);
      await Promise.resolve();
      await Promise.resolve();

      const window = page.mainFrame.window;
      const wrap = queryHtml(window.document, ".mermaid-wrap");
      const source = queryHtml(window.document, ".mermaid-source");
      const error = queryHtml(window.document, ".mermaid-error");
      expect(wrap?.getAttribute("data-render-state")).toBe("error");
      expect(source?.textContent?.trim()).toBe(malformedSource);
      expect(error?.textContent).toBe(`Parse error near ${malformedSource}`);
      expect(window.document.querySelector("[data-authored-error]")).toBeNull();
    } finally {
      await browser.close();
    }
  });

  test("theme transitions rerender Mermaid once with the stable theme while preserving transforms", async () => {
    const browser = new Browser();
    const page = browser.newPage();
    try {
      page.content = `<button type="button" data-theme-toggle><span data-theme-toggle-label></span></button>${renderBlock({
        id: "theme-runtime-diagram",
        type: "ArchitectureDiagram",
        props: { title: "Theme runtime diagram" },
        body: "flowchart LR\nA --> B",
      }, { staticMode: false })}`;
      const renderedColors: string[] = [];
      const pendingRenders: Array<() => void> = [];
      let initializedColor = "";
      Object.assign(page.mainFrame.window, {
        Array,
        Math,
        String,
        WeakMap,
        mermaid: {
          initialize(config: { themeVariables: { lineColor: string } }) {
            initializedColor = config.themeVariables.lineColor;
          },
          render() {
            const color = initializedColor;
            renderedColors.push(color);
            return new Promise<{ svg: string }>((resolve) => {
              pendingRenders.push(() => resolve({ svg: `<svg data-line-color="${color}"></svg>` }));
            });
          },
        },
      });
      const window = page.mainFrame.window;
      window.localStorage.setItem("ve-ip-theme", "light");
      const completeRender = async () => {
        await Promise.resolve();
        await Promise.resolve();
        expect(pendingRenders).toHaveLength(1);
        pendingRenders.shift()?.();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      };
      page.evaluate(staticPlanClientScript);
      await completeRender();

      const toggle = queryHtml(window.document, "[data-theme-toggle]");
      const zoomIn = queryHtml(window.document, '[data-zoom="in"]');
      const canvas = queryHtml(window.document, ".mermaid-canvas");
      const source = queryHtml(window.document, ".mermaid-source");
      expect(toggle).not.toBeNull();
      expect(zoomIn).not.toBeNull();
      expect(canvas).not.toBeNull();
      expect(source).not.toBeNull();
      if (!toggle || !zoomIn || !canvas) throw new Error("Rendered diagram is missing theme or zoom controls");

      zoomIn.click();
      const transform = canvas.style.transform;
      expect(canvas.querySelector("svg")?.getAttribute("data-line-color")).toBe("#278195");

      toggle.click();
      await completeRender();
      expect(window.document.documentElement.dataset.theme).toBe("dark");
      expect(canvas.querySelector("svg")?.getAttribute("data-line-color")).toBe("#66b9c9");
      expect(canvas.style.transform).toBe(transform);

      toggle.click();
      await completeRender();
      expect(window.document.documentElement.dataset.theme).toBe("light");
      expect(canvas.querySelector("svg")?.getAttribute("data-line-color")).toBe("#278195");
      expect(canvas.style.transform).toBe(transform);

      toggle.click();
      toggle.click();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      expect(pendingRenders).toHaveLength(0);
      expect(window.document.documentElement.dataset.theme).toBe("light");
      expect(canvas.querySelector("svg")?.getAttribute("data-line-color")).toBe("#278195");
      expect(canvas.style.transform).toBe(transform);
      expect(renderedColors).toEqual(["#278195", "#66b9c9", "#278195"]);
      expect(source?.textContent?.trim()).toBe("flowchart LR\nA --> B");
    } finally {
      await browser.close();
    }
  });
  test("embeds complete font notices in the single-file static export", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const { staticExportPath } = await renderPlanFolder(planDir);
      const staticHtml = await readFile(staticExportPath, "utf8");
      const shareScript = await readFile(join(repoRoot, "plugins", "Muse", "skills", "muse", "scripts", "share.sh"), "utf8");

      expect(staticHtml.match(/data:font\/woff2;base64,/g)).toHaveLength(Object.keys(expectedFontAssets).length);
      expect(staticHtml).not.toContain('url("/assets/');
      expect(staticHtml).toContain("<details");
      expect(staticHtml).toContain("Third-party font notices");

      for (const [notice, metadata] of Object.entries(expectedFontNotices)) {
        const noticeText = await readFile(join(fontAssetRoot, notice), "utf8");
        expect(staticHtml).toContain(escapeExpectedHtml(noticeText));
        expect(staticHtml).toContain(metadata.copyright.replaceAll("&", "&amp;"));
      }

      for (const [asset, metadata] of Object.entries(expectedFontAssets)) {
        expect(staticHtml).toContain(asset);
        expect(staticHtml).toContain(metadata.package);
        expect(staticHtml).toContain(metadata.version);
      }

      expect(shareScript).toContain('cp "$HTML_FILE" "$DEPLOY_DIR/index.html"');
      expect(shareScript).not.toMatch(/cp\s+(?:-[^\s]+\s+)*["']?\$HTML_FILE["']?\s+["']?\$DEPLOY_DIR\/assets/);
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

  async function openEvents(server: { port: number | undefined }): Promise<{
    response: Response;
    next: () => Promise<{ event: string; data: Record<string, unknown> }>;
    close: () => Promise<void>;
  }> {
    if (server.port === undefined) throw new Error("Test server did not bind a port");
    const response = await fetch(`http://localhost:${server.port}/api/events`);
    if (!response.body) throw new Error("SSE response did not expose a body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    return {
      response,
      async next() {
        while (true) {
          const boundary = buffer.indexOf("\n\n");
          if (boundary !== -1) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const event = frame.match(/^event: ([^\n]+)$/m)?.[1];
            const data = frame.match(/^data: ([^\n]+)$/m)?.[1];
            if (!event || !data) throw new Error(`Malformed SSE frame: ${frame}`);
            return { event, data: JSON.parse(data) as Record<string, unknown> };
          }
          const chunk = await reader.read();
          if (chunk.done) throw new Error("SSE stream closed before the expected event");
          buffer += decoder.decode(chunk.value, { stream: true });
        }
      },
      close: async () => {
        await reader.cancel();
      },
    };
  }

  async function nextPresence(
    events: { next: () => Promise<{ event: string; data: Record<string, unknown> }> },
    presence: string,
  ): Promise<void> {
    for (;;) {
      const event = await events.next();
      if (event.event === "presence" && event.data.presence === presence) return;
    }
  }

  async function reviewGeneration(server: { port: number | undefined }): Promise<string> {
    if (server.port === undefined) throw new Error("Test server did not bind a port");
    const response = await fetch(`http://localhost:${server.port}/plan-state.json`);
    const generation = response.headers.get("x-muse-review-generation");
    if (!generation) throw new Error("Review state did not expose its generation");
    return generation;
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

  test("wakes one long-poll with the next generation and broadcasts presence", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      const events = await openEvents(server);
      try {
        const generation = await reviewGeneration(server);
        expect((await events.next()).data.presence).toBe("waiting");

        const wait = fetch(`http://localhost:${server.port}/api/wait?since=${generation}`);
        await nextPresence(events, "listening");
        const mutation = await post(server, "/api/comments", {
          id: "c-live-loop",
          blockId: "summary",
          body: "Wake the waiting agent.",
        });
        expect(mutation.ok).toBe(true);
        const update = await events.next();
        expect(update.event).toBe("review-update");
        expect(typeof update.data.generation).toBe("string");
        await nextPresence(events, "working");

        const response = await wait;
        expect(response.ok).toBe(true);
        const responseText = await response.text();
        const body = JSON.parse(responseText) as { generation: string; state: Record<string, unknown>; comments: unknown[] };
        expect(typeof body.generation).toBe("string");
        expect(body.state.unresolvedCommentIds).toEqual(["c-live-loop"]);
        expect(body.comments).toEqual([expect.objectContaining({ id: "c-live-loop", status: "open" })]);
        expect(body.generation).not.toBe(generation);

        const repark = fetch(`http://localhost:${server.port}/api/wait?since=${body.generation}`);
        await nextPresence(events, "listening");
        repark.catch(() => undefined);
      } finally {
        await events.close();
        server.stop(true);
      }
    });
  });

  test("wakes every matching waiter and rejects the 65th waiter", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        const generation = await reviewGeneration(server);
        const waitControllers = Array.from({ length: MAX_REVIEW_WAITERS }, () => new AbortController());
        const waits = waitControllers.map((controller) => fetch(
          `http://localhost:${server.port}/api/wait?since=${generation}`,
          { signal: controller.signal },
        ));
        await new Promise((resolve) => setTimeout(resolve, 25));

        const limited = await fetch(`http://localhost:${server.port}/api/wait?since=${generation}`);
        expect(limited.status).toBe(503);

        const mutation = await post(server, "/api/state", { answers: { live: "fan-out" } });
        expect(mutation.ok).toBe(true);
        const responses = await Promise.all(waits);
        expect(responses.every((response) => response.ok)).toBe(true);
        expect((await Promise.all(responses.map((response) => response.json()))).every((body) => body.generation !== generation)).toBe(true);
      } finally {
        server.stop(true);
      }
    });
  });

  test("returns stale generations immediately and releases parked waits on shutdown", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        const stale = await reviewGeneration(server);
        const mutation = await post(server, "/api/state", { answers: { stale: "advanced" } });
        expect(mutation.ok).toBe(true);
        const started = performance.now();
        const current = await fetch(`http://localhost:${server.port}/api/wait?since=${stale}`);
        expect(current.ok).toBe(true);
        expect(performance.now() - started).toBeLessThan(500);
        const currentBody = await current.json();
        expect(currentBody.generation).not.toBe(stale);

        const parkedGeneration = currentBody.generation as string;
        const parked = fetch(`http://localhost:${server.port}/api/wait?since=${parkedGeneration}`);
        const settledPromise = Promise.race([
          parked.then((response) => `response:${response.status}`).catch(() => "closed"),
          new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 500)),
        ]);
        await new Promise((resolve) => setTimeout(resolve, 25));
        server.stop(true);
        const settled = await settledPromise;
        expect(settled).not.toBe("timeout");
      } finally {
        server.stop(true);
      }
    });
  });

  test("serves complete hydration truth across approval and revision transitions", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await updateReviewState(planDir, {
        answers: { runtime: "Bun" },
        checklist: { schema: true },
      });
      await addComment(planDir, {
        id: "c-hydration",
        blockId: "summary",
        body: "Confirm this state reloads before approval.",
      });
      const server = await servePlan(planDir, 0);
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const stateUrl = `http://localhost:${server.port}/plan-state.json`;
        const commentsUrl = `http://localhost:${server.port}/comments.json`;

        expect(await (await fetch(stateUrl)).json()).toEqual({
          status: "draft",
          answers: { runtime: "Bun" },
          checklist: { schema: true },
          unresolvedCommentIds: ["c-hydration"],
        });
        expect(await (await fetch(commentsUrl)).json()).toEqual([
          expect.objectContaining({ id: "c-hydration", status: "open" }),
        ]);

        expect((await post(server, "/api/comments", { resolveId: "c-hydration" })).ok).toBe(true);
        const approvalResponse = await post(server, "/api/approve", { reviewer: "hydration-reviewer" });
        expect(approvalResponse.ok).toBe(true);
        const handoff = await approvalResponse.json();
        expect(handoff).toMatchObject({
          status: "approved",
          planSlug: "minimal-plan",
          approvedAt: expect.any(String),
          approvalDigest: expect.any(String),
        });

        expect(await (await fetch(stateUrl)).json()).toMatchObject({
          status: "approved",
          reviewer: "hydration-reviewer",
          approvedAt: handoff.approvedAt,
          approvalDigest: handoff.approvalDigest,
          answers: { runtime: "Bun" },
          checklist: { schema: true },
          unresolvedCommentIds: [],
        });

        const revisionResponse = await post(server, "/api/state", {
          status: "needs_revision",
          answers: { runtime: "Bun with Vite Plus" },
        });
        expect(revisionResponse.ok).toBe(true);
        expect(await (await fetch(stateUrl)).json()).toEqual({
          status: "needs_revision",
          answers: { runtime: "Bun with Vite Plus" },
          checklist: { schema: true },
          unresolvedCommentIds: [],
        });
      } finally {
        server.stop(true);
      }
    });
  });

  test("keeps review authority loading until interleaved hydration reads agree", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await updateReviewState(planDir, {
        answers: { runtime: "Bun" },
        checklist: { schema: true },
      });
      const staleState = await readReviewState(planDir);
      await addComment(planDir, {
        id: "c-interleaved-hydration",
        blockId: "summary",
        body: "Concurrent blocking comment.",
      });
      const server = await servePlan(planDir, 0);
      let window: Window | undefined;
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const baseUrl = `http://localhost:${server.port}/`;
        const html = await (await fetch(baseUrl)).text();
        let stateReads = 0;
        const secondStateRead = Promise.withResolvers<void>();
        const coherentStateReleased = Promise.withResolvers<void>();
        const clientFetch: ClientFetch = async (url, init) => {
          const requestUrl = new URL(url, baseUrl);
          if (requestUrl.pathname === "/plan-state.json") {
            stateReads += 1;
            if (stateReads === 1) return Response.json(staleState);
            if (stateReads === 2) {
              secondStateRead.resolve();
              await coherentStateReleased.promise;
            }
          }
          return fetch(requestUrl, init);
        };

        const tracker = trackClientFetch(baseUrl, clientFetch);
        window = installReviewClient(html, baseUrl, tracker.fetch);
        await settleClientRequests(tracker, 2);
        expect(window.document.body.dataset.reviewAuthority).toBe("loading");
        expect(window.document.querySelector("[data-approve-plan]")?.hasAttribute("disabled")).toBe(true);

        await secondStateRead.promise;
        coherentStateReleased.resolve();
        await settleClientRequests(tracker, 4);
        expect(window.document.body.dataset.reviewAuthority).toBe("ready");

        expect(window.document.querySelector("[data-review-comments]")?.textContent).toContain("Concurrent blocking comment. — Blocking");
        expect(window.document.querySelector("[data-approval-readiness]")?.textContent).toBe("Not ready: 1 unresolved blocking comment.");
        expect(window.document.querySelector("[data-approval-readiness]")?.getAttribute("data-ready")).toBe("false");
        expect(window.document.querySelector("[data-approve-plan]")?.hasAttribute("disabled")).toBe(true);
      } finally {
        window?.close();
        server.stop(true);
      }
    });
  });

  test("rejects stale ready state when a required answer changed without changing comments", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await updateReviewState(planDir, {
        answers: { runtime: "Bun" },
        checklist: { schema: true },
      });
      const staleState = await readReviewState(planDir);
      const staleGeneration = (await readlink(join(planDir, ".muse-review", "current"))).split("/").at(-1)!;
      await updateReviewState(planDir, { answers: { runtime: "" } });
      const server = await servePlan(planDir, 0);
      let window: Window | undefined;
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const baseUrl = `http://localhost:${server.port}/`;
        const html = await (await fetch(baseUrl)).text();
        let stateReads = 0;
        const secondStateRead = Promise.withResolvers<void>();
        const coherentStateReleased = Promise.withResolvers<void>();
        const clientFetch: ClientFetch = async (url, init) => {
          const requestUrl = new URL(url, baseUrl);
          if (requestUrl.pathname === "/plan-state.json") {
            stateReads += 1;
            if (stateReads === 1) {
              return Response.json(staleState, {
                headers: { "x-muse-review-generation": staleGeneration },
              });
            }
            if (stateReads === 2) {
              secondStateRead.resolve();
              await coherentStateReleased.promise;
            }
          }
          return fetch(requestUrl, init);
        };

        const tracker = trackClientFetch(baseUrl, clientFetch);
        window = installReviewClient(html, baseUrl, tracker.fetch);
        await settleClientRequests(tracker, 2);
        expect(window.document.body.dataset.reviewAuthority).toBe("loading");
        expect(window.document.querySelector("[data-approve-plan]")?.hasAttribute("disabled")).toBe(true);

        await secondStateRead.promise;
        coherentStateReleased.resolve();
        await settleClientRequests(tracker, 4);
        expect(window.document.body.dataset.reviewAuthority).toBe("ready");

        const readiness = window.document.querySelector("[data-approval-readiness]");
        expect(readiness?.textContent).toBe("Not ready: 1 required value missing.");
        expect(readiness?.getAttribute("data-ready")).toBe("false");
        expect(window.document.querySelector("[data-approve-plan]")?.hasAttribute("disabled")).toBe(true);
        const approvalResponse = await post(server, "/api/approve", { reviewer: "stale-answer-contract" });
        expect(approvalResponse.status).toBe(422);
        expect(await approvalResponse.text()).toMatch(/required question 'runtime' must be answered/i);
      } finally {
        window?.close();
        server.stop(true);
      }
    });
  });

  test("retries failed answer and checklist writes and reconciles coherent server truth", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await updateReviewState(planDir, {
        answers: { runtime: "Committed runtime" },
        checklist: { schema: false },
      });
      const server = await servePlan(planDir, 0);
      let window: Window | undefined;
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const baseUrl = `http://localhost:${server.port}/`;
        let answerWrites = 0;
        let checklistWrites = 0;
        const clientFetch: ClientFetch = async (url, init) => {
          const requestUrl = new URL(url, baseUrl);
          if (requestUrl.pathname === "/api/state" && init?.method === "POST") {
            const patch = JSON.parse(String(init.body)) as Partial<ReviewState>;
            if (patch.answers && answerWrites++ === 0) {
              return new Response("Injected answer write failure", { status: 503 });
            }
            if (patch.checklist && checklistWrites++ === 0) {
              return new Response("Injected checklist write failure", { status: 503 });
            }
          }
          return fetch(requestUrl, init);
        };
        const tracker = trackClientFetch(baseUrl, clientFetch);
        window = installReviewClient(await (await fetch(baseUrl)).text(), baseUrl, tracker.fetch);
        await settleClientRequests(tracker, 2);

        const answer = window.document.querySelector('[data-plan-questions] input[name="runtime"]') as HappyHTMLInputElement;
        const answerFeedback = queryHtml(window.document, '[data-persistence-key="answer:runtime"]')!;
        answer.value = "Retried runtime";
        answer.dispatchEvent(new window.Event("change", { bubbles: true }));
        expect(answerFeedback.dataset.persistenceState).toBe("pending");
        expect(answerFeedback.querySelector("[data-persistence-message]")?.textContent).toBe("Saving…");

        await settleClientRequests(tracker, 5);
        expect(answer.value).toBe("Committed runtime");
        expect((await readReviewState(planDir)).answers.runtime).toBe("Committed runtime");
        expect(answerFeedback.querySelector("[data-persistence-message]")?.textContent).toContain("Injected answer write failure");
        expect(queryHtml(window.document, '[data-persistence-key="answer:runtime"] [data-persistence-retry]')?.hidden).toBe(false);

        await addComment(planDir, {
          id: "c-concurrent-retry",
          blockId: "summary",
          body: "Concurrent blocker added before retry.",
        });
        clickReviewControl(window, '[data-persistence-key="answer:runtime"] [data-persistence-retry]');
        expect(answerFeedback.dataset.persistenceState).toBe("pending");
        await settleClientRequests(tracker, 8);
        expect((await readReviewState(planDir)).answers.runtime).toBe("Retried runtime");
        expect(answer.value).toBe("Retried runtime");
        expect(window.document.querySelector("[data-review-comments]")?.textContent).toContain("Concurrent blocker added before retry. — Blocking");
        expect(window.document.querySelector("[data-approval-readiness]")?.textContent).toContain("1 unresolved blocking comment");

        const checklist = window.document.querySelector('[data-checklist-id="schema"]') as HappyHTMLInputElement;
        const checklistFeedback = queryHtml(window.document, '[data-persistence-key="checklist:schema"]')!;
        checklist.checked = true;
        checklist.dispatchEvent(new window.Event("change", { bubbles: true }));
        expect(checklistFeedback.dataset.persistenceState).toBe("pending");
        expect(checklistFeedback.querySelector("[data-persistence-message]")?.textContent).toBe("Saving…");

        await settleClientRequests(tracker, 11);
        expect(checklist.checked).toBe(false);
        expect((await readReviewState(planDir)).checklist.schema).toBe(false);
        expect(checklistFeedback.querySelector("[data-persistence-message]")?.textContent).toContain("Injected checklist write failure");
        expect(queryHtml(window.document, '[data-persistence-key="checklist:schema"] [data-persistence-retry]')?.hidden).toBe(false);

        clickReviewControl(window, '[data-persistence-key="checklist:schema"] [data-persistence-retry]');
        expect(checklistFeedback.dataset.persistenceState).toBe("pending");
        await settleClientRequests(tracker, 14);
        expect((await readReviewState(planDir)).checklist.schema).toBe(true);
        expect(checklist.checked).toBe(true);
        expect(answerWrites).toBe(2);
        expect(checklistWrites).toBe(2);
      } finally {
        window?.close();
        server.stop(true);
      }
    });
  });

  test("updates the review sync banner after every canonical mutation", async () => {
    await withFixture("component-library-showcase", async (planDir) => {
      await updateReviewState(planDir, {
        answers: { palette: "Keep the restrained palette." },
        checklist: { "all-components": true },
      });
      const server = await servePlan(planDir, 0);
      let window: Window | undefined;
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const baseUrl = `http://localhost:${server.port}/`;
        const html = await (await fetch(baseUrl)).text();
        const tracker = trackClientFetch(baseUrl);
        window = installReviewClient(html, baseUrl, tracker.fetch, () => "Canonical blocker");
        const detail = () => window?.document.querySelector("[data-review-sync-detail]")?.textContent;
        await settleClientRequests(tracker, 2);
        expect(detail()).toBe("Draft · 0 unresolved blocking comments");

        clickReviewControl(window, '[data-comment-anchor="component-anchor"]');
        await settleClientRequests(tracker, 5);
        expect(detail()).toBe("Draft · 1 unresolved blocking comment");

        clickReviewControl(window, "[data-resolve-comment]");
        await settleClientRequests(tracker, 8);
        expect(detail()).toBe("Draft · 0 unresolved blocking comments");

        clickReviewControl(window, "[data-needs-revision]");
        await settleClientRequests(tracker, 11);
        expect(detail()).toBe("Needs Revision · 0 unresolved blocking comments");

        clickReviewControl(window, "[data-approve-plan]");
        await settleClientRequests(tracker, 14);
        expect(detail()).toBe("Approved · 0 unresolved blocking comments");
      } finally {
        window?.close();
        server.stop(true);
      }
    });
  });

  test("keeps visible readiness aligned with the approval 422 gate", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      await updateReviewState(planDir, {
        answers: { runtime: "Bun" },
        checklist: { schema: true },
      });
      await addComment(planDir, {
        id: "c-approval-gate",
        blockId: "summary",
        body: "Block approval.",
      });
      const server = await servePlan(planDir, 0);
      let window: Window | undefined;
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const baseUrl = `http://localhost:${server.port}/`;
        const tracker = trackClientFetch(baseUrl);
        window = installReviewClient(await (await fetch(baseUrl)).text(), baseUrl, tracker.fetch);
        await settleClientRequests(tracker, 2);
        expect(window.document.body.dataset.reviewAuthority).toBe("ready");

        const readiness = window.document.querySelector("[data-approval-readiness]");
        expect(readiness?.getAttribute("data-ready")).toBe("false");
        expect(readiness?.textContent).toBe("Not ready: 1 unresolved blocking comment.");
        expect(window.document.querySelector("[data-approve-plan]")?.hasAttribute("disabled")).toBe(true);
        const response = await post(server, "/api/approve", { reviewer: "browser-contract" });
        expect(response.status).toBe(422);
        expect(await response.text()).toMatch(/unresolved blocking comments/i);
      } finally {
        window?.close();
        server.stop(true);
      }
    });
  });

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

  test("replays comment creation without changing the committed snapshot", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const input = {
        id: "c-stable-request",
        blockId: "summary",
        anchor: "scope",
        body: "Keep this comment exactly once.",
      };
      const first = await addComment(planDir, input);
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const committedTarget = await readlink(pointer);
      const committedBytes = await Promise.all(
        ["plan-state.json", "comments.json"].map((file) => readFile(join(store, committedTarget, file))),
      );

      const [sequential, concurrentA, concurrentB] = await Promise.all([
        addComment(planDir, input),
        addComment(planDir, input),
        addComment(planDir, input),
      ]);

      expect(sequential).toEqual(first);
      expect(concurrentA).toEqual(first);
      expect(concurrentB).toEqual(first);
      expect(await readComments(planDir)).toEqual([first]);
      expect(await readlink(pointer)).toBe(committedTarget);
      expect(await Promise.all(
        ["plan-state.json", "comments.json"].map((file) => readFile(join(store, committedTarget, file))),
      )).toEqual(committedBytes);
      await expect(addComment(planDir, { ...input, body: "Different payload." })).rejects.toMatchObject({
        failure: "conflict",
      });
      expect(await readlink(pointer)).toBe(committedTarget);
    });
  });


  test("validates comment payloads at the exported state-store boundary", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      for (const input of [
        { blockId: "", body: "Body" },
        { blockId: "summary", body: "" },
        { blockId: "summary", body: "Body", anchor: "" },
        { blockId: "missing-block", body: "Body" },
      ]) {
        await expect(addComment(planDir, input)).rejects.toThrow(/blockId|body|anchor|block/i);
      }
      expect(await readComments(planDir)).toEqual([]);
    });
  });

  test("rejects noncanonical or reversed comment timestamps", async () => {
    for (const timestamps of [
      { createdAt: "2026-07-01" },
      { createdAt: "2026-07-01T12:00:00.000Z", resolvedAt: "2026-07-01T11:59:59.999Z" },
      { createdAt: "2026-07-01T12:00:00Z", resolvedAt: "2026-07-01T12:00:01.000Z" },
    ]) {
      await withFixture("minimal-plan", async (planDir) => {
        await writeFile(join(planDir, "comments.json"), JSON.stringify([{
          id: "c-invalid-time",
          blockId: "summary",
          body: "Timestamp validation",
          status: timestamps.resolvedAt ? "resolved" : "open",
          ...timestamps,
        }]));
        await expect(readComments(planDir)).rejects.toThrow(/timestamp|resolved/i);
      });
    }
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
      const originalSymlink = fs.symlink;
      spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
        if (String(path) === join(planDir, "comments.json")) throw new Error("compatibility link failure");
        return originalSymlink(target, path, type);
      });

      await expect(readReviewState(planDir)).rejects.toThrow("compatibility link failure");
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
      const originalSymlink = fs.symlink;
      spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
        if (String(path) === join(planDir, "comments.json")) throw new Error("compatibility link failure");
        return originalSymlink(target, path, type);
      });

      await expect(readReviewState(planDir)).rejects.toThrow("compatibility link failure");
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
      const originalRename = fs.rename;
      let raced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (!raced && String(from) === statePath && String(to).endsWith(".legacy")) {
          raced = true;
          await writeFile(statePath, `${JSON.stringify({ ...state, answers: { operator: "concurrent edit" } }, null, 2)}\n`);
        }
        return originalRename(from, to);
      });

      expect((await readReviewState(planDir)).answers.operator).toBe("concurrent edit");
      expect(await readlink(statePath)).toBe(".muse-review/current/plan-state.json");
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);
    });
  });
  test("retries when an operator creates a compatibility successor in the final install window", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      const captured = {
        status: "in_review",
        answers: { operator: "captured" },
        checklist: {},
        unresolvedCommentIds: [],
      };
      const successor = { ...captured, answers: { operator: "final-window successor" } };
      await writeFile(statePath, `${JSON.stringify(captured, null, 2)}\n`);
      const originalSymlink = fs.symlink;
      let raced = false;
      spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
        if (!raced && String(path) === statePath) {
          raced = true;
          await writeFile(statePath, `${JSON.stringify(successor, null, 2)}\n`, { flag: "wx" });
        }
        return originalSymlink(target, path, type);
      });

      expect((await readReviewState(planDir)).answers.operator).toBe("final-window successor");
      expect(await readlink(statePath)).toBe(".muse-review/current/plan-state.json");
    });
  });

  test("rolls back current and compatibility paths when marker publication fails after writing", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      const legacyState = `${JSON.stringify({
        status: "in_review",
        answers: { retained: "legacy" },
        checklist: {},
        unresolvedCommentIds: [],
      }, null, 2)}\n`;
      await writeFile(statePath, legacyState);
      const marker = join(planDir, ".muse-review", "initialized");
      const originalWriteFile = fs.writeFile;
      spyOn(fs, "writeFile").mockImplementation(async (path, data, options) => {
        const result = await originalWriteFile(path, data, options);
        if (String(path) === marker) throw new Error("marker publication failure");
        return result;
      });

      await expect(readReviewState(planDir)).rejects.toThrow("marker publication failure");

      expect(await readFile(statePath, "utf8")).toBe(legacyState);
      expect((await lstat(statePath)).isFile()).toBe(true);
      await expect(lstat(join(planDir, ".muse-review", "current"))).rejects.toThrow();
      await expect(lstat(marker)).rejects.toThrow();
    });
  });

  test("does not overwrite an operator successor created during compatibility rollback", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      const commentsPath = join(planDir, "comments.json");
      const legacyState = `${JSON.stringify({
        status: "in_review",
        answers: { retained: "legacy" },
        checklist: {},
        unresolvedCommentIds: [],
      }, null, 2)}\n`;
      const operatorState = `${JSON.stringify({
        status: "in_review",
        answers: { operator: "rollback successor" },
        checklist: {},
        unresolvedCommentIds: [],
      }, null, 2)}\n`;
      await writeFile(statePath, legacyState);
      await writeFile(commentsPath, "[]\n");
      const originalRename = fs.rename;
      const originalSymlink = fs.symlink;
      let raced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (!raced && String(from) === statePath && String(to).endsWith(".rollback")) {
          raced = true;
          await writeFile(statePath, operatorState, { flag: "wx" });
        }
        return result;
      });
      spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
        if (String(path) === commentsPath) throw new Error("force compatibility rollback");
        return originalSymlink(target, path, type);
      });

      await expect(readReviewState(planDir)).rejects.toThrow(/rollback was incomplete|ambiguous generations/i);

      expect(await readFile(statePath, "utf8")).toBe(operatorState);
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
  test("never serves JSON-only or Markdown-only handoff tampering", async () => {
    for (const tamperedFile of ["agent-handoff.json", "agent-handoff.md"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        await approvePlan(planDir, "tester");
        const bundle = await currentBundlePath(planDir);
        const tamperedPath = join(bundle, tamperedFile);
        if (tamperedFile === "agent-handoff.json") {
          const handoff = JSON.parse(await readFile(tamperedPath, "utf8")) as AgentHandoff;
          await writeFile(tamperedPath, `${JSON.stringify({ ...handoff, planSlug: "forged-plan" }, null, 2)}\n`);
        } else {
          const markdown = await readFile(tamperedPath, "utf8");
          await writeFile(tamperedPath, `${markdown}\nforged-plan\n`);
        }

        for (const artifact of ["agent-handoff.json", "agent-handoff.md"] as const) {
          await expect(readPublishedArtifact(planDir, artifact)).rejects.toThrow(/coherent approved handoff/i);
        }

        const server = await servePlan(planDir, 0);
        try {
          for (const artifact of ["agent-handoff.json", "agent-handoff.md"] as const) {
            const response = await fetch(`http://localhost:${server.port}/${artifact}`);
            expect(response.status).toBe(404);
            expect(await response.text()).not.toContain("forged-plan");
          }
        } finally {
          server.stop(true);
        }
      });
    }
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

  test("reads canonical current targets represented with Windows separators", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "tester");
      const current = join(planDir, ".muse-review", "current");
      const target = await readlink(current);
      await replaceSymlink(current, target.replace("/", "\\"));

      expect((await readReviewState(planDir)).status).toBe("approved");
    });
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
      await expect(addComment(planDir, { id: first.id, blockId: "summary", body: "Duplicate" })).rejects.toMatchObject({ failure: "conflict" });
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

  test("rejects orphaned legacy comments before cold initialization", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const statePath = join(planDir, "plan-state.json");
      const commentsPath = join(planDir, "comments.json");
      const stateBytes = `${JSON.stringify({
        status: "in_review",
        answers: {},
        checklist: {},
        unresolvedCommentIds: ["c-orphan"],
      }, null, 2)}\n`;
      const commentBytes = `${JSON.stringify([{
        id: "c-orphan",
        blockId: "removed-block",
        body: "Orphan blocker",
        status: "open",
        createdAt: "2026-07-01T12:00:00.000Z",
      }], null, 2)}\n`;
      await writeFile(statePath, stateBytes);
      await writeFile(commentsPath, commentBytes);

      await expect(readReviewState(planDir)).rejects.toThrow(/persisted comment.*unknown blockId/i);

      expect(await Bun.file(join(planDir, ".muse-review")).exists()).toBe(false);
      expect(await readFile(statePath, "utf8")).toBe(stateBytes);
      expect(await readFile(commentsPath, "utf8")).toBe(commentBytes);
    });
  });

  test("rejects orphaned comments in the current generation without publication", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await readReviewState(planDir);
      const pointer = join(planDir, ".muse-review", "current");
      const target = await readlink(pointer);
      const commentsPath = join(planDir, ".muse-review", target, "comments.json");
      const commentBytes = `${JSON.stringify([{
        id: "c-current-orphan",
        blockId: "removed-block",
        body: "Current orphan blocker",
        status: "open",
        createdAt: "2026-07-01T12:00:00.000Z",
      }], null, 2)}\n`;
      await writeFile(commentsPath, commentBytes);

      await expect(readComments(planDir)).rejects.toThrow(/persisted comment.*unknown blockId/i);

      expect(await readlink(pointer)).toBe(target);
      expect(await readFile(commentsPath, "utf8")).toBe(commentBytes);
    });
  });

  test("returns 422 for a cold unknown comment block without creating review state", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        const response = await post(server, "/api/comments", {
          id: "c-cold-unknown",
          blockId: "removed-block",
          body: "Must fail before initialization",
        });
        expect(response.status).toBe(422);
        expect(await response.text()).toMatch(/unknown comment blockId/i);
        expect(await Bun.file(join(planDir, ".muse-review")).exists()).toBe(false);
      } finally {
        server.stop(true);
      }
    });
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

  test("locks the canonical plan directory despite legacy lock-file replacement", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const legacyLockPath = join(planDir, ".muse-review.lock");
      await writeFile(legacyLockPath, "legacy lock\n");
      const first = await acquirePlanLock(planDir);
      await rm(legacyLockPath);
      await writeFile(legacyLockPath, "replacement lock\n");
      await expect(first.assertOwned()).rejects.toThrow(/lock path generation changed/i);
      const contender = Bun.spawn([
        process.execPath,
        join(repoRoot, "tests", "helpers", "review-lock-owner.ts"),
        planDir,
        "--signal-attempt",
      ], { cwd: repoRoot, stdout: "pipe" });
      const output = contender.stdout.getReader();
      const attempted = await output.read();
      expect(new TextDecoder().decode(attempted.value)).toContain("attempting");

      await first.release();
      const acquired = await output.read();
      expect(new TextDecoder().decode(acquired.value)).toContain("ready");
      contender.kill();
      await contender.exited;
      expect(await readFile(legacyLockPath, "utf8")).toBe("replacement lock\n");
    });
  });
  test("keeps one legacy descriptor while waiting and fails closed after pathname replacement", async () => {
    if (process.platform === "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const legacyLockPath = join(planDir, ".muse-review.lock");
      const dataPath = join(planDir, "legacy-generation-writes.json");
      await writeFile(legacyLockPath, "parent generation\n");
      await writeFile(dataPath, "[]\n");
      const parent = Bun.spawn([
        process.execPath,
        join(repoRoot, "tests", "helpers", "parent-review-process.ts"),
        planDir,
        "--controlled-write",
        dataPath,
        "parent",
      ], { cwd: repoRoot, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
      const [parentSignal, parentCapture] = parent.stdout.tee();
      expect(new TextDecoder().decode((await parentSignal.getReader().read()).value)).toContain("acquired");

      const current = Bun.spawn([
        process.execPath,
        join(repoRoot, "tests", "helpers", "review-lock-owner.ts"),
        planDir,
        "--signal-write",
        dataPath,
        "current",
      ], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
      const [currentSignal, currentCapture] = current.stdout.tee();
      expect(new TextDecoder().decode((await currentSignal.getReader().read()).value)).toContain("attempting");

      // A real delay is required to let the child bind the parent-held OS descriptor before pathname replacement.
      await Bun.sleep(25);
      await rm(legacyLockPath);
      await writeFile(legacyLockPath, "replacement generation\n");
      parent.stdin.write("release\n");
      await parent.stdin.end();

      expect(await parent.exited).toBe(0);
      expect(await current.exited).not.toBe(0);
      expect(await new Response(parentCapture).text()).toContain("acknowledged");
      const currentOutput = await new Response(currentCapture).text();
      expect(currentOutput).not.toContain("ready");
      expect(currentOutput).not.toContain("acknowledged");
      expect(JSON.parse(await readFile(dataPath, "utf8"))).toEqual(["parent"]);
      expect(await readFile(legacyLockPath, "utf8")).toBe("replacement generation\n");
    });
  });

  test("bounds the parent-after-rebind threat while the current directory lock remains held", async () => {
    if (process.platform === "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const legacyLockPath = join(planDir, ".muse-review.lock");
      const dataPath = join(planDir, "parent-after-rebind-writes.json");
      await writeFile(legacyLockPath, "current generation\n");
      await writeFile(dataPath, "[]\n");
      const current = await acquirePlanLock(planDir);
      await rm(legacyLockPath);
      await writeFile(legacyLockPath, "parent replacement\n");

      const parent = Bun.spawn([
        process.execPath,
        join(repoRoot, "tests", "helpers", "parent-review-process.ts"),
        planDir,
        "--write",
        dataPath,
        "parent",
      ], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
      expect(await parent.exited).toBe(0);
      expect(await new Response(parent.stdout).text()).toContain("acknowledged");
      await expect(current.assertOwned()).rejects.toThrow(/lock path generation changed/i);
      await current.release();
      expect(JSON.parse(await readFile(dataPath, "utf8"))).toEqual(["parent"]);
    });
  });

  test("binds each aliased state transaction to one canonical plan root", async () => {
    await withFixture("minimal-plan", async (originalDir) => {
      await withFixture("minimal-plan", async (replacementDir) => {
        const aliasRoot = await mkdtemp(join(tmpdir(), "ve-ip-plan-alias-"));
        const alias = join(aliasRoot, "plan");
        try {
          await readReviewState(originalDir);
          await readReviewState(replacementDir);
          await fs.symlink(originalDir, alias);
          const originalOpen = fs.open;
          const entered = Promise.withResolvers<void>();
          const resume = Promise.withResolvers<void>();
          let paused = false;
          spyOn(fs, "open").mockImplementation((async (path, flags, mode) => {
            const handle = await originalOpen(path, flags, mode);
            if (!paused && String(path) === join(originalDir, ".muse-review.lock")) {
              paused = true;
              entered.resolve();
              await resume.promise;
            }
            return handle;
          }) as typeof fs.open);

          const holder = updateReviewState(alias, { answers: { holder: "original" } });
          await entered.promise;
          await rm(alias);
          await fs.symlink(replacementDir, alias);
          await updateReviewState(alias, { answers: { contender: "replacement" } });
          resume.resolve();
          await holder;
          mock.restore();

          expect((await readReviewState(originalDir)).answers).toEqual({ holder: "original" });
          expect((await readReviewState(replacementDir)).answers).toEqual({ contender: "replacement" });
        } finally {
          mock.restore();
          await rm(aliasRoot, { recursive: true, force: true });
        }
      });
    });
  });


  test("serializes both directions across the exact parent lock protocol", async () => {
    if (process.platform === "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const parentHelper = join(repoRoot, "tests", "helpers", "parent-review-process.ts");
      const currentHelper = join(repoRoot, "tests", "helpers", "review-lock-owner.ts");

      const parentHolder = Bun.spawn([process.execPath, parentHelper, planDir, "--hold"], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      expect(new TextDecoder().decode((await parentHolder.stdout.getReader().read()).value)).toContain("acquired");
      const currentContender = Bun.spawn([process.execPath, currentHelper, planDir, "--signal-attempt"], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      const currentOutput = currentContender.stdout.getReader();
      const currentAttempt = new TextDecoder().decode((await currentOutput.read()).value);
      expect(currentAttempt).toContain("attempting");
      expect(currentAttempt).not.toContain("ready");
      let currentAcquired = false;
      const currentReady = currentOutput.read().then((result) => {
        currentAcquired = true;
        return result;
      });
      // A real delay is required here to prove the OS-level cross-process lock remains blocked.
      await Bun.sleep(25);
      expect(currentAcquired).toBe(false);
      parentHolder.kill();
      await parentHolder.exited;
      expect(new TextDecoder().decode((await currentReady).value)).toContain("ready");
      currentContender.kill();
      await currentContender.exited;

      const currentHolder = Bun.spawn([process.execPath, currentHelper, planDir], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      expect(new TextDecoder().decode((await currentHolder.stdout.getReader().read()).value)).toContain("ready");
      const parentContender = Bun.spawn([process.execPath, parentHelper, planDir, "--signal-attempt"], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      const parentOutput = parentContender.stdout.getReader();
      const parentAttempt = new TextDecoder().decode((await parentOutput.read()).value);
      expect(parentAttempt).toContain("attempting");
      expect(parentAttempt).not.toContain("acquired");
      let parentAcquired = false;
      const parentReady = parentOutput.read().then((result) => {
        parentAcquired = true;
        return result;
      });
      // A real delay is required here to prove the reverse OS-level lock dependency.
      await Bun.sleep(25);
      expect(parentAcquired).toBe(false);
      currentHolder.kill();
      await currentHolder.exited;
      expect(new TextDecoder().decode((await parentReady).value)).toContain("acquired");
      parentContender.kill();
      await parentContender.exited;
    });
  });

  test("preserves every acknowledged mixed-version write without deadlock", async () => {
    if (process.platform === "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const dataPath = join(planDir, "mixed-lock-writes.json");
      await writeFile(dataPath, "[]\n");
      const parentHelper = join(repoRoot, "tests", "helpers", "parent-review-process.ts");
      const currentHelper = join(repoRoot, "tests", "helpers", "review-lock-owner.ts");
      const expected = Array.from({ length: 24 }, (_, index) => `write-${index}`);
      const writers = expected.map((key, index) => Bun.spawn([
        process.execPath,
        index % 2 === 0 ? parentHelper : currentHelper,
        planDir,
        "--write",
        dataPath,
        key,
      ], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      }));

      const results = await Promise.all(writers.map(async (writer) => ({
        exitCode: await writer.exited,
        output: await new Response(writer.stdout).text(),
      })));
      expect(results.map((result) => result.exitCode)).toEqual(expected.map(() => 0));
      expect(results.every((result) => result.output.includes("acknowledged"))).toBe(true);
      const persisted = JSON.parse(await readFile(dataPath, "utf8")) as string[];
      expect(persisted.sort()).toEqual(expected.sort());
    });
  });

  test("rejects a legacy lock symlink without touching its target", async () => {
    if (process.platform === "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const externalDir = await mkdtemp(join(tmpdir(), "ve-ip-parent-lock-"));
      const external = join(externalDir, "sentinel");
      const legacyLockPath = join(planDir, ".muse-review.lock");
      try {
        await writeFile(external, "operator-owned\n");
        await fs.symlink(external, legacyLockPath);

        await expect(acquirePlanLock(planDir)).rejects.toThrow();
        expect(await readFile(external, "utf8")).toBe("operator-owned\n");
        expect(await readlink(legacyLockPath)).toBe(external);
      } finally {
        await rm(externalDir, { recursive: true, force: true });
      }
    });
  });

  test("fences a lock holder when the canonical plan-root generation is rebound", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const displacedRoot = `${planDir}.displaced`;
      const displaced = await acquirePlanLock(planDir);
      await rename(planDir, displacedRoot);
      await mkdir(planDir);
      try {
        await expect(displaced.assertOwned()).rejects.toThrow(/plan root generation changed/i);
        const successor = await acquirePlanLock(planDir);
        await successor.release();
      } finally {
        await displaced.release();
        await rm(planDir, { recursive: true, force: true });
        await rename(displacedRoot, planDir);
      }
    });
  });

  test("recovers both current and parent lock domains when owners exit", async () => {
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

      const parentOwner = Bun.spawn([
        process.execPath,
        join(repoRoot, "tests", "helpers", "parent-review-process.ts"),
        planDir,
        "--hold",
      ], {
        cwd: repoRoot,
        stdout: "pipe",
      });
      const parentReady = await parentOwner.stdout.getReader().read();
      expect(new TextDecoder().decode(parentReady.value)).toContain("acquired");
      parentOwner.kill();
      await parentOwner.exited;

      const postParentSuccessor = await acquirePlanLock(planDir);
      await postParentSuccessor.release();
    });
  });

  test("keeps Windows lock acquisition bounded across both blocking directions and owner exit", async () => {
    if (process.platform !== "win32") return;
    await withFixture("minimal-plan", async (planDir) => {
      const helper = join(repoRoot, "tests", "helpers", "review-lock-owner.ts");
      // Windows process locks run on the OS clock; this deadline bounds a hung native acquisition.
      const withinBound = async <T>(promise: Promise<T>, label: string): Promise<T> => Promise.race([
        promise,
        Bun.sleep(5_000).then(() => { throw new Error(`Timed out waiting for ${label}`); }),
      ]);

      const mainHolder = await acquirePlanLock(planDir);
      const childContender = Bun.spawn([process.execPath, helper, planDir, "--signal-attempt"], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      });
      const childOutput = childContender.stdout.getReader();
      expect(new TextDecoder().decode((await withinBound(childOutput.read(), "child attempt")).value)).toContain("attempting");
      let childReady = false;
      const childReadyResult = childOutput.read().then((result) => {
        childReady = true;
        return result;
      });
      // The child exposes no intermediate lock event, so a real interval proves native contention remains blocked.
      await Bun.sleep(40);
      expect(childReady).toBe(false);
      await mainHolder.release();
      expect(new TextDecoder().decode((await withinBound(childReadyResult, "child acquisition")).value)).toContain("ready");
      childContender.kill();
      await withinBound(childContender.exited, "child holder exit");

      const childHolder = Bun.spawn([process.execPath, helper, planDir], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(new TextDecoder().decode((await withinBound(childHolder.stdout.getReader().read(), "child holder")).value)).toContain("ready");
      let mainReady = false;
      const mainContender = acquirePlanLock(planDir).then((lock) => {
        mainReady = true;
        return lock;
      });
      // The in-process contender likewise has no observable event before native acquisition completes.
      await Bun.sleep(40);
      expect(mainReady).toBe(false);
      childHolder.kill();
      await withinBound(childHolder.exited, "owner exit");
      const acquiredAfterExit = await withinBound(mainContender, "main acquisition after owner exit");
      await acquiredAfterExit.release();

      const dataPath = join(planDir, "windows-mixed-lock-writes.json");
      await writeFile(dataPath, "[]\n");
      const expected = Array.from({ length: 16 }, (_, index) => `windows-write-${index}`);
      const writers = expected.map((key) => Bun.spawn([
        process.execPath,
        helper,
        planDir,
        "--write",
        dataPath,
        key,
      ], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" }));
      const results = await withinBound(Promise.all(writers.map(async (writer) => ({
        exitCode: await writer.exited,
        output: await new Response(writer.stdout).text(),
      }))), "mixed Windows writes");
      expect(results.map((result) => result.exitCode)).toEqual(expected.map(() => 0));
      expect(results.every((result) => result.output.includes("acknowledged"))).toBe(true);
      expect((JSON.parse(await readFile(dataPath, "utf8")) as string[]).sort()).toEqual(expected.sort());
    });
  });

  test("rejects Windows pathname generation changes and binds alias contenders canonically", async () => {
    if (process.platform !== "win32") return;
    const helper = join(repoRoot, "tests", "helpers", "review-lock-owner.ts");
    // Windows process locks run on the OS clock; this deadline bounds a hung native acquisition.
    const withinBound = async <T>(promise: Promise<T>, label: string): Promise<T> => Promise.race([
      promise,
      Bun.sleep(5_000).then(() => { throw new Error(`Timed out waiting for ${label}`); }),
    ]);

    await withFixture("minimal-plan", async (planDir) => {
      const owner = Bun.spawn([process.execPath, helper, planDir], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
      expect(new TextDecoder().decode((await withinBound(owner.stdout.getReader().read(), "Windows owner")).value)).toContain("ready");
      const contender = Bun.spawn([process.execPath, helper, planDir, "--signal-attempt"], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [contenderSignal, contenderCapture] = contender.stdout.tee();
      expect(new TextDecoder().decode((await withinBound(contenderSignal.getReader().read(), "Windows contender")).value)).toContain("attempting");
      // Allow the child to enter LockFileEx contention before mutating the retained pathname generation.
      await Bun.sleep(40);
      await writeFile(join(planDir, ".muse-review.lock"), "changed while contended\n");
      owner.kill();
      await withinBound(owner.exited, "Windows owner exit");
      expect(await withinBound(contender.exited, "generation-change rejection")).not.toBe(0);
      expect(await new Response(contenderCapture).text()).not.toContain("ready");
    });

    await withFixture("minimal-plan", async (originalDir) => {
      await withFixture("minimal-plan", async (replacementDir) => {
        const aliasRoot = await mkdtemp(join(tmpdir(), "ve-ip-windows-alias-"));
        const alias = join(aliasRoot, "plan");
        const originalData = join(originalDir, "alias-writes.json");
        const replacementData = join(replacementDir, "alias-writes.json");
        await Promise.all([writeFile(originalData, "[]\n"), writeFile(replacementData, "[]\n")]);
        await fs.symlink(originalDir, alias, "junction");
        try {
          const holder = Bun.spawn([process.execPath, helper, originalDir], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
          expect(new TextDecoder().decode((await withinBound(holder.stdout.getReader().read(), "aliased owner")).value)).toContain("ready");
          const contender = Bun.spawn([
            process.execPath,
            helper,
            alias,
            "--signal-write",
            originalData,
            "original",
          ], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
          const [contenderSignal, contenderCapture] = contender.stdout.tee();
          expect(new TextDecoder().decode((await withinBound(contenderSignal.getReader().read(), "aliased contender")).value)).toContain("attempting");
          // Allow the aliased child to bind its canonical root before the junction is retargeted.
          await Bun.sleep(40);
          await rm(alias);
          await fs.symlink(replacementDir, alias, "junction");
          holder.kill();
          await withinBound(holder.exited, "aliased owner exit");
          expect(await withinBound(contender.exited, "aliased contender completion")).toBe(0);
          expect(await new Response(contenderCapture).text()).toContain("acknowledged");

          const replacementWriter = Bun.spawn([
            process.execPath,
            helper,
            alias,
            "--write",
            replacementData,
            "replacement",
          ], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
          expect(await withinBound(replacementWriter.exited, "retargeted alias write")).toBe(0);
          expect(JSON.parse(await readFile(originalData, "utf8"))).toEqual(["original"]);
          expect(JSON.parse(await readFile(replacementData, "utf8"))).toEqual(["replacement"]);
        } finally {
          await rm(aliasRoot, { recursive: true, force: true });
        }
      });
    });
  });

  test("classifies injected Unix flock results without timers", () => {
    for (const [platform, errno] of [["darwin", 35], ["linux", 11]] as const) {
      let errnoReads = 0;
      const retry = tryUnixFlockForTesting(
        () => -1,
        () => {
          errnoReads += 1;
          return errno;
        },
        42,
        `/tmp/${platform}-retry.lock`,
        platform,
      );
      expect(retry).toBeUndefined();
      expect(errnoReads).toBe(1);
    }

    const terminalCases = [
      ["darwin", 9, "EBADF"],
      ["darwin", 77, "ENOLCK"],
      ["darwin", 5, "EIO"],
      ["darwin", 102, "EOPNOTSUPP"],
      ["linux", 9, "EBADF"],
      ["linux", 37, "ENOLCK"],
      ["linux", 5, "EIO"],
      ["linux", 95, "EOPNOTSUPP"],
    ] as const;
    for (const [platform, errno, code] of terminalCases) {
      try {
        tryUnixFlockForTesting(() => -1, () => errno, 42, `/tmp/${platform}-terminal.lock`, platform);
        throw new Error(`Expected ${code} to be terminal`);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(code);
        expect((error as Error & { cause?: { code?: string; errno?: number; syscall?: string } }).cause).toMatchObject({
          code,
          errno,
          syscall: "flock",
        });
      }
    }

    const operations: number[] = [];
    const acquired = tryUnixFlockForTesting(
      (_fd, operation) => {
        operations.push(operation);
        return operation === 8 ? -1 : 0;
      },
      () => 5,
      42,
      "/tmp/release.lock",
      "linux",
    );
    expect(acquired).toBeDefined();
    expect(() => acquired!.release()).toThrow(/EIO/);
    expect(operations).toEqual([6, 8]);
  });

  test("uses native Windows lock handles and conventional Linux libc candidates", async () => {
    const source = await readFile(
      join(repoRoot, "plugins", "Muse", "skills", "muse", "tools", "interactive-plan", "plan-lock.ts"),
      "utf8",
    );
    expect(source).toContain("CreateFileW");
    expect(source).toContain("LockFileEx");
    expect(source).toContain("CloseHandle");
    expect(source).toContain("args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64]");
    expect(source).toContain("returns: FFIType.u64");
    expect(source).toContain("const GENERIC_READ_WRITE = 0xc0000000");
    expect(source).toContain("const FILE_SHARE_READ_WRITE = 0x00000003");
    expect(source).toContain("const OPEN_ALWAYS = 4");
    expect(source).toContain("const LOCKFILE_EXCLUSIVE_FAIL_IMMEDIATELY = 0x00000003");
    expect(source).toContain("const FILE_FLAG_OPEN_REPARSE_POINT = 0x00200000");
    expect(source).not.toContain("FILE_SHARE_DELETE");
    expect(source).not.toContain("_get_osfhandle");
    expect(source).not.toContain("msvcrt.dll");
    expect(source.indexOf('"libc.so.6"')).toBeLessThan(source.indexOf('readFile("/proc/self/maps"'));
    expect(source).toContain("legacyBinding = await openLegacyLock(root)");
    expect(source.indexOf("directoryToken = await locking.tryLock(root)")).toBeLessThan(source.indexOf("locking.tryLegacyLock!(legacyBinding)"));
    expect(source.indexOf("CreateFileW(")).toBeLessThan(source.indexOf("for (let attempt = 0; attempt < MAX_ATTEMPTS"));
    expect(source.indexOf("for (let attempt = 0; attempt < MAX_ATTEMPTS")).toBeLessThan(source.indexOf("kernel.symbols.LockFileEx("));
    expect(source).toContain("retainedPathname.dev !== pathname.dev");
    expect(source).toContain("__error");
    expect(source).toContain("__errno_location");
    expect(source).toContain("ffiRead.i32");
    const parentSource = await readFile(join(repoRoot, "tests", "helpers", "parent-plan-lock.ts"));
    expect(createHash("sha256").update(parentSource).digest("hex")).toBe(
      "5eea7640676468fdd897a8fcb58b02993b566751c81fbaf5670953d135b38bb7",
    );
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
      mock.restore();
      await readReviewState(planDir);
      expect(await temporaryPublicationEntries(planDir)).toEqual([]);

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

  test("restores prior authority when committed bundle verification fails", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first-reviewer");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const priorTarget = await readlink(pointer);
      const originalRename = fs.rename;
      const originalLstat = fs.lstat;
      let publishedBundle: string | undefined;
      let failed = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (String(to) === pointer) publishedBundle = join(store, await readlink(pointer));
        return result;
      });
      spyOn(fs, "lstat").mockImplementation((async (path: PathLike, options?: object) => {
        if (!failed && publishedBundle !== undefined && String(path) === publishedBundle) {
          failed = true;
          throw new Error("post-pointer bundle stat");
        }
        return originalLstat(path, options as never);
      }) as typeof fs.lstat);

      await expect(approvePlan(planDir, "second-reviewer")).rejects.toThrow(/postcommit verification/i);

      mock.restore();
      expect(await readlink(pointer)).toBe(priorTarget);
      expect((await readReviewState(planDir)).reviewer).toBe("first-reviewer");
    });
  });

  test("fails approval without touching a replacement canonical store", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first-reviewer");
      const store = join(planDir, ".muse-review");
      const displacedStore = join(planDir, ".muse-review.displaced");
      const pointer = join(store, "current");
      const sentinel = join(store, "operator-sentinel.txt");
      const originalRename = fs.rename;
      let replaced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (!replaced && String(to) === pointer) {
          replaced = true;
          await originalRename(store, displacedStore);
          await mkdir(store);
          await writeFile(sentinel, "operator replacement\n");
        }
        return result;
      });

      try {
        await expect(approvePlan(planDir, "second-reviewer")).rejects.toThrow(/postcommit verification/i);
        expect(await readFile(sentinel, "utf8")).toBe("operator replacement\n");
        expect(await Bun.file(pointer).exists()).toBe(false);
      } finally {
        mock.restore();
        await rm(store, { recursive: true, force: true });
        await rename(displacedStore, store);
      }
    });
  });

  test("deletes only a quarantined abandoned bundle when its pathname is rebound", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await readReviewState(planDir);
      const bundles = join(planDir, ".muse-review", "bundles");
      const abandoned = join(bundles, "123e4567-e89b-42d3-a456-426614174001");
      await cp(await currentBundlePath(planDir), abandoned, { recursive: true });
      const sentinel = join(abandoned, "operator-sentinel.txt");
      const originalRename = fs.rename;
      let raced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (!raced && String(from) === abandoned && String(to).includes(".cleanup-")) {
          raced = true;
          await mkdir(abandoned);
          await writeFile(sentinel, "operator successor\n");
        }
        return result;
      });

      await readReviewState(planDir);

      expect(await readFile(sentinel, "utf8")).toBe("operator successor\n");
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

  test("replays lost and concurrent HTTP comment requests by stable identity", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      const server = await servePlan(planDir, 0);
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        const body = {
          id: "c-http-stable",
          blockId: "summary",
          anchor: "scope",
          body: "Replay this request exactly.",
        };
        const request = () => fetch(`http://localhost:${server.port}/api/comments`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": body.id,
          },
          body: JSON.stringify(body),
        });
        const lostResponse = await request();
        expect(lostResponse.ok).toBe(true);
        const pointer = join(planDir, ".muse-review", "current");
        const committedTarget = await readlink(pointer);
        const [replay, concurrent] = await Promise.all([request(), request()]);
        expect(replay.status).toBe(200);
        expect(concurrent.status).toBe(200);
        expect(await replay.json()).toEqual(await concurrent.json());
        expect(await readlink(pointer)).toBe(committedTarget);
        expect(await readComments(planDir)).toHaveLength(1);

        const conflict = await fetch(`http://localhost:${server.port}/api/comments`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": body.id,
          },
          body: JSON.stringify({ ...body, body: "Conflicting replay." }),
        });
        expect(conflict.status).toBe(409);
        expect(await readlink(pointer)).toBe(committedTarget);
      } finally {
        server.stop(true);
      }
    });
  });

  test("keeps cold artifact and rejected mutation requests publication-free", async () => {
    const compatibilityFiles = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"];
    await withFixture("minimal-plan", async (planDir) => {
      await setReadinessPolicy(planDir);
      const server = await servePlan(planDir, 0);
      try {
        if (server.port === undefined) throw new Error("Test server did not bind a port");
        for (const artifact of ["agent-handoff.json", "agent-handoff.md"]) {
          expect((await fetch(`http://localhost:${server.port}/${artifact}`)).status).toBe(404);
        }
        expect(await Bun.file(join(planDir, ".muse-review")).exists()).toBe(false);
        expect(await Promise.all(compatibilityFiles.map((file) => Bun.file(join(planDir, file)).exists()))).toEqual([false, false, false, false]);

        expect((await post(server, "/api/comments", { resolveId: "missing" })).status).toBe(404);
        expect((await post(server, "/api/approve", { reviewer: "blocked" })).status).toBe(422);
        expect(await Bun.file(join(planDir, ".muse-review")).exists()).toBe(false);
        expect(await Promise.all(compatibilityFiles.map((file) => Bun.file(join(planDir, file)).exists()))).toEqual([false, false, false, false]);
      } finally {
        server.stop(true);
      }
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
      { mutate: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas-content\">Created</Callout>\n") },
      {
        setup: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas-content\">Original</Callout>\n"),
        mutate: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas-content\">Edited</Callout>\n"),
      },
      {
        setup: async (planDir) => writeFile(join(planDir, "canvas.mdx"), "<Callout id=\"canvas-content\">Original</Callout>\n"),
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

  for (const mode of ["missing", "rebound"] as const) {
    test(`quarantines the rejected approval when the retained prior generation is ${mode}`, async () => {
      mock.restore();
      await withFixture("minimal-plan", async (planDir) => {
        await approvePlan(planDir, "first");
        const store = join(planDir, ".muse-review");
        const pointer = join(store, "current");
        const priorTarget = await readlink(pointer);
        const priorBundle = join(store, priorTarget);
        const successorSentinel = join(priorBundle, "external-successor.txt");
        const planPath = join(planDir, "plan.mdx");
        const originalRename = fs.rename;
        let replacementTarget: string | undefined;
        let replacementPointer: { dev: bigint; ino: bigint } | undefined;
        spyOn(fs, "rename").mockImplementation(async (from, to) => {
          const result = await originalRename(from, to);
          if (replacementTarget === undefined && String(to) === pointer) {
            replacementTarget = await readlink(pointer);
            const committed = await lstat(pointer, { bigint: true });
            replacementPointer = { dev: committed.dev, ino: committed.ino };
            await rm(priorBundle, { recursive: true });
            if (mode === "rebound") {
              await mkdir(priorBundle);
              await writeFile(successorSentinel, "external successor\n");
            }
            await writeFile(planPath, `${await readFile(planPath, "utf8")}\nPostcommit mutation.\n`);
          }
          return result;
        });

        let approvalError: unknown;
        try {
          await approvePlan(planDir, "second");
        } catch (error) {
          approvalError = error;
        }

        mock.restore();
        expect(approvalError).toBeInstanceOf(AggregateError);
        const rollbackFailure = approvalError as AggregateError;
        expect(rollbackFailure.message).toMatch(/prior authority could not be restored/i);
        expect(rollbackFailure.errors).toHaveLength(2);
        expect((rollbackFailure.errors[0] as Error).message).toMatch(/changed during approval/i);
        expect(replacementTarget).toBeDefined();
        expect(replacementPointer).toBeDefined();
        await expect(lstat(pointer)).rejects.toThrow();
        const quarantined = (await readdir(store))
          .filter((entry) => entry.startsWith("current.") && entry.endsWith(".invalid"));
        expect(quarantined).toHaveLength(1);
        const quarantinedPointer = join(store, quarantined[0]!);
        expect(await readlink(quarantinedPointer)).toBe(replacementTarget!);
        const quarantinedIdentity = await lstat(quarantinedPointer, { bigint: true });
        expect({ dev: quarantinedIdentity.dev, ino: quarantinedIdentity.ino }).toEqual(replacementPointer!);
        for (const file of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"]) {
          await expect(readFile(join(planDir, file))).rejects.toThrow();
        }
        if (mode === "rebound") {
          expect(await readFile(successorSentinel, "utf8")).toBe("external successor\n");
        }
      });
    });
  }

  test("quarantines a rejected approval after legacy lock generation loss", async () => {
    if (process.platform === "win32") return;
    mock.restore();
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const priorBundle = join(store, await readlink(pointer));
      const lockPath = join(planDir, ".muse-review.lock");
      const displacedLock = `${lockPath}.displaced`;
      const originalRename = fs.rename;
      let rejectedTarget: string | undefined;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (rejectedTarget === undefined && String(to) === pointer) {
          rejectedTarget = await readlink(pointer);
          await rm(priorBundle, { recursive: true });
          await originalRename(lockPath, displacedLock);
          await writeFile(lockPath, "replacement lock\n");
        }
        return result;
      });

      let approvalError: unknown;
      try {
        await approvePlan(planDir, "second");
      } catch (error) {
        approvalError = error;
      }

      mock.restore();
      expect(approvalError).toBeInstanceOf(AggregateError);
      const errorMessages: string[] = [];
      const collectErrorMessages = (error: unknown): void => {
        if (!(error instanceof Error)) return;
        errorMessages.push(error.message);
        if (error instanceof AggregateError) error.errors.forEach(collectErrorMessages);
      };
      collectErrorMessages(approvalError);
      expect(errorMessages.filter((message) => /review lock path generation changed/i.test(message))).toHaveLength(2);
      expect(rejectedTarget).toBeDefined();
      await expect(lstat(pointer)).rejects.toThrow();
      const quarantined = (await readdir(store))
        .filter((entry) => entry.startsWith("current.") && entry.endsWith(".invalid"));
      expect(quarantined).toHaveLength(1);
      expect(await readlink(join(store, quarantined[0]!))).toBe(rejectedTarget!);
      for (const file of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"]) {
        await expect(readFile(join(planDir, file))).rejects.toThrow();
      }
    });
  });

  test("quarantines a rejected approval when published bundle metadata changes after commit", async () => {
    if (process.platform === "win32") return;
    mock.restore();
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const lockPath = join(planDir, ".muse-review.lock");
      const displacedLock = `${lockPath}.displaced`;
      const originalRename = fs.rename;
      const originalLstat = fs.lstat;
      let rejectedTarget: string | undefined;
      let rejectedPointer: { dev: bigint; ino: bigint } | undefined;
      let metadataChanged = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (rejectedTarget === undefined && String(to) === pointer) {
          rejectedTarget = await readlink(pointer);
          const committed = await originalLstat(pointer, { bigint: true });
          rejectedPointer = { dev: committed.dev, ino: committed.ino };
        }
        return result;
      });
      spyOn(fs, "lstat").mockImplementation((async (path: PathLike, options?: object) => {
        if (!metadataChanged && rejectedTarget !== undefined && String(path) === planDir) {
          metadataChanged = true;
          await fs.utimes(join(store, rejectedTarget), new Date(0), new Date(0));
          await originalRename(lockPath, displacedLock);
          await writeFile(lockPath, "replacement lock\n");
        }
        return originalLstat(path, options as never);
      }) as typeof fs.lstat);

      await expect(approvePlan(planDir, "second")).rejects.toThrow();

      mock.restore();
      expect(rejectedTarget).toBeDefined();
      expect(rejectedPointer).toBeDefined();
      await expect(lstat(pointer)).rejects.toThrow();
      const quarantined = (await readdir(store))
        .filter((entry) => entry.startsWith("current.") && entry.endsWith(".invalid"));
      expect(quarantined).toHaveLength(1);
      const quarantinedPointer = join(store, quarantined[0]!);
      expect(await readlink(quarantinedPointer)).toBe(rejectedTarget!);
      const quarantinedIdentity = await lstat(quarantinedPointer, { bigint: true });
      expect({ dev: quarantinedIdentity.dev, ino: quarantinedIdentity.ino }).toEqual(rejectedPointer!);
      const recoveredState = await readReviewState(planDir);
      expect(recoveredState.status).toBe("needs_revision");
      expect(recoveredState.reviewer).toBeUndefined();
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow(
        /no coherent approved handoff/i,
      );
      await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow(
        /no coherent approved handoff/i,
      );
    });
  });

  test("recovers a rejected approval when postcommit verification loses legacy ownership", async () => {
    if (process.platform === "win32") return;
    mock.restore();
    await withFixture("minimal-plan", async (planDir) => {
      await readReviewState(planDir);
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const lockPath = join(planDir, ".muse-review.lock");
      const displacedLock = `${lockPath}.displaced`;
      const originalRename = fs.rename;
      let faultInjected = false;

      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        const result = await originalRename(from, to);
        if (!faultInjected && String(from).endsWith(".pointer") && String(to) === pointer) {
          faultInjected = true;
          const committedBundle = join(store, await readlink(pointer));
          await fs.utimes(committedBundle, new Date(0), new Date(0));
          await originalRename(lockPath, displacedLock);
          await writeFile(lockPath, "replacement lock\n");
        }
        return result;
      });

      await expect(approvePlan(planDir, "rejected-reviewer")).rejects.toThrow();
      expect(faultInjected).toBe(true);

      mock.restore();
      const recoveredState = await readReviewState(planDir);
      expect(recoveredState.status).toBe("needs_revision");
      expect(recoveredState.reviewer).toBeUndefined();
      expect(await readComments(planDir)).toEqual([]);
      await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow(
        /no coherent approved handoff/i,
      );
      await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow(
        /no coherent approved handoff/i,
      );

      const rootState = JSON.parse(await readFile(join(planDir, "plan-state.json"), "utf8")) as ReviewState;
      expect(rootState.status).toBe("needs_revision");
      expect(rootState.reviewer).toBeUndefined();
      expect(JSON.parse(await readFile(join(planDir, "comments.json"), "utf8"))).toEqual([]);
      await expect(readFile(join(planDir, "agent-handoff.json"), "utf8")).rejects.toThrow();
      await expect(readFile(join(planDir, "agent-handoff.md"), "utf8")).rejects.toThrow();
    });
  });

  async function verifyRejectedApprovalSuccessorRestoration(successorUsesRejectedBundle: boolean): Promise<void> {
    if (process.platform === "win32") return;
    mock.restore();
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const priorBundle = join(store, await readlink(pointer));
      let successorTarget = "bundles/00000000-0000-4000-8000-000000000001";
      let successorBundle = join(store, successorTarget);
      if (!successorUsesRejectedBundle) await cp(priorBundle, successorBundle, { recursive: true });
      const lockPath = join(planDir, ".muse-review.lock");
      const displacedLock = `${lockPath}.displaced`;
      const rejectedQuarantine = join(store, "current.00000000-0000-4000-8000-000000000002.invalid");
      const originalRename = fs.rename;
      let rejectedTarget: string | undefined;
      let rejectedPointer: { dev: bigint; ino: bigint } | undefined;
      let successorPointer: { dev: bigint; ino: bigint } | undefined;
      let raced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (
          rejectedTarget !== undefined
          && !raced
          && String(from) === pointer
          && String(to).startsWith(`${pointer}.`)
          && String(to).endsWith(".invalid")
        ) {
          raced = true;
          const rejected = await lstat(pointer, { bigint: true });
          rejectedPointer = { dev: rejected.dev, ino: rejected.ino };
          await originalRename(pointer, rejectedQuarantine);
          if (successorUsesRejectedBundle) {
            successorTarget = rejectedTarget;
            successorBundle = join(store, successorTarget);
          }
          await fs.symlink(successorTarget, pointer);
          const successor = await lstat(pointer, { bigint: true });
          successorPointer = { dev: successor.dev, ino: successor.ino };
        }
        const result = await originalRename(from, to);
        if (rejectedTarget === undefined && String(to) === pointer) {
          rejectedTarget = await readlink(pointer);
          await rm(priorBundle, { recursive: true });
          await originalRename(lockPath, displacedLock);
          await writeFile(lockPath, "replacement lock\n");
        }
        return result;
      });

      await expect(approvePlan(planDir, "second")).rejects.toThrow(/recovery was incomplete/i);

      mock.restore();
      expect(raced).toBe(true);
      expect(rejectedTarget).toBeDefined();
      expect(rejectedPointer).toBeDefined();
      expect(successorPointer).toBeDefined();
      expect(await readlink(pointer)).toBe(successorTarget);
      const successorHandoffJson = await readFile(join(successorBundle, "agent-handoff.json"), "utf8");
      const successorHandoffMarkdown = await readFile(join(successorBundle, "agent-handoff.md"), "utf8");
      expect(await readPublishedArtifact(planDir, "agent-handoff.json")).toBe(successorHandoffJson);
      expect(await readPublishedArtifact(planDir, "agent-handoff.md")).toBe(successorHandoffMarkdown);
      expect(await readFile(join(planDir, "agent-handoff.json"), "utf8")).toBe(successorHandoffJson);
      expect(await readFile(join(planDir, "agent-handoff.md"), "utf8")).toBe(successorHandoffMarkdown);
      const quarantined = (await readdir(store))
        .filter((entry) => entry.startsWith("current.") && entry.endsWith(".invalid"));
      expect(quarantined).toEqual([rejectedQuarantine.split("/").at(-1)!]);
      expect(await readlink(rejectedQuarantine)).toBe(rejectedTarget!);
      const quarantinedRejection = await lstat(rejectedQuarantine, { bigint: true });
      expect({ dev: quarantinedRejection.dev, ino: quarantinedRejection.ino }).toEqual(rejectedPointer!);
    });
  }

  test("restores a successor moved during rejected approval quarantine", async () => {
    await verifyRejectedApprovalSuccessorRestoration(false);
  });

  test("restores a same-bundle successor moved during rejected approval quarantine", async () => {
    await verifyRejectedApprovalSuccessorRestoration(true);
  });

  test("fails closed when the prior bundle is rebound at rollback commit", async () => {
    await withFixture("minimal-plan", async (planDir) => {
      await approvePlan(planDir, "first");
      const store = join(planDir, ".muse-review");
      const pointer = join(store, "current");
      const priorBundle = join(store, await readlink(pointer));
      const planPath = join(planDir, "plan.mdx");
      const attackerSentinel = join(priorBundle, "attacker.txt");
      const originalRename = fs.rename;
      let publicationCommitted = false;
      let rollbackRaced = false;
      spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (publicationCommitted && !rollbackRaced && String(to) === pointer && String(from).endsWith(".rollback")) {
          rollbackRaced = true;
          await rm(priorBundle, { recursive: true });
          await mkdir(priorBundle);
          await writeFile(attackerSentinel, "attacker successor\n");
        }
        const result = await originalRename(from, to);
        if (!publicationCommitted && String(to) === pointer) {
          publicationCommitted = true;
          await writeFile(planPath, `${await readFile(planPath, "utf8")}\nPostcommit mutation.\n`);
        }
        return result;
      });

      await expect(approvePlan(planDir, "second")).rejects.toThrow(/prior authority could not be restored/i);

      mock.restore();
      expect(rollbackRaced).toBe(true);
      await expect(lstat(pointer)).rejects.toThrow();
      expect(await readFile(attackerSentinel, "utf8")).toBe("attacker successor\n");
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
        const originalSymlink = fs.symlink;
        spyOn(fs, "symlink").mockImplementation(async (target, path, type) => {
          if (String(path) === join(planDir, failedFile)) throw new Error(`fault at ${failedFile}`);
          return originalSymlink(target, path, type);
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
  test("restores exact compatibility generations after post-symlink readlink faults and retries", async () => {
    for (const failedFile of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        const statePath = join(planDir, "plan-state.json");
        const commentsPath = join(planDir, "comments.json");
        const jsonPath = join(planDir, "agent-handoff.json");
        const markdownPath = join(planDir, "agent-handoff.md");
        const originalState = Buffer.from(`${JSON.stringify({
          status: "in_review",
          answers: { retained: failedFile },
          checklist: {},
          unresolvedCommentIds: [],
        }, null, 2)}\n`);
        await writeFile(statePath, originalState);
        await writeFile(commentsPath, "[]\n");
        await writeFile(jsonPath, "operator-owned\n");
        const originalReadlink = fs.readlink;
        const failedPath = join(planDir, failedFile);
        let injected = false;
        spyOn(fs, "readlink").mockImplementation((async (path: PathLike) => {
          if (!injected && String(path) === failedPath && (await lstat(failedPath)).isSymbolicLink()) {
            injected = true;
            throw new Error(`post-symlink readlink fault at ${failedFile}`);
          }
          return originalReadlink(path);
        }) as typeof fs.readlink);

        await expect(readReviewState(planDir)).rejects.toThrow(`post-symlink readlink fault at ${failedFile}`);
        expect(await readFile(statePath)).toEqual(originalState);
        expect(await readFile(commentsPath, "utf8")).toBe("[]\n");
        expect(await readFile(jsonPath, "utf8")).toBe("operator-owned\n");
        expect(await Bun.file(markdownPath).exists()).toBe(false);
        expect((await readdir(planDir)).some((entry) => entry.endsWith(".legacy"))).toBe(false);

        mock.restore();
        expect((await readReviewState(planDir)).answers.retained).toBe(failedFile);
        for (const file of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"]) {
          expect(await readlink(join(planDir, file))).toBe(join(".muse-review", "current", file));
        }
      });
    }
  });

  test("restores exact compatibility generations after post-symlink lstat faults and retries", async () => {
    for (const failedFile of ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const) {
      await withFixture("minimal-plan", async (planDir) => {
        const files = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const;
        const paths = Object.fromEntries(files.map((file) => [file, join(planDir, file)])) as Record<(typeof files)[number], string>;
        const originalBytes = {
          "plan-state.json": Buffer.from(`${JSON.stringify({
            status: "in_review",
            answers: { retained: failedFile },
            checklist: {},
            unresolvedCommentIds: [],
          }, null, 2)}\n`),
          "comments.json": Buffer.from("[]\n"),
          "agent-handoff.json": Buffer.from("operator-owned\n"),
        };
        await Promise.all(Object.entries(originalBytes).map(([file, bytes]) => writeFile(paths[file as keyof typeof paths], bytes)));
        const originalStats = Object.fromEntries(
          await Promise.all(Object.keys(originalBytes).map(async (file) => [file, await lstat(paths[file as keyof typeof paths], { bigint: true })])),
        );
        const originalLstat = fs.lstat;
        let injected = false;
        spyOn(fs, "lstat").mockImplementation((async (path: PathLike, options?: object) => {
          const pathname = String(path);
          if (!injected && pathname === paths[failedFile]) {
            const stats = await originalLstat(path, options as never);
            if (stats.isSymbolicLink()) {
              injected = true;
              throw new Error(`post-symlink lstat fault at ${failedFile}`);
            }
          }
          return originalLstat(path, options as never);
        }) as typeof fs.lstat);

        await expect(readReviewState(planDir)).rejects.toThrow(/rollback|post-symlink lstat fault/i);
        for (const [file, bytes] of Object.entries(originalBytes)) {
          const path = paths[file as keyof typeof paths];
          expect(await readFile(path)).toEqual(bytes);
          const restored = await lstat(path, { bigint: true });
          const original = originalStats[file]!;
          expect([restored.dev, restored.ino]).toEqual([original.dev, original.ino]);
        }
        expect(await Bun.file(paths["agent-handoff.md"]).exists()).toBe(false);
        await expect(lstat(join(planDir, ".muse-review", "current"))).rejects.toThrow();
        await expect(lstat(join(planDir, ".muse-review", "initialized"))).rejects.toThrow();
        expect((await readdir(planDir)).some((entry) => entry.endsWith(".legacy"))).toBe(false);

        mock.restore();
        expect((await readReviewState(planDir)).answers.retained).toBe(failedFile);
        for (const file of files) {
          expect(await readlink(paths[file])).toBe(join(".muse-review", "current", file));
        }
      });
    }
  });

  test("fences state, comment, revision, resolution, and approval after callback ownership loss", async () => {
    if (process.platform === "win32") return;
    const scenarios: Array<{
      name: "state" | "comment" | "revision" | "resolution" | "approval";
      trigger: "pointer" | "cleanup";
      setup(planDir: string): Promise<void>;
      mutate(planDir: string): Promise<unknown>;
    }> = [
      {
        name: "state",
        trigger: "pointer",
        setup: async (planDir) => { await readReviewState(planDir); },
        mutate: (planDir) => updateReviewState(planDir, { answers: { fenced: "must-not-commit" } }),
      },
      {
        name: "comment",
        trigger: "pointer",
        setup: async (planDir) => { await readReviewState(planDir); },
        mutate: (planDir) => addComment(planDir, { id: "c-fenced", blockId: "summary", body: "must not commit" }),
      },
      {
        name: "revision",
        trigger: "pointer",
        setup: async (planDir) => { await approvePlan(planDir, "prior-reviewer"); },
        mutate: (planDir) => updateReviewState(planDir, { status: "needs_revision" }),
      },
      {
        name: "resolution",
        trigger: "pointer",
        setup: async (planDir) => {
          await addComment(planDir, { id: "c-resolution-fence", blockId: "summary", body: "remain open" });
        },
        mutate: (planDir) => resolveComment(planDir, "c-resolution-fence"),
      },
      {
        name: "approval",
        trigger: "cleanup",
        setup: async (planDir) => { await readReviewState(planDir); },
        mutate: (planDir) => approvePlan(planDir, "attempted-reviewer"),
      },
    ];

    for (const scenario of scenarios) {
      mock.restore();
      await withFixture("minimal-plan", async (planDir) => {
        await scenario.setup(planDir);
        const store = join(planDir, ".muse-review");
        const pointer = join(store, "current");
        const lockPath = join(planDir, ".muse-review.lock");
        const priorTarget = await readlink(pointer);
        const priorBundle = join(store, priorTarget);
        const priorFiles = (await readdir(priorBundle)).sort();
        const priorBytes = await Promise.all(priorFiles.map((file) => readFile(join(priorBundle, file))));
        const originalRename = fs.rename;
        const originalRm = fs.rm;
        let ownershipChanged = false;
        const replaceLockGeneration = async () => {
          ownershipChanged = true;
          await originalRm(lockPath);
          await writeFile(lockPath, `${scenario.name} replacement\n`);
        };

        spyOn(fs, "rename").mockImplementation(async (from, to) => {
          const result = await originalRename(from, to);
          if (!ownershipChanged && scenario.trigger === "pointer" && String(to) === pointer && String(from).endsWith(".pointer")) {
            await replaceLockGeneration();
          }
          return result;
        });
        spyOn(fs, "rm").mockImplementation(async (path, options) => {
          const result = await originalRm(path, options);
          if (!ownershipChanged && scenario.trigger === "cleanup" && String(path).includes(`${join(store, "bundles")}/.cleanup-`)) {
            await replaceLockGeneration();
          }
          return result;
        });

        await expect(scenario.mutate(planDir)).rejects.toThrow(/generation changed|lost ownership/i);
        expect(ownershipChanged).toBe(true);
        mock.restore();

        if (scenario.name === "approval") {
          await expect(lstat(pointer)).rejects.toThrow();
        } else {
          expect(await readlink(pointer)).toBe(priorTarget);
          expect((await readdir(priorBundle)).sort()).toEqual(priorFiles);
          expect(await Promise.all(priorFiles.map((file) => readFile(join(priorBundle, file))))).toEqual(priorBytes);
        }
        const state = await readReviewState(planDir);
        const comments = await readComments(planDir);
        if (scenario.name === "state") expect(state.answers.fenced).toBeUndefined();
        if (scenario.name === "comment") expect(comments.some((comment) => comment.id === "c-fenced")).toBe(false);
        if (scenario.name === "revision") expect(state).toMatchObject({ status: "approved", reviewer: "prior-reviewer" });
        if (scenario.name === "resolution") {
          expect(comments.find((comment) => comment.id === "c-resolution-fence")?.status).toBe("open");
        }
        if (scenario.name === "approval") {
          expect(state.status).not.toBe("approved");
          expect(state.reviewer).not.toBe("attempted-reviewer");
          await expect(readPublishedArtifact(planDir, "agent-handoff.json")).rejects.toThrow();
          await expect(readPublishedArtifact(planDir, "agent-handoff.md")).rejects.toThrow();
        }
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
    expect(doc).toContain("MUSE_SKILL_DIR = directory containing the muse SKILL.md you loaded");
    expect(doc).toContain('bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" render');
    expect(doc).toContain('bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" serve');
    expect(doc).not.toContain("bun plugins/Muse/");
  });

  test("/generate-visual-recap documents MDX recap artifacts, local rendering, and dependency boundaries", async () => {
    const doc = await readFile(join(repoRoot, "plugins", "Muse", "commands", "generate-visual-recap.md"), "utf8");

    expect(doc).toMatch(/interactive [`]?muse[`]? recap/i);
    expect(doc).toMatch(/plan\.mdx/);
    expect(doc).toMatch(/visual-explainer\.json/);
    expect(doc).toMatch(/Render and serve locally|interactive-plan tools|local/i);
    expect(doc).toMatch(/No Agent Native|Do not use Agent Native/i);
    expect(doc).toMatch(/No React|Do not add React/i);
    expect(doc).toMatch(/hosted Plan MCP/i);
    expect(doc).toContain('bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" render');
    expect(doc).toContain('bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" serve');
  });
});
