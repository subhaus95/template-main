# Development Path & Architecture

A narrative record of how this multi-site publishing platform was built — the decisions made, the principles followed, and why things are the way they are.

---

## Table of contents

1. [Starting point](#1-starting-point)
2. [Phase 1 — Template design and build system](#2-phase-1--template-design-and-build-system)
3. [Phase 2 — Feature buildout](#3-phase-2--feature-buildout)
4. [Phase 3 — Multi-site submodule architecture](#4-phase-3--multi-site-submodule-architecture)
5. [Phase 4 — Multi-brand system](#5-phase-4--multi-brand-system)
6. [Phase 5 — Site identity scaffolding](#6-phase-5--site-identity-scaffolding)
7. [Architecture principles](#7-architecture-principles)
8. [Open questions and future directions](#8-open-questions-and-future-directions)

---

## 1. Starting point

Five GitHub Pages sites existed, each running the [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) Jekyll theme independently. They shared an author and a general technical orientation but had no shared code, no design coherence, and no mechanism for propagating improvements across the family. Each site accumulated its own configuration drift.

The old theme had served its purpose. It was opinionated in ways that no longer fit — heavy DOM, dated typography, no dark mode, no computational essay capability, and no sensible path toward a shared design system across multiple independent publications.

> **Decision point: fork vs. build**
> The choice to build a new theme from scratch rather than fork Minimal Mistakes was deliberate. Forking would have meant inheriting Sass variables, a SCSS architecture, and a component model that predated modern CSS custom properties and ES modules. A clean build with Vite, Tailwind, and CSS custom properties gave a better foundation for the multi-site ambitions. The cost was time; the benefit was complete control over every layer.

---

## 2. Phase 1 — Template design and build system

The new theme ([`template-main`](https://github.com/subhaus95/template-main)) was built with **Loom Collective** as the reference implementation — the most editorially demanding of the five sites, requiring long-form computational essays, interactive visualisations, dark mode, mathematical typesetting, and scrollytelling.

### Build stack

```
Jekyll          Static site generator — content model, layouts, Liquid templating
Tailwind CSS    Utility-first CSS — class scanning from layouts, includes, pages, posts
Vite            Module bundler — ES modules, tree shaking, fast dev server
PostCSS         CSS processing pipeline (autoprefixer, future syntax)
Alpine.js       Reactive UI — dark mode toggle, search overlay, mobile nav
```

Tailwind was chosen over plain CSS for its utility scanning — it reads every template file and emits only the classes actually used. Combined with Vite's tree shaking, the production bundle is tight regardless of how many utilities or components are defined.

> **Decision point: Tailwind in a Jekyll theme**
> The friction point with Tailwind + Jekyll is that Tailwind scans source files for class names at build time, but Jekyll writes the final HTML at build time too. The solution is to point Tailwind's `content` at the source templates (`_layouts/`, `_includes/`, `_pages/`, `_posts/`) rather than at Jekyll's `_site/` output. Vite runs first (`npm run build`), then Jekyll. This order matters — it is baked into both the local dev instructions and the CI workflow.
>
> Further reading: [Tailwind content configuration](https://tailwindcss.com/docs/content-configuration) · [Vite + Jekyll integration patterns](https://vitejs.dev/guide/backend-integration)

### Vite output routing

The submodule architecture created a subtle build routing problem: Vite runs inside `theme/` but the site's production assets must live at `/assets/dist/` — outside the submodule, in the site root. This is solved by a single line in `vite.config.js`:

```js
outDir: resolve(__dirname, '../assets/dist'),
```

When `theme/` is a git submodule, `__dirname` is the submodule path, so `../assets/dist` resolves to the parent site repo's asset directory. Production URLs (`/assets/dist/main.css`, `/assets/dist/main.js`) carry no `/theme/` prefix anywhere.

> **Decision point: asset path strategy**
> The alternative was to serve assets from within `theme/assets/dist/` and configure Jekyll's `sass_dir` and asset pipeline accordingly. This was rejected because it would have embedded the submodule path into every template, making the theme harder to use standalone and complicating CSP headers if added later.
>
> Further reading: [Vite build options — outDir](https://vitejs.dev/config/build-options#build-outdir)

### CSS architecture

Three layers in the CSS build:

```
src/main.css         Design tokens + all components (compiled by Vite → assets/dist/main.css)
assets/css/syntax.css    Syntax highlighting (GitHub Light + One Dark), search overlay, print
assets/css/brand-*.css   Per-site token overrides only (not compiled by Vite, copied by rsync)
```

The key structural choice was **CSS custom properties for every design token** — colours, fonts, spacing, radii. Tailwind's `theme.extend` points to these variables rather than hard-coding values:

```js
colors: {
  accent: 'var(--accent)',
  bg: 'var(--bg)',
  // ...
}
```

This means Tailwind utilities like `text-accent` and `bg-bg2` resolve to the site's active brand token at runtime, not at build time. Dark mode, brand switching, and theming all work via attribute changes on `<html>` without recompiling CSS.

> Further reading: [CSS custom properties — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) · [Tailwind CSS variables bridge](https://tailwindcss.com/docs/customizing-colors#using-css-variables) · [Tailwind darkMode selector strategy](https://tailwindcss.com/docs/dark-mode#using-a-selector)

### Visualisation runtime

Long-form computational essays need more than Markdown. The `assets/js/` directory contains a complete, Jekyll-independent visualisation system:

```
core.js             Runtime orchestrator: detect → CDN load → init → render → scrolly update
viz-registry.js     Central registry: maps library names to detect/init/render/update adapters
viz/echarts.js      Apache ECharts adapter
viz/d3.js           D3 v7 selective import (esm.sh, ~120 KB vs full 560 KB)
viz/leaflet.js      Leaflet maps adapter with dark-mode tile swap
viz/mapbox.js       Mapbox GL JS adapter
viz/math.js         KaTeX render trigger
viz/diagrams.js     Mermaid diagram trigger
models/ricker.js    Domain-specific model (Ricker population dynamics)
```

The registry pattern means adding a new visualisation library requires: create an adapter file, add an entry to the registry, add a body-class flag if needed. The core runtime does not change.

```js
// How core.js works — simplified
const detected = REGISTRY.filter(entry => entry.detect());
await loadCDNAssets(detected);
detected.forEach(entry => entry.init?.());
detected.forEach(entry => {
  document.querySelectorAll(entry.selector).forEach(el => entry.render(el, options));
});
```

CDN assets are loaded lazily — only the libraries actually needed by a given post are fetched. A post with no maps loads no Leaflet or Mapbox. The body-class flags (`tag-hash-math`, `tag-hash-viz`, etc.) set by Jekyll layouts trigger detection.

> **Decision point: CDN vs. bundle**
> Bundling D3, ECharts, Leaflet, and Mapbox into the main JS bundle would produce an ~800 KB initial load. CDN loading means posts that need none of them pay nothing. The trade-off is a CDN dependency — mitigated by `<link rel="preconnect">` hints for jsDelivr and esm.sh, and by the fact that major CDN assets are often already in browser cache from other sites.
>
> Further reading: [Import maps and CDN strategies](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) · [D3 selective imports via esm.sh](https://esm.sh/#using-import-maps) · [Pagefind static search](https://pagefind.app/)

---

## 3. Phase 2 — Feature buildout

With the foundation in place, the theme was built out feature by feature. The full backlog is in `ROADMAP.md`; the completed items are summarised here by category.

### Content infrastructure

| Feature | Implementation |
|---|---|
| Jekyll archives (tags, categories) | `jekyll-archives` gem; `topic.html` and `tag.html` layouts |
| Post series | `series:` + `series_order:` front matter; `_includes/series-nav.html` |
| Multi-author | `_data/authors.yml`; author byline, card, and profile page includes |
| Drafts workflow | `_drafts/` + `scripts/new-draft.sh` + `scripts/publish.sh` |
| Published + last-modified dates | `jekyll-last-modified-at` gem; `fetch-depth: 0` in CI |

### Reader experience

| Feature | Implementation |
|---|---|
| Dark mode | Alpine.js `darkMode` component; `localStorage` key `'theme'`; `data-theme` on `<html>` |
| Full-text search | Pagefind (`npx pagefind --site _site` in CI); overlay via Alpine event dispatch; `⌘K` shortcut |
| Reading progress + time estimate | `initPostProgress()` in `core.js` |
| Syntax highlighting | `assets/css/syntax.css`; GitHub Light + One Dark dark-mode variant |
| Comments | Giscus (GitHub Discussions); dark mode sync via `MutationObserver`; opt-in via `comments: true` front matter |
| Related posts | Tag-intersection scoring; wired into post and essay layouts |
| RSS/subscribe CTA | `_includes/subscribe-cta.html`; wired into post and essay layouts |
| Print / PDF | `@media print` in `essay.css`; hides chrome, single-column reflow, link URL expansion |

### Infrastructure

| Feature | Implementation |
|---|---|
| Selective D3 import | `esm.sh` dynamic import with only 14 used functions; ~120 KB vs 560 KB |
| Lazy image loading | `_plugins/lazy_images.rb` post-render hook; adds `loading="lazy"` to unattributed `<img>` |
| Analytics | Cloudflare Web Analytics; `analytics_token:` in `_config.yml`; conditional script in `head.html` |
| CI performance | npm + Bundler cache in Actions; build time roughly halved |
| Preconnect hints | `<link rel="preconnect">` for jsDelivr, unpkg, Google Fonts |

> **Decision point: Pagefind over Algolia/Lunr**
> Static search (Pagefind) was chosen over a hosted search service (Algolia) and over client-side index (Lunr.js). Pagefind runs after `jekyll build` in CI, produces a static index, and is fetched by the browser as a dynamic import only when the search overlay is opened. No API key, no external service dependency, no index size limit for the current scale. The upgrade path to Algolia exists if the archive grows past ~500 posts.
>
> Further reading: [Pagefind architecture](https://pagefind.app/docs/running-pagefind/) · [Giscus — GitHub Discussions comments](https://giscus.app/) · [jekyll-last-modified-at](https://github.com/gjtorikian/jekyll-last-modified-at)

---

## 4. Phase 3 — Multi-site submodule architecture

The moment more than one site needed the same template, the sharing strategy had to be decided.

### Options considered

| Approach | Mechanism | Coupling |
|---|---|---|
| GitHub template repo | Copy once at fork time | Zero — diverges immediately |
| npm package | `npm install @org/theme` | Loose — versioned, explicit update |
| **Git submodule** | `theme/` tracks a remote ref | Moderate — controlled, explicit update |
| Git subtree | `git subtree push/pull` | Tight — history merges |
| Monorepo | All sites in one repo | Tight — one deploy pipeline for all |

> **Decision point: git submodule over template copy**
> A template copy gives full site independence but means improvements never propagate. A monorepo keeps everything in sync but collapses five independent publishing identities into one repository with one CI pipeline. The git submodule sits in the middle: each site repo is independently deployable and independently authored, but all share a pointer to the same `template-main` commit. Updating is explicit (`git submodule update --remote`) — never surprising.
>
> Further reading: [Git submodules — Pro Git book](https://git-scm.com/book/en/v2/Git-Tools-Submodules) · [Submodule vs subtree comparison](https://andrey.nering.com.br/2016/git-submodules-vs-git-subtrees/) · [GitHub Actions submodule checkout](https://github.com/actions/checkout#usage)

### Submodule directory layout

```
site-repo/
├── theme/                  ← git submodule (subhaus95/template-main)
│   ├── _layouts/
│   ├── _includes/
│   ├── _plugins/
│   ├── src/                ← Vite source (main.js, main.css)
│   └── assets/
│       ├── css/            ← brand files + syntax.css (rsync'd to site root)
│       └── js/             ← core.js, viz-registry.js (rsync'd to site root)
├── assets/
│   ├── dist/               ← Vite build output (main.css, main.js)
│   ├── css/                ← brand CSS + syntax CSS (rsync'd from theme/assets/css/)
│   └── js/                 ← core.js, viz-registry.js (rsync'd from theme/assets/js/)
├── _posts/
├── _pages/
├── _config.yml             ← site-specific; points layouts/includes/plugins at theme/
└── index.html
```

Jekyll's `_config.yml` uses three override keys to read layouts, includes, and plugins from inside the submodule without changing how URLs or the rest of the site work:

```yaml
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins
```

### CI workflow

The build pipeline in every site repo follows the same sequence:

```
1. git checkout --recurse-submodules
2. npm ci              (from theme/)
3. npm run build       (Vite → ../assets/dist/)
4. rsync -a theme/assets/css/ assets/css/
   rsync -a theme/assets/js/  assets/js/
5. bundle exec jekyll build
6. npx pagefind --site _site
7. upload artifact → deploy to GitHub Pages
```

The rsync steps copy brand CSS and the viz runtime from the submodule into the site root so Jekyll can reference them at their final URL paths (`/assets/css/brand-loom.css`, `/assets/js/core.js`). No `/theme/` prefix appears in any published URL.

> **Decision point: rsync over symlinks**
> Symlinks inside a git submodule don't resolve reliably across operating systems and CI environments. `rsync -a` is a single, explicit command with clear semantics: copy these files here, overwriting what's there. It runs in under a second and eliminates an entire class of "works on my machine" CI failures.

### Update workflow

```bash
# In template-main — after making and pushing a template change:
git commit -m "..." && git push

# In each site repo — to pull the latest template:
git submodule update --remote
git add theme
git commit -m "Update theme"
git push
```

Each site updates on its own schedule. A template change never auto-deploys to any site — site maintainers choose when to take it.

---

## 5. Phase 4 — Multi-brand system

Five sites share one compiled stylesheet (`main.css`) but need distinct visual identities: different accent colours, different default modes (some dark by default, some light), and eventually different typefaces.

### Token architecture

The design token system has two tiers:

**Tier 1 — Base tokens** defined in `src/main.css`, compiled into `assets/dist/main.css`:

```css
:root {
  --accent:       #F0177A;   /* overridden per brand */
  --bg:           #FFFFFF;
  --text:         #111111;
  /* ... full palette, spacing, radii */
}
[data-theme="dark"] {
  --bg:           #0F0F0F;
  --text:         #EEEEEE;
}
```

**Tier 2 — Brand overrides** in `assets/css/brand-{name}.css`, loaded after `main.css`:

```css
[data-brand="loom"] {
  --accent: #F0177A;        /* magenta */
}
[data-brand="loom"][data-theme="dark"] {
  --accent-light: #45081C;
}
```

Brand files contain *only* the tokens that differ from the base. A brand with no typographic distinction from the defaults is just three lines.

### Runtime switching

`_layouts/default.html` sets both attributes on `<html>` at server render time:

```html
<html lang="en"
      data-brand="{{ site.brand | default: 'loom' }}"
      data-theme="{{ site.brand_default_theme | default: 'light' }}">
```

`data-brand` never changes during a session. `data-theme` is toggled by Alpine.js in response to the dark mode button, and the chosen value is persisted in `localStorage` under the key `'theme'`.

Flash prevention (the brief white flash before dark mode activates) is handled in `_includes/head.html` with an inline script that reads `localStorage` and sets `data-theme` before the first paint, before any stylesheet is applied.

> **Decision point: data attributes over CSS classes**
> The conventional approach to theming is `<body class="dark">`. Attribute selectors (`[data-theme="dark"]`) are semantically richer (the attribute name carries intent, not just state), compose cleanly with brand selectors (`[data-brand="loom"][data-theme="dark"]`), and avoid class-name collisions with Tailwind utilities. The only cost is slightly more verbose CSS selectors — an acceptable trade.
>
> Further reading: [CSS attribute selectors — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors) · [Alpine.js reactivity model](https://alpinejs.dev/advanced/reactivity) · [Flash of unstyled content prevention](https://css-tricks.com/flash-of-inaccurate-color-theme-fout/)

### Brand registry

Each site's `_config.yml` declares its brand:

```yaml
brand: loom          # controls which brand-{name}.css is loaded
brand_name: "Loom Collective"
brand_default_theme: "dark"
```

`_includes/head.html` auto-loads `brand-{{ site.brand }}.css` after `main.css`. Adding a new brand is: create `assets/css/brand-{name}.css`, set `brand: {name}` in `_config.yml`.

| Site | Brand key | Default mode | Accent |
|---|---|---|---|
| loomcollective | `loom` | dark | Magenta `#F0177A` |
| pauldhobson | `paul` | light | (base) |
| qshift | `qshift` | dark | (base) |
| waywardhouse | `wayward` | light | (base) |
| subhaus95 | `subhaus` | dark | (base) |

---

## 6. Phase 5 — Site identity scaffolding

With the shared infrastructure stable, the five sites were still publishing under identical navigation, identical descriptions, and placeholder content. This phase established distinct identities without touching the shared template or the demo post content.

### Scope

- **template-main**: one include change (`subscribe-cta.html`)
- **per site**: `_config.yml` navigation, `_pages/` static pages, `index.html` where homepage layout differs

### subscribe-cta.html — generic + suppressible

The include had hardcoded text from Loom Collective's original editorial description. Two changes made it generic:

1. Replace hardcoded description with `{{ site.description }}`
2. Wrap the entire include in `{% unless site.hide_subscribe_cta %}`

Sites that are not subscription-driven (pauldhobson, subhaus95) set `hide_subscribe_cta: true` in `_config.yml` and the block renders nothing. No layout changes required.

> **Decision point: config flag over layout override**
> The alternative was to create a variant layout that omits the CTA include. A config flag is simpler: one key, zero new files, and the suppression logic lives in one place (the include itself). The `unless` guard also means the include is safe to call from any layout on any site — it handles its own visibility.

### Navigation as config

Navigation is defined entirely in `_config.yml` — no template changes required to restructure a site's nav:

```yaml
navigation:
  - title: Now
    url: /now/
secondary_navigation:
  - title: About
    url: /about/
```

The constraint this creates: every URL declared in navigation must have a corresponding page that resolves to that path. All nav entries were verified against `_pages/` file listings before committing.

### Custom homepages

Two sites needed a different homepage structure than the default magazine-grid `layout: home`:

**pauldhobson** — executive landing page. No post grid, no pagination. A hero statement, three hardcoded "selected work" stub cards, a recent posts loop (limited to 3), and a contact CTA section. Uses `layout: default` so it shares header/footer but controls its own body entirely.

**subhaus95** — lab notebook. A `<pre>`-wrapped terminal-style intro block (monospace, no styling beyond font), a /now section, a dense Liquid post list (date + title + category tag, no card grid), and quick links. Deliberately low-design — the monospace aesthetic is the identity.

> **Decision point: inline styles on custom homepages**
> The custom index files use a small number of inline `style` attributes (for spacing and flex layout) rather than introducing new CSS classes. These pages are one-offs — they will not be reused across sites, and adding utility classes to Tailwind's scan would pull in CSS for patterns used nowhere else. Inline styles on unique layouts are not a code smell; they are appropriate scope management.

### Page inventory by site

| Site | Pages added | Notes |
|---|---|---|
| **loomcollective** | about (rewrite), collections, start-here, contact | Mission reframe: AI + institutions |
| **pauldhobson** | about, resume, projects, contact, archive, 404, privacy, terms | Executive profile |
| **qshift** | about, topics, method, briefings, contact, archive, 404, privacy, terms | Industry analysis |
| **waywardhouse** | about, series, method, maps, alberta, contact, archive, topics, 404, privacy, terms | Publishing house |
| **subhaus95** | now, stack, notes, builds, archive, about, 404, privacy, terms | Homelab notebook |

---

## 7. Architecture principles

The decisions above were not made in isolation. Several consistent principles shaped the system.

### Separation of concerns across layers

```
Layer          Responsibility                    Owned by
─────────────────────────────────────────────────────────
Design tokens  Colors, fonts, spacing            Brand CSS + src/main.css
Components     Nav, cards, footer, post body     src/main.css via Tailwind
Layouts        Page structure                    _layouts/ + _includes/
Viz system     Interactive content               assets/js/
Content        Posts, pages, config              Site repos
```

Each layer can change independently. A brand token change requires editing one CSS file. A layout change requires editing one HTML template. A site's navigation requires editing one YAML block.

### Minimal coupling between sites and template

The submodule is updated explicitly, not automatically. Sites can run ahead of or behind the template. When a template change breaks something, the breakage appears when a site maintainer runs `git submodule update --remote` and tests locally — not at deploy time.

### Config over code

Where a site needs to differ from the template default, the preferred mechanism is a `_config.yml` key (`hide_subscribe_cta`, `brand`, `navigation`) rather than a template override or a new layout file. Config differences are visible, diffable, and don't require understanding the template internals.

### Production URLs carry no implementation detail

No URL on any site contains `/theme/`, `/assets/dist/`, or any other path that exposes the build system. A reader seeing `/assets/css/brand-loom.css` in their network tab learns only that brand CSS exists — not how the template is structured or deployed.

### Build outputs are not source

The `_site/` directory is in `.gitignore` on all site repos. Generated HTML is not the source of truth; the source files are. (Some earlier site repos had `_site/` tracked in git as an artefact of the old Minimal Mistakes setup — this predates the current architecture and should be cleaned up with `git rm -r --cached _site/`.)

### Explicit over implicit

- Static asset copying uses `rsync` rather than symlinks
- Submodule updates are manual rather than automated
- CDN library loading is triggered by explicit body-class flags set by front matter, not by scanning post HTML for library-specific elements
- Brand CSS is loaded by explicit file naming convention, not auto-discovery

---

## 8. Open questions and future directions

Items from `ROADMAP.md` that remain open, plus architectural questions that arise from the current state.

### Near term

| Item | Notes |
|---|---|
| Clean up tracked `_site/` | `git rm -r --cached _site/` on pauldhobson, qshift, subhaus95. One-time cleanup. |
| Split design tokens into `src/tokens.css` | Separates "what the site looks like" from "how components are built". Prerequisite for clean per-site token forks if needed. |
| CSP headers | A `_headers` file or Cloudflare configuration. CDN scripts need nonce or hash allowlisting. |
| Version history via GitHub releases | Tag releases as `post-slug/v2`, surface a "previous versions" link. Signals editorial rigour. |

### Longer horizon

| Item | Notes |
|---|---|
| Quarto → Jekyll pipeline | `.qmd` files → `quarto render` → Markdown + static figures → Jekyll. The missing piece for proper computational content authorship. See architecture note in `ROADMAP.md`. |
| EPUB export | `make epub SERIES=...` via Pandoc. Groups posts by `series:` front matter. KaTeX → MathML is the main technical challenge. |
| Pyodide for live computation | Python-in-WASM for interactive exercises. ~8 MB first load; worth it only where the learning requires running code, not just seeing it. |
| Webmentions | [webmention.io](https://webmention.io) + [Bridgy](https://brid.gy) to pipe replies from Mastodon and the broader social web back to posts. |
| Algolia / Meilisearch | Upgrade from Pagefind if archive grows past ~500 posts. |

### The architectural question this system answers

Five independent publications, one author, one maintenance burden. The system built here answers: how do you share infrastructure without sharing identity?

The answer: separate the layers cleanly. Infrastructure (build system, viz runtime, layout components, CI pipeline) lives in the submodule and is shared. Identity (brand tokens, navigation, editorial voice, homepage structure, page inventory) lives in each site repo and diverges freely.

The submodule is the floor. Each site builds its personality above it.

---

## Further reading

### Jekyll and static sites
- [Jekyll documentation](https://jekyllrb.com/docs/) — configuration, collections, plugins
- [GitHub Pages documentation](https://docs.github.com/en/pages) — deployment, custom domains, Actions
- [jekyll-paginate-v2](https://github.com/sverrirs/jekyll-paginate-v2) — pagination plugin used across all sites
- [jekyll-archives](https://github.com/jekyll/jekyll-archives) — category and tag archive generation

### Build system
- [Vite documentation](https://vitejs.dev/guide/) — build configuration and backend integration
- [Tailwind CSS](https://tailwindcss.com/docs) — utility-first CSS, content scanning, dark mode
- [PostCSS](https://postcss.org/) — CSS processing pipeline

### CSS architecture
- [CSS custom properties — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Every Layout — intrinsic web design](https://every-layout.dev/) — layout primitives used as reference
- [CUBE CSS methodology](https://cube.fyi/) — the compositional approach that influenced the token/component/utility layering

### Multi-site and submodule patterns
- [Git submodules — Pro Git](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [GitHub Actions checkout with submodules](https://github.com/actions/checkout)
- [Submodule vs subtree](https://andrey.nering.com.br/2016/git-submodules-vs-git-subtrees/)

### Content features
- [Pagefind — static search](https://pagefind.app/)
- [Giscus — GitHub Discussions comments](https://giscus.app/)
- [Alpine.js](https://alpinejs.dev/) — reactive UI without a build step (dark mode, nav, search overlay)
- [KaTeX — fast math typesetting](https://katex.org/)
- [Mermaid — diagram syntax](https://mermaid.js.org/)
- [Scrollama — scrollytelling](https://github.com/russellgoldenberg/scrollama)
- [Apache ECharts](https://echarts.apache.org/en/index.html)
- [D3.js](https://d3js.org/)

### Future directions
- [Quarto — scientific publishing](https://quarto.org/) — the recommended computational authoring layer
- [Pyodide — Python in WebAssembly](https://pyodide.org/) — live computation in the browser
- [Pandoc — universal document converter](https://pandoc.org/) — EPUB and PDF export
- [Webmention.io](https://webmention.io/) + [Bridgy](https://brid.gy/) — open web social integration
- [Cloudflare Web Analytics](https://developers.cloudflare.com/analytics/web-analytics/) — privacy-respecting analytics

---

*Last updated: February 2026. See `ROADMAP.md` for the current backlog.*
