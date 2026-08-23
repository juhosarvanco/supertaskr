---
id: T-061-s1
title: The T-046-s4 id was reused after promotion, and T-061's own preamble now tells its executor to delete a live unrelated finding
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

**Two different findings have worn the id `T-046-s4`, and the second is
live.** Derived from the tree, not remembered:

    git log --oneline --name-status --diff-filter=AD -- 'docs/tasks/T-046-s*'

    88c394f  A  docs/tasks/T-046-s4-a-substring-guard-over-a-random-port.md
    abc6814  D  docs/tasks/T-046-s1-child-exit-leaves-the-group-unsignalled.md
             D  docs/tasks/T-046-s2-checkjs-for-the-lane-scripts.md
             D  docs/tasks/T-046-s4-the-overlay-masks-the-two-keys-it-overrides.md
    89e8c84  A  docs/tasks/T-046-s4-the-overlay-masks-the-two-keys-it-overrides.md

`abc6814` is *Promote nine suggestions to T-059, T-060 and T-061* — the
triage that created this card and removed the three files it absorbs.
`88c394f` is T-082's checkpoint, filing a NEW finding (the boot-check
guard's `not.toContain("1420")` substring flake) under the freed id.
Both are still present in every reader's mental index; only one is on
disk.

**WHY IT IS NOT MERELY UNTIDY.** T-061's preamble reads: *"Absorbs:
T-046-s1, T-046-s2, T-046-s4 (triage 2026-08-17). The suggestion files
are removed in the same commit as this card."* Read at any ref after
`88c394f`, that sentence instructs the executor to remove
`docs/tasks/T-046-s4-*.md` — which is now a live, unrelated,
undispositioned finding about a 1-in-8192 flake in the very file this
card edits. The three files it MEANT were already gone, removed by the
triage commit itself, so the sentence had nothing left to do and
everything left to break. This executor noticed only because the two
titles are nothing alike; a faithful one matching on the id prefix would
have deleted it.

It also breaks citation. This card's third criterion cites "(T-046-s4)"
for the overlay derivation. A reader who follows that citation to the
tree lands on a substring-matching flake and concludes the criterion is
mis-filed.

**THE SHAPE.** CONVENTIONS already warns *"Re-derive the maximum id
before writing"* for TASK ids, and the fourth-triage gotcha says *A
CITATION NAMES A SYMBOL, NOT A LINE* because line numbers drift. This is
the third member of that family: **a suggestion id is a name, and
promotion FREES it**, so the next filer re-derives a maximum over a set
the removals have made smaller. `T-046-s4` was the highest live `s`
ordinal under T-046 when T-082's integrator looked, because s4 had been
deleted and s3 was the survivor — so "max + 1" gave 4 again.

**Options, in the order I would take them.**

1. **Promotion retires the id.** The absorbing card's `Absorbs:` line is
   already the record; make the rule that a promoted suggestion's
   ordinal is never re-issued, and derive the next ordinal from the
   HIGHEST EVER USED rather than the highest live — which for a removed
   file means reading `git log --diff-filter=D`. One sentence in
   method/tasks/TASK-FORMAT.md plus a line in the triage bullet.
2. **A gate.** `docs-scan.mjs` already walks every tracked docs path and
   the DOCS GATE already fires on `docs/tasks/T-*.md`; a check that no
   `T-NNN-sM` ordinal has ever been used twice is one `git log` away and
   would have caught this at `88c394f`. It is the cheapest of the three
   and the only one that cannot be forgotten.
3. **Rename the live one** to the next free ordinal (`T-046-s5`) and
   leave the rule unwritten. Not recommended: it fixes one instance and
   teaches nothing, and it breaks T-082's checkpoint's own citation.

**A SECOND INSTANCE OF THE SENTENCE, unfixed and left alone
deliberately.** T-061's preamble is a promoted card's preamble and
this executor's fence is `[tools/e2e]`, so the card body was not
rewritten beyond its own Implementation notes. Whoever triages this
should decide whether the "the suggestion files are removed in the same
commit as this card" clause belongs on a promoted card at all once the
triage commit has already removed them — it is a stale instruction in
every promoted card ever written, and it is only dangerous where an id
has been recycled.
