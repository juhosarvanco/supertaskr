---
id: T-282
title: The triage view clusters suggested cards by fence and class parent and flags duplicates for the human, and the backlog band's lines are RE-DERIVED from the loop's measured arrival, clearing cost and closure rates rather than raised
feature: F-06
milestone: 4
size: S
priority: 3
status: building
suggested_by: "@human (2026-09-09): decision 4 of the seat's review of the outside review — \"re-derive via the keeper\"; the outside review had proposed a filtering agent and raising the band from 40 to 80"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the second sitting of 2026-09-09 the board carried 67 suggested
cards against a band that breaches at 40. The band's own `measured`
entry derives its lines from one reading: the amnesty triage of
2026-08-29 dispositioned 140 cards in one architect sitting for about
477k tokens, roughly 3.4k tokens per card, so a 40-card backlog is the
largest one sitting clears without becoming its own project, and the
drift line is half of it. Two nights of the loop since then filed 27
and 20 cards; every one carries a fence (the seat derived it: 57 of
57, then 67), so the triage that remains is promotions and closures,
and the cost per card is not the amnesty's.

The same sitting found the same defect filed three times (T-216-s6,
T-256, T-238-s5) and a card that duplicated a live lane's remedy. The
rule exists — search before filing; append a corroboration to the
class parent — and two lanes obeyed it; the instrument that would show
the third filing beside the first at triage does not.

## Acceptance criteria

- WHEN `brief.mjs --dispatch --full` renders its triage section THE
  view SHALL cluster the suggested cards by fence overlap (their
  expanded `touches:`) and by class parent (the `T-NNN-s<n>` id and
  any `Absorbs:` or `Class parent:` line the card carries), naming
  each cluster's members, and SHALL flag a suggested card whose fence
  and class parent both match a planned or building card as a
  DUPLICATE CANDIDATE — a flag for the human, never a closure: the view
  changes no card.
- WHEN the backlog band `triage/live-suggestions` is read THE lines
  SHALL derive from a measurement taken on this repository's own
  records — cards filed per sitting and cards dispositioned per sitting
  over the checkpoints since the amnesty, and the tokens per
  disposition where a checkpoint stamped them — with the derivation
  written into the band's `measured` entry beside the commit and the
  records it read; a line typed without a derivation is refused by the
  band's own body.
- IF the measurement says the band should measure something other than
  a count (the backlog's AGE, or its size against the clearing rate)
  THEN the card SHALL say so with the figures and the band SHALL change
  accordingly, its unit and authority updated in the same commit.
- THE health-bands spec SHALL pin that the band's lines and its
  `measured` entry agree (a moved line owes a new derivation), and a
  body SHALL red when the derivation names no record.
- WHEN the checkpoint is recorded THE record SHALL stamp the band's
  reading before and after, with the clock.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
