---
id: T-241-s5
title: The seat-mismatch rule names no reduction from a model id to a model FAMILY and no source for the ASSIGNED model, so its condition cannot be evaluated mechanically
feature: F-04
milestone: 4
size: S
priority: 16
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2) @T-241
blocked_by: []
touches: [method/skills]
builder:
verifier:
built_by:
verified_by:
review: same-model
---

T-241's criterion 8 is met in the shipped bytes:
`method/skills/supertaskr-seat/SKILL.md` §6 carries the sentence verbatim —
*verified by the builder's own model family, not an outside one* — framed as
provenance rather than a downgrade, and `references/golden-lane.md` FIELD
SET 4 carries `verdict.seatMismatch` as a conditional field that the golden
check resolves.

**What is thin is the CONDITION, not the sentence.** *"When the verifier
seat is not the assigned model"* has two inputs and the pack names neither:

- **the ASSIGNED model.** The card's `verifier:` field is the assignment,
  written at the stamp (`golden-lane.md` FIELD SET 1 says so), but §6 never
  points at it — a seat is left to infer where to read it from.
- **the FAMILY reduction.** T-169's mismatch is about a model *family*. An
  exact-string comparison answers wrongly in both directions: it calls
  `claude-opus-5@subagent` and `claude-opus-5[1m]` a MISMATCH when they are
  one family, and it would call two different vehicles of one model a match
  by accident rather than by rule. The pack states no reduction.

The sentence therefore fires by a seat's judgement rather than by a rule,
which is the shape `method/roles/verifier.md` warns about when it says a
criterion satisfied only by prose is unverified.

## What to do

Two sentences in §6: name `verifier:` on the card as the assignment's
source, and give the reduction — the family is the model id up to its first
vehicle or context marker (`@`, `[`), stated once so two seats reduce the
same way. Then pin both in the clauses body, and give the pin a control that
separates a same-family/different-vehicle pair from a different-family pair.

Measured at `9f56d19` by T-241's phase-2 verifier: this very card is
`review: independent` with builder and verifier both `claude-opus-5@subagent`,
so the sentence is owed on T-241's own verdict — and it is there, placed by
a seat reading the rule rather than by the rule deciding.
