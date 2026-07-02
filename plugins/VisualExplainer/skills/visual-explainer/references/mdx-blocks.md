# MDX Blocks

All interactive plan components compile to VisualExplainer block data with stable IDs. Every component must include an `id` prop so comments, answers, and approval state can anchor to it.

## Rules

- Use documented components instead of raw HTML for common plan structures.
- Reject unknown components during validation.
- Reject duplicate IDs.
- Reject `<html>`, `<head>`, `<body>`, and `<script>` inside wireframes.
- Static export must remain readable without the local bridge.
- Interactive persistence requires the local Bun bridge.

## Core block data

```ts
interface MdxBlock {
  id: string;
  type: string;
  props: Record<string, string | boolean | number>;
  body: string;
}
```
