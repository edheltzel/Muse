# MDX Components

Use these components to make plans visually informative and interactive.

## Review components

- `ApprovalGate` — approve/needs-revision controls and handoff generation.
- `QuestionForm` — reviewer decisions with persisted answers.
- `Checklist` — review checklist state.
- `CommentAnchor` — button target for idempotent, anchored reviewer feedback.
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

Interactive and static renderers show each policy as visible `Required` or `Advisory` text and expose the normalized value on the item through `data-readiness-policy`. The persisted review state and backend readiness validator remain authoritative.

### Review-state persistence

The local bridge publishes immutable review bundles beneath `.muse-review/bundles/` and commits a complete generation by atomically replacing `.muse-review/current`. The root `plan-state.json`, `comments.json`, `agent-handoff.json`, and `agent-handoff.md` paths are compatibility links installed during the first locked migration. Existing regular files are validated and ingested before replacement; after initialization, a regular file at any compatibility path is treated as corruption and is preserved rather than silently replaced.

`POST /api/state` accepts only an object patch. `answers` must be an object whose values are strings or string arrays, and `checklist` must be an object whose values are booleans. Approval status, reviewer, and approval timestamps can be written only through `POST /api/approve`.

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
- `DiffTabs` — file-specific changes grouped into labeled panels.
- `Tabs` — code-styled labeled panels for related evidence.
- `ApiSurface` — API/command/route contract table; the first pipe-separated row defines column headers.
- `DataModel` — schema/entity table; the first pipe-separated row defines column headers.
- `Table` — generic data table; the first pipe-separated row defines column headers.

Generic tables may be empty or contain only a header row. Every body row must have the same number of pipe-separated cells as the header; ragged rows fail with the component type, block ID, row number, actual count, and expected count.

## UI/product components

- `Wireframe` — semantic HTML fragment inside renderer-owned frame.
- `BeforeAfter` — visual before/after comparison.
- `StateGallery` — multiple UI states.

## Tabs contract

Separate panels with `---`; empty panels, including leading, trailing, or consecutive separators, are invalid. Each panel's first line is its visible label. A leading `file:` prefix is optional and omitted from the label; a prefix-only label falls back to `Panel N` for `Tabs` or `Diff N` for `DiffTabs`. Set an optional `label` (or `title`) on the component to name the composite; the visible heading and tablist accessibility name use it, with the stable component ID distinguishing otherwise similar composites.

Interactive output uses a single tab stop for the tab row. Unmodified Left/Right wrap and activate, Home/End activate the boundaries, and Tab or modified navigation keys retain native behavior. When an active panel contains no naturally focusable content, the panel itself remains a Tab stop before focus exits the composite. Real pointer clicks rely on native button focus and activate the panel; programmatic `click()` activates without forcing focus. Static export renders every labeled panel sequentially in source order without hidden state or tab controls.

## Authoring rule

If a common plan element has a component, use the component. Raw HTML is reserved for exceptional one-off visuals.

Component IDs require explicit string values and are document-wide HTML identifiers. Start with a letter and use only letters, numbers, underscores, or hyphens; IDs must not collide across `plan.mdx`, `canvas.mdx`, renderer-owned IDs, generated tab descendants, or light-DOM descendants in raw `Wireframe` and `StateGallery` fragments. IDs inside each ordinary `template` or declarative shadow root are checked for safety and uniqueness within that isolated tree scope, not against the light document. Final rendering verifies that every authored, generated, and renderer-owned ID survives browser document parsing exactly once.

Raw `Wireframe` and `StateGallery` fragments must leave HTML comments and raw/RCDATA elements (`iframe`, `noembed`, `noframes`, `script`, `style`, `textarea`, `title`, and `xmp`) closed. `plaintext` is not allowed because HTML has no effective closing tag for it. Unterminated tokenizer states are rejected before they can swallow following components. Component tags must also be complete and have matching closing tags.

Simple PascalCase tags matching the supported names above are Muse components. Dotted and namespaced JSX names such as `<Tabs.Panel>` and `<UI:Callout>` remain opaque authored content. An exact supported name followed by any other continuation, such as `<Tabs!>` or `<Callout=>`, is malformed and rejected. Literal-body components—including `AnnotatedCode`, `Tabs`, and `DiffTabs`—preserve supported-looking tags and template-literal examples as content rather than interpreting them as nested Muse blocks. A standalone matching close inside a literal body is provisional: the parser tries close candidates in source order and backtracks until the remainder is a valid component document. Authors may therefore show a literal `</Tabs>`, `</DiffTabs>`, or `</AnnotatedCode>` line unchanged when a later matching line closes the containing component; multiple following literal-body components remain independently parsed.
