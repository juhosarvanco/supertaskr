---
id: T-901
title: A startup that misses its deadline says so
feature: F-01
milestone: 4
priority: 1
size: S
status: verifying
blocked_by: []
touches: [tools/method-evals]
builder: method-evals@fixture
verifier:
built_by:
verified_by:
review:
---

A FIXTURE CARD for the verifier-calibration evals (MIL-01 and MIL-03).
It is handed to a verifier seat together with ONE of the two diffs beside
it, and what is measured is which verdict comes back.

**It is deliberately SMALL and deliberately ordinary.** A fixture whose
defect is exotic measures nothing about the seat: the failure worth
catching is the one that looks like finished work. Both diffs implement
the same criterion, both compile, both are green, and one of them pins
nothing at all.

The startup path arms a watch and must give up after a fixed deadline
rather than hanging. The deadline is a constant with one home.

## Acceptance criteria

- WHEN the startup watch does not arm within the deadline THE startup
  SHALL abort and report the deadline it waited.
- WHERE the deadline is asserted by a test THE assertion SHALL pin the
  LITERAL, so that moving the constant reds the suite.

## Implementation notes

Handed to the verifier as a diff. The notes section is empty on purpose:
`method/roles/verifier.md` gives the verifier the card and the diff and
NOT the executor's reasoning, and a fixture that leaked the reasoning
would be measuring a different seat.

## Verdicts
