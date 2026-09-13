---
id: T-314-s6
title: "Two of T-314's `--take-seat` bodies spawn the verb straight from the test process, so on the runner — where no harness is an ancestor — the seat verb answers COULD NOT RUN and main is red on CI at 8d26c8c5 while both bodies are green under a local harness"
feature: F-04
milestone: 4
size: S
priority: 1
status: suggested
suggested_by: "the architect seat, reading CI run 34772159066 on 2026-09-13"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

CI run 34772159066 on main at 8d26c8c5 (2026-09-13): e2e shard 2 of 4 red, two bodies in tools/e2e/tests/push-guard.spec.ts — "`--take-seat` installs the guard and announces it, and BOTH seat verbs report a checkout without the hook as UNGUARDED" and "`--take-seat` records NO seat when the guard cannot be installed, and leaves the configuration and the index alone" — each with `Expected: 0` (or `1`) `Received: 3`. The verb's own stderr in the log: a session that cannot name itself cannot create or retire a claim on its own behalf. `sessionIdentity` (tools/e2e/scripts/checkout-currency.mjs) walks the process table upward looking for a harness-shaped ancestor (the Claude or Codex program); the runner's tree is node under the test runner under the job, so the walk finds none, the verb answers COULD NOT RUN (exit 3), and the bodies' assertions on exit 0 or 1 fail. Locally every test process has the seat's own harness as an ancestor, which is why the lane, the bench and the seat's closing check were green at 122 bodies. The older seat bodies in tools/e2e/tests/card-preflight.spec.ts already know this: they run `--take-seat` through `underHarness` / `fakeHarness`, a node process named like the harness, so the walk finds an ancestor on any machine. The two new bodies use a plain `seatVerb` helper that spawns the verb directly. T-239-s4's class (the runner has no identity the local machine has), one body over.

## Acceptance criteria

- WHEN a push-guard body runs `--take-seat` or `--release-seat` THE verb SHALL be spawned under a harness-shaped ancestor the way card-preflight.spec.ts's seat bodies already do (the fake-harness helper shared rather than copied, T-057), so the body passes on the runner as well as under a local harness; the two named bodies SHALL be green on CI at the merge, read from the run rather than assumed from a local battery.
- WHEN the helper is shared THE bodies that already use it SHALL be unchanged in what they assert, pinned by their own existing controls; no body SHALL gain a skip or a runner-only branch.
- WHEN this card lands THE closing check's owed set for the range SHALL include the push-guard spec and the merge's CI run SHALL be read and named in the notes.

## Implementation notes

## Verdicts
