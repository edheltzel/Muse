# Work Order: Fix OMP plugin metadata + install docs

Issued by: Themis (pane wG:pT)
Date: 2026-07-03
Status: ACCEPTED by Themis 2026-07-03 — 3 commits on `worktree-fix-omp-plugin-install` (`a21640f`, `7f58211`, `e6814fc`). Round 1 fixed the lowercase rename + command syntax; validation caught a second defect (`metadata.pluginRoot` doubled the source path — removed); Round 2 fixed all RedTeam findings (dead `/VisualExplainer:` namespaces, nonexistent `-l` flag, `github:` not valid for marketplace add, share-page cache paths, guardrail gap, changelog entry). Independently verified: stale-pattern sweep clean, live OMP round-trip green at tip (add → install → list → uninstall, state restored), tests 6/6.

LANDED: Ed pushed the branch and merged **PR #2** into `main` (merge commit `1c80d8f`, 2026-07-03T22:24Z). Worker agent and herdr tab closed 2026-07-04.

Remaining follow-ups:
1. Main-tree cleanup — the uncommitted WIP (marketplace.json, AGENTS.md, README.md, banner.png, untracked plugins/VisualExplainer/plugin.json) is superseded by merged main; discard + pull is pending Ed's word (destructive). The worktree `.claude/worktrees/fix-omp-plugin-install` and local branch can also be removed.
2. Live verification of `omp install github:edheltzel/visual-explainer` — now possible post-merge; blocked this session by permission policy (remote-code install beyond requested scope).
3. Follow-up ticket for the item-6 BLOCKED cluster — SKILL.md frontmatter `name: VisualExplainer` is load-bearing for Pi (`$VisualExplainer` activation refs in configs/pi, configs/codex, README Pi/Codex sections, install-pi.sh), plus SKILL.md:412 stale share.sh path and configs/openclaw + configs/cursor SKILL.md path drift.
Parent plan: `.agents/atlas/plans/2026-07-03-omp-plugin-plan.md` (read its "Themis validation — 2026-07-03" section first — it contains the grounded findings and proof)

## Context

