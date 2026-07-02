# Interactive Visual Plans

Interactive Visual Plans are local-first review artifacts for implementation plans and recaps. They replace one-off static HTML as the source of truth for high-stakes plan review.

## Artifact contract

A plan or recap lives in `.agents/visual-plans/<slug>/` or `.agents/visual-recaps/<slug>/`:

- `plan.mdx` — canonical MDX document.
- `canvas.mdx` — optional UI/storyboard surface.
- `visual-explainer.json` — manifest metadata.
- `plan-state.json` — review state.
- `comments.json` — anchored comments.
- `agent-handoff.json` / `agent-handoff.md` — generated only after approval.
- `dist/index.html` — interactive local review page.
- `dist/static-export.html` — static fallback for archive/share.

## Runtime stance

Use Bun for commands/tests/server. Use Vite/Vite Plus for browser review assets. MDX needs a JavaScript/runtime path; choose the smallest Vite-compatible runtime that works. Do not add React, React DOM, Agent Native packages, or hosted Plan MCP assumptions.

## Approval flow

1. Agent authors MDX with VisualExplainer components.
2. Renderer validates component IDs and block schema.
3. Local bridge serves `dist/index.html`.
4. Reviewer answers questions, checks checklist items, comments, then approves.
5. Approval writes the agent handoff files for future implementation agents.
