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

## Brand — Franklin Axis visual identity ✓

Implemented as `assets/css/brand-wayward.css` in the waywardhouse site repo. No submodule changes required except the addition of `hero-badge` to `home.html`.

### Type system ✓
Three-tier Franklin Axis stack: Barlow Condensed (display/headlines), Barlow (body), IBM Plex Mono (labels/metadata/code). Loaded via `fonts_url` in `_config.yml` — the correct per-brand font mechanism. Base token `--font-heading` mapped to the display face so all 30+ template component references pick up Barlow Condensed automatically.

### Colour palette ✓
EDGE red (`#e02020`) accent, warm near-black/paper surface scale, amber (`#f0a800`) for numeric display on dark surfaces. Red-tinted (`#fde8e8`) callout panels — not full red surfaces.

### Dark mode text legibility ✓
Secondary and tertiary text tokens set independently for dark mode. `--text-2: #c2c2bc` (was `#9a9a94` — too dim for body text on near-black). `--text-3: #888882` (was `#5a5a56` — genuinely illegible). Documents the pattern for future brands.

### Navigation and footer ✓
Always-dark nav bar (hardcoded `#0a0a0a`, not `var(--bg)`) with 3px red bottom border. Mono caps navigation links. Matching dark footer with red top border. Approach documented in HOWTO.md §15 as the pattern for always-dark elements.

### Post cards ✓
Flat — no lift animation, no box shadow. Border flips red on hover. Condensed uppercase card titles (weight 700), mono caps metadata.

### Home page hero ✓
Black cover band, always dark. 3:2 column grid with 1px dark divider. Massive condensed headline (`clamp(3rem, 7.5vw, 6rem)`, weight 800, line-height 0.85). Condensed uppercase subtitle in muted. Right column: latest post as text-only editorial panel on dark background, no card chrome. 6px red right-edge bar. Stacks cleanly to single column at mobile. `hero-badge` element added to `home.html` (one line, backwards-compatible).

### Section structure ✓
4px black top rule on section headers. Section titles use the spec-lbl extending-rule pattern: `TITLE ──────────────────── View all →`. Mono caps "view all" links, margin-left separated from the rule. Consistent across all home sections.

### Stream cards ✓
Full redesign as alternating black/white surface panels (nth-child pattern). White surface for odd cards, near-black (`#0a0a0a`) for even cards. Titles at `clamp(2rem, 3.5vw, 3rem)` weight 800 condensed, line-height 0.9. Both surfaces flip to black on hover. Stack to single column at 640px. The streams section itself loses top/bottom padding — the cards fill edge to edge within the max-width container, framed by a 4px black rule above.

### Lead article treatment ✓
First card in both `.posts-grid` and `.featured-grid` spans two columns and shifts to horizontal (image left, body right). Title at 2rem. Falls back to stacked column layout at 768px and when no feature image is present (`:has(.card-image--no-feature)`).

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
| `hero_badge` | home.html hero band | Mono caps label above headline; defaults to `site.title` |
| `streams` | home.html two-stream block | Site-level config list |
| `footer_tagline` | footer brand column | Falls back to `site.description` |
| `footer_topics` | footer col 2 | List of `{title, url}`; falls back to auto-generated categories |
| `footer_topics_title` | footer col 2 heading | Default `"Topics"` |
| `footer_nav_title` | footer col 3 heading | Default `"Company"` |
