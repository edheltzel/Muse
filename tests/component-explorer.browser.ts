import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MDX_COMPONENT_NAMES } from "../plugins/Muse/skills/muse/tools/interactive-plan/shared.ts";
import {
  bounded,
  runProcess,
  startServerProcess,
  type LifecycleProcess,
} from "./support/process-lifecycle.ts";

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
  method: string;
  status: number;
  resourceType: string;
  responseHeaders: Record<string, string>;
}

interface NetworkLog {
  success: boolean;
  data: { requests: NetworkRequest[] };
}


const repoRoot = join(import.meta.dir, "..");
const sourceFixtureDir = join(repoRoot, "tests", "fixtures", "interactive-plans", "component-library-showcase");
const session = `muse-component-explorer-${process.pid}-${randomBytes(12).toString("hex")}`;
const operationTimeoutMs = 30_000;
const shutdownGraceMs = 2_000;
const staticQuietWindowMs = 750;
const testedAgentBrowserVersion = "0.31.1";
const expectedMermaidVersion = "11.16.0";
const expectedMermaidUrl = `https://cdn.jsdelivr.net/npm/mermaid@${expectedMermaidVersion}/dist/mermaid.min.js`;
const expectedMermaidSha256 = "74d7c46dabca328c2294733910a8aa1ed0c37451776e8d5295da38a2b758fb9b";
const expectedMermaidSri = "sha384-T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E";
const expectedFontFaces = [
  { family: "Bricolage Grotesque", weight: "500", sha256: "b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f" },
  { family: "Bricolage Grotesque", weight: "600", sha256: "b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca" },
  { family: "Bricolage Grotesque", weight: "700", sha256: "4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206" },
  { family: "Fragment Mono", weight: "400", sha256: "44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56" },
] as const;
let agentBrowserExecutable = "";

