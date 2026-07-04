---
description: Turn a branch, commit, PR, or git diff into an interactive visual recap with diagrams, file maps, annotated diffs, and focused review notes
---

# Visual Recap

Create an interactive Muse recap for work that already exists. This is the reverse of `/generate-visual-plan`: it explains what changed instead of planning what should change.

## Usage

```text
/visual-recap [branch | commit | PR number | range | diff file]
```

Default scope: compare the current branch against its merge base with the default branch.

## Workflow

1. Load the Muse skill.
2. Read:
   - `references/interactive-plans.md`
   - `references/mdx-components.md`
   - `references/recap-quality.md`
   - existing `commands/diff-review.md` for diff-scope conventions
3. Gather diff facts without replacing the raw diff review path:
   - changed file tree
   - key semantic changes
   - API/schema/data model changes
   - UI state changes when applicable
   - risky or surprising changes
4. Create `.agents/visual-recaps/<slug>/` with `plan.mdx`, `visual-explainer.json`, and review state files.
5. Use MDX components for recap sections:
   - `PlanSummary` for outcome narrative
   - `FileTree` for changed files
   - `DiffTabs` for key changed hunks
   - `ApiSurface` / `DataModel` for contract changes
   - `Wireframe`, `BeforeAfter`, or `StateGallery` for UI impact
   - `RiskRegister` for review concerns
   - `ApprovalGate` or acknowledgement gate
6. Render and serve locally with the interactive-plan tools.

## When to skip

Skip the recap for tiny diffs that are faster to review directly unless the user explicitly asks for a visual recap.

## Boundaries

- No Agent Native or hosted Plan MCP connector.
- No React or React-dependent MDX tooling.
- The recap is a companion to raw diff review, not a replacement for line-level review when code correctness matters.
