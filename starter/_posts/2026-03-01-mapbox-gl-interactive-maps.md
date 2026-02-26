---
layout: essay
title: "Interactive Maps with Mapbox GL JS"
date: 2026-03-01
author: paul-hobson
excerpt: "Full-featured vector maps with custom styles, scroll-driven flyTo transitions, and automatic dark mode switching — using the Mapbox GL JS adapter."
categories: [meta]
tags: [mapbox, maps, scrollytelling, how-to, geo]
geo: true
story: true
featured: true
series: "Building Loom"
series_order: 5
---

Loom includes two map adapters: **Leaflet** for token-free raster tile maps, and **Mapbox GL JS** for vector maps with custom styles, smooth camera transitions, and 3D terrain. Use Leaflet when you need a quick map with no credentials. Use Mapbox when you need style control, high-zoom fidelity, or scroll-driven storytelling with cinematic camera moves.

---

## Standalone maps

A single `data-map` attribute is all that is required. The adapter reads the access token from `window.MAPBOX_TOKEN`, which is injected by `head.html` from `mapbox_token:` in `_config.yml`.

**Preset locations** resolve center and zoom automatically:

<div data-map="world" style="height:380px;"></div>

```html
<div data-map="world" style="height:380px;"></div>
```

Available presets: `world`, `calgary`, `edmonton`, `vancouver`, `toronto`.

---

**Vancouver** — the Strait of Georgia meets the Coast Mountains:

<div data-map="vancouver" style="height:380px;"></div>

---

**Custom centre and zoom** — use `data-center` (longitude, latitude) and `data-zoom`:

<div data-map="custom" style="height:380px;"
     data-center="-125.0,54.5"
     data-zoom="5"></div>

```html
<div data-map="custom" style="height:380px;"
     data-center="-125.0,54.5"
     data-zoom="5"></div>
```

Note the Mapbox convention: **longitude first**, then latitude. This is the reverse of Leaflet's `[lat, lng]` order.

---

## Style overrides

The default style is `outdoors-v12` — terrain shading, land cover, contours, and waterways. It works at any zoom level and in any page context. Override with `data-style` when you need something different:

```html
<div data-map="calgary" data-style="mapbox://styles/mapbox/satellite-streets-v12"
     style="height:400px;"></div>
```

---

## Scrolly story: a tour of the BC coast

The scrollytelling pattern is identical to Leaflet — a `.story-section` containing a `.story-sticky` graphic and `.story-steps` prose, with `data-update` JSON on each step. For Mapbox, the update payload uses `center: [lng, lat]` and `zoom`.

<section class="story-section">
  <div class="story-sticky">
    <div class="story-graphic">
      <div data-map="world" id="bc-map"
           data-center="-126.0,54.0" data-zoom="5"></div>
    </div>
  </div>
  <div class="story-steps">

    <div class="story-step" data-step="0"
         data-update='{"bc-map": {"center": [-126.0, 54.0], "zoom": 5}}'>
      <p><strong>British Columbia.</strong> The province spans 945,000 km² — larger than France and Germany combined. Its western edge is a 27,000 km coastline of fjords, islands, and inlets carved by glaciation over the past two million years.</p>
    </div>

    <div class="story-step" data-step="1"
         data-update='{"bc-map": {"center": [-123.1207, 49.2827], "zoom": 11}}'>
      <p><strong>Vancouver.</strong> Built on a river delta between the Coast Mountains and the Salish Sea. The city sits on unceded Musqueam, Squamish, and Tsleil-Waututh territory. At zoom 11 the False Creek inlet and Stanley Park peninsula define the downtown core.</p>
    </div>

    <div class="story-step" data-step="2"
         data-update='{"bc-map": {"center": [-123.3656, 48.4284], "zoom": 12}}'>
      <p><strong>Victoria.</strong> On the southern tip of Vancouver Island, Victoria receives less than half Vancouver's annual rainfall — sheltered by the Olympic Mountains to the south. The Inner Harbour has been the island's commercial gateway since the 1850s.</p>
    </div>

    <div class="story-step" data-step="3"
         data-update='{"bc-map": {"center": [-122.9574, 50.1163], "zoom": 12}}'>
      <p><strong>Whistler.</strong> 120 km north of Vancouver, the Whistler-Blackcomb ski area sits in a north-south valley between the Coast and Fitzsimmons ranges. Annual snowfall exceeds 10 m. The valley was glaciated as recently as 12,000 years ago.</p>
    </div>

    <div class="story-step" data-step="4"
         data-update='{"bc-map": {"center": [-126.0, 54.0], "zoom": 5}}'>
      <p><strong>The whole coast.</strong> Pulling back to the provincial view — the density of inlets, islands, and river deltas along this coastline hosts some of the most productive salmon habitat on Earth. Five species of Pacific salmon spawn in BC rivers, supporting both coastal ecosystems and Indigenous communities.</p>
    </div>

  </div>
</section>

The `data-update` format for Mapbox:

```html
<div class="story-step"
     data-update='{"bc-map": {"center": [-123.12, 49.28], "zoom": 11}}'>
```

`center` is `[longitude, latitude]`. When Scrollama fires a step, `core.js` routes the payload to `updateMap()`, which calls `map.flyTo({ center, zoom, duration: 1500 })`.

---

## How the token flows

```
_config.yml           mapbox_token: "pk.eyJ..."
      ↓
_includes/head.html   <script>window.MAPBOX_TOKEN = '...';</script>
      ↓
assets/js/viz/mapbox.js   const token = el.dataset.token || window.MAPBOX_TOKEN
      ↓
mapboxgl.accessToken = token
```

To keep the token out of source control entirely, remove it from `_config.yml` and set it as a GitHub Actions secret. See §17 of HOWTO.md for the workflow snippet.

---

## Style overrides

Any valid Mapbox style URL works in `data-style`:

```html
<!-- Satellite imagery -->
<div data-map="vancouver" style="height:400px;"
     data-style="mapbox://styles/mapbox/satellite-streets-v12"></div>

<!-- Streets — higher label density, better for urban content -->
<div data-map="calgary" style="height:400px;"
     data-style="mapbox://styles/mapbox/streets-v12"></div>

<!-- Custom Mapbox Studio style -->
<div data-map="custom" style="height:400px;"
     data-center="-114.07,51.04" data-zoom="10"
     data-style="mapbox://styles/your-username/your-style-id"></div>
```
