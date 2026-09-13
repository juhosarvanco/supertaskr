---
id: T-295-s10
title: "The merge verb's drill step refuses a verdict whose assigned corrections are all wording and say in as many words that they carry no block — the role file's step 5b allows exactly that shape, so the verb stops on a verdict it should read as having nothing to drill"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the architect seat at the T-314-s6 merge, 2026-09-14"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At the T-314-s6 merge (2026-09-14) the verdict at the bench tip fc4e3bad assigned two corrections, both wording — a notes claim withdrawn and a count corrected — and said of each that it carries no mutant block, which is the shape the verifier role file's step 5b prescribes for a correction with no property to pin. The verb's drill step refused: the newest verdict assigns corrections and carries no mutant block, a correction whose body has to be recovered from a transcript being the thing the step exists to prevent. The step reads correction count against block count and treats every shortfall as a missing body; the role file distinguishes an explained shortfall (a wording correction that says so) from an unexplained one, and the verb does not. The seat ruled through and finished the tail by hand, the fourth false stop of the verb this weekend after the counts (T-295-s8), the mid-merge drill (T-295-s7) and the heading shape (T-311-s7, landed).

## Acceptance criteria

- WHEN the newest verdict assigns corrections THE drill step SHALL read, per correction, whether the verdict states it carries no block, SHALL drill each block it finds and SHALL treat a stated no-block correction as nothing to drill, refusing only an unexplained shortfall — a correction with neither a block nor the statement; pinned by bodies over a verdict with two stated wording corrections (the step passes and prints both as wording), a verdict with one block and one stated wording correction (one drill, no refusal), and a verdict with a correction that has neither (refused by name).
- WHEN the step passes on stated wording corrections THE plan's line for the step SHALL name each such correction as wording with no drill, so a seat reading one line per step sees why nothing was drilled.

## Implementation notes

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14): to planned at priority 2 — the verb's drill stopped the T-314-s6 merge on the shape the role file allows; dispatched right after T-295-s9 merges, sharing its fence.
