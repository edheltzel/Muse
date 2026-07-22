#!/bin/bash
# install-pi.sh - Install muse through Pi's package manager.

set -euo pipefail

if ! command -v pi >/dev/null 2>&1; then
  echo "error: pi is required; install Pi before installing muse" >&2
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
AGENT_DIR=${PI_CODING_AGENT_DIR:-"$HOME/.pi/agent"}

if [ -f "$SCRIPT_DIR/package.json" ]; then
  INSTALL_SOURCE=$SCRIPT_DIR
else
  INSTALL_SOURCE=git:github.com/edheltzel/Muse
fi

echo "Installing muse through Pi's package manager..."
pi install "$INSTALL_SOURCE"

LEGACY_SKILLS=(Muse VisualExplainer)
LEGACY_PROMPTS=(
  diff-review.md
  fact-check.md
  generate-slides.md
  generate-visual-plan.md
  generate-visual-recap.md
  generate-web-diagram.md
  plan-review.md
  project-recap.md
  share-page.md
)

HAS_LEGACY=false
for name in "${LEGACY_SKILLS[@]}"; do
  if [ -e "$AGENT_DIR/skills/$name" ]; then HAS_LEGACY=true; fi
done
for name in "${LEGACY_PROMPTS[@]}"; do
  if [ -e "$AGENT_DIR/prompts/$name" ]; then HAS_LEGACY=true; fi
done

if [ "$HAS_LEGACY" = true ]; then
  BACKUP_DIR="$AGENT_DIR/muse-legacy-backup-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$BACKUP_DIR/skills" "$BACKUP_DIR/prompts"
  for name in "${LEGACY_SKILLS[@]}"; do
    if [ -e "$AGENT_DIR/skills/$name" ]; then mv "$AGENT_DIR/skills/$name" "$BACKUP_DIR/skills/"; fi
  done
  for name in "${LEGACY_PROMPTS[@]}"; do
    if [ -e "$AGENT_DIR/prompts/$name" ]; then mv "$AGENT_DIR/prompts/$name" "$BACKUP_DIR/prompts/"; fi
  done
  echo "Quarantined legacy manual copies at $BACKUP_DIR"
fi

echo "Done. Start a fresh Pi session and ask: Use muse to <task>."
