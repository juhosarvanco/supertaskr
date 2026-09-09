---
id: T-281-s2
title: "The merge verb's drill runs one WHOLE spec file per correction, and the cost of that at a real merge has never been measured — the saving the card claims is an estimate against an unmeasured spend"
feature: F-04
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-281, 2026-09-09, at 0ecbab9"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-281 replaces 20 to 30 minutes of the architect's CONTEXT per merge with
machine time, and machine time is not free. The drill runs the whole
owning spec once per block, because "the named body RED ALONE" is a claim
about which bodies redded and a scoped run cannot answer it — a
`--grep` that hid a second red would defeat the check the step exists to
make. cli.spec.ts is about 7 seconds at 44 bodies; brief.spec.ts is
larger, and the nine merges of 2026-09-09 carried two to five corrections
each. Nobody has multiplied those out at a real merge.

What is owed is a MEASUREMENT, not an optimisation: run the drill at the
next merge that carries corrections, record wall-clock per block and in
total in the checkpoint beside the minutes-per-correction figure T-281's
sixth criterion already asks for, and only then decide whether it needs
bounding. Two options exist if it does, and both cost something the whole
run currently has: a per-spec cache keyed on the tree's sha (which stops
being a fresh measurement), and a scoped first pass with a full run only
on the bodies that redded (which doubles the run on exactly the case that
matters). Neither should be taken before the number is known.

Class parent: T-281. Disposition hint: promote after one merge has run
the drill for real; the card is a reading and a ruling, not a rewrite.
