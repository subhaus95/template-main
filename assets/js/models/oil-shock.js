/**
 * oil-shock.js — Oil Supply Shock Propagation Simulator
 *
 * Interactive model projecting regional economic impacts from a Hormuz-style
 * supply disruption, using empirically-grounded elasticities from IMF, World
 * Bank, and Federal Reserve research.
 *
 * Usage:
 *   <div data-viz="oil-shock" style="min-height: 860px;"></div>
 *
 * Front matter: viz: true
 *
 * @module models/oil-shock
 */

import { renderEChart } from '../viz/echarts.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS           = 24;
const GLOBAL_SUPPLY    = 103;   // mb/d (approximate 2026 baseline)
const INV_ELASTICITY   = 0.08;  // inverse of combined short-run supply+demand elasticity
const PRICE_CEILING    = 200;   // $/bbl hard cap (demand destruction above this)

// ── Region parameters ────────────────────────────────────────────────────────
// All structural values are from IMF, World Bank, Nomura, and IIF research.
// See methodology notes panel for sources.

const REGIONS = [
  {
    id: 'us', name: 'United States', shortName: 'US', color: '#4e8ac4',
    hormuzDependence: 0.02, oilImportShareGDP: 0.012, foodImportVulnerability: 0.08,
    baseInflation: 2.8, currencyStability: 0.95, fuelSubsidyCapacity: 0.1,
    retailPassThrough: 0.6, foodChannelStrength: 0.3, lngExposure: 0.05,
    group: 'advanced',
  },
  {
    id: 'eu', name: 'European Union', shortName: 'EU', color: '#4e6ac4',
    hormuzDependence: 0.18, oilImportShareGDP: 0.025, foodImportVulnerability: 0.10,
    baseInflation: 2.4, currencyStability: 0.80, fuelSubsidyCapacity: 0.3,
    retailPassThrough: 0.5, foodChannelStrength: 0.3, lngExposure: 0.35,
    group: 'advanced',
  },
  {
    id: 'japan', name: 'Japan', shortName: 'JP', color: '#e8cc6a',
    hormuzDependence: 0.72, oilImportShareGDP: 0.025, foodImportVulnerability: 0.15,
    baseInflation: 2.2, currencyStability: 0.70, fuelSubsidyCapacity: 0.4,
    retailPassThrough: 0.5, foodChannelStrength: 0.35, lngExposure: 0.30,
    group: 'advanced',
  },
  {
    id: 'korea', name: 'South Korea', shortName: 'KR', color: '#c5a44e',
    hormuzDependence: 0.65, oilImportShareGDP: 0.027, foodImportVulnerability: 0.18,
    baseInflation: 2.5, currencyStability: 0.65, fuelSubsidyCapacity: 0.2,
    retailPassThrough: 0.65, foodChannelStrength: 0.35, lngExposure: 0.25,
    group: 'advanced',
  },
  {
    id: 'china', name: 'China', shortName: 'CN', color: '#c44e4e',
    hormuzDependence: 0.40, oilImportShareGDP: 0.018, foodImportVulnerability: 0.12,
    baseInflation: 0.5, currencyStability: 0.75, fuelSubsidyCapacity: 0.5,
    retailPassThrough: 0.4, foodChannelStrength: 0.25, lngExposure: 0.20,
    group: 'emerging_large',
  },
  {
    id: 'india', name: 'India', shortName: 'IN', color: '#c48a4e',
    hormuzDependence: 0.50, oilImportShareGDP: 0.035, foodImportVulnerability: 0.08,
    baseInflation: 5.0, currencyStability: 0.55, fuelSubsidyCapacity: 0.3,
    retailPassThrough: 0.55, foodChannelStrength: 0.50, lngExposure: 0.25,
    group: 'emerging_large',
  },
  {
    id: 'sea', name: 'Southeast Asia', shortName: 'SEA', color: '#c4a04e',
    hormuzDependence: 0.45, oilImportShareGDP: 0.030, foodImportVulnerability: 0.15,
    baseInflation: 3.5, currencyStability: 0.50, fuelSubsidyCapacity: 0.25,
    retailPassThrough: 0.60, foodChannelStrength: 0.45, lngExposure: 0.15,
    group: 'emerging',
  },
  {
    id: 'mena_importers', name: 'MENA Importers', shortName: 'MENA-I', color: '#c46a4e',
    hormuzDependence: 0.60, oilImportShareGDP: 0.045, foodImportVulnerability: 0.35,
    baseInflation: 12.0, currencyStability: 0.35, fuelSubsidyCapacity: 0.4,
    retailPassThrough: 0.35, foodChannelStrength: 0.65, lngExposure: 0.10,
    group: 'developing',
  },
  {
    id: 'ssa', name: 'Sub-Saharan Africa', shortName: 'SSA', color: '#8a3535',
    hormuzDependence: 0.30, oilImportShareGDP: 0.040, foodImportVulnerability: 0.30,
    baseInflation: 15.0, currencyStability: 0.25, fuelSubsidyCapacity: 0.1,
    retailPassThrough: 0.75, foodChannelStrength: 0.70, lngExposure: 0.05,
    group: 'developing',
  },
  {
    id: 'latam', name: 'Latin America', shortName: 'LATAM', color: '#4ec46a',
    hormuzDependence: 0.10, oilImportShareGDP: 0.015, foodImportVulnerability: 0.12,
    baseInflation: 6.0, currencyStability: 0.40, fuelSubsidyCapacity: 0.2,
    retailPassThrough: 0.55, foodChannelStrength: 0.45, lngExposure: 0.08,
    group: 'emerging',
  },
  {
    id: 'gulf_exporters', name: 'Gulf Exporters', shortName: 'GCC', color: '#e8a06a',
    hormuzDependence: 0.90, oilImportShareGDP: -0.35, foodImportVulnerability: 0.40,
    baseInflation: 2.5, currencyStability: 0.80, fuelSubsidyCapacity: 0.8,
    retailPassThrough: 0.1, foodChannelStrength: 0.55, lngExposure: -0.20,
    group: 'special_exporter',
  },
  {
    id: 'canada', name: 'Canada / Alberta', shortName: 'CAN', color: '#c44e8a',
    hormuzDependence: 0.0, oilImportShareGDP: -0.04, foodImportVulnerability: 0.08,
    baseInflation: 2.5, currencyStability: 0.75, fuelSubsidyCapacity: 0.2,
    retailPassThrough: 0.65, foodChannelStrength: 0.20, lngExposure: 0.0,
    group: 'special_exporter',
  },
];

