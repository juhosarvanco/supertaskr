---
id: T-299-s3
title: "Most of the process schema's switches are read by the ledger alone — the arm renders and refuses on them and no arm branches on them yet, and which surface owes each one a branch is written nowhere"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-299, measured at 689a66c3cf99c1963d170d9e47734746cdcf708a, 2026-09-10"
blocked_by: [T-300, T-301, T-302]
touches: [method/runtime/process-schema.yaml, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-299 declared 42 switches and wired six behaviours. The other 35 carry
`reads: processLedger`, which is honest — the arm does read each of
them through the one accessor, renders their counts, and refuses when
the resolution drops one — but it is not the same as a switch that
CHANGES something.

For several of them the surface that owes the branch is not the arm at
all. The CI switches belong to the workflow, the push switches to the
push guard, and several verify switches to a verifier brief the arm does
not render yet. The schema has no field that says so, so a reader cannot
tell a switch waiting on another card from a switch nobody has wired.

## What a fix looks like

A field per switch naming the SURFACE that owes it a branch, with the
card id where one exists, and a body requiring every switch whose
`reads` is the ledger to name one. That turns 35 unwired switches from
a silence into a queue, and the queue is checkable.

Whether the field belongs here or on the room's own table is the first
question a session on this card should settle.

## Acceptance criteria

- WHEN a switch is read by the ledger alone THE schema SHALL name the
  surface that owes it a branch, and a body SHALL red on one that does
  not.
- WHEN a switch names a card THE card SHALL be a live card on the board.
