#!/bin/bash
# install-pi.sh - Install muse for Pi

set -e

SKILL_DIR="$HOME/.pi/agent/skills/Muse"
PROMPTS_DIR="$HOME/.pi/agent/prompts"

if [ ! -f "plugins/Muse/skills/muse/SKILL.md" ]; then
  echo "Cloning Muse..."
  TEMP_DIR=$(mktemp -d)
  git clone --depth 1 https://github.com/edheltzel/Muse.git "$TEMP_DIR"
  cd "$TEMP_DIR"
  CLEANUP=true
else
  CLEANUP=false
fi

echo "Installing skill to $SKILL_DIR..."
rm -rf "$SKILL_DIR"
mkdir -p "$SKILL_DIR"
cp -r plugins/Muse/skills/muse/. "$SKILL_DIR/"
cp -r plugins/Muse/commands "$SKILL_DIR/commands"

echo "Installing prompts to $PROMPTS_DIR..."
mkdir -p "$PROMPTS_DIR"
cp plugins/Muse/commands/*.md "$PROMPTS_DIR/"

if [ "$CLEANUP" = true ]; then
  rm -rf "$TEMP_DIR"
fi

echo ""
echo "Done! Restart pi to use Muse."
echo ""
echo "Commands available:"
echo "  /diff-review, /plan-review, /project-recap, /fact-check"
echo "  /generate-web-diagram, /generate-slides, /generate-visual-plan"
echo "  /visual-recap, /share-page"
