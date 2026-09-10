---
id: T-294-s6
title: "The retired-acknowledgement body compares two guard outputs that carry a wall-clock duration and reds when a minute boundary falls between the two invocations — the fixture's invented run is aged from now, so `running for 226h 59m` meets `227h 0m` and the body says a sentence moved"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the seat (2026-09-11): the closing check for the T-299/T-305 dispatch stamps at 3e791c58 redded push-guard.spec.ts's body `the acknowledgement is RETIRED, and no environment variable moves this guard's CI arm` on exactly that diff — Expected `running for 226h 59m`, Received `running for 227h 0m` — over a diff that moved two cards"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The body runs the guard twice over the same fixture, once with the retired environment variable set and once without, and asserts the two outputs are byte-identical ("and it moves no sentence either"). The fixture's live run carries a fixed start time and the guard prints how long it has been running, computed from the clock at the time of the call — so the two outputs differ whenever a minute boundary falls between the two calls, about once in every few dozen runs. The red arrived in a closing check over a records-only range and cost a re-run of the owed set.

## Acceptance criteria

- WHEN the body compares the two outputs THE comparison SHALL exclude, or freeze, the wall-clock duration — an injected clock on the fixture, or the duration line masked on both sides — so the property (no environment variable moves the guard) is the only thing that can move the sentence.
- WHEN the body is run in a loop across a minute boundary THE result SHALL be green every time; a planted difference in any other line SHALL still red it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
