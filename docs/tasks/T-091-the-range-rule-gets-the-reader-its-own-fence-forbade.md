---
id: T-091
title: The range rule is the most-consulted paragraph in CONVENTIONS and the least defended — build the reader the card that wrote it could not
feature: F-06
milestone: 4
priority: 47
size: M
status: verifying
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
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

## Implementation notes (executor `claude-opus-5`, lane `task/T-091-range-rule-reader`)

**EVERY FIGURE BELOW WAS RE-DERIVED AT THIS LANE'S OWN REF.** The lane was
cut at `c4c15c8`; the reader was built at `d2bba71`. Main moved from
`c4c15c8` to `9b9c997` and then `765924d` while this lane ran, which is
this card's subject happening underneath it — and NOTHING the reader
computes moved, because every ref it reads is one the DOCUMENT names.

### What was built

Two files, both inside `[tools/e2e]`:

- **`tools/e2e/scripts/range-rule.mjs`** — the derivation. Parses the
  bullet into a claims object (throwing on any sentence it cannot find),
  reads BOTH gates' triggers out of their own bullets, EXECUTES the
  commands the bullet prints, and returns twenty named checks plus their
  findings.
- **`tools/e2e/tests/range-rule.spec.ts`** — 25 bodies: one per check,
  the coverage floor, the parse-failure drill, the pinned-expectation
  drill, the by-gate relabel drill, and the `xargs` guard.

**EVERY FACTUAL FIGURE IN THE BULLET REPRODUCES EXACTLY at `c4c15c8`** —
9/36/27 at `dc3ef5b`; 76/16/16 at `d92dceb`/`d219482`/`fed70a2`;
0/12/12/60/12 at T-080's four; 31 first-parent merges; path-for-path
29/30/3 and byte-for-byte 29/24/3; the index-forgiving 25 with neither
other row moving; the six split merges byte for byte; `bdada11` at exit
1; `634c405` at 28 against 27; BOOT 8 of 10, GRAPH 5 of 5, thirteen
flips in fifteen chances over twelve distinct merges; every one of the
twelve hashes and every parenthetical beside them; zero reverse flips.
**The card's own hazard reproduced too**: `94ee306..ddcc8bb` returns
**30** and `94ee306^..ddcc8bb` returns **31**, `94ee306` is a merge
(three fields from `rev-list --parents -n1`), and the published figure is
the right one. That pair ships as a FIXTURE inside
`range-spelling-with-its-count`, which requires the gap to be exactly the
left endpoint and requires that endpoint to BE a merge — so the reason
the inclusive spelling is right is checked, not just the number.

### The criteria, one at a time

1. **Lives beside `workflow-parity.spec.ts`, derives rather than pins,
   two sides share no constant, a parse failure THROWS.** Met. There is
   no figure from the bullet written as a literal anywhere in either
   file, and that is checked rather than claimed: *"the expectation side
   is READ from the document, never pinned"* moves the document's `31` to
   `32` in memory and requires the parsed expectation to follow. A pinned
   reader is green on this tree and dies there. Parse failure throws in
   three shapes (bullet deleted, bullet duplicated, sentence retired),
   each with the unmutated document as the positive control.
2. **Flip lists BY GATE, never one set.** Met, and PROVED IN THE SUITE.
   `flipListFindings` is exported so a body can drive it against a
   document relabelled in memory. The body asserts BOTH halves against
   the same mutation: the merged thirteen-hash set is IDENTICAL after the
   relabel (so a set check sees nothing) and the by-gate comparison reds.
   The drill did the same on disk — see M2 below.
3. **Four headline counts recomputed, each side matched against the
   gate's own trigger, each count stored WITH the spelling that produces
   it.** Met, and generalised: a count is stored with its RANGE SPELLING
   *and* its GATE TRIGGER. See "the one disclosure" below.
4. **T-027 at `dc3ef5b`.** Met — 9 / 36 / 27, derived through the
   bullet's own printed flip recipe rather than a re-implementation.
5. **The reverse-flip universal.** Met, under BOTH trigger vintages, with
   the forward flip count as its positive control (a detector that never
   fires proves nothing by not firing, so a zero forward count is itself
   a finding).
6. **The three-dot identity EXECUTED.** Met — `A...B` against
   `$(git merge-base A B)..B` over all 31 pinned pairs, the right-hand
   spelling instantiated from the bullet's own DEFINITIONALLY sentence.
   Positive control: the two-dot form must differ somewhere, or the
   agreement is indistinguishable from a comparison that compares
   nothing.
7. **Both scoreboard columns, each under its own metric, plus the six.**
   Met — `scoreboard-path-for-path`, `scoreboard-byte-for-byte` and
   `three-dots-two-scores-split` are three separate bodies, and M1 and M3
   red them independently.
8. **Prose commitments checked for PRESENCE, not value.** Met — the
   `merge-tree` sentence, the `Not "rarely"` refusal, the exit-code
   warning. Deliberately no value assertion on any of them.