async function runAgentBrowser(args: string[], sessionScoped: boolean): Promise<string> {
  const command = [agentBrowserExecutable, ...(sessionScoped ? ["--session", session] : []), ...args];
  const result = await runProcess({
    command,
    label: command.join(" "),
    spawn: (spawnCommand) => Bun.spawn(spawnCommand, {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    }) as unknown as LifecycleProcess,
    operationTimeoutMs,
    cleanupTimeoutMs: shutdownGraceMs,
  });
  assert.equal(result.exitCode, 0, `${command.join(" ")} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

async function browser(...args: string[]): Promise<string> {
  return runAgentBrowser(args, true);
}

async function evaluate<T>(expression: string): Promise<T> {
  return JSON.parse(await browser("eval", expression)) as T;
}

async function startServer(planDir: string): Promise<RunningServer> {
  const serverScript = join(repoRoot, "plugins", "Muse", "skills", "muse", "tools", "interactive-plan", "server.ts");
  return startServerProcess({
    command: [process.execPath, serverScript, planDir, "0"],
    label: "Muse fixture server",
    spawn: (command) => Bun.spawn(command, {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    }) as unknown as LifecycleProcess,
    parsePort: (output) => output.match(/Muse plan review: http:\/\/localhost:(\d+)\//)?.[1],
    startupTimeoutMs: operationTimeoutMs,
    cleanupTimeoutMs: shutdownGraceMs,
  });
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

async function waitForProductionAssets(surface: BrowserSurface): Promise<void> {
  await browser("wait", "--fn", "document.fonts && document.fonts.status === 'loaded'");
  const assets = await evaluate<{
    fonts: Array<{ family: string; weight: string; sha256: string; embedded: boolean }>;
    mermaid: { url: string | null; integrity: string | null; sha256: string };
  }>(`(async () => {
    const expectedFaces = ${JSON.stringify(expectedFontFaces)};
    const digest = async (source) => {
      const bytes = await (await fetch(source)).arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    };
    await Promise.all(expectedFaces.map((face) => document.fonts.load(face.weight + ' 16px \"' + face.family + '\"')));
    await document.fonts.ready;
    const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
    const fontRules = rules.filter((rule) => rule instanceof CSSFontFaceRule);
    const fonts = await Promise.all(expectedFaces.map(async (expected) => {
      const rule = fontRules.find((candidate) => {
        const family = candidate.style.fontFamily.replace(/^['\"]|['\"]$/g, '');
        return family === expected.family && candidate.style.fontWeight === expected.weight;
      });
      if (!rule) throw new Error('Missing exact font face: ' + expected.family + ' ' + expected.weight);
      const source = rule.style.src.match(/url\\([\"']?([^\"')]+)[\"']?\\)/)?.[1];
      if (!source) throw new Error('Missing font source: ' + expected.family + ' ' + expected.weight);
      return { family: expected.family, weight: expected.weight, sha256: await digest(source), embedded: source.startsWith('data:') };
    }));
    const script = document.querySelector('script[src*=\"mermaid\"]');
    return {
      fonts,
      mermaid: {
        url: script?.src || null,
        integrity: script?.integrity || null,
        sha256: await digest(script.src),
      },
    };
  })()`);
  assert.deepEqual(
    assets.fonts,
    expectedFontFaces.map((face) => ({ ...face, embedded: surface.name === "static" })),
    `${surface.name} must render the exact pinned family, weight, and WOFF2 bytes`,
  );
  assert.deepEqual(assets.mermaid, {
    url: expectedMermaidUrl,
    integrity: expectedMermaidSri,
    sha256: expectedMermaidSha256,
  }, "Mermaid must carry independent SRI and match the exact 11.16.0 response bytes");

  const network = JSON.parse(await browser("network", "requests", "--json")) as NetworkLog;
  assert.equal(network.success, true, "agent-browser must expose successful response metadata");
  assert.equal(
    network.data.requests.some((response) => response.url.startsWith("https://fonts.googleapis.com/") || response.url.startsWith("https://fonts.gstatic.com/")),
    false,
    "font loading must never negotiate mutable Google Fonts resources",
  );
  if (surface.name === "interactive") {
    const fontResponses = network.data.requests.filter((response) => response.url.includes("/assets/") && response.resourceType === "Font");
    assert.equal(fontResponses.length >= expectedFontFaces.length, true, "every pinned interactive font resource must load");
    assert.equal(fontResponses.every((response) => response.status === 200), true, "every pinned font response must return HTTP 200");
  }
  const mermaidResponse = network.data.requests.find((response) => response.url === expectedMermaidUrl);
  assert.deepEqual(
    mermaidResponse && {
      url: mermaidResponse.url,
      status: mermaidResponse.status,
      resourceType: mermaidResponse.resourceType,
      version: mermaidResponse.responseHeaders["x-jsd-version"],
    },
    { url: expectedMermaidUrl, status: 200, resourceType: "Script", version: expectedMermaidVersion },
    "the independently digested Mermaid release must load successfully",
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
  await waitForProductionAssets(surface);
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

async function readAuthoritativeStateBytes(): Promise<string> {
  return evaluate<string>("fetch('/plan-state.json').then((response) => response.text())");
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

  await browser(
    "wait",
    "--fn",
    "document.body.dataset.reviewAuthority === 'ready' && document.querySelector('[data-persistence-key=\"revision\"]')?.dataset.persistenceState === 'saved' && document.querySelector('[data-approve-plan]')?.disabled === false",
  );
  assert.equal(
    await evaluate<boolean>("document.querySelector('[data-approve-plan]')?.disabled === false"),
    true,
    "approval pointer target must be enabled before clicking",
  );
  await browser("network", "requests", "--clear");

  await pointerClick("[data-approve-plan]");
  const approved = await waitForAuthoritativeState("approval transition", (state) => state.status === "approved");
  const approvalNetwork = JSON.parse(await browser("network", "requests", "--json")) as NetworkLog;
  assert.equal(approvalNetwork.success, true, "approval network observation must succeed");
  assert.equal(
    approvalNetwork.data.requests.some((request) =>
      request.method.toUpperCase() === "POST" && new URL(request.url).pathname === "/api/approve"
    ),
    true,
    "approval pointer click must emit POST /api/approve",
  );
  const handoff = await evaluate<{ status: string; answers: Record<string, string>; verification: string[] }>("fetch('/agent-handoff.json').then((response) => response.json())");
  assert.equal(approved.status, "approved");
  assert.equal(approved.reviewer, "local-reviewer");
  assert.equal(handoff.status, "approved");
  assert.equal(handoff.answers.palette, "Authoritative browser answer");
  assert.ok(handoff.verification.some((item) => item.startsWith("all-components |")));

  await browser("open", `${baseUrl}/static-export.html`);
  await browser("network", "requests", "--clear");
  const beforeStaticInteraction = await readAuthoritativeStateBytes();
  await browser("fill", "[data-plan-questions] input", "Static-only answer");
  await pointerClick("[data-checklist-id]");
  await pointerClick("[data-needs-revision]");
  await pointerClick("[data-approve-plan]");

  const quietDeadline = Date.now() + staticQuietWindowMs;
  let observations = 0;
  do {
    await Bun.sleep(50);
    assert.equal(
      await readAuthoritativeStateBytes(),
      beforeStaticInteraction,
      `static controls mutated authoritative bytes during observation ${observations + 1}`,
    );
    observations += 1;
  } while (Date.now() < quietDeadline);
  assert.ok(observations >= 2, "static nonmutation must be observed repeatedly across a bounded quiet window");

  const staticNetwork = JSON.parse(await browser("network", "requests", "--json")) as NetworkLog;
  assert.equal(staticNetwork.success, true, "static network observation must succeed");
  assert.ok(staticNetwork.data.requests.length > 0, "static network observation must capture requests");
  assert.equal(
    staticNetwork.data.requests.every((request) => typeof request.method === "string"),
    true,
    "static network events must expose request methods",
  );
  const forbiddenPaths: Record<string, true | undefined> = {
    "/api/approve": true,
    "/api/comments": true,
    "/api/state": true,
  };
  const forbiddenPosts = staticNetwork.data.requests.filter((request) => {
    const pathname = new URL(request.url).pathname;
    return request.method.toUpperCase() === "POST" && forbiddenPaths[pathname];
  });
  assert.deepEqual(forbiddenPosts, [], "static controls must emit no persistence POST network events");
}

interface SessionInfoLog {
  success: boolean;
  data: { active: boolean; pid: number | null; session: string };
}

interface SessionListLog {
  success: boolean;
  data: { sessions: string[] };
}

function sessionProcessExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForSessionProcessExit(pid: number, label: string): Promise<void> {
  const wait = (async () => {
    while (sessionProcessExists(pid)) await Bun.sleep(10);
  })();
  await bounded(wait, shutdownGraceMs, `${label} remained alive`);
}

async function terminateSessionProcess(pid: number): Promise<void> {
  process.kill(pid, "SIGTERM");
  try {
    await waitForSessionProcessExit(pid, `agent-browser session ${session} after SIGTERM`);
  } catch (termError) {
    process.kill(pid, "SIGKILL");
    try {
      await waitForSessionProcessExit(pid, `agent-browser session ${session} after SIGKILL`);
    } catch (killError) {
      throw new AggregateError([termError, killError], `agent-browser session ${session} could not be terminated`);
    }
  }
}

async function waitForSessionAbsence(): Promise<void> {
  const wait = (async () => {
    while (true) {
      const sessions = JSON.parse(await runAgentBrowser(["session", "list", "--json"], false)) as SessionListLog;
      assert.equal(sessions.success, true);
      if (!sessions.data.sessions.includes(session)) return;
      await Bun.sleep(25);
    }
  })();
  await bounded(wait, shutdownGraceMs, `named session ${session} survived cleanup`);
}

async function cleanupBrowserSession(): Promise<void> {
  const info = JSON.parse(await browser("session", "info", "--json")) as SessionInfoLog;
  assert.equal(info.success, true, "session metadata must be available for targeted cleanup");
  assert.equal(info.data.session, session);
  try {
    await browser("close");
  } catch (closeError) {
    if (!info.data.pid) {
      throw new AggregateError([closeError], `targeted close failed and session ${session} exposed no process metadata`);
    }
    await terminateSessionProcess(info.data.pid).catch((fallbackError) => {
      throw new AggregateError([closeError, fallbackError], `targeted close and PID fallback failed for session ${session}`);
    });
  }

  await waitForSessionAbsence();
  if (info.data.pid) assert.equal(sessionProcessExists(info.data.pid), false, `session process ${info.data.pid} survived cleanup`);
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

  registerCleanup({ name: "browser", run: cleanupBrowserSession });
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
