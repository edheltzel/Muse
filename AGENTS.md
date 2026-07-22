# Muse Agent Guide

This file is the repository-local reference for coding agents working on Muse.

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
vp run component-explorer:render
vp run component-explorer:serve
```

Dependency changes go through Vite+:

```bash
vp add -D <package>
vp remove <package>
vp install
```

Do not use `npm`, `npx`, `pnpm`, or `yarn` in this repo. Vite+ delegates to Bun because the root `packageManager` field is pinned to Bun.

## OMP plugin contract

`plugins/Muse/` is also the OMP, Claude Code, and Codex plugin root. Keep its `plugin.json` version in sync with root `package.json`, `plugins/Muse/.claude-plugin/plugin.json`, `plugins/Muse/.codex-plugin/plugin.json`, `plugins/Muse/skills/muse/SKILL.md`, and `.claude-plugin/marketplace.json`. Machine and display identity must stay lowercase `muse` in every manifest and skill metadata surface; OMP silently drops catalog entries with uppercase machine names. The directory name `plugins/Muse` is a path, not the plugin name. Keep host-native explicit syntax confined to `plugins/Muse/skills/muse/references/invocation.md`; every other user-facing surface uses the cross-host request `Use muse to <task>`.

Use OMP commands for OMP installs:

```bash
omp install github:edheltzel/Muse
omp plugin marketplace add edheltzel/Muse
omp install muse@muse-marketplace
omp install --scope project muse@muse-marketplace
omp plugin list
```

Project scope (`--scope project`) works only for marketplace installs; it is warned-and-ignored for git sources, and `-l` is not a valid flag. `/extensions` is TUI-only — use `omp plugin list` for scripted verification.

Local installs need the root `package.json` manifest: use `omp install .` from the repo root (`omp install ./plugins/Muse` fails). Local marketplace sources need a `./` prefix or an absolute path. Uninstalls must use the full ref: `omp plugin uninstall muse@muse-marketplace` (the bare name reports success without removing a marketplace-scoped install).

Do not document OMP installs with `pi install`; Pi and OMP have separate package managers even though this repo supports both surfaces. Codex user skills belong under `~/.agents/skills`, not the legacy `~/.codex/skills` path; Codex plugins use `.codex-plugin/plugin.json`.

## Architecture map

```text
plugins/Muse/commands/                         slash-command prompt templates
plugins/Muse/skills/muse/SKILL.md              primary skill instructions
plugins/Muse/skills/muse/references/invocation.md canonical cross-host request and native fallback syntax
plugins/Muse/skills/muse/references/           design and authoring references
plugins/Muse/skills/muse/templates/            HTML templates
plugins/Muse/skills/muse/tools/interactive-plan/ renderer, server, state, handoff
tests/fixtures/interactive-plans/               reproducible MDX review fixtures
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
- `runtime-entry.ts` is the source entry for the installed-plugin runtime.
- `runtime.mjs` is the committed Bun bundle used from cached plugin copies; `vp run visual-plan:build` must keep it synchronized and self-contained.
- `state-store.ts` persists local reviewer state.
- `handoff.ts` generates agent handoff files.

## Component-library fixture

When adding, removing, or materially changing an MDX component, update:

- `plugins/Muse/skills/muse/tools/interactive-plan/shared.ts`
- `plugins/Muse/skills/muse/tools/interactive-plan/components.ts`
- `plugins/Muse/skills/muse/references/mdx-components.md`
- `tests/fixtures/interactive-plans/component-library-showcase/plan.mdx`
- `tests/interactive-plan.test.ts`

The component-library fixture is the visual regression anchor. It should show every supported component and a realistic use case.

## Design rules

Muse output should look deliberate, not generated from a default AI template.

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

   This also rebuilds the committed installed-plugin runtime bundle.

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

Agent docs live here. Keep this file operational: commands, contracts, invariants, and verification only. Host-native invocation syntax lives only in `plugins/Muse/skills/muse/references/invocation.md`.

## DOX framework

DOX makes `AGENTS.md` files binding work contracts for their subtrees. The procedural how-to
(Read Before Editing, Update After Editing, Hierarchy, Child Doc Shape, Style, Closeout)
lives in **[docs/dox.md](docs/dox.md)**. Read it before editing any file in this repository.

### Core Contract

- `AGENTS.md` files are binding work contracts for their subtrees.
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable `AGENTS.md` plus every parent `AGENTS.md` above it.
- No child doc may weaken DOX; the closer doc controls local detail, while parent docs control repository-wide rules.
- When the user requests a durable behavior change, record it here or in the nearest owning child `AGENTS.md`.

### Child DOX Index

- [`configs/openclaw/AGENTS.md`](configs/openclaw/AGENTS.md) owns OpenClaw's lightweight rules guidance and its use of the canonical `muse` skill and command templates.
- [`configs/codex/AGENTS.md`](configs/codex/AGENTS.md) owns Codex installation, discovery, invocation, and browser constraints for `muse`.
- [`configs/pi/AGENTS.md`](configs/pi/AGENTS.md) owns Pi package installation, prompt invocation, legacy-copy compatibility, and optional sharing dependencies.

Add another child contract when a folder becomes a durable boundary with local rules that do not belong in this repository-wide guide.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
