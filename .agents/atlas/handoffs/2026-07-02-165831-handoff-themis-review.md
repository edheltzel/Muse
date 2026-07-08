# Handoff: Themis Review Follow-up for atlasVisualExplainer

Date: 2026-07-02 16:58:31 local
Project path: `/Users/ed/Developer/atlasVisualExplainer`
Previous working path during review: `/Users/ed/Developer/atlas-visualExplainer`

## Purpose

Prepare the next Themis-dispatched agent to continue from the PR-equivalent review of the uncommitted VisualExplainer interactive-plan changes.

No files were edited, formatted, committed, or full-gated during the review session.

## Required context loaded during review

- `skill://ce-code-review`
- `skill://KarpathyGuidelines`
- `skill://codegraph`
- `skill://handoff` for this document

The requested `/pr-review-toolkit:review-pr` command was unavailable in the harness. Checks performed:

- `skill://pr-review-toolkit` returned unknown skill.
- tool discovery found no matching tool.
- `command -v pr-review-toolkit` returned no command.

## Review agents run

Two report-only agents were spawned and completed:

- `CeTestingReviewer` — test-coverage review.
- `CeCodeReview` — correctness, standards, maintainability, and contract review.

Their outputs corroborated the final findings below. The task notifications are in this session transcript under those job IDs.

## Scope reviewed

The review was scoped to the user-specified paths:

