# OMP Plugin Plan

Owner: Themis
Date: 2026-07-03
Status: LANDED — remediation merged to `main` via PR #2 (merge commit `1c80d8f`, merged by edheltzel 2026-07-03); follow-ups tracked in `.agents/atlas/plans/2026-07-03-omp-plugin-fix-workorder.md`

## Goal

Make Lyre / VisualExplainer an official OMP-compatible plugin and correct the README installation path for OMP using the official OMP plugin, extension-authoring, and marketplace contracts.

## Grounded inputs

- Project rules: `AGENTS.md`
- Global context: `/Users/ed/.claude/CLAUDE.md`
- OMP docs recovered from the deployed docs bundle:
  - `https://omp.sh/docs/plugins`
  - `https://omp.sh/docs/extension-authoring`
  - `https://omp.sh/docs/marketplace`
- Codegraph availability:
  - MCP `codegraph_explore`: available
  - CLI `codegraph`: available
  - `semble`: not on PATH in this session
- Herdr availability:
  - `HERDR_ENV=1`
  - `herdr` binary present

## OMP facts that govern the implementation

- OMP plugins install with commands such as `omp install <source>`, `omp remove <name>`, `omp update [name]`, and `omp list`.
- Project-scoped installs use `-l` or `--scope project` and write under the repo `.omp/plugins/` state; project installs shadow user installs.
- Plugin sources include npm packages, Git repos, local paths, and marketplace `name@marketplace` entries.
- A plugin root mirrors OMP extension directories:
  - `plugin.json`
  - `skills/<name>/SKILL.md`
  - `commands/<name>.md`
  - `hooks/pre/*.ts`
  - `hooks/post/*.ts`
  - `tools/<name>/index.ts`
  - `mcp.json`
  - `themes/<name>.json`
  - `README.md`
- OMP marketplaces are Claude-Code-compatible catalogs at `.claude-plugin/marketplace.json`.
- Marketplace install flow is:
  - `omp marketplace add <source>`
  - `omp install <plugin>@<marketplace>`
- Marketplace catalog entries need at least plugin `name` and `source`; optional fields include `description`, `version`, `author`, `homepage`, `category`, and `tags`.
- `omp -p '/extensions'` verifies loaded surfaces.

## Work phases

### Phase 1 — Discovery

Explorer output needed before implementation:

1. Map the existing repo layout against the official OMP plugin root contract.
2. Identify whether existing `plugins/VisualExplainer/` already satisfies OMP plugin shape or needs an OMP-specific wrapper/package.
3. Identify every file that must change for install docs to stop claiming Pi package metadata is the OMP install path.
4. Identify the exact marketplace catalog path and source entry needed for this repo.

Discovery findings:

- Existing repo package metadata is root `package.json` version `0.8.0`.
- Root `package.json` ships `plugins/VisualExplainer`, `.claude-plugin`, `configs`, `README.md`, `AGENTS.md`, docs assets, changelog, and license.
- Existing Pi package metadata points `pi.skills` to `./plugins/VisualExplainer` and `pi.prompts` to `./plugins/VisualExplainer/commands`.
- Existing Claude plugin metadata exists at `plugins/VisualExplainer/.claude-plugin/plugin.json`, not at the OMP plugin root.
- There is no `plugins/VisualExplainer/plugin.json`; this is the primary OMP plugin-shape gap.
- Existing marketplace catalog exists at `.claude-plugin/marketplace.json`, but it is stale at version `0.7.2` while root package and skill metadata are `0.8.0`.
- Existing marketplace catalog source is local (`./plugins/VisualExplainer`), useful for repo-local marketplace testing, but release docs need source guidance for the GitHub/catalog path.
- README OMP section currently says OMP uses Pi-compatible package metadata and instructs `pi install git:github.com/edheltzel/VisualExplainer`; that is inaccurate for OMP.
- Root `AGENTS.md` has no OMP section; future agents can repeat the README mistake unless the operational guide names the OMP install contract.
- `configs/pi/AGENTS.md` is Pi-specific and should remain Pi-specific unless a shared config doc is introduced.

### Phase 2 — Implementation

Worker output expected after discovery:

1. Add or adjust OMP plugin package files so OMP can install the plugin officially.
2. Add marketplace catalog metadata if missing.
3. Update README install docs:
   - Claude Code marketplace install remains separate.
   - Pi install remains `pi install`.
   - OMP install uses official OMP plugin commands, not Pi commands.
4. Update nearest/affected agent docs so future workers do not repeat the wrong OMP guidance.

### Phase 3 — Validation

Validation gates:

1. Run repo gates from `AGENTS.md`:
   - `vp run test`
   - `vp run visual-plan:build`
