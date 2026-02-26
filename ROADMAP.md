# Loom — Roadmap & Backlog

A running backlog of improvements, bugs, and future directions.
Items are grouped by theme and roughly ordered by priority within each group.

---

## 🔴 Broken / Missing Right Now

These are either actively misleading visitors or dead links.

| # | Item | Notes |
|---|------|-------|
| ~~B1~~ | ~~**Create `/about/` page**~~ | ✅ Done |
| ~~B2~~ | ~~**Create `/privacy/` and `/terms/` pages**~~ | ✅ Done |
| ~~B3~~ | ~~**Tag archive pages don't exist**~~ | ✅ Done — jekyll-archives for tags, tag.html layout, chips linked |
| ~~B4~~ | ~~**`welcome-to-loom` placeholder post**~~ | ✅ Done — rewritten as "What Loom Is and How It Works", series_order: 1 in "Building Loom" |

---

## 🟠 High Value, Low Effort

Can be shipped in a single focused session.

| # | Item | Notes |
|---|------|-------|
| ~~H1~~ | ~~**Syntax highlighting**~~ | ✅ Done — `assets/css/syntax.css`, GitHub light + One Dark dark mode |
| ~~H2~~ | ~~**Copy buttons on regular posts**~~ | ✅ Done — added to `core.js`, skips essay pages |
| ~~H3~~ | ~~**Sitemap**~~ | ✅ Done — `jekyll-sitemap` gem added |
| ~~H4~~ | ~~**Add npm + bundler cache to GitHub Actions**~~ | ✅ Done — `cache: npm` + `bundler-cache: true` |
| ~~H5~~ | ~~**D3 charts resize on window resize**~~ | ✅ Done — `ResizeObserver` in `renderD3` |
| ~~H6~~ | ~~**Dark mode Leaflet tile swap**~~ | ✅ Done — `MutationObserver` on `data-theme`, swaps to `carto-dark` |
| ~~H7~~ | ~~**Open Graph image for every post**~~ | ✅ Done — default `og-default.png` in `_config.yml` defaults (image file still needed) |
| ~~H8~~ | ~~**`jekyll-archives` for tags**~~ | ✅ Done — part of B3 |

---

## 🟡 High Value, More Effort

Worth planning as discrete pieces of work.

| # | Item | Notes |
|---|------|-------|
| ~~M1~~ | ~~**Full-text search (Pagefind)**~~ | ✅ Done — `npx pagefind --site _site` in Actions; dynamic import of `/pagefind/pagefind.js` on first open; search overlay in `default.html` via Alpine event dispatch; ⌘K shortcut; styles in `syntax.css`. |
| ~~M2~~ | ~~**Syntax highlighting theme matching dark mode**~~ | ✅ Done — `assets/css/syntax.css`, GitHub light + One Dark via `[data-theme="dark"]` selector |
| ~~M3~~ | ~~**Comments via Giscus**~~ | ✅ Done — `_includes/giscus.html`, `giscus:` config block in `_config.yml`, `comments: true` front matter opt-in, dark mode sync via MutationObserver |
| ~~M4~~ | ~~**Related posts**~~ | ✅ Done — `_includes/related-posts.html`, tag-intersection scoring, wired into post + essay layouts |
| ~~M5~~ | ~~**Reading progress + estimated time in post layout**~~ | ✅ Done — `initPostProgress()` in `core.js`, CSS in `syntax.css`, skips essay pages |
| ~~M6~~ | ~~**Post series support**~~ | ✅ Done — `_includes/series-nav.html`, `series:` + `series_order:` front matter, wired into post + essay layouts |
| ~~M7~~ | ~~**Newsletter / RSS CTA**~~ | ✅ Done — `_includes/subscribe-cta.html`, wired into post + essay layouts |
| ~~M8~~ | ~~**Print / PDF stylesheet**~~ | ✅ Done — `@media print` in `essay.css`: hides nav/TOC/sidebar/widgets, single-column reflow, page-break control, link URL expansion |
| ~~M9~~ | ~~**Published date + last updated date**~~ | ✅ Done — `updated:` front matter key shown in post + essay headers. Version history (GitHub releases) still in backlog. |
| ~~M9b~~ | ~~**Auto last-modified from git**~~ | ✅ Done — `jekyll-last-modified-at` gem, `fetch-depth: 0` in Actions, post + essay-hero use `page.updated \| default: page.last_modified_at`. |
| M9c | **Version history via GitHub releases (tier 3)** | Three tiers of the same idea. (1) *Published + updated dates* in post/essay footers: `published:` comes from the filename date; `updated:` is an optional front matter key. Low effort, signals editorial rigour. (2) *Auto last-updated from git*: the `jekyll-last-modified-at` plugin reads the last git commit touching the file and sets `page.last_modified_at` automatically — no manual front matter needed. (3) *Version history via GitHub releases*: tag releases in the format `post-slug/v2` and surface a "Previous versions of this page" link in the footer pointing to the GitHub release diff. Requires a small `_data/versions.yml` or a GitHub API call at build time. This third tier is editorially powerful — it signals that posts are living documents that get corrected and improved, which builds reader trust in a way that static publication dates never can. |

