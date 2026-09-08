---
id: T-251
title: The debt-marker limit in the landing gate — a TODO, FIXME or XXX in a lane's diff must cite a card id, or the landing is refused; the metabolism's rule that no finding rots gets its teeth at the merge
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's verifier treats an unreferenced debt marker as a BLOCKER (agents/gsd-verifier.md); nputer's metabolism (charter 12) has no such check at the write"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

The metabolism promises that findings never rot: every suggestion is
promoted, parked with a wake condition, or discharged on record. A
`TODO` in code is a finding that skipped all three. GSD Core's verifier
reds an unreferenced debt marker unless the line names follow-up work.
nputer's landing gate is where the rule belongs, because the gate
already reads the lane's diff for its six limits.

## Acceptance criteria

- WHEN a lane's diff adds a line containing a debt marker (TODO, FIXME,
  XXX, HACK — the set is ONE list with a positive control each) THE
  landing gate SHALL refuse the landing UNLESS the same line cites a
  card id in the parser's own shape (`T-NNN` or `T-NNN-sN`) that exists
  on the board — an id that does not exist is the same refusal, named.
- WHEN the marker predates the lane (it is in the base, not the diff)
  THE gate SHALL not judge it — the limit is on what a lane ADDS.
- The refusal SHALL be a disclosed limit beside the others, with a
  planted positive (a `TODO` with no id reds by name) and a planted
  negative (a `TODO T-251` passes).
- CAPABILITIES SHALL be regenerated.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
