import { type MdxBlock } from "./schema";
import { MDX_COMPONENT_META, type MdxComponentName, splitLines, splitPipeFields } from "./shared";

export interface RenderContext {
  staticMode: boolean;
  componentExplorer?: boolean;
}

type Renderer = (block: MdxBlock, context: RenderContext) => string;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownish(value: string): string {
  return escapeHtml(value)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>");
}

function title(block: MdxBlock): string {
  return escapeHtml(block.props.title ?? block.props.label ?? block.type);
}

function card(block: MdxBlock, className: string, body?: string): string {
  return `<section class="ve-ip-block ${className}" id="${escapeHtml(block.id)}" data-block-id="${escapeHtml(block.id)}" data-block-type="${escapeHtml(block.type)}"><div class="ve-ip-label">${escapeHtml(block.type)}</div><h2>${title(block)}</h2><div class="ve-ip-body">${body ?? `<p>${markdownish(block.body)}</p>`}</div></section>`;
}

function mdxSourceFor(block: MdxBlock): string {
  const attrs = Object.entries(block.props).map(([key, value]) => {
    if (typeof value === "boolean") return value ? key : `${key}={false}`;
    if (typeof value === "number") return `${key}={${value}}`;
    return `${key}=${JSON.stringify(value)}`;
  }).join(" ");
  const opening = `<${block.type}${attrs ? ` ${attrs}` : ""}`;
  return block.body ? `${opening}>\n${block.body}\n</${block.type}>` : `${opening} />`;
}

function decorateExplorerBlock(block: MdxBlock, html: string): string {
  const componentName = block.type as MdxComponentName;
  const meta = MDX_COMPONENT_META[componentName];
  const source = mdxSourceFor(block);
  const details = `<div class="ve-ip-component-meta"><span>${escapeHtml(meta.category)}</span><p>${escapeHtml(meta.summary)}</p></div><details class="ve-ip-source"><summary>MDX source</summary><div class="ve-ip-source-toolbar"><button type="button" data-copy-mdx>Copy MDX</button></div><pre><code data-mdx-source>${escapeHtml(source)}</code></pre></details>`;
  const section = html.replace("<section ", `<section data-component-category="${escapeHtml(meta.category)}" `);
  const closingIndex = section.lastIndexOf("</section>");
  return closingIndex === -1 ? section : `${section.slice(0, closingIndex)}${details}${section.slice(closingIndex)}`;
}

function renderPlanSummary(block: MdxBlock): string {
  const status = escapeHtml(block.props.status ?? "Draft");
  return card(block, "ve-ip-hero", `<div class="ve-ip-summary"><p>${markdownish(block.body)}</p><span class="ve-ip-pill">${status}</span></div>`);
}

