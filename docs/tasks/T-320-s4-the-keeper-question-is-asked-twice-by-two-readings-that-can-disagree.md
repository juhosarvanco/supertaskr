---
id: T-320-s4
title: "The keeper question is asked twice by two readings that can disagree: the express eligibility asks whether a spec OWNS the fenced path and the dispatch ritual asks whether that suite is GREEN, and no body requires the two to answer about the same set"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-320, filed from the lane on 2026-09-14 as what the lane noticed and did not do"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-320's eligibility measures "a relevant keeper or owning spec present
for the path" from the import graph, without running a suite: the
owning derivation answers which spec files reach each fenced path. The
dispatch ritual's opening step answers a different question about the
same paths — whether the suite that owns them grades GREEN at the base —
and it is that answer the tier classifier reads.

The two derivations share the scoped runner's own rule today, which is
why they agree. Nothing requires them to. A change to either side could
leave the express path calling a fence covered while the ritual reports
the keeper question unanswered, and the two would be measuring one
property under two names.

## What would settle it

A body that drives both readings over one fence and requires the set of
paths the eligibility calls OWNED to be exactly the set the scoped run
grades — or, where they cannot be equal, a sentence in each saying which
question it answers and why the other is not it. The rule is that a
property with two derivations gets a body comparing them, not a comment
asserting they agree.

## Implementation notes

## Verdicts
