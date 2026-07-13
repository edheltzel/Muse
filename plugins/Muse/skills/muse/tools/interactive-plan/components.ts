import { type MdxBlock } from "./schema";
import { getRendererOwnedIdsByRole, type MdxComponentName, splitLines, splitPipeFields, splitTabPanels } from "./shared";

export interface RenderContext {
  staticMode: boolean;
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
  const instructionsId = escapeHtml(getRendererOwnedIdsByRole(block, "instructions")[0]);
  const renderRootId = escapeHtml(getRendererOwnedIdsByRole(block, "renderRoot")[0]);
  return card(block, "ve-ip-card ve-ip-diagram", `<div class="diagram-shell"><div class="diagram-shell__hint" id="${instructionsId}">Use arrow keys to pan. Hold Ctrl or Command while scrolling to zoom, drag to pan, or expand for full size.</div><div class="mermaid-wrap" data-diagram-id="${escapeHtml(block.id)}" data-mermaid-render-id="${renderRootId}"><div class="zoom-controls"><button type="button" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-zoom="reset" aria-label="Reset zoom and position">100%</button><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-expand aria-label="Expand diagram">⛶</button></div><div class="mermaid-viewport" tabindex="0" role="region" aria-label="${title(block)} interactive diagram" aria-describedby="${instructionsId}"><pre class="mermaid-source">${escapeHtml(block.body)}</pre><div class="mermaid-canvas" aria-label="${title(block)} diagram"></div></div></div></div>`);
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

function renderDiffTabs(block: MdxBlock, context: RenderContext): string {
  const chunks = splitTabPanels(block.body);
  const panelIds = getRendererOwnedIdsByRole(block, "panels");
  const tabIds = getRendererOwnedIdsByRole(block, "tabs");
  const items = chunks.map((chunk, index) => {
    const firstLine = chunk.match(/^[^\r\n]*/)?.[0] ?? "";
    const fallbackLabel = `${block.type === "DiffTabs" ? "Diff" : "Panel"} ${index + 1}`;
    return {
      chunk,
      label: firstLine.replace(/^file:\s*/, "") || fallbackLabel,
      panelId: panelIds[index],
      tabId: tabIds[index],
    };
  });

  if (context.staticMode) {
    const panels = items.map(({ chunk, label }) => `<section class="ve-ip-static-tab-panel"><h3>${escapeHtml(label)}</h3><pre class="code-block code-block--scroll"><code>${escapeHtml(chunk)}</code></pre></section>`).join("");
    return card(block, "ve-ip-card", `<div class="ve-ip-tabs ve-ip-tabs--static">${panels}</div>`);
  }

  const tabs = items.map(({ label, panelId, tabId }, index) => `<button type="button" role="tab" id="${escapeHtml(tabId)}" aria-controls="${escapeHtml(panelId)}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-tab-target="${escapeHtml(panelId)}">${escapeHtml(label)}</button>`).join("");
  const panels = items.map(({ chunk, panelId, tabId }, index) => `<div role="tabpanel" id="${escapeHtml(panelId)}" aria-labelledby="${escapeHtml(tabId)}" tabindex="0"${index === 0 ? "" : " hidden"}><pre class="code-block code-block--scroll"><code>${escapeHtml(chunk)}</code></pre></div>`).join("");
  const tabListLabel = `${String(block.props.label ?? block.props.title ?? block.type)} tabs (${block.id})`;
  return card(block, "ve-ip-card", `<div class="ve-ip-tabs"><div class="ve-ip-tab-list" role="tablist" aria-label="${escapeHtml(tabListLabel)}">${tabs}</div>${panels}</div>`);
}

function readinessBadge(policy: string | undefined): { value: "required" | "advisory"; html: string } {
  const value = policy === "required" ? "required" : "advisory";
  const label = value === "required" ? "Required" : "Advisory";
  return {
    value,
    html: `<span class="ve-ip-readiness-policy ve-ip-readiness-policy--${value}">${label}</span>`,
  };
}

function persistenceFeedback(key: string): string {
  return `<span class="ve-ip-persistence" data-persistence-key="${escapeHtml(key)}" data-persistence-state="loading" aria-live="polite"><span data-persistence-message>Loading…</span><button type="button" data-persistence-retry hidden>Retry</button></span>`;
}

function reviewControlAttributes(context: RenderContext, key: string): string {
  return context.staticMode
    ? "disabled"
    : `data-operation-key="${escapeHtml(key)}" data-review-control disabled`;
}


function renderQuestionForm(block: MdxBlock, context: RenderContext): string {
  const questions = splitLines(block.body).map((line) => {
    const [id = line, prompt = line, mode = "freeform", policy] = splitPipeFields(line);
    const readiness = readinessBadge(policy);
    const feedback = context.staticMode ? "" : persistenceFeedback(`answer:${id}`);
    return `<div class="ve-ip-field"><label class="ve-ip-question" data-question-id="${escapeHtml(id)}" data-readiness-policy="${readiness.value}"><span class="ve-ip-field-heading"><span>${escapeHtml(prompt)}</span>${readiness.html}</span><input name="${escapeHtml(id)}" data-question-mode="${escapeHtml(mode)}" ${reviewControlAttributes(context, `answer:${id}`)} /></label>${feedback}</div>`;
  }).join("");
  return card(block, "ve-ip-card ve-ip-interactive", `<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><form data-plan-questions>${questions}</form>`);
}

function renderChecklist(block: MdxBlock, context: RenderContext): string {
  const items = splitLines(block.body).map((line, index) => {
    const [id = `item-${index + 1}`, label = line, policy] = splitPipeFields(line);
    const readiness = readinessBadge(policy);
    const feedback = context.staticMode ? "" : persistenceFeedback(`checklist:${id}`);
    return `<div class="ve-ip-check-row"><label class="ve-ip-check" data-readiness-policy="${readiness.value}"><input type="checkbox" data-checklist-id="${escapeHtml(id)}" ${reviewControlAttributes(context, `checklist:${id}`)} /> <span>${escapeHtml(label)}</span>${readiness.html}</label>${feedback}</div>`;
  }).join("");
  return card(block, "ve-ip-card ve-ip-interactive", `<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><div data-plan-checklist>${items}</div>`);
}

function renderApprovalGate(block: MdxBlock, context: RenderContext): string {
  const fallback = context.staticMode ? `<p class="ve-ip-muted">Static export: copy this page with the generated handoff packet. Agent-readable approval persistence requires the local bridge.</p>` : "";
  const reviewState = context.staticMode ? "" : `<div class="ve-ip-review-metadata" data-review-metadata><span>Status <strong data-review-status-label>Loading…</strong></span><span data-review-reviewer hidden>Reviewer <strong></strong></span><span data-review-approved-at hidden>Approved <strong></strong></span></div><p class="ve-ip-approval-readiness" data-approval-readiness>Loading approval readiness…</p><div class="ve-ip-review-comments" data-review-comments><h3>Review comments</h3><p>Loading comments…</p></div>`;
  const feedback = context.staticMode ? "" : `${persistenceFeedback("approval")}${persistenceFeedback("revision")}<template data-persistence-template>${persistenceFeedback("")}</template>`;
  const receipt = context.staticMode ? "" : `<section class="ve-ip-approval-receipt" data-approval-receipt hidden><h3>Approval recorded</h3><p data-approval-receipt-summary></p><p>Generated artifacts:</p><ul><li><a href="/agent-handoff.json">agent-handoff.json</a></li><li><a href="/agent-handoff.md">agent-handoff.md</a></li></ul><details data-approval-technical><summary>Technical details</summary><pre data-approval-technical-json></pre></details></section>`;
  return card(block, "ve-ip-card ve-ip-approval", `<p>${markdownish(block.body || "Approve this plan once the scope and open questions are settled.")}</p>${reviewState}<div class="ve-ip-actions"><button type="button" data-approve-plan ${reviewControlAttributes(context, "approval")}>Approve plan</button><button type="button" data-needs-revision ${reviewControlAttributes(context, "revision")}>Needs revision</button></div>${feedback}${fallback}${receipt}`);
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
  const rows = splitLines(block.body).map(splitPipeFields);
  const header = rows.shift();
  if (!header) return card(block, "ve-ip-card", "<table><tbody></tbody></table>");

  rows.forEach((row, index) => {
    if (row.length !== header.length) {
      throw new Error(`${block.type} '${block.id}' row ${index + 2} has ${row.length} columns; expected ${header.length}`);
    }
  });
  const head = `<thead><tr>${header.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("")}</tr></thead>`;
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return card(block, "ve-ip-card", `<table>${head}<tbody>${body}</tbody></table>`);
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
  CommentAnchor: (block, context) => context.staticMode
    ? `<button type="button" id="${escapeHtml(block.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${escapeHtml(block.id)}" disabled>Add comment</button>`
    : `<span class="ve-ip-comment-control"><button type="button" id="${escapeHtml(block.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${escapeHtml(block.id)}" ${reviewControlAttributes(context, `comment:${block.id}`)}>Add comment</button>${persistenceFeedback(`comment:${block.id}`)}</span>`,
  Callout: (block) => card(block, `ve-ip-callout ve-ip-callout--${escapeHtml(block.props.tone ?? "note")}`),
  Tabs: renderDiffTabs,
  Table: renderTableLike,
} satisfies Record<MdxComponentName, Renderer>;

export function renderBlock(block: MdxBlock, context: RenderContext): string {
  const renderer = renderers[block.type];
  if (!renderer) throw new Error(`No renderer registered for ${block.type}`);
  return renderer(block, context);
}

export function renderBlocks(blocks: MdxBlock[], context: RenderContext): string {
  return blocks.map((block) => renderBlock(block, context)).join("\n");
}