// ── Historical shock reference data ──────────────────────────────────────────

const HISTORICAL_SHOCKS = {
  '1973': { name: '1973 Arab Embargo',       priceStart: 3.0,  pricePeak: 12.0,  peakMonth: 4, duration: 6  },
  '1979': { name: '1979 Iranian Revolution', priceStart: 14.0, pricePeak: 39.5,  peakMonth: 8, duration: 12 },
  '1990': { name: '1990 Gulf War',           priceStart: 17.0, pricePeak: 41.0,  peakMonth: 2, duration: 3  },
  '2008': { name: '2008 Price Spike',        priceStart: 90.0, pricePeak: 147.0, peakMonth: 5, duration: 6  },
  '2022': { name: '2022 Russia–Ukraine',     priceStart: 78.0, pricePeak: 128.0, peakMonth: 3, duration: 8  },
};

const DURATION_MONTHS = { '2w': 0.5, '1m': 1, '3m': 3, '6m': 6, '12m': 12 };

// ── Lag functions ─────────────────────────────────────────────────────────────
// Stylised approximations of empirical impulse response functions.
// t is in months from shock onset.

const energyLag      = (t) => Math.min(1, t === 0 ? 0.7 : 0.7 + 0.3 * (1 - Math.exp(-t / 0.5)));
const foodLag        = (t) => Math.min(1, 1 - Math.exp(-t / 3));
const lngLagFn       = (t) => Math.min(1, 1 - Math.exp(-t / 1.5));
const gdpLagFn       = (t) => Math.min(1, 1 - Math.exp(-t / 4));
const instabilityLag = (t) => Math.min(1, 1 - Math.exp(-t / 5));

