#!/usr/bin/env bash
# Create a new draft.
# Usage: npm run new -- "My Post Title"
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: npm run new -- \"My Post Title\""
  exit 1
fi

title="$1"

# Slugify: lowercase, replace non-alphanumeric with hyphens, collapse and trim
slug=$(echo "$title" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9]/-/g' \
  | sed 's/--*/-/g' \
  | sed 's/^-//;s/-$//')

file="_drafts/${slug}.md"

if [ -f "$file" ]; then
  echo "Draft already exists: $file"
  exit 1
fi

cat > "$file" <<FRONTMATTER
---
layout: post
title: "$title"
author: paul-hobson
categories: []
tags: []
excerpt: ""
---

Write your post here.
FRONTMATTER

echo "Created: $file"
