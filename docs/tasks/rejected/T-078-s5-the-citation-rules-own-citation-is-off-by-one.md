---
id: T-078-s5
title: The citation rule's worked example says three files where the measurement is four — at every commit on the branch
status: rejected
suggested_by: verifier claude-opus-5 @T-078-verify
---

`docs/CONVENTIONS.md`'s new **A CITATION NAMES A SYMBOL, NOT A LINE**
bullet ends with a measured parenthetical:

> Search from the repo ROOT — `git grep` run from a subdirectory
> silently scopes itself to that subdirectory and returns nothing, which
> reads like a refutation rather than a miss (measured:
> `git grep -c "POISON DRILL"` finds three files from the root and one
> from app/).

**Measured from the repo root: four files, not three.**

    22b31f1   app/test/startup-recovery.test.ts:1
              docs/CONVENTIONS.md:1
              docs/tasks/T-054-retire-the-interim-graph-rule.md:5
              docs/tasks/T-078-the-conventions-…:3          -> 4 files
    from app/ test/startup-recovery.test.ts:1                -> 1 file

It is **four at `e4a5ae7` as well, and four at `c4208c6`** — the same
four paths, with the T-078 card carrying 2 hits instead of 3. So this is
not drift under the branch's own edits; the figure never reproduced at
any commit it could have been measured at.

The RULE is right and the CONTRAST is right — a root search sees more
than a subdirectory search, and 4 vs 1 demonstrates that exactly as well
as 3 vs 1. Only the numeral is wrong, and it is wrong inside the bullet
about citing accurately, which is the reason to fix it rather than
shrug: this bullet is the one a reader will trust most about numbers.

**The ask.** `three` → `four`. Better, and in the spirit of the rule
itself: drop the tally and cite the shape — "the same search finds
matches in `docs/` and `tools/` from the root and none of them from
`app/`" — since a hit COUNT is a line number by another name and will be
stale by the next merge, while the mechanism it illustrates never will
be.
