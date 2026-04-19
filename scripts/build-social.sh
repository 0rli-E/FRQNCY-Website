#!/usr/bin/env bash
# Build FRQNCY Social (Astro) — writes static output to /social/ at repo root.
# Cloudflare Pages serves /social/* directly from those files.
#
# Usage:  bash scripts/build-social.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/social-src"
OUT="$ROOT/social"

cd "$SRC"

if [ ! -d node_modules ]; then
  echo "▶ installing social-src dependencies"
  npm install
fi

# Clear any stale vite cache that blocks rebuilds on this machine
if [ -d node_modules/.vite ]; then
  mv node_modules/.vite "node_modules/.vite.$(date +%s)" || true
fi

echo "▶ building static social app"
npm run build

echo ""
echo "✓ Social built into $OUT"
echo "  Next: commit changes in /social/ and push — Cloudflare Pages serves at /social/*"
