# VisualExplainer Agent Guide

This file is the repository-local reference for coding agents working on VisualExplainer.

## Current stack

- Runtime and package manager: Bun, pinned by `packageManager: "bun@1.3.14"`.
- Toolchain entry point: Vite+ via `vp` and local `vite-plus`.
- Build config: `vite.config.ts` using `defineConfig` from `vite-plus`.
- Tests: Bun test runner through `vp run test`.
- Interactive review pages: vanilla TypeScript, HTML, and CSS. No React. No Agent Native.

## Required commands

Use Vite+ commands from the repository root:

```bash
vp install
vp run test
vp run visual-plan:build
vp run visual-plan:render tests/fixtures/interactive-plans/component-library-showcase
vp run visual-plan:serve tests/fixtures/interactive-plans/component-library-showcase 7375
```

Dependency changes go through Vite+:

```bash
vp add -D <package>
vp remove <package>
vp install
```

Do not use `npm`, `npx`, `pnpm`, or `yarn` in this repo. Vite+ delegates to Bun because the root `packageManager` field is pinned to Bun.

## OMP plugin contract

`plugins/VisualExplainer/` is also the OMP plugin root. Keep its `plugin.json` version in sync with root `package.json`, `plugins/VisualExplainer/.claude-plugin/plugin.json`, `plugins/VisualExplainer/skills/visual-explainer/SKILL.md`, and `.claude-plugin/marketplace.json`. The plugin `name` must stay lowercase `visual-explainer` (OMP silently drops catalog entries with uppercase names) in `plugins/VisualExplainer/plugin.json`, `plugins/VisualExplainer/.claude-plugin/plugin.json`, and the `plugins[0].name` in `.claude-plugin/marketplace.json`; the directory name `plugins/VisualExplainer` is a path, not the plugin name. The name also appears in doc surfaces that must stay in sync: the README Claude Code command examples (`/visual-explainer:…`), the SKILL.md command namespaces, and the `commands/share-page.md` plugin cache path.

Use OMP commands for OMP installs:

```bash
omp install github:edheltzel/visual-explainer
omp plugin marketplace add edheltzel/visual-explainer
omp install visual-explainer@visual-explainer-marketplace
omp install --scope project visual-explainer@visual-explainer-marketplace
omp plugin list
```

Project scope (`--scope project`) works only for marketplace installs; it is warned-and-ignored for git sources, and `-l` is not a valid flag. `/extensions` is TUI-only — use `omp plugin list` for scripted verification.

Local installs need the root `package.json` manifest: use `omp install .` from the repo root (`omp install ./plugins/VisualExplainer` fails). Local marketplace sources need a `./` prefix or an absolute path. Uninstalls must use the full ref: `omp plugin uninstall visual-explainer@visual-explainer-marketplace` (the bare name reports success without removing a marketplace-scoped install).

Do not document OMP installs with `pi install`; Pi and OMP have separate package managers even though this repo supports both surfaces.

## Architecture map

```text
plugins/VisualExplainer/commands/                         slash-command prompt templates
plugins/VisualExplainer/skills/visual-explainer/SKILL.md  primary skill instructions
plugins/VisualExplainer/skills/visual-explainer/references/ design and authoring references
plugins/VisualExplainer/skills/visual-explainer/templates/  HTML templates
plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/ renderer, server, state, handoff
tests/fixtures/interactive-plans/                         reproducible MDX review fixtures
```

## Interactive-plan contracts

The interactive renderer reads a folder shaped like this:

```text
plan.mdx
canvas.mdx                 optional
visual-explainer.json      optional manifest
dist/index.html            generated interactive page
dist/static-export.html    generated static export
plan-state.json            generated local state
agent-handoff.*            generated after approval
```

Core source files:

- `shared.ts` defines the supported MDX component names.
- `schema.ts` defines manifest, state, comments, and handoff types.
- `mdx-loader.ts` parses frontmatter and component blocks.
- `components.ts` renders MDX blocks to HTML.
- `client.ts` owns browser interactions: theme toggle, Mermaid rendering, zoom/pan, tabs, persistence handlers.
- `render.ts` creates `dist/index.html` and `dist/static-export.html`.
- `server.ts` serves the local review bridge.
- `state-store.ts` persists local reviewer state.
- `handoff.ts` generates agent handoff files.

## Component-library fixture

When adding, removing, or materially changing an MDX component, update:

- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/shared.ts`
- `plugins/VisualExplainer/skills/visual-explainer/tools/interactive-plan/components.ts`
- `plugins/VisualExplainer/skills/visual-explainer/references/mdx-components.md`
- `tests/fixtures/interactive-plans/component-library-showcase/plan.mdx`
- `tests/interactive-plan.test.ts`

The component-library fixture is the visual regression anchor. It should show every supported component and a realistic use case.

## Design rules

VisualExplainer output should look deliberate, not generated from a default AI template.

Avoid:

- React or Agent Native dependencies.
- Violet/indigo gradient text.
- Emoji section headers.
- Neon cyan/magenta dashboards.
- Generic identical card grids.
- Decorative grid/stripe backgrounds unless the surface is a real canvas or blueprint.
- Mermaid diagrams without zoom, pan, and expand controls.

Prefer:

- restrained palettes: terracotta, sage, teal, gold, slate,
- distinctive but readable typography,
- strong hierarchy and compact reference sections,
- semantic HTML tables for comparison/data content,
- vanilla browser APIs before dependencies,
- light and dark themes that both feel intentional.

## Mermaid notes

Mermaid does not accept CSS `oklch(...)` values in `themeVariables`. The page CSS can use OKLCH, but Mermaid configuration must use supported formats such as hex.

The interactive client renders Mermaid from `.mermaid-source` into `.mermaid-canvas`, then applies zoom and pan transforms to the canvas. Keep the readable source fallback available for static/error cases.

## Verification expectations

Before yielding after behavior or UI changes:

1. Run the focused test suite:

   ```bash
   vp run test
   ```

2. Run the shell build:

   ```bash
   vp run visual-plan:build
   ```

3. For UI-visible changes, render and serve the component-library fixture, then inspect in a browser:

   ```bash
   vp run visual-plan:render tests/fixtures/interactive-plans/component-library-showcase
   vp run visual-plan:serve tests/fixtures/interactive-plans/component-library-showcase 7375
   ```

4. Verify at least:

   - page opens,
   - theme toggle changes `document.documentElement.dataset.theme`,
   - Mermaid renders at least one SVG,
   - zoom controls mutate `.mermaid-canvas.style.transform`,
   - review controls remain visible and usable.

## Documentation expectations

Human docs live in `README.md`. Keep the README visual and outcome-first.

Agent docs live here. Keep this file operational: commands, contracts, invariants, and verification only.
