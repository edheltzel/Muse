---
description: Deploy a generated VisualExplainer HTML page and return a live Vercel URL
---

# Share Visual Explainer Page

Share a visual explainer HTML file via Vercel. Returns a live URL deployed under your Vercel account using the Vercel CLI.

## Usage

```
/share-page <file-path>
```

**Arguments:**

- `file-path` - Path to the HTML file to share (required)

**Examples:**

```
/share-page .agents/diagrams/my-diagram.html
/share-page /tmp/VisualExplainer-output.html
```

## How It Works

1. Copies your HTML file to a temp directory as `index.html`
2. Runs `vercel deploy --yes` from that directory
3. Returns the live preview URL

## Requirements

- **Vercel CLI** — install with `npm i -g vercel` (or `bun add -g vercel`)
- **Authenticated session** — run `vercel login` once

Deployments land in your own Vercel account, so no claim step is needed.

## Script Location

Resolve the script from the installed skill directory, then run it with the HTML file path:

```bash
bash ~/.claude/plugins/cache/VisualExplainer-marketplace/VisualExplainer/<version>/scripts/share.sh <file>
```

Common alternatives include `~/.codex/skills/VisualExplainer/scripts/share.sh`, `~/.config/opencode/skill/VisualExplainer/scripts/share.sh`, or `./plugins/VisualExplainer/scripts/share.sh` from a repository checkout.

## Output

```
Sharing my-diagram.html via Vercel...

✓ Shared successfully!

Live URL:  https://visualexplainer-abc123.vercel.app
```

The script also outputs JSON for programmatic use:

```json
{ "previewUrl": "https://..." }
```

## Notes

- Deployments are **public** — anyone with the URL can view
- Each share creates a new deployment with a unique URL
- Deployments live under your Vercel account; manage retention via the Vercel dashboard
