import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { interactivePlanClientScript } from "./client";
import { escapeHtml, renderBlocks } from "./components";
import { loadPlanFolder, type LoadedPlanFolder } from "./mdx-loader";

const defaultShell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{{TITLE}}</title>
<style>{{STYLE}}</style>
</head>
<body data-review-status="draft">
  <aside class="ve-ip-nav"><strong>{{KIND}}</strong>{{NAV}}</aside>
  <main class="ve-ip-main">
    <header class="ve-ip-page-header"><p class="ve-ip-eyebrow">VisualExplainer interactive {{KIND}}</p><h1>{{TITLE}}</h1><p>{{SUBTITLE}}</p></header>
    {{CONTENT}}
  </main>
<script type="module">{{CLIENT}}</script>
</body>
</html>`;

const style = `:root{--bg:#f7f4ef;--surface:#fffdf8;--surface-elevated:#fffaf0;--border:rgba(41,31,20,.12);--text:#271f18;--text-dim:#70665b;--accent:#b45309;--accent-dim:rgba(180,83,9,.12);--ok:#047857;--warn:#b45309;--danger:#be123c;--font-body:ui-sans-serif,system-ui,sans-serif;--font-mono:'SF Mono',Consolas,monospace}@media(prefers-color-scheme:dark){:root{--bg:#171412;--surface:#211d19;--surface-elevated:#29231d;--border:rgba(255,255,255,.1);--text:#f4ece1;--text-dim:#b9aa99;--accent:#f59e0b;--accent-dim:rgba(245,158,11,.15);--ok:#34d399;--warn:#fbbf24;--danger:#fb7185}}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);background-image:radial-gradient(circle at 20% 0,var(--accent-dim),transparent 40%),radial-gradient(circle,var(--border) 1px,transparent 1px);background-size:auto,24px 24px;color:var(--text);font-family:var(--font-body);display:grid;grid-template-columns:260px minmax(0,1fr);gap:32px}.ve-ip-nav{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;padding:28px 20px;border-right:1px solid var(--border);font-family:var(--font-mono);font-size:12px}.ve-ip-nav a{display:block;color:var(--text-dim);text-decoration:none;margin:10px 0}.ve-ip-main{min-width:0;max-width:1100px;padding:44px 32px 80px}.ve-ip-page-header{margin-bottom:28px}.ve-ip-eyebrow,.ve-ip-label{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--accent);font-size:11px}.ve-ip-page-header h1{font-size:clamp(32px,5vw,58px);letter-spacing:-.04em;margin:6px 0 12px}.ve-ip-block{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;margin:20px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}.ve-ip-hero{background:linear-gradient(135deg,var(--surface-elevated),var(--surface));border-color:color-mix(in srgb,var(--border) 55%,var(--accent) 45%);padding:30px}.ve-ip-card h2{margin-top:0}.ve-ip-body{line-height:1.65;color:var(--text)}.ve-ip-muted{color:var(--text-dim)}.ve-ip-pill{display:inline-flex;border:1px solid var(--border);border-radius:999px;padding:4px 9px;font:12px var(--font-mono);color:var(--accent);background:var(--accent-dim)}.ve-ip-pill--high{color:var(--danger)}.ve-ip-pill--low{color:var(--ok)}table{width:100%;border-collapse:collapse;overflow:auto}th,td{text-align:left;border-bottom:1px solid var(--border);padding:10px;vertical-align:top}code,.code-block{font-family:var(--font-mono)}.code-file{border:1px solid var(--border);border-radius:12px;overflow:hidden}.code-file__header{padding:10px 14px;background:var(--surface-elevated);border-bottom:1px solid var(--border);font:12px var(--font-mono);color:var(--text-dim)}.code-block{margin:0;padding:16px;background:color-mix(in srgb,var(--bg) 60%,var(--surface) 40%);white-space:pre-wrap;word-break:break-word;overflow:auto}.code-block--scroll{max-height:420px}.ve-ip-dashboard,.ve-ip-before-after{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.ve-ip-kpi{border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--surface-elevated)}.ve-ip-kpi strong{display:block;font-size:34px}.ve-ip-file-tree{list-style:none;padding:0}.ve-ip-file-tree li{padding:6px 0;border-bottom:1px solid var(--border)}.ve-ip-timeline{list-style:none;counter-reset:item;padding:0}.ve-ip-timeline li{display:grid;grid-template-columns:36px 1fr;gap:12px;margin:12px 0}.ve-ip-timeline span{display:grid;place-items:center;background:var(--accent-dim);color:var(--accent);border-radius:999px;width:32px;height:32px}.ve-ip-tabs [role=tab]{border:1px solid var(--border);background:var(--surface-elevated);color:var(--text);border-radius:10px 10px 0 0;padding:8px 12px;cursor:pointer}.ve-ip-tabs [aria-selected=true]{background:var(--accent-dim);color:var(--accent)}.ve-ip-tab-list{display:flex;gap:4px;overflow:auto}.ve-ip-question,.ve-ip-check{display:flex;gap:10px;align-items:center;padding:10px 0}.ve-ip-question{flex-direction:column;align-items:stretch}.ve-ip-question input{padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text)}.ve-ip-actions{display:flex;gap:10px;flex-wrap:wrap}.ve-ip-actions button,[data-approve-plan],[data-needs-revision]{border:1px solid var(--border);border-radius:999px;background:var(--accent);color:#fff;padding:10px 16px;cursor:pointer}[data-needs-revision]{background:transparent;color:var(--text)}.ve-ip-wireframe{border:1px dashed var(--border);border-radius:14px;padding:16px;background:var(--surface-elevated);overflow:auto}.diagram-shell__hint{font:11px var(--font-mono);color:var(--text-dim);margin-bottom:8px}.mermaid-wrap{position:relative;min-height:300px;overflow:auto;border:1px solid var(--border);border-radius:14px;padding:36px 16px;background:var(--surface-elevated)}.zoom-controls{position:absolute;right:8px;top:8px;display:flex;gap:3px}.zoom-controls button{border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font:12px var(--font-mono)}@media(max-width:850px){body{display:block}.ve-ip-nav{position:static;border-right:0;border-bottom:1px solid var(--border);max-height:none}.ve-ip-main{padding:28px 18px}}`;

async function readShellTemplate(): Promise<string> {
  try {
    return await readFile("plugins/VisualExplainer/skills/visual-explainer/templates/interactive-plan-shell.html", "utf8");
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
  return template
    .replaceAll("{{TITLE}}", escapeHtml(plan.manifest.title))
    .replaceAll("{{KIND}}", escapeHtml(plan.manifest.kind))
    .replaceAll("{{SUBTITLE}}", staticMode ? "Static export. Interactive persistence requires the local review bridge." : "Local interactive review surface.")
    .replaceAll("{{NAV}}", navFor(plan))
    .replaceAll("{{CONTENT}}", content)
    .replaceAll("{{STYLE}}", style)
    .replaceAll("{{CLIENT}}", staticMode ? "" : interactivePlanClientScript);
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
