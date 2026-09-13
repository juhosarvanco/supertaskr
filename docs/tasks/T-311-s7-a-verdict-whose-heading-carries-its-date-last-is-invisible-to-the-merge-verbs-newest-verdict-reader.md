---
id: T-311-s7
title: "A verdict whose heading carries its date at the end is invisible to the merge verb — the newest-verdict reader wants the date first, the role file only says dated, and the T-311 merge stopped at the drill with the verdict in plain sight"
feature: F-04
milestone: 4
size: S
priority: 1
status: planned
suggested_by: "the Claude seat, the T-311 merge on 2026-09-12 (the verb stopped at drill:refused with the verdict committed on the bench at 22170bc5)"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The T-311 verifier appended its verdict under the card's `## Verdicts`
heading as `### APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent,
verifier phase 2, 2026-09-12`, which is dated and names its model and
session as the role file's step 5 asks ("dated, with your model@session").
The merge verb's newest-verdict reader matches a heading against a pattern
that requires the date at the start, after at most one capitalised word. So
the verb planned no correction step, and its drill refused with "the card's
`## Verdicts` section carries no dated `### ` entry" while the entry stood
one screen above the message. Every earlier verdict happened to spell the
date first.

The seat ruled through: correction 1's block was drilled by hand (RED under
its mutant, restored and proved by sha256), correction 2 applied and drilled
both ways, the readings and the message written by hand. That is the third
false stop of the verb in eight runs, and the second whose cause is a
reader narrower than the rule it enforces.

## Acceptance criteria

- WHEN a verdict entry under `## Verdicts` is a depth-three heading carrying a date anywhere in it THE newest-verdict reader SHALL find it, and a body drives the reader over the two spellings seen so far (date first, date last) and a heading with no date, requiring the first two found and the third refused.
- WHEN the role file states the verdict's heading THE one shape SHALL be spelled there with the date's place named, so a verifier does not have to guess what a later reader wants; the sentence stays product-agnostic.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 1, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.
