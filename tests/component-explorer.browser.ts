import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";

type Theme = "light" | "dark";
type Viewport = "desktop" | "mobile";

interface RunningServer {
  port: number;
  stop(): Promise<void>;
}

interface CleanupAction {
  name: string;
  run(): Promise<void> | void;
}

interface BrowserSurface {
  name: "interactive" | "static";
  path: "/" | "/static-export.html";
  persistence: boolean;
}

interface SearchPosition {
  anchor: "top" | "middle" | "bottom";
  points: Array<{ x: number; y: number; hit: boolean }>;
  overlapArea: number;
}

interface CatalogState {
  resultText: string;
  visibleTypes: string[];
  visibleNavCount: number;
}

interface ReviewState {
  status: string;
  reviewer?: string;
  answers: Record<string, string>;
  checklist: Record<string, boolean>;
}

interface NetworkRequest {
  url: string;
  status: number;
  resourceType: string;
  responseHeaders: Record<string, string>;
}

interface NetworkLog {
  success: boolean;
  data: { requests: NetworkRequest[] };
}

type ChildProcess = Bun.Subprocess<"ignore", "pipe", "pipe">;

const repoRoot = join(import.meta.dir, "..");
const sourceFixtureDir = join(repoRoot, "tests", "fixtures", "interactive-plans", "component-library-showcase");
const session = `muse-component-explorer-${process.pid}`;
const operationTimeoutMs = 30_000;
const shutdownGraceMs = 2_000;
const testedAgentBrowserVersion = "0.31.1";
const expectedMermaidVersion = "11.16.0";
const expectedMermaidUrl = `https://cdn.jsdelivr.net/npm/mermaid@${expectedMermaidVersion}/dist/mermaid.min.js`;
let agentBrowserExecutable = "";

