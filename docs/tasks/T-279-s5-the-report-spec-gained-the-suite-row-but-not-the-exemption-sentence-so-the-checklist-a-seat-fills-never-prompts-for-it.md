---
id: T-279-s5
title: "T-279 put the suite/ref/count row into executor.md's report spec but left the exemption sentence two screens above it, so the one checklist a seat fills top to bottom prompts for the count and never for 'no suite was re-run for the stamp'"
feature: F-04
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-279, 2026-09-09, at 7b9f2ee"
blocked_by: []
touches: [method/roles/executor.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-279's AC2 asks that the report "say so in as many words" when the stamp
commit's exemption is taken, and the rule landed — in the ordered
section, as *"**Say so in the report in as many words** — afterwards a run
skipped on purpose and a run forgotten look identical"*. The criterion is
MET and the bench approved it there.

The observation is a placement one. `## The report` is a bullet list a
seat fills in top to bottom, and T-279 added its OTHER report obligation
(each graded suite with its ref and its body count) directly to that
list. The exemption sentence stayed two screens up. So the checklist
prompts for the count and not for the one sentence whose whole purpose,
in the section's own words, is to tell a skipped run from a forgotten
one — the failure mode is precisely the one a seat working down a list
falls into.

## Acceptance criteria

- WHEN a lane takes the stamp exemption THE `## The report` bullet list
  SHALL carry the obligation to say so, as a bullet or as a clause of the
  graded-suite bullet, with the ordered section keeping the rule and the
  reason.
- WHEN that is written THE order SHALL still be stated once: the report
  list states what the REPORT owes, never a second copy of when the
  exemption applies, and points at the section for the rule.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
