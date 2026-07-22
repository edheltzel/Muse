# OpenClaw configuration

## Purpose

Provide lightweight OpenClaw rules guidance for using the canonical `muse` skill from `plugins/Muse/`.

## Ownership

This file owns OpenClaw-specific skill discovery, command-template fallback, output location, and browser constraints. OpenClaw support is guidance, not a native plugin adapter.

## Local Contracts

- Point the agent at `plugins/Muse/skills/muse/SKILL.md` and follow that workflow for diagrams, visual explainers, visual reviews, slide decks, and complex tables.
- Write generated pages to `.agents/diagrams/` and open them in a browser when the environment allows it.
- When OpenClaw does not support command templates, read the matching file under `plugins/Muse/commands/` and execute its instructions manually.
- Use the shared request from `plugins/Muse/skills/muse/references/invocation.md`; that file is the only owner of host-native explicit syntax.
- Treat `/share-page` as available only when a Pi-compatible `vercel-deploy` script exists in the expected skill location. HTML generation does not require that dependency.

## Work Guidance

Ask `Use muse to <task>`. Also reach for `muse` when the user says "visualize this", "visualize a plan", "make it visual", "show me this visually", or "explain this visually".

## Verification

## Child DOX Index
