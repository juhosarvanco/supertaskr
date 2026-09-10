---
id: T-294
title: CI in ten minutes — the e2e lane sharded by owning spec across runners, the owed set run CI-side from the pushed range with T-280's derivation, one run per push and no waiting on the previous run, with the whole four suites nightly on main
feature: F-04
milestone: 4
size: M
priority: 1
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: []
touches: [.github/, tools/e2e/scripts/gate-run.mjs, tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/workflow-parity.spec.ts, .claude/hooks/push-guard.mjs, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

A CI run takes 34 to 36 minutes: the e2e lane 21, cargo 5, the runner's setup 8; and the push guard refuses a push while the previous run is in flight, so pushes serialize behind a 35-minute wait. Playwright shards natively by spec file; the owed-set derivation reads a range and is the same code locally and on the runner.

## Acceptance criteria

- WHEN a push arrives THE workflow SHALL derive the owed set from the pushed range with `gate-run.mjs --owed-set --range <base>..<tip>` on the runner and run the suites and specs it names, the e2e specs sharded across runner jobs by the owning-spec map, the solo-lock legs unsharded; a records-only push SHALL complete in under five minutes and a code push in under thirteen, measured on three consecutive runs.
- WHEN a push is made while a run is in flight THE guard SHALL allow it and CI SHALL run once per push keyed by its commit; the guard's in-flight refusal is retired and the refusal on a concluded red run stays an announcement.
- WHEN the nightly schedule fires THE whole four suites SHALL run on main, and a red SHALL open a finding naming the merge commit whose range first reds under bisection by the owed set.
- WHEN the workflow-parity spec reads CONVENTIONS' CI bullet THE bullet SHALL state the sharding, the owed set and the nightly whole run, and the spec SHALL stay green; the free-disk floor (T-278-s2) SHALL hold on every shard.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