- `package.json`, `tsconfig.json`, `vite.config.ts`
- `README.md`, `CHANGELOG.md`, `install-pi.sh`
- `plugins/VisualExplainer/.claude-plugin/plugin.json`
- `plugins/VisualExplainer/commands/generate-visual-plan.md`
- `plugins/VisualExplainer/commands/plan-review.md`
- `plugins/VisualExplainer/commands/visual-recap.md`
- `plugins/VisualExplainer/skills/visual-explainer/SKILL.md`
- `plugins/VisualExplainer/skills/visual-explainer/references/interactive-plans.md`
- `plugins/VisualExplainer/skills/visual-explainer/references/mdx-blocks.md`
- `plugins/VisualExplainer/skills/visual-explainer/references/mdx-components.md`
- `plugins/VisualExplainer/skills/visual-explainer/references/recap-quality.md`
- `plugins/VisualExplainer/skills/visual-explainer/references/review-state.md`
- `plugins/VisualExplainer/skills/visual-explainer/templates/interactive-plan-shell.html`
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/*`
- `tests/interactive-plan.test.ts`
- `tests/fixtures/interactive-plans/*`

Known Themis verification before review:

- `bun test`: 6 pass, 0 fail, 80 expect calls.
- `bunx --bun vite build --config vite.config.ts`: passed; generated `dist` removed.
- LSP diagnostics for interactive-plan TS files: no issues.
- Browser fallback smoke: local review page had expected controls; question/checklist/Approve Plan persisted state and generated `agent-handoff.json`.
- Interceptor CLI unavailable: command not found.

## Final verdict from review

Request changes.

No P0 findings. Four P1 findings block merge. Two P2 findings should be addressed if straightforward.

## Findings to carry forward

### P1 — ArchitectureDiagram renders raw Mermaid plus dead controls

Evidence:

- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/components.ts:52-53` emits zoom buttons with `data-zoom`, `data-expand`, and `<pre class="mermaid mermaid-canvas">`.
- `plugins/VisualExplainer/skills/visual-explainer/templates/interactive-plan-shell.html:19` only injects `{{CLIENT}}`; no Mermaid loader/init script exists in the shell.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/client.ts:17-23`, `25-52`, and `55-64` handle tabs, needs-revision/approval, and questions/checklist only. No Mermaid init or zoom/expand handling.
- `plugins/VisualExplainer/skills/visual-explainer/SKILL.md:107-109` requires zoom controls and warns against bare inert Mermaid `<pre>` usage.

Impact: interactive visual plans can show raw Mermaid text with controls that do nothing.

Expected fix: bring over the canonical Mermaid runtime pattern from `templates/mermaid-flowchart.html`; load Mermaid, render SVG, wire zoom/pan/reset/expand, and add behavior tests. For static export, either pre-render SVG or show a deliberate readable source fallback without fake controls.

### P1 — Persisted review state is not hydrated into the UI

Evidence:

- `plugins/VisualExplainer/skills/visual-explainer/templates/interactive-plan-shell.html:9` hard-codes `<body data-review-status="draft">`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/components.ts:91` renders question inputs without `value`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/components.ts:99` renders checklist inputs without `checked`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/server.ts:24-25` exposes `/plan-state.json`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/client.ts:59-64` only POSTs changed values; it never fetches/applies `/plan-state.json` on load.

Impact: state is persisted but a refreshed/opened review page appears as a new draft with empty controls.

Expected fix: hydrate on load by fetching `/plan-state.json`, setting body status, populating answers, checking checklist inputs, and surfacing approval/reviewer metadata; or render initial state server-side. Add regression coverage.

### P1 — Failed approval can leave `plan-state.json` marked approved without handoff files

Evidence:

- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/state-store.ts:82-88` writes approved state before `generateAgentHandoff`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/schema.ts:131-135` rejects handoff generation when `unresolvedCommentIds.length > 0`.
- `plugins/VisualExplainer/skills/visual-explainer/references/review-state.md:16-18` says handoff files are generated only when approved and cannot be generated while blocking comments remain unresolved.
- `tests/interactive-plan.test.ts:124-144` tests only the resolved-comment happy path.

Impact: clicking Approve with unresolved comments can persist `approved` while `agent-handoff.json` / `.md` are absent.

Expected fix: validate unresolved comments before mutating approval state. Add a negative test asserting state remains non-approved and no handoff files are written.

### P1 — `/generate-visual-plan` uses repo-relative tool paths that fail in installed use

Evidence:

- `plugins/VisualExplainer/commands/generate-visual-plan.md:42-44` tells agents to run `bun plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/render.ts ...` and `server.ts ...`.
- `install-pi.sh:20-25` installs the skill to `$HOME/.pi/agent/skills/VisualExplainer`, where tools are under `tools/interactive-plan/...`.
- `README.md:82-95` and `README.md:97-110` describe Codex/OpenCode installs that copy the plugin into harness skill directories, not into the user's project repo.

Impact: the command likely fails from normal installed skill/plugin use outside this repository checkout.

Expected fix: make docs skill-relative: resolve the loaded VisualExplainer skill dir, then run `bun <skill-dir>/tools/interactive-plan/render.ts ...` and `server.ts ...`. Keep repo-relative path only as a development-checkout fallback. Add doc-contract test.

### P2 — MDX parser loses source order for self-closing components

Evidence:

- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/mdx-loader.ts:53-60` appends all paired matches first, then all self-closing matches.
- Current fixtures place self-closing `ApprovalGate` at the end, so tests do not expose this.

Impact: a mid-plan `<CommentAnchor />`, `<ApprovalGate />`, or future self-closing block moves to the bottom, changing render/nav order and review anchors.

Expected fix: use one ordered scanner or collect matches with `match.index`, sort by index, then map to blocks. Add parser-order regression test.

### P2 — Wireframe injects raw HTML with weak validation

Evidence:

- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/components.ts:109-110` injects `${block.body}` directly into `.ve-ip-wireframe`.
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/schema.ts:124-126` rejects only `<html>`, `<head>`, `<body>`, and `<script>` tags.

Impact: event handlers, `javascript:` URLs, SVG payloads, iframes, object/embed tags, and similar active content remain possible in the local approval surface.

Expected fix: choose an explicit contract: safe allowlist sanitizer, sandboxed iframe with scripts disabled, or documented trusted-only HTML with stronger validation. Add tests for event handlers and `javascript:` URLs.

## Test gaps to add

High-value tests before merge:

1. Approval rejection with unresolved comments:
   - add unresolved comment;
   - call `approvePlan`;
   - expect rejection;
   - assert state remains non-approved;
   - assert no handoff files exist;
   - resolve comment and assert approval succeeds.
2. `/plan-state.json` hydration into visible UI after reload.
3. Mermaid runtime/zoom/expand behavior, not just `.mermaid-wrap` markup.
4. Local Bun bridge route contract:
   - `GET /`
   - `GET /plan-state.json`
   - `GET /comments.json`
   - `POST /api/state`
   - `POST /api/comments`
   - `POST /api/approve`
   - invalid JSON behavior.
5. Installed command path contract: default docs must be skill-relative, not checkout-relative.
6. Self-closing MDX source-order preservation.
7. Wireframe sanitization/sandbox contract.

Residual test risks noted:

- `state-store.ts:7-12` catches all JSON read/parse failures and returns fallback defaults. Missing files and malformed files probably need distinct behavior.
- `render.ts:27-32` reads the shell template via a repo-relative path and silently falls back. If installed template changes matter, resolve template relative to module/skill location and test it.

## Suggested skills for next Themis

- `ce-debug` or `ce-work` if implementing fixes.
- `tdd` if taking the recommended test-first path.
- `ce-code-review` for the follow-up review after fixes.
- `codegraph` for structure questions about the interactive-plan subsystem.
- `KarpathyGuidelines` to keep fixes surgical and avoid speculative abstractions.
- `agent-browser` only for exploratory browser checks; use Interceptor if available for final web verification per project rules.

## Suggested next sequence

1. Re-open project at `/Users/ed/Developer/atlasVisualExplainer`.
2. Confirm the same uncommitted changes are present.
3. Add failing tests for P1 findings first.
4. Fix approval state ordering and UI hydration.
5. Wire Mermaid/runtime controls or deliberately remove inert controls and update docs/tests accordingly.
6. Fix installed command path instructions and doc-contract tests.
7. Address P2 parser order and wireframe contract.
8. Run targeted tests:
   - `bun test tests/interactive-plan.test.ts`
   - `bunx --bun vite build --config vite.config.ts`
   - LSP diagnostics for interactive-plan TS files.
9. Browser/real-Chrome verification for rendered plan review page if Interceptor is available; otherwise document fallback smoke limitations.

## Important non-goals

- Do not format unrelated files.
- Do not run full repo gates unless explicitly required by the reviewer workflow.
- Do not commit or push unless separately instructed.
- Do not remove protected plan/docs artifacts just because they are untracked.
