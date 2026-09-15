---
id: T-328
title: "Lifecycle events for a card's delivery, with the push accepted and the CI conclusion as two distinct endpoints, and the actual producers named before anything is built"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-15, filed on the owner's word after the Codex orchestrator's review of the check-evidence reuse proposal"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts, docs/conventions/merging.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The meters records carry the executor's and the verifier's own phase figures but nothing says what delayed a delivery: the landing, the push and the CI conclusion are reconstructed afterwards from ledger lines and summary lines, and the boundary checkpoint of 2026-09-15 shows how that reading fails (a Playwright summary read from its last line, an empty rust target's header). The merge verb cannot know the CI conclusion at its pre-commit meters step, and no repository file owns the seat's push and CI-watch path today.

## What would settle it

A preparatory card before any instrumentation: name the actual producers and the reader of source-labelled, append-only lifecycle events carrying card, attempt, candidate ref, phase, start, end and outcome, for dispatch and setup, executor work, independent verification, landing, push acceptance and CI conclusion; correlate commit, push and run identities; keep the seat's observation of CI apart from the service's completion instant; leave unavailable endpoints unknown; give retries and failed attempts their own identities; never sum overlapping intervals as delivery delay. Commit timestamps are labelled approximations where a lifecycle instant is missing. No reading is mutated and no commit is made to manufacture an endpoint. The size is not established until the producers are named.

## Implementation notes

## Verdicts
