# Expert Agent Design
## Publishing Pipeline — Agent Architecture

*Companion to `PUBLISHING.md`. This document designs the expert agent layer
that automates or accelerates each stage of the publishing pipeline.*

*Last updated: 2026-03-17.*

---

## 1. Design Principles

The pipeline has nine stages. Some stages are mechanical and fully automatable;
others require human judgment and should not be automated away. The agent design
should make the former fast and invisible, and make the latter more informed and
less laborious.

**Core principle:** Agents accelerate the pipeline; they do not bypass the human.
Every agent produces an output that a human reviews before the next stage begins.
The human is never out of the loop — they are just spending less time on mechanics
and more time on decisions.

**Agent scope:** Each agent should do one thing well. A research agent that also
writes prose is a generalist that does both things badly. Tight scope means the
agent's outputs are predictable, reviewable, and replaceable.

**Context chain:** Each agent receives the output of the previous stage as its
primary input. The context object travels through the pipeline, accumulating
content and metadata. No agent should need to re-derive information that a
prior agent already produced.

**Implementation reality:** These agents are designed to run as Claude Code
subagents (using the `Agent` tool with curated prompts), as Claude API
calls with structured system prompts, or as guided manual sessions. The
design should be implementation-agnostic. System prompts for each agent
are maintained in `scripts/agents/`.

---

## 2. Agent Roster

```
┌─────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                       │
│          Coordinates the pipeline run               │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────┴───────────┐
    ▼                      ▼
RESEARCHER            TAXONOMIST
(Stage 2)             (Stage 3)
    │                      │
    └──────────┬───────────┘
               ▼
           EDITOR
          (Stage 4)
               │
    ┌──────────┴───────────┐
    ▼                      ▼
VISUALIST           COMPUTATIONALIST
(Stage 5)              (Stage 5)
[charts + hero image]
    │                      │
    └──────────┬───────────┘
               ▼
         CONSISTENCY              ← also runs on-demand / periodically
          (Stage 6a)
               │
               ▼
           REVIEWER
          (Stage 6b)
               │
               ▼
           BUILDER
          (Stage 7)
               │
               ▼
         AMPLIFIER
          (Stage 9)
```

**Consistency** runs both as a stage in a new-content pipeline run (catching what
needs updating elsewhere in response to the new piece) and independently as an
on-demand audit of the full property at any time.

---

## 3. Agent Specifications

---

### 3.1 Orchestrator

**Stage:** All — coordinates the run.

**Role:** Receives the initial brief, determines which agents to invoke and in what
sequence, passes context between them, surfaces decision points to the human, and
maintains the publishing run record.

**Inputs:**
- Property (e.g. `waywardhouse-source`)
- Content type (post / essay / model)
- Topic brief (1–3 sentences)
- Series placement (if applicable)
- Quality benchmark (name of a reference piece)

**Outputs:**
- A `run-context.json` file in `_drafts/runs/` tracking state across the pipeline
- Spawns and coordinates all other agents
- Surfaces review checkpoints to the human at stage boundaries

**Decisions the Orchestrator surfaces to the human:**
1. Property assignment (if ambiguous between WaywardHouse / QShift / Paul Hobson)
2. Research brief approval before writing begins
3. Chart type and data decisions before Visualist runs
4. Final review pass before commit

**Tools:** Agent (spawn), Read, Write, Glob, Grep

**Run context schema:**
```json
{
  "run_id": "2026-03-17-alberta-calling",
  "property": "waywardhouse-source",
  "content_type": "essay",
  "title": "Alberta Calling",
  "topic_brief": "...",
  "series": "Alberta in Context",
  "series_order": 16,
  "quality_benchmark": "The Burning Strait",
  "target_words": 8000,
  "draft_path": "_posts/2026-03-17-alberta-calling.md",
  "agents_completed": [],
  "review_issues": [],
  "status": "ideation"
}
```

---

### 3.2 Researcher

**Stage:** 2 — Research.

**Role:** Assembles the evidential foundation for a piece. Finds, reads, and
synthesises primary sources. Produces a structured research brief that the
Editor can write from directly.

**Inputs:** Topic brief, property, content type, approximate scope.

