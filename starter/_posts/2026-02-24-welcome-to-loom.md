---
layout: post
title: "What Loom Is and How It Works"
date: 2026-02-24
author: paul-hobson
excerpt: "A fast Jekyll site with dark mode, computational essays, and a full visualisation runtime — what's in the stack and why each piece is here."
categories: [meta]
tags: [jekyll, design, architecture]
featured: true
series: "Building Loom"
series_order: 1
comments: true
---

Loom is a Jekyll theme built for technical writing beyond the basics. It provides clean typography by default, with a progressive visualisation layer that loads only what a page needs. This originally started out as a Ghost Theme but in a moment born of frustration, moved back to a tried-and-true deployment method. What's old is new again.

## Design principles

Three ideas shaped every decision in the initial build:

**No JavaScript tax on simple posts.** A post with only prose and code blocks loads no charting libraries, no mapping SDKs, no math renderers. The runtime detects what each page uses and loads accordingly.

**Dark mode that doesn't fight itself.** Syntax highlighting, maps, charts, and diagrams all respond to the theme toggle. No bright rectangles marooned in a dark page.

**Essays as a first-class format.** Long-form computational work needs a different layout than a blog post — sticky table of contents, margin sidenotes, reading progress, scrollytelling. Loom treats these as core, not bolt-ons.

## The stack

| Layer | Technology | Why |
|---|---|---|
| Static site | Jekyll 4.3 | Mature, GitHub Pages native, no Node server |
| CSS | Tailwind 3 + custom tokens | Utility-first for layout, custom properties for theming |
| JS | Alpine.js + ES modules | Reactive UI without a framework build step |
| Build | Vite 6 | Fast bundling of `src/main.css` and `src/main.js` |
| Deploy | GitHub Actions → GitHub Pages | Zero server cost, automatic on push |

## How the visualisation runtime works

`assets/js/core.js` runs on every page. It checks which libraries the page needs, loads only those from CDN, and hands off to adapter modules:

```
core.js reads the REGISTRY
  ↓
detect() — does this page use math? diagrams? D3?
  ↓
loadCDN() — fetch only the needed scripts/styles
  ↓
render() — mount each [data-viz], [data-d3], [data-leaflet] element
  ↓
wireScrolly() — route story:step events to the matching adapter
```

Adding a new library means adding one entry to `viz-registry.js`. The rest of the machinery handles loading, mounting, and scrolly updates automatically.

## What this series covers

The next posts in this series walk through each part of the visualisation system with live examples:

- **Mathematics and diagrams** — KaTeX for inline and display math; Mermaid for flowcharts, sequence diagrams, and class diagrams
- **Interactive charts** — ECharts for production charts; D3 for custom data graphics with a built-in registry for extension
- **Scrollytelling** — Leaflet maps with flyTo transitions; D3 bar charts animating through data states driven by scroll position

Each post is also a test of the system it describes — if the chart renders, the pipeline works.

There is also a [sample presentation](/sample-presentation/) built with the `presentation` layout — a Reveal.js full-screen slideshow that shares Loom's typography and dark mode without loading the site's normal header or footer.
