#!/usr/bin/env bash
# quarto-render.sh — render a .qmd essay to Jekyll-compatible Markdown
#
# Usage:
#   bash scripts/quarto-render.sh <essay-dir> <site-repo-root>
#
# Example:
#   bash scripts/quarto-render.sh \
#     essays/A1-what-is-a-spatial-model \
#     /path/to/waywardhouse.github.io
#
# After running:
#   1. Move essay.md to <site-repo>/_posts/ with the correct date prefix:
#        mv essays/A1-what-is-a-spatial-model/essay.md \
#           /path/to/waywardhouse.github.io/_posts/2026-02-26-what-is-a-spatial-model.md
#   2. Figures are already rsync'd to <site-repo>/assets/images/quarto/<slug>/
#   3. Figure paths inside the .md have been rewritten to /assets/images/quarto/<slug>/

set -euo pipefail

ESSAY_DIR="$1"
SITE_ROOT="$2"
ESSAY_SLUG=$(basename "$ESSAY_DIR")

echo "→ Rendering $ESSAY_SLUG …"
quarto render "$ESSAY_DIR/essay.qmd" --to jekyll-md

echo "→ Converting to notebook …"
quarto convert "$ESSAY_DIR/essay.qmd" --output "$ESSAY_DIR/notebook.ipynb"

echo "→ Rsyncing figures to site assets …"
mkdir -p "$SITE_ROOT/assets/images/quarto/$ESSAY_SLUG"
rsync -a "$ESSAY_DIR/figures/" "$SITE_ROOT/assets/images/quarto/$ESSAY_SLUG/"

echo "→ Rewriting figure paths in essay.md …"
sed -i '' "s|figures/|/assets/images/quarto/$ESSAY_SLUG/|g" "$ESSAY_DIR/essay.md"

echo ""
echo "Done. Move essay.md to _posts/ with the correct date prefix:"
echo "  mv $ESSAY_DIR/essay.md $SITE_ROOT/_posts/YYYY-MM-DD-${ESSAY_SLUG#*-}.md"