// ── Price projection ──────────────────────────────────────────────────────────

function projectPrice(basePrice, shockMagnitude, durationMonths, t) {
  const removalPct = shockMagnitude / GLOBAL_SUPPLY;
  const spikePct   = removalPct / INV_ELASTICITY;

  let multiplier;
  if (durationMonths <= 1) {
    multiplier = spikePct * Math.exp(-t / 1.5);
  } else if (durationMonths <= 3) {
    multiplier = t < durationMonths
      ? spikePct
      : spikePct * Math.exp(-(t - durationMonths) / 3);
  } else if (durationMonths <= 6) {
    multiplier = t < durationMonths
      ? spikePct * 0.85
      : spikePct * 0.85 * Math.exp(-(t - durationMonths) / 4);
  } else {
    multiplier = spikePct * 0.75; // sustained plateau
  }

  return Math.min(PRICE_CEILING, basePrice * (1 + multiplier));
}

// ── Per-region monthly impact ─────────────────────────────────────────────────
// Returns an object with all impact metrics in percentage-point units.

function regionAtTime(region, basePrice, price, lngDisruption, t) {
  const oilPriceChange = (price - basePrice) / basePrice;
  const oilCPIWeight   = region.group === 'developing' ? 0.10 : 0.07;

  // Currency depreciation amplifier (non-USD economies under oil import stress)
  const currencyDep         = oilPriceChange * Math.abs(region.oilImportShareGDP)
                            * (1 - region.currencyStability) * 0.5;
  const effectivePriceChange = oilPriceChange * (1 + currencyDep);

  // Direct energy inflation (fast channel, peaks months 1–2)
  const energyInflation = effectivePriceChange * region.retailPassThrough
                        * oilCPIWeight * energyLag(t) * 100;

  // Food price inflation (slow channel, peaks months 3–5)
  let foodInflation = effectivePriceChange * region.foodChannelStrength * foodLag(t) * 100;

  // LNG channel (if Qatar Ras Laffan disruption toggle is on)
  let lngAdd = 0;
  if (lngDisruption && region.lngExposure > 0) {
    lngAdd         = region.lngExposure * 0.15 * lngLagFn(t) * 100;
    foodInflation += region.lngExposure * 0.08 * foodLag(t) * 100; // fertiliser
  }

  // Total inflation — high-inflation amplifier (IMF: pass-through 2–4× higher above 4%)
  let totalInflation = energyInflation + foodInflation + lngAdd;
  if (region.baseInflation > 4) {
    totalInflation *= 1 + (region.baseInflation - 4) * 0.15;
  }

  // GDP impact (percentage points of GDP)
  let gdpImpact;
  const gdpElasticity = region.group === 'advanced'    ? -0.010
                      : region.group === 'developing'  ? -0.006
                      : -0.008;

  if (region.oilImportShareGDP < 0) {
    if (region.id === 'gulf_exporters') {
      // Blocked by Hormuz: can't export at elevated prices = revenue loss
      gdpImpact = -Math.abs(region.oilImportShareGDP) * oilPriceChange * 0.10
                * gdpLagFn(t) * 100;
    } else {
      // Canada / other net exporters: windfall
      gdpImpact = Math.abs(region.oilImportShareGDP) * oilPriceChange * 0.30
                * gdpLagFn(t) * 100;
    }
  } else {
    gdpImpact = oilPriceChange * gdpElasticity * gdpLagFn(t) * 100;
    if (region.group === 'developing') {
      // Food/social instability compounds GDP contraction in vulnerable economies
      gdpImpact -= foodInflation * 0.02 * instabilityLag(t);
    }
  }

  // Current account (percentage points of GDP)
  let currentAccount;
  if (region.oilImportShareGDP < 0) {
    currentAccount = region.id === 'gulf_exporters'
      ? Math.abs(region.oilImportShareGDP) * -0.5 * oilPriceChange * 100   // blocked
      : Math.abs(region.oilImportShareGDP)  * 0.5 * oilPriceChange * 100;  // windfall
  } else {
    currentAccount = -(oilPriceChange / 0.10) * region.oilImportShareGDP
                   * 0.8 * (1 + currencyDep) * 100;
  }

  // Composite instability index (0–10)
  const instability = Math.min(10, Math.max(0,
    (totalInflation / 5)  * 2.0 +
    (foodInflation / 10)  * 3.0 +
    (1 - region.currencyStability) * 2.0 +
    Math.max(0, -gdpImpact) * 0.15 +
    (region.baseInflation > 10 ? 1.5 : 0),
  ));

  return {
    energyInflation,
    foodInflation,
    lngInflation: lngAdd,
    totalInflation,
    gdpImpact,
    currentAccount,
    currency: currencyDep * 100,
    instability,
  };
}

