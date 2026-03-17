# Publishing Strategy and Pipeline
## All Web Properties — Shared Reference

*This document covers editorial strategy, content type definitions, and the publishing
pipeline across all properties in this workspace. Technical deep-dives for the
Computational Geography Lab live in DocMost and Gitea — this document is the
strategic layer above that.*

*For the expert agent architecture that automates and accelerates each pipeline stage,
see [`AGENTS.md`](AGENTS.md) in this same directory.*

*Last updated: 2026-03-17.*

---

## Part I: Property Briefs

Each property has a distinct audience, editorial voice, and content remit. The shared
Jekyll/Vite/template-main infrastructure supports all of them, but the content strategy
for each is intentionally different.

---

### WaywardHouse — `wayward.house`

**Positioning:** Geography as systems thinking. A serious long-form publication at the
intersection of political economy, environmental geography, and computational modelling.
Peer to the kind of work published in Noema, Works in Progress, or the more analytical
end of The Atlantic — rigorous but readable, data-driven but not dry.

**Primary audience:** Educated generalists with an interest in place, economy, and
environment. Policy-adjacent readers, geography academics, urban planners, and
anyone who wants to understand how places actually function and why. Not a specialist
journal; not a blog.

**Editorial voice:** First person is available but not required. Authoritative without being
academic. The prose earns its complexity — long sentences only when the structure is doing
work. Concrete before abstract: open with a scene, a number, or a contradiction before
stating a thesis.

**Content types:**
- **Editorial essay** (`layout: essay`) — long-form narrative analysis, 6,000–10,000 words,
  citations, footnotes, ECharts charts, formal References section. The primary product.
- **Computational model** (`layout: model`) — interactive mathematical/simulation essays
  with Pyodide cells, KaTeX, and structured series organisation. Companion to the
  editorial programme.
- **Post** (`layout: post`) — shorter commentary, 800–2,000 words. Used sparingly for
  time-sensitive pieces or shorter analytical takes.

**Content that does not belong here:** Personal opinion without data grounding.
Anything that reads like a blog post. Consultancy positioning or sales language.

**Quality benchmark:** "The Burning Strait" — concrete opening scene, multiple data
visualisations, 20+ footnotes, formal references, 8,000+ words. Every editorial essay
should feel like something a reader bookmarks, shares, and returns to.

**Series structure:**
- *Alberta in Context* — editorial and analytical essays on Alberta's political economy
- *Economic Systems* — numbered computational model series (currently 33 entries)

---

### QShift — `qshift.github.io`

**Positioning:** A consultancy-facing publication for strategic analysis and thought
leadership. The writing supports and precedes client engagement — it demonstrates a
way of thinking rather than selling a service directly. Think McKinsey Global Institute
or BCG Henderson Institute, but with a distinct analytical voice and without the
corporate hedging.

**Primary audience:** Senior decision-makers in business, government, and civil society.
People who commission strategy work, not people who execute it. Readers arrive via
referral, LinkedIn shares, or targeted distribution — not search.

**Editorial voice:** Authoritative and direct. First person sparingly. No jargon without
definition. Uses data and structural argument rather than opinion. The implicit message
is always *here is how to think about this problem clearly* rather than *here is what
you should do*.

**Content types:**
- **Coffee-table essay** (`layout: essay`) — long-form analytical pieces, 3,000–6,000
  words, high visual polish, one or two ECharts charts, citations but not academic
  footnote density. The primary product.
- **Post** (`layout: post`) — shorter analytical notes, 600–1,500 words. Strategic takes
  on current events or sector developments.
- **Case study** (future) — structured engagement summaries, anonymised. May require
  a custom layout.

**What separates QShift from WaywardHouse:** QShift essays are shorter, less
data-dense, and more directly useful to a decision-maker. They do not carry
Pyodide cells, KaTeX, or cluster-numbered computational series. Charts are
illustrative and clean, not technically deep. The prose is tighter.

**Content that does not belong here:** Academic citation apparatus. Computational
models. Anything that requires specialist knowledge to follow. Personal voice or
opinion pieces.

**Visual standard:** High. Charts must be immediately interpretable at a glance.
No chart should require explanation — if it does, redesign it. Two charts per piece
maximum; one is often better.

---

### Paul Hobson — `pauldhobson.github.io`

**Positioning:** The personal site. A professional home base that functions as
extended CV, portfolio, and occasional personal writing. Not a blog in the daily-update
sense — more like a curated record of work and thinking over time.

