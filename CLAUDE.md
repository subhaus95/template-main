# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Workspace layout

```
/Users/pauldhobson/src/websites/
├── template-main/          ← shared Jekyll theme (git repo: subhaus95/template-main)
├── loomcollective.github.io/
├── pauldhobson.github.io/
├── qshift.github.io/
├── subhaus95.github.io/
└── waywardhouse.github.io/
```

Each site repo contains `theme/` as a git submodule pointing at `template-main`. **Never edit files inside `theme/` from within a site repo** — changes there are not committed to `template-main`. Edit in `template-main/` directly, push, then update the submodule pointer in each site.

---

## Commands

All commands below run from a **site repo root** unless noted.

### Local dev (two terminals)

**Terminal 1 — Vite (run from inside `theme/`):**
```bash
cd theme && npm run dev
```
Watches `src/main.css` and `src/main.js`, rebuilds to `../assets/dist/` on change.

**Terminal 2 — Jekyll:**
```bash
bundle exec jekyll serve --livereload
```
Site available at `http://localhost:4000`.

### First-time setup (site repo)
```bash
git submodule update --init --recursive
cd theme && npm ci && cd ..
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/
bundle install
bundle exec jekyll serve --livereload
```

### Production build
```bash
(cd theme && npm run build)
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/
bundle exec jekyll build
npx pagefind --site _site
```

**Build order matters:** Vite must run before Jekyll. Tailwind scans `_layouts/`, `_includes/`, etc. at Vite build time; Jekyll writes `_site/` after.

### Working in template-main directly

`package.json` scripts (run from `template-main/`):
```bash
npm run dev          # Vite watch (outputs to ../assets/dist/ — only useful inside a site repo)
npm run build        # Vite production build
npm run build-for-site  # build + rsync CSS/JS to ../assets/ (use when template-main is mounted as theme/)
npm run new          # create a new draft: bash scripts/new-draft.sh
npm run publish      # publish a draft: bash scripts/publish.sh
npm run preview      # bundle exec jekyll serve --drafts
npm run search       # npx pagefind --site _site
```

### Updating the template in a site repo
```bash
git submodule update --remote
git add theme
git commit -m "Update theme"
git push
```

### Drafts workflow
```bash
npm run new          # prompts for title, creates _drafts/YYYY-MM-DD-slug.md
npm run publish      # moves draft to _posts/ with today's date
```

---

## Architecture

### Submodule layout

```
site-repo/
├── theme/                  ← git submodule (subhaus95/template-main)
│   ├── _layouts/           ← all layouts (referenced via layouts_dir in _config.yml)
│   ├── _includes/          ← all includes
│   ├── _plugins/           ← lazy_images.rb
│   ├── src/                ← Vite entry: main.js, main.css
│   └── assets/
│       ├── css/            ← brand-*.css, syntax.css, essay.css (rsync'd to site root)
│       └── js/             ← core.js, viz-registry.js, viz/, models/ (rsync'd to site root)
├── assets/
│   ├── dist/               ← Vite output (main.css, main.js) — gitignored
│   ├── css/                ← rsync'd from theme/assets/css/
│   └── js/                 ← rsync'd from theme/assets/js/
├── _posts/                 ← site content
├── _pages/                 ← site pages
├── _config.yml             ← site-specific; references theme/ dirs
└── index.html
```

Jekyll is pointed at the submodule via three keys in every site's `_config.yml`:
```yaml
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins
```

### Vite output routing

`vite.config.js` sets `outDir: resolve(__dirname, '../assets/dist')`. When `template-main` is mounted as `theme/`, this resolves to the site repo's `assets/dist/`. Production URLs are `/assets/dist/main.css` and `/assets/dist/main.js` — no `/theme/` prefix anywhere.

### CSS layers

```
src/main.css              → assets/dist/main.css   (Vite: design tokens + all Tailwind components)
assets/css/syntax.css     → /assets/css/syntax.css  (rsync: syntax highlighting, search overlay, print)
assets/css/brand-*.css    → /assets/css/brand-*.css  (rsync: per-site token overrides only)
```