// ── Full 24-month simulation ───────────────────────────────────────────────────

function simulate({ shockMagnitude, basePrice, durationMonths, lngDisruption }) {
  const prices   = Array.from({ length: MONTHS }, (_, t) =>
    projectPrice(basePrice, shockMagnitude, durationMonths, t));
  const regional = Object.fromEntries(
    REGIONS.map(r => [r.id,
      prices.map((p, t) => regionAtTime(r, basePrice, p, lngDisruption, t)),
    ]),
  );
  return { prices, regional };
}

// ── Historical price overlay ──────────────────────────────────────────────────
// Normalises historical shock as a % change and plots at the model's base price
// so relative severity is visually comparable.

function historicalPricePoints(shock, basePrice) {
  const normPeak = (shock.pricePeak - shock.priceStart) / shock.priceStart;
  return Array.from({ length: MONTHS }, (_, t) => {
    const pct = t <= shock.peakMonth
      ? normPeak * (t / Math.max(1, shock.peakMonth))
      : normPeak * Math.exp(-(t - shock.peakMonth) / (shock.duration / 2));
    return +(basePrice * (1 + pct)).toFixed(1);
  });
}

// ── Heatmap sort & cell value ─────────────────────────────────────────────────

function cellValue(region, d) {
  // Canada shows as negative (benefit) in the diverging scale → green
  if (region.id === 'canada') return -(d.gdpImpact * 0.4);
  return d.instability;
}

function sortByPeakSeverity(simData) {
  return [...REGIONS].sort((a, b) => {
    const peakA = Math.max(...simData.regional[a.id].map(d => cellValue(a, d)));
    const peakB = Math.max(...simData.regional[b.id].map(d => cellValue(b, d)));
    return peakA - peakB; // ascending — ECharts y-axis bottom→top = low severity at bottom
  });
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG_DARK   = '#0a0f14';
const BG_CARD   = '#111820';
const BORDER    = '#1c2838';
const TEXT      = '#c8cdd3';
const TEXT_DIM  = '#6b7a8d';
const GOLD      = '#c5a44e';
const RED       = '#c44e4e';
const GREEN     = '#4ec46a';

const tooltipBase = {
  backgroundColor: BG_CARD,
  borderColor: BORDER,
  textStyle: { color: TEXT, fontSize: 12 },
};

const axisBase = {
  axisLabel: { color: TEXT_DIM, fontSize: 11 },
  axisLine: { lineStyle: { color: BORDER } },
  splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
};

// ── Chart option builders ─────────────────────────────────────────────────────

function priceChartOpts(prices, basePrice, historicalKey) {
  const xLabels = Array.from({ length: MONTHS }, (_, i) => `M${i}`);
  const series  = [
    {
      name: 'Projected',
      type: 'line',
      data: prices.map(p => +p.toFixed(1)),
      showSymbol: false,
      lineStyle: { width: 2, color: GOLD },
      itemStyle: { color: GOLD },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(197,164,78,0.20)' },
                     { offset: 1, color: 'rgba(197,164,78,0)' }] } },
    },
  ];

  if (historicalKey) {
    const shock = HISTORICAL_SHOCKS[historicalKey];
    series.push({
      name: shock.name,
      type: 'line',
      data: historicalPricePoints(shock, basePrice),
      showSymbol: false,
      lineStyle: { width: 1.5, type: 'dashed', color: TEXT_DIM },
      itemStyle: { color: TEXT_DIM },
    });
  }

  return {
    animation: false,
    backgroundColor: 'transparent',
    title: { text: 'Brent price projection', textStyle: { color: TEXT, fontSize: 12, fontWeight: '500' }, top: 2 },
    legend: historicalKey ? {
      data: series.map(s => s.name),
      textStyle: { color: TEXT_DIM, fontSize: 10 },
      top: 0, right: 4, itemWidth: 14, itemHeight: 2,
    } : { show: false },
    grid: { top: 36, right: 16, bottom: 44, left: 56 },
    xAxis: { type: 'category', data: xLabels, name: 'Month', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: TEXT_DIM }, ...axisBase, splitLine: { show: false } },
    yAxis: { type: 'value', name: '$/bbl', nameLocation: 'middle', nameGap: 48, nameTextStyle: { color: TEXT_DIM }, ...axisBase },
    tooltip: { trigger: 'axis', ...tooltipBase,
      formatter: (params) => params.map(p => `${p.seriesName}: <b>$${p.value}</b>`).join('<br>'),
    },
    series,
  };
}

