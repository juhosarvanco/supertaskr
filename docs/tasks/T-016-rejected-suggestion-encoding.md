---
id: T-016
title: Ratify the rejected-suggestion encoding (method v0.1.4)
feature: F-01
milestone: 4
priority: 1
size: S
status: building
blocked_by: []
touches: [method/, lib-parser]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-006-s5. Triage 2026-08-15: dispatch FIRST among hardening
tasks — triage itself produces rejects that need the encoding settled.

## Acceptance criteria
- THE method (v0.1.3 → v0.1.4) SHALL define suggestion-triage
  encoding in tasks/TASK-FORMAT.md: promoted suggestions are absorbed
  into the promoted task (which lists the absorbed ids) and their
  files removed in the same commit; parked → status: parked in place;
  rejected → file moves to docs/tasks/rejected/ keeping
  status: rejected + a dated one-line reasoning. Rationale of record:
  on tasks `rejected` is retriable, on suggestions terminal — one
  status word must not carry both meanings in one directory.
- THE version bump SHALL be noted in docs/CONVENTIONS.md (replacing
  the interim gotcha with a pointer to the rule).
- THE parser suite SHALL gain a test pinning that docs/tasks/rejected/
  is excluded from the model (insurance for the flat-glob invariant).
- IF a rejected file is placed flat in docs/tasks/ THEN the parser
  SHALL surface it as a parse issue (status: rejected without full
  task fields stays illegal there — the trap stays loud).

## Implementation notes

## Verdicts
