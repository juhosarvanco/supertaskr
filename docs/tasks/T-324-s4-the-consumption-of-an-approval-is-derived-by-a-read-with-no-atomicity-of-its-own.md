---
id: T-324-s4
title: "The consumption of an approval is derived by a read with no atomicity of its own: two admissions of one card that reserve no resource can both read an empty ledger and both spend the same per-card approval, because the only atomic primitive in the path is the writer reservation T-311 takes afterwards"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-324, from that lane's phase-1 attack set (the concurrency attack) graded at phase 2; outside T-324's criteria, which ask for a retry to consume nothing twice and say nothing about two concurrent admissions"
blocked_by: [T-324]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-324 derives what has been consumed by reading the run records and
filtering them for this card at this revision. It is a read, and nothing
holds between it and the write that follows. The admission is decided,
an attempt id is taken, and only THEN does the reservation's exclusive
create make the outcome atomic — which serialises two writers over one
resource and says nothing about two admissions of a card whose
assignment reserves nothing.

So under approval `each`, two starts of one card that both carry
`resource: none` can each read a ledger with no terminal entry for that
card, each be admitted, and each record a consumption of the one
per-card approval the owner gave. The card's own retry rule is not the
same question: a retry presents the same attempt and re-presents its
admission, and T-324 holds that correctly. What has no answer is two
attempts that never meet.

The window is narrow today because a writer always reserves and the
reservation is exclusive, so the pair that can race is the pair that
writes nothing. It will stop being narrow the moment a second
coordinator runs, which is the arrangement T-238's successor seat and
this card's own sixth criterion both anticipate.

## Acceptance criteria

- WHEN two admissions of one card are decided concurrently under approval `each` THE arm SHALL spend that card's approval at most once, and the second SHALL be refused as consumed by name, whatever resource either assignment names.
- WHEN the consumption is made atomic THE primitive SHALL be named where the reservation's own is, in one place a reader can grep, rather than left to the order of two statements.
- WHEN the atomicity lands THE body SHALL interleave two real admissions rather than call the reader twice in sequence, because what is under test is the window between the read and the write.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
