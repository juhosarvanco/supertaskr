---
id: T-274
title: "The model experiment — the next two fix passes run on a smaller model (Sonnet) with everything else unchanged, and their verdicts are compared on the same measures as the Opus passes before any seat rule changes"
feature: F-04
milestone: 4
size: S
priority: 16
status: planned
suggested_by: "@human, 2026-09-09: \"run the model experiment\"; every seat of 2026-09-08 ran on Opus (claude-opus-5@subagent); the fix passes cost 240K and 290K tokens"
blocked_by: []
touches: [docs/tasks]
builder:
verifier:
built_by:
verified_by:
review: self-verified
---

An experiment, not a rule: the seat strength line on every brief
(T-157, ADR-020) is advisory and every seat has run on Opus. Fix passes
are the seats least likely to lose anything on a smaller model — the
finding is named, the bodies exist, the diff is a delta — and the blind
bench keeps attacking on Opus. Two passes, measured, then a ruling.

## Acceptance criteria

- WHEN the next two rework or fix passes are dispatched THE executor
  SHALL be `claude-sonnet-5@subagent` (the model recorded in
  `builder:` and `built_by:` as what ran), with the brief, the fence,
  the drill and the suites unchanged.
- WHEN each pass's phase 2 (on Opus) has ruled THE experiment SHALL be
  written on this card as a table: per pass, the finding closed or not,
  mutants killed, findings the verifier raised on the fix, tokens and
  minutes, against the two Opus fix passes of 2026-09-08 (T-248's
  rework 234,751 tokens 41 min; T-224's first rework 240,258 / 50 min).
- IF either pass is REJECTED for a defect the Opus passes' class did
  not show THEN the card SHALL say so and recommend against; IF both
  land clean THEN the card SHALL propose the seat-strength rule (fix
  passes default to the smaller model) as a card of its own.
- This card is done by the architect seat (self-verified: it is a
  measurement, not a guard).
