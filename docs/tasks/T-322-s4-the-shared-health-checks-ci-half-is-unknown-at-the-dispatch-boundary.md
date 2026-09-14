---
id: T-322-s4
title: "The shared-health check's CI half is unknown at the dispatch boundary, because reaching the runner there would make the arm's own size non-deterministic: the check that decides whether a card may start runs with the one condition it most needs unread"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-322, measured while wiring the check: dispatchContext defaults the CI half to known false and only the return brief populates it, because brief-flush.spec.ts compares two runs of every arm and a network call would make that comparison meaningless"
blocked_by: [T-322]
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322's health check is specific to the proposed action, and the action
it most often has to rule on is a lane cut. That is the dispatch order's
boundary, and there the CI half of the state is reported UNKNOWN: the
writers half is derived from the run records, the verification half is
honestly not owed at that stage, and the condition that decides whether
an attributed red permits a repair or holds a landing is simply not read.

The reason is measured rather than an oversight. Reaching the runner from
that arm makes its own output a function of a network answer, and
`brief-flush.spec.ts` compares two runs of every announced arm to derive
its loss point — a comparison that means nothing if the two runs saw two
different histories. So the arm that CAN reach the runner is the return
brief, which is a report rather than a decision.

The consequence is that the rules which turn on a red never fire where a
dispatch is actually chosen. Nothing is wrong; the control is narrower
than the sentence it was built from, and a reader of the dispatch order
sees a health line that cannot hold a landing a red invalidates.

## Acceptance criteria

- WHEN the dispatch order rules on a proposed action THE CI half of the shared conditions SHALL be read, and where it cannot be read the row SHALL say so rather than leaving the rules that turn on a red silently unfired.
- WHEN the runner's answer is carried into an arm whose size is compared across runs THE comparison SHALL be made against a recorded answer rather than a live one, so the guard keeps measuring the command rather than the network.
- WHEN a red on the integration branch is attributed THE attribution SHALL be readable at the dispatch boundary without re-reading a log, since the attribution is already a record.
- WHEN this lands THE check SHALL be pinned at BOTH boundaries by the same bodies, because a condition read in one place and defaulted in another is two behaviours wearing one name.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
