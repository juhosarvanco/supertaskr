---
id: T-322-s2
title: "A provider refusal is classified as a side effect of the stop verb, because the operation set is closed by a document outside this card's fence: the verb whose name says nothing about refusals is the one that decides whether a retry is scheduled"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-322, ruled during the lane: method/lane-protocol.md says the operations are the same seven for every kind of child, and a run-record body pins that set exactly, so a refusal verb could not be added from inside this fence"
blocked_by: [T-322]
touches: [method/lane-protocol.md, tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/run-record.spec.ts, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322 records a refused spawn and its next retry instant on the run
record. The record is the right place — a successor coordinator that
never met the refusal reads the instant off disk — and the RECONCILIATION
a refusal owes is exactly what the stop verb already performs, so riding
`stop` is a defensible reading rather than a shortcut.

What is uncomfortable is that `stop` now classifies the evidence of every
stop it is given, and only the classification decides whether a retry
exists. A verb named for an established termination carries a branch that
schedules future work, and a reader of the operation list cannot see it.
The classification is reported at every call, so a false positive is
visible rather than silent, and an ordinary stop is a pinned control —
but the shape is still an extra job inside one verb's name.

The reason it was not an operation of its own is a document outside this card's
fence: `method/lane-protocol.md` says the operations are the same seven
for every kind of child, and a body pins that set exactly. So the choice
is not the lane's to make. Either the rule admits a refusal verb, or it
rules that a refusal is a stop and the conventions say so where a reader
of the verb list will find it.

## Acceptance criteria

- WHEN the operation set is re-ruled THE method SHALL say whether a provider refusal is a stop or an operation of its own, and the run record's verb list SHALL match that ruling rather than carrying a branch the list does not announce.
- WHEN a refusal rides a verb THE verb's own contract SHALL name the branch, so a reader of the operations learns that a stop may schedule a retry without reading its body.
- WHEN a refusal is classified THE classification SHALL be drivable without a stop, because a coordinator that wants to know what a refusal is has no termination to record yet.
- WHEN this lands THE conventions SHALL carry the spelling once, beside the run record's own bullet.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
