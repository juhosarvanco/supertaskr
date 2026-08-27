---
id: T-092-s6
title: Shape six's new isolating-mutant check lands a transcribed denominator with no ref, and it is already 180 out of date
status: suggested
suggested_by: verifier claude-opus-5 @T-092
---

`docs/CONVENTIONS.md` at `73d7870`, in the shape-six paragraph T-092
extends:

> Worked on the file the shape was found in: two mutants each gave
> **1 failed / 832 passed of 833**, naming that body and nothing else.

**No ref, and the denominator is stale.** Measured at `73d7870`:
`npm test` from `app/` is **1013 passed across 47 files**, exit 0. The
833 is T-072's suite size, and nothing on the page says so.

## Why this is the one class this file has already paid for twice

The nearest bullet up is *A COMMENT THAT RESTATES A MEASURED FIGURE IS A
SECOND IMPLEMENTATION*. Two doors down, ADR-019's compaction **deleted
two transcribed denominators from this same file** for exactly this,
replacing them with *"DERIVE the file count at your own ref: the two
denominators this file used to transcribe disagreed with each other until
ADR-019's compaction replaced both with this sentence."* `T-078-s4` and
`T-078-s7` are the rejected findings that argued it, and the ranges
bullet's own *"AN UNREFED DURATION GOES STALE EXACTLY THE WAY AN UNREFED
COUNT DOES"* is the standing rule.

The figure is not WRONG — it was right at T-072 — it is unlabelled, which
is the shape the rule is about. The card it came from carries the same
figure with its context intact, so nothing is lost by not repeating it.

## What would close it

- **Cheapest:** stamp it — *"two mutants each gave 1 failed of 833 at
  T-072's ref"* — six words, and it stays true forever.
- Or drop the numerator/denominator and keep the property, which is the
  only load-bearing half: *"two mutants each failed exactly ONE body,
  naming it and nothing else (T-072)."* The check being taught is
  "failing-body count of ONE"; 832 and 833 carry none of it.

Fence it needs: `docs/CONVENTIONS.md`.
