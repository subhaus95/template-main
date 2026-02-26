---
layout: essay
title: "Scrollytelling with Maps and Charts"
date: 2026-02-27
author: paul-hobson
excerpt: "How to build scroll-driven stories that update Leaflet maps and D3 charts as the reader scrolls through the narrative."
categories: [meta]
tags: [scrollama, leaflet, d3, scrollytelling, maps, how-to]
story: true
leaflet: true
d3: true
series: "Building Loom"
series_order: 4
---

Scroll-driven stories pin a visualisation on screen while the reader scrolls through prose. Each "step" in the story can trigger an update — flying a map to a new location, updating chart data, or changing the state of any registered visualisation.

This essay demonstrates two scrolly patterns: a **Leaflet map** that flies between cities, and a **D3 bar chart** that updates as the story progresses.

---

## Standalone Leaflet map

Before the scrolly examples, here is a basic Leaflet map with the CartoDB light tile layer. No JavaScript is required in the post — just a `data-leaflet` element.

<div data-leaflet style="height:360px"
     data-lat="51.505" data-lng="-0.09" data-zoom="11" data-tiles="carto"
     data-markers='[{"lat":51.505,"lng":-0.09,"label":"Centre point"}]'></div>

The `data-markers` attribute accepts a JSON array of `{lat, lng, label}` objects. Clicking a marker opens a popup.

Available tile presets: `osm` (default OpenStreetMap), `carto` (CartoDB Positron light), `carto-dark`, `stadia`.

---

## Scrolly story: map flyTo

The pattern requires a `.story-section` containing a `.story-sticky` (the pinned graphic) and `.story-steps` (the scrollable prose). Give the viz element an `id`, then add `data-update` JSON to each step targeting that id.

<section class="story-section">
  <div class="story-sticky">
    <div class="story-graphic">
      <div data-leaflet id="city-map" data-lat="51.505" data-lng="-0.09" data-zoom="11" data-tiles="carto"></div>
    </div>
  </div>
  <div class="story-steps">

    <div class="story-step" data-step="0"
         data-update='{"city-map": {"lat": 51.505, "lng": -0.09, "zoom": 11}}'>
      <p><strong>London.</strong> The Thames cuts through 32 boroughs. At zoom level 11 the full extent of inner London sits comfortably in frame — from Heathrow in the west to the Isle of Dogs in the east.</p>
    </div>

    <div class="story-step" data-step="1"
         data-update='{"city-map": {"lat": 48.8566, "lng": 2.3522, "zoom": 12}}'>
      <p><strong>Paris.</strong> Scroll down and the map flies south-east to the French capital. The périphérique ring road defines the boundary of the city proper. Zoom level 12 shows the arrondissement grid.</p>
    </div>

    <div class="story-step" data-step="2"
         data-update='{"city-map": {"lat": 52.52, "lng": 13.405, "zoom": 12}}'>
      <p><strong>Berlin.</strong> Reunified in 1990, Berlin covers 892 km² — nine times the area of Paris. The Spree and Havel rivers wind through the city. Zoom 12 shows the inner Ringbahn.</p>
    </div>

    <div class="story-step" data-step="3"
         data-update='{"city-map": {"lat": 41.3851, "lng": 2.1734, "zoom": 13}}'>
      <p><strong>Barcelona.</strong> Ildefons Cerdà's 1860 Eixample grid is visible at zoom 13 — perfect octagonal blocks, each 113 m per side, designed to equalise light and air for all residents.</p>
    </div>

  </div>
</section>

Each step's `data-update` value is a JSON object keyed by element id. When Scrollama fires `story:step` for a step, `core.js` reads the `data-update`, looks up each referenced element in its instance store, and calls the matching adapter's `update()` function. For Leaflet that calls `map.flyTo()` with a 1.5-second animation.

---

## Scrolly story: D3 bar chart

The same `data-update` pattern works with D3 charts. The `data` key replaces the chart's dataset with a smooth transition.

