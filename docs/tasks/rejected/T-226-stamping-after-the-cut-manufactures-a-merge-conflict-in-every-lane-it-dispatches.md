---
id: T-226
title: STAMPING AFTER THE CUT MANUFACTURES A THREE-WAY CONFLICT IN EVERY LANE IT DISPATCHES — orchestrator 5b's ordering is load-bearing for a reason the rule never states, and the seat that inverted it recorded the inversion as harmless
status: parked
suggested_by: "the architect/integrator seat, 2026-09-01 — inverted the ordering, recorded it as costing nothing, and was corrected by the first lane to report; measured at 3a842e2 across all three lanes of that dispatch"
---

**THE RULE IS OBEYED FOR ITS STATED REASON AND BROKEN FOR ITS REAL ONE.**

`roles/orchestrator.md` 5b requires the `status: building` stamp to be
written and committed on the integration branch **BEFORE the lane is
cut**. On 2026-09-01 this seat cut three worktrees first and stamped
after, then recorded the inversion in the dispatch commit `a014b81` with
the reasoning that nothing was mis-decided — `lane-protocol` rule 7 gives
the LANE LIST precedence over the board, so `T-209`'s guard correctly saw
three live lanes while all three cards still read `planned`.

**That reasoning was right about the GUARD and wrong about the COST.**
The same commit closed with *"a dispatcher who only notices the
inversions that cost something will keep making the ones that do not"* —
asserting this was one of the harmless ones. It was not. Measured at
`3a842e2`, all three lanes:

    card      base 9d56b47    main
    T-203     planned         building
    T-211     planned         building
    T-221     planned         building

Base and main disagree on the status line of every dispatched card, and
each lane edits that same line on its way to `verifying`. **That is a
three-way conflict by construction, in every lane, every time.** The
first lane to finish reported it before this seat noticed:
`git merge-tree` exits 1 on exactly one file — the lane's own card — and
the whole conflict is one line.

Had the stamp preceded the cut, each lane's base would already read
`building`, main would be unchanged from base, and only the lane would
have touched the line. **No conflict at all.**

## Why this is worth a card rather than a habit

The lane called it *"structural for every lane based on the last
checkpoint, not a defect"* — and under the inverted order that is exactly
right, which is the problem. **A cost that is structural is invisible as
a cost.** Every lane hits it, every integrator resolves it in one line,
nobody attributes it to an ordering nobody re-reads, and the rule that
prevents it goes on being obeyed for the reason it happens to state.

Three lanes' worth of merge friction is small. **The reason to file it is
that the rule's stated justification and its actual mechanism are
different**, and a rule whose stated reason is not its load-bearing one
survives exactly until someone reasons about the stated reason — which is
what happened here, in writing, by the seat that had just read it.

## What triage should weigh

- Whether `orchestrator.md` 5b should STATE the mechanism (the stamp is
  the lane's base, so stamping after guarantees a divergent three-way
  merge), rather than only the ordering.
- Whether a dispatch tool should refuse to cut a worktree whose card is
  not already stamped — the same shape as `T-209` refusing a dispatch
  against an unread fence, and mechanisable the same way.
- Whether this belongs to `T-211`, which is writing the fast-path law and
  is live on `method/` right now. **It was deliberately NOT routed into
  that lane mid-flight**: widening a live lane to absorb a finding the
  dispatcher produced is the fast path being used to launder the
  dispatcher's own defect, and the fast path is the very thing `T-211` is
  trying to write down safely.

## Read beside

`T-217` (a lane cannot see another lane — the same family of ordering and
visibility defects, and this card's sibling in that it was found by the
seat that caused it), `T-209` (refusal as mechanism, and the model for
the second bullet above), and `method/roles/orchestrator.md` step 5b,
cited by ordinal.

## PARKED, 2026-09-02

The ordering half is law now — orchestrator 5b, CONVENTIONS' serial-ritual
bullet, STATE — and measured holding on two consecutive cards. The
refusal half (`brief.mjs --write-fence` refusing a lane whose card is not
stamped `building` on the integration branch) is one check in the
fence-write arm. RESURFACES when a card next opens that arm — T-222 does,
publishing the slug map through it — and is offered to that lane as a
rider; IF T-222 lands without it THEN promote this card at that
checkpoint.
