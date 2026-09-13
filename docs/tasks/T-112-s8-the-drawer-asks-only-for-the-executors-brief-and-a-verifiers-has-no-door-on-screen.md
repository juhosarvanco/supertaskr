---
id: T-112-s8
title: "The drawer asks only for the EXECUTOR's brief — `dispatch_brief` takes two role spellings and the board offers no way to reach the verifier's, so half the assembler is unreachable from the product"
feature: F-04
milestone: 4
size: S
priority: 7
status: parked
wake: T-205-s5
suggested_by: "executor claude-opus-5@subagent @T-112-s5, 2026-09-09"
blocked_by: []
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`readBrief(taskId, role)` takes `"executor" | "verifier"` — two spellings
serde refuses anything else for — and `T-112-s5` wired the drawer to ask
with a constant:

    const BRIEF_ROLE = "executor" as const;

That is the right default and is argued in the file: the block is titled
*"dispatch brief"* and what a human copies off the board is the brief
that puts a fresh session to WORK. **But it makes the verifier's half of
a built, tested, registered assembler unreachable from the product.**
`BriefWire.marker` exists solely to carry the line a VERIFIER's brief is
split at, and `select-task-detail.test.ts` already drives a body called
*"a verifier's brief carries the marker and nothing below it"* — so the
presentation side is built and nothing on screen can ask for it.

## Why it was not decided inside `T-112-s5`

Choosing between the two on screen is a PRODUCT decision — a toggle, a
second block, or a rule keyed on the card's own `status:` (a card in
`verifying` wants the other one) — and that card's ruling was about where
the fetch lives, not about what the drawer offers. Routed rather than
guessed.

## What it would take

Nothing outside `[app-board]` if the answer is a control in the drawer:
`useAssembledBrief` already takes the role as a constant one line from
its call site, and the second answer would key on the same card id. If
the answer is *"keyed on status"* it is smaller still and needs no
control at all. **The blocker is the ruling, not the fence.**

Parked 2026-09-13 (the pile-2 sitting, the owner's approval of 2026-09-13): kept separate with a wake — wake T-205-s5; the drawer cannot offer a verifier's brief until the assembler produces one, and whether the front serves one is a product decision this card keeps.
