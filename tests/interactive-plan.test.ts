import { describe, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Window } from "happy-dom";

import { renderBlock } from "../plugins/Muse/skills/muse/tools/interactive-plan/components.ts";
import { interactivePlanInteractionScript } from "../plugins/Muse/skills/muse/tools/interactive-plan/client.ts";
import { loadPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/mdx-loader.ts";
import { renderPlanFolder, renderPlanHtml } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";
import { validateRenderedHtmlIds } from "../plugins/Muse/skills/muse/tools/interactive-plan/schema.ts";
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
          "component-anchor",
          "questions",
          "checks",
          "approval",
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

      const nestedTabs = [...document.querySelectorAll('#nested > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]')];
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
