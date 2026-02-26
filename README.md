# template-main

A Jekyll theme built for long-form computational publishing. Used as a shared git submodule across five independent GitHub Pages sites.

**Stack:** Jekyll · Tailwind CSS · Vite · Alpine.js · PostCSS

---

## Sites using this theme

| Site | Brand | Default mode |
|---|---|---|
| [loomcollective.github.io](https://loomcollective.github.io) | `loom` | dark |
| [pauldhobson.github.io](https://pauldhobson.github.io) | `paul` | light |
| [qshift.github.io](https://qshift.github.io) | `qshift` | dark |
| [waywardhouse.github.io](https://waywardhouse.github.io) | `wayward` | light |
| [subhaus95.github.io](https://subhaus95.github.io) | `subhaus` | dark |

---

## Features

**Content**
- Standard blog posts (`layout: post`) and long-form computational essays (`layout: essay`)
- Paginated post grid, tag/category archives, author profiles, post series
- Drafts workflow with `npm run new` / `npm run publish`

**Reader experience**
- Dark mode (Alpine.js toggle, `localStorage`, flash-prevention)
- Static full-text search (Pagefind, `⌘K` overlay)
- Syntax highlighting — GitHub Light / One Dark (auto dark mode)
- Reading progress bar and time estimate on essays
- Giscus comments (opt-in per post)
- RSS feed, sitemap, SEO tags
- Print/PDF layout

**Computational essays**
- Three-column layout: sticky TOC · content · sidenotes
- Scrollytelling (Scrollama) with per-step viz updates
- Sidenotes, endnotes/references, callouts
- KaTeX mathematics ($...$ and $$...$$)
- Pyodide interactive Python cells (in-browser, no install)
- Quarto (`.qmd`) → Jekyll Markdown rendering pipeline

**Visualisations** — all loaded from CDN, only on pages that need them
- KaTeX (math)
- Mermaid (flowcharts, sequence, Gantt)
- Apache ECharts (charts — bar, line, etc.)
- D3 v7 (selective ~120 KB import; built-in bar/line/force; extensible)
- Leaflet (interactive maps, no API key)
- Mapbox GL JS (full-featured maps, requires token)
- Ricker population dynamics model (interactive widget + scrolly variant)

**Multi-brand system**
- One compiled stylesheet; per-site identity via CSS custom property overrides
- Brand CSS files: `assets/css/brand-{name}.css` — typically 3–5 lines each
- Switchable at runtime via `data-brand` and `data-theme` attributes on `<html>`

---

## Using this theme (submodule)

Each site repo mounts `template-main` as a git submodule at `theme/`:

```bash
git submodule add https://github.com/subhaus95/template-main theme
git submodule update --init --recursive
```

Jekyll is pointed at the submodule via three keys in `_config.yml`:

```yaml
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins
```

### First-time setup (site repo)

```bash
cd theme && npm ci && cd ..
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/
bundle install
bundle exec jekyll serve --livereload
```

### Local dev (two terminals)

```bash
# Terminal 1 — Vite (from inside theme/)
cd theme && npm run dev

# Terminal 2 — Jekyll (from site repo root)
bundle exec jekyll serve --livereload
```

Site available at `http://localhost:4000`.

### Production build

```bash
(cd theme && npm run build)
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/
bundle exec jekyll build
npx pagefind --site _site
```

### Updating the template

```bash
# From inside the site repo:
git submodule update --remote
git add theme
git commit -m "Update theme"
git push
```

> **Never edit files inside `theme/`** from within a site repo — changes are not committed to `template-main`. Edit in the `template-main` repo directly, push, then update the submodule pointer in each site.

---

## Working in template-main directly

```bash
npm run dev            # Vite watch (useful only when mounted as theme/ in a site repo)
npm run build          # Vite production build
npm run build-for-site # build + rsync CSS/JS to ../assets/ (when mounted as theme/)
npm run new            # Create a new draft (prompts for title)
npm run publish        # Publish a draft to _posts/ with today's date
npm run preview        # Jekyll serve --drafts
npm run search         # Run Pagefind indexer after a full build
```

---

## Directory layout

```
template-main/
├── _layouts/               All layouts — default, home, post, essay, topic, tag, …
├── _includes/              All includes — head, header, footer, series-nav, …
├── _plugins/
│   └── lazy_images.rb      Post-render hook: adds loading="lazy" to unattributed <img>
├── src/
│   ├── main.css            Vite entry: design tokens + all Tailwind components
│   └── main.js             Alpine.js bundle entry (dark mode, search overlay, nav)
├── assets/
│   ├── css/
│   │   ├── brand-*.css     Per-site token overrides (rsync'd to site root at build)
│   │   ├── syntax.css      Syntax highlighting + search overlay + print
│   │   └── essay.css       Essay layout: 3-column, sidenotes, scrolly, print
│   └── js/
│       ├── core.js         Viz runtime orchestrator: detect → CDN load → render
│       ├── viz-registry.js Central registry of viz library adapters
│       ├── viz/
│       │   ├── math.js     KaTeX trigger
│       │   ├── diagrams.js Mermaid trigger
│       │   ├── echarts.js  ECharts adapter
│       │   ├── d3.js       D3 selective-import adapter + registerD3Chart()
│       │   ├── leaflet.js  Leaflet adapter (dark-mode tile swap)
│       │   ├── mapbox.js   Mapbox GL JS adapter
│       │   └── pyodide.js  Pyodide adapter (Python-in-WASM interactive cells)
│       └── models/
│           └── ricker.js   Ricker population dynamics widget
├── scripts/
│   ├── new-draft.sh        Interactive draft creation
│   ├── publish.sh          Move draft to _posts/ with today's date
│   └── quarto-render.sh    Render .qmd → Jekyll MD + notebook + figures
├── _config.yml             Template-level defaults (overridden by each site repo)
├── HOWTO.md                Full authoring and configuration reference
├── ARCHITECTURE.md         Design record — decisions, principles, phase history
└── starter/                Starter config files for new site repos
```

---

## Key configuration (`_config.yml` in each site repo)

```yaml
# Identity
title:       "Site Name"
description: "One-sentence description."
url:         "https://yoursite.github.io"
author:      author-slug       # key in _data/authors.yml

# Brand
brand:                loom     # selects assets/css/brand-{name}.css
brand_name:           "Display Name"
brand_default_theme:  dark     # "dark" | "light" — before localStorage is read

# Submodule paths (required, do not change)
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins

# Optional
hide_subscribe_cta:  true      # suppress subscribe block on post pages
analytics_token:     ""        # Cloudflare Web Analytics token
mapbox_token:        ""        # Mapbox public token (pk.eyJ...)
giscus:
  repo:        ""
  repo_id:     ""
  category_id: ""
```

---

## Post front matter

```yaml
---
layout: post          # or: essay
title:  "Title"
date:   2026-03-01
excerpt: "Optional — used in cards and meta."
categories: [Topic]
tags: [tag-one, tag-two]
author: author-slug
image: /assets/images/feature.jpg
featured: true        # show in Featured section on home page
comments: true        # enable Giscus

# Series navigation
series: "Series Name"
series_order: 1

# Viz library flags (also auto-detected from content)
math:    true         # KaTeX
diagram: true         # Mermaid
viz:     true         # ECharts
d3:      true         # D3
leaflet: true         # Leaflet
geo:     true         # Mapbox GL
story:   true         # Scrollama (essay layout)
pyodide: true         # Pyodide interactive Python cells
---
```

---

## Adding a new visualisation library

1. Create `assets/js/viz/your-lib.js` — export `init()`, `render(el, options)`, `update(el, data, instance)`
2. Import it in `assets/js/viz-registry.js` and add a registry entry
3. Add the body-class flag in `_layouts/default.html` if needed
4. Document the front matter flag in the post reference above

The core runtime (`core.js`) does not change. See the Pyodide adapter (`assets/js/viz/pyodide.js`) as a worked example.

---

## Quarto + Pyodide (computational essays)

Essays for the Wayward House series are authored in Quarto (`.qmd`) and compiled to Jekyll Markdown. A generic render helper is provided:

```bash
bash scripts/quarto-render.sh <essay-dir> <site-repo-root>

# Example:
bash scripts/quarto-render.sh \
  essays/A1-what-is-a-spatial-model \
  /path/to/waywardhouse.github.io
```

Pyodide cells in `.qmd` use the div fence syntax (passes through to HTML as `<div class="pyodide-cell">`):

```markdown
::: {.pyodide-cell}
```python
import numpy as np
print(np.exp(-1.5))
```
:::
```

Set `pyodide: true` in front matter to enable the runtime. See `ARCHITECTURE.md §7` for the full three-channel model.

---

## Documentation

| File | Contents |
|---|---|
| `HOWTO.md` | Full authoring and configuration reference — all features, all options |
| `ARCHITECTURE.md` | Design record — why things are the way they are, phase history |
| `CLAUDE.md` | Claude Code guidance for AI-assisted development |

---

## Requirements

| Tool | Version |
|---|---|
| Ruby | 3.3 |
| Bundler | any recent |
| Node.js | 20 |
| Quarto CLI | ≥ 1.4 (optional — Wayward House only) |
