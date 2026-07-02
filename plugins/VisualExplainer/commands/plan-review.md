---
description: Review a plan against the current codebase; use interactive Visual Plans when a review needs persisted questions, comments, or approval state
---

# Plan Review

Review an existing plan/spec/RFC against the current repository.

Use this command for critique. Use `/generate-visual-plan` when the deliverable should become a new interactive plan artifact with MDX, review state, and an approval handoff.

## Inputs

```text
/plan-review <path-to-plan.md>
```

## Workflow

1. Load the VisualExplainer skill.
2. Read the supplied plan and relevant code/docs.
3. Verify claims against the repository.
4. Produce a VisualExplainer HTML review with:
   - current vs. planned state
   - file/API/schema evidence
   - risks and missing requirements
   - concrete recommendations
5. If the review exposes unresolved decisions that need human approval, recommend converting the plan into `/generate-visual-plan`.
