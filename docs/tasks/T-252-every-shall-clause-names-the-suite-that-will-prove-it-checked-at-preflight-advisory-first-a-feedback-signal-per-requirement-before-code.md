---
id: T-252
title: Every SHALL clause names the suite that will prove it, checked at preflight, advisory first — a feedback signal per requirement before any code is written
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human ruling (2026-09-08, second version sitting): \"approve the v1 three\" — GSD Core's Nyquist validation (a test command mapped per requirement before code; T-245's second pass), reached from our side by T-225-s11's refusal of a body-less fence"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

The verifier's reach is bounded by the spec's reach: a criterion with no
test to prove it is checked by reading, and reading is where a verifier
is most confidently wrong (GSD Core's own calibration data,
docs/design/verifier-reach.md, read 2026-09-08). nputer already refuses a
card whose criteria demand a test body and whose fence holds no spec
file (T-225-s11). This card asks the smaller, earlier question of every
SHALL clause: WHICH suite will prove it.

## Acceptance criteria

- WHEN the card preflight runs THE preflight SHALL list every SHALL
  clause in the Acceptance criteria and, for each, the suite or spec
  file inside the card's fence that will prove it — read from a
  `proves:` note the clause carries, or derived when the clause names a
  spec by path — and SHALL print the clauses that name NONE.
- WHEN a clause names none THE preflight SHALL be ADVISORY in this card
  (exit unchanged), printing the clause by its ordinal; a later card may
  make it a refusal once the count over the live board is measured and
  written into a record.
- WHEN a clause names a suite outside the fence THE preflight SHALL say
  so — the body would have nowhere inside the lane to go (T-225-s11's
  reason, one clause at a time).
- The spec SHALL carry a planted card with three clauses — one proved,
  one unproved, one proved outside the fence — and assert all three
  lines by name; the note's spelling SHALL be transcribed into
  TASK-FORMAT by the same merge (docs gate run).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