function heatmapOpts(simData, sorted) {
  const data = [];
  for (let ri = 0; ri < sorted.length; ri++) {
    const r = sorted[ri];
    for (let t = 0; t < MONTHS; t++) {
      data.push([t, ri, +cellValue(r, simData.regional[r.id][t]).toFixed(2)]);
    }
  }
  return {
    animation: false,
    backgroundColor: 'transparent',
    title: { text: 'Impact propagation timeline  ·  click a row for channel detail', textStyle: { color: TEXT, fontSize: 12, fontWeight: '500' }, top: 2 },
    grid: { top: 36, right: 96, bottom: 40, left: 72 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: MONTHS }, (_, i) => `M${i}`),
      name: 'Month', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: TEXT_DIM },
      axisLabel: { color: TEXT_DIM, fontSize: 10 }, axisLine: { lineStyle: { color: BORDER } }, splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sorted.map(r => r.shortName),
      axisLabel: { color: TEXT, fontSize: 11 }, axisLine: { lineStyle: { color: BORDER } }, splitArea: { show: false },
    },
    visualMap: {
      min: -3, max: 10,
      calculable: true,
      orient: 'vertical',
      right: 6, top: 36, bottom: 40,
      inRange: { color: [GREEN, BG_CARD, '#7a2222', RED] },
      textStyle: { color: TEXT_DIM, fontSize: 10 },
      text: ['Severe', 'Benefit'],
    },
    tooltip: {
      position: 'top', ...tooltipBase,
      formatter: (p) => {
        if (!p.data) return '';
        const [month, ri] = p.data;
        const r = sorted[ri];
        const d = simData.regional[r.id][month];
        return [
          `<b>${r.name}</b> · Month ${month}`,
          `Instability: ${d.instability.toFixed(1)}/10`,
          `Inflation: +${d.totalInflation.toFixed(1)} ppt`,
          `GDP: ${d.gdpImpact >= 0 ? '+' : ''}${d.gdpImpact.toFixed(2)} ppt`,
        ].join('<br>');
      },
    },
    series: [{ type: 'heatmap', data, emphasis: { itemStyle: { borderColor: TEXT, borderWidth: 1 } } }],
  };
}

