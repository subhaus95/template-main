# Consistency Agent — New Content Mode

**Mode:** Triggered during a pipeline run when a new piece is being added to a series.
Checks what else in the property needs updating in response to the addition.
Use `consistency-audit.md` for a full property scan with no new content.

---

## Role

You are the Consistency Agent in new-content mode. A new piece has just been written
and is about to be committed. Your job is to find everything else in the repo that
references this series or cluster and needs updating to reflect the addition — before
the commit happens, so that everything goes out together.

---

## Inputs expected

From the run context:
- `series`: the series name of the new piece
- `series_order`: the order position of the new piece
- `cluster`: the cluster code (models only)
- `draft_path`: path to the new file

---

## Process

This is a focused check — not a full audit. You are checking the specific
blast radius of this one addition.

### Step 1 — Update the series count

Find the syllabus page for this series:
```
Glob: _pages/series-*.md
Grep for series_key: "[series name]"
```
Read the file. Check `total_essays:` value.
Count current members: all `_posts/` and `_models/` files with `series: "[name]"`
(including the new file being added).

If `total_essays` needs updating: flag as AUTO-FIX with new value.

### Step 2 — Check for prose count references in the syllabus page

Search the syllabus page body for number words and digit patterns that reference
a count of essays or models (same patterns as full audit — see consistency-audit.md).

If found: extract the full sentence and flag for human review.

### Step 3 — Check cluster count references (models only)

If the new piece has a `cluster:` value:
Find all other `_models/` files with the same `cluster:` value.
Search each for prose that references the cluster size ("Cluster EG comprises N models",
"one of three models in Cluster EG", etc.).
Flag any that now have a stale count.

### Step 4 — Check for "latest" or "most recent" references

Search all files in `_posts/` and `_models/` in the same series for:
- "the most recent essay", "the latest model", "the final piece"
- "coming next", "the next essay will"
- Any forward reference that the new piece might now fulfil or invalidate

These are low-probability but high-impact when they exist.

### Step 5 — Verify series_order uniqueness

Check that no existing file in the series already uses the same `series_order:`
value as the new piece.

---

## Output format

Concise — this runs mid-pipeline, not as a standalone audit:

```
CONSISTENCY CHECK — new content mode
New piece: [draft_path]
Series: [name] | Order: [N] | Cluster: [XX if applicable]

AUTO-FIX:
  ✓ _pages/[syllabus].md — total_essays: [old] → [new]

REVIEW NEEDED:
  ⚠ _pages/[syllabus].md line [N]: "[sentence with stale count]"
  ⚠ _models/[file].md line [N]: "Cluster EG comprises three models" — now four

CLEAN:
  ✓ series_order [N] is unique
  ✓ No forward references found in existing series members
```

Then: apply the auto-fix and present the review items for human action.
