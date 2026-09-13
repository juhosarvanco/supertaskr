---
id: T-296-s5
title: "The guard-class map is read from the dispatching checkout's working tree rather than at the base ref, so an uncommitted edit re-tiers a card"
feature: F-01
milestone: 4
size: S
priority: 2
status: parked
wake: T-292
suggested_by: "verifier claude-opus-5@subagent @T-296, 2026-09-10"
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

The tier is derived from two documents, and both are read out of the
integration checkout's WORKING TREE rather than at the ref the lane
inherits. The dispatch commits the card and nothing else, so a map edited
and not committed decides a tier that no commit can explain afterwards.

Measured during T-296's verification, on a scratch clone: with the
committed map naming `method/` for the method-text class and an
UNCOMMITTED edit naming a directory that does not exist, a size-M card
fencing method text was classified `standard`. The printed reason cites
docs/CONVENTIONS.md without saying which copy of it, so the answer and its
stated derivation disagree and nothing says so.

A dirty integration checkout is already irregular, which is why this is a
note rather than a defect in the classifier: the fix is to read both
documents at the ref the stamp lands on, or to refuse a dispatch whose
tier inputs are dirty and name the file. The second is cheaper and tells
the seat something true.

## Acceptance criteria

- WHEN the arm derives a tier THE guard-class classes and their mapping SHALL be read at the ref the lane will inherit, or the dispatch SHALL be refused naming the file whose uncommitted state would have changed the answer.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; the map is read from the working tree rather than the base ref, so an uncommitted edit re-tiers a card.
