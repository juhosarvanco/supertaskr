---
id: T-211-s1
title: "THE RANGE RULE's `merge-tree` spelling says \"read $? FIRST\" and $? cannot tell a CONFLICT from an INSTRUMENT FAILURE — both exit 1, measured"
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e]
suggested_by: "T-211's executor, which measured the exit codes while writing fast path B's exit typing into method/lane-protocol.md; class parent T-083 (the RANGE RULE's owner). DISPOSITION HINT: promote — it is one sentence in an existing bullet, and the bullet is the one every gate derivation in this repository routes through."
builder:
review: independent
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

## CORROBORATION — 2026-09-01, THE TREE OID IS NOT A REPRODUCIBLE FIGURE EITHER

Appended rather than filed beside, per TASK-FORMAT: a second instance
belongs attached to the card that owns the class.

This card owns the `merge-tree` spelling because its exit code cannot
separate a conflict from an instrument failure. **The same instrument has
a second reproducibility defect on its OTHER output.**

Three seats produced three tree oids from one commit pair — `c363055`,
`6e2cc7f`, `c87b206` — all agreeing on substance: exit 1, one conflicting
file, one line. Reproduced a fourth time at the integration checkout at
`53fe498`:

    git merge-tree --write-tree 53fe498      task/T-211-lane  ->  845c281e…
    git merge-tree --write-tree 53fe498a0c62 task/T-211-lane  ->  c4d39e58…

**`--write-tree` bakes the ARGUMENT SPELLING into the conflict markers**,
so the tree it writes — and therefore the oid it prints — varies with how
the caller spelled a ref that names the same commit. Nobody measured
wrongly; the figure is simply not a function of the commit pair alone.

### The method consequence

`roles/executor.md`'s rule is that every figure carries its ref. **For
this one instrument that is insufficient: a forecast tree oid carries its
ref SPELLINGS or it is not reproducible by a second seat.**

And it vindicates `T-211`'s typing choice, which is why the two findings
belong on one card: that law types on whether a tree was PRODUCED, which
is spelling-invariant. Typing on the oid — the obvious alternative, and
the more precise-looking one — would have produced a rule no two seats
could reproduce, while looking stricter than the rule that works.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Fence widened at the seat to `[docs/CONVENTIONS.md, tools/e2e]`**:
range-rule.spec.ts reads the RANGE RULE bullet, so its reader may have to
move with the sentence. `blocked_by: []` added; `review: independent`
set, because the bullet is the recipe every gate derivation routes
through. The three-valued reading is already law in lane-protocol's fast
path B; this card is the RANGE RULE's pointer to it plus the
discriminator sentence — a tree oid on stdout, never the exit code alone.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
