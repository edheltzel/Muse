# Empryo configuration

## Purpose

Define how Empryo discovers and uses the canonical `do-muse` skill from `plugins/Muse/`.

## Ownership

This file owns Empryo-specific installation, discovery, output location, and the boundary between generated HTML pages and Empryo's native `show` tool.

## Local Contracts

- Install `do-muse` through GAP: `gap add edheltzel/Muse`. The root `gap-utility.toml` lists the skill, and GAP copies it into `~/.agents/skills/do-muse` and `~/.claude/skills/do-muse`. Empryo reads `~/.agents/skills`, so a `gap sync` makes the skill available in every project.
- Do not also copy the skill into `~/.empryo/skills`. Empryo loads that folder first, and GAP warns when a copy there differs from the managed one.
- Empryo has no plugin or slash-command surface. The files under `plugins/Muse/commands/` are workflow reference material; read the matching file and follow it.
- Use the shared request from `plugins/Muse/skills/do-muse/references/invocation.md`; that file is the only owner of host-native explicit syntax.
- Write generated pages to `.agents/diagrams/` and report the file path. Opening a browser depends on the session's permissions.
- A small inline visual (one diagram, one table, a short comparison) belongs in Empryo's native `show` tool. Use `do-muse` when the result is a durable page, a deck, or a review with state, comments, approval, and agent handoff files.
- Detect an Empryo session by its tools or by an ancestor process at `~/.empryo/bin/empryo`. `~/.empryo` existing only means Empryo is installed.

## Work Guidance

Ask `Use do-muse to <task>`. Also reach for `do-muse` when the user says "visualize this", "visualize a plan", "make it visual", "show me this visually", or "explain this visually".

## Verification

## Child DOX Index
