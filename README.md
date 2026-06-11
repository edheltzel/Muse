<p>
  <img src="banner.png" alt="VisualExplainer" width="1100">
</p>

# VisualExplainer

**An agent skill that turns complex terminal output into styled HTML pages you actually want to read.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

Ask your agent to explain a system architecture, review a diff, or compare requirements against a plan. Instead of ASCII art and box-drawing tables, it generates a self-contained HTML page and opens it in your browser.

```
> draw a diagram of our authentication flow
> /diff-review
> /plan-review ~/docs/refactor-plan.md
```

https://github.com/user-attachments/assets/55ebc81b-8732-40f6-a4b1-7c3781aa96ec

## Why

Every coding agent defaults to ASCII art when you ask for a diagram. Box-drawing characters, monospace alignment hacks, text arrows. It works for trivial cases, but anything beyond a 3-box flowchart turns into an unreadable mess.

Tables are worse. Ask the agent to compare 15 requirements against a plan and you get a wall of pipes and dashes that wraps and breaks in the terminal. The data is there but it's painful to read.

This skill fixes that. Real typography, dark/light themes, interactive Mermaid diagrams with zoom and pan. No build step, no dependencies beyond a browser.

## Install

| Harness | Support | Install path / behavior |
|---|---|---|
| Claude Code | Marketplace plugin | Preserved marketplace shape with source at `plugins/VisualExplainer/` |
| Pi | Package metadata plus installer | `package.json` advertises the skill and prompts; `install-pi.sh` installs to `~/.pi/agent/skills/VisualExplainer` and `~/.pi/agent/prompts/` |
| Codex CLI | Native skill path plus optional prompts | Copy to `~/.codex/skills/VisualExplainer`; optional prompts go in `~/.codex/prompts/` if your Codex build supports them |
| OpenCode/opencode | Observed skill/command paths | Copy to `~/.config/opencode/skill/VisualExplainer`; optional commands go in `~/.config/opencode/command/` |
| Cursor | Rules-based guidance | Add the supplied `.mdc` rule; Cursor is not treated as native Agent Skills support |
| OpenClaw | Lightweight AGENTS/rules guidance | Use the supplied AGENTS guidance with the canonical skill directory |

**Claude Code (marketplace):**
```shell
/plugin marketplace add edheltzel/VisualExplainer
/plugin install VisualExplainer@VisualExplainer-marketplace
```

Note: Claude Code plugins namespace commands as `/VisualExplainer:command-name`.

**Pi:**
```bash
pi install git:github.com/edheltzel/VisualExplainer
```

Or from a local checkout:
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

If you previously used the old curl/manual installer, remove those copied files before using `pi install`; otherwise Pi will report skill and prompt conflicts because the user-level copies shadow the package resources:

```bash
rm -rf ~/.pi/agent/skills/VisualExplainer
rm -f ~/.pi/agent/prompts/{diff-review,fact-check,generate-slides,generate-visual-plan,generate-web-diagram,plan-review,project-recap,share-page}.md
```

The legacy installer still works if you prefer copied files over package management:

```bash
curl -fsSL https://raw.githubusercontent.com/edheltzel/VisualExplainer/main/install-pi.sh | bash
```

**Codex CLI:**
```bash
git clone --depth 1 https://github.com/edheltzel/VisualExplainer.git /tmp/VisualExplainer

mkdir -p ~/.codex/skills ~/.codex/prompts
cp -R /tmp/VisualExplainer/plugins/VisualExplainer ~/.codex/skills/VisualExplainer

# Optional, only if your Codex build supports prompt templates:
cp /tmp/VisualExplainer/plugins/VisualExplainer/commands/*.md ~/.codex/prompts/

rm -rf /tmp/VisualExplainer
```

Invoke with `$VisualExplainer` or ask Codex to use the `VisualExplainer` skill. If prompts are installed and supported, use `/prompts:diff-review`, `/prompts:plan-review`, etc.

