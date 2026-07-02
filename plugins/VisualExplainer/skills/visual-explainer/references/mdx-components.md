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
- `ArchitectureDiagram` — Mermaid diagram wrapped with VisualExplainer diagram chrome.
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