2. Validate docs commands against OMP docs:
   - install from local path
   - marketplace add/install shape
   - `omp -p '/extensions'` verification path
3. RedTeam pass:
   - one adversarial validation pass against plugin shape
   - one adversarial validation pass against README install accuracy
   - one adversarial validation pass against docs/package drift

## Completed changes

- Added OMP root metadata: `plugins/VisualExplainer/plugin.json`.
- Updated `.claude-plugin/marketplace.json` from `0.7.2` to `0.8.0` and added current marketplace fields.
- Replaced README's OMP section with official `omp install`, project-scope, marketplace, and `/extensions` verification commands.
- Added root `AGENTS.md` OMP guidance so future workers do not document OMP installs with `pi install`.
- Added nested Claude plugin metadata to the version-sync guardrail after RedTeam found that drift risk.

## Verification

- `vp run test` — 6 pass, 0 fail, 90 expectations.
- `vp run visual-plan:build` — Vite build succeeded.
- Worktree metadata invariant check passed:
  - root package, OMP plugin manifest, nested Claude plugin manifest, marketplace metadata, and marketplace plugin are all `0.8.0`;
  - package ships `plugins/VisualExplainer`;
  - marketplace source points at `./plugins/VisualExplainer`;
  - README OMP section contains no `pi install`;
  - README OMP section includes `omp -p '/extensions'`;
  - `AGENTS.md` names the nested plugin metadata in the version-sync guardrail.
- RedTeam validation:
  - README OMP docs passed.
  - Metadata drift finding was valid and fixed in `AGENTS.md`.
  - Plugin shape finding confirmed the manifest exists on disk; remaining objection was staging-only, and no commit/stage was requested.
- Cleanup: removed generated `dist/`; confirmed `dist` and `bun.lockb` absent, `bun.lock` retained.

## Themis validation — 2026-07-03 (fresh session, OMP 16.3.4)

The prior verification never executed a real `omp install`. Live testing against `omp` v16.3.4 found the marketplace path **broken** and the documented commands **wrong**:

1. **FATAL — plugin invisible to OMP.** OMP validates catalog plugin names against `^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$` (lowercase only; `zK`/`qE6` in `@oh-my-pi/pi-coding-agent/dist/cli.js`) and **silently drops** non-conforming entries. `"name": "VisualExplainer"` in `.claude-plugin/marketplace.json` fails this, so `omp plugin discover` reports "No plugins available" and `omp install VisualExplainer@visual-explainer-marketplace` fails with "Plugin not found in marketplace".
   - Proof of fix: a scratchpad copy of the catalog with `"name": "visual-explainer"` was added, discovered, **really installed** (`✔ Installed visual-explainer from ve-test-marketplace (0.8.0)`), confirmed loaded via `omp -p '/extensions'`, then uninstalled. The plugin directory shape (`plugin.json` + `commands/` + `skills/`) is valid as-is.
2. **DOC BUG — wrong marketplace command.** `omp marketplace add …` (README + AGENTS.md) is not a command in 16.3.4; OMP treats it as a chat message. Correct: `omp plugin marketplace add <source>`. Local sources need `./`-prefix or absolute path (`.` alone is rejected; `./.` accepted).
3. **DOC BUG — install ref case.** After the rename, install/uninstall refs must be lowercase: `omp install visual-explainer@visual-explainer-marketplace`. Note: `omp plugin uninstall visual-explainer` (bare name) reports success without removing a marketplace-scoped install; the full `name@marketplace` ref is required.
4. **DOC HAZARD — local path install.** `omp install ./plugins/VisualExplainer` fails ("package.json not found") because local-path installs are link-mode npm-style. What works locally: `omp install .` from repo root (consumes the root `package.json` `pi` manifest — verified via `--dry-run`), or the marketplace flow above.
5. **UNVERIFIED — `omp install github:edheltzel/visual-explainer`.** The `github:` prefix exists in OMP's source resolver, but the remote repo lacks the uncommitted 0.8.0 plugin files; verify after push.

### Fix work order (pending Ed's dispatch decision)

- Rename plugin `name` to `visual-explainer` in `.claude-plugin/marketplace.json`, `plugins/VisualExplainer/plugin.json`, and `plugins/VisualExplainer/.claude-plugin/plugin.json` (verify Claude Code kebab-case naming rules; directory name `VisualExplainer` may stay — catalog `source` references the path, not the name).
- Correct README OMP section and AGENTS.md "OMP plugin contract" commands per findings 2–4.
- Re-run gates (`vp run test`, `vp run visual-plan:build`), then Themis re-runs the live install round-trip and a RedTeam pass before accepting done.