**Primary audience:** People who have just met Paul professionally and are doing
background research. Potential collaborators, conference contacts, commissioning editors.
The site should answer the question *who is this person and what do they make?*

**Editorial voice:** First person throughout. Warmer and more personal than WaywardHouse
or QShift. Allowed to be exploratory and provisional in a way the other sites are not.

**Content types:**
- **Post** (`layout: post`) — personal writing, reflections, shorter analytical pieces.
  Length is flexible: 500–3,000 words depending on the piece.
- **Project page** (using `_pages/` or a custom `_models/` entry) — portfolio pieces
  describing specific work, with outputs, methods, and context.
- **About / CV content** (`_pages/`) — static professional information.

**What does not belong here:** Formal citations and footnote apparatus — this is a
personal site, not a journal. Highly technical computational essays belong on
WaywardHouse. Commercial positioning belongs on QShift.

**Cadence:** No obligation to publish regularly. Quality over frequency.

---

### Loom Collective — `loomcollective.github.io`

**Positioning:** TBD — the brand and editorial direction are not yet fully established.
The name suggests collaborative authorship, the weaving together of multiple
perspectives, or a platform for collective analytical work.

**Working assumption for now:** An editorial platform for collaborative long-form
writing with a similar quality bar to WaywardHouse but potentially multiple voices
and a broader subject remit. Not a consultancy site (that is QShift). Not personal
(that is Paul Hobson).

**Content types (provisional):**
- **Essay** (`layout: essay`) — long-form collaborative or solo analysis.
- **Post** (`layout: post`) — shorter pieces.
- Computational models are a *possible future addition* once the editorial programme
  is established. Do not build computational infrastructure here until the editorial
  direction is clearer.

**Action before publishing here:** Define the positioning, audience, and editorial
voice fully before committing content. The infrastructure is ready; the strategy is not.

---

### Subhaus95 — `subhaus95.github.io`

**Positioning:** Scrappy working notes. A digital garden or personal knowledge base —
public-facing but not polished. The writing here is thinking-in-progress rather than
finished argument. Notes, half-formed ideas, dev observations, personal reference
material.

**Primary audience:** Paul himself, plus anyone who finds it via search and benefits
from the roughness being shared publicly.

**Editorial voice:** Informal. Incomplete is fine. Notes can be updated in place.
No obligation to cite everything. No expectation of the reader having context.

**Content types:**
- **Post** (`layout: post`) — the only content type used here. Short to medium length.
  No formal structure required.

**Explicit non-requirements:** Formal references. Multiple revisions. Complete
arguments. This site is exempt from the quality standards that apply to WaywardHouse
and QShift.

**Cadence:** Whenever there is something worth noting. Frequency over polish.

---

## Part II: Shared Content Type Specifications

The following content types are implemented in `template-main` and are available to all
properties. Each property uses a subset — see the briefs above.

### Post (`layout: post`)

Used everywhere. The lowest overhead content type.

**Front matter minimum:**
```yaml
---
layout: post
title: "Title"
date: YYYY-MM-DD
categories: [Category]
tags:
  - tag-one
image: /assets/images/og-default.webp
description: "One sentence for SEO."
---
```

**Quality range by property:**

| Property | Expected length | Citations | Charts |
|---|---|---|---|
| WaywardHouse | 800–2,000 | Inline links acceptable | Optional |
| QShift | 600–1,500 | Not required | 0–1 |
| Paul Hobson | 500–3,000 | Not required | Optional |
| Subhaus95 | Any | Not required | Rare |
| Loom Collective | 800–2,000 | Inline links acceptable | Optional |

---

### Essay / Coffee-Table Essay (`layout: essay`)

The primary long-form content type. Used at WaywardHouse, QShift, and eventually
Loom Collective. Not used at Subhaus95.

**Front matter:**
```yaml
---
layout: essay
title: "Title"
subtitle: "Optional subtitle"
date: YYYY-MM-DD
categories: [Category]
tags:
  - content-tag
  - tag-hash-viz        # include if page has charts
  - tag-hash-math       # include if page has KaTeX
image: /assets/images/og-[slug].webp
featured: false
comments: true
series: "Series Name"   # if applicable
series_order: N         # if applicable
description: >
  Two sentence description.
---
```

**Structural conventions (all essay-layout pieces):**
- Named sections with `## ` headings
- Pull-quote boxes: `> **Label.** Body text.`
- `---` horizontal rules between major sections
- Charts introduced with a sentence of context; captions below in italics
- Dollar signs in prose escaped as `\$`

