# DOX procedure

The DOX **Core Contract** and **Child DOX Index** live in [`../AGENTS.md`](../AGENTS.md) under *DOX framework*. This page holds the procedure for Muse. Read it before editing any file in this repository. Do not rely on memory; re-read the applicable DOX chain in the current session before editing.

## Read Before Editing

1. Read the root `AGENTS.md`.
2. Identify every file or folder you expect to touch.
3. Walk from the repository root to each target path.
4. Read every `AGENTS.md` found along each route.
5. When a parent `AGENTS.md` lists a child whose scope contains the path, read that child and continue from there.
6. Use the nearest `AGENTS.md` as the local contract and parent docs for repository-wide rules.
7. When docs conflict, the closer doc controls local work details, but no child doc may weaken DOX.

Muse currently has child contracts for `configs/openclaw/`, `configs/codex/`, and `configs/pi/`. Work elsewhere remains owned by the root contract until an indexed child contract exists.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning `AGENTS.md` when a change affects:

- purpose, scope, ownership, or responsibilities;
- durable structure, contracts, workflows, or operating rules;
- required inputs, outputs, permissions, constraints, side effects, or artifacts;
- captain preferences about behavior, communication, process, organization, or quality; or
- `AGENTS.md` creation, deletion, move, rename, or index contents.

Update parent docs when parent-level structure, ownership, workflow, or a child index changes. Update child docs when parent changes alter local rules. Delete stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root `AGENTS.md` is Muse's DOX rail: repository-wide instructions, packaging invariants, interactive-plan contracts, verification rules, and the top-level Child DOX Index.
- Child `AGENTS.md` files own harness-specific configuration instructions and their own Child DOX Index.
- Each parent explains what its direct children cover and retains ownership of everything else in its subtree.
- The closer a doc is to the work, the more specific and practical it must be.

## Child Doc Shape

- Create a child `AGENTS.md` when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards.
- Work Guidance must reflect current Muse standards or explicit captain instructions. Leave it empty when no specific guidance exists.
- Verification must name an existing check. Leave it empty when no verification framework exists.

Default section order:

- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational.
- Document stable contracts, not diary entries.
- Put broad Muse rules in the root and harness-specific details in the applicable config child.
- Prefer direct bullets with explicit paths and command names.
- Do not duplicate rules across many files unless each scope needs a local version.
- Delete stale notes instead of explaining history.
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist.

## Closeout

1. Re-check every changed path against its DOX chain.
2. Update nearest owning docs and any affected parents or children.
3. Refresh every affected Child DOX Index.
4. Delete stale or contradictory text.
5. Run existing verification when relevant.
6. Report any owning docs intentionally left unchanged and why.
