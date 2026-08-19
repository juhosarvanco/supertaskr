---
id: T-078-s12
title: The fix corrected every instance it was pointed at and swept none of the classes — two measured cases, both inside the subsection that announces the sweep
status: suggested
suggested_by: verifier claude-opus-5 @T-078-reverify
---

T-078's fix session found three defects of its own and fixed each where
it stood. In two cases an identical sibling sat within a few lines and
was left. Both are measured below; neither changes a conclusion.

**ONE — the gate-range figures went stale inside the commit that filed
them, by exactly three, exactly as the nine-versus-twelve did.**

The notes correct one figure in this subsection and say so:

> **And the nine-versus-twelve is this card's own defect, caught in these
> notes.** [...] Caught by recomputing at the final commit instead of
> trusting the earlier run. **Every figure in this subsection now names
> its ref.**

The paragraph immediately below it carries `44`, and `T-078-s9`'s table
carries `44 / 9 / 9`. Measured, `git diff --name-only 79ae34a <ref> | wc -l`:

    041e8ec  44      3a5e8ef  47
    1f0f7ae  44      0770049  47      5b5e1c7  47

**`3a5e8ef` is the commit that FILED s7, s8 and s9** — the same three
files, the same drift by three, and s9 was stale at the instant it
landed. All three of its rows: the branch is 12 `.md` files, not 9, and
the true merge-tree diff is 12, not 9. The 44 in the card is stale for
the same reason. This is the THIRD instance of one shape on one branch,
after the `POISON DRILL` count (four became five inside the commit that
filed the correction) and the nine-versus-twelve. The first two were
caught; this one was not, in the subsection that announces the sweep.

**The deeper cause is that a RANGE has two endpoints and only one was
pinned.** The notes pin main (`it is at 79ae34a`) and leave `HEAD`
implicit — and `HEAD` is the endpoint the author moves under their own
hand three commits later. Re-derived here: `git diff main HEAD` is
**50** paths today, main having advanced to `16bb47b`, and both gates
still fire. The conclusion is untouched at every ref; only the integers
move, which is precisely T-078-s7's thesis turned on T-078-s7's own
session.

**TWO — the branch introduced two line-break splits of `POISON DRILL`
and unwrapped one.**

The fix correctly unwrapped the parenthetical that TEACHES the search, so
`git grep "POISON DRILL"` now finds it: this file went from 1 hit to 3.
But `e4a5ae7` has **zero** lines ending in `POISON`, and `c4208c6` — this
branch's own build commit — introduced **two**:

    174-175  `git grep -c "POISON / DRILL"` ...   <- unwrapped by the fix
    563-564  ... safe to POISON / DRILL at all    <- still split at HEAD

An editor sweeping for every place the drill is discussed still misses
the guard-lift bullet, by the same mechanism, in text the same branch
wrote. `git log -S'safe to POISON'` returns `c4208c6`.

**The ask.** Not the two edits — they are trivial and either can be made
or left. The rule: **when a defect is found in a document, the fix names
the CLASS and the sweep that was run for it, or records that none was.**
Both cases here are one `git grep` from complete: `grep -c` at the final
ref for the tallies, `grep -n 'POISON$'` for the splits. The card's own
"CLAIMS THAT DID NOT REPRODUCE" section is already the right home — it
would gain one line per finding saying what else was checked. This is
T-078-s1's shape ("lessons that live only in a card's notes") applied to
fixes rather than to lessons.
