# Wayward House — UX Roadmap

## Architecture philosophy

The site is and should remain a **static Jekyll site on GitHub Pages**. That means:

- No user accounts, no backend, no database
- Free hosting; no infrastructure to maintain
- Open authoring — solo or multi-author via git
- Code published openly in GitHub repos alongside essays
- Any "interactivity" lives in localStorage or Alpine.js — no server round-trips

If the site ever evolves into a proper learning platform (user progress sync, instructor tools, institutional adoption), that is a separate architectural decision that warrants a separate platform — not bolt-ons to a static site.

---

## Phase A — Content infrastructure (static, no new tech)

Everything here works within Jekyll + Liquid + existing front matter.

### A1. Enhanced series page ✓
Cluster grouping within each series, difficulty display per essay, semantic CSS replacing inline styles.

### A2. Essay page additions ✓
- Series breadcrumb: `Series name › Cluster title › Essay N`
- Difficulty badge (if `difficulty` set in front matter)
- Prerequisites block (if `math_core` set)
- "Continue reading" block pointing to next essay in `series_order`

### A3. Learning paths / Start Here page ✓
Static curated sequences for different entry points. Manual curation; no automation.

---

## Phase B — Lightweight interactivity (Alpine.js + localStorage)

No backend required. Progress is per-browser; not synced across devices. Acceptable for a reading-oriented site.

### B1. Guided diagnostic
3–5 Alpine.js questions → localStorage stores result → recommend a starting path.
Entry point: the Start Here page or a dedicated `/start/` form.

### B2. Mark as complete ✓
Per-essay checkbox stored in localStorage under `wh-complete:{url}`. Series page reads these to show completion indicators. Toggle button rendered by `essay-complete.html` include; Alpine component `essayProgress` in `src/main.js`.

### B3. Difficulty filter on series page ✓
Alpine.js `difficultyFilter` component on the series page wrapper. CSS attribute selectors (`[data-filter="N"] .cluster-essay-item:not([data-difficulty="N"])`) hide non-matching essays without per-item Alpine instances. `:has()` CSS hides empty cluster sections. Filter applies to modeling essays only — other categories always render at `data-difficulty="0"`.

---

## Phase C — External services (only if content volume justifies)

Defer until there are 50+ essays and measurable multi-device readership.

### C1. Faceted search
Pagefind handles the core case. Algolia adds filtering by series, difficulty, prerequisites — only worth the integration cost at scale.

### C2. Progress sync
Supabase (free tier) for cross-device progress. Requires user accounts — significant UX and maintenance overhead.

---

## Not on the roadmap

These require a platform shift, not a template enhancement:

- Instructor portal / class management
- Achievement / badge system
- Community forums beyond Giscus
- LMS integration (Moodle, Canvas)
- Print-on-demand textbook
- Mobile app / PWA

If institutional adoption materialises, evaluate migrating content to an LMS-portable format (SCORM, xAPI, or a headless CMS) rather than rebuilding the static site into a platform.

---

## Front matter reference

Keys currently rendered by the template (conditional — safe for sites that don't use them):

| Key | Where rendered | Notes |
|---|---|---|
| `series` | essay-hero breadcrumb, series-nav | Enables series nav sidebar |
| `series_order` | essay-hero breadcrumb, essay-next | Integer; used to find next essay |
| `series_number` | series landing pages, Start Here page | Integer; used by `where: "series_number", N` to look up series landing pages |
| `cluster` | series page grouping | Letter or short code |
| `cluster_title` | essay-hero breadcrumb, series page | Human-readable cluster name |
| `difficulty` | essay-hero badge, series page | Integer 1–5; badge only rendered for `modeling` category posts |
| `math_core` | essay-hero prerequisites block | Array of strings; rendered as comma-separated text |
| `featured` | home.html featured section | Boolean |
| `streams` | home.html two-stream block | Site-level config list |
| `footer_tagline` | footer brand column | Falls back to `site.description` |
| `footer_topics` | footer col 2 | List of `{title, url}`; falls back to auto-generated categories |
| `footer_topics_title` | footer col 2 heading | Default `"Topics"` |
| `footer_nav_title` | footer col 3 heading | Default `"Company"` |
