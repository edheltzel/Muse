Use the canonical `Muse` skill from `plugins/Muse/`.

For Codex CLI, copy the skill to `~/.codex/skills/Muse`. If your Codex build supports prompt templates, you may also copy `plugins/Muse/commands/*.md` to `~/.codex/prompts/`.

Activate by asking Codex to use `$Muse` or the `Muse` skill before generating diagrams, visual explainers, diff reviews, plan reviews, slide decks, or complex tables — or whenever the user says "visualize this", "visualize a plan", "make it visual", "show me this visually", or "explain this visually". Generated pages go to `.agents/diagrams/`; opening the browser may depend on Codex sandbox permissions.

Command-template support varies by Codex version. If prompts are unavailable, read the relevant command file and follow the skill workflow manually. `/share-page` depends on the Pi-compatible `vercel-deploy` script and may not work unless that dependency exists in a compatible location.
