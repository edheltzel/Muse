#!/bin/bash
# install-pi.sh - Install visual-explainer for Pi

set -e

SKILL_DIR="$HOME/.pi/agent/skills/VisualExplainer"
PROMPTS_DIR="$HOME/.pi/agent/prompts"

if [ ! -f "plugins/VisualExplainer/skills/visual-explainer/SKILL.md" ]; then
  echo "Cloning VisualExplainer..."
  TEMP_DIR=$(mktemp -d)
  git clone --depth 1 https://github.com/edheltzel/visual-explainer.git "$TEMP_DIR"
  cd "$TEMP_DIR"
  CLEANUP=true
else
  CLEANUP=false
fi

echo "Installing skill to $SKILL_DIR..."
rm -rf "$SKILL_DIR"
mkdir -p "$SKILL_DIR"
cp -r plugins/VisualExplainer/skills/visual-explainer/. "$SKILL_DIR/"
cp -r plugins/VisualExplainer/commands "$SKILL_DIR/commands"

echo "Installing prompts to $PROMPTS_DIR..."
mkdir -p "$PROMPTS_DIR"
cp plugins/VisualExplainer/commands/*.md "$PROMPTS_DIR/"

if [ "$CLEANUP" = true ]; then
  rm -rf "$TEMP_DIR"
fi

echo ""
echo "Done! Restart pi to use VisualExplainer."
echo ""
echo "Commands available:"
echo "  /diff-review, /plan-review, /project-recap, /fact-check"
echo "  /generate-web-diagram, /generate-slides, /generate-visual-plan"
echo "  /visual-recap, /share-page"