---

## 🔵 Infrastructure & Performance

| # | Item | Notes |
|---|------|-------|
| ~~I1~~ | ~~**D3 selective import instead of full bundle**~~ | ✅ Done — `viz/d3.js` uses a single `esm.sh` dynamic import with only the 14 D3 functions actually used (~120 KB vs 560 KB). `renderD3` is now async; `core.js` awaits it. Registry CDN entry for D3 cleared. `preconnect` for esm.sh added to head.html. |
| ~~I2~~ | ~~**Image lazy loading and `srcset`**~~ | ✅ Done — `_plugins/lazy_images.rb` post-render hook adds `loading="lazy"` to any `<img>` without an existing `loading` attribute. Feature/hero images with `loading="eager"` are untouched by the negative lookahead. srcset via `jekyll-picture-tag` remains a future option once images live in the repo. |
| I3 | **CSP headers via `_headers` file** | GitHub Pages serves from Cloudflare. A `_headers` file (processed by Cloudflare Pages, or set via a GitHub Pages workaround) can add `Content-Security-Policy`, `X-Frame-Options`, and `Referrer-Policy`. CDN scripts need nonce or hash allowlisting. |
| ~~I4~~ | ~~**Privacy-respecting analytics**~~ | ✅ Done — Cloudflare Web Analytics; `analytics_token:` in `_config.yml`, conditional script in `head.html`. Self-hosted Umami is the noted upgrade path. |
| ~~I5~~ | ~~**Preconnect hints for CDN domains**~~ | ✅ Done — `<link rel="preconnect">` for jsDelivr, unpkg, Google Fonts in `head.html` |
| ~~I6~~ | ~~**Bundle ECharts theme at build time**~~ | N/A — ECharts is CDN-loaded so `registerTheme()` must run after it loads; the theme object is already cleanly isolated at the top of `echarts.js`. Nothing to move. |

---

## 🟣 Longer-Horizon / Directional

These are strategic rather than immediate. Worth knowing they exist before making earlier choices.