All design tokens are CSS custom properties in `src/main.css`. Tailwind's theme extends these via `var(--token)` so utilities like `text-accent` resolve at runtime. Dark mode and brand switching both work by changing attributes on `<html>` — no CSS recompile needed.

### Multi-brand system

`_config.yml` declares the brand:
```yaml
brand: loom               # selects assets/css/brand-loom.css
brand_default_theme: dark # initial data-theme before localStorage is read
```

`_layouts/default.html` sets `data-brand` and `data-theme` on `<html>` at render time. Alpine.js toggles `data-theme` on the dark mode button; the value is persisted in `localStorage` under the key `'theme'`. `_includes/head.html` contains an inline flash-prevention script that applies `data-theme` from `localStorage` before the first paint.

Brand CSS files contain only tokens that differ from the base — a minimal brand is 3–5 lines of CSS custom property overrides scoped to `[data-brand="X"]` and `[data-brand="X"][data-theme="dark"]`.

### Visualisation system

`assets/js/core.js` is the runtime orchestrator. It reads body-class flags set by Jekyll layouts (`tag-hash-math`, `tag-hash-viz`, etc.) to detect which libraries a post needs, loads them from CDN lazily, then delegates to adapters in `assets/js/viz/`:

```
viz-registry.js     maps library names → detect/init/render/update adapters
viz/echarts.js      Apache ECharts
viz/d3.js           D3 v7 selective import via esm.sh (~120 KB vs 560 KB full)
viz/leaflet.js      Leaflet maps (dark-mode tile swap included)
viz/mapbox.js       Mapbox GL JS
viz/math.js         KaTeX render trigger
viz/diagrams.js     Mermaid diagram trigger
models/ricker.js    Ricker population dynamics model
```

Adding a new visualisation library: create an adapter in `viz/`, register it in `viz-registry.js`. `core.js` does not change.

### Key layouts

| Layout | Used for |
|---|---|
| `default.html` | Base layout (header + footer); all others extend this |
| `home.html` | Paginated post grid (main index) |
| `post.html` | Standard blog post |
| `essay.html` | Long-form computational essay (TOC, footnotes, scrollytelling) |
| `topic.html` / `tag.html` | Archive pages (generated by jekyll-archives) |

### Post front matter flags

| Key | Effect |
|---|---|
| `comments: true` | Renders Giscus widget |
| `series:` + `series_order:` | Enables series navigation (`_includes/series-nav.html`) |
| `tag-hash-math` in `tags:` | Triggers KaTeX rendering |
| `tag-hash-viz` in `tags:` | Triggers viz library detection |

### `_config.yml` site-level options

| Key | Purpose |
|---|---|
| `brand` | Selects `brand-{name}.css` |
| `brand_default_theme` | `'light'` or `'dark'` (pre-localStorage default) |
| `hide_subscribe_cta: true` | Suppresses the subscribe block in post/essay layouts |
| `analytics_token` | Cloudflare Web Analytics token |
| `mapbox_token` | Mapbox public token |
| `fonts_url` | Override Google Fonts URL |
| `tokens_css` | Optional extra CSS loaded after brand file |
| `navigation` / `secondary_navigation` | Header nav links |

### Static search

Pagefind runs after `jekyll build` in CI (`npx pagefind --site _site`). The index is fetched as a dynamic import only when the search overlay opens (`⌘K`). Search returns no results in local development unless the indexer is run manually after a full build.

### Plugins (Ruby gems)

- `jekyll-paginate-v2` — pagination
- `jekyll-archives` — category (`/topic/:name/`) and tag (`/tag/:name/`) archive pages
- `jekyll-last-modified-at` — requires `fetch-depth: 0` in CI checkout
- `jekyll-seo-tag`, `jekyll-feed`, `jekyll-sitemap`
- `_plugins/lazy_images.rb` — post-render hook, adds `loading="lazy"` to images without the attribute
