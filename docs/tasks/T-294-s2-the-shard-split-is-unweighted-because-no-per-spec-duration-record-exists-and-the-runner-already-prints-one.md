---
id: T-294-s2
title: "The shard split is UNWEIGHTED because this project keeps no per-spec duration, so one shard finishes in a minute while another holds the run — and the runner already prints the figure that would fix it"
feature: F-04
milestone: 4
size: S
priority: 3
status: parked
wake: T-332
suggested_by: "executor claude-opus-5@subagent @T-294, 2026-09-10"
blocked_by: [T-294]
touches: [tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`shardSpecs` distributes the owed spec files round robin over the sorted
list, which gives every shard the same COUNT of spec files and says
nothing about their COST. The end-to-end lane's spec files are wildly
unequal: the ritual and brief bodies build scratch git repositories and
run for minutes, while several files are a handful of pure assertions
over a parsed string.

A run is as long as its slowest shard, so an unweighted split buys less
than the shard count suggests: four shards over one heavy file and
thirty-eight light ones is one long shard and three idle runners.

T-294 chose the flat split deliberately and said so in the code — a
weighting with no measurement behind it is a guess wearing arithmetic,
and the sort at least makes the split a pure function of the set, so a
re-run of one shard means the same thing every time.

## What changed since that choice

The figure exists the moment the sharded workflow runs. `gh run view
<id> --json jobs` reports each job's `startedAt` and `completedAt`, and
each shard job carries the spec list it was given in its own display
name — so one green run yields a duration per SHARD, and a run at shard
count equal to the spec count would yield a duration per SPEC.

## What a fix would look like

Record per-spec durations where the project already keeps measured
figures, hand them to `shardSpecs` as a weight map, and split by longest
processing time first — greedy LPT, which degenerates to today's round
robin when every weight is equal, so the current behaviour stays the
behaviour for an absent record. A spec with no recorded duration takes
the median rather than zero, so a NEW spec is never sorted to the end of
the lightest shard by virtue of being unmeasured.

## Acceptance criteria

- WHEN a weight is recorded for every owed spec THE split SHALL balance
  the shards by weight, and the heaviest shard's weight SHALL be within
  a stated fraction of the mean.
- WHEN no weight is recorded THE split SHALL be byte-identical to the
  flat one it replaces, so an absent record costs nothing.
- WHEN a spec has no recorded weight THE split SHALL give it the median
  of the recorded ones and never zero.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-263; the shard split is unweighted because no per-spec duration is kept, which is the band T-263 fixes.

## Triage note, 2026-09-15

Rescheduled on the owner's ruling of 2026-09-15, after the Codex orchestrator's faster-delivery review: this card is re-triaged IMMEDIATELY AFTER T-332, and its wake moves from T-263 to T-332 to say so.

The reason for the ordering rather than for waiting on T-263: T-332 changes what the expensive docs-gate bodies cost, so per-spec durations gathered before it would describe tests that no longer exist in that shape. Weights collected now would be stale by the time they were used.

THE T-263 DEPENDENCY IS RECONSIDERED AT THAT RE-TRIAGE AND NOT ASSUMED. The owner's instruction is that this card is not to be left waiting on T-263 unless there is a real dependency. The band recalibration T-263 performs is not obviously a technical prerequisite for weighting a shard split by measured duration, and actual per-spec readings can be gathered from existing run logs. Whoever re-triages this card decides that on the evidence rather than inheriting the wake.

One design caution recorded with it: a shard can never be faster than its longest indivisible spec, so any promised bound stated as a fraction of the mean has to account for that floor rather than promise what no schedule can deliver. Missing or stale weights must schedule a spec conservatively, never omit it.
