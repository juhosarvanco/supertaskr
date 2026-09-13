---
id: T-311-s10
title: "A dated depth-three heading under Verdicts that is not a verdict — an amendment, a seat's note — becomes the newest verdict and refuses the verb, and one card on the board already reads that way"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-311-s5, measured on the bench while grading the absorbed T-311-s7 criteria, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-311-s5 widened the newest-verdict reader from a heading whose date came
first to any depth-three heading under `## Verdicts` carrying a date
anywhere, which is the rule the role file actually states. One class of
heading is excluded — a `CORRECTION` block's own — and no other. Everything
else appended under that section with a date in it is now the newest
verdict, including headings nobody meant as one.

## The finding

Measured on the verifier's bench at the lane tip `163a46c7`, driving both
patterns over every card under `docs/tasks/`: 312 cards carry a `## Verdicts`
section. On 19 the widened reader finds an entry the anchored one missed
entirely, which is the repair. On ONE it MOVES — `T-238-s1`, from its own
`APPROVED WITH ASSIGNED CORRECTIONS` entry to a later
`### Amendment of 2026-09-12 …` appended under the same section. And
`T-317-s3`, which the anchored reader saw no entry on at all, now elects a
heading that reads `### The seat's note, 2026-09-13 …`.

`verdictState` answers `verdict` for such a heading, and the plan step
refuses anything that is not `APPROVED` or `ACCEPTED`. So the failure is
fail-closed, and the refusal now names the heading it read, which is a much
better message than the "carries no dated `### ` entry" that T-311-s7 was
filed about. It is nonetheless a false stop of the same class, reachable on a
card carrying a perfectly good approval, and appending a dated note under
`## Verdicts` is a thing seats on this board do.

The two candidate remedies pull opposite ways and the choice is the card's
to make: require a verdict WORD in the heading, which re-narrows the reader
below the rule the role file states and is the mistake this pair of cards
exists to undo; or say in the method text that `## Verdicts` carries verdict
entries only, and give an appended amendment or note its own section — which
makes the reader right by making the rule it enforces true. A third is to
keep the reader as it is and have it SKIP a heading whose state reads
`verdict` when an approval stands above it, which is a reader deciding what a
record meant and is probably worse than either.

## Acceptance criteria

- WHEN a dated depth-three heading is appended under `## Verdicts` after an entry that reads `APPROVED` THE verb SHALL NOT refuse the card as unapproved, and a body drives the reader and the state check over such a card and over the two cards measured here by their real text.
- WHEN the method text states what `## Verdicts` holds THE one answer SHALL be spelled there — either that the section carries verdict entries only and an amendment goes elsewhere, or that a later dated entry supersedes — so the reader and the writer are not guessing at each other.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
