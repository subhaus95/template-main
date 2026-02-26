/**
 * core.js — Loom theme visualization runtime
 *
 * Registry-driven: reads REGISTRY from viz-registry.js, detects which
 * libraries are needed, loads CDN assets, initialises adapters, renders
 * per-element visualisations, and wires scrolly step updates.
 *
 * ── How it works ──────────────────────────────────────────────────────────────
 *   1. Detection  — each registry entry's detect() is called.
 *   2. CDN load   — styles + scripts for detected libraries are loaded.
 *   3. Init       — optional one-time init() is called (KaTeX, Mermaid).
 *   4. Render     — for entries with a selector, each matching element
 *                   gets render(el, options) called.
 *   5. Scrolly    — story:step events from narrative.js are routed to
 *                   the matching element's update() based on data-update JSON.
 *
 * ── Adding a new library ──────────────────────────────────────────────────────
 *   1. Create assets/js/viz/your-lib.js  (init, render, update exports)
 *   2. Add an entry to REGISTRY in viz-registry.js
 *   3. Add a body-class flag in _layouts/default.html if needed
 *   4. Add the flag to post front matter
 *
 * Body-class flags (set by Jekyll layouts via front matter):
 *   math: true     → tag-hash-math
 *   diagram: true  → tag-hash-diagram
 *   viz: true      → tag-hash-viz
 *   geo: true      → tag-hash-geo
 *   leaflet: true  → tag-hash-leaflet
 *   d3: true       → tag-hash-d3
 *   story: true    → tag-hash-story  (used by essay/core.js for Scrollama)
 */

import { REGISTRY } from './viz-registry.js';

// ── CDN loaders ───────────────────────────────────────────────────────────────

function loadStyle(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  l.crossOrigin = 'anonymous';
  document.head.appendChild(l);
}

function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload  = resolve;
    s.onerror = resolve; // resolve on error so await doesn't hang
    document.head.appendChild(s);
  });
}

async function loadCDN({ styles = [], scripts = [] } = {}) {
  styles.forEach(loadStyle);
  for (const src of scripts) await loadScript(src);
}

// ── Element ID helper ─────────────────────────────────────────────────────────

let autoId = 0;
function ensureId(el) {
  if (!el.id) el.id = `loom-viz-${++autoId}`;
  return el.id;
}

// ── Instance store ────────────────────────────────────────────────────────────
// Maps element id → { entry, el, instance } so scrolly updates can look up
// the right adapter + instance by the id in data-update JSON.

const instances = new Map();

// ── Scrolly wiring ────────────────────────────────────────────────────────────
// narrative.js dispatches story:step (bubbles: true) with detail.element
// pointing to the active story step element.
//
// If that element has data-update JSON, core.js routes each key → the
// matching registry entry's update() function.
//
// Example step element:
//   <div class="story-step" data-step="1"
//        data-update='{"city-map": {"lat": 48.858, "lng": 2.295, "zoom": 14}}'>

function wireScrolly() {
  document.addEventListener('story:step', (e) => {
    const stepEl = e.detail?.element;
    if (!stepEl?.dataset.update) return;

    let updates;
    try {
      updates = JSON.parse(stepEl.dataset.update);
    } catch {
      return;
    }

    Object.entries(updates).forEach(([id, data]) => {
      const rec = instances.get(id);
      if (!rec?.entry.update) return;
      rec.entry.update(rec.el, data, rec.instance);
    });
  });
}

// ── Reading progress bar ──────────────────────────────────────────────────────
// Adds a fixed 2px progress bar at the top of the viewport on post pages.
// Essay pages already get this from essay/progress.js; skipped here to avoid
// double-mounting.

function initPostProgress() {
  if (document.getElementById('essay-content')) return; // essay handles it
  if (!document.querySelector('.post-main')) return;    // only on post pages

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bar = document.createElement('div');
  bar.className = 'essay-progress-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');
  document.body.prepend(bar);

  if (prefersReduced) return;

  let ticking = false;

  function update() {
    const scrolled  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? Math.min(100, (scrolled / maxScroll) * 100) : 0;
    bar.style.setProperty('--progress', `${pct}%`);
    bar.setAttribute('aria-valuenow', Math.round(pct));
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

// ── Copy buttons ──────────────────────────────────────────────────────────────
// Adds a "Copy" button to every <pre><code> block in .gh-content.
// essay/core.js does the same for #essay-content; this covers regular posts.
// Skipped on essay pages to avoid double-adding buttons.

function addCopyButtons() {
  if (document.getElementById('essay-content')) return; // essay/core.js handles it
  document.querySelectorAll('.gh-content pre > code').forEach((code) => {
    const pre = code.parentElement;
    if (pre.querySelector('.copy-btn')) return;

    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        btn.textContent = 'Copied!';
        btn.classList.add('copy-btn--done');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copy-btn--done');
        }, 2000);
      } catch {
        btn.textContent = 'Error';
      }
    });

    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
}

// ── Main init ─────────────────────────────────────────────────────────────────

async function init() {
  // Pass the main content element to detect() so it can check text content
  // (used by math detection to find bare $ signs).
  const content = document.querySelector('.gh-content, .essay-content, .post-content, article');

  for (const entry of REGISTRY) {
    if (!entry.detect(content)) continue;

    await loadCDN(entry.cdn);

    if (entry.init) await entry.init();

    if (entry.selector) {
      const els = Array.from(document.querySelectorAll(entry.selector));
      for (const el of els) {
        const id = ensureId(el);
        let opts = {};
        try {
          if (el.dataset.options) opts = JSON.parse(el.dataset.options);
        } catch {
          console.warn('[loom] Invalid data-options JSON on', el);
        }
        const instance = entry.render ? await entry.render(el, opts) : null;
        instances.set(id, { entry, el, instance });
      }
    }
  }

  initPostProgress();
  addCopyButtons();
  wireScrolly();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
