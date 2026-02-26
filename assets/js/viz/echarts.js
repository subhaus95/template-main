/**
 * echarts.js — Apache ECharts wrapper
 *
 * Requires echarts.min.js to be loaded from CDN (added by default.hbs
 * when the post carries tag "viz").
 *
 * Provides a theme-aware initialisation that respects the site's
 * light/dark toggle, and cleans up automatically via ResizeObserver.
 */

// ── Default palette ───────────────────────────────────────────────────────────
// Registered once as a named ECharts theme so individual charts don't need
// to repeat color config.

const LOOM_THEME = {
  color: [
    '#F0177A', '#10B981', '#F59E0B', '#1B6FEE',
    '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16',
  ],
  backgroundColor: 'transparent',
  textStyle: {},
  title: {
    textStyle: { color: 'var(--text, #111110)', fontSize: 14, fontWeight: 'normal' },
    subtextStyle: { color: 'var(--text-2, #6B6860)' },
  },
  legend: {
    textStyle: { color: 'var(--text-2, #6B6860)' },
  },
  categoryAxis: {
    axisLine:  { lineStyle: { color: 'var(--border, #E4E2DF)' } },
    axisLabel: { color: 'var(--text-2, #6B6860)' },
    splitLine: { lineStyle: { color: 'var(--border, #E4E2DF)', type: 'dashed' } },
  },
  valueAxis: {
    axisLine:  { show: false },
    axisLabel: { color: 'var(--text-2, #6B6860)' },
    splitLine: { lineStyle: { color: 'var(--border, #E4E2DF)', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: 'var(--card-bg, #fff)',
    borderColor: 'var(--border, #E4E2DF)',
    textStyle: { color: 'var(--text, #111110)' },
  },
};

let themeRegistered = false;

function ensureTheme(echarts) {
  if (themeRegistered) return;
  echarts.registerTheme('loom', LOOM_THEME);
  themeRegistered = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise an ECharts instance on `el` with the given options.
 * Returns the chart instance so callers can call setOption() later,
 * or null if ECharts is not available.
 *
 * @param {HTMLElement} el
 * @param {object} options  ECharts setOption-compatible config object
 * @returns {object|null}   ECharts instance or null
 */
export function renderEChart(el, options) {
  const echarts = window.echarts;
  if (!echarts) return null;

  ensureTheme(echarts);

  // Dispose any previous instance on this element (idempotent)
  const existing = echarts.getInstanceByDom(el);
  if (existing) existing.dispose();

  const chart = echarts.init(el, 'loom', { renderer: 'canvas' });
  chart.setOption(options);

  // Keep chart correctly sized when the container resizes
  const observer = new ResizeObserver(() => {
    if (!chart.isDisposed()) chart.resize();
  });
  observer.observe(el);

  // Clean up when element is removed from DOM
  const mo = new MutationObserver((_, obs) => {
    if (!document.contains(el)) {
      chart.dispose();
      observer.disconnect();
      obs.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return chart;
}

/**
 * Update an ECharts instance in response to a scroll step.
 *
 * Called by core.js when a story step's data-update targets an ECharts element.
 * `data` is a partial ECharts setOption-compatible object — it is merged into
 * the existing chart options (notMerge = false).
 *
 * @param {HTMLElement} el
 * @param {object}      data      Partial ECharts option object.
 * @param {object|null} instance  The ECharts chart instance returned by renderEChart().
 */
export function updateEChart(el, data, instance) {
  if (instance && typeof instance.setOption === 'function') {
    instance.setOption(data, false); // false = merge, not replace
  }
}