**Outputs:** `research-brief.md` containing:
- **Key claims** — 8–15 factual statements the piece needs to make, each with source
- **Data for charts** — specific tables with approximate values, sources cited
- **Footnote drafts** — pre-formatted `[^N]: ...` entries, one per key claim
- **Possible angles** — 3–5 structural approaches the Editor can choose between
- **Gaps flagged** — claims where data was not found or is uncertain

**Data provenance rules:**
- Every number must trace to a named source (URL or publication)
- Estimates are flagged as `[estimated]` — not presented as authoritative
- Where multiple sources give different figures, both are recorded with reconciliation note
- Access dates recorded for all web sources

**Primary source knowledge (WaywardHouse property):**
- Statistics Canada: Table number taxonomy, common tables (17-10-0020-01, 14-10-0287-01, etc.)
- CMHC: Report structure (Rental Market Reports, Housing Supply Reports)
- CREA, CREB: Benchmark price data conventions
- IRCC: Annual reports and permit data
- Alberta government datasets: AAIP allocations, health and education statistics
- Academic: Google Scholar, NBER, SSRN, JSTOR — knows how to extract key findings without full access

**QShift variant:** Shorter brief, 4–8 claims, prose attribution rather than footnote drafts.

**Tools:** WebSearch, WebFetch, Read, Write

**Human checkpoint:** Orchestrator presents the research brief for human approval
before passing to Editor. Human can: approve as-is, add sources, redirect the angle.

---

### 3.3 Taxonomist

**Stage:** 3 — Structure.

**Role:** Sets up the file with correct, complete front matter before any writing
begins. Ensures all series, collection, and metadata decisions are correct so the
Editor does not have to think about them.

**Inputs:** Run context, property `_config.yml`, existing series members.

**Outputs:** A complete, valid front matter block including:
- Correct `layout` for property and content type
- `series:` value that exactly matches a `series_key:` in `_pages/`
- Unique `series_order:` (checked against existing files)
- `cluster:` code using two-letter convention (models only)
- Correct tag set including `tag-hash-viz` and/or `tag-hash-math` if needed
- `description:` two-sentence SEO summary
- OG image path (flags if a custom image needs to be created)

**Checks performed:**
```
✓ Layout valid for property × content type combination
✓ Series name matches series_key in _pages/ exactly
✓ Series order is unique — query all existing members
✓ Cluster code is two-letter and not already used by a different cluster
✓ tag-hash-viz present iff charts are planned
✓ tag-hash-math present iff KaTeX is planned
✓ OG image file exists at stated path
```

**Tools:** Read, Glob, Grep, Write

**Human checkpoint:** None — Taxonomist output is deterministic given the run context.
Review at Stage 6 (Reviewer) catches any errors.

---

### 3.4 Editor

**Stage:** 4 — Writing.

**Role:** Produces the full draft prose from the research brief, at the quality
standard defined by the property and benchmark piece. The Editor's output is
the primary article — everything else is support.

**Inputs:** Research brief, approved front matter from Taxonomist, property brief,
quality benchmark reference, target word count.

**Editorial persona by property:**

*WaywardHouse:* Authoritative, data-grounded, narrative-forward. Opens with
a concrete scene before stating a thesis. Uses named sections (`## Part N: Title`),
pull-quote boxes for key arguments, `---` separators. Earns complexity with structure.
Minimum 6,000 words for essays. Every major section has at least one data point.
Escapes monetary values as `\$`. Never ends on a summary — ends on a return to
the opening or a forward-looking statement.

*QShift:* Direct and purposeful. No academic register. Uses structural argument
("The evidence points in three directions:") rather than academic hedging. 3,000–5,000
words. Shorter sentences. The implicit audience is time-constrained and senior.

*Paul Hobson:* First person throughout. Can be exploratory and provisional.
Warmer register. Allowed to leave questions open. Length flexible.

*Subhaus95:* No persona required — just write the note.

**Dollar sign rule:** All monetary values escaped as `\$N` in prose.

**Pull-quote convention:** `> **Label.** Body text.` — used for the 2–3 most
important arguments in essays.

**Footnote convention:** Inline markers `[^N]` placed at claim site; full `[^N]: ...`
definitions written at the end of the document in the same pass.

**Output structure for essays:**
1. Front matter (from Taxonomist)
2. Opening scene / hook (before any heading)
3. Named parts with `## Part N: Title` headings
4. Pull-quote boxes for key arguments
5. Chart placeholder comments `<!-- CHART: [description for Visualist] -->`
6. Conclusion that returns to the opening
7. Footnote definitions `[^N]: ...`

