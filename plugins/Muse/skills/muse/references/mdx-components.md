# MDX Components

Use these components to make plans visually informative and interactive.

## Review components

- `ApprovalGate` — approve/needs-revision controls and handoff generation.
- `QuestionForm` — reviewer decisions with persisted answers.
- `Checklist` — review checklist state.
- `CommentAnchor` — target for anchored feedback.
- `Callout` — decision, warning, note, and risk callouts.

### Readiness fields

Each `QuestionForm` line uses `id | prompt | mode | policy`; omitting the fourth field makes the question advisory. Each `Checklist` line uses `id | label | policy`; omitting the third field makes the item advisory. `policy` is exactly `required` or `advisory`.

```mdx
<QuestionForm id="questions" title="Open Questions">
runtime | Which runtime should this plan use? | freeform | required
notes | Any additional context? | freeform | advisory
owner | Who owns implementation? | freeform
</QuestionForm>

<Checklist id="checks" title="Verification">
schema | Schema validates | required
render | HTML renders | advisory
copy | Copy reviewed
</Checklist>
```

Readiness item IDs must be nonblank and unique across `plan.mdx` and `canvas.mdx`. Required questions need a nonblank scalar answer or at least one nonblank string in an array answer; required checklist items must be `true`. Advisory and omitted-policy items never gate approval.

## Visual explanation components

- `PlanSummary` — hero summary with goal, scope, audience, and status.
- `StatusDashboard` — KPI/status cards.
- `DecisionMatrix` — decision/rationale/status table.
- `ArchitectureDiagram` — Mermaid diagram wrapped with Muse diagram chrome.
- `ImplementationTimeline` — ordered implementation units.
- `RiskRegister` — risk/mitigation/severity table.

## Implementation evidence components

- `FileMap` / `FileTree` — repo-relative file footprints.
- `AnnotatedCode` — focused code with file header.
- `DiffTabs` — key changes grouped in tabs.
- `ApiSurface` — API/command/route contract table.
- `DataModel` — schema/entity table.

## UI/product components

- `Wireframe` — semantic HTML fragment inside renderer-owned frame.
- `BeforeAfter` — visual before/after comparison.
- `StateGallery` — multiple UI states.

## Authoring rule

If a common plan element has a component, use the component. Raw HTML is reserved for exceptional one-off visuals.