function renderDecisionMatrix(block: MdxBlock): string {
  const rows = splitLines(block.body).map((line) => {
    const [decision = line, rationale = "", status = ""] = splitPipeFields(line);
    return `<tr><td>${escapeHtml(decision)}</td><td>${escapeHtml(rationale)}</td><td><span class="ve-ip-pill">${escapeHtml(status)}</span></td></tr>`;
  }).join("");
  return card(block, "ve-ip-card", `<table><thead><tr><th>Decision</th><th>Rationale</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function renderArchitectureDiagram(block: MdxBlock): string {
  return card(block, "ve-ip-card ve-ip-diagram", `<div class="diagram-shell"><div class="diagram-shell__hint">Scroll to zoom, drag to pan, expand for full size.</div><div class="mermaid-wrap" data-diagram-id="${escapeHtml(block.id)}"><div class="zoom-controls"><button type="button" data-zoom="out">−</button><button type="button" data-zoom="reset">100%</button><button type="button" data-zoom="in">+</button><button type="button" data-expand>⛶</button></div><div class="mermaid-viewport"><pre class="mermaid-source">${escapeHtml(block.body)}</pre><div class="mermaid-canvas" aria-label="${title(block)} diagram"></div></div></div></div>`);
}

function renderTimeline(block: MdxBlock): string {
  const items = splitLines(block.body).map((line, index) => `<li><span>${index + 1}</span><p>${markdownish(line)}</p></li>`).join("");
  return card(block, "ve-ip-card", `<ol class="ve-ip-timeline">${items}</ol>`);
}

function renderRiskRegister(block: MdxBlock): string {
  const rows = splitLines(block.body).map((line) => {
    const [risk = line, mitigation = "", severity = "medium"] = splitPipeFields(line);
    return `<tr><td>${escapeHtml(risk)}</td><td>${escapeHtml(mitigation)}</td><td><span class="ve-ip-pill ve-ip-pill--${escapeHtml(severity.toLowerCase())}">${escapeHtml(severity)}</span></td></tr>`;
  }).join("");
  return card(block, "ve-ip-card", `<table><thead><tr><th>Risk</th><th>Mitigation</th><th>Severity</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function renderFileTree(block: MdxBlock): string {
  const items = splitLines(block.body).map((line) => `<li><code>${escapeHtml(line)}</code></li>`).join("");
  return card(block, "ve-ip-card", `<ul class="ve-ip-file-tree">${items}</ul>`);
}

function renderAnnotatedCode(block: MdxBlock): string {
  return card(block, "ve-ip-code-card", `<div class="code-file"><div class="code-file__header">${escapeHtml(block.props.file ?? block.props.title ?? "code")}</div><pre class="code-block code-block--scroll"><code>${escapeHtml(block.body)}</code></pre></div>`);
}

function renderDiffTabs(block: MdxBlock): string {
  const chunks = block.body.split(/^---\s*$/m).map((chunk) => chunk.trim()).filter(Boolean);
  const tabs = chunks.map((chunk, index) => {
    const firstLine = chunk.match(/^[^\r\n]*/)?.[0] || `Diff ${index + 1}`;
    return `<button type="button" role="tab" data-tab-target="${escapeHtml(block.id)}-${index}" ${index === 0 ? "aria-selected=\"true\"" : ""}>${escapeHtml(firstLine.replace(/^file:\s*/, ""))}</button>`;
  }).join("");
  const panels = chunks.map((chunk, index) => `<div role="tabpanel" id="${escapeHtml(block.id)}-${index}" ${index === 0 ? "" : "hidden"}><pre class="code-block code-block--scroll"><code>${escapeHtml(chunk)}</code></pre></div>`).join("");
  return card(block, "ve-ip-card", `<div class="ve-ip-tabs"><div class="ve-ip-tab-list" role="tablist">${tabs}</div>${panels}</div>`);
}

function renderQuestionForm(block: MdxBlock): string {
  const questions = splitLines(block.body).map((line) => {
    const [id = line, prompt = line, mode = "freeform"] = splitPipeFields(line);
    return `<label class="ve-ip-question" data-question-id="${escapeHtml(id)}"><span>${escapeHtml(prompt)}</span><input name="${escapeHtml(id)}" data-question-mode="${escapeHtml(mode)}" /></label>`;
  }).join("");
  return card(block, "ve-ip-card ve-ip-interactive", `<form data-plan-questions>${questions}</form>`);
}

function renderChecklist(block: MdxBlock): string {
  const items = splitLines(block.body).map((line, index) => {
    const [id = `item-${index + 1}`, label = line] = splitPipeFields(line);
    return `<label class="ve-ip-check"><input type="checkbox" data-checklist-id="${escapeHtml(id)}" /> <span>${escapeHtml(label)}</span></label>`;
  }).join("");
  return card(block, "ve-ip-card ve-ip-interactive", `<div data-plan-checklist>${items}</div>`);
}

function renderApprovalGate(block: MdxBlock, context: RenderContext): string {
  const fallback = context.staticMode ? `<p class="ve-ip-muted">Static export: copy this page with the generated handoff packet. Agent-readable approval persistence requires the local bridge.</p>` : "";
  return card(block, "ve-ip-card ve-ip-approval", `<p>${markdownish(block.body || "Approve this plan once the scope and open questions are settled.")}</p><div class="ve-ip-actions"><button type="button" data-approve-plan>Approve plan</button><button type="button" data-needs-revision>Needs revision</button></div>${fallback}<pre data-approval-output hidden></pre>`);
}

function renderWireframe(block: MdxBlock): string {
  return card(block, "ve-ip-card", `<div class="ve-ip-wireframe" data-surface="${escapeHtml(block.props.surface ?? "browser")}">${block.body}</div>`);
}

function renderBeforeAfter(block: MdxBlock): string {
  const [before = "", after = ""] = block.body.split(/^---\s*$/m);
  return card(block, "ve-ip-card", `<div class="ve-ip-before-after"><div><h3>Before</h3><p>${markdownish(before.trim())}</p></div><div><h3>After</h3><p>${markdownish((after ?? "").trim())}</p></div></div>`);
}

function renderStatusDashboard(block: MdxBlock): string {
  const items = splitLines(block.body).map((line) => {
    const [label = line, value = "", tone = ""] = splitPipeFields(line);
    return `<div class="ve-ip-kpi"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(tone)}</small></div>`;
  }).join("");
  return card(block, "ve-ip-card", `<div class="ve-ip-dashboard">${items}</div>`);
}

function renderTableLike(block: MdxBlock): string {
  const rows = splitLines(block.body).map((line) => `<tr>${splitPipeFields(line).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return card(block, "ve-ip-card", `<table><tbody>${rows}</tbody></table>`);
}

const renderers: Readonly<Record<string, Renderer | undefined>> = {
  PlanSummary: renderPlanSummary,
  StatusDashboard: renderStatusDashboard,
  DecisionMatrix: renderDecisionMatrix,
  ArchitectureDiagram: renderArchitectureDiagram,
  ImplementationTimeline: renderTimeline,
  RiskRegister: renderRiskRegister,
  FileMap: renderFileTree,
  FileTree: renderFileTree,
  AnnotatedCode: renderAnnotatedCode,
  DiffTabs: renderDiffTabs,
  ApiSurface: renderTableLike,
  DataModel: renderTableLike,
  Wireframe: renderWireframe,
  BeforeAfter: renderBeforeAfter,
  StateGallery: renderWireframe,
  ApprovalGate: renderApprovalGate,
  QuestionForm: renderQuestionForm,
  Checklist: renderChecklist,
  CommentAnchor: (block, context) => context.componentExplorer
    ? card(block, "ve-ip-card", `<p class="ve-ip-muted">Invisible in generated plans; visible here so humans can inspect and copy its MDX contract.</p><span class="ve-ip-comment-anchor" data-comment-anchor="${escapeHtml(block.id)}"></span>`)
    : `<span id="${escapeHtml(block.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${escapeHtml(block.id)}"></span>`,
  Callout: (block) => card(block, `ve-ip-callout ve-ip-callout--${escapeHtml(block.props.tone ?? "note")}`),
  Tabs: renderDiffTabs,
  Table: renderTableLike,
} satisfies Record<MdxComponentName, Renderer>;

export function renderBlock(block: MdxBlock, context: RenderContext): string {
  const renderer = renderers[block.type];
  if (!renderer) throw new Error(`No renderer registered for ${block.type}`);
  const html = renderer(block, context);
  return context.componentExplorer ? decorateExplorerBlock(block, html) : html;
}

export function renderBlocks(blocks: MdxBlock[], context: RenderContext): string {
  return blocks.map((block) => renderBlock(block, context)).join("\n");
}
