![VisualExplainer banner](banner.png)

# VisualExplainer

**Turn dense agent output into beautiful browser-native pages people can actually understand.**

VisualExplainer is an agent skill for diagrams, visual plans, diff reviews, project recaps, slide decks, and approval-aware MDX review pages. It is built for humans first: open the page, scan the structure, interact with the review controls, and hand an agent the resulting machine-readable context when you approve.

![VisualExplainer component library screenshot](docs/assets/component-library-showcase.png)

## What it makes

- **Architecture diagrams** with real Mermaid rendering, zoom, pan, and expand controls.
- **Visual implementation plans** with questions, checklists, comments, approval state, and `agent-handoff.*` files.
- **Visual recaps** for branches, commits, PRs, and diffs.
- **Diff and plan reviews** that are easier to scan than terminal walls of text.
- **Slide decks** when a walkthrough needs presentation pacing instead of a scrollable page.
- **Component-library demos** that show every supported MDX block in one place.

## See it locally

This repository includes a complete component-library fixture that acts like a style guide for the interactive plan system.

```bash
vp install
vp run visual-plan:render tests/fixtures/interactive-plans/component-library-showcase
vp run visual-plan:serve tests/fixtures/interactive-plans/component-library-showcase 7375
```

Then open:

```text
http://localhost:7375/
```

The demo includes every current MDX component family, a realistic launch-readiness use case, light/dark theme toggle, Mermaid diagram rendering, review questions, checklist state, and an approval gate.

## Quick examples

```text
> draw a diagram of our authentication flow
> /diff-review
> /generate-visual-plan ~/docs/refactor-plan.md
> /visual-recap main...HEAD
> /project-recap --slides
```

Static diagram commands write portable HTML pages. Interactive plan and recap commands write local MDX review folders with persisted state and approval handoff files.

## Why this exists

Agents are good at structure but bad at presentation by default. Ask for a diagram and you usually get ASCII boxes. Ask for a comparison and you get a pipe table that wraps in the terminal. Ask for a plan and you get prose that nobody wants to review line by line.

VisualExplainer turns that same information into a web page:

1. the agent gathers the facts,
2. the skill picks the right visual treatment,
3. the result opens in a browser,
4. the human reviews visually,
5. interactive plans can produce an agent-readable handoff after approval.

## Install

### Claude Code marketplace

```shell
/plugin marketplace add edheltzel/VisualExplainer
/plugin install VisualExplainer@VisualExplainer-marketplace
```

Claude Code namespaces commands as `/VisualExplainer:command-name`.

### Pi

```bash
pi install git:github.com/edheltzel/VisualExplainer
```

From a local checkout:

```bash
git clone --depth 1 https://github.com/edheltzel/VisualExplainer.git
pi install ./VisualExplainer
```

The package manifest advertises the canonical skill and command templates:

```json
"pi": {
  "skills": ["./plugins/VisualExplainer"],
  "prompts": ["./plugins/VisualExplainer/commands"]
}
```

If you previously used the old curl/manual installer, remove those copied files before using `pi install`; otherwise Pi may report skill and prompt conflicts because user-level copies shadow package resources:

```bash
rm -rf ~/.pi/agent/skills/VisualExplainer
rm -f ~/.pi/agent/prompts/{diff-review,fact-check,generate-slides,generate-visual-plan,generate-web-diagram,plan-review,project-recap,share-page,visual-recap}.md
```

### Codex CLI

```bash
git clone --depth 1 https://github.com/edheltzel/VisualExplainer.git /tmp/VisualExplainer
mkdir -p ~/.codex/skills ~/.codex/prompts
cp -R /tmp/VisualExplainer/plugins/VisualExplainer ~/.codex/skills/VisualExplainer
cp /tmp/VisualExplainer/plugins/VisualExplainer/commands/*.md ~/.codex/prompts/
rm -rf /tmp/VisualExplainer
```

Invoke with `$VisualExplainer` or, when prompt templates are installed and supported, `/prompts:diff-review`, `/prompts:plan-review`, etc.

### OpenCode/opencode

```bash
git clone --depth 1 https://github.com/edheltzel/VisualExplainer.git /tmp/VisualExplainer
mkdir -p ~/.config/opencode/skill ~/.config/opencode/command
cp -R /tmp/VisualExplainer/plugins/VisualExplainer ~/.config/opencode/skill/VisualExplainer
cp /tmp/VisualExplainer/plugins/VisualExplainer/commands/*.md ~/.config/opencode/command/
rm -rf /tmp/VisualExplainer
```

### Cursor and OpenClaw

- Cursor: use `configs/cursor/visual-explainer.mdc` as the project rule.
- OpenClaw: use `configs/openclaw/AGENTS.md` as lightweight project guidance.

## Commands