**OpenCode/opencode:**
```bash
git clone --depth 1 https://github.com/edheltzel/VisualExplainer.git /tmp/VisualExplainer

mkdir -p ~/.config/opencode/skill ~/.config/opencode/command
cp -R /tmp/VisualExplainer/plugins/VisualExplainer ~/.config/opencode/skill/VisualExplainer

# Optional command templates:
cp /tmp/VisualExplainer/plugins/VisualExplainer/commands/*.md ~/.config/opencode/command/

rm -rf /tmp/VisualExplainer
```

Activate it by asking OpenCode to use the `VisualExplainer` skill. Command-template behavior depends on the installed OpenCode/opencode build.

**Cursor:**

Add `configs/cursor/VisualExplainer.mdc` to your Cursor rules, or copy its contents into the project rules UI. This is rules-based guidance that points Cursor at the canonical skill; it does not claim native Agent Skills support.

**OpenClaw:**

Use `configs/openclaw/AGENTS.md` as lightweight project guidance and copy or reference `plugins/VisualExplainer/` as the canonical skill source. No native OpenClaw plugin adapter is included.

## Commands

| Command | What it does |
|---------|-------------|
| `/generate-web-diagram` | Generate an HTML diagram for any topic |
| `/generate-visual-plan` | Generate a visual implementation plan for a feature or extension |
| `/generate-slides` | Generate a magazine-quality slide deck |
| `/diff-review` | Visual diff review with architecture comparison and code review |
| `/plan-review` | Compare a plan against the codebase with risk assessment |
| `/project-recap` | Mental model snapshot for context-switching back to a project |
| `/fact-check` | Verify accuracy of a document against actual code |
| `/share-page` | Deploy an HTML page to Vercel and get a live URL |

The agent also kicks in automatically when it's about to dump a complex table in the terminal (4+ rows or 3+ columns) — it renders HTML instead.

## Slide Deck Mode

Any command that produces a scrollable page supports `--slides` to generate a slide deck instead:

```
/diff-review --slides
/project-recap --slides 2w
```

https://github.com/user-attachments/assets/342d3558-5fcf-4fb2-bc03-f0dd5b9e35dc

## How It Works

```
.claude-plugin/
├── plugin.json           ← marketplace identity
└── marketplace.json      ← plugin catalog
plugins/
└── VisualExplainer/
    ├── .claude-plugin/
    │   └── plugin.json   ← plugin manifest
    ├── SKILL.md           ← workflow + design principles
    ├── commands/          ← slash commands
    ├── references/        ← agent reads before generating
    │   ├── css-patterns.md   (layouts, animations, theming)
    │   ├── libraries.md      (Mermaid, Chart.js, fonts)
    │   ├── responsive-nav.md (sticky TOC for multi-section pages)
    │   └── slide-patterns.md (slide engine, transitions, presets)
    ├── templates/         ← reference templates with different palettes
    │   ├── architecture.html
    │   ├── mermaid-flowchart.html
    │   ├── data-table.html
    │   └── slide-deck.html
    └── scripts/
        └── share.sh       ← deploy HTML to Vercel for sharing
```

**Output:** `.agents/diagrams/filename.html` → opens in browser

The skill routes to the right approach automatically: Mermaid for flowcharts and diagrams, CSS Grid for architecture overviews, HTML tables for data, Chart.js for dashboards.

## Limitations

- Generated HTML is portable and self-contained, but auto-opening depends on the harness, browser access, and sandbox rules.
- All harnesses write visual output to `.agents/diagrams/` unless the user asks for a different path.
- Switching OS theme requires a page refresh for Mermaid SVGs.
- `/share-page` uses the skill's `share.sh`, which requires the Vercel CLI on PATH and a one-time `vercel login`. Each share creates its own Vercel project and deploys to **production** (`vercel deploy --prod`) so the shared URL is publicly viewable — generated preview/deployment URLs sit behind Vercel's SSO Deployment Protection. Other harnesses can still generate and open pages without the Vercel CLI.
- Results vary by model capability.

## Credits

Borrows ideas from [Anthropic's frontend-design skill](https://github.com/anthropics/skills) and [interface-design](https://github.com/Dammyjay93/interface-design).

## License

MIT