| # | Item | Notes |
|---|------|-------|
| ~~L1~~ | ~~**Custom domain**~~ | ✅ Done — `CNAME` file set to `loomcollective.ai`, `url` + `baseurl` updated in `_config.yml` |
| L2 | **Quarto integration for computational content** | See architecture note below. |
| ~~L3~~ | ~~**Multi-author support**~~ | ✅ Done — `_data/authors.yml`, `_includes/author-byline.html`, `_includes/author-card.html`, `_layouts/author.html`, `_pages/authors/paul-hobson.md`. All 5 display locations updated. `site.author` now a slug. |
| ~~L4~~ | ~~**Post drafts workflow**~~ | ✅ Done — `_drafts/` folder, `scripts/new-draft.sh` + `scripts/publish.sh`. Three npm scripts: `new`, `preview`, `publish`. |
| L5 | **Webmentions** | [webmention.io](https://webmention.io) + [Bridgy](https://brid.gy) pipes replies from Twitter/Mastodon back to your posts. Niche but fits the open-web ethos of the content style. |
| L6 | **Algolia or Meilisearch** | If the site grows past ~500 posts, Pagefind's client-side index becomes unwieldy. Worth knowing the upgrade path exists. |

---

## 🏗️ Architecture: Multi-site, Quarto, and Export formats

Three strategic questions that connect and inform each other.

### 1. Repackaging the theme for other sites

**Short answer: yes, and the architecture is already well-positioned for it.**

The codebase has a natural layering:

```
Layer 1 — Design tokens   src/main.css (colors, fonts, spacing)
Layer 2 — Components      src/main.css (nav, cards, footer, post body)
Layer 3 — Layouts         _layouts/ + _includes/
Layer 4 — Viz system      assets/js/ (core.js + registry + adapters)
Layer 5 — Content         _posts/ + _pages/ + _config.yml
```

Layers 1 and 5 are entirely site-specific. Layers 2–4 are reusable infrastructure. The key design decision already made in your favour: **CSS custom properties for every design token**. Changing a site's entire colour palette, typography, and spacing is one CSS file override.

**Recommended approach — GitHub template repository:**

Keep Loom as the reference implementation. For each new site:
1. Use "Use this template" on GitHub to create a new repo from the Loom template.
2. Override `src/tokens.css` (split design tokens out of `main.css` into their own file — this is the one code change needed).
3. Add any new `_layouts/` and `_includes/` for the new site's post types (e.g. a course lesson layout, a project portfolio layout).
4. The viz system (`assets/js/`) comes along unchanged — it's already fully decoupled from the theme via body class flags and data attributes.

**A slightly more ambitious approach — npm package for the viz runtime:**

`assets/js/core.js` + `assets/js/viz-registry.js` + the adapters are already a standalone, zero-Jekyll-dependency ES module system. They could be published as `@your-org/loom-viz` on npm and consumed by any site — Jekyll, Astro, Hugo, even a plain HTML page. No forking required; sites just `npm install` it.

**What genuinely diverges between sites:**
- Design tokens (fonts, colours, spacing) — trivially overridable
- Card and listing layouts (a portfolio site has different cards than a blog) — new includes
- Post types (essay, course lesson, project case study) — new layout files
- Navigation structure — `_config.yml` only

**What stays identical:**
- The viz registry and all adapters
- The essay/scrollytelling system
- The dark mode, mobile nav, Alpine setup
- The GitHub Actions deploy workflow

---

### 2. Jupyter and Environmental Modelling

**The honest framing first:** Jupyter is excellent for *creating* environmental models; it is poor for *publishing* them. Its HTML output is heavy, unstyled, and static. Don't try to pipe notebook HTML into Loom — you'll fight it forever.

**The actual split to make:**

```
Computation layer   Quarto (.qmd files)    Python/R code, figures, math
                                            ↓ quarto render
Publishing layer    Loom (Jekyll)           Navigation, styling, interactive viz
                                            ↓ jekyll build
Interactivity       viz-registry            ECharts, D3, Leaflet, scrollytelling
```

**Why Quarto, not raw Jupyter:**

Quarto (by Posit, successor to R Markdown) is built for exactly your use case. It:
- Runs Python, R, Julia, or Observable JS code chunks and embeds output
- Produces KaTeX math natively
- Outputs to HTML, PDF (via LaTeX), EPUB, Word, and RevealJS slides from the same source
- Has excellent support for cross-references (Figure 3.2, Equation 1.4)
- Used by Nature, PNAS, and most serious computational publishing workflows

The integration with Loom is straightforward: `quarto render` produces Markdown + static figures → Jekyll publishes the Markdown. The Loom viz system handles *interactive* components; Quarto handles *computed* outputs (matplotlib figures, simulation results).

**The live computation question:**

If the course needs students to *run* code and change parameters in the browser, that's a different requirement. Options:
- **Pyodide** (Python compiled to WebAssembly) — runs numpy/scipy/matplotlib in the browser, no server. First load is ~8 MB but subsequent interaction is instant. Viable for specific interactive exercises.
- **Binder links** — a button that launches a JupyterHub session from a GitHub repo. Free for public repos. Good for "run this notebook yourself" but not embedded in the page.
- **Pre-computed + ECharts sliders** — the Ricker model approach. The computation runs at build time or is simple enough to re-run in JS. Works well for parameter-space exploration.

**Recommendation:** Start with Quarto + static figures for the course content. Add Pyodide for specific exercises where live computation adds genuine pedagogical value. The threshold question is: does the student *learning* require running code, or does it require *seeing* running code? The latter is much cheaper to deliver.

---

### 3. PDF and EPUB export

These share the same upstream tool: **Pandoc**.

```
Source          Tool            Output
─────────────────────────────────────────────
_posts/*.md  →  browser print  →  PDF (quick, CSS-controlled, M8 in backlog)
_posts/*.md  →  Pandoc          →  EPUB (single posts or grouped chapters)
_posts/*.md  →  Pandoc+LaTeX    →  PDF (high quality, academic style)
.qmd files   →  Quarto          →  PDF, EPUB, HTML (if Quarto route taken)
```

**PDF — two tiers:**
- **Browser print CSS** (M8): adequate for single essays shared as PDFs. Takes an afternoon, zero new tooling.
- **Pandoc → LaTeX → PDF**: publication-quality output with proper page numbers, running headers, bibliography. Worth it if the course becomes a formal document. Quarto gives you this for free if you go that route.

**EPUB — the practical approach:**

A Makefile target like `make epub SERIES=environmental-modelling` that:
1. Collects all posts with `series: environmental-modelling` front matter, sorted by `order:`
2. Runs `pandoc` with a custom EPUB template
3. Handles KaTeX math conversion to MathML (supported by most EPUB readers since 2021)
4. Embeds the static figures Quarto produced
5. Generates cover, TOC, and copyright page from `_data/series.yml`

The EPUB format works well for long-form course content because:
- Readers can annotate offline
- Works on Kindle, Apple Books, Kobo
- Math renders properly on modern e-readers (unlike PDF which is fixed-layout)
- You control the canonical version (no piracy of scraped content)

**Connecting all three:**

The cleanest long-term architecture is:

```
Author writes .qmd  →  Quarto renders  →  Markdown + figures
                                          ↓
                              Jekyll builds web version (Loom theme)
                              Pandoc builds EPUB (course chapters)
                              Quarto builds PDF (academic/print)
                                          ↓
                              All three deployed from same source
```

This is a well-worn path in academic publishing. The main investment is setting up the Quarto → Jekyll handoff cleanly. Everything downstream (EPUB, PDF) follows from having Quarto in the pipeline.

| # | Item | Notes |
|---|------|-------|
| L7 | **Split design tokens into `src/tokens.css`** | Prerequisite for clean multi-site forking. Separates "what the site looks like" from "how the components are built". One afternoon of refactoring. |
| L8 | **Quarto → Jekyll pipeline** | A `Makefile` target (or GitHub Action) that runs `quarto render` on `.qmd` files and deposits Markdown + figures into `_posts/` and `assets/images/`. The missing piece for computational content. |
| L9 | **EPUB export via Pandoc** | A `make epub` target that groups posts by `series:` front matter and runs Pandoc. Start with a single series (the environmental modelling course). KaTeX → MathML conversion is the main technical challenge. |
| L10 | **Pyodide integration for live computation** | A `data-pyodide` element type in the viz registry that runs a Python snippet client-side and renders output. Loads the Pyodide WASM bundle (~8 MB) only when needed. High pedagogical value for the modelling course. |

---

## Prioritised "next sprint" recommendation

If I had one session to spend, I'd do these in order:

1. **B1–B4** — fix the broken links first. Dead links undermine everything else.
2. **H1** — syntax highlighting. Affects every post immediately and takes 20 minutes.
3. **H3** — sitemap. One line in Gemfile, one line in `_config.yml`.
4. **H7** — OG image default. Before any post gets shared, this needs to exist.
5. **H4** — CI cache. Every push you make from here takes 3× longer than it should.

After that, **M1 (Pagefind search)** is the highest leverage feature investment — it's the thing that makes the archive actually usable as a knowledge base rather than just a reverse-chronological list.
