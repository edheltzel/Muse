# Work Order: Rename plugin identity to Muse / muse (v0.9.0)

Issued by: Themis (pane wG:pT)
Date: 2026-07-04
Status: ACCEPTED by Themis 2026-07-04 — commits `49389b1` (rename, 55 files) + `39f5b7d` (round-2 RedTeam fixes) on `feat/muse-rename`, based on origin/main. Live OMP round-trip green (`muse@muse-marketplace` 0.9.0 discover/install/uninstall), gates 6/6 + build, RedTeam completeness + path-integrity findings triaged: rename-adjacent fixed; pre-existing shipped-doc defects deferred to follow-up ticket (phantom `vercel-deploy` dep in all configs, `websocket-implementation-plan.html` ghost ref, `./commands/` dangling relative refs in SKILL.md, repo-relative runtime commands in generate-visual-plan.md, opencode `~/.pi/agent/skills/command/` path, pi cleanup list missing visual-recap.md, `visual-explainer.json` manifest rename question, `ve-ip-` CSS prefix).

LANDED TO DEV 2026-07-06:
- Banner: approved Muse banner converted to `banner.png` (1675×935 PNG) and committed to `feat/muse-rename` as `169d4dd` (pushed from main session after the sub-agent's auto-mode classifier deadlocked on relayed authorization).
- Branch flow (Ed: main = production/"master", new dev integration branch): created `dev` off `main` (`1c80d8f`); retargeted PR #3 base main→dev and merged it (merge commit `4a3fb11`); rename + banner now on `dev`.
- Release PR: **#4 `dev → main`** opened — https://github.com/edheltzel/VisualExplainer/pull/4 — MERGEABLE/CLEAN, awaiting Ed's merge.

Still pending: merge of release PR #4 (Ed's word); follow-up ticket filing (deferred pre-existing defect cluster).

## Ed's decisions (locked)

- GitHub repo slug **stays** `edheltzel/visual-explainer` — every repo URL, clone URL, `omp install github:…` / `/plugin marketplace add edheltzel/visual-explainer` ref, homepage/repository field is UNCHANGED.
- **Full rename** of in-repo identity: plugin, skill, marketplace, package, directories, command namespaces, Pi activation.
- **Version bump to 0.9.0** (breaking rename) in every synced manifest + changelog entry.

## Casing map (mechanical, per-surface — "keep capitalization in place")

| Old | New |
|---|---|
| `VisualExplainer` (identity usages) | `Muse` |
| `visual-explainer` (identity usages) | `muse` |
| `$VisualExplainer` (Pi activation) | `$Muse` |
| `/visual-explainer:` command namespace | `/muse:` |
| `visual-explainer-marketplace` | `muse-marketplace` |

**NOT renamed:** descriptive prose where "visual explainer" is a common noun (e.g. the tagline "A visual explainer for agent work.", README sentences describing what the tool does), repo-slug URLs (`edheltzel/visual-explainer`, `github.com/edheltzel/visual-explainer`), historical CHANGELOG entries (0.7.x and older stay as written). When in doubt whether an occurrence is identity or prose, list it in NOTES instead of guessing.

## Mandatory process

1. `git fetch origin`, then `/ce-worktree` for a new branch (e.g. `feat/muse-rename`) and **hard-reset it to `origin/main`** before any work (EnterWorktree has based branches on stale commits before — verify `git log -1` matches `origin/main`).
2. Ground structure questions in `/codegraph`; follow `/karpathyguidelines`.
3. Use `git mv` for directory renames so history follows.

## Rename tasks

1. **Directories:** `plugins/VisualExplainer` → `plugins/Muse`; `plugins/Muse/skills/visual-explainer` → `plugins/Muse/skills/muse`.
2. **Manifests** (all to name muse / version 0.9.0): root `package.json` (`name: "muse"`, keep repo URLs; update `pi.skills`/`pi.prompts` paths and `files` array to `plugins/Muse`), `plugins/Muse/plugin.json`, `plugins/Muse/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (marketplace `name: "muse-marketplace"`, plugin name `muse`, `source: "./plugins/Muse"`, both versions).
3. **SKILL.md** (`plugins/Muse/skills/muse/SKILL.md`): frontmatter `name: Muse`, `version: "0.9.0"`; sweep body for `/visual-explainer:` → `/muse:`, `$VisualExplainer` → `$Muse`, path refs → new dirs. Fix the known stale line (old `./plugins/VisualExplainer/scripts/share.sh` around line 412 → real path under `skills/muse/scripts/`).
4. **Commands** (`plugins/Muse/commands/*.md`): namespaces, cache paths (`~/.claude/plugins/cache/muse-marketplace/muse/<version>/skills/muse/scripts/share.sh` in share-page.md), repo-relative fallbacks.
5. **README.md:** Claude Code section (`/plugin install muse@muse-marketplace`, `/muse:` commands, success-message name `muse`), OMP section (`omp install muse@muse-marketplace`, `--scope project` ref, marketplace add stays `edheltzel/visual-explainer` — repo slug), Pi/Codex/OpenCode sections (`$Muse`, clone paths — clone dir stays `visual-explainer` if cloning the repo slug; adjust `pi install` target paths accordingly), banner alt text/title if present.
6. **configs/**: pi, codex, opencode, openclaw, cursor — `$Muse`, corrected SKILL.md paths (fix the pre-existing openclaw/cursor path drift to the real `plugins/Muse/skills/muse/SKILL.md` while renaming).
7. **install-pi.sh**: install dir, success message, `$Muse`.
8. **Tests + build**: update any `plugins/VisualExplainer` paths in `tests/`, `vite.config.ts`, `tsconfig.json`, package scripts; fixtures under `tests/fixtures/` keep working.
9. **AGENTS.md**: OMP plugin contract (muse refs, guardrail file list with new paths), architecture map, component-library file list, any `visual-explainer` identity refs.
10. **CHANGELOG.md**: new `0.9.0` entry — breaking rename `visual-explainer` → `muse`, old `visual-explainer@…` and `/visual-explainer:` refs no longer resolve, repo slug unchanged.
11. **banner.png**: leave as-is — Themis delivers the regenerated Muse banner separately; you'll be told when to copy it in.

## Gates

```bash
vp install
vp run test
vp run visual-plan:build
rg -n "visual-explainer|VisualExplainer|\$VisualExplainer" --hidden -g '!.git' -g '!node_modules' .   # every remaining hit must be a repo-slug URL, prose, or historical changelog — list them all in NOTES
```

Do NOT run `omp` install/marketplace commands — Themis owns live validation. No push, no merge, no main-tree edits. Commit(s) on your branch.

## Deliverables

Report in the pane: `BRANCH:` / `WORKTREE:` / `FILES:` (grouped summary) / `GATES:` (verbatim) / `RESIDUAL:` (every remaining visual-explainer/VisualExplainer hit with its justification) / `NOTES:`. If blocked, print `BLOCKED: <question>` and wait.

## Round 2 — RedTeam findings (2026-07-04, rename-adjacent only)

Scope discipline: RedTeam also surfaced pre-existing shipped-doc defects (phantom `vercel-deploy` dependency in all configs, `websocket-implementation-plan.html` ghost ref, `./commands/` dangling relative refs, repo-relative runtime commands in generate-visual-plan.md, opencode `~/.pi/agent/skills/command/` path, pi cleanup list missing visual-recap.md). Those are NOT in this round — Themis is ticketing them separately. Fix ONLY the four below, in the worktree, commit on branch, re-run both gates.

1. `plugins/Muse/commands/share-page.md:56` — example output URL `https://visualexplainer-abc123.vercel.app` → match the muse- deploy prefix contract (align with SKILL.md's `https://muse-abc123.vercel.app` example).
2. `plugins/Muse/commands/share-page.md:5` — H1 `# Share Visual Explainer Page` → `# Share Muse Page` (rename-adjacent Title Case; line 7 prose stays).
3. Repo-slug normalization (worker NOTES offered it; Ed's canonical slug is lowercase): `README.md:111,176,188` clone URLs `github.com/edheltzel/VisualExplainer(.git)` → `github.com/edheltzel/visual-explainer(.git)`, and `configs/pi/AGENTS.md:3` `pi install git:github.com/edheltzel/VisualExplainer` → lowercase slug. Where a clone-dir name flows from the URL (e.g. `/tmp/VisualExplainer`, `cd`/`pi install ./…` targets), update those path refs in the same blocks so each instruction sequence stays internally runnable.
4. Codex/OpenCode share.sh path contradiction: README installs copy the plugin root (`cp -R …/plugins/Muse ~/.codex/skills/Muse`), so the script really lands at `~/.codex/skills/Muse/skills/muse/scripts/share.sh` (and the opencode equivalent). Fix `SKILL.md:412` and `commands/share-page.md:47` to the actual nested paths — verify against README's literal cp commands before writing; do not restructure the install docs themselves.
