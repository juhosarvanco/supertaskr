---
id: T-327
title: "Validated continuation of the merge verb after a stop: completed steps are kept only while their inputs still match, downstream steps are invalidated after a repair, and a bump, a release note, a stamp or a meters append is never applied twice"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-15, filed on the owner's word after the Codex orchestrator's review of the check-evidence reuse proposal"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, docs/conventions/merging.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The merge verb owns the bump, the graph and its pins, the regenerations, the docs gate and the meters, and it stops staged for the seat to rule. Every merge through it so far has been finished by hand after a stop, with the seat's scripts standing in for the verb's own later steps. That hand tail has twice skipped a step the verb would have taken (the card's done stamp at T-320's merge; the checkpoint's own commit, which is not the verb's responsibility at all), and its scripts print an exit and continue, or report a pipeline's downstream exit, where the verb keeps the actual subprocess outcome.

## What would settle it

A continuation contract for the verb's named stopped states and its existing steps only: after a stop and a repair, the verb resumes, keeps a completed step only while that step's inputs still match what it ran over, invalidates every downstream step after a changed input, recovers an interruption that happened after an effect but before its recording, and never applies a bump, a release note, a status stamp or a meters append again. Real failures stay failures. A fixture reaches the actual correction, drill and tail path (T-295-s12 names why no fixture does today). The seat's preserved scripts are evidence of the steps, not the specification.

## Implementation notes

## Verdicts
