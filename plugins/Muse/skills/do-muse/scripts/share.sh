#!/bin/bash

# Share Visual Explainer HTML via Vercel CLI
# Usage: ./share.sh <html-file>
# Requires: vercel CLI on PATH, authenticated session (`vercel login`)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

HTML_FILE="${1}"

if [ -z "$HTML_FILE" ]; then
    echo -e "${RED}Error: Please provide an HTML file to share${NC}" >&2
    echo "Usage: $0 <html-file>" >&2
    exit 1
fi

if [ ! -f "$HTML_FILE" ]; then
    echo -e "${RED}Error: File not found: $HTML_FILE${NC}" >&2
    exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
    echo -e "${RED}Error: vercel CLI not found on PATH${NC}" >&2
    echo "Install: npm i -g vercel    (or: bun add -g vercel)" >&2
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}Error: curl not found on PATH${NC}" >&2
    exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
    echo -e "${RED}Error: not authenticated with Vercel${NC}" >&2
    echo "Run: vercel login" >&2
    exit 1
fi

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Unique subdir per share: Vercel derives the project name from it, and each
# share needs its own project so its public production URL is never
# overwritten by a later share.
DEPLOY_DIR="$TEMP_DIR/muse-$(date +%Y%m%d%H%M%S)-$$-$RANDOM"
mkdir -p "$DEPLOY_DIR"
cp "$HTML_FILE" "$DEPLOY_DIR/index.html"

echo -e "${CYAN}Sharing $(basename "$HTML_FILE") via Vercel...${NC}" >&2

# --prod: under Vercel's default Standard Protection, every generated
# deployment URL (preview AND production) is gated behind SSO — only the
# project's production domain is publicly accessible.
set +e
RESULT=$(cd "$DEPLOY_DIR" && vercel deploy --prod --yes 2>&1)
DEPLOY_EXIT=$?
set -e

if [ $DEPLOY_EXIT -ne 0 ]; then
    echo -e "${RED}Error: vercel deploy failed${NC}" >&2
    echo "$RESULT" >&2
    exit 1
fi

DEPLOY_URL=$(echo "$RESULT" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${RED}Error: could not parse deployment URL from vercel output${NC}" >&2
    echo "$RESULT" >&2
    exit 1
fi

# Resolve the public production domain: the generated deployment URL is
# SSO-gated, so pick the first candidate that answers an anonymous GET
# with HTTP 200.
INSPECT=$(vercel inspect "$DEPLOY_URL" 2>&1 || true)
CANDIDATES=$(echo "$INSPECT" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' || true)

PROD_URL=""
for url in $CANDIDATES $DEPLOY_URL; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$url" || echo 000)
    if [ "$STATUS" = "200" ]; then
        PROD_URL="$url"
        break
    fi
done

if [ -z "$PROD_URL" ]; then
    echo -e "${RED}Error: no publicly accessible URL found for the deployment${NC}" >&2
    echo "Check the project's Deployment Protection settings in the Vercel dashboard." >&2
    echo "$INSPECT" >&2
    exit 1
fi

echo "" >&2
echo -e "${GREEN}✓ Shared successfully!${NC}" >&2
echo "" >&2
echo -e "${GREEN}Live URL:  ${PROD_URL}${NC}" >&2
echo "" >&2

# JSON for programmatic callers
printf '{"productionUrl":"%s"}\n' "$PROD_URL"
