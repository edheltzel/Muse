Use the canonical `VisualExplainer` skill from `plugins/VisualExplainer/`.

For OpenCode/opencode, the observed native skill path is `~/.config/opencode/skill/VisualExplainer`. Optional command templates may be copied to `~/.config/opencode/command/` if your build supports them.

For Pi/pi, the observed native skill path is `~/.pi/agent/skills/VisualExplainer`. Optional command templates may be copied to `~/.pi/agent/skills/command/` if your build supports them.

Activate by asking OpenCode to use the `VisualExplainer` skill for diagrams, architecture overviews, visual reviews, slide decks, and complex tables. Generated pages go to `.agents/diagrams/`; browser auto-open behavior depends on the harness and sandbox.

Command-template behavior is build-dependent. The canonical skill docs and command markdown remain under `plugins/VisualExplainer/`. `/share-page` requires a Pi-compatible `vercel-deploy` script, so sharing may need separate setup outside OpenCode/opencode.
