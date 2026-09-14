---
id: T-324-s2
title: "The lane cut admits and records nothing: the admission is derived, reported and thrown away, so two lane cuts of one card under approval each are both admitted and only the child start ever writes a consumption"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-324, measured in that lane while building the admission at the four boundaries; inside that card's criteria for the refusal and outside them for the recording, since the card forbids a second ownership ledger and adds no record at the cut"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-324 admits work at four boundaries and records the admission on the run
record at three of them. The lane cut is the exception, and it is the
exception by construction: the dispatch ritual opens no run record, so
there is no document for the cut's admission to land on. What the cut
does is derive the admission, refuse on it, print it, and drop it.

The consequence is narrow and real. Under approval `each` the grant's
per-card approval is spent at the first admission that RECORDS one, which
is the child start. A seat that cuts a lane, abandons it, and cuts it
again has made two admissions of one card and consumed nothing either
time; the refusal for a consumed approval only fires once a child has
actually been started. T-311-s1 already filed the neighbouring half of
this from the other side: the dispatch ritual opens no run record and the
merge closes none.

This is not a second ownership ledger. The run records ARE the ledger,
and what is missing is a record at the cut rather than a table beside
them.

## Acceptance criteria

- WHEN the lane cut admits work THE admission SHALL be recorded where the later boundaries read their ledger from, so that a second cut of one card under approval each meets the same consumed refusal a second child start meets.
- WHEN a lane cut is refused or unwound THE record SHALL say so rather than leaving a consumption nothing can retire, and a re-run of the same dispatch SHALL re-present its own admission rather than spending a second approval.
- WHEN the recording lands THE bodies SHALL drive a real second cut rather than calling the reader twice, since what is under test is the boundary and not the function.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
