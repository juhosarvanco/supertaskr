---
id: T-296-s8
title: "The bench arm seals the ground before the seat's addendum can exist — on the guarded tier the ground file's addendum heading is written and sealed in one run, so the seat's further answers either change a sealed input or never reach phase 2"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the seat (2026-09-10): read in dispatch-brief.mjs while preparing T-298's guarded bench — the ground step writes the file with its addendum heading, the seal step hashes it in the same run, and a second run rewrites the ground"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/orchestrator.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

`brief.mjs --bench <id>` performs three steps in one run: it writes the ground file, which ends in the heading the seat's addendum goes under with a line saying nothing has been added by hand; it seals the attack set, the ground and the card at the base by sha256 into the stamps file; it renders the phase 2 brief carrying those digests. Orchestrator.md 5e says that on the guarded tier the seat's answers to phase 1's further asks are added to the ground by hand, as an addendum that says it is one. There is no step between the ground write and the seal for that hand to act in, and a second `--bench` run rewrites the ground from scratch. At T-298's stamp the seat will append the addendum after the run and re-seal by hand, which is the work the arm exists to remove.

## Acceptance criteria

- WHEN the tier is guarded THE bench arm SHALL stop after writing the ground and say where the seat's addendum goes, and a second invocation SHALL seal and render WITHOUT rewriting a ground that already carries text under the addendum heading; WHEN the tier is standard THE single run SHALL stay as it is.
- WHEN the ground file already exists with an addendum THE seal SHALL cover the file as it stands, and a body SHALL show a guarded bench whose addendum survives the sealing run and whose digest in the phase 2 brief matches the file on disk.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