**Citation standards — tiered by property:**

| Property | Footnotes | Formal References | Academic format |
|---|---|---|---|
| WaywardHouse | Required (15+) | Required (8+ sources) | Yes |
| QShift | Light (4–8) | Optional | No — use prose attribution |
| Paul Hobson | Optional | No | No |
| Loom Collective | Required | Recommended | Yes |

---

### Computational Model (`layout: model`, `_models/`)

**WaywardHouse only for now. Loom Collective when its editorial direction is confirmed.**

Full specification in the [Computational Geography Lab documentation](#extended-documentation).

Summary requirements:
- `cluster: XX` (two-letter code, no single-letter codes for new clusters)
- `series: "Economic Systems"` (for `/series/` listing)
- `series_order: N` (unique within series)
- Pyodide cells in `<div class="pyodide-cell"><pre><code class="language-python">` HTML format — not markdown fences
- At least one interactive Pyodide cell per model
- KaTeX for all mathematical notation — trigger with `tag-hash-math` in tags
- Footer text must match cluster code (not stale from earlier draft)

---

## Part III: Visualisation Standards

Visualisation capability is available to all properties via the shared ECharts adapter.
The *depth* of use varies by property.

### Usage by property

| Property | ECharts | Pyodide | Mapbox/Leaflet | KaTeX |
|---|---|---|---|---|
| WaywardHouse editorial | Full | No | Yes | No |
| WaywardHouse models | Full | Yes | Yes | Yes |
| QShift | Simple only | No | No | No |
| Paul Hobson | Optional | No | No | No |
| Loom Collective | Full (future) | Future | Future | Future |
| Subhaus95 | Rare | No | No | No |

**"Simple only" for QShift** means: bar charts, line charts, and dual-axis charts.
No Sankeys, no geographic scatter maps, no demographic pyramids. Charts should be
immediately readable without interpretation.

### Universal ECharts rules

- `backgroundColor: "transparent"` always
- All text colours via CSS tokens: `var(--text)`, `var(--text-2)`, `var(--border)`
- Attribute syntax: single quotes outer, double-quoted JSON inner
- JSON must be minified (no newlines) in the `data-options` attribute
- Validate before committing:

```bash
python3 -c "
import sys, json, re
m = re.search(r\"data-options='([^']+)'\", open('file.md').read())
json.loads(m.group(1))
print('Valid')
"
```

### Standard colour palette (all properties)

| Role | Hex | CSS token equivalent |
|---|---|---|
| Primary (blue) | `#4e8ac4` | `var(--accent)` (approximate) |
| Secondary (gold) | `#e8cc6a` | — |
| Positive / growth | `#4ec46a` | — |
| Alert / rising | `#c44e4e` | — |
| Neutral / baseline | `#9ca3af` | — |

---

## Part IV: The Publishing Pipeline

The pipeline is the same for all properties. The effort at each stage scales with
the content type and property.

```
IDEA → RESEARCH → STRUCTURE → WRITE → VISUALISE → REVIEW → BUILD → PUBLISH → AMPLIFY
```

### Quick-reference effort by content type

| Stage | Subhaus post | QShift post | WH/QShift essay | WH model |
|---|---|---|---|---|
| Ideation | Minutes | 30 min | 1–2 hr | 1–2 hr |
| Research | None | Hours | Days | Days |
| Write | 30 min | 2–4 hr | 1–3 days | 2–4 days |
| Visualise | None | 0–1 chart | 2–6 charts | 3–8 charts + Pyodide |
| Review | Skim | 30 min | 2 hr | 2 hr |
| Build/Publish | 5 min | 15 min | 15 min | 15 min |

---

### Stage 1 — Ideation

- Topic, thesis, and audience confirmed
- Property assignment confirmed (if ambiguous: is it personal → Paul; consultancy → QShift; analytical geography → WaywardHouse)
- Content type confirmed (length and depth appropriate for the property)
- Quality benchmark named (reference an existing piece at the target level)
- Draft created via `npm run new -- "Title"` from site repo

---

### Stage 2 — Research

**WaywardHouse and Loom Collective:**
- Primary data sources (Statistics Canada, CMHC, government datasets, academic papers)
- All quantitative claims traceable to a source
- Footnote content drafted alongside the research
- Chart data assembled in approximate form (exact figures verified pre-publish)

**QShift:**
- Supporting data for key claims — does not need academic depth
- Prose attribution ("according to X") preferred over footnote apparatus
- No more than 6–8 endnotes

**Paul Hobson and Subhaus95:**
- No formal research requirements

---

### Stage 3 — Structure

Set front matter before writing. Key rules:

- `series:` value must exactly match `series_key:` in the syllabus page (display name string, not slug)
- `series_order:` must be unique — check existing files
- `tag-hash-viz` in tags triggers the visualisation runtime
- `tag-hash-math` in tags triggers KaTeX
- WaywardHouse models: `cluster: XX` using two-letter code

---

### Stage 4 — Writing

**Dollar signs:** Escape monetary values in prose as `\$65/MWh` to prevent Kramdown interpreting `$...$` pairs as math delimiters.

**LaTeX:** No `\\` inside display math blocks or inside `\text{}`. Use `\,` for spacing, not `\\`.

**Pyodide cells:** Must use raw HTML `<div class="pyodide-cell"><pre><code class="language-python">` — markdown fences inside raw HTML divs do not render.

**Pull-quote boxes** (essay layout): `> **Label.** Body text.`

---

### Stage 5 — Visualise

Select chart type by argument, not by data shape:

| Story | Type | Notes |
|---|---|---|
| Change over time | Stacked bar or line | Stack only when parts sum to a whole |
| Flow between sources | Sankey | `left: "22%"` minimum to prevent label clipping |
| Geographic distribution | Scatter on lat/lng axes + border `line` series | |
| Demographic comparison | Horizontal grouped bar | |
| Two metrics, different scales | Dual-axis bar + line | |

For QShift: use only the first two rows of the above table.

---

### Stage 6 — Review

Before committing any essay:

- [ ] All `[^N]` markers have matching `[^N]:` definitions
- [ ] No unescaped `$` pairs in prose
- [ ] All ECharts JSON is valid (run validation script)
- [ ] Pyodide cells use HTML format, not markdown fences
- [ ] No `\\` in LaTeX display math
- [ ] `series:` matches `series_key:` in syllabus (WaywardHouse models)
- [ ] Cluster code in front matter matches footer text in model body
- [ ] Formal References section present (WaywardHouse essays with 8+ sources)
- [ ] OG image file exists at the specified path

---

### Stage 7 — Build and Test

Two-terminal local dev (run from the site repo):

```bash
# Terminal 1 — inside theme/
cd theme && npm run dev

# Terminal 2 — site root
bundle exec jekyll serve --livereload
```

Production build:
```bash
(cd theme && npm run build)
rsync -a theme/assets/css/ assets/css/
rsync -a theme/assets/js/  assets/js/    # must be done separately — build-for-site only covers CSS
bundle exec jekyll build
npx pagefind --site _site
```

Verify before committing:
- Page renders without errors
- Charts initialise (check browser console)
- Series nav shows correct neighbours
- Social share buttons present

---

### Stage 8 — Publish

#### Content-only commit (common case)
```bash
git add _posts/YYYY-MM-DD-slug.md   # or _models/, _pages/
git add assets/images/               # if new images
git commit -m "Add essay: Title"
git push
```

#### Template change (propagates to all sites)
```bash
# In template-main:
npm run build-for-site               # builds + rsyncs CSS/JS to site
rsync -av assets/js/ ../<site>/assets/js/   # explicit JS rsync if JS changed
git add -p && git commit -m "Update theme: description"
git push

# In each affected site repo:
git submodule update --remote
git add theme assets/
git commit -m "Update theme: description"
git push
```

**Commit message conventions:**
- New content: `Add [type]: [title or slug]`
- Template: `Update theme: [what changed]`
- Fix: `Fix [what]`
- Never `--no-verify`, never `--amend` on a pushed commit

---

### Stage 9 — Amplify

Share buttons (X, Bluesky, LinkedIn, Facebook, WhatsApp, Email, Discord, Copy link) are
built into both `post.html` and `essay.html` layouts — no per-post action needed.

Manual checklist:
- [ ] Post to X / Bluesky / LinkedIn with a short pull quote or the key finding
- [ ] Discord if relevant community exists
- [ ] Cross-link from related existing pieces (internal links compound over time)
- [ ] Email list if applicable

---

## Part V: Automation

### Existing scripts

| Script | Location | What it does |
|---|---|---|
| `npm run new -- "Title"` | `template-main/scripts/new-draft.sh` | Creates `_drafts/slug.md` with front matter |
| `npm run publish -- slug.md` | `template-main/scripts/publish.sh` | Moves to `_posts/YYYY-MM-DD-slug.md` |
| `npm run build-for-site` | `template-main/package.json` | Vite build + CSS rsync to site |
| `bash scripts/quarto-render.sh <dir> <site>` | `template-main/scripts/` | Renders `.qmd` → Jekyll Markdown + figures |

### Where Claude Code adds most value

**High value, routine:**
- Writing full draft essays from a research brief and data description
- Generating and validating ECharts JSON from tabular data
- Fixing rendering issues (dollar sign escaping, LaTeX, Pyodide cell format)
- Generating the formal References section from footnote content
- Updating front matter, cluster codes, series counts across multiple files

**High value, judgement-intensive:**
- Chart type selection for a given argument and dataset
- Editorial structure (part ordering, pull-quote selection)
- Cross-property placement decisions (is this WaywardHouse or QShift?)

**Human judgment required:**
- Data accuracy — chart values generated in sessions are directionally correct estimates.
  Verify against Statistics Canada, CMHC, CREA, IRCC, or other primary sources before publishing.
- Final editorial decisions (cut vs expand, lead vs bury)
- Brand and positioning decisions for new properties

### Near-term automation targets

| Task | Mechanism | Effort |
|---|---|---|
| Validate all ECharts JSON on pre-commit | Git hook + Python | Low |
| Auto-rsync JS on template push | Extend `build-for-site` script | Low |
| Footnote/definition symmetry lint | Python script | Low |
| OG image generation from title | Canvas API / Satori in CI | Medium |
| Submodule update across all sites | GitHub Actions on template push | Medium |

---

## Part VI: Extended Documentation

This document is the strategic and pipeline layer. Deeper technical reference lives
in dedicated documentation systems:

**DocMost** — Internal knowledge base for the Computational Geography Lab.
Covers: session notes, research documentation, data source registries, draft outlines,
extended methodology notes for computational essays.

**Gitea** — Source and version control for lab code, quarto essay sources,
and computational notebook development. The `computational-geography-lab/` directory
in this workspace is the working copy; Gitea is the canonical remote.

**This document (`PUBLISHING.md`)** is not the place for:
- Detailed session notes or in-progress research
- Full mathematical derivations (those live in the essay or in Gitea)
- Property-specific configuration that belongs in `_config.yml`
- Anything that changes often enough to become stale here

When in doubt: decisions about *what to publish and how* live here.
The *substance of what is being published* lives in DocMost and Gitea.

---

## Appendix A: Front Matter Quick Reference

### Post (all properties)
```yaml
layout: post
title: "Title"
date: YYYY-MM-DD
categories: [Category]
tags: [tag]
image: /assets/images/og-default.webp
description: "One sentence."
```

### Essay (WaywardHouse, QShift, Loom)
```yaml
layout: essay
title: "Title"
subtitle: "Subtitle"
date: YYYY-MM-DD
categories: [Category]
tags:
  - content-tag
  - tag-hash-viz       # if charts present
  - tag-hash-math      # if KaTeX present
image: /assets/images/og-[slug].webp
featured: false
comments: true
series: "Series Name"  # if applicable
series_order: N
description: >
  Two sentences.
```

### Computational Model (WaywardHouse)
```yaml
layout: model
title: "Title"
date: YYYY-MM-DD
categories: [Category]
tags:
  - tag-hash-viz
  - tag-hash-math
image: /assets/images/og-default.webp
comments: true
series: "Economic Systems"
series_order: N
cluster: XX
viz: true
description: >
  One sentence.
```

### Series Syllabus Page
```yaml
layout: default
title: "Series Title"
series_key: "Series Name"    # must match series: field exactly
series_number: N             # required for /series/ listing
total_essays: N
```

---

## Appendix B: Property × Feature Matrix

| Feature | WaywardHouse | QShift | Paul Hobson | Loom | Subhaus |
|---|---|---|---|---|---|
| `layout: post` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `layout: essay` | ✓ | ✓ | – | ✓ | – |
| `layout: model` | ✓ | – | – | Future | – |
| ECharts (full) | ✓ | Simple | Optional | ✓ | – |
| Pyodide | ✓ | – | – | Future | – |
| KaTeX | ✓ | – | – | Future | – |
| Mapbox / Leaflet | ✓ | – | – | Future | – |
| Series / collections | ✓ | – | – | ✓ | – |
| Formal citations | Required | Light | Optional | Required | – |
| Formal References | Required | Optional | – | Recommended | – |
| Comments (Giscus) | ✓ | ✓ | ✓ | ✓ | – |
| Social share buttons | ✓ | ✓ | ✓ | ✓ | ✓ |
