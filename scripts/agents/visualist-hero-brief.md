# Visualist — Hero Image Brief Template

---

## Purpose

This file contains the Tier 3 brief template used by the Visualist when
Canva MCP is unavailable or the design requires human art direction.

Tier 1 (Canva MCP generate) and Tier 2 (Canva template edit) are preferred.
Use Tier 3 only when those are not available or not suitable.

See `visualist.md` for the full three-tier workflow.

---

## Brief template

```
HERO IMAGE BRIEF
─────────────────────────────────────────────────────────────────────
File:       assets/images/og-[slug].webp
Dimensions: 1200 × 630 px (must read at 400 × 250 px thumbnail too)
Property:   [WaywardHouse / QShift / Paul Hobson / Loom / Subhaus95]

TITLE:      [piece title — large, high contrast]
SUBTITLE:   [subtitle, if any — smaller, secondary weight]

VISUAL:
  [Specific description — not generic.
   Bad:  "A photo of oil and gas infrastructure"
   Good: "A dark aerial view of Fort McMurray at winter dusk, the
          processing towers lit against a low orange sky. No people
          visible. Industrial scale, not industrial grime."]

TONE:       [analytical / serious / data-driven / professional /
             strategic / personal / curious]

TYPOGRAPHY: [Barlow Condensed for headings, Barlow for body — standard]

BACKGROUND: [dark / light / specify dominant colour]

PALETTE:
  Primary:   [hex from brand file]
  Secondary: [hex from brand file]
  Accent:    [hex if needed]

AVOID:
  [Specific things that would misrepresent the piece:
   - Stock photo clichés (handshakes, generic maps, "innovation" imagery)
   - Anything that reads as academic or textbook
   - Light-on-white without a colour element (too flat at thumbnail size)]

NOTES:
  [Any other constraints: required text overlay, logo placement,
   embargo if the design should not reference a specific event before
   a specific date, etc.]
─────────────────────────────────────────────────────────────────────
```

---

## Per-property tone guidance

### WaywardHouse

- Tone: analytical, serious, data-driven
- Dark backgrounds preferred (brand default is dark)
- Typography should be legible at thumbnail scale (400 × 250 px minimum test)
- Avoid anything that reads as clickbait or listicle adjacent
- Geographic and infrastructural imagery welcome when relevant
- Abstract data-density textures work well for quantitative pieces

### QShift

- Tone: professional, strategic, authoritative
- Abstract textures preferred over literal data visualisations
- Typography dominant — title large and immediately legible
- Avoid academic or data-heavy visual language
- Clean, minimal backgrounds over complex photography

### Paul Hobson

- Tone: curious, personal, precise
- Light or dark, depending on the piece
- Can be more playful than WaywardHouse — a map screenshot, a code snippet,
  an unusual data artefact — if that fits the piece
- Typography does not need to dominate

### Loom Collective

- Tone: exploratory, forward-looking
- Brand colours skew cooler; consult brand-loom.css for palette
- Abstract or conceptual imagery over documentary photography

---

## Handoff notes

When producing a Tier 3 brief, flag the action item in the run context:

```
ACTION REQUIRED (human):
  Hero image brief produced for [slug].
  Brief location: [in this report / attached]
  Blocking commit: [YES — image path in front matter will 404 until produced]
                   [NO — front matter uses og-default.webp as fallback]
  Assigned to: [name or "unassigned"]
```

If the piece is using `og-default.webp` as a temporary fallback, confirm
that `assets/images/og-default.webp` exists in the repository before
allowing the Builder to proceed.
