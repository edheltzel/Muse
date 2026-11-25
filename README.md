```
███╗   ███╗██╗   ██╗███████╗███████╗
████╗ ████║██║   ██║██╔════╝██╔════╝
██╔████╔██║██║   ██║███████╗█████╗
██║╚██╔╝██║██║   ██║╚════██║██╔══╝
██║ ╚═╝ ██║╚██████╔╝███████║███████╗
╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚══════╝
```

# muse

> [!WARNING]
> **This repository is archived and no longer maintained.** Use the [Plannotator](https://github.com/backnotprop/plannotator) plugin and its `plannotator-visual-explainer` skill instead. See [Use Plannotator instead](#use-plannotator-instead).

> [!NOTE]
> Big thanks to [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer) for the original idea and work. muse was a heavily modified fork of it.

**Turn dense agent output into beautiful browser-native pages people can actually understand.**

muse is an agent skill for diagrams, visual plans, diff reviews, project recaps, slide decks, and approval-aware MDX review pages. It is built for humans first: open the page, scan the structure, interact with the review controls, and hand an agent the resulting machine-readable context when you approve.

![muse component library screenshot](docs/assets/component-library-showcase.png)

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
vp run component-explorer:render
vp run component-explorer:serve
```

Then open:

```text
http://localhost:7375/
```

The explorer includes every current MDX component, search and family filters, copyable MDX source, a realistic launch-readiness use case, light/dark themes, Mermaid rendering, review questions, checklist state, and an approval gate.

## Quick examples

```text
> draw a diagram of our authentication flow
> /diff-review
> /generate-visual-plan ~/docs/refactor-plan.md
> /generate-visual-recap main...HEAD
> /project-recap --slides
```

Static diagram commands write portable HTML pages. Interactive plan and recap commands write local MDX review folders with persisted state and approval handoff files.

## Why this exists

Agents are good at structure but bad at presentation by default. Ask for a diagram and you usually get ASCII boxes. Ask for a comparison and you get a pipe table that wraps in the terminal. Ask for a plan and you get prose that nobody wants to review line by line.

muse turns that same information into a web page:

1. the agent gathers the facts,
2. the skill picks the right visual treatment,
3. the result opens in a browser,
4. the human reviews visually,
5. interactive plans can produce an agent-readable handoff after approval.

## Use Plannotator instead

muse is no longer installed or updated. Its job now belongs to [Plannotator](https://github.com/backnotprop/plannotator): plans and PR explainers render with Plannotator theming and open in Plannotator's annotation UI, where you can approve, deny, or annotate them.

1. Install the Plannotator plugin. In Claude Code:

   ```shell
   /plugin marketplace add backnotprop/plannotator
   /plugin install plannotator@plannotator
   ```

   For Codex, Pi, OMP, OpenCode, and other agents, follow [Plannotator's installation guide](https://github.com/backnotprop/plannotator#readme).

2. Add the visual explainer skill. It ships with Plannotator's optional extra skills, which are not installed by default:

   ```bash
   npx skills add backnotprop/plannotator/apps/skills/extra --global
   ```

3. Start a fresh agent session and ask for `plannotator-visual-explainer` by name, for example: `Use plannotator-visual-explainer to visualize this plan.` The skill does not activate on its own.

For architecture diagrams, data tables, slide decks, and recaps, the skill delegates to [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer) and asks to install it the first time.

### Removing muse

If you installed muse before, remove it:

```bash
claude plugin uninstall muse@muse-marketplace && claude plugin marketplace remove muse-marketplace
codex plugin remove muse@muse-marketplace && codex plugin marketplace remove muse-marketplace
pi remove git:github.com/edheltzel/Muse
omp plugin uninstall muse@muse-marketplace
rm -rf ~/.agents/skills/do-muse ~/.claude/skills/do-muse ~/.pi/agent/skills/do-muse
```

The rest of this README describes muse as it was when archived.

## Commands

| Command                 | Human result                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `/generate-web-diagram` | A styled HTML diagram for any topic                                        |
| `/generate-visual-plan` | An interactive MDX implementation plan with review state and handoff files |
| `/generate-visual-recap` | A visual recap for a branch, commit, PR, or diff                          |
| `/generate-slides`      | A magazine-quality slide deck                                              |
| `/diff-review`          | A visual code-review page with architecture context                        |
| `/plan-review`          | A plan-vs-codebase review with risks and gaps                              |
| `/project-recap`        | A visual mental-model snapshot for returning to a project                  |
| `/fact-check`           | A code-grounded accuracy review for a document                             |
| `/share-page`           | A Vercel production URL for an HTML explainer page                         |

You rarely need the slash commands. On native-skill surfaces (Claude Code, Pi, OMP, Codex, and Empryo) the skill auto-invokes from natural language — ask for a "visual explainer", say "visualize this", "visualize a plan", "make it visual", or "explain this visually", and `do-muse` picks the right treatment on its own. The slash commands are explicit shortcuts on harnesses that support command templates.

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

The review bridge binds to loopback and exposes a trusted originless local API for CLI clients. Originless mutations are intentional, but they must use `Content-Type: application/json`. Browser mutations that send `Origin` must match the bridge's exact loopback origin; foreign origins and opaque `Origin: null` requests are rejected. This is not a strict same-origin policy because trusted originless local clients remain supported by design.

Review mutations and approval publication are atomic against concurrent live `muse` processes: an OS-backed file lock serializes writers, and one pointer replacement publishes a complete state/handoff generation. This is a live-process atomicity guarantee, not crash durability. `muse` does not `fsync` files or directories, so power loss or an OS crash may still lose the latest filesystem writes; the next operation revalidates the surviving generation before using it.

## Component library fixture

Use the checked-in component explorer when you want to inspect the whole component system, filter by purpose, and copy a working MDX example:

```bash
vp run component-explorer:render
vp run component-explorer:serve
```

It covers:

- overview components: `PlanSummary`, `StatusDashboard`,
- planning and diagram components: `DecisionMatrix`, `ArchitectureDiagram`, `ImplementationTimeline`, `RiskRegister`,
- evidence components: `FileMap`, `FileTree`, `AnnotatedCode`, `DiffTabs`, `Tabs`,
- contract components: `ApiSurface`, `DataModel`, `Table`,
- product components: `Wireframe`, `BeforeAfter`, `StateGallery`,
- review controls: `Callout`, `QuestionForm`, `Checklist`, `ApprovalGate`, `CommentAnchor`.

## Development stack

muse uses **Vite+ as the project toolchain** with **Bun as the underlying package manager**.

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
plugins/Muse/
├── DESIGN.md                           shipped default visual tokens
├── .claude-plugin/                     plugin manifest
├── commands/                           command prompts
└── skills/do-muse/
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
