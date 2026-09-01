---
id: T-211-s1
title: "THE RANGE RULE's `merge-tree` spelling says \"read $? FIRST\" and $? cannot tell a CONFLICT from an INSTRUMENT FAILURE — both exit 1, measured"
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
touches: [docs/CONVENTIONS.md]
suggested_by: "T-211's executor, which measured the exit codes while writing fast path B's exit typing into method/lane-protocol.md; class parent T-083 (the RANGE RULE's owner). DISPOSITION HINT: promote — it is one sentence in an existing bullet, and the bullet is the one every gate derivation in this repository routes through."
builder:
review:
---

**MEASURED, NOT ARGUED.** At git 2.50.1 (Apple Git-155), on a throwaway
repository built for the question:

| what happened | exit | stdout | stderr |
|---|---|---|---|
| clean merge | **0** | the merged tree's object id | empty |
| real CONFLICT | **1** | the tree object id, THEN the conflicted index entries and the `CONFLICT (content)` lines | empty |
| a ref that does not exist | **1** | **empty** | `merge-tree: <ref> - not something we can merge` |
| an unknown option | **129** | empty | usage |

**SO EXIT 1 IS TWO DIFFERENT ANSWERS**, and the RANGE RULE's own
prescribed spelling reads it as one:

    TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

Reading `$?` first is right and insufficient. A seat that reads 1 and
concludes *conflict* has, in the instrument-failure case, concluded a
fact about two trees from a command that never compared them — and
`$TREE` is then the EMPTY STRING, which is what the second line goes on
to use as a right-hand endpoint.

**THE DISCRIMINATOR IS ALREADY IN THIS REPOSITORY'S VOCABULARY AND IS
NOT A NEW RULE.** docs/STATE.md's standing hazard says an exit 1 may
mean the gate COULD NOT RUN, and *READ THE OUTPUT, NOT THE CODE* — a
verdict prints gate lines, a crash prints a stack trace. This is that
sentence applied to one more instrument, and here it has a mechanical
form: **the forecast RAN if and only if it produced a tree object id on
stdout.** A conflict prints one; a failure prints none.

## Why it is a card and not a line in T-211's diff

`docs/CONVENTIONS.md` IS inside T-211's fence, so the fence is not what
stopped it. T-211's acceptance criteria name exactly one change to that
file (the pin-reconciliation sentence), and its dispatch said in as many
words to write what is enforced *and not one word more*. Editing a
second, unrelated bullet is scope a criterion did not ask for, so it is
routed rather than taken — `roles/executor.md` step 5.

**WHERE THE MEASUREMENT ALREADY LANDED**: `method/lane-protocol.md`'s
fast path B carries the corrected typing for the SYNC dry-run, because
that is what T-211 was dispatched to write. The RANGE RULE's copy — the
one every gate derivation in this repository routes through — is
untouched and still reads the code alone.

## Acceptance criteria

- THE RANGE RULE's executor row SHALL say how to tell a CONFLICT from an
  instrument failure, since both exit 1, and SHALL name the
  discriminator rather than an exit code.
- The remedy SHALL be re-derived at the fixing lane's own git version
  before it is written — this card's table is a measurement at one
  version on one machine, not a property of the tool.
- CONSIDER whether `docs-gate.mjs`'s own header prints the same
  spelling; if it does, the two move together or they disagree (T-057).
- Verification: headless.
