import assert from "node:assert/strict";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

import { MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
import { servePlan } from "../plugins/Muse/skills/muse/tools/interactive-plan/server.ts";
type MobileState = {
  theme: string;
  searchValue: string;
  resultText: string;
  visibleTypes: string[];
  visibleNavCount: number;
  positions: Array<{ name: string; scrollY: number; overlapArea: number; searchHits: boolean[] }>;
};
interface RunningServer {
  port?: number;
  stop(closeActiveConnections?: boolean): void;
}


const repoRoot = join(import.meta.dir, "..");
const sourceFixtureDir = join(repoRoot, "tests", "fixtures", "interactive-plans", "component-library-showcase");
const session = `muse-component-explorer-${process.pid}`;
const agentBrowserPath = Bun.which("agent-browser");
if (!agentBrowserPath) {
  throw new Error("Missing required executable: agent-browser. Install it before running `vp run component-explorer:test-browser`.");
}
const agentBrowserExecutable = agentBrowserPath;
const operationTimeoutMs = 30_000;

async function runAgentBrowser(args: string[], sessionScoped: boolean): Promise<string> {
  const command = [
    agentBrowserExecutable,
    ...(sessionScoped ? ["--session", session] : []),
    ...args,
  ];
  const process = Bun.spawn(command, {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
    signal: AbortSignal.timeout(operationTimeoutMs),
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  assert.equal(exitCode, 0, `${command.join(" ")} failed:\n${stderr || stdout}`);
  return stdout.trim();
}


async function browser(...args: string[]): Promise<string> {
  return runAgentBrowser(args, true);
}

const agentBrowserVersion = await runAgentBrowser(["--version"], false);
assert.match(agentBrowserVersion, /^agent-browser \d+\.\d+\.\d+$/, `Unsupported agent-browser version output: ${agentBrowserVersion}`);
await runAgentBrowser(["doctor", "--offline", "--quick"], false);

async function evaluate<T>(expression: string): Promise<T> {
  return JSON.parse(await browser("eval", expression)) as T;
}

const mobileState = `(() => {
  const search = document.querySelector('[data-component-search]');
  const absoluteTop = search.getBoundingClientRect().top + scrollY;
  const scrollPositions = [
    { name: 'natural', top: 0 },
    { name: 'viewport-bottom', top: Math.max(0, absoluteTop + search.offsetHeight - innerHeight) },
    { name: 'viewport-top', top: absoluteTop },
  ];
  const positions = scrollPositions.map(({ name, top }) => {
    window.scrollTo({ top, behavior: 'instant' });
    const searchRect = search.getBoundingClientRect();
    const chromeRect = document.querySelector('.ve-ip-chrome').getBoundingClientRect();
    const overlapArea = Math.max(0, Math.min(searchRect.right, chromeRect.right) - Math.max(searchRect.left, chromeRect.left))
      * Math.max(0, Math.min(searchRect.bottom, chromeRect.bottom) - Math.max(searchRect.top, chromeRect.top));
    const visibleTop = Math.max(0, searchRect.top);
    const visibleBottom = Math.min(innerHeight, searchRect.bottom);
    const hitY = visibleTop + (visibleBottom - visibleTop) / 2;
    const hitX = [searchRect.left + 4, searchRect.left + searchRect.width / 2, searchRect.right - 4];
    return {
      name,
      scrollY,
      overlapArea,
      searchHits: hitX.map((x) => document.elementFromPoint(x, hitY) === search),
    };
  });
  return {
    theme: document.documentElement.dataset.theme,
    searchValue: search.value,
    resultText: document.querySelector('[data-component-results]').textContent,
    visibleTypes: Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]')).filter((block) => !block.hidden).map((block) => block.dataset.blockType),
    visibleNavCount: Array.from(document.querySelectorAll('.ve-ip-nav a')).filter((link) => !link.hidden).length,
    positions,
  };
})()`;

function assertMobileState(state: MobileState, theme: "light" | "dark"): void {
  assert.equal(state.theme, theme);
  assert.equal(state.searchValue, "PlanSummary");
  assert.equal(state.resultText, `1 example · 1 unique of canonical ${MDX_COMPONENT_NAMES.length}`);
  assert.deepEqual(state.visibleTypes, ["PlanSummary"]);
  assert.equal(state.visibleNavCount, 1);
  assert.equal(state.positions[0]?.name, "natural");
  assert.equal(state.positions[0]?.scrollY, 0);
  for (const position of state.positions) {
    assert.equal(position.overlapArea, 0, `${theme} ${position.name}: theme chrome overlaps search`);
    assert.deepEqual(position.searchHits, [true, true, true], `${theme} ${position.name}: search is not hit-testable across its width`);
  }
}

const fixtureDir = await mkdtemp(join(tmpdir(), "muse-component-explorer-"));
await cp(sourceFixtureDir, fixtureDir, { recursive: true });
let server: RunningServer | undefined;
let testFailure: unknown;
try {
  const serverStartTimeout = AbortSignal.timeout(operationTimeoutMs);
  const startedServer = await Promise.race([
    servePlan(fixtureDir, 0),
    new Promise<never>((_, reject) => {
      serverStartTimeout.addEventListener("abort", () => reject(new Error(`Muse fixture server did not start within ${operationTimeoutMs}ms`)), { once: true });
    }),
  ]);
  if (startedServer.port === undefined) throw new Error("Muse fixture server did not publish a dynamic port");
  server = startedServer;
  const serverPort = startedServer.port;
  await browser("open", "about:blank");
  await browser("network", "route", "https://fonts.googleapis.com/**", "--abort");
  await browser("network", "route", "https://fonts.gstatic.com/**", "--abort");
  await browser("network", "route", "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js", "--body", "window.mermaid={initialize(){},async render(){return {svg:'<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 40\"><title>Deterministic Mermaid fixture</title><rect width=\"100\" height=\"40\"/></svg>'}}};");
  await browser("open", `http://127.0.0.1:${serverPort}`);
  await browser("set", "viewport", "390", "844");
  await evaluate(`(() => { if (document.documentElement.dataset.theme !== 'light') document.querySelector('[data-theme-toggle]').click(); return document.documentElement.dataset.theme; })()`);
  await browser("fill", "[data-component-search]", "PlanSummary");
  const mobileLight = await evaluate<MobileState>(mobileState);
  assertMobileState(mobileLight, "light");

  await browser("fill", "[data-component-search]", "");
  await browser("click", "[data-theme-toggle]");
  await browser("fill", "[data-component-search]", "PlanSummary");
  const mobileDark = await evaluate<MobileState>(mobileState);
  assertMobileState(mobileDark, "dark");
  await evaluate(`(() => {
    const style = document.createElement('style');
    style.id = 'fixed-chrome-regression-probe';
    style.textContent = '@media (max-width: 860px) { .ve-ip-chrome { position: fixed !important; top: auto !important; bottom: 1rem !important; } }';
    document.head.append(style);
    return true;
  })()`);
  const fixedChromeRegression = await evaluate<MobileState>(mobileState);
  assert.equal(
    fixedChromeRegression.positions.some((position) => position.overlapArea > 0 || position.searchHits.some((hit) => !hit)),
    true,
    "mobile collision probe must fail when fixed chrome is restored",
  );
  await evaluate(`(() => { document.getElementById('fixed-chrome-regression-probe').remove(); return true; })()`);

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
  await browser("wait", ".mermaid-canvas svg");
  const diagramBefore = await evaluate<{ renderState: string | null; transform: string; title: string | null }>(`(() => ({
    renderState: document.querySelector('.mermaid-wrap').getAttribute('data-render-state'),
    transform: document.querySelector('.mermaid-canvas').style.transform,
    title: document.querySelector('.mermaid-canvas svg title')?.textContent || null,
  }))()`);
  await browser("click", "[data-zoom=\"in\"]");
  const diagramAfter = await evaluate<{ transform: string }>(`(() => ({
    transform: document.querySelector('.mermaid-canvas').style.transform,
  }))()`);
  assert.equal(diagramBefore.renderState, "rendered");
  assert.equal(diagramBefore.title, "Deterministic Mermaid fixture");
  assert.notEqual(diagramAfter.transform, diagramBefore.transform);

  const reviewSelector = "[data-plan-questions] input,[data-checklist-id],[data-approve-plan],[data-needs-revision]";
  await browser("wait", "--fn", `Array.from(document.querySelectorAll('${reviewSelector}')).every((control) => !control.disabled)`);
  await browser("fill", "[data-plan-questions] input", "Browser runtime proof");
  const reviewControls = await evaluate<{ count: number; allVisible: boolean; allEnabled: boolean; answer: string }>(`(() => {
    const controls = Array.from(document.querySelectorAll('${reviewSelector}'));
    return {
      count: controls.length,
      allVisible: controls.every((control) => {
        const rect = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }),
      allEnabled: controls.every((control) => !control.disabled),
      answer: document.querySelector('[data-plan-questions] input').value,
    };
  })()`);
  assert.equal(reviewControls.count >= 4, true);
  assert.equal(reviewControls.allVisible, true);
  assert.equal(reviewControls.allEnabled, true);
  assert.equal(reviewControls.answer, "Browser runtime proof");


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

  console.log(`component explorer browser contract passed (${agentBrowserVersion})`);
} catch (error) {
  testFailure = error;
}

const cleanupErrors: unknown[] = [];
try {
  await browser("close");
} catch (error) {
  cleanupErrors.push(new Error("Failed to close agent-browser session", { cause: error }));
}
try {
  server?.stop(true);
} catch (error) {
  cleanupErrors.push(new Error("Failed to stop Muse fixture server", { cause: error }));
}
try {
  await rm(fixtureDir, { recursive: true, force: true });
} catch (error) {
  cleanupErrors.push(new Error(`Failed to remove isolated fixture ${fixtureDir}`, { cause: error }));
}
if (testFailure) cleanupErrors.unshift(testFailure);
if (cleanupErrors.length > 0) {
  throw new AggregateError(cleanupErrors, "Component explorer browser contract or cleanup failed");
}
