---
id: T-284
title: Triage batches suggested cards that share a fence into ONE lane before dispatch — the class parent absorbs its siblings with their criteria kept whole, and the batch is one card, one bench, one merge
feature: F-06
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human (2026-09-09): decision B of the backlog review — \"Are there mechanisms that merge the suggested cards that touch similar places or make sense to do in one session in to one card?\" — ruled yes, with T-282 unheld as the instrument"
blocked_by: [T-282]
touches: [method/roles/orchestrator.md, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The board's only folding mechanism is by hand: 131 cards carry an
`Absorbs:` line, written at a triage when the seat happened to hold
two findings in view at once. Nothing shows the seat the siblings it
does not happen to hold, so the same defect was filed three times in
one sitting (T-216-s6, T-256, T-238-s5) and fifteen S-sized cards
filed in one night each face their own two-hour lane. T-282 gives the
view the clusters; this card gives the seat the rule for what to do
with one.

## Acceptance criteria

- WHEN the triage view shows a cluster of two or more suggested or
  planned cards whose expanded fences overlap and whose sizes are S or
  XS THE seat SHALL fold them into ONE card at the stamp of the next
  card in that fence or at the sitting: the class parent (or the
  oldest) carries an `Absorbs:` line naming each sibling, each
  sibling's acceptance criteria are kept WHOLE under a heading that
  names it, the siblings' files are removed in the same commit, and the
  folded card's size is re-stated from the sum.
- WHEN a folded card is dispatched THE lane SHALL be one lane, one
  bench and one merge, and the verifier's attack set SHALL cover every
  absorbed criterion by the sibling's id.
- WHEN orchestrator.md step 2 is read THE rule SHALL be stated once,
  beside the triage-at-the-stamp rule, with the reason (the lane's cost
  is fixed and the change is not) and the limits (no batch larger than
  M, no batch across fences, no batch that holds a priority-1 card
  behind its siblings); TASK-FORMAT.md SHALL carry the encoding of the
  kept-whole criteria; the method eval gate SHALL run and the bump
  SHALL carry its eval block.
- IF a sibling's criteria conflict with the parent's THEN the seat
  SHALL NOT fold it and SHALL say why on both cards in one line each.
- WHEN a folded card closes THE checkpoint SHALL count the fold as one
  lane and as many cards closed as it absorbed, so the closure rate the
  backlog band reads (T-282) sees the batch.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