<section class="story-section">
  <div class="story-sticky">
    <div class="story-graphic">
      <div data-d3="bar" id="energy-chart"
           data-options='{
             "data": [
               {"label":"Coal",    "value": 9},
               {"label":"Gas",     "value": 23},
               {"label":"Nuclear", "value": 10},
               {"label":"Hydro",   "value": 16},
               {"label":"Solar",   "value": 14},
               {"label":"Wind",    "value": 14}
             ]
           }'></div>
    </div>
  </div>
  <div class="story-steps">

    <div class="story-step" data-step="0"
         data-update='{"energy-chart": {"data": [
           {"label":"Coal",    "value": 9},
           {"label":"Gas",     "value": 23},
           {"label":"Nuclear", "value": 10},
           {"label":"Hydro",   "value": 16},
           {"label":"Solar",   "value": 14},
           {"label":"Wind",    "value": 14}
         ]}}'>
      <p><strong>2010 global electricity generation (%).</strong> Gas and coal together supply roughly a third of the world's electricity. Renewables are barely visible at this scale — solar is a rounding error.</p>
    </div>

    <div class="story-step" data-step="1"
         data-update='{"energy-chart": {"data": [
           {"label":"Coal",    "value": 20},
           {"label":"Gas",     "value": 23},
           {"label":"Nuclear", "value": 10},
           {"label":"Hydro",   "value": 15},
           {"label":"Solar",   "value": 5},
           {"label":"Wind",    "value": 8}
         ]}}'>
      <p><strong>2015.</strong> Solar and wind have both grown meaningfully. Coal is still rising in absolute terms as global demand grows faster than clean capacity is added. The energy transition is underway but not dominant.</p>
    </div>

    <div class="story-step" data-step="2"
         data-update='{"energy-chart": {"data": [
           {"label":"Coal",    "value": 36},
           {"label":"Gas",     "value": 22},
           {"label":"Nuclear", "value": 10},
           {"label":"Hydro",   "value": 15},
           {"label":"Solar",   "value": 12},
           {"label":"Wind",    "value": 13}
         ]}}'>
      <p><strong>2020.</strong> Solar and wind together now rival nuclear. Coal peaks in share terms. The cost curves for solar have crossed every optimistic projection made a decade earlier.</p>
    </div>

    <div class="story-step" data-step="3"
         data-update='{"energy-chart": {"data": [
           {"label":"Coal",    "value": 35},
           {"label":"Gas",     "value": 22},
           {"label":"Nuclear", "value": 9},
           {"label":"Hydro",   "value": 14},
           {"label":"Solar",   "value": 23},
           {"label":"Wind",    "value": 14}
         ]}}'>
      <p><strong>2024.</strong> Solar overtakes coal in new capacity additions for the first time. The transition is now an economic story, not just an environmental one — solar is the cheapest electricity source ever built.</p>
    </div>

  </div>
</section>

---

## How the wiring works

```
narrative.js
  │  Scrollama fires onStepEnter
  │  → sets data-active on step element
  │  → dispatches story:step(bubbles: true, detail: { element, index, step })
  ▼
core.js  (document-level listener)
  │  reads detail.element.dataset.update  → JSON
  │  for each { id: data } entry:
  │    instances.get(id) → { entry, el, instance }
  │    entry.update(el, data, instance)
  ▼
Adapter update functions
  Leaflet → map.flyTo([lat, lng], zoom, { duration: 1.5 })
  D3      → chart.update(data)  (built-in transition: 600ms)
  ECharts → instance.setOption(data, false)  (merge mode)
```

### Adding update support to a custom D3 chart

When you register a custom chart type, return an `update` method from the factory:

```javascript
registerD3Chart('timeline', (el, data, options) => {
  // … render initial state …

  return {
    update(newData) {
      // Apply newData with transitions
    }
  };
});
```

Then `core.js` will route `data-update` JSON to `chart.update()` automatically.
