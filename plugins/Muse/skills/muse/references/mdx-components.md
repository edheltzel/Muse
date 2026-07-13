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

Separate panels with `---`; empty panels, including leading, trailing, or consecutive separators, are invalid. Each panel's first line is its visible label. A leading `file:` prefix is optional and omitted from the label; a prefix-only label falls back to `Panel N` for `Tabs` or `Diff N` for `DiffTabs`.

Interactive output uses a single tab stop. Unmodified Left/Right wrap and activate, Home/End activate the boundaries, and Tab or modified navigation keys retain native behavior. Real pointer clicks rely on native button focus and activate the panel; programmatic `click()` activates without forcing focus. Static export renders every labeled panel sequentially in source order without hidden state or tab controls.

## Authoring rule

If a common plan element has a component, use the component. Raw HTML is reserved for exceptional one-off visuals.

Component IDs require explicit string values and are document-wide HTML identifiers. Start with a letter and use only letters, numbers, underscores, or hyphens; IDs must not collide across `plan.mdx`, `canvas.mdx`, renderer-owned IDs, generated tab descendants, or raw `Wireframe` descendants. Component tags must be complete and have matching closing tags.

Simple PascalCase tags matching the supported names above are Muse components. Dotted and namespaced JSX names such as `<Tabs.Panel>` and `<UI:Callout>` remain opaque authored content. An exact supported name followed by any other continuation, such as `<Tabs!>` or `<Callout=>`, is malformed and rejected. Literal-body components—including `AnnotatedCode`, `Tabs`, and `DiffTabs`—preserve supported-looking tags and template-literal examples as content rather than interpreting them as nested Muse blocks.
