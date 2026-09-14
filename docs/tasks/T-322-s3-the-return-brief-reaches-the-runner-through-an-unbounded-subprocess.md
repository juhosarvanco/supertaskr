---
id: T-322-s3
title: "The return brief reaches the runner through an unbounded subprocess, so a hung command hangs the arm the owner is reading: the bounded-wait rule this project already keeps for its own waits does not reach the children its arms spawn"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-322, measured while building the runner io: both calls are spawnSync with a maxBuffer and no timeout, which is T-298-s2's class one command over"
blocked_by: [T-322]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The return brief asks the runner two questions and both go out as
synchronous subprocesses with a buffer ceiling and no time ceiling. A
provider that accepts the connection and never answers leaves the arm
sitting there, and the arm the owner runs when they come back is the one
that hangs.

This project already has the rule and the argument: every wait is on a
fact with a CEILING, a hand-typed sleep is not a wait, and reaching the
ceiling is an ANSWER rather than a hang. T-298-s2 records the same gap
one command over — the arm's own subprocesses carry no ceiling at all —
so this is that finding's class arriving at a new caller rather than a
new discovery.

The failure is worse here than at a lane's own command because the
condition that produces it is the condition the brief exists for: the
owner is away, something is wrong with the network or the provider, and
the report that would say so is the thing that stopped.

## Acceptance criteria

- WHEN an arm spawns a child to reach a machine that is not this one THE spawn SHALL carry a time ceiling, and reaching it SHALL be an ANSWER the caller reports rather than a hang.
- WHEN the runner cannot be reached in time THE brief SHALL report the runner's history as unreachable, which is a state it already carries, rather than failing or waiting.
- WHEN a ceiling is reached THE report SHALL name what it was waiting for and how long, on the wait verb's own model, so a reader can tell a slow runner from a dead one.
- WHEN this lands THE bounded-wait bullet SHALL say that it governs an arm's own children and not only the waits a seat asks for by name.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
