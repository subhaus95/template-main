# Loom Template — Reference Guide

A complete reference for building, configuring, and writing content using the Loom Jekyll template. This template is used as a git submodule shared across multiple independent site repositories. Most tasks described here apply to a **site repo** (e.g. `loomcollective.github.io`); template internals are in `template-main/` and are only edited when changing shared layout or functionality.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Multi-site setup and submodule management](#2-multi-site-setup-and-submodule-management)
3. [Local development](#3-local-development)
4. [Configuration](#4-configuration)
5. [Writing posts](#5-writing-posts)
6. [Computational essays](#6-computational-essays) — including [References and citations](#references-and-citations)
7. [Visualisations](#7-visualisations)
8. [Search](#8-search)
9. [Navigation](#9-navigation)
10. [Comments](#10-comments)
11. [Analytics](#11-analytics)
12. [Series](#12-series)
13. [Related posts and subscribe CTA](#13-related-posts-and-subscribe-cta)
14. [RSS and sitemap](#14-rss-and-sitemap)
15. [Dark mode](#15-dark-mode)
16. [Images](#16-images)
17. [Custom domain](#17-custom-domain)
18. [GitHub Actions deployment](#18-github-actions-deployment)
19. [Video embeds](#19-video-embeds)
20. [Presentations](#20-presentations)
21. [Photo galleries](#21-photo-galleries)
22. [Authors](#22-authors)
23. [Drafts workflow](#23-drafts-workflow)

---

## 1. Prerequisites

| Tool | Required version | Check |
|------|-----------------|-------|
| Ruby | 3.3 | `ruby -v` |
| Bundler | any recent | `bundler -v` |
| Node.js | 20 | `node -v` |
| npm | bundled with Node 20 | `npm -v` |

Install Ruby gems:

```bash
bundle install
```

Install Node packages:

```bash
npm install
```

---

## 2. Multi-site setup and submodule management

Each site is an independent GitHub Pages repository. The shared template lives in `subhaus95/template-main` and is consumed as a git submodule mounted at `theme/` inside each site repo.

### Directory layout (site repo)

```
site-repo/
├── theme/                  ← git submodule (subhaus95/template-main)
│   ├── _layouts/
│   ├── _includes/
│   ├── _plugins/
│   ├── src/                    Vite source
│   └── assets/
│       ├── css/                brand-*.css, syntax.css, essay.css
│       └── js/                 core.js, viz-registry.js, viz/, models/
├── assets/
│   ├── dist/               ← Vite build output (main.css, main.js) — gitignored
│   ├── css/                ← rsync'd from theme/assets/css/ at build time
│   └── js/                 ← rsync'd from theme/assets/js/ at build time
├── _posts/                 ← site-specific content
├── _pages/                 ← site-specific pages
├── _config.yml             ← site-specific config; points Jekyll at theme/ dirs
└── index.html              ← site homepage
```

Jekyll reads layouts, includes, and plugins from inside the submodule via three keys in `_config.yml`:

```yaml
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins
```

### Initialising a site repo locally

After cloning a site repo for the first time, always initialise the submodule:

```bash
git clone https://github.com/OrgName/site-repo.github.io
cd site-repo.github.io
git submodule update --init --recursive
```

Or clone with submodules in one step:

```bash
git clone --recurse-submodules https://github.com/OrgName/site-repo.github.io
```

### Creating a new site repo

1. Create the GitHub repo under the target org (e.g. `NewOrg/newsite.github.io`).
2. Clone it locally.
3. Add `template-main` as the `theme/` submodule:

```bash
git submodule add https://github.com/subhaus95/template-main theme
git submodule update --init --recursive
```

4. Copy `_config.yml`, `Gemfile`, `Gemfile.lock`, and `index.html` from an existing site repo as a starting point. Update all site-specific values (see §4 Configuration).
5. Create `_pages/` with at minimum `about.md`, `archive.html`, `404.html`, `privacy.md`, `terms.md`.
6. Run the full build sequence (see §3) to verify everything works before the first push.
7. Enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions. The workflow in `theme/.github/workflows/` is not used directly — copy `.github/workflows/deploy.yml` from an existing site repo into the new repo and commit it.

### Updating the template in a site repo

After changes are pushed to `template-main`:

```bash
# From inside the site repo:
git submodule update --remote
git add theme
git commit -m "Update theme"
git push
```

The site repo now points to the latest `template-main` commit. CI will build with the new template on the next push.

> **Never edit files inside `theme/`** from within a site repo. Changes there affect the submodule's working tree but are not committed to `template-main`. Edit template files in the `template-main` repo directly, push them there, then update the submodule pointer in each site repo.

### Updating template-main

```bash
cd /path/to/template-main
# make changes, then:
git add <files>
git commit -m "Description of template change"
git push
# Now update each site repo that should receive the change:
cd /path/to/site-repo
git submodule update --remote && git add theme && git commit -m "Update theme" && git push
```

---

## 3. Local development

All commands run from the **site repo root** unless noted otherwise. Ensure the submodule is initialised first (see §2).

### First-time setup

```bash
# 1. Install Node deps (run from inside theme/)
cd theme && npm ci && cd ..

# 2. Copy static assets from submodule to site root
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/

# 3. Install Ruby gems
bundle install
```

### Running the dev server

Two processes run in parallel.

**Terminal 1 — build CSS and JavaScript (Vite, run from inside `theme/`):**

```bash
cd theme && npm run dev
```

Vite watches `src/main.css` and `src/main.js` inside the submodule, and rebuilds to `../assets/dist/` (which resolves to the site repo's `assets/dist/` directory) on every change.

**Terminal 2 — run Jekyll (run from site repo root):**

```bash
bundle exec jekyll serve --livereload
```

Site is available at `http://localhost:4000`.

> **Note on `assets/css/` and `assets/js/`:** In CI these are rsync'd from `theme/assets/` at build time. In local development you only need to re-run the rsync commands above when brand CSS or the viz runtime changes in the submodule. Day-to-day editing of posts and pages does not require it.

> **Note on search:** Pagefind requires a completed `_site/` directory to index. Search will return no results in local development unless you run the indexer manually after a full build:
>
> ```bash
> # From site repo root:
> (cd theme && npm run build)
> rsync -a theme/assets/css/ assets/css/ && rsync -a theme/assets/js/ assets/js/
> bundle exec jekyll build
> npx pagefind --site _site
> bundle exec jekyll serve --skip-initial-build
> ```
>
> Running `jekyll serve` without `--skip-initial-build` overwrites `_site/` and removes the Pagefind index. Always build first, then serve with the flag.

---

## 4. Configuration

All site-wide settings live in `_config.yml` in the **site repo root**. The template is never edited to change per-site configuration.

### Core identity

```yaml
title: My Site
description: One-sentence description used in meta tags and the subscribe CTA.
logo: /assets/images/logo.jpg      # Optional — shown in header/footer
url: "https://example.github.io"   # Full URL including scheme, no trailing slash
baseurl: ""                        # Empty for apex domains; "/path" for subpaths
author: author-slug                # Slug matching a key in _data/authors.yml
lang: en
```

### Brand and theme

```yaml
# Brand — controls which assets/css/brand-{name}.css is loaded.
brand: loom                        # loom | paul | qshift | wayward | subhaus
brand_name: "Loom Collective"      # Full display name
brand_default_theme: "dark"        # "dark" | "light" — initial theme on first visit

# Google Fonts URL for brand-specific typefaces.
# If set, this URL is loaded instead of the template default (Instrument Serif + DM Sans).
# Leave empty ("") to use the default font stack.
# This is the correct mechanism for per-brand font loading — do not edit head.html.
fonts_url: ""

# Additional CSS loaded after the brand file for any site-specific tweaks (optional).
tokens_css: ""

# Short label shown above the hero headline on the home page.
# Rendered in mono caps as an identity badge. Defaults to site.title if not set.
hero_badge: ""
```

### Brand CSS architecture

Each site's visual identity is expressed entirely through one file: `assets/css/brand-{name}.css`. This file is loaded after `assets/dist/main.css` so all token and component declarations cascade correctly.

The template's base tokens are in `src/main.css` under `:root`. A brand file overrides them by scoping under `[data-brand="X"]`:

```css
[data-brand="mysite"] {
  --font-heading: 'My Display Font', sans-serif;
  --font-body:    'My Body Font', sans-serif;
  --accent:       #e02020;
  --bg:           #ffffff;
  --text:         #0a0a0a;
  /* ... */
}

[data-brand="mysite"][data-theme="dark"] {
  --bg:   #0e0e0c;
  --text: #f5f5f2;
  /* ... */
}
```

**Key tokens used by the template:**

| Token | Used for |
|---|---|
| `--font-heading` | Nav logo, post titles, card titles, section heads, essay headings |
| `--font-body` | Base body font (`html` element) |
| `--accent` | Links, buttons, active states, category tags |
| `--bg` / `--bg2` / `--bg3` | Page, secondary surface, tertiary surface backgrounds |
| `--card-bg` | Post card backgrounds |
| `--text` / `--text-2` / `--text-3` | Primary, secondary, tertiary text |
| `--border` | Card borders, dividers |
| `--radius` | Card and button corner radius |

**Dark mode text on dark backgrounds:** `--text-2` and `--text-3` values that work for body text on a white background are typically too dim on near-black surfaces. Set these independently in the dark mode block — do not reuse the light-mode values. See the wayward brand file for reference.

**Component overrides:** After the token block, the brand file can override any component class directly:

```css
/* Card titles — condensed uppercase for editorial brands */
[data-brand="mysite"] .card-title {
  font-family: var(--font-display);
  text-transform: uppercase;
  font-weight: 700;
}
```

Zero impact on other sites — all rules are scoped to `[data-brand="mysite"]`.

### Submodule paths

These three keys tell Jekyll where to find layouts, includes, and plugins inside the `theme/` submodule. They must be present in every site repo's `_config.yml` exactly as shown:

```yaml
layouts_dir:  theme/_layouts
includes_dir: theme/_includes
plugins_dir:  theme/_plugins
```

### Subscribe CTA

```yaml
# Set to true to suppress the RSS/subscribe call-to-action on all post pages.
# Leave unset or false to show the CTA (default).
hide_subscribe_cta: true
```

The CTA text is drawn from `site.description`. Sites that are not subscription-driven (e.g. a personal CV site or a homelab notebook) should set this flag.

### Permalink and pagination

```yaml
permalink: /:title/                # Post URLs: /my-post-slug/
future: true                       # Publish posts with future dates

pagination:
  enabled: true
  per_page: 12
  permalink: "/page/:num/"
  title: ":title — page :num"
  trail:
    before: 2
    after: 2
```

### Navigation menus

```yaml
# Header — main nav links
navigation:
  - title: Home
    url: /
  - title: Topics
    url: /topics/
  - title: Archive
    url: /archive/

# Footer — secondary links (About, RSS, etc.)
secondary_navigation:
  - title: About
    url: /about/
  - title: RSS
    url: /feed.xml
```

### Social links

```yaml
twitter: your_handle      # X/Twitter username only, no @
facebook: your_page       # Facebook page name
```

Both are optional — remove the key or leave blank to hide the icon in the footer.

### Analytics

```yaml
analytics_token: ""       # Cloudflare Web Analytics token
```

See [§10 Analytics](#10-analytics) for setup.

### Comments

```yaml
giscus:
  repo: ""                # Owner/repo — e.g., pauldhobson/loomcollective
  repo_id: ""             # From giscus.app
  category: "Announcements"
  category_id: ""         # From giscus.app
```

See [§9 Comments](#9-comments) for setup.

### Archive pages

```yaml
jekyll-archives:
  enabled:
    - categories          # Generates /topic/:name/ pages
    - tags                # Generates /tag/:name/ pages
  layouts:
    category: topic
    tag: tag
  permalinks:
    category: /topic/:name/
    tag: /tag/:name/
```

### Default front matter

```yaml
defaults:
  - scope:
      path: "_posts"
    values:
      layout: post
      image: /assets/images/og-default.png   # Fallback OG image
  - scope:
      path: "_pages"
    values:
      layout: default
```

---

## 5. Writing posts

### File naming

Create files in `_posts/` following the date-slug convention:

```
_posts/2026-03-01-my-post-title.md
```

### Front matter reference

```yaml
---
layout: post                        # Required

# Content
title: "Post title"                 # Required
date: 2026-03-01                    # Required — matches filename date
excerpt: "One or two sentences."    # Optional — used in cards and meta description

# Taxonomy
categories: [Energy]                # Optional — one category recommended; used for /topic/ archive
tags: [solar, policy, net-zero]     # Optional — multiple tags; used for /tag/ archive

# Authorship
author: paul-hobson                 # Optional — slug from _data/authors.yml; falls back to site.author

# Images
image: /assets/images/feature.jpg   # Optional — feature image at top of post
image_alt: "Panel arrays at dusk"   # Optional — alt text for accessibility
image_caption: "Photo: Jane Doe"    # Optional — caption below image

# Display options
featured: true                      # Optional — shows in Featured section on home page
updated: 2026-03-15                 # Optional — shows "Updated" date in post header

# Series (see §11)
series: "Series Name"               # Optional — must match exactly across posts
series_order: 1                     # Optional — integer, ascending

# Features
comments: true                      # Optional — enables Giscus comments widget

# Viz library flags (see §6)
# These add body classes that trigger CDN loading.
# All are auto-detected from content too — flags just guarantee loading.
math: true
diagram: true
viz: true
d3: true
leaflet: true
geo: true
---
```

### Post content

Posts are written in standard Markdown (Kramdown). Use any standard Markdown elements:

```markdown
## Heading (auto-linked anchor)

Regular paragraph. **Bold.** _Italic._ `Inline code`.

> Blockquote text.

- Unordered list
- Item two

1. Ordered list
2. Item two

[Link text](https://example.com)

![Alt text](/assets/images/figure.jpg)
```

### Code blocks

Language-tagged code blocks get syntax highlighting (Rouge) and a copy button automatically:

````markdown
```python
def ricker(r, x):
    return r * x * (1 - x)
```
````

### Post footer

Every post automatically gets:
- Tags as clickable chips
- Share buttons (X/Twitter, LinkedIn, copy link)
- Subscribe CTA
- Giscus comments (if `comments: true`)
- Related posts (if tag/category matches exist)
- Previous / next post navigation

### References (required for data-driven posts)

Any post that cites statistics, quotes research findings, or displays chart data must close with a `## References` section. Use Chicago Author-Date format with live, verifiable URLs. See [§6 References and citations](#references-and-citations) for the full standard, format examples, and chart caption requirements.

---

## 6. Computational essays

Essays use a three-column layout: sticky table of contents (left), content (centre), sidenotes (right). The layout collapses responsively to two columns on tablets and one column on mobile.

### Front matter

```yaml
---
layout: essay       # Required — enables 3-column layout, TOC, sidenotes, progress bar
title: "Essay title"
date: 2026-03-01
excerpt: "Summary."
categories: [Mathematics]
tags: [ecology, population-dynamics]
image: /assets/images/essay-hero.jpg
image_alt: "Description"
image_caption: "Caption"
series: "Series Name"
series_order: 2
comments: true
updated: 2026-03-15

# Viz flags — set all that apply
math: true
viz: true
gl: true            # ECharts GL: scatter3D, bar3D, surface — requires viz: true too
story: true         # Loads Scrollama for scrollytelling sections
---
```

### Table of contents

Built automatically from all `## h2` and `### h3` headings in the content. No markup required.

To exclude a heading from the TOC:

```html
<h2 data-notoc>This heading is excluded</h2>
```

### Sidenotes

Tufte-style margin notes. On desktop they appear in the right column; on mobile they appear inline.

```html
<p>
  The Ricker model<span class="sidenote-anchor" data-sn="1"></span> was originally
  developed for salmon population studies.
</p>
<aside class="sidenote" data-sn="1">
  Ricker, W.E. (1954). Stock and Recruitment. <em>J. Fish. Res. Board Can.</em> 11(5):559–623.
</aside>
```

The `data-sn` attribute links anchor to note — use the same integer for both. Numbers are displayed automatically.

### References and citations

**Every essay and substantive post must close with a References section.** This is not optional. Unverifiable claims, data charts, and statistics with no sourcing undermine the publication's credibility. The standard is strict academic form with live, verifiable URLs wherever the source exists online.

#### Why this matters

- Readers click through. Dead links or vague attributions ("Statistics Canada data") erode trust faster than no citation at all.
- Data journalism requires the reader to be able to reproduce the finding. A chart with no source cannot be verified or updated.
- LLM-generated text is particularly prone to plausible-sounding but unverifiable figures. Sourcing forces a check at write time.

#### Citation format: Chicago Author-Date (preferred)

Use Chicago Author-Date style for all references. This is standard in social science, geography, and economics — the primary domains of this publication.

**Journal article:**
```
Peltzman, Sam. 2000. "Prices Rise Faster than They Fall." *Journal of Political Economy* 108(3): 466–502. https://doi.org/10.1086/262126
```

**Government / statistical release:**
```
Statistics Canada. 2024. *Consumer Price Index, December 2024* (Catalogue no. 62-001-X). Ottawa: Statistics Canada. https://www150.statcan.gc.ca/n1/pub/62-001-x/2025001/t001a-eng.htm
```

**Web page / news article:**
```
Natural Resources Canada. 2025. "Fuel Focus: Understanding Gasoline Markets." Last modified January 2025. https://natural-resources.canada.ca/energy/fuel-prices/4597
```

**Report / working paper:**
```
International Energy Agency. 2024. *Oil Market Report — March 2024*. Paris: IEA. https://www.iea.org/reports/oil-market-report-march-2024
```

#### What to cite

| Content type | Citation required |
|---|---|
| Statistics, figures, percentages | Yes — always. Link to the specific table or release, not just the agency homepage. |
| Chart / viz data | Yes — `viz-caption` on each chart plus full entry in References. |
| Named studies or findings ("Peltzman 2000 found...") | Yes — full entry in References. |
| Methodological claims ("ECharts uses...") | Link to docs inline; no References entry needed. |
| General background geography | Judgment call — if a claim could be contested, cite it. |
| Your own prior posts | Link inline; no References entry needed. |

#### Inline citation markup

Inline `<cite>` elements are collected and rendered as a numbered reference list at the end of the essay.

```html
<p>
  Pump prices respond to crude price increases significantly faster than to
  decreases<cite data-cite="Peltzman, Sam. 2000. 'Prices Rise Faster than They Fall.' Journal of Political Economy 108(3): 466–502. https://doi.org/10.1086/262126"></cite> —
  a phenomenon known as the rockets and feathers effect.
</p>
```

If the `data-cite` value contains a URL, the rendered reference entry links to it automatically. Always include the URL in `data-cite` when one exists.

#### Closing References section (required)

Every essay must end with an explicit `## References` section in Markdown, even if inline `<cite>` elements are also used. The Markdown section is human-readable in the source and appears as a formatted block for readers who want to scan all sources at once.

```markdown
## References

Natural Resources Canada. 2025. "Fuel Focus: Understanding Gasoline Markets." Last modified January 2025. <https://natural-resources.canada.ca/energy/fuel-prices/4597>

Peltzman, Sam. 2000. "Prices Rise Faster than They Fall." *Journal of Political Economy* 108(3): 466–502. <https://doi.org/10.1086/262126>

Statistics Canada. 2025. *Consumer Price Index, January 2025* (Catalogue no. 62-001-X). Ottawa: Statistics Canada. <https://www150.statcan.gc.ca/n1/pub/62-001-x/2025001/t001a-eng.htm>
```

Angle-bracket URLs (`<https://...>`) render as clickable links in Kramdown without needing separate link text.

#### URL requirements

- **Link to the specific page**, not the site root. `https://www150.statcan.gc.ca/n1/pub/62-001-x/2025001/t001a-eng.htm` not `https://statcan.gc.ca`.
- **Use DOIs** for journal articles where available — DOI links are stable even when journal URLs change.
- **Check the link resolves** before publishing. A 404 in a reference is worse than no reference.
- **Prefer institutional URLs** over media articles for data claims. Link to the Statistics Canada table, not to a CBC article reporting the same table.
- **For paywalled sources**, include the full citation so readers can locate the source through a library, and add a public DOI or preprint URL if one exists.

#### Chart `viz-caption` requirements

Every `data-viz` element must have a following `viz-caption` paragraph. The caption must include:

1. **What the data shows** (brief, one clause)
2. **The source** — institution, dataset name, date/vintage
3. **A URL** to the specific dataset or release

```html
<div data-viz="echarts" style="height:360px" data-options='...'></div>

<p class="viz-caption">Alberta monthly retail gasoline prices, January 2024–March 2026. Source: Natural Resources Canada, <em>Fuel Focus Weekly</em>, various issues. <a href="https://natural-resources.canada.ca/energy/fuel-prices/4597">https://natural-resources.canada.ca/energy/fuel-prices/4597</a></p>
```

If the data is author-constructed from multiple sources, list all sources: "Author calculations based on Statistics Canada CPI table 18-10-0004-01 and NRCan Fuel Focus weekly data."

### Callouts

```html
<div class="callout callout-note">
  <span class="callout-icon">💡</span>
  <div class="callout-body">
    <p>Key insight or tip.</p>
  </div>
</div>

<div class="callout callout-warning">
  <span class="callout-icon">⚠️</span>
  <div class="callout-body">
    <p>Something to watch out for.</p>
  </div>
</div>

<div class="callout callout-definition">
  <span class="callout-icon">📖</span>
  <div class="callout-body">
    <p><strong>Term:</strong> Definition text.</p>
  </div>
</div>

<div class="callout callout-takeaway">
  <span class="callout-icon">✓</span>
  <div class="callout-body">
    <p>Key takeaway from this section.</p>
  </div>
</div>
```

### Scrollytelling

Requires `story: true` in front matter.

A story section pins a visualisation in the viewport while narrative steps scroll past. Each step can update the pinned visualisation.

```html
<section class="story-section">
  <div class="story-sticky">
    <div class="story-graphic">
      <!-- Pinned viz — stays visible while steps scroll -->
      <div data-leaflet id="city-map" style="height:100%"
           data-lat="51.505" data-lng="-0.09" data-zoom="10"></div>
    </div>
  </div>

  <div class="story-steps">
    <!-- Each step triggers an update when it enters the viewport -->
    <div class="story-step" data-step="0"
         data-update='{"city-map": {"lat": 51.505, "lng": -0.09, "zoom": 10}}'>
      <p>London. Population 9 million.</p>
    </div>

    <div class="story-step" data-step="1"
         data-update='{"city-map": {"lat": 48.856, "lng": 2.352, "zoom": 12}}'>
      <p>Paris. Population 11 million.</p>
    </div>
  </div>
</section>
```

The `data-update` JSON maps element IDs to update payloads. Keys are element IDs; values are adapter-specific (see each visualisation type below).

Arrow keys navigate between steps.

### Reading progress bar

Added automatically to essay pages. A 2px accent-coloured bar at the top of the viewport fills as you scroll. Respects `prefers-reduced-motion`.

---

## 7. Visualisations

The viz runtime (`assets/js/core.js`) scans the page after load, detects which libraries are needed, fetches them from CDN, and mounts each visualisation. Nothing loads on pages that don't use it.

Detection is automatic via element selectors (`[data-viz]`, `[data-d3]`, etc.) or body-class flags set by front matter. Use the front matter flags when you want to guarantee a library loads even if detection would otherwise miss it (e.g. math in a post with no `$` signs but with `<span class="math-display">`).

---

### Mathematics — KaTeX

**Front matter flag:** `math: true`
**Auto-detection:** `$` signs in content, `.math`, `.math-inline`, `.math-display` elements.

**Inline:**

```markdown
The logistic map is $x_{n+1} = r x_n (1 - x_n)$.
```

**Display (centred block):**

```markdown
$$
x_{n+1} = r x_n (1 - x_n)
$$
```

**LaTeX delimiters also supported:**

```markdown
Inline: \( \sigma = \sqrt{\text{Var}(X)} \)

Display: \[ E[X] = \mu \]
```

Code blocks are excluded from rendering — KaTeX never processes content inside `` ` `` or ```` ``` ```` fences.

---

### Diagrams — Mermaid

**Front matter flag:** `diagram: true`
**Auto-detection:** `.mermaid` elements, `code.language-mermaid` blocks.

Use a fenced code block with the `mermaid` language tag:

````markdown
```mermaid
graph TD
    A[Raw data] --> B[Preprocessing]
    B --> C{Valid?}
    C -->|Yes| D[Model]
    C -->|No| E[Reject]
    D --> F[Output]
```
````

Other supported Mermaid diagram types:

````markdown
```mermaid
sequenceDiagram
    User->>Server: POST /api/data
    Server-->>User: 200 OK
```
````

````markdown
```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Research
    Literature review  :a1, 2026-01-01, 30d
    section Writing
    First draft        :after a1, 20d
```
````

The theme is automatically set to Mermaid's `dark` or `default` based on the current colour scheme.

---

### Charts — ECharts

**Front matter flag:** `viz: true`
**Auto-detection:** `[data-viz]` elements.

Pass the full [ECharts option object](https://echarts.apache.org/en/option.html) as JSON in `data-options`. The `loom` theme is pre-registered with accent colours matching the site palette.

**Bar chart:**

```html
<div data-viz="echarts" style="height:320px" data-options='{
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Coal", "Gas", "Solar", "Wind"]},
  "yAxis": {"type": "value", "name": "GW"},
  "series": [{"type": "bar", "data": [102, 87, 230, 116]}]
}'></div>
```

**Line chart:**

```html
<div data-viz="echarts" style="height:300px" data-options='{
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["2020", "2021", "2022", "2023", "2024"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "smooth": true, "data": [1.2, 1.8, 2.6, 3.9, 5.1]}]
}'></div>
```

**Scrolly update:**

Give the element an `id`, then reference it in each story step's `data-update`:

```html
<div data-viz="echarts" id="energy-chart" style="height:300px" data-options='{
  "xAxis": {"type": "category", "data": ["Coal", "Gas", "Solar"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "bar", "data": [102, 87, 12]}]
}'></div>

<div class="story-step" data-step="1"
     data-update='{"energy-chart": {"series": [{"data": [80, 60, 230]}]}}'>
  <p>By 2030, solar overtook both fossil fuels.</p>
</div>
```

The `data-update` value is passed directly to ECharts `setOption()`, so any partial update supported by ECharts works here.

**Inline scripts with custom controls (sliders, buttons, etc.):**

When a chart needs custom interactive controls that don't fit the `data-viz` / `data-update` pattern, you can write an inline script — but it must be `type="module"` and must wait for `window.echarts` to be set by core.js. A plain synchronous `<script>` runs during HTML parsing, before core.js has fetched ECharts from CDN, and will fail with `ReferenceError: echarts is not defined`.

```html
<div id="my-chart" style="height: 400px;"></div>

<script type="module">
// Wait for core.js to load ECharts (requires viz: true in front matter)
while (!window.echarts) await new Promise(r => setTimeout(r, 50));

const chart = window.echarts.init(document.getElementById('my-chart'));

chart.setOption({
  xAxis: { type: 'value' },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [[0,0],[1,1],[2,4]] }]
});

// Wire up any controls here — chart is guaranteed to exist
document.getElementById('my-slider').addEventListener('input', (e) => {
  chart.setOption({ /* ... */ });
});
</script>
```

The `while (!window.echarts) await new Promise(r => setTimeout(r, 50))` line is the required boilerplate. It yields execution every 50ms until core.js has loaded ECharts, then proceeds. Omit it and the script will always fail.

`viz: true` in front matter is still required — it tells core.js to load ECharts in the first place.

---

### Charts — D3

**Front matter flag:** `d3: true`
**Auto-detection:** `[data-d3]` elements.

D3 loads a selective ~120 KB bundle (selection, scale, axis, array, shape, force, drag, transition) via dynamic import — only on pages that use it.

Three built-in chart types:

**Horizontal bar chart:**

```html
<div data-d3="bar" style="height:300px" data-options='{
  "data": [
    {"label": "Solar", "value": 230},
    {"label": "Wind",  "value": 116},
    {"label": "Hydro", "value": 37}
  ]
}'></div>
```

Optional: `"color": "#F0177A"` in options overrides bar colour.

**Line chart:**

```html
<div data-d3="line" style="height:260px" data-options='{
  "data": [
    {"x": 2000, "value": 1.2},
    {"x": 2010, "value": 3.9},
    {"x": 2020, "value": 9.4}
  ]
}'></div>
```

**Force-directed graph:**

```html
<div data-d3="force" style="height:360px" data-options='{
  "data": {
    "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
    "links": [{"source": "A", "target": "B"}, {"source": "B", "target": "C"}]
  }
}'></div>
```

Nodes are draggable.

**Custom chart types:**

Register your own factory in an HTML block inside the post:

```html
<script type="module">
import { registerD3Chart } from '/assets/js/viz/d3.js';

registerD3Chart('scatter', (el, data, options) => {
  const d3 = window.d3;  // set after first render on this page

  const svg = d3.select(el).append('svg')
    .attr('width', el.offsetWidth)
    .attr('height', el.offsetHeight);

  // … render scatter plot …

  return {
    update(newData) {
      // Re-render with newData when a scrolly step fires
    }
  };
});
</script>

<div data-d3="scatter" style="height:300px"
     data-options='{"data": [{"x": 1, "y": 2}, {"x": 3, "y": 1}]}'></div>
```

**Scrolly update:**

```html
<div data-d3="bar" id="pop-chart" style="height:280px" data-options='{
  "data": [{"label": "1970", "value": 3.7}]
}'></div>

<div class="story-step" data-step="1"
     data-update='{"pop-chart": {"data": [
       {"label": "1970", "value": 3.7},
       {"label": "2024", "value": 8.1}
     ]}}'>
  <p>Population doubled in fifty years.</p>
</div>
```

---

### Ricker population model

An interactive widget with sliders for growth rate `r`, initial value `x₀`, and iterations `n`. Includes a time-series chart and a phase plot.

**Requires:** `viz: true` in front matter (needs ECharts).

**Static widget with sliders:**

```html
<div data-viz="ricker" style="height:360px;"></div>
```

**Scrollytelling variant (no sliders, updates from story steps):**

```html
<div data-viz="ricker-scrolly"></div>
```

---

### Maps — Leaflet (no API key required)

**Front matter flag:** `leaflet: true`
**Auto-detection:** `[data-leaflet]` elements.

```html
<div data-leaflet style="height:400px"
     data-lat="51.505"
     data-lng="-0.09"
     data-zoom="13"></div>
```

**Tile presets** (`data-tiles` attribute):

| Value | Tiles |
|-------|-------|
| `osm` (default) | OpenStreetMap |
| `carto` | CartoDB Positron (light, minimal) |
| `carto-dark` | CartoDB Dark Matter |
| `stadia` | Stadia Alidade Smooth |

Dark mode automatically swaps the tile layer to `carto-dark`.

**Markers:**

```html
<div data-leaflet style="height:400px"
     data-lat="51.505" data-lng="-0.09" data-zoom="12"
     data-tiles="carto"
     data-markers='[
       {"lat": 51.505, "lng": -0.09, "label": "London"},
       {"lat": 51.524, "lng": -0.13, "label": "King&apos;s Cross"}
     ]'></div>
```

**Scrolly update** (fly to new position):

```html
<div data-leaflet id="city-map" style="height:100%"
     data-lat="51.505" data-lng="-0.09" data-zoom="10"></div>

<div class="story-step" data-step="0"
     data-update='{"city-map": {"lat": 51.505, "lng": -0.09, "zoom": 10}}'>
  <p>Greater London.</p>
</div>
<div class="story-step" data-step="1"
     data-update='{"city-map": {"lat": 48.856, "lng": 2.352, "zoom": 12, "animate": true}}'>
  <p>Paris.</p>
</div>
```

`animate: true` (default) smoothly flies to the new position. Set `false` for an instant jump.

---

### Maps — Mapbox GL (requires API token)

**Front matter flag:** `geo: true`
**Auto-detection:** `[data-map]` elements.

**Token setup** — add your public token to `_config.yml`:

```yaml
mapbox_token: "pk.eyJ..."
```

This is injected as `window.MAPBOX_TOKEN` automatically by `_includes/head.html` on every page. For a token you don't want in source control, use a GitHub Actions secret instead (see §17).

Or pass per-element to override the global token:

```html
<div data-map="calgary" data-token="pk.eyJ..." style="height:500px;"></div>
```

**Preset locations:**

```html
<div data-map="calgary"   style="height:400px;"></div>
<div data-map="edmonton"  style="height:400px;"></div>
<div data-map="vancouver" style="height:400px;"></div>
<div data-map="toronto"   style="height:400px;"></div>
<div data-map="world"     style="height:400px;"></div>
```

**Custom centre and zoom:**

```html
<div data-map="custom" style="height:400px;"
     data-center="-113.5,51.0"
     data-zoom="10"></div>
```

`data-center` is `longitude,latitude` (note order — Mapbox convention).

For token-free interactive maps, prefer Leaflet above.

---

## 8. Search

Search is powered by [Pagefind](https://pagefind.app), which indexes the built `_site/` directory at CI time and ships the index as static files alongside the site. No server is required.

### How it works

1. Jekyll builds the site to `_site/`
2. `npx pagefind --site _site` crawls the HTML and writes `_site/pagefind/`
3. The deploy artifact includes the Pagefind index
4. At runtime, the search component dynamically imports `/pagefind/pagefind.js` on first open
5. Searches run entirely client-side against the local index

### UI

- **Search button** in the header (magnifying glass icon)
- **Keyboard shortcut:** `⌘K` (Mac) or `Ctrl+K` (Windows / Linux)
- **Close:** `ESC` key or click outside the panel
- Results show title + highlighted excerpt
- Matched terms are highlighted in pink (the accent colour)

### Using search locally

After a full `jekyll build`, run Pagefind and then serve the already-built site:

```bash
npm run build
bundle exec jekyll build
npx pagefind --site _site
bundle exec jekyll serve --skip-initial-build
```

Browse to `http://localhost:4000` and search will work.

> Running `jekyll serve` (without `--skip-initial-build`) overwrites `_site/` and removes the Pagefind index. Always build first, then serve.

### Excluding content from the index

Pagefind indexes all HTML by default. To exclude a section:

```html
<div data-pagefind-ignore>
  This content will not appear in search results.
</div>
```

To exclude an entire page, add to its front matter:

```yaml
---
exclude_from_search: true
---
```

Then add a hook in `_plugins/` or a Pagefind config file — see [Pagefind docs](https://pagefind.app/docs/config-options/).

### CI integration

The `npx pagefind --site _site` step in `.github/workflows/deploy.yml` runs automatically after `jekyll build`. No additional configuration is needed for deployment.

---

## 9. Navigation

### Header

Defined in `_config.yml` under `navigation:`. Active state is applied automatically when `page.url` matches the item URL.

```yaml
navigation:
  - title: Home
    url: /
  - title: Topics
    url: /topics/
  - title: Archive
    url: /archive/
  - title: About
    url: /about/
```

### Footer — secondary links

Defined in `_config.yml` under `secondary_navigation:`:

```yaml
secondary_navigation:
  - title: About
    url: /about/
  - title: Privacy
    url: /privacy/
  - title: RSS
    url: /feed.xml
```

The footer Topics column is populated automatically from the six most-used categories.

### Mobile navigation

The header collapses to a hamburger on small screens. The drawer opens/closes with the hamburger button and also closes on `ESC` or clicking outside.

---

## 10. Comments

Comments use [Giscus](https://giscus.app), backed by GitHub Discussions. Comments are stored in your repo's Discussions tab — no third-party database.

### Setup

1. Enable **Discussions** on your GitHub repo (Settings → General → Features → Discussions).
2. Install the [Giscus app](https://github.com/apps/giscus) and grant it access to your repo.
3. Go to [giscus.app](https://giscus.app), enter your repo, select a discussion category, and copy the generated values.

### Configuration

Add the values to `_config.yml`:

```yaml
giscus:
  repo: "pauldhobson/loomcollective"    # owner/repo
  repo_id: "R_kgDOJ5..."                # from giscus.app
  category: "Announcements"
  category_id: "DIC_kwDOJ5..."          # from giscus.app
```

### Enabling per post

Add `comments: true` to any post or essay front matter:

```yaml
---
layout: post
title: "My Post"
comments: true
---
```

Comments will not appear on posts without `comments: true`, even if Giscus is configured.

### Dark mode

The Giscus widget automatically follows the site's colour scheme. When you toggle dark mode, a `postMessage` is sent to the Giscus iframe to update its theme in real time.

---

## 11. Analytics

The theme is wired for Cloudflare Web Analytics, which is privacy-respecting and free on Cloudflare's free plan.

### Setup

1. Create a [Cloudflare account](https://dash.cloudflare.com) if you don't have one.
2. Go to **Websites** → add your domain (or use Cloudflare Pages hosting).
3. Go to **Analytics & Logs → Web Analytics** → add your site.
4. Copy the analytics token (a long hex string).

### Configuration

Paste the token into `_config.yml`:

```yaml
analytics_token: "abc123def456..."
```

The script tag is only injected when the token is non-empty, so leaving it blank disables analytics entirely for local development.

---

## 12. Series

The series system groups related posts with a sidebar navigation list (`series-nav.html`) and an auto-generated "Continue reading" block (`essay-next.html`) at the bottom of each post.

### Setup

Add `series` and `series_order` to each post's front matter. The series name must match **exactly** across all posts (case-sensitive):

```yaml
# Post 1
---
series: "Building Loom"
series_order: 1
---

# Post 2
---
series: "Building Loom"
series_order: 2
---
```

### Series landing page (required for sidebar and breadcrumbs)

`series-nav.html` looks up `site.pages | where: "series_key", page.series` to find the landing page. Without a landing page the sidebar is silent and breadcrumb links are broken. Create one at `_pages/series-<slug>.md`:

```yaml
---
layout: page
permalink: /series/my-series/
title: "My Series"
subtitle: "A short description shown on the page"
series_key: "My Series"   # must match series: exactly
total_essays: 5
tags: [tag1, tag2]
---
```

The critical field is `series_key` — it must be an exact string match with the `series:` value in each post.

### Clusters (grouping within a series)

Use `cluster:` to group posts within a series. The format **must** be `"CODE — Title"` (em dash, not hyphen):

```yaml
cluster: "A — Foundations"
```

`series-nav.html` splits on ` — ` to get the code (shown as a header) and the name (shown below it). If you omit the separator, the full string becomes the code and the name is blank, producing a malformed header.

All posts in the same cluster must use **the identical string** so the `where: "cluster"` filter groups them correctly.

### Categories — must match established site value exactly

Jekyll-archives generates a separate archive page for each unique category string. `"Economic Geography"` and `"economic-geography"` are different strings and produce different archive URLs. Always check `_posts/` for the category string used by existing posts in your topic area:

```bash
grep "^categories:" _posts/*.md | head -5
```

Use the same string. If the site uses `Economic Geography`, your new post must also use `Economic Geography`.

### Rules

- `series_order` must be a unique integer within a series — two posts with the same `series_order` cause `essay-next` to break (it finds two "next" posts and returns the wrong one).
- Posts do not need to be numbered consecutively — gaps are fine.
- A post can only belong to one series.
- `math_core:` should be a YAML array, not a string: `math_core: ["item one", "item two"]`. A string works but renders as one unsplit chip.
- `cluster_order:` and `prerequisites:` are not used by any template; omit them.

### Two kinds of series — essay series vs curriculum modelling series

The site has two distinct series structures. Getting the distinction right matters because they are listed and navigated differently.

**Essay series** (`series-nav.html` sidebar only)

Any group of related posts. The landing page needs `series_key` but no `series_number`. The series will not appear on `/series/` — it can be linked from navigation, a topic page, or the posts themselves. Example: "Alberta in Context" — an economic geography essay series with embedded models.

Minimum landing page:

```yaml
---
layout: page
permalink: /series/my-series/
title: "My Series"
subtitle: "One sentence description"
series_key: "My Series"     # exact match with series: in posts
total_essays: 5
---
```

**Curriculum modelling series** (appears on `/series/`)

A sequenced curriculum with explicit pedagogy. `/series/` only lists pages that have `series_number`. These pages need substantial content — see `_pages/2026-03-01-series-1-foundations.md` as the template. Required front matter fields:

```yaml
---
layout: page
permalink: /series/7/
title: "Series 7: Title"
subtitle: "One sentence summary"
series_number: 7             # determines listing order on /series/
series_key: "My Series Key"  # must match series: in posts exactly
total_essays: 12
difficulty_range: 1-4
estimated_hours: 40
tags: [tag1, tag2]
---
```

Required page content (body of the `.md` file):
- **Series Overview** — what the series teaches and why
- **Pedagogical Philosophy** — the learning approach
- **Learning Objectives** — numbered list of outcomes
- **Mathematical Progression** — per-cluster description of concepts covered
- **Computational Skills Developed** — bullet list
- **Prerequisites** — assumed and not-assumed
- **Entry Points by Background** — who should start where
- **Model Sequence** — per-cluster, per-model descriptions (the syllabus)
- **Estimated Time Investment** — per model and full series

Before creating a curriculum series page, write the full cluster and model plan. An incomplete series page on `/series/` signals to readers that the content is ready when it may not be. A post can carry `series:` and `series_order:` and use the `series-nav.html` sidebar long before the series has a `series_number` and appears on `/series/`.

**Workflow for introducing a new modelling series:**

1. Write posts with `series:`, `series_order:`, `cluster:`, `categories: [modelling]`
2. Create a minimal landing page (essay series type, no `series_number`) so `series-nav.html` and breadcrumbs work
3. Develop the full curriculum structure — cluster plan, model sequence, learning objectives
4. When the curriculum content is ready, add `series_number:` to the landing page and write the body
5. The series will then appear on `/series/`

### Domain-first series: industry verticals

Series 1–6 are **tool-first**: they introduce a mathematical concept and apply it to physical geography. Series 7 onwards uses a different pedagogy: **domain-first**. We encounter a real industry system, ask geographic questions, and develop the mathematics needed to answer them.

This approach suits economic geography and industry verticals — energy, trade, transport, urban systems, resource economics. The reader may arrive from the subject matter side (they work in the industry, or read about it) rather than from mathematics. The models earn their place by illuminating something real.

**Organising principle:** each cluster is an industry vertical. The mathematical tools introduced in one cluster recur in later ones — graph theory from pipeline networks reappears in trade corridor analysis; price surface concepts from energy netbacks recur in spatial arbitrage. The series accumulates a transferable toolkit through repeated application across domains.

**Relationship to essay series:** a domain-first modelling series often has a companion essay series covering the same territory narratively — applying the models, making political and geographic meaning, telling the story. Keep these as separate series: the essay series is a reading thread for non-technical readers; the modelling series is the curriculum. Posts can belong to only one `series:` value, so a post is either an essay or a model, not both. Cross-link them via the series landing pages.

**Example:** "Economic Systems" (Series 7, modelling) and "Alberta in Context" (essay series, no series number). The narrative essay "Alberta's Pipeline Geography" belongs to "Alberta in Context". The five quantitative models belong to "Economic Systems". The Series 7 landing page links to the Alberta in Context landing page as companion reading.

**Series landing page for a domain-first series** differs from Series 1–6 in emphasis:
- **Series Overview** — describe the industry domain and why geographic analysis reveals things other disciplines miss
- **Pedagogical Philosophy** — state the domain-first approach explicitly; explain what "systems-thinking geographer" means in this context
- **Learning Objectives** — frame outcomes as industry-reading skills, not mathematical competencies alone
- **Mathematical Threads** — list the cross-cutting concepts that recur across clusters (graph theory, price surface analysis, throughput economics, etc.)
- **Cluster sequence** — one section per industry vertical; describe planned clusters even before posts exist
- **Entry Points by Background** — address both industry professionals and geography students, since the domain-first approach attracts both

See `_pages/series-7-economic-systems.md` as the reference example.

---

## 13. Related posts and subscribe CTA

Both are included automatically on every post and essay page.

### Related posts

Shows up to three posts below the content. Scoring algorithm:

- +1 point for each matching tag
- +1 point if the post shares the same primary category

Posts with the highest score appear first. If no related posts exist (score = 0 for all), the section is hidden.

To improve related post quality: use consistent, specific tags. A post tagged `[solar, policy, net-zero]` will relate well to other posts with any of those tags.

### Subscribe CTA

A horizontal bar with the site description and an RSS link. The description text comes from `site.description` in `_config.yml` — no template editing required.

To suppress the CTA entirely on a site (e.g. a portfolio or homelab site where RSS subscription isn't the point), add to `_config.yml`:

```yaml
hide_subscribe_cta: true
```

This hides the block on all post and essay pages site-wide.

---

## 14. RSS and sitemap

Both are generated automatically by Jekyll plugins — no configuration required beyond having the plugins in `Gemfile` (they are already there).

| Output | URL | Plugin |
|--------|-----|--------|
| Atom feed | `/feed.xml` | `jekyll-feed` |
| XML sitemap | `/sitemap.xml` | `jekyll-sitemap` |

The sitemap includes all posts, pages, and archive pages. The feed includes the 10 most recent posts with full content.

---

## 15. Dark mode

### How it works

Dark mode is stored in `localStorage` under the key `'theme'` (value `'dark'` or `'light'`). On first visit with no saved preference, the site uses the `brand_default_theme` value from `_config.yml` (which may be `'dark'` or `'light'` depending on the brand).

An inline `<script>` in `<head>` reads `localStorage` and sets `data-theme` on `<html>` synchronously before first paint, preventing a flash of the wrong colour scheme.

### CSS theming

All colours are CSS custom properties in `src/main.css`. Dark variants are scoped to `[data-theme="dark"]`:

```css
:root {
  --text:    #111110;
  --bg:      #FAFAF8;
  --accent:  #F0177A;
  --border:  #E4E2DF;
}
[data-theme="dark"] {
  --text:    #ECEBE8;
  --bg:      #141413;
  --border:  #2A2A28;
}
```

Tailwind's dark mode variant also uses this selector: `darkMode: ['selector', '[data-theme="dark"]']` in `tailwind.config.js`.

**Per-brand dark overrides:** A brand file can further override dark mode tokens by scoping to both attributes:

```css
[data-brand="mysite"][data-theme="dark"] {
  --bg:     #0e0e0c;
  --text:   #f5f5f2;
  --text-2: #c2c2bc;   /* secondary body text — set independently, not reused from light mode */
  --text-3: #888882;   /* tertiary metadata */
}
```

`--text-2` in particular needs a separate dark value. Light-mode secondary greys (~`#5a5a56`) become illegible on near-black backgrounds. A value around `#b8b8b2`–`#c5c5bf` is appropriate for secondary body text. Additionally, humanist sans-serif fonts like Barlow have lighter stroke weight than DM Sans and may benefit from the `--text` value being closer to white on dark.

**Always-dark elements:** Some brand components (nav bar, footer) may need to stay dark regardless of the user's light/dark preference. Achieve this with hardcoded colour values rather than CSS custom properties in those component overrides:

```css
/* Nav always dark — not affected by [data-theme] */
[data-brand="mysite"] .nav {
  background: #0a0a0a;
  border-bottom: 3px solid var(--accent);
}
[data-brand="mysite"] .nav-links a {
  color: #737370;  /* hardcoded, not var(--text-2) which changes with theme */
}
```

### Components that sync with dark mode

| Component | Mechanism |
|-----------|-----------|
| Syntax highlighting | CSS `[data-theme="dark"]` selectors in `syntax.css` |
| Mermaid diagrams | Re-initialised with `theme: 'dark'` on toggle |
| Leaflet tiles | `MutationObserver` on `data-theme` swaps to `carto-dark` tiles |
| Giscus comments | `postMessage` API sends `setConfig` to iframe |
| Search panel | CSS custom properties — inherits automatically |

---

## 16. Images

### Feature images

Set in front matter:

```yaml
image: /assets/images/my-post.jpg
image_alt: "Descriptive alt text for screen readers"
image_caption: "Photo: Photographer Name, CC BY 4.0"
```

- `image` — path to the image. Use absolute paths (`/assets/images/...`) to avoid path issues.
- `image_alt` — **always provide this.** Screen readers and search engines use it.
- `image_caption` — optional; rendered as `<figcaption>` below the image.

### Sizing and loading

| Context | Recommended size | Loading |
|---------|-----------------|---------|
| Post feature image | 1400 × 600 px | `eager` |
| Essay hero image | 1200 × 400 px | `eager` |
| Post card | 600 × 338 px (16:9) | `lazy` |

### Content images

Images in Markdown:

```markdown
![Alt text for this image](/assets/images/figure.jpg)
```

The `_plugins/lazy_images.rb` plugin automatically adds `loading="lazy"` to all `<img>` tags in the rendered HTML that don't already have a `loading` attribute. You don't need to add it manually.

### OG / social sharing image

A default OG image applies to all posts via `_config.yml` defaults:

```yaml
defaults:
  - scope:
      path: "_posts"
    values:
      image: /assets/images/og-default.png
```

Override per-post by setting `image:` in front matter. The `jekyll-seo-tag` plugin reads `page.image` and populates `og:image` automatically.

---

## 17. Custom domain

### Files

**`CNAME`** (repo root) — contains your domain:

```
loomcollective.ai
```

**`_config.yml`:**

```yaml
url: "https://loomcollective.ai"
baseurl: ""
```

`baseurl` must be empty (`""`) when deploying to an apex domain or subdomain that maps to the repo root. Set it to `"/path"` only if the site lives at `https://example.com/path/`.

### DNS

Add a CNAME record at your DNS provider pointing your domain to GitHub Pages:

```
loomcollective.ai  CNAME  pauldhobson.github.io
```

For apex domains (no `www`), use ALIAS or ANAME records (or Cloudflare's CNAME flattening). GitHub's [custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) covers all cases.

GitHub Pages enforces HTTPS automatically via Let's Encrypt once DNS propagates.

---

## 18. GitHub Actions deployment

Deployment is fully automated via `.github/workflows/deploy.yml` in each **site repo**. Every push to `main` triggers a build and deploy.

### Build pipeline

```
push to main
  └── checkout with submodules: recursive  (fetches theme/ submodule)
  └── npm ci               (from working-directory: theme)
  └── npm run build        (Vite → ../assets/dist/main.{css,js})
  └── rsync -a theme/assets/css/ assets/css/
      rsync -a theme/assets/js/  assets/js/
  └── bundle install       (Ruby gems, cached)
  └── bundle exec jekyll build --baseurl ""  (→ _site/)
  └── npx pagefind --site _site              (→ _site/pagefind/)
  └── upload _site/ as GitHub Pages artifact
  └── deploy artifact to GitHub Pages
```

The `submodules: recursive` flag on the checkout step is essential — without it, `theme/` is an empty directory and the build fails immediately.

### Enabling GitHub Pages

1. Go to your repo **Settings → Pages**.
2. Source: **GitHub Actions**.
3. The workflow handles the rest.

### Environment and secrets

No secrets are needed for basic deployment. The workflow uses OIDC-based GitHub Pages deployment (no personal access token required).

If you add features that require secrets (e.g., a Mapbox token you don't want in source), add them via **Settings → Secrets and variables → Actions**, then reference in the workflow:

```yaml
- name: Build Jekyll site
  run: bundle exec jekyll build
  env:
    JEKYLL_ENV: production
    MAPBOX_TOKEN: ${{ secrets.MAPBOX_TOKEN }}
```

And inject into the page via a Jekyll variable in `_includes/head.html`.

### Caching

npm and Bundler caches are both enabled — `cache: "npm"` on the Node setup step (with `cache-dependency-path: theme/package-lock.json`) and `bundler-cache: true` on the Ruby setup step. A typical build after the first run takes about 60–90 seconds.

---

## 19. Video embeds

Two includes handle video content: `video.html` for self-hosted files and `embed.html` for YouTube/Vimeo.

### Native HTML5 video — `_includes/video.html`

```liquid
{% include video.html src="/assets/video/demo.mp4" caption="Optional caption" %}
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `src` | Yes | Path to the video file (passed through `relative_url`) |
| `poster` | No | Path to a poster image shown before playback |
| `caption` | No | Caption text displayed below the video |
| `type` | No | MIME type — defaults to `video/mp4` |
| `loop` | No | Add `loop` to repeat the video continuously |
| `autoplay` | No | Add `autoplay` to start on load (forces `muted`) |

`playsinline` is always set (required for iOS inline playback). `preload="metadata"` loads only the first frame and duration, avoiding unnecessary bandwidth on page load. When `autoplay` is set, `muted` is automatically added — browsers block audible autoplay.

### YouTube / Vimeo embed — `_includes/embed.html`

```liquid
{% include embed.html url="https://youtu.be/dQw4w9WgXcQ" caption="Optional caption" %}
{% include embed.html url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Video title" %}
{% include embed.html url="https://vimeo.com/123456789" caption="Vimeo example" %}
```

**Supported URL forms:**
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID` (extra query params are stripped)
- `https://vimeo.com/VIDEO_ID`

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Full video URL in any supported form |
| `title` | No | `title` attribute on the iframe (defaults to `Video embed`) |
| `caption` | No | Caption text displayed below the embed |

**Privacy note:** YouTube URLs are rewritten to `youtube-nocookie.com`. No cookies are set until the user presses play. Vimeo uses the standard player embed.

Both includes render in a `16:9` aspect-ratio wrapper with `border-radius` matching the site's `--radius` token. The CSS lives in `src/main.css`.

---

## 20. Presentations

The `presentation` layout renders a full-screen [Reveal.js](https://revealjs.com/) slideshow without the normal site header or footer.

### Front matter

```yaml
---
layout: presentation
title: "Presentation Title"
date: 2026-02-28
excerpt: "One-sentence description shown in meta tags."
---
```

### Slide syntax

Separate slides with `---` (a horizontal rule in Markdown, rendered as `<hr>` by kramdown). The layout splits the rendered HTML at every `<hr>` into individual `<section>` elements.

```markdown
---
layout: presentation
title: "My Talk"
date: 2026-02-28
---

# Slide one title
Some content.

---

## Slide two

- Bullet point
- Another bullet

---

## Code example

```javascript
const x = 1 + 1;
```
```

### Speaker notes

Add an `<aside class="notes">` element inside a slide. Notes appear only in the S-key speaker window:

```markdown
## My slide

Content visible to the audience.

<aside class="notes">
  These notes only appear in the speaker view (press S).
</aside>
```

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `F` | Fullscreen |
| `S` | Open speaker notes window |
| `O` | Slide overview |
| `B` | Blackout screen |
| `Esc` | Exit overview / fullscreen |

### Dark mode

The presentation reads `localStorage` for the `'theme'` key (the same key used by the rest of the site). If the value is `'dark'`, the Reveal.js `black.css` base theme is loaded instead of `white.css`. The theme swap happens before `Reveal.initialize()` to prevent a flash of the wrong theme.

### Styling

Override CSS lives in `assets/css/presentation.css` (a static file, not Vite-built — the same pattern as `assets/css/essay.css`). It uses Loom's fonts (Instrument Serif, DM Sans, JetBrains Mono) and accent colour (`#F0177A`). The back-to-site link in the top-left is styled via `.presentation-back`.

---

## 21. Photo galleries

The `gallery` include renders a responsive 3-column photo grid with a click-to-enlarge lightbox powered by Alpine.js. No extra libraries or dependencies.

### Front matter

Define the image list in the post's front matter:

```yaml
---
layout: post
title: "Glacier Field Sites"
gallery:
  - src: /assets/images/posts/findelen-01.jpg
    alt: "Findelen Glacier from the lateral moraine"
    caption: "Looking south towards the Findelen, September 2018"
  - src: /assets/images/posts/gorner-01.jpg
    alt: "Gorner Glacier confluence"
  - src: /assets/images/posts/mer-de-glace.jpg
    alt: "Mer de Glace ablation zone"
    caption: "Annual ice loss markers, July 2017"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `src` | Yes | Image path — absolute (`/assets/images/...`) recommended |
| `alt` | Yes | Alt text for accessibility and screen readers |
| `caption` | No | Caption shown below the image in the lightbox |

### Usage in content

```liquid
{% include gallery.html %}
```

This uses `page.gallery` by default. To pass a custom array:

```liquid
{% include gallery.html images=page.my_custom_gallery %}
```

### Lightbox controls

| Action | Control |
|--------|---------|
| Open | Click any thumbnail |
| Close | `Esc`, close button, or click outside the image |
| Previous / next | `←` / `→` arrow keys, or the on-screen buttons |

A `1 / N` counter appears at the bottom. Captions are shown only when present.

### Recommended image sizing

| Use | Recommended size |
|-----|-----------------|
| Thumbnail (grid) | 800 × 600 px |
| Lightbox (full view) | 1600 × 1200 px or native |

The grid cells use a fixed `4:3` aspect ratio with `object-fit: cover`. The lightbox displays images at their natural size, constrained to the viewport.

### Organising gallery images

Keep gallery images in a post-specific folder:

```
assets/images/posts/glaciers-field-sites/findelen-01.jpg
assets/images/posts/glaciers-field-sites/gorner-01.jpg
```

---

## 22. Authors

Author profiles are stored in `_data/authors.yml`, keyed by slug. All display locations (post header, post card, essay hero, author bio card, author profile page) resolve the slug to the full data automatically.

### Adding an author

Add an entry to `_data/authors.yml`:

```yaml
jane-smith:
  name: Jane Smith
  bio: >
    Hydrologist and climate scientist. Research focus on Arctic river discharge
    and permafrost hydrology.
  image: /assets/images/authors/jane-smith.jpg   # optional
  location: "Montréal, QC"                        # optional
  website: "https://janesmith.ca"                 # optional — leave "" to hide
  twitter: "janesmith"                            # optional — handle only, no @
  github: "janesmith"                             # optional
```

Create a profile page at `_pages/authors/jane-smith.md`:

```yaml
---
layout: author
title: Jane Smith
author_slug: jane-smith
permalink: /author/jane-smith/
---
```

The profile page automatically lists all posts with `author: jane-smith`.

### Per-post author

Set `author:` in post front matter using the slug:

```yaml
author: jane-smith
```

Falls back to `site.author` (defined in `_config.yml`) if not set.

### Co-authored posts

Pass an array of slugs:

```yaml
author: [paul-hobson, jane-smith]
```

Both names render as links in the byline and author card. Both authors' profile pages will include the post.

### Author photo

Place at the path set in `_data/authors.yml` under `image:`. Recommended: 400 × 400 px, square crop, JPEG.

```
assets/images/authors/jane-smith.jpg
```

If no image is set (or the key is empty), a placeholder avatar SVG is shown.

---

## 23. Drafts workflow

Drafts live in `_drafts/` and are excluded from the production build. They are committed to git for version control and backup.

### Creating a draft

```bash
npm run new -- "My Post Title"
```

Creates `_drafts/my-post-title.md` with a complete front matter template. The filename is auto-slugified from the title.

### Previewing drafts locally

```bash
npm run preview
```

Runs `bundle exec jekyll serve --drafts` — drafts are rendered as if they were published posts, using today's date as their date.

### Publishing a draft

```bash
npm run publish -- my-post-title.md
```

Moves `_drafts/my-post-title.md` to `_posts/YYYY-MM-DD-my-post-title.md` using today's date. The post is then included in the next build.

### Listing available drafts

```bash
npm run publish
```

Running without an argument prints the list of available draft filenames.

### Workflow summary

```
npm run new -- "Draft title"     # create
npm run preview                  # review locally
# edit _drafts/draft-title.md
npm run publish -- draft-title.md   # ship it
git add _posts/ && git commit ...   # commit and push
```

---

## Appendix: front matter quick reference

```yaml
---
# ── Required ───────────────────────────────────────────────────────────────────
layout: post                   # post | essay | page | default
title: "Title"
date: 2026-03-01

# ── Common optional ────────────────────────────────────────────────────────────
excerpt: "One sentence."
categories: [Topic]            # One per post recommended
tags: [tag1, tag2, tag3]
author: Name
image: /assets/images/img.jpg
image_alt: "Alt text"
image_caption: "Caption"
featured: true
updated: 2026-03-15
comments: true

# ── Series ─────────────────────────────────────────────────────────────────────
series: "Series Name"
series_order: 1

# ── Viz flags (optional — auto-detected from content) ──────────────────────────
math: true
diagram: true
viz: true
gl: true                       # ECharts GL: adds scatter3D, bar3D, surface — requires viz: true too
d3: true
leaflet: true
geo: true
story: true                    # Essay only — enables scrollytelling

# ── Gallery (see §20) ───────────────────────────────────────────────────────────
gallery:
  - src: /assets/images/posts/photo.jpg
    alt: "Alt text"
    caption: "Optional caption"  # shown in lightbox
---
```

---

## Appendix: viz element quick reference

```html
<!-- KaTeX: inline -->
$f(x) = x^2$

<!-- KaTeX: display -->
$$\int_0^\infty e^{-x}\,dx = 1$$

<!-- Mermaid diagram -->
```mermaid
graph LR; A-->B-->C
```

<!-- ECharts (any ECharts option) -->
<div data-viz="echarts" style="height:300px" data-options='{"series":[{"type":"bar","data":[1,2,3]}], "xAxis":{"type":"category","data":["A","B","C"]}, "yAxis":{"type":"value"}}'></div>

<!-- D3 bar -->
<div data-d3="bar" style="height:260px" data-options='{"data":[{"label":"A","value":10}]}'></div>

<!-- D3 line -->
<div data-d3="line" style="height:260px" data-options='{"data":[{"x":2020,"value":1},{"x":2024,"value":4}]}'></div>

<!-- D3 force graph -->
<div data-d3="force" style="height:340px" data-options='{"data":{"nodes":[{"id":"A"},{"id":"B"}],"links":[{"source":"A","target":"B"}]}}'></div>

<!-- Ricker model widget -->
<div data-viz="ricker" style="height:360px;"></div>

<!-- Leaflet map -->
<div data-leaflet style="height:400px" data-lat="51.5" data-lng="-0.09" data-zoom="12" data-tiles="carto"></div>

<!-- Mapbox map -->
<div data-map="london" data-token="pk.eyJ..." style="height:400px;"></div>

<!-- ECharts GL 3D chart (requires gl: true in front matter) -->
<script type="module">
while (!window.echarts) await new Promise(r => setTimeout(r, 50));
const chart = window.echarts.init(document.getElementById('my-3d-chart'));
chart.setOption({
  xAxis3D: { type: 'value' }, yAxis3D: { type: 'value' }, zAxis3D: { type: 'value' },
  grid3D: {},
  series: [{ type: 'scatter3D', data: [[0,0,0],[1,1,1]] }]
});
</script>
```

---

## Appendix: known rendering problems and fixes

### Problem: ECharts 3D charts render blank (scatter3D, bar3D, surface)

**Symptom:** Post has `scatter3D`, `bar3D`, `line3D`, `surface`, or `grid3D` in the chart options but the chart container is empty. No JavaScript error — ECharts silently ignores unknown series types without the GL extension.

**Cause:** The 3D chart types require the **ECharts GL** extension (`echarts-gl.min.js`), a separate library not included in base `echarts.min.js`.

**Fix:** Add `gl: true` to the post's front matter alongside `viz: true`:

```yaml
viz: true
gl: true   # ← required for scatter3D, bar3D, surface, grid3D, etc.
```

The registry entry for `echarts-gl` is ordered after `echarts` in `viz-registry.js`, ensuring the base library loads first.

---

### Problem: Currency dollar signs render as broken math (KaTeX false-positive)

**Symptom:** A post containing dollar amounts like `$50 billion` or `$1.2 trillion` shows garbled text with math fonts or KaTeX error markup — even though the post does not declare `math: true`.

**Cause:** The KaTeX registry entry auto-detected any `$` in page content and loaded KaTeX, which then tried to parse currency values as LaTeX math expressions.

**Fix (build process):** `detect` in `viz-registry.js` now only auto-triggers on `$$` (display math delimiters). Single `$` no longer triggers auto-load.

**Rule:** Add `math: true` to front matter for any post containing LaTeX. Do not rely on auto-detection.

---

### Problem: ECharts inline script chart stays blank

**Symptom:** Post has `viz: true` and a custom `<script type="module">` block with inline ECharts, but the chart remains empty.

**Cause:** Inline script accesses `echarts` before `core.js` has fetched it from CDN, or uses the `typeof echarts !== 'undefined'` poll form instead of the canonical `!window.echarts`.

**Fix:** Use this exact boilerplate:

```html
<script type="module">
while (!window.echarts) await new Promise(r => setTimeout(r, 50));

const chart = window.echarts.init(document.getElementById('my-chart'));
// ... chart setup ...
</script>
```

- `type="module"` is required (enables top-level `await`)
- `viz: true` is required in front matter (tells core.js to load ECharts)
- Use `window.echarts`, not bare `echarts`

---

### Problem: Ground track / geo chart shows lines but no map background

**Symptom:** A post uses ECharts' `geo` coordinate system but the map background is blank grey.

**Cause:** `echarts.registerMap('world', { type: 'FeatureCollection', features: [] })` was called with an empty GeoJSON placeholder.

**Fix (preferred):** Convert to a cartesian2d chart. Use `xAxis` for longitude (−180 to 180) and `yAxis` for latitude (−90 to 90). The `[lon, lat]` data format maps directly. Add `markLine` reference lines for the equator and latitude bounds. Remove the `registerMap` call entirely.
