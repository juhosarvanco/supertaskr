---
id: T-332
title: "The docs-input-gate spec costs a CI shard half an hour when it is owed, because its bodies launch the real docs gate against the whole repository again and again: exercise the spellings and the exit combinations over small controlled fixtures, keep representative real-repository checks, and measure the repeated scans before choosing any caching"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against shard 4's log"
blocked_by: []
touches: [tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

On the CI run of 2026-09-15 for one amended card, the e2e shard that carried the docs-input-gate spec took 37 minutes while the other three took 3 to 6; 28.7 of those minutes were that spec's bodies. The slowest body, every spelling of one docs path answering the same, took 9.4 minutes on its own; the exit-code matrix, the empty-path-list exit, the unreadable-path line and the advisory scan took 2 to 3.5 minutes each. Each of them launches the real docs gate against the repository, several times per body, and the gate scans the whole tree every time. The spec was not even owed by that push: the correct selection for the range omits it, and it ran only because the planning job had fallen back to the whole battery. When it IS owed, the same cost is paid legitimately.

## What would settle it

The spellings and the exit combinations exercised over small controlled fixture repositories, where a scan is milliseconds; a representative set of real-repository integration checks kept, chosen so that the gate's answer over this tree is still pinned; the repeated scans measured (how many launches per body, how long each) before any caching or memoisation is chosen, so the choice is made on figures. The card reports the spec's wall time before and after on one runner shard.

## Acceptance criteria

- WHEN a body exercises a spelling of a docs path or a combination of the gate's exit codes THE body SHALL run the gate over a small controlled fixture repository, and the real repository SHALL be scanned only by a representative set of integration bodies named as such.
- WHEN this card lands THE card SHALL record the number of gate launches per body and the spec's wall time on one runner shard before and after, and SHALL choose caching or memoisation only on those figures.

## Implementation notes

## Verdicts
