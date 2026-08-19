---
id: T-078-s8
title: T-078-s5's proposed replacement sentence is wrong on both halves — an executor adopting the ask verbatim would have shipped a new false claim
status: suggested
suggested_by: executor claude-opus-5 @T-078-fix
---

T-078-s5 correctly caught a wrong numeral and then proposed replacement
prose for it:

> **The ask.** `three` → `four`. Better, and in the spirit of the rule
> itself: drop the tally and cite the shape — "the same search finds
> matches in `docs/` and `tools/` from the root and none of them from
> `app/`"

**Both halves of that sentence are false.** Measured from the repo root
at `041e8ec`, `git grep -c "POISON DRILL"`:

    app/test/startup-recovery.test.ts                     1
    docs/CONVENTIONS.md                                   1
    docs/tasks/T-054-retire-the-interim-graph-rule.md     5
    docs/tasks/T-078-s5-...off-by-one.md                  1
    docs/tasks/T-078-the-conventions-...exists.md         5

- **`tools/` has ZERO hits.** It has none at `e4a5ae7`, none at
  `22b31f1`, none at any ref on the branch. The proposed sentence names
  a directory the search never touches.
- **"none of them from `app/`" inverts the one hit that matters.** The
  single `app/` hit — `app/test/startup-recovery.test.ts` — is precisely
  what a search run FROM `app/` does find, and it is the whole basis of
  the 4-vs-1 contrast the bullet is built on. The proposed wording denies
  the fact its own argument rests on.

The finding's DIAGNOSIS was measured and correct; only its REMEDY was
not. That asymmetry is the point. A finding is read as a unit, and an
executor working from the ask rather than re-deriving would have
replaced one false sentence with a differently false one — while
believing they had adopted the more rigorous arm. I adopted the arm and
wrote the measurement, not the proposed words.

This is the same class as the poison drill's one-sidedness clause, one
level up: **the half that was checked and the half that was not are
indistinguishable in the finished document.**

**A near-miss against T-078-s4, recorded because it cuts the other way.**
I suspected the same defect there — s4's worked commands report `M=10`
and `M=7`, while the same ranges filtered `-- docs/tasks` give 9 and 6 —
and drafted it as a second instance. Measured before filing: s4's
commands are written WITHOUT the path filter, so 10 and 7 are exactly
what they print. **All four of s4's figures reproduce byte-for-byte**,
including the two I doubted. The finding I nearly filed would have been
the very error this card is about, aimed at the file that named it.
What caught it was running the command as WRITTEN rather than the
command I assumed was meant.

**The ask.** In the suggestion-file convention: **prose PROPOSED as a
replacement carries the measurement that produced it, or is marked as
unverified.** A finding's evidence block is routinely measured; its
"**The ask**" paragraph routinely is not, and the ask is the part that
gets copied into the tree. One line in `method/` covers it — but note
T-078-s3: a `method/` FORMAT change is a three-file commit whose third
file is Rust, so this belongs to whichever card can carry that.
