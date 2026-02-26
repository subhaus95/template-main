---
layout: presentation
title: "Introducing Loom"
date: 2026-02-28
author: paul-hobson
excerpt: "A walkthrough of the Loom stack and its capabilities."
categories: [meta]
tags: [jekyll, design, architecture, presentations]
---

# Introducing Loom
LoomCollective — 2026

---

## What is Loom?

A Jekyll theme built for **technical publishing**.

- Clean typography by default
- Progressive visualisation layer (ECharts, D3, Leaflet, Mapbox)
- Dark mode throughout
- Full-text search via Pagefind

---

## The Stack

| Layer | Technology |
|-------|-----------|
| Static site | Jekyll 4.3 |
| CSS | Tailwind + custom tokens |
| JS | Alpine.js + ES modules |
| Build | Vite 6 |
| Deploy | GitHub Actions |

---

## Visualisation Runtime

`assets/js/core.js` scans each page and loads only what it needs:

```javascript
// Only ECharts loads on pages that use [data-viz]
if (document.querySelector('[data-viz]')) {
  loadECharts();
}
```

No JavaScript tax on simple posts.

---

## Dark Mode

Stored in `localStorage` as `loom-dark`.

Applied synchronously in `<head>` — no flash on load.

<span class="accent">The accent colour #F0177A works in both modes.</span>

---

## Speaker Notes

Press **S** to open the speaker view.

<aside class="notes">
  Speaker notes go inside an aside.notes element.
  They appear only in the S-key speaker window, not on the main display.
</aside>

---

## Thank you

→ [loomcollective.github.io](https://loomcollective.github.io)