| Command | Human result |
|---|---|
| `/generate-web-diagram` | A styled HTML diagram for any topic |
| `/generate-visual-plan` | An interactive MDX implementation plan with review state and handoff files |
| `/visual-recap` | A visual recap for a branch, commit, PR, or diff |
| `/generate-slides` | A magazine-quality slide deck |
| `/diff-review` | A visual code-review page with architecture context |
| `/plan-review` | A plan-vs-codebase review with risks and gaps |
| `/project-recap` | A visual mental-model snapshot for returning to a project |
| `/fact-check` | A code-grounded accuracy review for a document |
| `/share-page` | A Vercel production URL for an HTML explainer page |

The skill also activates proactively when an agent is about to dump a complex table in the terminal: 4+ rows or 3+ columns should become a browser page.

## Interactive plans

Interactive plans are local-first review packets:

```text
.agents/visual-plans/<slug>/
├── plan.mdx
├── canvas.mdx                 optional UI/product canvas
├── visual-explainer.json      manifest
├── plan-state.json            local reviewer state
├── comments.json              local comment threads
├── agent-handoff.json         generated after approval
├── agent-handoff.md           generated after approval
└── dist/
    ├── index.html             interactive review page
    └── static-export.html     portable read-only export
```

The browser page supports:

- persisted reviewer answers,
- checklist state,
- approval and needs-revision controls,
- Mermaid diagrams with zoom/pan/expand,
- light/dark theme toggle,
- static export for sharing without the local bridge.

## Component library fixture

Use the checked-in style-guide fixture when you want to see the whole component system at once:

```bash
vp run visual-plan:render tests/fixtures/interactive-plans/component-library-showcase
vp run visual-plan:serve tests/fixtures/interactive-plans/component-library-showcase 7375
```

It covers:

- overview components: `PlanSummary`, `StatusDashboard`, `Callout`,
- planning components: `DecisionMatrix`, `ImplementationTimeline`, `RiskRegister`,
- evidence components: `FileMap`, `FileTree`, `AnnotatedCode`, `DiffTabs`,
- contract components: `ApiSurface`, `DataModel`, `Table`,
- product components: `Wireframe`, `BeforeAfter`, `StateGallery`,
- review controls: `QuestionForm`, `Checklist`, `ApprovalGate`, `CommentAnchor`.

## Development stack

VisualExplainer now uses **Vite+ as the project toolchain** with **Bun as the underlying package manager**.

- `vp install` installs dependencies through Bun because `packageManager` is pinned to `bun@1.3.14`.
- `vp build` runs the Vite+ production build.
- `vp run test` runs the existing Bun test suite.
- `vp run visual-plan:build` builds the interactive plan shell.
- `vp run visual-plan:render <plan-dir>` renders a plan folder.
- `vp run visual-plan:serve <plan-dir> [port]` serves a local review page.

```bash
vp install
vp run test
vp run visual-plan:build
```

Use `vp add`, `vp remove`, and `vp install` for dependency management. Do not use `npm`, `npx`, `pnpm`, or `yarn` in this repo.

## Project layout

```text
.claude-plugin/                         marketplace metadata
plugins/VisualExplainer/
├── .claude-plugin/                     plugin manifest
├── commands/                           command prompts
└── skills/visual-explainer/
    ├── SKILL.md                        skill instructions
    ├── references/                     design, Mermaid, MDX, state docs
    ├── templates/                      HTML templates
    ├── tools/interactive-plan/         renderer, server, state, handoff code
    └── scripts/share.sh                Vercel share helper
configs/                                harness-specific guidance
tests/fixtures/interactive-plans/       reproducible review-page fixtures
docs/assets/                            README screenshots and visual examples
AGENTS.md                               agent-facing repository guide
```

## Agent reference

Agents should read [`AGENTS.md`](AGENTS.md) before editing this repository. The short version:

- use Vite+ commands (`vp install`, `vp run`, `vp build`),
- keep Bun as the underlying package manager,
- preserve vanilla HTML/CSS/TypeScript boundaries,
- do not add React or Agent Native,
- render visual behavior in browser before claiming it works,
- update the component-library fixture when adding or changing components.

## Limitations

- Generated HTML is portable, but auto-opening depends on the harness, browser access, and sandbox rules.
- Mermaid rendering in interactive pages uses the Mermaid browser runtime from jsDelivr; the page keeps a readable source fallback if the runtime is unavailable.
- `/share-page` uses Vercel CLI and requires a one-time `vercel login`.
- Visual quality depends on the model following the skill’s design rules; the component-library fixture exists so regressions are easier to see.

## Credits

Borrows ideas from [Anthropic's frontend-design skill](https://github.com/anthropics/skills) and [interface-design](https://github.com/Dammyjay93/interface-design).

## License

MIT
