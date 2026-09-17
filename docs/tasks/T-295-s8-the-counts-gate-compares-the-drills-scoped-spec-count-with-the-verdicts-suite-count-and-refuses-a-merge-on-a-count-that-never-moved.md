---
id: T-295-s8
title: "The counts gate compares the drill's scoped spec count with the verdict's suite count and refuses a merge on a count that never moved — at T-297's merge it read 35 (the owning spec, run by the drill) against the verdict's 714 (the owed set's e2e leg) and called it THE COUNT MOVED"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the seat (2026-09-11): the second merge through the verb stopped at `counts` with e2e 35 versus 714; the 35 was health-bands.spec.ts run alone by the re-drill, the 714 the verifier's owed range at the tip — two different measurements of two different things"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The verb's counts step takes "the counts this merge's own runs read" from whatever ran during the merge — at T-297 only the re-drill's scoped runs of the owning spec — and compares them to the counts the verdict claims for each leg. The verdict claimed the owed range's e2e count at the tip; the merge's own run had counted one spec. The step reported THE COUNT MOVED and stopped the merge, and the seat ruled it through by hand after reading both figures. T-295-s3 already says the guard can seldom judge; this is the case where it judges wrongly, which is worse than not judging.

## Acceptance criteria

- WHEN the merge's own runs produced a count over a DIFFERENT scope than the verdict's claim (a spec alone against a leg, or a range against the whole) THE counts step SHALL say the scopes differ and grade nothing, never call the count moved; WHEN the scopes are the same THE comparison SHALL stand as it is.
- WHEN a body in merge.spec.ts plants a verdict claiming a leg's count beside a drill that ran one spec THE step SHALL pass with the scope difference named.

## Amendment of 2026-09-13 — count-scope evidence (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — count-scope evidence. The step distinguishes established same scope, established different scope and unknown scope. Scope is derived from the available execution selection and the verdict's stated measurement context, never inferred from the numeric count or a shared leg name alone. Established same-scope measurements keep the existing comparison and its refusal on a changed count; established different scopes are reported and not compared. Missing or unresolved scope is reported as not judged for lack of scope evidence, never as a demonstrated scope difference or a passed comparison. Bodies cover a same-scope mismatch, equal counts from different selected sets and missing scope evidence, in addition to the scoped-drill case. A count comparison that is not judged does not erase a failed required test or another merge refusal.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — the counts gate compares a scoped drill count with a whole-suite count and refuses a merge on a number that never moved. Not dispatched by this sitting.
