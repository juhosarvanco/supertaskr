---
id: T-295-s13
title: "A partial shortfall the seat has READ AND ACCEPTED has no way through the drill step, because --blocks-absent is confined to a verdict that carries no block at all — the friendlier shape is an acknowledgement that LEADS the plan and lets the drills follow it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-295-s10, phase 2, while assigning that card's correction 1"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Since T-295-s10 the drill step reads its shortfall per correction, so the
shortfall can be PARTIAL: a verdict carrying two committed bodies and one
correction that has neither a block nor the statement. That card's
verdict assigned a correction confining `--blocks-absent` to the shape it
was written for — a verdict that carries no block AT ALL — because the
branch as built returned one acknowledged step and left every present
block undrilled, against the step's own docblock and the verb's usage
text.

Confining it closes the hole and costs something real. A seat that has
READ the verdict, seen which correction is missing its body and accepted
it now has no way through the step at all: the flag refuses, and the only
remedy is editing the verdict. Before the per-correction reading that
state could not arise, so nothing is lost against the base — but the
friendlier shape exists and the docblock already describes it. The
acknowledgement LEADS the plan and the drills for the blocks that ARE
present follow it, which keeps the flag's own sentence true word for word
and keeps every committed body drilled.

The reason T-295-s10's verdict did not assign that shape is mechanical
rather than principled: a correction is ONE contiguous old/new pair, and
leading the plan means hoisting the block-drill mapping above the
shortfall branch, which is two sites. It is a card, not a correction.

## Acceptance criteria

- WHEN the newest verdict carries a PARTIAL shortfall and the run names
  that verdict's own sha through `--blocks-absent` THE plan SHALL carry
  the acknowledgement as its first drill step AND a drill step for every
  block the verdict carries, so the flag never stands in for a body;
  pinned by a body over a verdict with two blocks and one unexplained
  correction, with the control where the flag is absent refusing.
- WHEN the acknowledgement leads a plan that still drills THE
  acknowledgement's own line SHALL name which corrections were
  acknowledged and say that the blocks below are drilled anyway, and the
  docblock and `usageText` sentences about the flag SHALL say what the
  step does in every state.

## Implementation notes

## Verdicts
