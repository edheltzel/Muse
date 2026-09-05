---
description: Generate an interactive MDX visual implementation plan with local review, persisted approval state, and agent handoff files
---

# Generate Visual Plan

Create an interactive `do-muse` plan artifact, not a one-off static HTML page.

## Usage

```text
/generate-visual-plan <feature request, plan file, spec file, or RFC>
```

## Workflow

1. Load the `do-muse` skill.
2. Read these references before authoring:
   - resolved `DESIGN.md` (project, then `~/.agents/DESIGN.md`, then `plugins/Muse/DESIGN.md`)
   - `references/interactive-plans.md`
   - `references/mdx-components.md`
   - `references/mdx-blocks.md`
   - `references/review-state.md`
   - `references/css-patterns.md`
3. Research the current repo enough to ground file maps, code snippets, APIs, and edge cases.
4. Create a folder under `.agents/visual-plans/<slug>/` containing:
   - `plan.mdx`
   - optional `canvas.mdx` for UI/storyboard work
   - `visual-explainer.json`
   - initial `plan-state.json`
5. Author the plan with documented MDX components:
   - `PlanSummary` for goal, scope, audience, approval state
   - `DecisionMatrix` or `BeforeAfter` for current vs. target behavior
   - `ArchitectureDiagram` for Mermaid diagrams
   - `FileTree` / `FileMap` for repo-relative file footprints
   - `AnnotatedCode` for concrete implementation evidence
   - `RiskRegister` for risks and mitigations
   - `QuestionForm` for unresolved reviewer choices
   - `Checklist` for verification criteria
   - `ApprovalGate` for local approval and handoff generation
6. Resolve the installed skill directory before invoking the bundled runtime:

```text
MUSE_SKILL_DIR = directory containing the do-muse SKILL.md you loaded
```

7. Validate and render locally from that installed skill directory:

```bash
bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" render .agents/visual-plans/<slug>
bun "$MUSE_SKILL_DIR/tools/interactive-plan/runtime.mjs" serve .agents/visual-plans/<slug>
```

8. If `plannotator` is on PATH, open the review there. Otherwise open the local review URL. Never auto-install Plannotator. Do not write `~/.plannotator/config.json`. steer-chat is out of v1.
9. Tell the user:
   - source folder
   - review URL
   - static export path
   - agent handoff path after approval

## Hard boundaries

- Do not use Agent Native, hosted Plan MCP, hosted databases, or `@agent-native/*` packages.
- Do not add React, React DOM, React app scaffolding, or React-dependent MDX tooling.
- Use Bun and TypeScript.
- Use Vite/Vite Plus for browser review assets with the smallest working runtime.
- Keep existing static diagram commands working; this command is the interactive plan path.
