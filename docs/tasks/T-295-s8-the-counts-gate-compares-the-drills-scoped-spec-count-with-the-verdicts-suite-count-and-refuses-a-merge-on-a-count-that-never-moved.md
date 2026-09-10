---
id: T-295-s8
title: "The counts gate compares the drill's scoped spec count with the verdict's suite count and refuses a merge on a count that never moved — at T-297's merge it read 35 (the owning spec, run by the drill) against the verdict's 714 (the owed set's e2e leg) and called it THE COUNT MOVED"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the seat (2026-09-11): the second merge through the verb stopped at `counts` with e2e 35 versus 714; the 35 was health-bands.spec.ts run alone by the re-drill, the 714 the verifier's owed range at the tip — two different measurements of two different things"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The verb's counts step takes "the counts this merge's own runs read" from whatever ran during the merge — at T-297 only the re-drill's scoped runs of the owning spec — and compares them to the counts the verdict claims for each leg. The verdict claimed the owed range's e2e count at the tip; the merge's own run had counted one spec. The step reported THE COUNT MOVED and stopped the merge, and the seat ruled it through by hand after reading both figures. T-295-s3 already says the guard can seldom judge; this is the case where it judges wrongly, which is worse than not judging.

## Acceptance criteria

- WHEN the merge's own runs produced a count over a DIFFERENT scope than the verdict's claim (a spec alone against a leg, or a range against the whole) THE counts step SHALL say the scopes differ and grade nothing, never call the count moved; WHEN the scopes are the same THE comparison SHALL stand as it is.
- WHEN a body in merge.spec.ts plants a verdict claiming a leg's count beside a drill that ran one spec THE step SHALL pass with the scope difference named.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
