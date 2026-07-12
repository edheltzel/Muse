# MDX Components

Use these components to make plans visually informative and interactive.

## Review components

- `ApprovalGate` — approve/needs-revision controls and handoff generation.
- `QuestionForm` — reviewer decisions with persisted answers.
- `Checklist` — review checklist state.
- `CommentAnchor` — target for anchored feedback.
- `Callout` — decision, warning, note, and risk callouts.

## Visual explanation components

- `PlanSummary` — hero summary with goal, scope, audience, and status.
- `StatusDashboard` — KPI/status cards.
- `DecisionMatrix` — decision/rationale/status table.
- `ArchitectureDiagram` — Mermaid diagram with named zoom/expand controls, Ctrl/Command-scroll zoom, and a focusable, arrow-key-pannable viewport.
- `ImplementationTimeline` — ordered implementation units.
- `RiskRegister` — risk/mitigation/severity table.

## Implementation evidence components

- `FileMap` / `FileTree` — repo-relative file footprints.
- `AnnotatedCode` — focused code with file header.
- `DiffTabs` — key changes grouped in tabs.
- `ApiSurface` — API/command/route contract table; the first pipe-separated row defines column headers.
- `DataModel` — schema/entity table; the first pipe-separated row defines column headers.
- `Table` — generic data table; the first pipe-separated row defines column headers.

Generic tables may be empty or contain only a header row. Every body row must have the same number of pipe-separated cells as the header; ragged rows fail with the component type, block ID, row number, actual count, and expected count.

## UI/product components

- `Wireframe` — semantic HTML fragment inside renderer-owned frame.
- `BeforeAfter` — visual before/after comparison.
- `StateGallery` — multiple UI states.

## Authoring rule

If a common plan element has a component, use the component. Raw HTML is reserved for exceptional one-off visuals.
