---
id: T-331
title: "CI's planning job derives the owed set before the parser is built, so the static import edge to the parser's built entry cannot land and every push falls back to all four suites and all 42 e2e specs, while the same range locally selects three suites and 12 specs: give the planning job the preparation its derivation needs, keep the fail-closed fallback for genuinely unresolved inputs, and prove the local and fresh-runner selections agree for one exact range"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against the job logs and the local derivation"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/workflow-parity.spec.ts, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

CI runs the owed set CI-side since T-294: a planning job derives what the pushed range owes and the suite jobs run that. On the push of one amended card on 2026-09-15 the planning job's log reads that the derivation FAILED CLOSED because the static import graph has an edge it could not land on a file, the edge from the brief spec to the parser library's built entry, and it answered all four suites with the e2e leg whole: 42 spec files across four shards. The job checks out, sets up node and derives; it never installs or builds the parser, so the built entry does not exist when the graph is walked. The checks job gained exactly that preparation at T-317; the planning job did not. Locally, with the parser built, the same range derives parser, app and 12 e2e specs.

The fallback is the right answer for an input the derivation genuinely cannot resolve. Here the input is unresolvable only because of the job's own build order, so every push pays the fallback, and on this push the fallback cost a 37-minute shard for a change whose correct selection excludes that shard's slowest spec; the other three shards took 3 to 6 minutes, which suggests the size of the opportunity and does not establish the duration after the repair.

## What would settle it

The planning job prepares what its derivation walks: the parser installed and built before the owed set is derived (the same steps the checks job already runs), or the derivation resolving a generated entry through its owning source and build relationship without the build. The fail-closed answer stays for an input that is genuinely unresolved, and it names the input as it does today. A body proves parity: for one exact pushed range, the selection a fresh runner derives equals the selection the integration checkout derives, suite for suite and spec for spec. The card reports, for the push that lands it and for the next records-only push, the time to push and the time to CI completion separately; it promises no runner figure before that measurement.

## Acceptance criteria

- WHEN the planning job derives the owed set for a pushed range THE job SHALL have the parser library's built entry present before the derivation walks the import graph, or SHALL resolve that generated entry through its build relationship, and SHALL answer the same suites and specs the integration checkout answers for that range.
- WHEN an input of the derivation is genuinely unresolved THE derivation SHALL still fail closed to the whole battery and SHALL name the input.
- WHEN this card lands THE card SHALL record, for its own push and for the next records-only push, the time to push and the time to CI completion as two figures, with the specs each selection ran.

## Implementation notes

## Verdicts
