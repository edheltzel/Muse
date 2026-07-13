import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { interactivePlanClientScript, staticPlanClientScript } from "./client";
import { escapeHtml, renderBlocks } from "./components";
import { loadPlanFolder, type LoadedPlanFolder } from "./mdx-loader";
import { validateRenderedHtmlIds } from "./schema";
import { getRendererOwnedIdsByRole } from "./shared";

const defaultShell = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{{TITLE}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700&family=Fragment+Mono&display=swap" rel="stylesheet">
<style>{{STYLE}}</style>
</head>
<body data-review-status="draft" data-review-authority="{{REVIEW_AUTHORITY}}">
  <aside class="ve-ip-nav"><strong>{{KIND}}</strong>{{NAV}}</aside>
  <div class="ve-ip-chrome" aria-label="Display settings"><span>Theme</span><button type="button" class="ve-ip-theme-toggle" data-theme-toggle aria-pressed="false"><span data-theme-toggle-label>Light</span></button></div>
  <main class="ve-ip-main">
    <header class="ve-ip-page-header"><p class="ve-ip-kicker">Muse interactive {{KIND}}</p><h1>{{TITLE}}</h1><p>{{SUBTITLE}}</p></header>
    {{REVIEW_SYNC}}
    {{CONTENT}}
  </main>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script type="module">{{CLIENT}}</script>
</body>
</html>`;

const style = `
:root {
  color-scheme: light;
  --bg: oklch(98% 0.006 230);
  --bg-radial: oklch(89% 0.035 205 / 0.48);
  --surface: oklch(100% 0 0);
  --surface-elevated: oklch(96% 0.011 230);
  --surface-recessed: oklch(93% 0.014 232);
  --border: oklch(34% 0.025 235 / 0.14);
  --border-strong: oklch(34% 0.025 235 / 0.28);
  --text: oklch(24% 0.022 235);
  --text-dim: oklch(45% 0.024 235);
  --accent: oklch(51% 0.13 43);
  --accent-soft: oklch(92% 0.05 61);
  --accent-sage: oklch(49% 0.095 142);
  --accent-teal: oklch(48% 0.105 212);
  --accent-gold: oklch(72% 0.13 78);
  --ok: oklch(50% 0.12 151);
  --warn: oklch(64% 0.14 72);
  --danger: oklch(52% 0.16 23);
  --shadow-soft: 0 8px 24px oklch(24% 0.022 235 / 0.08);
  --font-body: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Fragment Mono", "SF Mono", Consolas, monospace;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: oklch(18% 0.018 244);
  --bg-radial: oklch(45% 0.08 214 / 0.22);
  --surface: oklch(22% 0.02 244);
  --surface-elevated: oklch(27% 0.024 244);
  --surface-recessed: oklch(16% 0.016 244);
  --border: oklch(86% 0.012 238 / 0.12);
  --border-strong: oklch(86% 0.012 238 / 0.24);
  --text: oklch(94% 0.008 236);
  --text-dim: oklch(75% 0.018 236);
  --accent: oklch(70% 0.13 54);
  --accent-soft: oklch(32% 0.052 54);
  --accent-sage: oklch(70% 0.09 147);
  --accent-teal: oklch(73% 0.098 205);
  --accent-gold: oklch(80% 0.12 82);
  --ok: oklch(72% 0.11 154);
  --warn: oklch(80% 0.12 82);
  --danger: oklch(72% 0.14 22);
  --shadow-soft: 0 10px 28px oklch(0% 0 0 / 0.22);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% -10%, var(--bg-radial), transparent 34rem),
    linear-gradient(135deg, var(--bg), var(--surface-recessed));
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.55;
}
button, input { font: inherit; }
code, pre, .ve-ip-label, .ve-ip-kicker, .ve-ip-nav, .code-file__header { font-family: var(--font-mono); }
.ve-ip-nav {
  position: fixed;
  inset: 1rem auto 1rem 1rem;
  width: min(15rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in oklch, var(--surface) 88%, transparent);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: .45rem;
  z-index: 5;
}
.ve-ip-nav strong {
  color: var(--accent);
  font-size: .78rem;
  letter-spacing: .03em;
  text-transform: uppercase;
}
.ve-ip-nav a {
  color: var(--text-dim);
  text-decoration: none;
  padding: .35rem .45rem;
  border-radius: 10px;
}
.ve-ip-nav a:hover { color: var(--text); background: var(--surface-elevated); }
.ve-ip-chrome {
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .45rem .55rem .45rem .75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in oklch, var(--surface) 90%, transparent);
  box-shadow: var(--shadow-soft);
  color: var(--text-dim);
  font-size: .86rem;
}
.ve-ip-theme-toggle, .ve-ip-actions button, .ve-ip-persistence button, .ve-ip-review-sync button, .zoom-controls button {
  border: 1px solid var(--border-strong);
  color: var(--text);
  background: var(--surface-elevated);
  border-radius: 999px;
  cursor: pointer;
}
.ve-ip-theme-toggle { padding: .35rem .75rem; }
.ve-ip-review-sync {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .5rem 1rem;
  margin: 0 0 1rem;
  padding: .85rem 1rem;
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-teal);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}
.ve-ip-review-sync strong { color: var(--text); }
.ve-ip-review-sync span { flex: 1 1 22rem; color: var(--text-dim); }
.ve-ip-review-sync button, .ve-ip-persistence button { padding: .3rem .65rem; }
[data-review-authority="failed"] .ve-ip-review-sync { border-left-color: var(--danger); }
[data-review-control]:disabled { cursor: not-allowed; opacity: .55; }
.ve-ip-main {
  width: min(74rem, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 4.5rem 0 5rem 15.5rem;
}
.ve-ip-page-header {
  min-height: 38vh;
  display: grid;
  align-content: end;
  padding: 3rem 0 4rem;
}
.ve-ip-kicker, .ve-ip-label {
  color: var(--accent);
  font-size: .78rem;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.ve-ip-page-header h1 {
  max-width: 12ch;
  margin: .4rem 0 .7rem;
  font-size: clamp(3.25rem, 10vw, 5.8rem);
  line-height: .93;
  letter-spacing: -.035em;
  text-wrap: balance;
}
.ve-ip-page-header p:last-child {
  max-width: 58ch;
  margin: 0;
  color: var(--text-dim);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}
.ve-ip-block {
  margin: 0 0 1.2rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  overflow: hidden;
}
.ve-ip-block > h2 {
  margin: .2rem 0 0;
  padding: 0 1.15rem;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: -.025em;
  text-wrap: balance;
}
.ve-ip-label { display: block; padding: 1rem 1.15rem 0; }
.ve-ip-body { padding: 1rem 1.15rem 1.15rem; }
.ve-ip-hero {
  background: linear-gradient(145deg, var(--surface-elevated), var(--surface));
  box-shadow: var(--shadow-soft);
}
.ve-ip-hero .ve-ip-body { padding: 1.25rem; }
.ve-ip-summary {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.ve-ip-summary p {
  max-width: 62ch;
  margin: 0;
  color: var(--text-dim);
  font-size: 1.08rem;
}
.ve-ip-pill {
  display: inline-flex;
  align-items: center;
  width: max-content;
  border-radius: 999px;
  padding: .22rem .55rem;
  background: var(--accent-soft);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: .74rem;
}
.ve-ip-pill--high, .ve-ip-pill--critical { background: color-mix(in oklch, var(--danger) 20%, transparent); }
.ve-ip-pill--medium { background: color-mix(in oklch, var(--warn) 24%, transparent); }
.ve-ip-pill--low { background: color-mix(in oklch, var(--ok) 20%, transparent); }
table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
}
th, td {
  padding: .75rem .8rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
th {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
  font-weight: 400;
}
tr:last-child td { border-bottom: 0; }
.ve-ip-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: .75rem;
}
.ve-ip-kpi {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: .9rem;
  background: var(--surface-elevated);
}
.ve-ip-kpi strong { display: block; font-size: 1.75rem; letter-spacing: -.03em; }
.ve-ip-kpi span, .ve-ip-kpi small, .ve-ip-muted { color: var(--text-dim); }
.ve-ip-timeline {
  counter-reset: timeline;
  display: grid;
  gap: .75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.ve-ip-timeline li {
  display: grid;
  grid-template-columns: 2.2rem 1fr;
  gap: .75rem;
  align-items: start;
}
.ve-ip-timeline li > span {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: var(--accent-soft);
  font-family: var(--font-mono);
}
.ve-ip-file-tree {
  display: grid;
  gap: .4rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.ve-ip-file-tree code, code {
  border-radius: 8px;
  background: var(--surface-recessed);
  padding: .14rem .32rem;
}
.code-file {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-recessed);
}
.code-file__header {
  padding: .65rem .8rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-dim);
}
.code-block {
  margin: 0;
  padding: 1rem;
  overflow: auto;
  white-space: pre-wrap;
}
.ve-ip-tabs [role="tablist"] {
  display: flex;
  gap: .45rem;
  flex-wrap: wrap;
  margin-bottom: .75rem;
}
.ve-ip-tabs [role="tab"] {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: .42rem .7rem;
  color: var(--text-dim);
  background: var(--surface-elevated);
  cursor: pointer;
}
.ve-ip-tabs [aria-selected="true"] {
  color: var(--text);
  border-color: var(--accent);
}
.diagram-shell {
  display: grid;
  gap: .7rem;
}
.diagram-shell__hint {
  color: var(--text-dim);
  font-size: .9rem;
}
.mermaid-wrap {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-recessed);
}
.zoom-controls {
  display: flex;
  justify-content: flex-end;
  gap: .35rem;
  padding: .55rem;
  border-bottom: 1px solid var(--border);
}
.zoom-controls button { min-width: 2.1rem; padding: .32rem .55rem; }
.mermaid-viewport {
  min-height: 24rem;
  overflow: hidden;
  display: grid;
  place-items: center;
  cursor: grab;
  touch-action: none;
}
.mermaid-canvas {
  transform-origin: center center;
  transition: transform .18s ease-out;
  min-width: min(48rem, 100%);
}
.mermaid-canvas svg {
  max-width: 100%;
  height: auto;
}
.mermaid-source {
  margin: 0;
  padding: 1rem;
  color: var(--text-dim);
  white-space: pre-wrap;
}
.mermaid-wrap[data-render-state="rendered"] .mermaid-source { display: none; }
.mermaid-error {
  color: var(--danger);
  white-space: pre-wrap;
}
.ve-ip-question, .ve-ip-check {
  display: grid;
  gap: .4rem;
  margin-bottom: .75rem;
}
.ve-ip-field-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .75rem;
}
.ve-ip-readiness-policy {
  flex: none;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  padding: .16rem .48rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .7rem;
}
.ve-ip-readiness-policy--required {
  border-color: var(--accent-terracotta);
  color: var(--text);
}
.ve-ip-question input {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: .65rem .8rem;
  color: var(--text);
  background: var(--surface-elevated);
}
.ve-ip-check {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}
.ve-ip-check input { width: 1.15rem; height: 1.15rem; accent-color: var(--accent-sage); }
.ve-ip-field, .ve-ip-check-row { margin-bottom: .85rem; }
.ve-ip-field .ve-ip-question, .ve-ip-check-row .ve-ip-check { margin-bottom: .3rem; }
.ve-ip-readiness-copy {
  margin: 0 0 1rem;
  color: var(--text-dim);
  font-size: .88rem;
}
.ve-ip-persistence {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  min-height: 1.5rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .72rem;
}
.ve-ip-persistence[data-persistence-state="pending"] { color: var(--accent-teal); }
.ve-ip-persistence[data-persistence-state="saved"] { color: var(--accent-sage); }
.ve-ip-persistence[data-persistence-state="failed"] { color: var(--danger); }
.ve-ip-comment-control { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
.ve-ip-review-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem 1rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
}
.ve-ip-approval-readiness {
  margin: .85rem 0;
  padding: .7rem .8rem;
  border-left: 3px solid var(--accent-gold);
  background: var(--surface-recessed);
}
.ve-ip-approval-readiness[data-ready="true"] { border-left-color: var(--accent-sage); }
.ve-ip-review-comments {
  margin-top: 1rem;
  padding-top: .85rem;
  border-top: 1px solid var(--border);
}
.ve-ip-review-comments h3 { margin-top: 0; }
.ve-ip-review-comments ul { padding-left: 1.2rem; }
.ve-ip-review-comments li { margin-bottom: .65rem; }
.ve-ip-approval-receipt {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--accent-sage);
  border-radius: 14px;
  background: color-mix(in oklch, var(--accent-sage) 9%, var(--surface));
}
.ve-ip-approval-receipt h3 { margin-top: 0; }
.ve-ip-approval-receipt pre {
  padding: .75rem;
  background: var(--surface-recessed);
  white-space: pre-wrap;
  overflow: auto;
}
.ve-ip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1rem;
}
.ve-ip-actions button {
  padding: .65rem .9rem;
}
.ve-ip-actions button:first-child {
  background: var(--text);
  color: var(--surface);
}
.ve-ip-before-after {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: .8rem;
}
.ve-ip-before-after > div, .ve-ip-callout {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--surface-elevated);
}
.ve-ip-callout--risk { background: color-mix(in oklch, var(--danger) 10%, var(--surface)); }
.ve-ip-callout--warning { background: color-mix(in oklch, var(--warn) 14%, var(--surface)); }
.ve-ip-callout--decision { background: color-mix(in oklch, var(--accent-teal) 12%, var(--surface)); }
.ve-ip-wireframe {
  border: 1px solid var(--border);
  border-radius: 14px;
  min-height: 18rem;
  overflow: hidden;
  background: var(--surface-recessed);
}
.wf-muted { color: var(--text-dim); }
.primary {
  border: 0;
  border-radius: 999px;
  padding: .7rem 1rem;
  background: var(--text);
  color: var(--surface);
}
@media (max-width: 860px) {
  .ve-ip-nav {
    position: sticky;
    top: 0;
    inset: auto;
    width: auto;
    margin: .75rem;
    flex-direction: row;
    overflow-x: auto;
  }
  .ve-ip-main {
    width: min(100% - 1.5rem, 74rem);
    padding: 1rem 0 4rem;
  }
  .ve-ip-chrome { top: auto; bottom: 1rem; }
  .ve-ip-page-header { min-height: 24rem; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .mermaid-canvas { transition: none; }
}
`;

async function readShellTemplate(): Promise<string> {
  try {
    return await readFile("plugins/Muse/skills/muse/templates/interactive-plan-shell.html", "utf8");
  } catch {
    return defaultShell;
  }
}

function navFor(plan: LoadedPlanFolder): string {
  return plan.plan.blocks.map((block) => `<a href="#${escapeHtml(block.id)}">${escapeHtml(block.props.title ?? block.type)}</a>`).join("");
}

export async function renderPlanHtml(plan: LoadedPlanFolder, staticMode = false, shell?: string): Promise<string> {
  const template = shell ?? (await readShellTemplate());
  const content = [
    renderBlocks(plan.plan.blocks, { staticMode }),
    plan.canvas ? `<section class="ve-ip-block ve-ip-card" id="canvas"><div class="ve-ip-label">Canvas</div><h2>Canvas</h2>${renderBlocks(plan.canvas.blocks, { staticMode })}</section>` : "",
  ].join("\n");
  const reviewSync = staticMode
    ? ""
    : `<section class="ve-ip-review-sync" data-review-sync aria-live="polite"><strong data-review-sync-title>Loading saved review…</strong><span data-review-sync-detail>Review controls unlock after server state and comments load.</span><button type="button" data-review-retry hidden>Retry</button></section>`;
  const html = template
    .replaceAll("{{TITLE}}", escapeHtml(plan.manifest.title))
    .replaceAll("{{KIND}}", escapeHtml(plan.manifest.kind))
    .replaceAll("{{SUBTITLE}}", staticMode ? "Static export. Interactive persistence requires the local review bridge." : "Local interactive review surface.")
    .replaceAll("{{REVIEW_AUTHORITY}}", staticMode ? "static" : "loading")
    .replaceAll("{{REVIEW_SYNC}}", reviewSync)
    .replaceAll("{{NAV}}", navFor(plan))
    .replaceAll("{{CONTENT}}", content)
    .replaceAll("{{STYLE}}", style)
    .replaceAll("{{CLIENT}}", staticMode ? staticPlanClientScript : interactivePlanClientScript);
  const blocks = [...plan.plan.blocks, ...(plan.canvas?.blocks ?? [])];
  const expectedIds = blocks.map(({ id }) => id);
  if (plan.canvas) expectedIds.push("canvas");
  for (const block of blocks) {
    expectedIds.push(...getRendererOwnedIdsByRole(block, "instructions"));
    if (staticMode) continue;
    expectedIds.push(...getRendererOwnedIdsByRole(block, "tabs"), ...getRendererOwnedIdsByRole(block, "panels"));
  }
  const idErrors = validateRenderedHtmlIds(html, expectedIds);
  if (idErrors.length) throw new Error(`Invalid rendered HTML:\n${idErrors.join("\n")}`);
  return html;
}

export async function renderPlanFolder(rootDir: string): Promise<{ indexPath: string; staticExportPath: string }> {
  const plan = await loadPlanFolder(rootDir);
  const distDir = join(rootDir, plan.manifest.dist);
  await mkdir(distDir, { recursive: true });
  const indexPath = join(distDir, "index.html");
  const staticExportPath = join(distDir, "static-export.html");
  const shell = await readShellTemplate();
  await writeFile(indexPath, await renderPlanHtml(plan, false, shell));
  await writeFile(staticExportPath, await renderPlanHtml(plan, true, shell));
  return { indexPath, staticExportPath };
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir) throw new Error("Usage: bun render.ts <plan-dir>");
  const result = await renderPlanFolder(dir);
  console.log(JSON.stringify(result, null, 2));
}