9. **THE PRINTED RECIPE EXECUTED, never re-implemented.** Met, and this
   is the criterion the drill proves hardest. Every scoreboard cell comes
   from running the bullet's own `git diff M^1 M`,
   `git diff M^1 $(git merge-tree --write-tree M^1 M^2)`,
   `git diff M^1...M^2` and `git diff M^1..M^2` through `/bin/sh`, with
   `M` substituted and `--name-only`-through-`sort` applied for the left
   column exactly as the bullet instructs. **M4 removes one dot from the
   printed three-dot forecast and five bodies red; a reader that
   re-implemented the derivation beside the doc is GREEN on M4.**
   The two-row prescribed TABLE is executed too and required to agree
   with the RECIPE — one idea in two spellings, checked for forking.
10. **THE NINTH ITEM — an exit-code-bearing recipe executed end to end.**
    Met, twice over. (a) The DOCS GATE's printed spelling is run on a
    FAILED range and on a real one, and the observed codes are compared
    against the `$(…)`/BSD column of the bullet's own measured matrix
    (2 and 1 — both observed). (b) The FORBIDDEN `xargs` variant is BUILT
    FROM the printed line and run through the same two arms, and compared
    against the piped/BSD column (0 on the empty list, 1 on the verdict) —
    **both observed, so T-090's whole argument is now re-measured on this
    machine by the suite rather than quoted.** The positive control is
    the discrimination itself: the two spellings must DISAGREE on the
    empty-list arm and AGREE on the verdict arm, or the check cannot tell
    a surviving exit code from an eaten one. **This also caught a real
    defect — see `T-091-s1`.**
11. **THE MERGE-COMMIT CEILING AS A DERIVATION.** Met. The reader asks
    `merge-tree --write-tree` for each merge's predicted tree and
    compares it against that merge's own `^{tree}`; exactly one of the 30
    forecastable merges differs, and it must be the hash the doc names.
    Positive control built in: requiring EXACTLY one mismatch means the
    other 29 must match. `634c405` at 28 paths against a 27-path
    three-dot forecast, re-derived here.
12. **The governing-file criterion — NOT BUILT, ROUTED.** It requires
    `method/` and/or `docs/CONVENTIONS.md`; this fence is `[tools/e2e]`.
    Filed as **`T-091-s4`** with the evidence the reader now derives
    (29 of 30 predictions byte-exact, one refusal, one carried edit).
    `git grep -n "merge-tree" method/` returns zero rows at `d2bba71` —
    the absence is derived, not asserted.
13. **NO CRITERION MET BY GREPPING FOR DIGITS.** Met — see criterion 1.

### The one disclosure, which is the best thing the reader found

**GRAPH REGEN's flip figures carry their REF and not their TRIGGER, and
the trigger moved under them.** The paragraph says *"Derived at
`ddcc8bb`"*, and `*.rs` joined GRAPH REGEN's trigger on 2026-08-25
(`T-123-s5`). Under the trigger AS IT STOOD AT `ddcc8bb` — read out of
`git show ddcc8bb:docs/CONVENTIONS.md`, so the vintage is derived too —
the published 5-of-5 reproduces exactly. Under the trigger ON DISK the
same 31 merges give **1 of 1**, and the headline THIRTEEN/FIFTEEN/TWELVE
becomes NINE/ELEVEN/EIGHT.

**THE READER DOES NOT RED ON THIS AND THAT IS DELIBERATE.** Re-deriving a
figure under a different trigger and reporting the difference as a defect
is the same mistake as re-deriving the scored range with the exclusive
spelling and reporting 30 — **a lane that reds on a true number is the
hazard this card exists to prevent.** So the figures are checked against
the trigger at the ref they name (green), the RELATIONSHIP between the
two vintages is asserted (a widened trigger can only lower a not-owed
count and shrink a flip set — both derived, both hold), and the
divergence is DISCLOSED in the run's own stdout on every run. Playwright
annotations are invisible in the `list` reporter, so the note is printed
as well; a disclosure nobody sees is silence with extra steps. Routed as
**`T-091-s3`**: what the paragraph needs is one clause, not new numbers.

### The poison drill

Detached scratch worktree **`/Users/ujju/Projects/drill-T-091`**, cut at
`d2bba71`, **outside the repository**; driver, mutation table and results
files all named per-lane and outside it too. **ONE SIDE ONLY: the
DOCUMENT was mutated and `git` — the producer of every derived figure —
was never touched.** No literal was edited that the two sides share,
because they share none. Every mutation was read back with `git diff`
BEFORE its run (the driver REFUSES to run on an empty numstat), and every
restoration was proved by sha256 against the drill's own commit:
baseline and final `4ad860b2acfec0c659797abe3e0be32035d284f2e8525167609dddb909abb076`,
identical to `git cat-file blob d2bba71:docs/CONVENTIONS.md`.

