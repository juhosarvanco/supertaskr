---
id: T-298-s8
title: "The seat advisory's size signal asks whether a card's size EQUALS the lightest ceremony row, so adding one lighter row moved 487 of this board's 701 sized cards from KNOW to TRY on that signal — the question the rule meant to ask is whether the card is that light or lighter"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-298-s3, measured at 9d7a15827ceb08b3d8b90cc564df844cfa3e64f4, 2026-09-14"
blocked_by: []
touches: [tools/e2e/scripts/session-economics.mjs, tools/e2e/tests/session-economics.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

seatVerdict in tools/e2e/scripts/session-economics.mjs scores the size
signal as `size === lightest ? KNOW : TRY`, where `lightest` is
lightestTier's reading of the ceremony table's FIRST row. That is an
equality against one row rather than a comparison along the axis the
table is ordered on, and it was indistinguishable from the intended
question for as long as the lightest row was also the smallest size any
card carried.

T-298-s3 added an XS row above S, because the tier table admits the
bounded tier on XS and the ceremony table is written lightest-first.
The equality then answered TRY for every S card: 487 of the 701 sized
cards on the board at the ref in suggested_by (S 487, M 192, L 22).
Nothing broke — the block is ADVISORY, its own line says so, and a tie
already goes to the stronger seat — but the majority of this project's
cards now carry one more TRY on a signal whose meaning did not change,
which is a shift in what the dispatch recommends and nobody decided it.

**THE TWO READINGS, BOTH DEFENSIBLE, WHICH IS WHY THIS IS A CARD AND NOT
A PATCH.** "The card sits at the lightest ceremony this project has" is
what the code computes. "The card is at or below the ceremony a seat can
be trusted to carry alone" is what the signal is used for. The first
makes the signal a function of the table's shape, so every future row
re-scores the whole board; the second makes it a function of the card,
and needs the table's rows ordered as a scale the comparison can walk —
which they are, and which nothing currently asserts.

The executor that measured this could not decide it: the fence widened
at T-298-s3 reached the SPEC and deliberately not the script, so the
rule stayed where a seat could look at it whole.

## Acceptance criteria

- WHEN the ceremony table gains a row lighter than the sizes cards
  already carry THE size signal SHALL not change its verdict for a card
  whose own size and ceremony did not move.
- WHEN the signal compares a card's size against the table THE
  comparison SHALL rest on an ordering the table itself declares, and
  a table that does not declare one SHALL be a refusal rather than a
  silent equality.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
