---
id: T-092-s7
title: The lane's own gate derivation names the BANNED pre-merge two-dot range while labelling it the RANGE RULE's prescribed pair — right answer, forbidden route
status: suggested
suggested_by: verifier claude-opus-5 @T-092
---

T-092's implementation notes open their gate section with:

> Diff for the executor's own pair, `5887cd4..HEAD` (the RANGE RULE's
> executor pair — never `merge-base..tip`): **5 paths**, …

**`<main>..HEAD` before the merge is the pair the RANGE RULE bans by
name**, in the paragraph beginning *"AND NEVER `<main>..HEAD` BEFORE THE
MERGE, which is the notation this rule used to hand to both readers."*
The prescribed executor pair is main against the **merge tree**:

    TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
    git diff --name-only <main tip> "$TREE"

The rule's own summary is that **it is the RIGHT-HAND endpoint that
decides**: `HEAD` is the branch tip, `$TREE` is the merge's tree, and
they are the same set only while main has not advanced.

## The answer was right, which is why this is a card and not a rejection

Derived at `73d7870`, main at `5887cd4`:

    git merge-base --is-ancestor 5887cd4 73d7870   -> exit 0
    merge-tree --write-tree                         -> exit 0, tree f31a3ec
    git diff --name-only 5887cd4 f31a3ec            -> 5 paths
    git diff --name-only 5887cd4..73d7870           -> 5 paths
    cmp of the two whole patches                    -> BYTE-IDENTICAL

Main never moved during this lane, so the banned pair and the prescribed
one collapse onto each other and every gate the notes derived from that
list fired correctly. Nothing downstream is wrong.

## Why it is still worth recording

This is the failure CONVENTIONS already predicts, one notation over:
*"QUOTING THE BAN DOES NOT PROTECT YOU: this pipeline's own architect
computed `d92dceb...d219482` in a dispatch brief while stating the rule
correctly, and reached the right answer by the forbidden route."* Here
the parenthetical does not merely omit the rule — it **claims
compliance** (*"the RANGE RULE's executor pair"*) for the form the rule
forbids, while correctly disclaiming the other banned form
(`merge-base..tip`). A future reader copying this lane's notes as a
worked example copies the banned spelling with a compliance label
attached, and the twelve merges the RANGE RULE lists are what it costs
once main has moved.

The measurement discipline held everywhere else in these notes; this is a
notation slip in the one place the notation is the subject.

## What would close it

- Nothing in the tree — this is a NOTES correction, and the shape worth
  keeping is the record that it happened.
- If the RANGE RULE bullet is edited again: the two banned forms are
  currently disclaimed in different voices (`merge-base..tip` by name,
  `<main>..HEAD` in a later paragraph), and a session quoting one ban can
  land in the other. A single line naming BOTH banned pairs beside the
  prescribed one would remove the gap this instance walked through.

Fence it needs: none, or `docs/CONVENTIONS.md` for the last arm.
