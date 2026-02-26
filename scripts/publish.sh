#!/usr/bin/env bash
# Publish a draft: move it from _drafts/ to _posts/ with today's date prefix.
# Usage: npm run publish -- my-post-slug.md
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: npm run publish -- <draft-filename.md>"
  echo ""
  echo "Available drafts:"
  ls _drafts/*.md 2>/dev/null | sed 's|_drafts/||' || echo "  (none)"
  exit 1
fi

src="_drafts/$1"

if [ ! -f "$src" ]; then
  echo "Draft not found: $src"
  echo ""
  echo "Available drafts:"
  ls _drafts/*.md 2>/dev/null | sed 's|_drafts/||' || echo "  (none)"
  exit 1
fi

date=$(date +%Y-%m-%d)
dest="_posts/${date}-$1"

mv "$src" "$dest"
echo "Published: $dest"
