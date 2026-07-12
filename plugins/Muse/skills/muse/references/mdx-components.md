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
- `ArchitectureDiagram` — Mermaid diagram wrapped with Muse diagram chrome.
- `ImplementationTimeline` — ordered implementation units.
- `RiskRegister` — risk/mitigation/severity table.

## Implementation evidence components

- `FileMap` / `FileTree` — repo-relative file footprints.
- `AnnotatedCode` — focused code with file header.
- `DiffTabs` — file-specific changes grouped into labeled panels.
- `Tabs` — code-styled labeled panels for related evidence.
- `ApiSurface` — API/command/route contract table.
- `DataModel` — schema/entity table.

## UI/product components

- `Wireframe` — semantic HTML fragment inside renderer-owned frame.
- `BeforeAfter` — visual before/after comparison.
- `StateGallery` — multiple UI states.

## Tabs contract

Separate panels with `---`; each panel's first line is its visible label. A leading `file:` prefix is optional and omitted from the label. Interactive output uses a single tab stop, supports Left/Right with wraparound plus Home/End, and activates panels on click or keyboard navigation. Static export renders every labeled panel sequentially in source order without tab controls.

## Authoring rule

If a common plan element has a component, use the component. Raw HTML is reserved for exceptional one-off visuals.
