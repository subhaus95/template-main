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

## Phase D — Audience connection

Features that help readers understand the site, engage with the content, and reach the author. All items here are achievable within the static constraint.

### D1. Site orientation page

The Start Here page (A3) answers "where do I begin?" but not "how does this site work?". New readers — especially those arriving at a computational essay mid-series — have no context for: what interactive visualisations can do, how series/difficulty navigation works, what the Math Primer is for, or how localStorage progress is saved.

A dedicated `/about/how-to-use/` page (or a section within the Start Here page) should cover:
- What a computational essay is and how to read one (TOC, interactive charts, footnotes)
- The series/cluster/difficulty system and how to navigate it
- The Math Primer and when to use it
- Mark-as-complete and what it means (localStorage, not synced)
- How search works (`⌘K`)

Implementation: pure Jekyll/Liquid static page. No new template infrastructure needed. Could itself be written as a short essay in the essay layout — modelling the format it describes.

### D2. Open-source model attribution

The computational models embedded in essays are open source, but there is no in-page signal that readers can inspect, fork, or run the code. For a technical audience, the ability to view and modify source is a differentiator.

Two levels of attribution:

**Site-level:** A visible statement (About page, footer, or essay sidebar) that all models are open source, linking to the GitHub organisation. This can be a single line of copy; no front matter changes needed.

**Per-essay:** An optional `github_source` front matter key. When set, renders a "View source on GitHub" link in the essay hero or alongside the model. Value is a path relative to the repo root (e.g. `assets/js/models/ricker.js`), resolved to an absolute URL via `site.github.repository_url`.

```yaml
github_source: assets/js/models/ricker.js
```

Implementation: one conditional in `essay-hero.html` or a new `model-source.html` include. Backwards-compatible; renders nothing on posts without the key.

### D3. Comment and response strategy

Giscus requires a GitHub account. This is a low barrier for the developer-adjacent technical audience but a real barrier for academic readers, industry analysts, and policy-oriented readers — precisely the constituencies the applied series (19–25) are written for.

**Immediate (no new infrastructure):**
Add a "Reply by email" mailto link below the Giscus widget on every post with `comments: true`. Pre-fill the subject line with the post title via Liquid:

```html
<a href="mailto:{{ site.email }}?subject=Re: {{ page.title | uri_escape }}">Reply by email</a>
```

Requires only `site.email` in `_config.yml`. Zero maintenance overhead. Renders alongside Giscus, not instead of it — GitHub users get Giscus; everyone else gets a low-friction fallback.

**Phase B addition — Webmentions:**
[Webmentions](https://www.w3.org/TR/webmention/) allow readers to respond from their own platforms (Mastodon, a personal blog, etc.) and have those responses surface on the post. The static-site implementation:

1. Register with [webmention.io](https://webmention.io/) (free) — provides a receiving endpoint
2. Add `<link>` tags to `head.html` pointing at the endpoint
3. Connect [Bridgy](https://brid.gy/) to translate Mastodon/social mentions into webmentions
4. Fetch and render received webmentions via JS on page load (small script, no framework dependency)

No account required from the reader. Rewards the Mastodon-active academic audience and makes cross-blog discussion visible on the post. Fits cleanly into the existing static architecture.

**If proper non-GitHub comments become necessary:**
[Cusdis](https://cusdis.com/) is the closest like-for-like replacement for Giscus without the GitHub requirement. Readers need only a name and email. Author moderates via email notification. Free hosted tier; open source for self-hosting. Iframe embed, ~5KB, no tracking. The current Giscus include could be made conditional on a `comment_system` config key (`giscus` | `cusdis`) to allow per-site selection.

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
- Community forums (threaded discussion, moderation tools, member profiles)
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
