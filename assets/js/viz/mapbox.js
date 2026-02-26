/**
 * mapbox.js — Mapbox GL JS wrapper
 *
 * Requires mapbox-gl.js and mapbox-gl.css (loaded from Mapbox CDN by the viz
 * registry when a page has geo: true front matter or a [data-map] element).
 *
 * Declarative usage in posts:
 *   <div data-map="calgary" style="height:500px;"></div>
 *   <div data-map="custom" data-center="-113.5,51.0" data-zoom="10" style="height:400px;"></div>
 *   <div data-map="custom" data-center="7.82,45.97" data-zoom="13"
 *        data-pitch="55" data-bearing="170"
 *        data-terrain="1.5"
 *        data-style="mapbox://styles/mapbox/satellite-streets-v12"
 *        style="height:500px;"></div>
 *
 * Access token (in order of precedence):
 *   1. data-token attribute on the element
 *   2. window.MAPBOX_TOKEN (injected by head.html from site.mapbox_token in _config.yml)
 *
 * 3D terrain:
 *   data-terrain        — enable terrain with default exaggeration (1.5)
 *   data-terrain="2.0"  — enable terrain with custom exaggeration
 *   Adds Mapbox DEM source, setTerrain(), and an atmosphere sky layer.
 *   Best combined with data-pitch > 0 and satellite-streets-v12 or outdoors-v12.
 */

// ── Preset locations ──────────────────────────────────────────────────────────

const PRESETS = {
  calgary:    { center: [-114.0719,  51.0447], zoom: 11 },
  edmonton:   { center: [-113.4938,  53.5461], zoom: 11 },
  vancouver:  { center: [-123.1207,  49.2827], zoom: 11 },
  toronto:    { center: [ -79.3832,  43.6532], zoom: 11 },
  world:      { center: [   0,       20     ], zoom:  1.5 },
  zermatt:    { center: [   7.7491,  46.0207], zoom: 13 },
  findelen:   { center: [   7.840,   46.012 ], zoom: 13 },
  gorner:     { center: [   7.820,   45.970 ], zoom: 12 },
  chamonix:   { center: [   6.869,   45.924 ], zoom: 12 },
  peyto:      { center: [-116.530,   51.715 ], zoom: 13 },
  athabasca:  { center: [-117.245,   52.190 ], zoom: 12 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCenter(str) {
  if (!str) return null;
  const parts = str.split(',').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts;
  return null;
}

function showError(el, message) {
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.background = 'var(--bg3, #EEECEA)';
  el.style.borderRadius = 'var(--radius, 12px)';
  el.innerHTML = `<p style="color:var(--text-3,#9C9890);font-size:0.875rem;padding:16px;text-align:center;">${message}</p>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise a Mapbox map inside `el`.
 *
 * Config precedence (highest first):
 *   1. data-* attributes on the element
 *   2. `config` argument
 *   3. Named preset from PRESETS
 *   4. Fallback defaults
 *
 * @param {HTMLElement} el
 * @param {object} config  Optional overrides: { center, zoom, pitch, bearing, style }
 * @returns {object|null}  Mapbox Map instance or null on failure
 */
export function renderMap(el, config = {}) {
  const mapboxgl = window.mapboxgl;
  if (!mapboxgl) return null;

  // Ensure the container has a height
  if (!el.style.height && el.offsetHeight === 0) {
    el.style.height = '400px';
  }

  // Resolve access token
  const token =
    el.dataset.token ||
    window.MAPBOX_TOKEN ||
    null;

  if (!token) {
    showError(
      el,
      'Map unavailable: no Mapbox access token found.<br>' +
      'Set <code>mapbox_token:</code> in <code>_config.yml</code>.'
    );
    return null;
  }

  mapboxgl.accessToken = token;

  // Resolve location / camera
  const locationKey = el.dataset.map;
  const preset = PRESETS[locationKey] ?? {};

  const center =
    parseCenter(el.dataset.center) ??
    config.center ??
    preset.center ??
    [0, 0];

  const zoom =
    (el.dataset.zoom    ? parseFloat(el.dataset.zoom)    : null) ??
    config.zoom    ??
    preset.zoom    ??
    2;

  const pitch =
    (el.dataset.pitch   ? parseFloat(el.dataset.pitch)   : null) ??
    config.pitch   ??
    0;

  const bearing =
    (el.dataset.bearing ? parseFloat(el.dataset.bearing) : null) ??
    config.bearing ??
    0;

  const style =
    el.dataset.style ??
    config.style ??
    'mapbox://styles/mapbox/outdoors-v12';

  let map;
  try {
    map = new mapboxgl.Map({ container: el, style, center, zoom, pitch, bearing });
  } catch (err) {
    showError(el, 'Map failed to initialise. Check the browser console for details.');
    return null;
  }

  // 3D terrain — enabled by data-terrain (presence) or data-terrain="1.5" (exaggeration)
  if (el.dataset.terrain !== undefined) {
    const exaggeration = parseFloat(el.dataset.terrain) || 1.5;
    map.on('load', () => {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration });
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    });
  }

  // Keep map sized correctly when the container resizes
  const observer = new ResizeObserver(() => map.resize());
  observer.observe(el);

  return map;
}

/**
 * Update a Mapbox map instance in response to a scroll step.
 *
 * Called by core.js when a story step with data-update targets this element.
 *
 * @param {HTMLElement}  el
 * @param {object}       data      Keys: center ([lng,lat]), zoom, pitch, bearing, animate (default true)
 * @param {object}       instance  Mapbox Map instance returned by renderMap()
 */
export function updateMap(el, data, instance) {
  if (!instance) return;
  const { center, zoom, pitch, bearing, animate = true } = data;
  const duration = animate ? 1500 : 0;

  const flyOptions = { duration };
  if (center       != null) flyOptions.center  = center;
  if (zoom         != null) flyOptions.zoom     = zoom;
  if (pitch        != null) flyOptions.pitch    = pitch;
  if (bearing      != null) flyOptions.bearing  = bearing;

  if (Object.keys(flyOptions).length > 1) {
    instance.flyTo(flyOptions);
  }
}
