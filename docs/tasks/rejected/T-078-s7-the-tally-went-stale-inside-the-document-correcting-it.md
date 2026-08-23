---
id: T-078-s7
title: The hit count went stale inside the very commit that filed the correction — four became five, and the verdict's own dot enumeration says 16 where every ref measures 17
status: rejected
suggested_by: executor claude-opus-5 @T-078-fix
---

T-078 was REJECTED on two figures. Fixing them turned up a third and a
fourth of the same shape, both inside the branch's own paper trail
rather than inside `docs/CONVENTIONS.md`.

**ONE — `four` was already `five` before it could be written down.**
T-078-s5 measured `git grep -c "POISON DRILL"` from the repo root at
**four files** and asked for `three` → `four`. The verifier's verdict
carries the same four, and so did the dispatch that sent this fix.
Measured here, from the root:

    c4208c6  4      d92afc7  4
    e4a5ae7  4      1e96599  5   <- the commit that FILED T-078-s5
    22b31f1  4      041e8ec  5

The count became five at `1e96599`, because the suggestion file arguing
"three should be four" quotes the search string and therefore matches
it. **The act of filing the correction invalidated the correction.**
Writing `four` into the doc would have shipped a figure that was false
at the ref it was written at — the identical defect one bullet away,
for the third time on one branch.

Closed IN THE DOC rather than re-numbered: the citation bullet now cites
the SHAPE (which files, in which directories, root vs `app/`) and
records the four-to-five drift as its own worked example. That is
T-078-s5's own preferred arm.

**TWO — the verdict's middle-dot enumeration does not reproduce.** The
T-078 verdict says "I enumerated every U+00B7 in the file with `awk`:
**16 lines** carry one or more". Measured at three refs:

    git show e4a5ae7:docs/CONVENTIONS.md | grep -c '<U+00B7>'   -> 17
    git show 22b31f1:docs/CONVENTIONS.md | grep -c '<U+00B7>'   -> 17
    working file at 041e8ec                                     -> 17

Seventeen at every ref, including the verifier's own. The line set is
`10 11 14 15 16 17 22 25 26 29 56 58 61 65 66` inside "Build & test"
(fifteen) plus two in the boot-gate legend under Gotchas — seventeen,
and neither fifteen nor sixteen is a plausible sub-count. **No defect
follows**: the property the enumeration exists to hold is "no NEW
middle dot", and that is intact — re-proved here the direct way, by
grepping the branch's own added lines rather than by comparing totals:

    git diff -U0 -- docs/CONVENTIONS.md | grep '^+' | grep '<U+00B7>'
    -> no matches

which is a stronger check than either total, because it cannot be
satisfied by two errors cancelling.

**The ask.** Not a re-count. **A rule, in the record-keeping gotchas
beside "A CITATION NAMES A SYMBOL, NOT A LINE": a tally written into
prose carries the ref it was measured at, or it is not written.** Four
counts on this one branch were quoted without a ref — `38 removed`,
`three files`, `four files`, `16 lines` — and three of the four were
wrong or went wrong. The rule already exists for LINE numbers and the
argument for counts is identical: both are positions in a tree that
other people's merges move. A count at a NAMED ref (`143 at 7c6c5aa`)
never goes stale and needs no exemption.

Worth pairing with T-078-s1's sweep, which is the same shape one level
up: lessons that live only in a card's notes, and figures that live only
in a sentence no gate reads.