**Tools:** Read (research brief, reference pieces), Write

**Human checkpoint:** Human reviews the draft before Visualist runs. Editor should
not be re-run without human direction — the prose is the product.

---

### 3.5 Visualist

**Stage:** 5 — Visualisation.

**Role:** Owns all visual output for a piece: inline charts, the hero/OG image,
and post-listing card image. Takes the chart placeholder comments from the Editor's
draft and replaces them with correctly formatted, valid ECharts divs with captions.
Produces or specifies the hero image. Validates all JSON before inserting.

**Inputs:** Draft with `<!-- CHART: ... -->` placeholders, research brief (for data),
property constraints (WaywardHouse full / QShift simple only), brand tokens.

**Outputs:**
- Draft with all chart placeholders replaced by valid chart HTML and captions
- Hero/OG image file (or a fully specified brief if human production is needed)
- Updated front matter `image:` path

**Chart type selection logic:**

```
Is the story about flow or composition between named sources?
  → Sankey. Set left: "22%". Use gradient lineStyle.

Is it geographic distribution across a known territory?
  → Scatter on lat/lng value axes. Draw border as line series.
  → Only if Mapbox is available and appropriate: use data-viz="mapbox".

Is it change over time with a part-to-whole message?
  → Stacked bar. Stack only if parts sum to a meaningful total.

Is it change over time for 1–2 series?
  → Line or simple bar.

Is it a demographic or population comparison across age groups?
  → Horizontal grouped bar. Oldest group at top.

Is it two related metrics at different scales?
  → Dual-axis bar + line. Label both axes clearly. Maximum one per piece.

Is the audience QShift?
  → Only bar or line. No Sankeys, no maps, no demographic pyramids.
```

**ECharts JSON rules enforced before insertion:**
- `backgroundColor: "transparent"` always present
- `title.textStyle.color: "var(--text)"` always present
- All `axisLabel.color` set to `"var(--text-2)"`
- `legend.textStyle.color: "var(--text-2)"` always present
- `legend.bottom: 0` standard position
- Sankey: `left` minimum `"22%"` to prevent label clipping
- No hardcoded light or dark colours (`#fff`, `#000`, `#1e1e1e`, `#fff`)

**Validation step (mandatory before insertion):**
```bash
python3 -c "
import sys, json, re
text = open('draft.md').read()
for m in re.finditer(r\"data-options='([^']+)'\", text):
    json.loads(m.group(1))  # raises if invalid
print('All charts valid')
"
```

**Caption format:**
```markdown
*[Chart description — what the chart shows and why it matters. Data source: Institution, Year.]*
```

**Hero / OG image responsibility:**

Every piece needs an `image:` in front matter. The default (`og-default.webp`) is
a fallback — the Visualist should always attempt to produce a proper card.

Hero image spec:
- Dimensions: 1200 × 630 px (Open Graph standard)
- Format: WebP
- Naming: `og-{slug}.webp`, placed in `assets/images/`
- The image must read clearly at thumbnail scale (post-card grid) and full scale
  (social sharing preview)

**Visualist image workflow (tiered by capability):**

*Tier 1 — Canva MCP (preferred when available):*
The Visualist uses `mcp__claude_ai_Canva__generate-design` with the brand kit
and a design brief derived from the piece's title, subtitle, and key theme.
Exports via `mcp__claude_ai_Canva__export-design` as PNG/JPG, then the Builder
converts to WebP during the build step. Updates front matter `image:` path.

Design brief to pass to Canva:
```
Title: [piece title]
Subtitle: [piece subtitle if any]
Key visual theme: [one sentence — the dominant concept or geography]
Brand: [wayward / qshift / paul / loom]
Tone: [analytical / consultancy / personal / scrappy]
Avoid: stock photo clichés; generic maps; corporate imagery
```

*Tier 2 — Canva template modification:*
If a brand template exists in Canva, use `mcp__claude_ai_Canva__get-design` to
retrieve it, `mcp__claude_ai_Canva__start-editing-transaction` to open an editing
session, `mcp__claude_ai_Canva__perform-editing-operations` to update the title
text, and `mcp__claude_ai_Canva__export-design` to render. Most consistent
approach once a branded template is established.