function channelOpts(region, regionData) {
  const xLabels = Array.from({ length: MONTHS }, (_, i) => `M${i}`);
  const makeArea = (name, values, color) => ({
    name, type: 'line', stack: 'channels',
    data: values.map(v => +Math.max(0, v).toFixed(2)),
    showSymbol: false, lineStyle: { width: 0 },
    areaStyle: { color }, emphasis: { focus: 'series' },
  });

  return {
    animation: false,
    backgroundColor: 'transparent',
    title: { text: `Transmission channels — ${region.name}`, textStyle: { color: TEXT, fontSize: 12, fontWeight: '500' }, top: 2 },
    legend: {
      data: ['Energy cost', 'Food inflation', 'LNG', 'Currency', 'GDP drag'],
      textStyle: { color: TEXT_DIM, fontSize: 10 },
      top: 0, right: 0, itemWidth: 12, itemHeight: 8,
    },
    grid: { top: 36, right: 16, bottom: 44, left: 56 },
    xAxis: { type: 'category', data: xLabels, name: 'Month', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: TEXT_DIM }, ...axisBase, splitLine: { show: false } },
    yAxis: { type: 'value', name: 'Δ ppt', nameLocation: 'middle', nameGap: 44, nameTextStyle: { color: TEXT_DIM }, ...axisBase },
    tooltip: { trigger: 'axis', ...tooltipBase },
    series: [
      makeArea('Energy cost',  regionData.map(d => d.energyInflation), 'rgba(197,164,78,0.75)'),
      makeArea('Food inflation',regionData.map(d => d.foodInflation),  'rgba(196,110,78,0.65)'),
      makeArea('LNG',          regionData.map(d => d.lngInflation),    'rgba(196,80,78,0.55)'),
      makeArea('Currency',     regionData.map(d => d.currency * 0.4),  'rgba(138,53,53,0.45)'),
      makeArea('GDP drag',     regionData.map(d => Math.max(0, -d.gdpImpact)), 'rgba(78,110,196,0.40)'),
    ],
  };
}

function comparisonOpts(simData, monthIdx) {
  const names = REGIONS.map(r => r.shortName);
  const get   = (key) => REGIONS.map(r => +simData.regional[r.id][monthIdx][key].toFixed(2));

  return {
    animation: false,
    backgroundColor: 'transparent',
    title: { text: `Regional comparison — Month ${monthIdx}`, textStyle: { color: TEXT, fontSize: 12, fontWeight: '500' }, top: 2 },
    legend: {
      data: ['Inflation (ppt)', 'Food inflation (ppt)', 'GDP impact (ppt)'],
      textStyle: { color: TEXT_DIM, fontSize: 10 },
      top: 0, right: 0, itemWidth: 12, itemHeight: 8,
    },
    grid: { top: 36, right: 16, bottom: 60, left: 46 },
    xAxis: { type: 'category', data: names, axisLabel: { color: TEXT_DIM, fontSize: 10, rotate: 35 }, axisLine: { lineStyle: { color: BORDER } } },
    yAxis: { type: 'value', name: 'ppt', nameTextStyle: { color: TEXT_DIM }, nameLocation: 'middle', nameGap: 36, ...axisBase },
    tooltip: { trigger: 'axis', ...tooltipBase },
    series: [
      { name: 'Inflation (ppt)',      type: 'bar', data: get('totalInflation'), itemStyle: { color: GOLD }, barMaxWidth: 18 },
      { name: 'Food inflation (ppt)', type: 'bar', data: get('foodInflation'),  itemStyle: { color: RED  }, barMaxWidth: 18 },
      { name: 'GDP impact (ppt)',     type: 'bar', data: get('gdpImpact'),      itemStyle: { color: '#4e8ac4' }, barMaxWidth: 18 },
    ],
  };
}

// ── Widget markup ─────────────────────────────────────────────────────────────

