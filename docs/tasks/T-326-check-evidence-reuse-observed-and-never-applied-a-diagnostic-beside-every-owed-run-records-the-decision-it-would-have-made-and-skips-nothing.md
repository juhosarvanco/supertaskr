---
id: T-326
title: "Check-evidence reuse, observed and never applied: a diagnostic beside every owed run records the reuse decision a conservative per-suite input model would have made, skips nothing and enables nothing"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-15, filed on the owner's word after the Codex orchestrator's review of the check-evidence reuse proposal"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/conventions/gates-and-the-push.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The loop runs the same suites several times per landing: the executor's graded set, the verifier's battery at the sent tip and at its own tip, the seat's tail, the closing check. Whether any of those runs could have discharged a later obligation is unknown, because nothing records what an execution observed. The reuse proposal of 2026-09-14 estimated a saving and withdrew it on review: the parser's and the app's tests read the live board, method text and the committed graph, so package directories are not their input sets, and no run of T-290's landing was shown to qualify. Demonstrated savings are zero and potential savings are unmeasured.

## What would settle it

A diagnostic mode of the gate runner that, beside every owed run and changing none of them, derives a conservative per-suite input key (the package, the live-repository paths the suite opens, directory membership and absent inputs, generated outputs, the lockfiles, toolchains and the environment the suite reads), writes a source record for that actual qualified execution, and records the reuse decision it would have made against earlier records: the same key, a GREEN with valid counts on the blessed runner over a clean committed candidate, no later RED for the key, coverage at least as broad as the obligation. A suite whose inputs cannot be bounded is marked unbounded and the decision is run. The diagnostic skips nothing, admits nothing, and never suppresses a check: a missing cache, an unsupported suite, a failed key derivation or a disagreement leaves the ordinary path and result untouched and appears in the diagnostic report. No old record is manufactured from a commit hash after the fact. The token schemas and the push guards' decisions are unchanged; enabling reuse is a separate, later card after the diagnostic's evidence is reviewed. The storage is a rebuildable runtime cache written by the runner; a missing or corrupt cache means check.

## Implementation notes

## Verdicts
