#!/usr/bin/env bash
#
# install.sh — one-shot installer for the Claude Code social-platform setup
#
# Copies the new slash commands into .claude/commands/ and appends the
# NRG section to CLAUDE.md. Idempotent — re-running won't duplicate the
# CLAUDE.md section but will refresh the slash command files.
#
# Run from the FRQNCY WEBSITE repo root:
#
#   bash scripts/claude-code-social-setup/install.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ ! -f "$REPO_ROOT/CLAUDE.md" ]; then
  echo "ERROR: $REPO_ROOT does not look like the FRQNCY WEBSITE repo (no CLAUDE.md found)."
  exit 1
fi

# 1. Copy slash commands.
mkdir -p "$REPO_ROOT/.claude/commands"
echo "Installing slash commands to .claude/commands/ ..."
for cmd in social-state social-rebuild social-deploy social-smoke social-migration social-voice social-feature; do
  cp -f "$SCRIPT_DIR/commands/$cmd.md" "$REPO_ROOT/.claude/commands/$cmd.md"
  echo "  /$cmd"
done

# 2. Append NRG section to CLAUDE.md if it isn't already there.
CLAUDE_MD="$REPO_ROOT/CLAUDE.md"
MARKER="## NRG social platform (the social network at"

if grep -qF "$MARKER" "$CLAUDE_MD" 2>/dev/null; then
  echo "CLAUDE.md already contains the NRG section — skipping."
else
  echo "Appending NRG section to CLAUDE.md ..."
  # Extract only the NRG section content from the patch file (strip the
  # patch-file's own intro before the section heading).
  awk '/^## NRG social platform/{found=1} found{print}' "$SCRIPT_DIR/CLAUDE-MD-PATCH.md" > /tmp/nrg-section.md

  if grep -qF "## What's currently in motion" "$CLAUDE_MD"; then
    # Insert before "## What's currently in motion".
    awk '
      /^## What.s currently in motion/ && !inserted {
        while ((getline line < "/tmp/nrg-section.md") > 0) print line
        print ""
        inserted=1
      }
      { print }
    ' "$CLAUDE_MD" > "$CLAUDE_MD.tmp"
    mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
  else
    # Just append.
    echo "" >> "$CLAUDE_MD"
    cat /tmp/nrg-section.md >> "$CLAUDE_MD"
  fi
  rm -f /tmp/nrg-section.md
  echo "  CLAUDE.md updated."
fi

# 3. Settings.local.json — show the diff, don't auto-merge (JSON merge is risky).
echo ""
echo "------------------------------------------------------------"
echo "OPTIONAL: settings.local.json patch (manual merge — JSON is risky to auto-edit)"
echo "------------------------------------------------------------"
echo "Open .claude/settings.local.json and add these entries to permissions.allow"
echo "if they aren't already present:"
echo ""
cat "$SCRIPT_DIR/settings.local.json.patch"
echo ""
echo "------------------------------------------------------------"
echo ""
echo "Install complete. Try /social-state in Claude Code to verify."