*Tier 3 — Visual brief for human production:*
If Canva is unavailable or the design needs human art direction, the Visualist
produces a written brief:
```
HERO IMAGE BRIEF
File: assets/images/og-[slug].webp
Dimensions: 1200 × 630 px

Title treatment: "[title]" — large, high-contrast
Subtitle: "[subtitle]" — smaller, secondary weight
Visual element: [specific description — a specific map area, a chart
  rendered large, an abstract treatment of the key concept]
Brand colours: [hex values from brand-{name}.css]
Background: [dark / light / gradient direction]
Typography: [Barlow Condensed for headings, Barlow for body]
```
This brief goes into the run context and is surfaced as a human action item
before publish.

*Post-card image vs OG image:*
The post-card image (shown in the home grid at around 400 × 250 px) is the same
file — it must therefore be designed to work at both scales. Test the card crop
at thumbnail size before finalising.

**Tools:** Read, Edit, Write, Bash (JSON validation, WebP conversion),
`mcp__claude_ai_Canva__*` (Tier 1 and 2 image production)

**Human checkpoint:** Review the rendered charts in local dev before committing.
Visual inspection of hero image at both full and thumbnail scale is human-only.

---

### 3.6 Computationalist

**Stage:** 5 — Visualisation (specialist variant for model content).

**Role:** Designs and embeds interactive Python cells, mathematical notation, and
simulation logic for computational model essays. Works alongside or after the Editor
on `layout: model` content. Not invoked for editorial essays or QShift content.

**Inputs:** Draft model essay, mathematical specification of the model, any prior
Quarto/Python source files.

**Outputs:** Complete model essay with Pyodide cells, KaTeX blocks, and explanatory
prose connecting the math to the simulation.

**Pyodide cell format (enforced):**
```html
<div class="pyodide-cell"><pre><code class="language-python">
import numpy as np
# Python code here
</code></pre></div>
```
Never markdown fences inside a pyodide-cell div.

**Pyodide constraints:**
- `numpy` pre-installed; all other packages need `await pyodide.loadPackage('name')`
- No file I/O (WASM sandbox)
- Cells are independent — state does not persist between runs
- Each cell should be self-contained and produce visible output

**KaTeX rules:**
- Display math in `$$...$$` blocks
- No `\\` (line break command) inside display math — it is invalid in display mode
- No `\\` inside `\text{...}`
- Use `\,` for thin space, `\quad` for wider spacing

**Cluster code check:** Verify that footer text in the model body matches the
`cluster:` value in front matter. Stale cluster labels from prior drafts are a
common error.

**Tools:** Read, Write, Edit, Bash (Pyodide cell format validation via grep)

---

### 3.7 Consistency Agent

**Stage:** 6a — runs before the Reviewer on any new-content pipeline run; also
runs independently on-demand as a full property audit.

**Role:** The Consistency Agent is the only agent that looks across the whole
property rather than at a single piece. Its job is to find everything that has
drifted out of sync with the current state of the content — and either fix the
deterministic issues automatically or produce a precise list of the prose issues
that need human attention.

This agent is the direct response to the accumulation of inconsistencies that
naturally builds up as a series grows: the syllabus page that still says "seven
essays" when there are now twelve, the cluster footer in a model that still says
"Cluster R" after a rename, the series landing page whose prose predates the
last three additions.

**Inputs (new-content mode):**
- Property root path
- The series being added to
- The new piece's `series:`, `series_order:`, and `cluster:` values

**Inputs (audit mode):**
- Property root path
- Optional: specific series to audit (defaults to all)

**What it checks:**

*Series syllabus pages (`_pages/series-*.md`):*
```
□ total_essays: N matches actual count of posts + models with that series: value
□ Prose body does not contain stale count references:
    - grep for digit-word patterns: "seven essays", "12 models", "a series of N"
    - grep for ordinal references: "the third", "essay five", "model 8 of 10"
□ Listed cluster codes in the syllabus match clusters actually in use
□ series_key: value matches the series: field in all member files exactly
```

*Model cluster footers:*
```
□ Body text "Cluster XX" matches the cluster: value in that file's front matter
□ Count references ("Cluster EG comprises three models") match actual cluster member count
□ Cluster codes in body text are not single-letter if the two-letter convention applies
```