async function bounded<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  const timeout = Promise.withResolvers<never>();
  const timeoutId = setTimeout(() => timeout.reject(new Error(message)), timeoutMs);
  try {
    return await Promise.race([promise, timeout.promise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function terminateChild(child: ChildProcess, label: string): Promise<void> {
  child.kill("SIGTERM");
  try {
    await bounded(child.exited, shutdownGraceMs, `${label} ignored SIGTERM`);
  } catch (termError) {
    child.kill("SIGKILL");
    try {
      await bounded(child.exited, shutdownGraceMs, `${label} did not exit after SIGKILL`);
    } catch (killError) {
      throw new AggregateError([termError, killError], `${label} could not be terminated`);
    }
  }
}

async function runAgentBrowser(args: string[], sessionScoped: boolean): Promise<string> {
  const command = [agentBrowserExecutable, ...(sessionScoped ? ["--session", session] : []), ...args];
  const child = Bun.spawn(command, { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
  const stdout = new Response(child.stdout).text();
  const stderr = new Response(child.stderr).text();

  try {
    const exitCode = await bounded(child.exited, operationTimeoutMs, `${command.join(" ")} exceeded ${operationTimeoutMs}ms`);
    const [stdoutText, stderrText] = await Promise.all([
      bounded(stdout, shutdownGraceMs, `${command.join(" ")} stdout did not drain`),
      bounded(stderr, shutdownGraceMs, `${command.join(" ")} stderr did not drain`),
    ]);
    assert.equal(exitCode, 0, `${command.join(" ")} failed:\n${stderrText || stdoutText}`);
    return stdoutText.trim();
  } catch (primaryError) {
    const cleanupErrors: unknown[] = [];
    try {
      await terminateChild(child, command.join(" "));
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const [name, drain] of [["stdout", stdout], ["stderr", stderr]] as const) {
      try {
        await bounded(drain, shutdownGraceMs, `${command.join(" ")} ${name} did not drain after termination`);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError([primaryError, ...cleanupErrors], `${command.join(" ")} failed and cleanup was incomplete`);
    }
    throw primaryError;
  }
}

async function browser(...args: string[]): Promise<string> {
  return runAgentBrowser(args, true);
}

async function evaluate<T>(expression: string): Promise<T> {
  return JSON.parse(await browser("eval", expression)) as T;
}

async function startServer(planDir: string): Promise<RunningServer> {
  const serverScript = join(repoRoot, "plugins", "Muse", "skills", "muse", "tools", "interactive-plan", "server.ts");
  const command = [process.execPath, serverScript, planDir, "0"];
  const child = Bun.spawn(command, { cwd: repoRoot, stdout: "pipe", stderr: "pipe" });
  const stderr = new Response(child.stderr).text();
  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let output = "";

  const publishedPort = (async () => {
    while (true) {
      const chunk = await reader.read();
      output += decoder.decode(chunk.value, { stream: !chunk.done });
      const match = output.match(/Muse plan review: http:\/\/localhost:(\d+)\//);
      if (match?.[1]) return Number(match[1]);
      if (chunk.done) {
        const exitCode = await child.exited;
        throw new Error(`Muse fixture server exited with ${exitCode} before publishing a port:\n${await stderr || output}`);
      }
    }
  })();

  try {
    const port = await bounded(publishedPort, operationTimeoutMs, `Muse fixture server did not start within ${operationTimeoutMs}ms`);
    const stdout = (async () => {
      while (true) {
        const chunk = await reader.read();
        output += decoder.decode(chunk.value, { stream: !chunk.done });
        if (chunk.done) return output;
      }
    })();
    return {
      port,
      async stop() {
        const cleanupErrors: unknown[] = [];
        try {
          await terminateChild(child, "Muse fixture server");
        } catch (error) {
          cleanupErrors.push(error);
        }
        for (const [name, drain] of [["stdout", stdout], ["stderr", stderr]] as const) {
          try {
            await bounded(drain, shutdownGraceMs, `Muse fixture server ${name} did not drain`);
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
        if (cleanupErrors.length > 0) throw new AggregateError(cleanupErrors, "Muse fixture server cleanup failed");
      },
    };
  } catch (primaryError) {
    await reader.cancel().catch(() => {});
    const cleanupErrors: unknown[] = [];
    try {
      await terminateChild(child, "Muse fixture server startup");
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await bounded(stderr, shutdownGraceMs, "Muse fixture server stderr did not drain after startup failure");
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError([primaryError, ...cleanupErrors], "Muse fixture server startup failed and cleanup was incomplete");
    }
    throw primaryError;
  }
}

async function pointerClick(selector: string): Promise<void> {
  const point = await evaluate<{ x: number; y: number }>(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error('Missing pointer target: ' + ${JSON.stringify(selector)});
    element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const rect = element.getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
  })()`);
  await browser("mouse", "move", String(point.x), String(point.y));
  await browser("mouse", "down", "left");
  await browser("mouse", "up", "left");
}

async function setThemeWithPointer(theme: Theme): Promise<void> {
  const before = await evaluate<string>("document.documentElement.dataset.theme");
  await pointerClick("[data-theme-toggle]");
  const toggled = await evaluate<string>("document.documentElement.dataset.theme");
  assert.notEqual(toggled, before, "pointer click must toggle the theme");
  if (toggled !== theme) await pointerClick("[data-theme-toggle]");
  assert.equal(await evaluate<string>("document.documentElement.dataset.theme"), theme);
}

async function waitForProductionAssets(): Promise<void> {
  await browser("wait", "--fn", "document.fonts && document.fonts.status === 'loaded'");
  const assets = await evaluate<{
    loadedFamilies: string[];
    nonexistentLoaded: boolean;
    mermaidScriptUrl: string | null;
  }>(`document.fonts.ready.then(() => {
    const normalizeFamily = (family) => family.replace(/^['"]|['"]$/g, '').toLowerCase();
    const loadedFamilies = Array.from(document.fonts)
      .filter((face) => face.status === 'loaded')
      .map((face) => normalizeFamily(face.family));
    return {
      loadedFamilies,
      nonexistentLoaded: loadedFamilies.includes('muse nonexistent oracle'),
      mermaidScriptUrl: document.querySelector('script[src*="mermaid"]')?.src || null,
    };
  })`);
  assert.ok(assets.loadedFamilies.includes("bricolage grotesque"), "Bricolage Grotesque must be a registered loaded FontFace");
  assert.ok(assets.loadedFamilies.includes("fragment mono"), "Fragment Mono must be a registered loaded FontFace");
  assert.equal(assets.nonexistentLoaded, false, "the loaded-FontFace oracle must reject a nonexistent family");

  const network = JSON.parse(await browser("network", "requests", "--json")) as NetworkLog;
  assert.equal(network.success, true, "agent-browser must expose successful response metadata");
  const stylesheetResponse = network.data.requests.find((response) => response.url.startsWith("https://fonts.googleapis.com/css2?"));
  assert.equal(stylesheetResponse?.status, 200, "the production Google Fonts stylesheet must return HTTP 200");
  const fontResponses = network.data.requests.filter((response) => response.url.startsWith("https://fonts.gstatic.com/"));
  assert.ok(fontResponses.length >= 2, "both production font families must load font resources");
  assert.equal(fontResponses.every((response) => response.status === 200), true, "every production font response must return HTTP 200");

  assert.equal(assets.mermaidScriptUrl, expectedMermaidUrl, "Mermaid must use the pinned production release URL");
  const mermaidResponse = network.data.requests.find((response) => response.url === expectedMermaidUrl);
  assert.deepEqual(
    mermaidResponse && {
      url: mermaidResponse.url,
      status: mermaidResponse.status,
      resourceType: mermaidResponse.resourceType,
      version: mermaidResponse.responseHeaders["x-jsd-version"],
    },
    { url: expectedMermaidUrl, status: 200, resourceType: "Script", version: expectedMermaidVersion },
    "the expected-origin and version Mermaid release must load successfully",
  );

  await browser("wait", ".mermaid-canvas svg");
  const mermaid = await evaluate<{ renderState: string | null; groups: number; text: string; runtime: boolean }>(`(() => {
    const wrap = document.querySelector('.mermaid-wrap');
    const svg = wrap?.querySelector('.mermaid-canvas svg');
    return {
      renderState: wrap?.getAttribute('data-render-state') || null,
      groups: svg?.querySelectorAll('g').length || 0,
      text: svg?.textContent || '',
      runtime: typeof window.mermaid?.render === 'function',
    };
  })()`);
  assert.equal(mermaid.renderState, "rendered");
  assert.equal(mermaid.runtime, true, "the pinned production Mermaid runtime must be executable");
  assert.ok(mermaid.groups > 0, "real Mermaid output must contain rendered graph groups");
  assert.match(mermaid.text, /Agent writes plan\.mdx/);
}

async function assertSharedCatalogContract(surface: BrowserSurface): Promise<void> {
  const framing = await evaluate<{
    headings: string[];
    exampleCount: number;
    uniqueCount: number;
    declaredCount: number;
    canonicalCount: number;
    persistenceClient: boolean;
  }>(`(() => {
    const blocks = Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]'));
    const explorer = document.querySelector('[data-component-explorer]');
    return {
      headings: ['component-explorer-title', 'summary-title', 'component-table-title'].map((id) => document.getElementById(id)?.textContent || ''),
      exampleCount: blocks.length,
      uniqueCount: new Set(blocks.map((block) => block.dataset.blockType)).size,
      declaredCount: Number(explorer?.dataset.componentCount),
      canonicalCount: Number(explorer?.dataset.componentCanonicalCount),
      persistenceClient: Array.from(document.scripts).some((script) => script.textContent.includes('postJson("/api/state"')),
    };
  })()`);
  assert.deepEqual(framing.headings, ["Catalog", "Review Scenario", "QA / reference inventory"]);
  assert.equal(framing.exampleCount, MDX_COMPONENT_NAMES.length);
  assert.equal(framing.uniqueCount, MDX_COMPONENT_NAMES.length);
  assert.equal(framing.declaredCount, MDX_COMPONENT_NAMES.length);
  assert.equal(framing.canonicalCount, MDX_COMPONENT_NAMES.length);
  assert.equal(framing.persistenceClient, surface.persistence);

  await browser("fill", "[data-component-search]", "PlanSummary");
  const searched = await evaluate<CatalogState>(`(() => ({
    resultText: document.querySelector('[data-component-results]').textContent,
    visibleTypes: Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]')).filter((block) => !block.hidden).map((block) => block.dataset.blockType),
    visibleNavCount: Array.from(document.querySelectorAll('.ve-ip-nav a')).filter((link) => !link.hidden).length,
  }))()`);
  assert.deepEqual(searched, {
    resultText: `1 example · 1 unique of canonical ${MDX_COMPONENT_NAMES.length}`,
    visibleTypes: ["PlanSummary"],
    visibleNavCount: 1,
  });

  await browser("fill", "[data-component-search]", "");
  await pointerClick('[data-component-filter="Diagram"]');
  const filtered = await evaluate<CatalogState>(`(() => ({
    resultText: document.querySelector('[data-component-results]').textContent,
    visibleTypes: Array.from(document.querySelectorAll('.ve-ip-block[data-component-category]')).filter((block) => !block.hidden).map((block) => block.dataset.blockType),
    visibleNavCount: Array.from(document.querySelectorAll('.ve-ip-nav a')).filter((link) => !link.hidden).length,
  }))()`);
  assert.deepEqual(filtered, {
    resultText: `1 example · 1 unique of canonical ${MDX_COMPONENT_NAMES.length}`,
    visibleTypes: ["ArchitectureDiagram"],
    visibleNavCount: 1,
  });
  await pointerClick('[data-component-filter=""]');

  const transformBefore = await evaluate<string>("document.querySelector('.mermaid-canvas').style.transform");
  await pointerClick('[data-zoom="in"]');
  await browser("wait", "--fn", `document.querySelector('.mermaid-canvas').style.transform !== ${JSON.stringify(transformBefore)}`);
  const transformAfter = await evaluate<string>("document.querySelector('.mermaid-canvas').style.transform");
  assert.notEqual(transformAfter, transformBefore, `${surface.name} Mermaid zoom must mutate the production canvas transform`);
}

async function positionSearch(anchor: SearchPosition["anchor"]): Promise<SearchPosition> {
  return evaluate<SearchPosition>(`(() => {
    const search = document.querySelector('[data-component-search]');
    const chrome = document.querySelector('.ve-ip-chrome');
    const anchorRatios = { top: 0.22, middle: 0.5, bottom: 0.78 };
    const absoluteCenter = search.getBoundingClientRect().top + scrollY + search.offsetHeight / 2;
    window.scrollTo({ top: Math.max(0, absoluteCenter - innerHeight * anchorRatios[${JSON.stringify(anchor)}]), behavior: 'instant' });
    const searchRect = search.getBoundingClientRect();
    const chromeRect = chrome.getBoundingClientRect();
    const overlapArea = Math.max(0, Math.min(searchRect.right, chromeRect.right) - Math.max(searchRect.left, chromeRect.left))
      * Math.max(0, Math.min(searchRect.bottom, chromeRect.bottom) - Math.max(searchRect.top, chromeRect.top));
    const xs = [searchRect.left + 6, searchRect.left + searchRect.width / 2, searchRect.right - 6];
    const ys = [searchRect.top + 6, searchRect.top + searchRect.height / 2, searchRect.bottom - 6];
    const points = ys.flatMap((y) => xs.map((x) => ({
      x: Math.round(x),
      y: Math.round(y),
      hit: document.elementFromPoint(x, y) === search,
    })));
    return { anchor: ${JSON.stringify(anchor)}, points, overlapArea };
  })()`);
}

async function assertMobileGeometry(surface: BrowserSurface, theme: Theme): Promise<void> {
  for (const anchor of ["top", "middle", "bottom"] as const) {
    const position = await positionSearch(anchor);
    assert.equal(position.overlapArea, 0, `${surface.name} ${theme} ${anchor}: theme chrome overlaps search`);
    assert.deepEqual(position.points.map((point) => point.hit), Array(9).fill(true), `${surface.name} ${theme} ${anchor}: search is intercepted`);
    for (const [pointIndex, point] of position.points.entries()) {
      await evaluate(`(() => {
        const search = document.querySelector('[data-component-search]');
        search.value = '';
        search.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await browser("mouse", "move", String(point.x), String(point.y));
      await browser("mouse", "down", "left");
      await browser("mouse", "up", "left");
      const focused = await evaluate<boolean>("document.activeElement === document.querySelector('[data-component-search]')");
      assert.equal(focused, true, `${surface.name} ${theme} ${anchor}/${pointIndex}: coordinate click did not focus search`);
      await browser("keyboard", "type", "P");
      const value = await evaluate<string>("document.querySelector('[data-component-search]').value");
      assert.equal(value, "P", `${surface.name} ${theme} ${anchor}/${pointIndex}: raw focused keyboard typing failed`);
    }
  }

  await positionSearch("bottom");
  await evaluate(`(() => {
    const searchRect = document.querySelector('[data-component-search]').getBoundingClientRect();
    const obstruction = document.createElement('div');
    obstruction.id = 'fixed-obstruction-regression-probe';
    Object.assign(obstruction.style, {
      position: 'fixed',
      inset: searchRect.top + 'px auto auto ' + searchRect.left + 'px',
      width: searchRect.width + 'px',
      height: searchRect.height + 'px',
      pointerEvents: 'auto',
      zIndex: '2147483647',
    });
    document.body.append(obstruction);
  })()`);
  try {
    const blocked = await evaluate<boolean>(`(() => {
      const rect = document.querySelector('[data-component-search]').getBoundingClientRect();
      const xs = [rect.left + 6, rect.left + rect.width / 2, rect.right - 6];
      const ys = [rect.top + 6, rect.top + rect.height / 2, rect.bottom - 6];
      return ys.flatMap((y) => xs.map((x) => document.elementFromPoint(x, y))).some((element) => !element?.matches('[data-component-search]'));
    })()`);
    assert.equal(blocked, true, `${surface.name} ${theme}: fixed mobile chrome negative control must intercept the search grid`);
  } finally {
    await evaluate("document.getElementById('fixed-obstruction-regression-probe').remove()");
  }
}

async function assertDesktopPointerNavigation(): Promise<void> {
  const nav = await evaluate<{ position: string; overflowY: string; scrollable: boolean }>(`(() => {
    const element = document.querySelector('.ve-ip-nav');
    const style = getComputedStyle(element);
    return { position: style.position, overflowY: style.overflowY, scrollable: element.scrollHeight > element.clientHeight };
  })()`);
  assert.deepEqual(nav, { position: "fixed", overflowY: "auto", scrollable: true });

  for (const selector of [".ve-ip-nav a:first-of-type", ".ve-ip-nav a:last-of-type"]) {
    const href = await evaluate<string>(`document.querySelector(${JSON.stringify(selector)}).getAttribute('href')`);
    await pointerClick(selector);
    await browser("wait", "--fn", `(() => {
      if (location.hash !== ${JSON.stringify(href)}) return false;
      const target = document.querySelector(location.hash);
      const rect = target?.getBoundingClientRect();
      return Boolean(rect && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth);
    })()`);
    const navigation = await evaluate<{ hash: string; visible: boolean }>(`(() => {
      const target = document.querySelector(location.hash);
      const rect = target.getBoundingClientRect();
      return { hash: location.hash, visible: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth };
    })()`);
    assert.equal(navigation.hash, href, `${selector} pointer click must update the hash`);
    assert.equal(navigation.visible, true, `${selector} pointer click must reveal its target`);
  }
}

async function runSurfaceCase(baseUrl: string, surface: BrowserSurface, viewport: Viewport, theme: Theme): Promise<void> {
  await browser("open", `${baseUrl}${surface.path}`);
  await browser("set", "viewport", ...(viewport === "mobile" ? ["390", "844"] : ["1440", "900"]));
  await waitForProductionAssets();
  await setThemeWithPointer(theme);
  await assertSharedCatalogContract(surface);
  if (viewport === "mobile") {
    await assertMobileGeometry(surface, theme);
  } else {
    await assertDesktopPointerNavigation();
  }
}

async function readAuthoritativeState(): Promise<ReviewState> {
  return evaluate<ReviewState>("fetch('/plan-state.json').then((response) => response.json())");
}
async function waitForAuthoritativeState(label: string, predicate: (state: ReviewState) => boolean): Promise<ReviewState> {
  const deadline = Date.now() + operationTimeoutMs;
  let state = await readAuthoritativeState();
  while (!predicate(state) && Date.now() < deadline) {
    await Bun.sleep(25);
    state = await readAuthoritativeState();
  }
  assert.equal(predicate(state), true, `Timed out waiting for authoritative state: ${label}`);
  return state;
}

async function assertPersistenceContract(baseUrl: string): Promise<void> {
  await browser("open", `${baseUrl}/`);
  await browser("set", "viewport", "1440", "900");
  await browser("wait", "[data-plan-questions] input");
  await browser("fill", "[data-plan-questions] input", "Authoritative browser answer");
  await browser("press", "Tab");
  await waitForAuthoritativeState("answer save", (state) => state.answers.palette === "Authoritative browser answer");
  await browser("check", "[data-checklist-id]");
  const saved = await waitForAuthoritativeState("checklist save", (state) => state.checklist["all-components"] === true);
  assert.equal(saved.answers.palette, "Authoritative browser answer");
  assert.equal(saved.checklist["all-components"], true);

  await pointerClick("[data-needs-revision]");
  const revision = await waitForAuthoritativeState("revision transition", (state) => state.status === "needs_revision");
  assert.equal(revision.status, "needs_revision");

  await pointerClick("[data-approve-plan]");
  const approved = await waitForAuthoritativeState("approval transition", (state) => state.status === "approved");
  const handoff = await evaluate<{ status: string; answers: Record<string, string>; verification: string[] }>("fetch('/agent-handoff.json').then((response) => response.json())");
  assert.equal(approved.status, "approved");
  assert.equal(approved.reviewer, "local-reviewer");
  assert.equal(handoff.status, "approved");
  assert.equal(handoff.answers.palette, "Authoritative browser answer");
  assert.ok(handoff.verification.some((item) => item.startsWith("all-components |")));

  await browser("open", `${baseUrl}/static-export.html`);
  const beforeStaticInteraction = await readAuthoritativeState();
  await browser("fill", "[data-plan-questions] input", "Static-only answer");
  await pointerClick("[data-checklist-id]");
  await pointerClick("[data-needs-revision]");
  await pointerClick("[data-approve-plan]");
  assert.deepEqual(await readAuthoritativeState(), beforeStaticInteraction, "static controls must not mutate authoritative review state");
}

const cleanupStack: CleanupAction[] = [];
const lifecycle: string[] = [];
const cleanupErrors: unknown[] = [];
let fixtureDir: string | undefined;
let testFailure: unknown;
let agentBrowserVersion = "unknown";

function registerCleanup(action: CleanupAction): void {
  cleanupStack.push(action);
  lifecycle.push(`setup:${action.name}`);
}

try {
  const packageManifest = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8")) as {
    config?: { testedAgentBrowserVersion?: string };
  };
  assert.equal(packageManifest.config?.testedAgentBrowserVersion, testedAgentBrowserVersion, "package.json must declare the tested agent-browser compatibility version");
  const agentBrowserPath = Bun.which("agent-browser");
  if (!agentBrowserPath) {
    throw new Error("Missing required executable: agent-browser. Install it before running `vp run component-explorer:test-browser`.");
  }
  agentBrowserExecutable = agentBrowserPath;
  agentBrowserVersion = await runAgentBrowser(["--version"], false);
  assert.equal(agentBrowserVersion, `agent-browser ${testedAgentBrowserVersion}`, `This repository is tested only with agent-browser ${testedAgentBrowserVersion}`);
  await runAgentBrowser(["doctor", "--offline", "--quick"], false);

  fixtureDir = await mkdtemp(join(tmpdir(), "muse-component-explorer-"));
  const isolatedFixture = fixtureDir;
  registerCleanup({
    name: "fixture",
    async run() {
      await rm(isolatedFixture, { recursive: true, force: true });
      assert.equal(existsSync(isolatedFixture), false, "isolated fixture cleanup must be observable");
    },
  });
  await cp(sourceFixtureDir, isolatedFixture, { recursive: true });

  const server = await startServer(isolatedFixture);
  registerCleanup({ name: "server", run: () => server.stop() });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  registerCleanup({ name: "browser", async run() { await browser("close"); } });
  await browser("open", "about:blank");

  const surfaces: BrowserSurface[] = [
    { name: "interactive", path: "/", persistence: true },
    { name: "static", path: "/static-export.html", persistence: false },
  ];
  for (const surface of surfaces) {
    for (const viewport of ["desktop", "mobile"] as const) {
      for (const theme of ["light", "dark"] as const) {
        await runSurfaceCase(baseUrl, surface, viewport, theme);
      }
    }
  }
  await assertPersistenceContract(baseUrl);
} catch (error) {
  testFailure = error;
} finally {
  for (const action of cleanupStack.reverse()) {
    lifecycle.push(`cleanup:${action.name}:start`);
    try {
      await action.run();
      lifecycle.push(`cleanup:${action.name}:done`);
    } catch (error) {
      lifecycle.push(`cleanup:${action.name}:failed`);
      cleanupErrors.push(new Error(`Failed to clean up ${action.name}`, { cause: error }));
    }
  }
}

console.log(`component explorer lifecycle: ${lifecycle.join(" -> ")}`);
if (testFailure) cleanupErrors.unshift(testFailure);
if (cleanupErrors.length > 0) {
  throw new AggregateError(cleanupErrors, "Component explorer browser contract or cleanup failed");
}
assert.deepEqual(
  lifecycle.filter((event) => event.endsWith(":done")),
  ["cleanup:browser:done", "cleanup:server:done", "cleanup:fixture:done"],
  "browser, server, and fixture must clean up in reverse acquisition order",
);
console.log(`component explorer browser contract passed (${agentBrowserVersion}; real Mermaid and production fonts)`);
