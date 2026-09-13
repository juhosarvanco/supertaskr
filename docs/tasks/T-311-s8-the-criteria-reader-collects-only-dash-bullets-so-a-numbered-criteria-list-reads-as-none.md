---
id: T-311-s8
title: "The advisory seat reader collects only dash-bullet criteria, so a card whose criteria are a numbered list reads as carrying none — the same defect as the heading depth, one axis over, and six cards on the board sit on it"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311-s5, measured in the lane while repairing the heading half and reported in its notes, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/session-economics.mjs, tools/e2e/tests/session-economics.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

The heading half of this defect is T-311-s5's, and this is the other
half of the same reading: after the section is found, the reader splits
it on dash bullets and keeps nothing else, so a criteria section written
as a numbered list arrives as an empty list and the advisory line says
the card carries no acceptance criteria.

## The finding

Measured over `docs/tasks/` at the T-311-s5 lane's base, with the
criteria heading rule that lane makes the two readers share: 794 cards,
and six of them carry a criteria section the card preflight finds and
the advisory reader reads as empty. Five write their criteria as a
numbered list — T-018-s5, T-205-s6, T-229-s10, T-229-s11 and T-229-s12 —
and one, T-229-s4, has for its only criteria-named section a verifier's
per-criterion table of bold prose rather than a list at all.

The consequence is the same as the heading's and reaches the same line:
the seat signal reports "the card carries no acceptance criteria, so
there is nothing to build against" and answers TRY on that basis. That
is the stronger seat, so nothing is lost on the day it happens; what is
lost is the ability to audit the signal, because the reading behind it
is one no other tool makes.

The task format names EARS notation for the criteria and says each line
is enforceable by a test. It does not say the lines are dash bullets,
and a numbered list is a list. So the repair is either half of one
choice and the card should make it: widen the reader to take an ordered
list, or name the one list shape in the task format the way T-311-s5
named the one heading depth, and keep whichever is chosen with a body
over the board.

## Acceptance criteria

- WHEN a card's criteria section is written as an ordered list THE advisory seat reader SHALL read its items as criteria, or the one list shape SHALL be named where the heading depth is named and a body over every card on the board SHALL red naming any card that writes another; one of the two, argued on the card.
- WHEN the reader has been widened or the shape named THE set of cards whose criteria section reads as empty SHALL be measured at the lane's own ref and pinned by a body, so the next card written the other way is a red rather than a silent TRY.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
