import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

import { MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
import { servePlan } from "../plugins/Muse/skills/muse/tools/interactive-plan/server.ts";

const repoRoot = join(import.meta.dir, "..");
const fixtureDir = join(repoRoot, "tests", "fixtures", "interactive-plans", "component-library-showcase");
const session = `muse-component-explorer-${process.pid}`;

async function browser(...args: string[]): Promise<string> {
  const process = Bun.spawn(["agent-browser", "--session", session, ...args], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  assert.equal(exitCode, 0, `${args.join(" ")} failed:\n${stderr || stdout}`);
  return stdout.trim();
}

async function evaluate<T>(expression: string): Promise<T> {
  return JSON.parse(await browser("eval", expression)) as T;
}

const mobileState = `(() => {
  const search = document.querySelector('[data-component-search]');
  search.scrollIntoView({ block: 'center', behavior: 'instant' });
  const searchRect = search.getBoundingClientRect();
  const chromeRect = document.querySelector('.ve-ip-chrome').getBoundingClientRect();
  const overlapArea = Math.max(0, Math.min(searchRect.right, chromeRect.right) - Math.max(searchRect.left, chromeRect.left))
    * Math.max(0, Math.min(searchRect.bottom, chromeRect.bottom) - Math.max(searchRect.top, chromeRect.top));
  const hit = document.elementFromPoint(searchRect.right - 4, searchRect.top + searchRect.height / 2);
  return {
    theme: document.documentElement.dataset.theme,
    overlapArea,
    searchHit: hit === search,
    searchValue: search.value,
    resultText: document.querySelector('[data-component-results]').textContent,
    visibleTypes: Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]')).filter((block) => !block.hidden).map((block) => block.dataset.blockType),
    visibleNavCount: Array.from(document.querySelectorAll('.ve-ip-nav a')).filter((link) => !link.hidden).length,
  };
})()`;

const server = await servePlan(fixtureDir, 0);
try {
  await browser("open", `http://127.0.0.1:${server.port}`);
  await browser("set", "viewport", "390", "844");
  await evaluate(`(() => { if (document.documentElement.dataset.theme !== 'light') document.querySelector('[data-theme-toggle]').click(); return document.documentElement.dataset.theme; })()`);
  await browser("fill", "[data-component-search]", "PlanSummary");
  const mobileLight = await evaluate<{
    theme: string; overlapArea: number; searchHit: boolean; searchValue: string;
    resultText: string; visibleTypes: string[]; visibleNavCount: number;
  }>(mobileState);
  assert.deepEqual(mobileLight, {
    theme: "light",
    overlapArea: 0,
    searchHit: true,
    searchValue: "PlanSummary",
    resultText: `1 example · 1 unique of canonical ${MDX_COMPONENT_NAMES.length}`,
    visibleTypes: ["PlanSummary"],
    visibleNavCount: 1,
  });

  await browser("fill", "[data-component-search]", "");
  await browser("click", "[data-theme-toggle]");
  await browser("fill", "[data-component-search]", "PlanSummary");
  const mobileDark = await evaluate<typeof mobileLight>(mobileState);
  assert.deepEqual(mobileDark, { ...mobileLight, theme: "dark" });

  await browser("fill", "[data-component-search]", "");
  await browser("click", "[data-component-filter=\"Diagram\"]");
  const filtered = await evaluate<{ resultText: string; visibleTypes: string[]; visibleNavCount: number }>(`(() => ({
    resultText: document.querySelector('[data-component-results]').textContent,
    visibleTypes: Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]')).filter((block) => !block.hidden).map((block) => block.dataset.blockType),
    visibleNavCount: Array.from(document.querySelectorAll('.ve-ip-nav a')).filter((link) => !link.hidden).length,
  }))()`);
  assert.deepEqual(filtered, {
    resultText: `1 example · 1 unique of canonical ${MDX_COMPONENT_NAMES.length}`,
    visibleTypes: ["ArchitectureDiagram"],
    visibleNavCount: 1,
  });

  await browser("click", "[data-component-filter=\"\"]");
  await browser("set", "viewport", "1440", "900");
  const desktop = await evaluate<{
    navPosition: string; navOverflowY: string; navScrollable: boolean; lastLinkReachable: boolean;
    chromePosition: string; themeBefore: string; themeAfter: string; headings: string[];
    exampleCount: number; uniqueCount: number; declaredCount: number; hasInteractiveStateClient: boolean;
  }>(`(() => {
    const nav = document.querySelector('.ve-ip-nav');
    const chrome = document.querySelector('.ve-ip-chrome');
    nav.scrollTop = nav.scrollHeight;
    const navRect = nav.getBoundingClientRect();
    const lastRect = nav.lastElementChild.getBoundingClientRect();
    const themeBefore = document.documentElement.dataset.theme;
    document.querySelector('[data-theme-toggle]').click();
    const blocks = Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]'));
    return {
      navPosition: getComputedStyle(nav).position,
      navOverflowY: getComputedStyle(nav).overflowY,
      navScrollable: nav.scrollHeight > nav.clientHeight,
      lastLinkReachable: lastRect.bottom <= navRect.bottom + 1 && lastRect.top >= navRect.top - 1,
      chromePosition: getComputedStyle(chrome).position,
      themeBefore,
      themeAfter: document.documentElement.dataset.theme,
      headings: ['component-explorer-title', 'summary-title', 'component-table-title'].map((id) => document.getElementById(id)?.textContent),
      exampleCount: blocks.length,
      uniqueCount: new Set(blocks.map((block) => block.dataset.blockType)).size,
      declaredCount: Number(document.querySelector('[data-component-explorer]').dataset.componentCount),
      hasInteractiveStateClient: Array.from(document.scripts).some((script) => script.textContent.includes('postJson("/api/state"')),
    };
  })()`);
  assert.equal(desktop.navPosition, "fixed");
  assert.equal(desktop.navOverflowY, "auto");
  assert.equal(desktop.navScrollable, true);
  assert.equal(desktop.lastLinkReachable, true);
  assert.equal(desktop.chromePosition, "fixed");
  assert.notEqual(desktop.themeAfter, desktop.themeBefore);
  assert.deepEqual(desktop.headings, ["Catalog", "Review Scenario", "QA / reference inventory"]);
  assert.equal(desktop.exampleCount, MDX_COMPONENT_NAMES.length);
  assert.equal(desktop.uniqueCount, MDX_COMPONENT_NAMES.length);
  assert.equal(desktop.declaredCount, MDX_COMPONENT_NAMES.length);
  assert.equal(desktop.hasInteractiveStateClient, true);

  await browser("open", pathToFileURL(join(fixtureDir, "dist", "static-export.html")).href);
  const staticState = await evaluate<{ headings: string[]; exampleCount: number; uniqueCount: number; declaredCount: number; hasInteractiveStateClient: boolean }>(`(() => {
    const blocks = Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]'));
    return {
      headings: ['component-explorer-title', 'summary-title', 'component-table-title'].map((id) => document.getElementById(id)?.textContent),
      exampleCount: blocks.length,
      uniqueCount: new Set(blocks.map((block) => block.dataset.blockType)).size,
      declaredCount: Number(document.querySelector('[data-component-explorer]').dataset.componentCount),
      hasInteractiveStateClient: Array.from(document.scripts).some((script) => script.textContent.includes('postJson("/api/state"')),
    };
  })()`);
  assert.deepEqual(staticState, {
    headings: ["Catalog", "Review Scenario", "QA / reference inventory"],
    exampleCount: MDX_COMPONENT_NAMES.length,
    uniqueCount: MDX_COMPONENT_NAMES.length,
    declaredCount: MDX_COMPONENT_NAMES.length,
    hasInteractiveStateClient: false,
  });

  console.log("component explorer browser contract passed");
} finally {
  await browser("close").catch(() => undefined);
  server.stop(true);
}
