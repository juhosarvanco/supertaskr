---
id: T-224-s6
title: "`touchesAmendments`' `absent` short-circuit sits BELOW the ambiguity arm on purpose, and no body among the 51 says so — moving it back allows two cards filed under one brand-new id"
feature: F-06
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2, third verification), at T-224's bench 63b9c3d, 2026-09-09 — mutant ABSENT_SHORT_CIRCUIT_RESTORED SURVIVED all 51 bodies while flipping a real verdict from block to allow
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**NOT A DEFECT — A PROPERTY THE CODE ARGUES FOR IN A COMMENT AND NOTHING
MEASURES.** The third pass moved the two `absent` short-circuits BELOW
the ambiguity arm and says why, in the loop's own comment:

> a range that FILES two cards under one brand-new id is the same
> ambiguity, and skipping it on `absent` would hand it back.

That is true, and it is unpinned. Measured at `63b9c3d` in a detached
scratch worktree, one-side change, landing read from `git diff -U0`:

    ABSENT_SHORT_CIRCUIT_RESTORED
      + if ("absent" in before) continue;      (above the ambiguity arm)
      exit 0 — 51 passed — NO BODY RED

and the same mutant, driven over a fixture that files two cards under one
brand-new id (`cost3-V-T-224.mjs`, X2):

    pristine 63b9c3d : block/landing-gate-card-id-duplicated
    mutated          : allow/landing-gate-inside-the-fence

So a real verdict flips and the suite does not notice. The consequence is
a DENIAL rather than a widening — two files carrying one brand-new id
leave `cardAt` unable to say which file is the card, so the lane
dispatched for that id is refused whole — which is why this is a
suggestion and not a finding.

## What to build

- A body whose range FILES TWO CARDS UNDER ONE BRAND-NEW ID — absent at
  the base, absent on the fence of record, two files at the tip — and
  asserts the push is REFUSED at both landing moments, naming both files
  and marking both as arriving.
- Its ALLOW half in the same fixture, because a guard that refused every
  range filing a new card would be indistinguishable from one that works
  and would break the commonest write on this board: the same range
  filing ONE new card with a wide fence stays ALLOWED (limit 5's residue
  (a), which `T-224-s2` already routes).

## Read beside

`T-224` (the arm, its ambiguity rule and the comment this card pins),
`T-224`'s verdict of 2026-09-09 (the drill this survivor came from),
`T-224-s5` (the other unpinned property of the same function).
