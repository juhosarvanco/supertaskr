---
id: T-320-s5
title: "A compact card takes its feature and milestone from whichever live card shares the most of its fence, and a card the board calls done is as eligible for that as an active one — so express work can be filed under a column the project has closed"
feature: F-04
milestone: 4
size: XS
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-320, filed from the lane on 2026-09-14 as what the lane noticed and did not do"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The express path derives a compact card's required `feature:` and
`milestone:` from the board rather than asking for them: the live card
whose own fence covers the most of the express fence is taken as the
card this change is nearest to, and its two fields are copied.

The derivation reads EVERY live card, including cards the board calls
done. On ground a finished card fenced heavily and an active one fences
lightly, the finished card wins, and the compact card is filed under a
feature and a milestone the project has closed. The reuse rule beside
it already distinguishes active from finished for exactly this reason
and this derivation does not.

## What would settle it

Rank the placement over the same active statuses the reuse rule uses,
fall back to the whole board only when no active card shares the fence,
and say which of the two it used in the line it already prints. The
refusal that names the settling dials stays as it is.

## Implementation notes

## Verdicts