*Series member files (posts and models):*
```
□ No two files share the same series_order: value within a series
□ series: values are consistent in capitalisation and spacing across all members
□ No orphaned series: values that don't match any series_key: in _pages/
□ Cross-references to other series members ("see also: essay 3") are still valid
    - Check for links to specific essay URLs that may have changed
```

*Navigation and landing pages:*
```
□ Series landing page prose does not reference a specific count that is now wrong
□ Any hardcoded "next" / "previous" references in essay bodies are still accurate
□ _pages/ syllabus pages exist for all series: values in use
```

**Output format:**

```
CONSISTENCY AUDIT — waywardhouse-source
Run: 2026-03-17  Mode: new-content (series: "Alberta in Context", order: 16)

AUTO-FIXED (N items):
  ✓ _pages/series-alberta-in-context.md: total_essays updated 15 → 16

REQUIRES HUMAN REVIEW (N items):
  ⚠ _pages/series-alberta-in-context.md line 24:
      "a series of fifteen essays" — update to sixteen or rewrite
  ⚠ _posts/2026-01-12-trade-corridors.md line 187:
      "the most recent essay in this series" — may now be outdated
  ⚠ _models/2026-03-16-renewable-policy.md front matter:
      cluster: EG but body line 312 reads "Cluster R" — stale label

CLEAN (N items):
  ✓ series_order uniqueness: no collisions
  ✓ series_key matching: all members match _pages/ series_key
  ✓ All cluster codes two-letter
  ✓ No orphaned series values
```

**Auto-fix scope:**
The Consistency Agent auto-fixes only deterministic, single-value changes:
- `total_essays:` count in syllabus YAML front matter
- `cluster:` value in model front matter (if clearly a rename — flagged for confirmation)

It does **not** auto-fix prose. Prose changes require human judgment about
context, sentence structure, and whether to update the number or rewrite the
sentence entirely.

**Running on-demand (WaywardHouse current state):**

To fix the existing inconsistencies across WaywardHouse essays and models, run
the Consistency Agent in full audit mode against the repo. This is the correct
tool for the current cleanup task — it will surface every stale reference
systematically rather than requiring manual review of every file.

```bash
# Invoke as a Claude Code subagent with the audit-mode prompt:
# "Run a full consistency audit of the waywardhouse-source repo.
#  Check all series: values, total_essays counts, cluster codes in
#  front matter vs body text, and any prose references to series counts.
#  Auto-fix total_essays counts. Report everything else."
```

**Relationship to Taxonomist:**
The Taxonomist runs once, before writing, to set up a single new file.
The Consistency Agent runs after, to check what else in the property needs
updating in response to that addition. They are complementary: Taxonomist
is point-in-time setup; Consistency Agent is cross-property reconciliation.

**Tools:** Read, Glob, Grep, Edit (auto-fixes only), Write (audit report)

**Human checkpoint:** Human reviews the "REQUIRES HUMAN REVIEW" list and
addresses each item before committing. Auto-fixes are applied and shown; the
human approves them as part of the same commit.

---

### 3.8 Reviewer

**Stage:** 6b — Review. The pre-commit quality gate for the new piece itself.

**Role:** Runs the full review checklist programmatically. Reports pass or fail
with specific issues. Does not fix issues — flags them for the Editor or Visualist.

**Inputs:** Complete draft file path.

**Checklist (run in order):**

```
STRUCTURAL
□ Front matter has all required fields for content type
□ layout: value matches property × content type matrix
□ description: field present and ≤ 160 characters

SERIES AND TAXONOMY
□ series: value matches a series_key: in _pages/ (exact string match)
□ series_order: is unique — no other file in the collection has this value
□ cluster: code (models) matches body text cluster reference

PROSE SAFETY
□ No unescaped $ pairs in prose (regex: \$[^$]+\$ not preceded by \)
□ No $$ inside inline prose (double-dollar should be on its own line)
□ No \\ inside $$ display math blocks
□ No \\ inside \text{...} in math

CITATIONS
□ All [^N] markers have a matching [^N]: definition
□ No [^N]: definitions that have no [^N] marker
□ Formal References section present (essays with 8+ sources)

VISUALISATION
□ All data-options JSON is valid (run validator)
□ No chart div without a following caption line
□ No hardcoded dark/light colours in chart JSON
□ Sankey charts have left: "22%" or wider
□ All charts have backgroundColor: "transparent"

PYODIDE (models only)
□ No markdown fence code blocks inside .pyodide-cell divs
□ All pyodide cells use <pre><code class="language-python"> format

ASSETS
□ OG image file exists at path in front matter
□ Any images referenced in body exist in assets/
```