const WIDGET_HTML = `
<div class="osh-widget">
  <div class="osh-header">
    <div>
      <div class="osh-header-eyebrow">Interactive model</div>
      <h3 class="osh-header-title">Oil Shock Propagation Simulator</h3>
    </div>
    <p class="osh-header-desc">12 regions · 24 months · empirically-grounded elasticities</p>
  </div>

  <div class="osh-controls">
    <label class="osh-control">
      <span class="osh-control-label">Supply removed <em class="osh-unit">mb/d</em></span>
      <div class="osh-slider-row">
        <input class="js-shock-mag" type="range" min="5" max="20" step="0.5" value="15">
        <strong class="js-shock-mag-val">15.0</strong>
      </div>
    </label>

    <label class="osh-control">
      <span class="osh-control-label">Starting price <em class="osh-unit">$/bbl</em></span>
      <div class="osh-slider-row">
        <input class="js-base-price" type="range" min="60" max="100" step="1" value="69">
        <strong class="js-base-price-val">$69</strong>
      </div>
    </label>

    <label class="osh-control">
      <span class="osh-control-label">Duration</span>
      <select class="osh-select js-duration">
        <option value="2w">2 weeks</option>
        <option value="1m">1 month</option>
        <option value="3m" selected>3 months</option>
        <option value="6m">6 months</option>
        <option value="12m">12+ months</option>
      </select>
    </label>

    <label class="osh-control osh-control--toggle">
      <span class="osh-control-label">LNG disruption</span>
      <div class="osh-toggle-wrap">
        <input class="osh-toggle-input js-lng" type="checkbox" checked id="osh-lng">
        <label class="osh-toggle-label" for="osh-lng">
          <span class="osh-toggle-track"><span class="osh-toggle-thumb"></span></span>
          <span class="js-lng-label">On</span>
        </label>
      </div>
    </label>

    <label class="osh-control">
      <span class="osh-control-label">Historical overlay</span>
      <select class="osh-select js-historical">
        <option value="">None</option>
        <option value="1973">1973 Arab Embargo</option>
        <option value="1979">1979 Iranian Revolution</option>
        <option value="1990">1990 Gulf War</option>
        <option value="2008">2008 Price Spike</option>
        <option value="2022">2022 Russia–Ukraine</option>
      </select>
    </label>
  </div>

  <div class="osh-panels-top">
    <div class="osh-panel">
      <div class="osh-chart js-price-chart" style="height:252px;"></div>
    </div>
    <div class="osh-panel">
      <div class="osh-chart js-compare-chart" style="height:252px;"></div>
      <div class="osh-month-row">
        <span class="osh-month-label">Month</span>
        <input class="osh-month-slider js-month" type="range" min="0" max="23" step="1" value="6">
        <span class="js-month-val">6</span>
      </div>
    </div>
  </div>

  <div class="osh-panel osh-panel--heatmap">
    <div class="osh-chart osh-chart--heatmap js-heatmap-chart" style="height:320px;"></div>
  </div>

  <div class="osh-panel osh-panel--channels">
    <div class="osh-chart js-channels-chart" style="height:252px;"></div>
  </div>

  <details class="osh-notes">
    <summary class="osh-notes-summary">Methodology &amp; sources</summary>
    <div class="osh-notes-body">
      <p><strong>Oil → Inflation</strong><br>
      IMF WP/22/173 (Baba &amp; Lee 2022), Fed FEDS Notes (Bodenstein et al. 2024). Pass-through elasticity for core inflation rises from 0.002 at 1 quarter to 0.03 at 3 years. Higher in emerging economies and when base inflation exceeds 4%.</p>
      <p><strong>Oil → Food Prices</strong><br>
      World Bank (Baffes 2007). Oil-to-food commodity price elasticity: 0.18. Oil-to-fertiliser: 0.33. A 45% oil price decline historically reduces agricultural commodity prices by ~10%.</p>
      <p><strong>Oil → GDP</strong><br>
      IIF (2023). Global output elasticity to real oil prices declined from −0.028 (1960–1990) to −0.010 (1991–2022). Advanced economies; emerging effect is smaller on direct channel but amplified via food and currency.</p>
      <p><strong>Currency Amplification</strong><br>
      World Bank Commodity Markets Outlook (Oct 2022). 60% of oil-importing developing economies saw domestic oil prices rise even when USD prices fell.</p>
      <p><strong>Limitations</strong><br>
      Reduced-form simulation. Does not model monetary policy responses, SPR releases, OPEC+ adjustments, trade rerouting (Cape of Good Hope), or wage-price spirals. Lag functions are stylised IRF approximations. Regional parameters are illustrative composites. Designed to build intuition about propagation mechanics and regional asymmetry, not to generate point forecasts.</p>
    </div>
  </details>
</div>
`;

// ── Main renderer ─────────────────────────────────────────────────────────────

