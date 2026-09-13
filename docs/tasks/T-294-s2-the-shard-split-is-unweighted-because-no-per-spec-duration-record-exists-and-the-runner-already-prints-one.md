---
id: T-294-s2
title: "The shard split is UNWEIGHTED because this project keeps no per-spec duration, so one shard finishes in a minute while another holds the run — and the runner already prints the figure that would fix it"
feature: F-04
milestone: 4
size: S
priority: 3
status: parked
wake: T-263
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
