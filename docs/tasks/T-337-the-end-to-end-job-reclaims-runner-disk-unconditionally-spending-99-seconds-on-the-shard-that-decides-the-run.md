---
id: T-337
title: "The end-to-end job reclaims runner disk unconditionally, spending 99 seconds on the shard that decides the run to free 27 GiB when 85 GiB was already free against a 2 GiB floor: reclaim only when a measured margin is missing, stop when it is met, and keep every protected-path refusal and the final floor check exactly as they are"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's faster-delivery review of the same day; the seat verified the step's span and its own freed figure against the shard's log before filing"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 on the owner's ruling of the same day, from the Codex orchestrator's faster-delivery review. The architect seat verified the measurement against the shard's own log before the card was written rather than relaying it: the step's span, its reported freed figure, the job's opening disk reading and the shard's total elapsed time were all read from the run's logs.

The owner's ruling names a constraint this card carries into its criteria: the disk safeguards and the final floor check stay. This card narrows WHEN the removal runs and nothing else.

ITS FENCE IS THE SAME FENCE T-336 HOLDS — the workflow file and the workflow-parity spec — so the two cannot run beside each other and must be sequenced. T-336 is the reliability repair and goes before this one. The fence is disjoint from T-330, T-335 and T-332, any of which may run beside it.

Preflight at promotion; no board preflight has been run against this card, which this project can only do once a card is a dispatch candidate.

## The finding

The end-to-end job frees runner disk before its floor check by removing toolchains the job never invokes. It does this every time, without ever asking whether the space is needed.

Measured on the successful push run of 2026-09-15 over `212614c0`, from the shard logs rather than from the step's description. On the shard that determined the run's completion the step ran from 12:36:39.186Z to 12:38:18.437Z — **99.25 seconds** — and its own output reports `freed 28381228` KiB, about 27.1 GiB. The same job had reported `free on /: 90171108 KiB` at its start, about 86 GiB, and roughly 85 GiB remained immediately before the step ran. The floor it protects is 2 GiB.

The cost is on the critical path rather than beside it. That shard took 366 seconds in total and the other three finished earlier, so the run's completion is its completion, and the reclamation is about 27 per cent of it. The step took 99, 43, 99 and 93 seconds across the four shards, so the waste is paid on every shard of every run that reaches this job.

This is a setup cost and not a coverage cost. Nothing about which tests run, or how they are judged, is at stake.

The reclamation itself is not in question and neither is the floor. The job reads the runner's disk around its work because T-278-s2 made it do so, and that reading is what made this measurable at all; the floor's own value is T-278-s1's open question and is not reopened here. What this card changes is only whether the removal runs when nothing needs removing.

## What would settle it

The step measures before it removes. Where the free space already exceeds the required margin the removal is skipped and the step says so, naming the figure it read and the margin it compared against. Where the margin is missing the removal proceeds as it does today, and stops once the margin is met rather than continuing through the whole list.

Everything protective stays exactly as it is. The protected-path refusals stay, so a path the step must never remove is still refused by name. The final floor check on the relevant filesystems stays and is still run unconditionally, because a check that reports the state is not the same thing as a removal that changes it, and the reading is what made this finding possible. A skipped removal is reported as a skip with its measured reason, never as a silent absence.

The required margin is a declared figure rather than one inferred inside the step, and it is coordinated with the floor T-278-s1 examines rather than invented separately.

A body pins the behaviour over controlled inputs rather than over a live runner: ample space skips the removal, insufficient space performs it, and the protected paths are refused in both arrangements. The card reports the step's elapsed time before and after on one runner shard, and claims no saving that has not been measured there.

## Acceptance criteria

- WHEN the end-to-end job prepares its disk THE step SHALL read the available space and compare it against a declared required margin, and SHALL perform no removal where the available space already meets that margin.
- WHEN the available space is below the required margin THE step SHALL remove only until the margin is met, and SHALL refuse every protected path by name exactly as it does today.
- WHEN a removal is skipped THE step SHALL report the skip with the space it read and the margin it compared against, so that a skip is distinguishable from a step that did not run.
- WHEN the job completes its preparation THE final floor check SHALL still run unconditionally on the relevant filesystems and SHALL report its reading, whether or not any removal took place.
- WHEN this card lands THE card SHALL record the step's measured elapsed time before and after on one runner shard, and SHALL claim no saving beyond what that measurement shows.

## Implementation notes

## Verdicts