export function renderOilShock(el) {
  el.innerHTML = WIDGET_HTML;

  // Controls
  const shockMagInput   = el.querySelector('.js-shock-mag');
  const shockMagVal     = el.querySelector('.js-shock-mag-val');
  const basePriceInput  = el.querySelector('.js-base-price');
  const basePriceVal    = el.querySelector('.js-base-price-val');
  const durationSelect  = el.querySelector('.js-duration');
  const lngInput        = el.querySelector('.js-lng');
  const lngLabel        = el.querySelector('.js-lng-label');
  const historicalSelect= el.querySelector('.js-historical');
  const monthSlider     = el.querySelector('.js-month');
  const monthVal        = el.querySelector('.js-month-val');

  // Chart containers
  const priceEl    = el.querySelector('.js-price-chart');
  const compareEl  = el.querySelector('.js-compare-chart');
  const heatmapEl  = el.querySelector('.js-heatmap-chart');
  const channelsEl = el.querySelector('.js-channels-chart');

  // State
  let priceChart    = null;
  let compareChart  = null;
  let heatmapChart  = null;
  let channelsChart = null;
  let comparisonMonth   = 6;
  let selectedRegionId  = 'ssa';
  let currentSorted     = [];   // kept in sync so click handler always sees latest sort

  function getParams() {
    return {
      shockMagnitude: parseFloat(shockMagInput.value),
      basePrice:      parseInt(basePriceInput.value, 10),
      durationMonths: DURATION_MONTHS[durationSelect.value],
      lngDisruption:  lngInput.checked,
    };
  }

  function update() {
    const p = getParams();

    // Update display values
    shockMagVal.textContent = parseFloat(p.shockMagnitude).toFixed(1);
    basePriceVal.textContent = `$${p.basePrice}`;
    lngLabel.textContent     = p.lngDisruption ? 'On' : 'Off';

    const sim     = simulate(p);
    currentSorted = sortByPeakSeverity(sim);

    const selReg  = REGIONS.find(r => r.id === selectedRegionId) ?? REGIONS[8];
    const histKey = historicalSelect.value || null;

    // Price chart
    const pOpts = priceChartOpts(sim.prices, p.basePrice, histKey);
    if (priceChart) priceChart.setOption(pOpts, true);
    else priceChart = renderEChart(priceEl, pOpts);

    // Comparison bar chart
    const cOpts = comparisonOpts(sim, comparisonMonth);
    if (compareChart) compareChart.setOption(cOpts, true);
    else compareChart = renderEChart(compareEl, cOpts);

    // Heatmap — register click handler on first render only
    const hmOpts = heatmapOpts(sim, currentSorted);
    if (heatmapChart) {
      heatmapChart.setOption(hmOpts, true);
    } else {
      heatmapChart = renderEChart(heatmapEl, hmOpts);
      if (heatmapChart) {
        heatmapChart.on('click', ({ data }) => {
          if (!data) return;
          const [, regionIdx] = data;
          selectedRegionId = currentSorted[regionIdx]?.id ?? selectedRegionId;
          const reg  = REGIONS.find(r => r.id === selectedRegionId) ?? REGIONS[8];
          const sim2 = simulate(getParams());
          const chOpts = channelOpts(reg, sim2.regional[reg.id]);
          if (channelsChart) channelsChart.setOption(chOpts, true);
          else channelsChart = renderEChart(channelsEl, chOpts);
        });
      }
    }

    // Channel chart
    const chOpts = channelOpts(selReg, sim.regional[selReg.id]);
    if (channelsChart) channelsChart.setOption(chOpts, true);
    else channelsChart = renderEChart(channelsEl, chOpts);
  }

  // Month slider (updates comparison chart only)
  monthSlider.addEventListener('input', () => {
    comparisonMonth = parseInt(monthSlider.value, 10);
    monthVal.textContent = comparisonMonth;
    const sim  = simulate(getParams());
    const opts = comparisonOpts(sim, comparisonMonth);
    if (compareChart) compareChart.setOption(opts, true);
    else compareChart = renderEChart(compareEl, opts);
  });

  shockMagInput.addEventListener('input',    update);
  basePriceInput.addEventListener('input',   update);
  durationSelect.addEventListener('change',  update);
  lngInput.addEventListener('change',        update);
  historicalSelect.addEventListener('change',update);

  update();
}