The OMP plugin work (v0.8.0) exists only as **uncommitted changes** in the main tree at `/Users/ed/Developer/atlasVisualExplainer`. Themis live-tested it against `omp` v16.3.4 and falsified the completion claim. Your job: port that WIP into an isolated worktree, apply the fixes below, pass the gates, and commit on your branch. Themis re-validates the live OMP install afterward — do not run `omp plugin marketplace add` / `omp install` yourself (it mutates Ed's user-level OMP state).

## Mandatory process

1. Start with `/ce-worktree` (new branch from HEAD, e.g. `fix/omp-plugin-install`).
2. Port the main tree's uncommitted WIP into your worktree (the WIP is NOT in HEAD):

   ```bash
   git -C /Users/ed/Developer/atlasVisualExplainer diff --binary -- . ':(exclude).codegraph' > /tmp/omp-wip.patch
   git apply --3way /tmp/omp-wip.patch        # run inside your worktree
   cp /Users/ed/Developer/atlasVisualExplainer/plugins/VisualExplainer/plugin.json plugins/VisualExplainer/plugin.json
   ```

   Do NOT port `.codegraph/` or `.agents/`. Do NOT edit anything in the main tree.
3. Ground every codebase question in `/codegraph` — never assume.
4. Follow `/karpathyguidelines` — surgical changes only; every changed line traces to this order.

## Fixes (grounded in Themis validation, OMP 16.3.4)

1. **Rename plugin to lowercase.** OMP drops catalog entries whose `name` fails `^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$`. Change `"name": "VisualExplainer"` → `"visual-explainer"` in:
   - `.claude-plugin/marketplace.json` (the `plugins[0].name`)
   - `plugins/VisualExplainer/plugin.json`
   - `plugins/VisualExplainer/.claude-plugin/plugin.json`
   Verify against Claude Code plugin naming rules (kebab-case) before finalizing; the directory stays `plugins/VisualExplainer` (catalog `source` points at the path, not the name).
2. **Fix marketplace command syntax** in `README.md` OMP section and `AGENTS.md` "OMP plugin contract": `omp marketplace add …` is not a command in omp 16.3.4 — correct form is `omp plugin marketplace add <source>`. Local sources need a `./` prefix or absolute path.
3. **Fix install refs** in both docs: `omp install VisualExplainer@visual-explainer-marketplace` → `omp install visual-explainer@visual-explainer-marketplace`. Uninstall docs (if any) must use the full `name@marketplace` ref.
4. **Fix local-path install guidance**: `omp install ./plugins/VisualExplainer` fails (link-mode wants `package.json`). Working local flows: `omp install .` from repo root (uses the root `package.json` `pi` manifest), or the marketplace flow. Update docs accordingly.
5. Keep the AGENTS.md version-sync guardrail accurate after renames (it must still name every file carrying the version/name).

## Gates (run before claiming done)

```bash
vp install   # if needed in the fresh worktree
vp run test
vp run visual-plan:build
```

## Deliverables

- Commits on your worktree branch (no push, no merge, no main-tree edits).
- Final report in your pane, in this exact shape:
  - `BRANCH:` branch name
  - `WORKTREE:` absolute path
  - `FILES:` changed files with +/- counts
  - `GATES:` test + build results verbatim summary
  - `NOTES:` anything Themis must know
- If blocked, print `BLOCKED: <question>` and wait — Themis heartbeats your pane.

## Round 2 — RedTeam findings (2026-07-03, both validators returned FAIL)

All file:line refs are to the worktree. Verify each location before editing; if a line number drifted, find the content. Same rules: worktree only, commit on branch, no push, no main-tree edits, gates after.

### Blockers

1. **README.md:80-84 — dead Claude Code namespace.** The five documented commands `/VisualExplainer:generate-web-diagram|generate-visual-plan|visual-recap|diff-review|plan-review` must become `/visual-explainer:…` — Claude Code namespaces commands by the plugin `name`, now `visual-explainer`.
2. **SKILL.md:19** (`plugins/VisualExplainer/skills/visual-explainer/SKILL.md`) — same dead namespace in shipped, machine-consumed instructions: `/VisualExplainer:diff-review` → `/visual-explainer:diff-review`. Sweep the whole file for other `/VisualExplainer:` occurrences.
3. **commands/share-page.md:44,46 — wrong share-script paths.** Line 44's cache path `~/.claude/plugins/cache/VisualExplainer-marketplace/VisualExplainer/<version>/scripts/share.sh` is doubly wrong: marketplace/plugin are now `visual-explainer-marketplace`/`visual-explainer`, and the script does not live at `<root>/scripts/` — locate the real path of `share.sh` inside the plugin (expected `skills/visual-explainer/scripts/share.sh`; confirm with codegraph/ls, never assume) and correct both the cache path and line 46's repo-relative fallback.
4. **README.md:132-135 + AGENTS.md:43 — nonexistent `-l` install flag.** `omp install -l …` is a hard parse error (`Unknown option '-l'`) in omp 16.3.4, and `--scope project` is warned-and-ignored for git sources — there is NO project-scoped git install. Fix: drop the `-l` git example; document project scope only for marketplace installs: `omp install --scope project visual-explainer@visual-explainer-marketplace`.
5. **README.md:149 + AGENTS.md:44 — `github:` not accepted by marketplace add.** The classifier accepts only https/ssh URLs, bare `owner/repo`, `./`, `~/`, or absolute paths. Fix: `omp plugin marketplace add edheltzel/visual-explainer`.

### Minors (fix in same round)

6. SKILL.md frontmatter `name: VisualExplainer` → `visual-explainer` (Agent Skills spec requires lowercase). Before changing, rg the repo (install-pi.sh, configs/, root package.json `pi` block) for anything resolving the skill by that frontmatter name; if something does, report BLOCKED instead of changing.
7. README.md:75 — the success message will say `visual-explainer`, not `VisualExplainer`; align the text.
8. README.md:71 — `/plugin marketplace add edheltzel/VisualExplainer` → lowercase `edheltzel/visual-explainer` (canonical slug).
9. README + AGENTS.md `omp -p '/extensions'` — `/extensions` is a TUI-only command; in `-p` mode the model improvises. Replace with the deterministic `omp plugin list` (a TUI note may stay as an aside).
10. AGENTS.md guardrail — extend the version/name sync list with the name-carrying doc surfaces that drifted: README Claude Code command examples, SKILL.md command namespaces, commands/share-page.md cache path.
11. CHANGELOG.md 0.8.0 section — add a line documenting the plugin rename to `visual-explainer` and the corrected OMP install commands (breaking for anyone using old refs).

### Explicitly out of scope (do NOT touch)

- Pi-surface refs (README Pi/Codex/OpenCode sections, configs/pi/) — internally consistent.
- configs/openclaw + configs/cursor SKILL.md path drift — pre-existing, separate ticket.
- Historical CHANGELOG entries.
