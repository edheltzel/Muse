Use the canonical `Muse` skill from `plugins/Muse/`.

For Codex CLI, install the skill under `~/.agents/skills/muse`; Codex scans that user-level Agent Skills directory and follows symlinked skill folders. The repository also ships a native plugin manifest at `plugins/Muse/.codex-plugin/plugin.json` and a Codex marketplace at `.agents/plugins/marketplace.json`.

Activate with `$Muse`, `/skills`, or a natural-language request for a diagram, visual explainer, diff review, plan review, slide deck, or complex table. Codex can implicitly select Muse for phrases such as "visualize this", "visualize a plan", "make it visual", "show me this visually", and "explain this visually". Generated pages go to `.agents/diagrams/`; opening the browser may depend on sandbox permissions.

The command markdown in `plugins/Muse/commands/` remains workflow reference material, not a Codex prompt-install contract. `/share-page` depends on a compatible `vercel-deploy` script and may not work unless that dependency exists in a compatible location.
