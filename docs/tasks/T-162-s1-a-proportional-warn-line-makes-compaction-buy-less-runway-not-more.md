---
id: T-162-s1
title: A proportional warn line makes compaction buy LESS runway, not more — the ADR-019 budget formula is the wrong shape for a document under this merge velocity, and only @human can change it
feature: F-01
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [docs/decisions, docs/rooms]
suggested_by: executor claude-opus-5@subagent @T-162
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED FROM T-162's OWN ARITHMETIC.** ADR-019 §Budgets legislates
`warn = landed × 1.25` and `fail = landed × 1.5`. Headroom under the
warn line is therefore exactly a QUARTER of the landing, so a document
that is compacted harder gets a TIGHTER tripwire, in absolute bytes,
than one that is not.

## Measured on T-162's own pass, at the refs the addendum stamps

- docs/ROADMAP.md: cutting 10,315 → 9,801 (−514 bytes) moved the
  headroom 2,579 → 2,451, so the cut COST 128 bytes of runway.
- docs/CONVENTIONS.md: cutting 134,167 → 131,514 (−2,653) moved the
  headroom 33,542 → 32,879, costing 663.
- What actually bought runway was RE-BASING the lines on a document
  three days of legitimate rule growth had left behind: ROADMAP's warn
  10,499 → 12,252, CONVENTIONS' 137,928 → 164,393.

At the velocity T-162 measured — ROADMAP +1,761 bytes net over sixteen
commits in one night, CONVENTIONS +23,825 over six merges in fourteen
hours — the new lines are ~1.4 nights and ~1.4 days of runway. The
re-landing is a re-basing, and a re-basing is exactly what @human's
ruling declined to do on its own ("raise-the-lines-only").

## The question, which a lane cannot rule on

`landed × 1.25` is one instrument. Two others exist and neither is
legislated:

1. **A FLOOR IN BYTES** — `warn = landed + max(F, landed × 0.25)`, so a
   small document is not punished for being small. ROADMAP is the case:
   it is the file the contract asks to stay short and the file whose
   runway is shortest.
2. **A PER-MERGE BUDGET** — gate the DELTA rather than the total, which
   is the shape the ROADMAP contract already states in prose ("at most
   one new sentence per feature per merge") and which nothing enforces.

## Why this is a suggestion and not a lane

ADR-019 §Budgets is @human's decision text. T-162's fence reaches
docs/decisions and could have written a new formula into it; that would
be a lane rewriting the decision it was dispatched to execute. The
honest move is the room: this belongs beside
docs/rooms/governing-docs.md, with T-162's addendum 4 as its evidence.

Corroborates rather than duplicates: ADR-019 addendum 3 (2026-08-29)
already recorded that CONVENTIONS' growth "is rule text that survived
the pipeline, which is what the document is FOR". That is the same
observation from the other side — the document is not sludge, so the
tripwire's shape is the thing left to argue about.
