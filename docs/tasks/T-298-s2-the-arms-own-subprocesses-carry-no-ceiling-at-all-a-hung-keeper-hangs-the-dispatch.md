---
id: T-298-s2
title: "The arm's own subprocesses carry NO ceiling at all — a keeper that hangs at the base hangs the whole dispatch, and the bounded wait T-298 built is reachable only from a shell, never from the ritual that spends the longest on a child process"
feature: F-04
milestone: 4
size: S
priority: 2
status: parked
wake: T-292
suggested_by: "executor claude-opus-5@subagent @T-298, measured at d8e4a9dd07a1f9b8beaad0e808a0e6742f5a0177, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-298's third criterion is about the waits a SEAT performs between the
dispatch and the merge, and the arm it built answers exactly those: a
marker file or a pid, with a ceiling, reported rather than hung on.

There is a second kind of waiting in the same file and it was left
alone, deliberately and out of scope, because closing it needs an
acceptance criterion of its own. The dispatch ritual's own steps wait on
CHILD PROCESSES, and every one of those waits is unbounded. In
`defaultDispatchIo`, the runner spawns synchronously with `cwd`,
`encoding`, `shell` and `maxBuffer` set and no `timeout` among them —
so the option that would bound the wait is the one option not passed.

The step that pays for it is the keeper run at the base, step one of the
eleven: the arm runs the fence's own keeper spec over the fenced paths
before it will cut a lane, and that is a whole graded suite leg. A leg
that hangs — a browser that never launches, a port already held, a
watcher that never settles — hangs the dispatch with it, with no
ceiling, no report and no exit. The seat sees a command that has not
come back and cannot tell it from one still working.

The same shape reaches every other step, since they all go through the
one runner: the stamp commit, the worktree cuts, the preflight, the
fence, the manifest read and the bench.

It is filed rather than performed for the reason the executor's routing
rule gives: the remedy adds a property no existing body measures — that
a child which never returns is reported rather than waited on for ever —
and a criterion is what carries it.

## Acceptance criteria

- WHEN the arm runs any step's child process THE wait SHALL carry a
  stated ceiling, and a child that exceeds it SHALL be reported as a
  refusal naming the step, the command and the ceiling — never waited on
  without bound.
- WHEN the keeper leg at the base exceeds its ceiling THE dispatch SHALL
  stop at step one with the ledger printed and nothing cut, exactly as
  every other step-one refusal does.
- WHEN a body drives a child that does not return THE ceiling SHALL be
  reached in the body's own injected time rather than in real seconds,
  so the suite cannot itself hang.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; the arm's own subprocesses carry no ceiling, so a keeper that hangs at the base hangs the dispatch.
