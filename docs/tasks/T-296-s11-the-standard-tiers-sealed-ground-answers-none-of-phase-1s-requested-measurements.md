---
id: T-296-s11
title: "The standard tier's sealed ground answers none of phase 1's requested measurements — the arm's ground carries the fenced blobs, the body names and the preflight, and the numbered measurements phase 1 asks for go unanswered unless the verifier takes them itself before opening the diff"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the seat (2026-09-12): the T-300 verifier reported that the arm's sealed ground answered none of phase 1's eight requested measurements, took them itself at the base before opening the diff, stamped the record and cited it as its own rather than as an arm-sealed input"
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Phase 1 writes its attack set tool-less and ends it with the measurements it wants taken at the base before the diff is opened: numbered, concrete, each a command or a reading. On the guarded tier the seat answers them in an addendum to the ground (T-296-s8 records that the arm seals before the addendum can be appended). On the standard tier the arm's ground is the whole ground: the fenced files' blobs and digests, the specs' body names with counts, and the preflight. The requested measurements are not read from the attack set and not taken. The T-300 verifier found this at its bench on 2026-09-12, took the eight measurements itself at the base before opening the diff, and cited the record as its own. A verifier that did not would judge with the ground it was handed and never know what phase 1 asked for.

## Acceptance criteria

- WHEN the bench verb takes the ground on the standard tier THE arm SHALL read the measurement requests phase 1's attack set ends with and SHALL take each that is a command at the base, recording its output under the request's own number, before sealing.
- WHEN a request is not a command THE ground SHALL list it as unanswered by name, so the verifier knows what to take itself, and a body SHALL show one answered and one listed request.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