**Output format:**
```
REVIEW RESULT: PASS / FAIL

Issues found: N

1. [PROSE SAFETY] Unescaped $ pair at line 142: "$65/MWh ... $50/MWh"
2. [CITATIONS] [^17] marker has no definition
3. [VISUALISATION] Chart at line 89 has no caption
```

**Tools:** Read, Grep, Bash (JSON validation, regex checks, file existence checks)

**Human checkpoint:** Human reviews the Reviewer's output. If FAIL, the specific
issues go back to the relevant agent (Editor for prose issues, Visualist for chart
issues). If PASS, the pipeline proceeds to Build.

---

### 3.9 Builder

**Stage:** 7 — Build.

**Role:** Runs the production build and reports on success or failure. Cannot
do visual browser inspection — that is human-only.

**Inputs:** Site repo path, list of changed files.

**Operations:**
1. If template changed: run `npm run build-for-site` from `theme/`; rsync JS separately if JS files changed
2. Run `bundle exec jekyll build`
3. Scan build output for errors and warnings
4. If Pagefind needed: run `npx pagefind --site _site`

**Output:**
```
BUILD RESULT: SUCCESS / FAILURE

Jekyll: OK (N pages built in Xs)
Assets: CSS ✓  JS ✓  Dist ✓
Pagefind: OK (N pages indexed)

Warnings:
- [warning text if any]

Errors:
- [error text if any]
```

**Tools:** Bash (build commands), Read (build output logs)

**Does not do:** Visual inspection. Automated browser testing. Link validation.
These require human or separate tooling.

**Human checkpoint:** Human opens the local server and visually verifies the
rendered output before committing.

---

### 3.10 Amplifier

**Stage:** 9 — Amplification.

**Role:** Writes platform-appropriate share copy for each social channel, tailored
to the property's voice and the piece's key findings.

**Inputs:** Published URL, title, subtitle, 2–3 key findings (from research brief),
property name.

**Outputs:** Ready-to-post copy for each platform, with character counts:

```
X / TWITTER (max 280 chars)
---
[copy]
[N/280 characters]

BLUESKY (max 300 chars)
---
[copy]
[N/300 characters]

LINKEDIN (max 3,000 chars — aim for 150–300)
---
[copy]

DISCORD (paste URL — auto-embeds; optional context line)
---
[URL]
[optional one-line context]
```

**Voice calibration by property:**

*WaywardHouse:* Lead with the sharpest finding or contradiction. Analytical
and a little pointed. The post should make someone curious enough to click.
"Alberta ran billboard ads recruiting people to move there. Then called
immigration a federal failure. The data tells a different story."

*QShift:* Lead with the strategic implication. "If you're advising on [X],
here's the structural issue that most analysis misses."

*Paul Hobson:* Personal and direct. "I wrote about X because Y was bothering
me and the numbers don't say what people think they say."

**Tools:** Read (article for key findings), Write

**Human checkpoint:** Human reviews and edits copy before posting. Amplifier
output is a first draft, not auto-post.

---

## 4. Orchestration Patterns

### Pattern A: Full Editorial Essay (WaywardHouse or Loom)

```
Human: brief → Orchestrator
  → Researcher              [output: research brief]
  → Human review: approve brief, select angle
  → Taxonomist              [output: front matter]
  → Editor                  [output: prose draft with chart placeholders]
  → Human review: approve draft structure and prose
  → Visualist               [output: charts embedded + hero image]
  → Human review: approve visual output
  → Consistency Agent       [output: auto-fixes applied; prose issues listed]
  → Human: address prose consistency issues
  → Reviewer                [output: pass/fail checklist on new piece]
  → Human: fix any flagged issues
  → Builder                 [output: build status]
  → Human: visual inspection in browser
  → git commit + push       [includes consistency fixes in same commit]
  → Amplifier               [output: share copy per platform]
  → Human: post to social
```