| # | mutation, one side only | verdict | the body that redded, and what it said |
|---|---|---|---|
| **M1** | ONE FIGURE — scoreboard BYTE column, three dots `24` → `25` | **KILLED** (exit 1, 1 failed / 24 passed) | `scoreboard-byte-for-byte` — *"BYTE-FOR-BYTE three dots: doc says 25 of 31, git says 24 of 31"* |
| **M2** | ONE GATE LABEL — T-076 `79ae34a` moved from the BOOT segment to the GRAPH segment | **KILLED** (exit 1, 2 failed / 23 passed) | `flip-lists-by-gate` — *"BOOT GATE segment: the doc lists … git derives …"*, *"GRAPH REGEN at 79ae34a: doc says 0 prescribed, git says 13"* — and the in-suite by-gate body, which declared it had lost its subject rather than passing |
| **M3** | ONE HASH — `827511e` → `59558de` among the six split merges | **KILLED** (exit 1, 1 failed / 24 passed) | `three-dots-two-scores-split` — *"doc lists 91ab46e, 59558de, … git derives …"* |
| **M4** | ONE RECIPE COMMAND — the printed three-dot forecast loses a dot | **KILLED** (exit 1, 5 failed / 20 passed) | `scoreboard-path-for-path` (*"doc says 30 of 31, git says 3 of 31"*), `scoreboard-byte-for-byte`, `scoreboard-third-metric`, `three-dots-two-scores-split`, `three-dot-identity-executed` |
| **M5** | ONE PROMISED EXIT CODE — the matrix promises `0` where it measured `2` | **KILLED** (exit 1, 1 failed / 24 passed) | `docs-gate-recipe-exit-codes` — *"the doc promises 0 (\"called wrong\"), this machine observes 2"* |
| **M6** | THE T-090 REVERSION — the printed invocation goes back through `xargs` | **KILLED** (exit 1) | a THROW, by design — *"no longer states the DOCS GATE's printed invocation … A derivation that expects NOTHING passes everything"* |

**SIX FOR SIX**, against T-083's ten-for-zero on the same paragraph.

**THE DRILL FOUND A DEFECT IN THE READER AND IT IS FIXED.** On the first
pass, M1, M3 and M4 each carried a SECOND red in
`docs-gate-recipe-exit-codes` that had nothing to do with the mutation:
the drill worktree had no `tools/e2e/node_modules`, `docs-gate.mjs`
imports `yaml`, and node exited **1** — the code that gate reserves for
"HAS a verdict" — where the honest answer is "the gate never ran". The
reader now reads stderr and reports *"the DOCS GATE never LINKED in
<root>"* instead of a meaningless code mismatch, **which is this
criterion's own lesson applied to itself**. Filed as `T-091-s1`. The
drill was re-run in full afterwards; the table above is the second run,
with M2 run separately after its anchor was corrected for the document's
hard wrap.

### Standing disciplines, each answered

- **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.** Five negatives here,
  five controls: the reverse-flip zero is controlled by the forward flip
  count; the three-dot identity by requiring the two-dot form to differ
  somewhere; the "exactly one conflict" and "exactly one tree mismatch"
  by their own cardinality (29 must match); the exit-code matrix by
  requiring the printed and piped spellings to disagree on one arm and
  agree on the other; the parse-failure throws by the unmutated document
  parsing cleanly.
- **SHAPE FIVE.** The assertion set has a coverage floor: every claim key
  the parser produces must be named by some check, and every key a check
  names must exist. Deleting an assertion reds.
- **SHAPE SIX** — asked of each body. The three that could have been
  duplicates are not: the pinned-expectation body kills a reader that
  hardcodes a figure, which every other body is green against; the
  in-suite relabel body kills a future `flipListFindings` that merges the
  two lists, which `flip-lists-by-gate` would stay green against; the
  `xargs` guard kills a printed line that grows its own pipe, which the
  exit-code check would THROW on rather than name.
- **NO MOVING TARGET.** Every ref the reader reads is named by the
  document. Main gained two merges under this lane and not one derived
  figure moved.

### For the verifier

- **The suite is 171/171 at exit 0**, up from 146 — 25 new bodies. The
  FIRST full run in this fresh worktree was 170/171, red on
  `token-scan.spec.ts:201`, which is `T-120-s3` firing exactly where
  STATE predicts it fires (once per fresh checkout, then green forever).
  Declared rather than smoothed; the re-run is the second number.
- **The heavy derivation is ~17 s** and runs once, in `beforeAll`, shared
  by all 20 check bodies. `test.setTimeout(300_000)` is on the hook.
- **`NPUTER_RANGE_RULE_ROOT` is a shipped drill affordance**, not a
  backdoor: it points the reader at another checkout of this repository
  so a drill never has to mutate a tracked file inside the lane. The
  resolved root is printed with every disclosure.
- **The zero-argument `conventionsText()` in the spec is load-bearing**
  and there is a comment saying so. With the root passed as a variable,
  the DOCS GATE's census drops from 13 readers to 12 and this spec
  becomes invisible to the gate. Filed as `T-091-s2`.
- **`docs/CONVENTIONS.md` WAS NOT TOUCHED.** It is held by T-086 and it
  is not this fence. Everything the reader would change about it is in
  `T-091-s1`, `T-091-s3` and `T-091-s4`.
- **The DRAFTER'S NOTE at the head of this card still says "remove
  before landing"** and has been left in place: it is spec text, an
  executor is not who lands the card, and its `4d2f03c` measurements are
  the fixture the reader was built against. **For the integrator.**
