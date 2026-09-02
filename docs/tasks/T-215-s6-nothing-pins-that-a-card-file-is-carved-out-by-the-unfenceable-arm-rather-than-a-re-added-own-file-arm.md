---
id: T-215-s6
title: "Nothing pins WHICH arm answers a card file — `carveOutFor` returns a carve-out either way, so a re-added own-file arm is invisible to every existing body and to the one `T-219-s5` asked this lane for"
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "executor claude-opus-5@subagent @T-215-s1"
builder:
verifier:
review: independent
---

**THIS IS `T-219-s5`'s FOURTH CRITERION, ROUTED RATHER THAN BUILT, AND
THE REASON IS A BASE AND NOT A FENCE.** `T-215-s1`'s lane was cut at
`838e74b`, which PREDATES `T-219-s3`'s merge at `f6e3924`. In that
worktree `.claude/hooks/lane-fence.mjs` still carries `carveOutFor`'s
own-card first arm, so a body asserting the post-removal answer reds at
that lane's tip. `tools/e2e/tests/lane-fence.spec.ts` is inside the
fence; the BASE is not something a lane may move (`method/lane-protocol.md`
rule 2), and handing off a red lane to buy a green body is the trade
this project does not make.

## What the body has to discriminate on, and why presence proves nothing

`carveOutFor` called for a card file with a manifest that carries
`excluded` returns a
carve-out BOTH WAYS — the verifier of `T-219-s3` measured that the
answer moves from the removed own-file arm to `alwaysWritable` rather
than becoming `undefined`. So a body asserting *"a carve-out is
returned"* is satisfied by a re-added arm and measures nothing. The
discriminator is the RETURNED VALUE:

- through the unfenceable arm: `domain` is `docs/tasks` and `why` is
  *"no card may fence it and every card's protocol writes there"*;
- through a re-added own-file arm: `domain` is the card's own path and
  `why` names it *"…'s own card file, which is outside every fence
  including its own"*.

The existing body *the carve-outs each free a DIFFERENT write, and the
fence still holds around them* pins `decide`'s answer (`not-a-lane`) and
cannot see this: the seat branch consults `carveOutFor` only for a path
some live lane's manifest RESERVES, and a card file is never reserved.
That body is the permanent pin on the VERDICT; this card is the pin on
the ARM.

## Acceptance criteria

- A body in `tools/e2e/tests/lane-fence.spec.ts` SHALL call
  `carveOutFor` DIRECTLY for a card file against a manifest whose
  `excluded` carries that file, and SHALL assert the returned `domain`
  and `why` are the UNFENCEABLE arm's, naming both on a red.
- The body SHALL NOT be satisfied by a carve-out merely being returned,
  and its comment SHALL say why (the paragraph above).
- A positive control SHALL be DEMONSTRATED RED against a re-added
  own-file arm — a planted copy of the hook is enough, and is what
  `T-215-s1` used for its own header control, so no fixture machinery is
  owed that the file does not already have.
- Verification: headless.
