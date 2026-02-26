---
layout: post
title: "Interactive Charts with ECharts and D3"
date: 2026-02-26
author: paul-hobson
excerpt: "Embedding interactive data visualisations using Apache ECharts and D3 — declarative markup, no JavaScript required in the post."
categories: [meta]
tags: [echarts, d3, charts, data-visualization, how-to]
viz: true
d3: true
series: "Building Loom"
series_order: 3
---

Two charting libraries are available out of the box: **Apache ECharts** for high-level declarative charts, and **D3** for fully custom visualisations. Both are loaded on demand — only when `[data-viz]` or `[data-d3]` elements appear in the post.

---

## ECharts

Use `data-viz="echarts"` with a `data-options` JSON attribute to embed any ECharts chart. The full [ECharts option schema](https://echarts.apache.org/en/option.html) is supported.

### Bar chart

<div data-viz="echarts" style="height:320px" data-options='{
  "title": {"text": "Global renewable capacity additions (GW)", "left": 0},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["2019","2020","2021","2022","2023"]},
  "yAxis": {"type": "value"},
  "series": [{"name":"Solar","type":"bar","data":[97,127,157,191,230]},
             {"name":"Wind","type":"bar","data":[60,93,94,102,116]}]
}'></div>

### Line chart

<div data-viz="echarts" style="height:280px" data-options='{
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "boundaryGap": false,
            "data": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]},
  "yAxis": {"type": "value", "name": "°C"},
  "series": [
    {"name":"London", "type":"line", "smooth":true,
     "data":[5.2,5.5,7.5,9.8,13.0,16.1,18.3,18.1,15.3,11.8,8.0,5.8]},
    {"name":"Berlin", "type":"line", "smooth":true,
     "data":[0.5,1.5,5.2,9.8,14.6,17.7,19.8,19.3,14.8,9.9,5.0,1.7]}
  ]
}'></div>

### How it works

The `renderEChart` adapter:
1. Registers the `loom` theme (palette + text styles matching the site's CSS variables)
2. Calls `echarts.init(el, 'loom')`
3. Attaches a `ResizeObserver` so charts resize with their container
4. Returns the chart instance for potential scrolly updates

The full ECharts options object is passed directly to `chart.setOption()`, so anything from the ECharts docs works without any wrapper configuration.

---

## D3

Use `data-d3="type"` with a `data-options` JSON attribute containing a `data` array.

### Built-in: bar chart

<div data-d3="bar" style="height:300px" data-options='{
  "data": [
    {"label": "Solar",    "value": 230},
    {"label": "Wind",     "value": 116},
    {"label": "Hydro",    "value": 37},
    {"label": "Nuclear",  "value": 10},
    {"label": "Geotherm", "value": 6}
  ]
}'></div>

### Built-in: line chart

<div data-d3="line" style="height:260px" data-options='{
  "data": [
    {"x":2000,"value":1.2},{"x":2005,"value":2.0},{"x":2010,"value":3.9},
    {"x":2015,"value":7.2},{"x":2018,"value":12.1},{"x":2020,"value":18.5},
    {"x":2022,"value":28.4},{"x":2023,"value":35.0}
  ]
}'></div>

### Built-in: force graph

<div data-d3="force" style="height:340px" data-options='{
  "data": {
    "nodes": [
      {"id":"core.js"},{"id":"viz-registry"},{"id":"math.js"},
      {"id":"diagrams.js"},{"id":"echarts.js"},{"id":"leaflet.js"},
      {"id":"d3.js"},{"id":"ricker.js"},{"id":"narrative.js"}
    ],
    "links": [
      {"source":"core.js","target":"viz-registry"},
      {"source":"viz-registry","target":"math.js"},
      {"source":"viz-registry","target":"diagrams.js"},
      {"source":"viz-registry","target":"echarts.js"},
      {"source":"viz-registry","target":"leaflet.js"},
      {"source":"viz-registry","target":"d3.js"},
      {"source":"echarts.js","target":"ricker.js"},
      {"source":"core.js","target":"narrative.js"}
    ]
  }
}'></div>

The force graph above shows the dependency structure of the theme's visualization system.

### Adding custom chart types

Register a new D3 chart type from a post HTML block or a separate JS file. The factory receives the container element, the `data` array, and the remaining options, and must return an object with an `update(newData)` method.

```javascript
import { registerD3Chart } from '/assets/js/viz/d3.js';

registerD3Chart('scatter', (el, data, options) => {
  const d3 = window.d3;
  const { width, height } = el.getBoundingClientRect();

  const svg = d3.select(el)
    .append('svg')
    .attr('width', width).attr('height', height);

  // … draw circles …

  return {
    update(newData) {
      // re-render with newData
    }
  };
});
```

Then use it in the post:

```html
<div data-d3="scatter" style="height:320px"
     data-options='{"data":[{"x":1,"y":2},{"x":3,"y":4}]}'></div>
```

The factory pattern means each chart type is entirely self-contained — it owns its own scales, axes, and update logic. The registry just dispatches to the right factory at render time, and stores the returned instance for scrolly updates.
