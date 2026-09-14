---
id: T-324-s3
title: "The grant's limits are read, reported and enforced by nothing: T-324 defers the enforcement by name so no control silently does nothing, and the card the deferral points at does not exist"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-324, from that card's own criterion about the optional limits, which requires the deferral to be named and leaves the later card unfiled"
blocked_by: [T-324]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/run-record.mjs, method/runtime/process-schema.yaml, tools/e2e/tests/run-record.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The dispatch block records the ceilings a grant was given under: a token
ceiling per provider and an expiry instant. T-324 reads them, validates
them, and reports each one BY NAME as advisory and unenforced — which is
the honest shape, and it is the shape that keeps a control from silently
doing nothing. The schema's rows say `advisory: true` and stay
`declarative` for the same reason.

What follows from that is a deferral with no card behind it. An expiry
that has passed refuses no admission. A token ceiling is compared against
nothing. The owner of this project ruled on 2026-09-13 that this loop
runs without them, so nothing here is broken; what is missing is the card
that would make the rows mean what they say when a project does want
them.

The hard half is not the comparison. It is where the number comes from: a
provider's live usage reaches no file this arm reads, which T-324's own
report names as one of the coordinator's obligations rather than one of
the arm's refusals. A ceiling enforced against a figure nobody measured
would be worse than an advisory one.

## Acceptance criteria

- WHEN a grant carries a token ceiling THE arm SHALL compare it against a usage figure whose SOURCE is named and recorded, and SHALL refuse an admission by name when the ceiling is reached rather than reporting it as advisory.
- IF no usage figure can be established THEN THE arm SHALL say so and admit, because a ceiling enforced against a number nobody measured is a refusal nobody can reproduce.
- WHEN a grant carries an expiry THE arm SHALL refuse an admission made after it by name, and the refusal SHALL name the instant it read and the clock it read it from.
- WHEN the enforcement lands THE schema rows SHALL stop saying advisory and SHALL say operational, with a body that changes each value and watches the arm answer differently, and the conventions SHALL move with them in the same commit.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
