# Pi configuration

## Purpose

Define how Pi installs and uses the canonical `muse` skill from `plugins/Muse/`.

## Ownership

This file owns Pi-specific package installation, prompt invocation, legacy-copy compatibility, output location, and optional sharing dependencies.

## Local Contracts

- Prefer `pi install git:github.com/edheltzel/Muse` or install a local checkout with `pi install ./Muse`.
- Keep package metadata pointed at `./plugins/Muse` for the skill and `./plugins/Muse/commands` for prompts.
- `install-pi.sh` must delegate to `pi install`, remain idempotent, and quarantine the old `Muse` or `VisualExplainer` skill directories and copied prompt files instead of leaving them able to shadow the package.
- Use the shared request from `plugins/Muse/skills/muse/references/invocation.md`; that file is the only owner of host-native explicit syntax.
- Treat command templates as convenience prompts; the skill is the source of behavior.
- Write generated pages to `.agents/diagrams/` and open them in a browser when possible.
- Treat `/share-page` as dependent on a Pi-compatible `vercel-deploy` skill, normally installed with `pi install npm:vercel-deploy`.

## Work Guidance

Ask `Use muse to <task>` after starting a fresh Pi session. Pi should also reach for the skill on natural-language cues including "visualize this", "visualize a plan", "make it visual", "show me this visually", "explain this visually", and "a visual explainer".

## Verification

## Child DOX Index
