---
id: T-224-s5
title: "`cardPathsById`'s COST is measured in prose and pinned by NO BODY — a change to a per-card listing would pass all 48"
feature: F-06
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2, re-verification), at T-224's bench 4a9f278, 2026-09-08 — mutant RECURSIVE_LS_TREE SURVIVED the whole suite, and the ordinary push's two-spawn figure lives only in the card's notes
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**NOT A DEFECT — A PROPERTY THE ARM ARGUES FOR AND NOTHING MEASURES.**
`cardPathsById` is documented as one `ls-tree` of `docs/tasks/` per
REVISION, memoised, asked ONLY where a path answered `absent`, so that
"the ordinary push spends not one extra process". I re-derived both
figures at `4a9f278` with a counting `git` injected through
`touchesAmendments`' own last parameter:

    ORDINARY push (1 card, body changed, line unmoved): 2 spawns
      show <base>:<card>, show HEAD:<card>
    RENAMING push (2 cards renamed, 5 paths):           9 spawns
      ... and exactly ONE `ls-tree --name-only -z HEAD -- docs/tasks/`
      for the whole range, not one per card

Both hold. **No body among the 48 asserts either of them**, and I
measured that the hard way: mutant `RECURSIVE_LS_TREE` — adding `-r` to
the listing, which enumerates every blob under `docs/tasks/rejected/`
only to discard it — came back **48 passed, exit 0**. So did nothing
else break: the filter is `CARD_FILE_RE` and its `[^/]*` cannot cross a
slash, which is exactly the reason the module's own comment gives for not
recursing. The claim is TRUE and it is UNPINNED, so a later change to a
per-card or a recursive listing is invisible to the suite.

## What to build

- A body driving `touchesAmendments` with a counting `git` through its
  last parameter, over a range whose cards' lines did not move, asserting
  the spawn count is `2 * <cards>` and that the argument list contains no
  `ls-tree` of the directory at all.
- A body over a range renaming two or more cards, asserting exactly ONE
  `ls-tree ... -- docs/tasks/` per revision reached — the memoisation,
  which is the property that keeps this arm O(1) in listings rather than
  O(cards).

## Read beside

`T-224` (the arm, its `cardPathsById` and its cost argument), `T-224`'s
verdict of 2026-09-08 (the drill this survivor came from).

## Note at T-224's merge (the integrator, 2026-09-09)

The spawn figures above are stale at the third pass: the third verifier
measured the arm at e710e4b as 0 spawns with no card in range, 4 for
the ordinary push, 42 for twenty pure renames (one listing per revision,
memoised — `cardPathsById`). The body this card asks for pins those.
