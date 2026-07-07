---
description: Deploy a generated Muse HTML page and return a live Vercel URL
---

# Share Muse Page

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
/share-page /tmp/Muse-output.html
```

## How It Works

1. Copies your HTML file to a uniquely-named temp directory as `index.html`
2. Runs `vercel deploy --prod --yes` from that directory — each share gets its own Vercel project
3. Resolves the project's public production URL (verified with an anonymous request) and returns it

## Requirements

- **Vercel CLI** — install with `npm i -g vercel` (or `bun add -g vercel`)
- **Authenticated session** — run `vercel login` once

Deployments land in your own Vercel account, so no claim step is needed.

## Script Location

Resolve the script from the installed skill directory, then run it with the HTML file path:

```bash
bash ~/.claude/plugins/cache/muse-marketplace/muse/<version>/skills/muse/scripts/share.sh <file>
```

Common alternatives include `~/.codex/skills/Muse/skills/muse/scripts/share.sh`, or `./plugins/Muse/skills/muse/scripts/share.sh` from a repository checkout.

## Output

```
Sharing my-diagram.html via Vercel...

✓ Shared successfully!

Live URL:  https://muse-abc123.vercel.app
```

The script also outputs JSON for programmatic use:

```json
{ "productionUrl": "https://..." }
```

## Notes

- Shared URLs are **public** — anyone with the URL can view. The script deploys to **production** and returns the project's production domain; every other generated deployment URL (including previews) sits behind Vercel Deployment Protection (SSO) and returns 401 for anonymous visitors
- Each share creates its own Vercel project, so every shared URL stays live independently of later shares
- Projects and deployments live under your Vercel account; manage retention via the Vercel dashboard