**Parallel opportunities:**
- Taxonomist runs concurrently with Researcher
- Visualist begins chart design during Editor's writing phase (briefed on chart
  types before the full draft is complete); hero image can be started as soon as
  title and topic are confirmed
- Consistency Agent runs in parallel with Reviewer — both check different things

### Pattern B: Consultancy Essay (QShift)

```
Human: brief → Orchestrator
  → Researcher (QShift variant: shorter, no footnote apparatus)
  → Human review: approve brief
  → Taxonomist
  → Editor (QShift voice: tighter, 3,000–5,000 words)
  → Visualist (simple charts only; hero image via Canva brand template)
  → Consistency Agent (series check if applicable; usually standalone)
  → Reviewer (relaxed citation checks)
  → Builder
  → Human: visual check
  → git commit + push
  → Amplifier (QShift voice)
```

### Pattern C: Computational Model (WaywardHouse)

```
Human: brief + mathematical spec → Orchestrator
  → Researcher (data and literature for context sections)
  → Taxonomist (includes cluster code assignment, series_order uniqueness check)
  → Editor (prose sections: motivation, theory, interpretation)
  → Computationalist (Pyodide cells, KaTeX, simulation logic) [parallel with Editor]
  → Visualist (ECharts + model output charts + hero image)
  → Consistency Agent       ← critical here: cluster renames and count drift are
                               common after model series additions
  → Human: address consistency issues (cluster labels, series counts)
  → Reviewer (full checklist including Pyodide format and LaTeX rules)
  → Builder
  → Human: run cells, check simulation output
  → git commit + push
```

### Pattern D: Quick Post (any property)

```
Human: topic → Orchestrator
  → Taxonomist (front matter only, no series)
  → Editor (human may write this directly — Orchestrator asks)
  → Visualist (hero image only — Canva Tier 1 or brief)
  → Reviewer (lite: front matter + dollar signs only)
  → git commit + push
```

### Pattern E: Consistency Audit (on-demand, no new content)

```
Human: "audit [property] series consistency"
  → Consistency Agent (full audit mode, all series)
  → Human: review report
  → Human: address all prose issues manually or by re-invoking Editor on specific files
  → git commit + push (auto-fixes + human prose fixes in one pass)
```

**This is the pattern for fixing the current WaywardHouse drift.** Run Pattern E
against `waywardhouse-source` to surface and fix all stale series counts, cluster
labels, and prose references accumulated across the existing essay and model series.

---

## 5. Context Passing

Each agent receives a context bundle. The Orchestrator maintains and updates
this bundle. Agents read the bundle; they do not modify it directly — they
return outputs and the Orchestrator updates the bundle.

**Full context bundle schema:**

```json
{
  "meta": {
    "run_id": "YYYY-MM-DD-slug",
    "created": "ISO-8601",
    "property": "waywardhouse-source",
    "content_type": "essay",
    "pattern": "A"
  },
  "brief": {
    "title": "",
    "subtitle": "",
    "topic_brief": "",
    "quality_benchmark": "",
    "target_words": 8000,
    "series": "",
    "series_order": null
  },
  "research": {
    "status": "pending | approved | complete",
    "brief_path": "_drafts/runs/SLUG/research-brief.md",
    "key_claims": [],
    "chart_data": [],
    "footnote_drafts": [],
    "gaps_flagged": []
  },
  "taxonomy": {
    "status": "pending | complete",
    "front_matter": {},
    "cluster": null,
    "series_key_verified": false,
    "series_order_unique": false,
    "og_image_exists": false
  },
  "draft": {
    "status": "pending | in_progress | prose_complete | charts_embedded | approved",
    "path": "_drafts/SLUG.md",
    "word_count": 0,
    "chart_placeholders": [],
    "charts_embedded": 0,
    "footnote_count": 0
  },
  "review": {
    "status": "pending | pass | fail",
    "issues": [],
    "checklist_run": "ISO-8601"
  },
  "build": {
    "status": "pending | success | failure",
    "warnings": [],
    "errors": []
  },
  "publish": {
    "status": "pending | committed | pushed",
    "commit_sha": "",
    "published_url": ""
  },
  "amplification": {
    "status": "pending | drafted | posted",
    "copy": {}
  }
}
```

---

## 6. Agent System Prompts

