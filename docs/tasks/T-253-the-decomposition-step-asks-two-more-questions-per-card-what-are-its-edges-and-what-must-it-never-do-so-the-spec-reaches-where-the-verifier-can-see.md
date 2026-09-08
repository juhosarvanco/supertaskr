---
id: T-253
title: The decomposition step asks two more questions per card — what are its edges, and what must it never do — so the spec reaches where the verifier can see, and a must-not becomes a criterion before any code exists
feature: F-03
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human ruling (2026-09-08, second version sitting): \"approve the v1 three\" — GSD Core's edge probe and prohibition probe at spec time, \"verifier reach = spec reach\" (docs/design/verifier-reach.md; T-245's second pass)"
blocked_by: []
touches: [method/interview]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

The interview is the product, and what it does not write down the
verifier cannot check. GSD Core widens the spec at spec time with two
probes: a shape taxonomy that surfaces the boundary, adjacency, encoding
and ordering edges an author omits, and an adversarial elicitation of
what the feature "could silently become that the author would not
want". Their own data: once a surfaced edge is resolved into the spec,
the verifier catches it 94–100 %. nputer's decomposition
(method/interview/decomposition.md) turns answers into cards with EARS
criteria and asks neither question.

## Acceptance criteria

- WHEN the decomposition step drafts a card THE step SHALL ask, per
  card, "what are its edges" (boundary, adjacency, encoding, ordering —
  the four named, as a checklist, not a taxonomy the model invents) and
  "what must it never do", and SHALL turn each answer the human keeps
  into an IF/THEN or a "SHALL NOT" criterion on the card — a probe that
  produces no criterion is written as "none surfaced", never silent.
- WHEN a must-not names a value judgment no test can hold (the
  judgment tier) THE criterion SHALL say so in its own words and route
  to a human check, never to a test that would go vacuous.
- The method eval gate SHALL run (`node tools/method-evals/run.mjs` and
  `--selftest`), the eval block for the bump SHALL be written, and the
  genesis walk's fixture SHALL show the two questions asked once.
- Nothing under app/ moves; the app's runner reads the same prompt file
  (ADR-021 decision 3), so the two lenses gain the questions together.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
