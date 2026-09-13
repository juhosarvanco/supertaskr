---
id: T-300-s12
title: "A lane whose cut the arm cannot DERIVE is reported as no lane at all — `laneCutCommit` answers null for a failed merge base exactly as it does for an absent lane, so row 4 falls back to the checkpoint and prints the sentence that says no lane is cut, which is the one state where that sentence is false"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-300-s7, phase 2, grading criterion C4 at the lane tip; the card's criteria ask row 4 to name the cut where the arm HAS cut a lane and say nothing about a lane whose cut the derivation cannot answer"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Since T-300-s7 `laneCutCommit` in `tools/e2e/scripts/dispatch-brief.mjs`
derives the commit a live lane was cut at as the merge base of the lane's
branch against the integration branch, and answers `null` where this
checkout cannot answer: a spawn that errored, a non-zero exit, or output
that is not forty hex characters.

`baseVerdict` takes that same `null` to mean one thing, and prints one
sentence for it. Row 4 then reads, in as many words, that NO LANE IS CUT
for this card here, that the hash beside it is the rule's ANCHOR rather
than a report of a cut, and — in the `why` line — that a dispatch which
stamps the card would cut at a later commit than this one.

Two different states reach that sentence. The first is the state it was
written for and it is common: a card with no live lane, where the row is
exactly right. The second is a lane that IS cut and whose merge base the
derivation could not compute, where every clause of that sentence is
false and the row states them with no hedge. The base field then carries
the checkpoint under a label that says the checkpoint is not the base.

The criterion this sits under is satisfied for every state the arm
actually produces, which is why T-300-s7's verifier assigned a wording
correction for the sentence and filed this rather than rejecting: no
dispatch this arm performs leaves a lane whose merge base against the
integration branch cannot be computed. That is a property of what the
arm does today and not of what the function promises, and the row reports
on lanes the arm did not necessarily cut.

The remedy is to make the derivation's inability its own answer rather
than a shape the absent case already occupies, so the row can say which
of the two it is looking at.

## Acceptance criteria

- WHEN the cut derivation cannot answer for a card that HAS a live lane in this checkout THE row SHALL say that it could not derive the cut, naming the lane's branch and the reason the derivation gave, rather than printing the sentence that says no lane is cut; the absent-lane sentence SHALL remain exactly what it is for a card with no lane.
- WHEN the derivation cannot answer THE base field SHALL disclose that the hash it carries is a fallback to the rule's anchor, in the shape this command already uses for a row it has no deriver for, so a reader is not handed a confident wrong base.
- WHEN a body drives this THE two states SHALL be built as separate arrangements — a card with no lane, and a lane whose cut the derivation refuses — and each SHALL carry an assertion the other would fail; the refusing arrangement SHALL be constructed rather than simulated by handing the pure half a value.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