System prompts for each agent are stored in `template-main/scripts/agents/`.
Each file is a markdown file with the agent's persona, constraints, and
output format specification. These are the reusable expert configurations.

```
template-main/scripts/agents/
├── orchestrator.md
├── researcher.md
├── researcher-qshift.md          # QShift variant (shorter, prose attribution)
├── taxonomist.md
├── editor-waywardhouse.md
├── editor-qshift.md
├── editor-paul-hobson.md
├── visualist.md                  # full: ECharts + hero image via Canva
├── visualist-simple.md           # QShift variant (bar/line only)
├── visualist-hero-brief.md       # Tier 3: written brief for human image production
├── computationalist.md
├── consistency-new-content.md    # runs on pipeline add (series-aware)
├── consistency-audit.md          # runs on-demand, full property scan
├── reviewer.md
├── reviewer-lite.md              # Quick post variant
├── builder.md
└── amplifier.md
```

Each system prompt includes:
1. **Role statement** — one sentence on what the agent does
2. **Property constraints** — what is and is not in scope
3. **Input format** — what the agent expects to receive
4. **Output format** — what the agent must produce
5. **Quality rules** — the checklist the agent enforces on its own output
6. **Known failure modes** — common errors to avoid (e.g. dollar sign escaping,
   Sankey label clipping, Pyodide markdown fences)

---

## 7. Implementation Roadmap

### Phase 1 — Prompt templates (now)

Create the system prompt files in `scripts/agents/`. Use them as structured
briefings at the start of relevant Claude Code sessions. The human manually
invokes the right specialist prompt for each stage.

**Benefit:** Captures expertise in a reusable, version-controlled form. No new
infrastructure required.

### Phase 2 — Claude Code agent invocation (near-term)

Use the Claude Code `Agent` tool with `subagent_type: "general-purpose"` and
the specialist system prompt injected into the agent prompt. The orchestrator
session spawns agents as needed and passes context between them.

The Orchestrator becomes a standard opening prompt for any publishing session —
paste it at the start of a Claude Code conversation, provide the brief, and
the session structure follows from there.

### Phase 3 — Claude API pipeline (future)

Build a proper orchestration script using the Anthropic SDK. Each agent is a
Claude API call with:
- A system prompt from `scripts/agents/`
- Tool definitions appropriate to the agent's role
- Structured output enforced via JSON schema in the API call
- Automatic context bundle update after each agent returns

The pipeline runs as `npm run pipeline -- "Title" --property waywardhouse --type essay`
from the site repo root. The human approves checkpoints via terminal prompts.

**Prerequisites:** Consistent structured output from each agent (requires
Claude API with output schema enforcement). Testing infrastructure to validate
agent outputs before human review. Budget management (each full essay pipeline
run is ~15–25 API calls).

### Phase 4 — GitHub Actions integration (future)

On push to a `draft/` branch: automatically run Taxonomist (check front matter)
and Reviewer (check JSON, escaping, footnotes). Report results as a PR comment.

On merge to `main`: automatically run Builder and Amplifier. Post build status
and share copy as a draft GitHub Issue for human review and posting.

---

## 8. What Agents Cannot Replace

Some things in the pipeline are genuinely human-only. No agent design should
attempt to automate these:

**Judgment on placement:** Whether a topic belongs on WaywardHouse vs QShift
vs Paul Hobson is a brand decision, not a mechanical one. The Orchestrator
surfaces this question; the human answers it.

**Data accuracy:** All chart values and statistics produced by the Researcher
or Editor are directionally correct estimates. They must be verified against
primary sources (Statistics Canada, CMHC, CREA, IRCC, etc.) before publishing.
No agent can substitute for this verification.

**Visual quality:** Whether a chart looks right in context, whether labels
overlap, whether the colour balance works in dark mode — only the human
sees the rendered output. The same applies to hero images: Canva-generated
images should always be reviewed at both full size and thumbnail (post-card)
scale before committing. An image that works at 1200 × 630 can be unreadable
at 400 × 250.

**Editorial quality:** Whether the prose is actually good — whether it earns
its length, whether the argument flows, whether the opening is strong enough —
requires human editorial judgment. Agents produce first drafts. The human
decides when the draft is ready.

**Brand evolution:** As properties grow, their editorial voice and strategy
evolve. Agent system prompts need to be updated when this happens. Only the
human can notice that a prompt has gone stale.
