---
id: T-211-s1
title: "THE RANGE RULE's `merge-tree` spelling says \"read $? FIRST\" and $? cannot tell a CONFLICT from an INSTRUMENT FAILURE — both exit 1, measured"
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/scripts/range-rule.mjs, tools/e2e/tests/range-rule.spec.ts, docs/conventions/merging.md, docs/conventions/standing-gates.md]
suggested_by: "T-211's executor, which measured the exit codes while writing fast path B's exit typing into method/lane-protocol.md; class parent T-083 (the RANGE RULE's owner). DISPOSITION HINT: promote — it is one sentence in an existing bullet, and the bullet is the one every gate derivation in this repository routes through."
builder:
review: independent
---

Absorbs: T-091-s5 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review), which itself absorbs T-091-s6. The change is to the contract header's comment and to nothing the reader computes, as the child asks; no standing test counts comment rules.

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
- WHEN range-rule.mjs executes a command it parsed out of docs/CONVENTIONS.md THE file's numbered contract header SHALL carry one more rule naming the trust boundary as the child states it — the executed strings are repository-owned text under the same review as the reader itself, and tracked-ness alone is not that boundary (arbitrary project or user text never reaches this path) — and a DRILLING NOTES block recording the three proved-equivalent mutants the child names, so the next drill does not re-derive them; this is a comment-only change and, at most, one sentence in CONVENTIONS' own bullet, separate from any change to what the reader computes, and it adds no standing test. (absorbed from T-091-s5, which absorbs T-091-s6; 2026-09-14)

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

## Absorbed from T-091-s5 — The range-rule reader executes shell it parsed out of a markdown file, and the contract at the head of that file does not name the boundary (kept whole)

Title as filed: "The range-rule reader executes shell it parsed out of a markdown file, and the contract at the head of that file does not name the boundary"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by verifier claude-opus-5 @T-091-verify.

Absorbs: T-091-s6 (Amnesty triage 2026-08-29 (triage seat)) — same file, same seat, same size, same non-blocking status: both ask range-rule.mjs's numbered contract header for a note it does not carry — an eighth rule naming the trust boundary, and a DRILLING NOTES block recording the three proved-equivalent mutants so the next drill does not re-derive them. Its disposition 1 (put the equivalences in the CONVENTIONS bullet instead) is the arm this card's own reasoning argues against, since a verifier mutating the document may never open the reader.

**NOT A DEFECT IN THIS CARD AND NOT A REASON TO BLOCK IT.** The card's
ninth criterion REQUIRES the executed form — *"THE PRINTED RECIPE SHALL
BE EXECUTED, never re-implemented"* — and the verify pass confirmed the
requirement is met and that re-implementing instead is the defect the
criterion exists to prevent (mutant V15 removes one dot from the printed
three-dot forecast and reds five bodies; a re-implementing reader is
green on it). This file records a TRUST BOUNDARY that is real, is
currently unstated, and matters most somewhere else.

**WHAT IS TRUE, MEASURED AT `2e5704a`.**
`tools/e2e/scripts/range-rule.mjs` extracts command strings from
`docs/CONVENTIONS.md` with backtick captures — `` /`([^`]+)`/ `` — and
hands them to `/bin/sh -c` through `sh(root, command)` (its own
`spawnSync` wrapper). The strings so executed are the two-row prescribed
table's three commands, the four scoreboard recipes, the two flip
recipes, and the DOCS GATE's two printed lines. **Only the four
scoreboard recipes are constrained at all**: `nameOnly()` throws unless
the recipe starts with `git diff `, because it has to append
`--name-only`. The other six are executed as written.

**WHY IT IS NOT A FINDING HERE.** The document is a tracked file in this
repository. Anyone who can edit `docs/CONVENTIONS.md` can already edit
`tools/e2e/tests/*.spec.ts`, which the runner executes directly and with
no shell in the way. The reader therefore grants **no privilege the test
runner does not already grant**, and the package is `private: true` dev
tooling that ships in nothing.

**WHY IT IS WORTH WRITING DOWN ANYWAY, AND THIS IS THE WHOLE ASK.** The
header of `range-rule.mjs` carries a numbered CONTRACT — seven rules,
covering derivation, throwing, executing the recipe, storing counts with
their spelling and their trigger, checking flips by gate, and not
asserting against a moving target. **None of the seven says whose
document this is.** The pattern the file demonstrates — *parse commands
out of a markdown file and run them* — is exactly the pattern a later
card would reach for, and this product's own subject is reading
**project documents it did not write**. The same code shape, pointed at
a user's project folder instead of at this repository's own tracked
conventions, is arbitrary command execution rather than a test fixture,
and nothing in the file marks where the line is.

**THE ASK — one paragraph, no behaviour change.** Add an eighth contract
rule to `tools/e2e/scripts/range-rule.mjs` saying that the document
under test is a TRACKED file of THIS repository, that executing strings
parsed out of it is safe only because of that, and that the shape must
not be copied to any document this repository does not own. Optionally
add a cheap assertion beside it — every string reaching `sh()` must
begin with `git ` or `node tools/` — but the sentence is the load-bearing
half and the assertion is a matter of taste, because an allowlist in the
reader is one more constant that can go stale while the sentence cannot.

Fence `[tools/e2e]`. Size XS. **Do not fold this into a card that also
changes what the reader computes** — it is a comment and, at most, one
guard.

Amnesty triage 2026-08-29 (triage seat): PARKED — both halves are comments on one file's header, both explicitly non-blocking, and neither changes behaviour. The trust boundary is real and correctly reasoned — the reader grants no privilege the test runner does not already grant, and the sentence that matters is the one saying WHY, so the shape is not copied to a document this repository does not own. RESURFACES: the next tools/e2e dispatch — the file is range-rule.mjs's own header and any lane holding that slug can carry both notes.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/merging.md, docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
