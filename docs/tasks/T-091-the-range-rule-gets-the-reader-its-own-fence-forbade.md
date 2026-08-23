---
id: T-091
title: The range rule is the most-consulted paragraph in CONVENTIONS and the least defended — build the reader the card that wrote it could not
feature: F-06
milestone: 4
priority: 47
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** I re-derived four of the
> bullet's figures at HEAD `4d2f03c`. Three reproduce exactly. The
> fourth reproduces only under the reading the prose states and NOT
> under the obvious command spelling — see "One figure already needs its
> spelling" below. That is a fixture for this card, not a defect to fix
> first. The ninth reader item is the `xargs` hazard the T-084
> integrator recorded; T-090 CORRECTS the sentence it came from, and
> this card builds the thing that would have caught it. Deliberate
> overlap.

Absorbs: T-083-s2, T-083-s4 (sixth triage, 2026-08-20). Both files
removed in this commit.

**Nothing in this tree can check the range rule, and that is an artefact
of a FENCE rather than of prose.** Exactly two files opened
`docs/CONVENTIONS.md` from disk when T-083 measured it, and both are
blind to the bullet: `buildAndTestSection` in
`tools/e2e/tests/workflow-parity.spec.ts` splits the file on `^## ` and
keeps only the `Build & test` chunk, so **everything under `## Gotchas`
is invisible to it**, and
`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` asserts one substring from the FIRST
gotcha. A third reader has since appeared —
`tools/e2e/tests/docs-input-gate.spec.ts` via `conventionsText()` — and
it reads the DOCS GATE bullet and the four command bullets, not this
one. Re-verified at `4d2f03c`: `git grep -in "RANGE RULE"` over `tools`,
`app` and `lib` returns four hits, all of them prose inside
`docs-gate.mjs`. **No code reads the paragraph.**

So every measured figure the bullet carries — 9 and 36 at `dc3ef5b`,
76/16/16 at `d92dceb`, the 12-versus-60 collapse at `4683566`, the 31
merges, the two-metric scoreboard, the 8-of-10 and 5-of-5 flip counts,
the twelve commit hashes — **is poisonable to any value with every
reader still green**. Measured on T-083's branch, three times: five
figures poisoned at once (9→7, 36→12, 31→41, 10→2, 8→1, which also
breaks the surrounding arithmetic) with `workflow-parity` 14/14,
`cargo test`, `lint:tokens` and parser 263/263 all exit 0; then the
whole correction deleted and the falsified sentence reinstated verbatim,
32 lines replaced by the two they retired, and the same five runs green;
then the verifier's own ten mutants derived from the acceptance criteria
rather than from the pins — **ten mutants, zero killed**.

