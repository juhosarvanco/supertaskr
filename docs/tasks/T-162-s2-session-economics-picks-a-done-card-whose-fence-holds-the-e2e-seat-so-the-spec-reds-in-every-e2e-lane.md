---
id: T-162-s2
title: session-economics.spec.ts asks brief.mjs about T-157, a DONE card whose fence holds tools/e2e — so two bodies red in EVERY lane that holds the e2e seat, including the one STATE says lands first
feature: F-04
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-162
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-162's OWN GATE RUN, AND PROVEN NOT TO BE T-162's DIFF.**

`tools/e2e/tests/session-economics.spec.ts` spawns
`brief.mjs --task T-157` in two bodies and requires exit 0:

- line 73 — *"the recommended seat is a function of the CARD, and an
  environment full of model dials does not move it"*
- line 247 — *"the advisory line is NOT a contract row — it is printed
  outside the row set and derives none of it"*

`docs/tasks/T-157-session-economics-enters-the-seats.md` is
`status: done` with `touches: [docs/checkpoints/, tools/e2e]`.
`brief.mjs` tests the requested card's fence against the LIVE LANE LIST,
which is MACHINE-scoped (`git worktree list`), and refuses:

    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-162 tools/e2e against T-157 tools/e2e — the same entry (lane-protocol rule five).

Exit 1, so both bodies fail. The suite ran **318 passed / 2 failed** in
T-162's lane; every other body was green.

## The proof it is not the diff

Reproduced at the BASE commit with none of T-162's changes present: a
detached scratch worktree cut at `25850bd`, same command, same refusal,
same exit 1. The only thing the two runs share is that a lane named
T-162 holds `tools/e2e` on this machine.

## The class it belongs to

`method/lane-protocol.md` rule 4's MACHINE-versus-CHECKOUT scope class,
and docs/STATE.md's own standing note about *"a check that joined a
MACHINE-scoped list to a CHECKOUT-scoped one, which reddened in every
older lane the moment a newer lane was cut"*. What is new here is the
direction: the check is inside a SPEC, so it reds the LANE rather than a
report — and it reds specifically the seat T-157 itself sits on, so the
e2e seat is the one seat that cannot run its own suite clean. STATE
dispatches `T-162`, then `T-156-s1` and `T-160-s4` onto that seat back
to back, so this fires on all three.

## Three arms, not one, and the choice is a judgement

1. **PICK A FIXTURE CARD WITH A FENCE NO SEAT HOLDS.** Cheapest, and it
   moves the problem rather than removing it — the next card to reuse
   that fence reds the spec again.
2. **ASK THE BRIEF FOR A CARD, NOT FOR A CLEAN EXIT.** Both bodies are
   about the ADVISORY BLOCK, not about disjointness; they could assert on
   the advisory and tolerate a non-zero exit whose findings are all
   fence-collision. Risk: a matcher widened to pass is the loosening
   CONVENTIONS forbids, so the tolerance has to be NARROW — this finding
   class by name — and it needs its own poison drill.
3. **SYNTHESISE THE CARD**, the way `card-preflight.spec.ts` already
   builds a scratch repository and copies the governing docs in. Most
   work, no coupling to the live board at all, and it is the shape the
   neighbouring specs already use.

Arm 3 is the one that matches this repository's own precedent. Whoever
takes it should drill the chosen arm against a live lane holding the
fixture's fence, because that is the condition the current bodies fail
under and a green run in an empty-lane tree proves nothing.
