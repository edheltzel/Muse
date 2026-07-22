# Codex configuration

## Purpose

Define how Codex discovers and uses the canonical `muse` skill from `plugins/Muse/`.

## Ownership

This file owns Codex-specific installation, discovery, invocation, output location, and browser constraints.

## Local Contracts

- Install the skill under `~/.agents/skills/muse`; Codex scans that user-level Agent Skills directory and follows symlinked skill folders.
- Keep the native plugin manifest at `plugins/Muse/.codex-plugin/plugin.json` and the Codex marketplace at `.agents/plugins/marketplace.json`.
- Treat command markdown under `plugins/Muse/commands/` as workflow reference material, not a Codex prompt-install contract.
- Use the shared request from `plugins/Muse/skills/muse/references/invocation.md`; that file is the only owner of host-native explicit syntax.
- Write generated pages to `.agents/diagrams/`; opening the browser may depend on sandbox permissions.
- Treat `/share-page` as dependent on a compatible `vercel-deploy` script in a compatible location.

## Work Guidance

Ask `Use muse to <task>`. Codex may also select `muse` for a natural-language request for a diagram, visual explainer, diff review, plan review, slide deck, or complex table.

## Verification

## Child DOX Index