**The fence is the cause and the verifier proved it.** T-083 was
`touches: [docs/CONVENTIONS.md]`; a reader has to live in
`tools/e2e/tests/`. The verifier wrote one to find out whether "no
mechanical reader" was a property of the claim or of the boundary:
ninety lines of Node, single pass, two sides sharing no constant — `git`
computes, the parsed document is read — GREEN on the merged file and RED
on the poisoned one with **12 findings covering all ten mutants**, each
in its own words (*"T-027 prescribed: doc says 7, git says 9"*, *"BOOT
segment names another gate: GRAPH REGEN"*). It was evidence for a ruling
and was never committed; it belongs to whoever takes this card.

**Only the JUDGEMENT half genuinely has no reader** — *the ban has to
name the PAIR, not the punctuation*; *presentation and correctness
deserve different weight*; *a scoreboard that counts a refusal as a miss
is scoring the wrong thing*. No derivation settles those and none should
be asked to. The FACTUAL half is cheaper to check than the CI-command
derivation `workflow-parity.spec.ts` already runs against the other half
of this same file, because git is a more stable oracle than a YAML
workflow.

**One figure already needs its spelling, measured at `4d2f03c`.** The
bullet scores its scoreboard over *"the **31** first-parent merges on
main from BOOT GATE's own merge `94ee306` through `ddcc8bb`"*.
`git rev-list --first-parent --merges 94ee306..ddcc8bb | wc -l` returns
**30**. `94ee306` is itself a merge (three fields from `git rev-list
--parents -n1`, so two parents), and `94ee306^..ddcc8bb` returns **31**.
The prose says "from … through", which is inclusive, so the figure is
RIGHT and the obvious command is a different question — **a reader that
re-derives with the natural spelling reds on a true number**. That is
this card's hazard in one line: a figure and the command that produces
it are ONE claim, and a reader that stores them apart invents failures
as readily as it misses them.

**What reproduces at `4d2f03c`**, so the builder starts from a known
state rather than re-litigating: `git merge-base --is-ancestor 99791ea
4683566` exits **0**; at the merge `99791ea..4683566` and
`99791ea...4683566` both return **12**; before it, `99791ea..72bc98a`
returns **60** and `99791ea...72bc98a` returns **12**. All four exactly
as written.

**T-083-s4 folds in as the ceiling and as a practice clause.** Over the
same merge set, thirty are pure merges and ONE is not: at T-028's merge
`634c405`, `tools/e2e/tests/window-contract.spec.ts` differs from BOTH
parents, and `git merge-tree --write-tree 634c405^1 634c405^2` exits 0 —
a clean mechanical merge, so the edit was not a resolution. Re-derived
here: the merge's own diff is **28** paths and the three-dot forecast is
**27**. That is the honest ceiling on the recommended command, one merge
in thirty-one, and it is also the finding: **a merge commit that carries
work is a merge commit whose diff nobody reviewed as a diff**, because
both the executor's fence and the verifier's read happened on the
branch. The integrator ritual that would catch it — predict the tree
with `merge-tree --write-tree`, then compare the no-ff merge's own
`HEAD^{tree}` to the prediction — is practised and recorded in
checkpoints but written down in no governing file.

## Acceptance criteria

- THE reader SHALL live in `tools/e2e/tests/` beside
  `workflow-parity.spec.ts`, and it SHALL DERIVE rather than pin: `git`
  computes on one side, the parsed bullet is read on the other, and the
  two sides SHALL share no constant. A parse failure SHALL THROW rather
  than yield an empty expectation (T-083-s3's shape, absorbed by T-092).
- **THE FLIP LISTS SHALL BE CHECKED BY GATE, never merged into one
  set.** The mutant that matters relabels T-076 from BOOT GATE to GRAPH
  REGEN — that is `T-083-s1`'s real, shipped error, and a set-equality
  check over all thirteen hashes passes straight through it.
- THE four headline counts SHALL be recomputed from `git rev-list
  --first-parent --merges`, each side matched against the gate's own
  trigger, **and each count SHALL be stored WITH the range spelling that
  produces it** — the 31-versus-30 measurement above is the reason, and
  it SHALL be a fixture rather than a footnote.
- THE T-027 figures SHALL be recomputed at their own ref (`dc3ef5b`: 9
  prescribed, 36 naive, 27 extra).
- THE reverse-flip universal SHALL be checked: zero merges where the
  naive range says a gate is not owed while the prescribed one says it
  is.
- **THE THREE-DOT IDENTITY SHALL BE EXECUTED, not read**: assert that
  `A...B` and `$(git merge-base A B)..B` return the same set on live
  refs, rather than asserting the document contains the sentence.
- **BOTH SCOREBOARD COLUMNS SHALL BE CHECKED, EACH UNDER ITS OWN
  METRIC** — path-for-path 29/30/3 and byte-for-byte 29/24/3, plus the
  six merges that separate three dots' two scores. T-083 was REJECTED
  for measuring one metric and labelling it the other, so a reader
  checking a single column would be green straight through the defect
  that sent the card back.
- THE prose commitments SHALL be checked for PRESENCE, not value: the
  `merge-tree` command, the `Not "rarely"` refusal, the exit-code
  warning.
- **THE PRINTED RECIPE SHALL BE EXECUTED, never re-implemented.** The
  bullet prints the commands a reader should run; nothing checks that
  those commands are the ones that produced the published columns. A
  reader that re-implements the derivation beside the doc is GREEN over
  a recipe that no longer computes it — and the recipe is what the next
  re-deriver actually follows.
- **THE NINTH ITEM, from T-084's integration: a printed recipe whose
  EXIT CODE the pipeline eats is a corrupt recipe.** The reader SHALL
  execute at least one exit-code-bearing recipe end to end and compare
  the code the reader observes with the code the doc promises. The live
  instance is the DOCS GATE bullet's `xargs` invocation, corrected by
  T-090; this criterion is what makes the NEXT one fail loudly.
- **THE MERGE-COMMIT CEILING SHALL SURVIVE AS A DERIVATION**: `634c405`
  SHALL be identified by the reader as a merge whose tree differs from
  the mechanical merge of its parents, rather than named as a hash in
  prose — 28 against 27 at `4d2f03c`.
- IF the integrator's predicted-tree comparison is to be relied on THEN
  it SHALL be written in the governing file with the same loudness a
  skipped gate gets: a merge commit that must carry an edit SAYS SO in
  the checkpoint.
- **NO CRITERION HERE SHALL BE MET BY A TEST THAT GREPS FOR DIGITS.** A
  body pinning `**9**` goes stale in the direction that matters least
  and reds on rewording; every item above recomputes.

Verification: headless — the new spec inside `npm test` from tools/e2e
with its exit stated, plus the POISON DRILL on every body it adds:
mutate the DOCUMENT (one figure, one gate label, one hash, one recipe
command) one side at a time, read each mutation back with `git diff`
before running, require the RED and name the finding text, then restore
and prove the restoration by sha256 against the drill's own commit.
**Drill at a commit** — the document under test is a tracked file this
lane is also editing, which is exactly the restore-versus-revert hazard
T-092 carries. Every figure carries the ref it was measured at.
@human: none.
