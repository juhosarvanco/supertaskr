---
id: T-091
title: The range rule is the most-consulted paragraph in CONVENTIONS and the least defended — build the reader the card that wrote it could not
feature: F-06
milestone: 4
priority: 47
size: M
status: done
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-091 — code commits d2bba71, 2e5704a
verified_by: claude-opus-5 @T-091-verify — APPROVED, 2026-08-25 — verdict commit 1e134b1
review: same-model
---

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

## Verdicts

### 2026-08-25 — `claude-opus-5 @T-091-verify` — **APPROVED**

Adversarial pass under `method/roles/verifier.md`. The spec was read at
**`c4c15c8`** — the planner's card, free of the executor's notes — and
the attack was formed and RUN from it before the notes were opened
(@human's T-121 ruling, arm 2). Base `c4c15c8`, tip **`2e5704a`**, main
at **`765924d`**. Nothing below is quoted from the brief or the card;
every figure was re-derived here, and where the card or the brief was
wrong it is named.

**THE RANGE, DERIVED WITH THE PRESCRIBED PRE-MERGE FORM, `merge-tree`'s
EXIT READ BEFORE THE SUBSTITUTION.**

    git merge-tree --write-tree 765924d 2e5704a -> exit 0 (rc=$? FIRST), tree fb645043fcfc6476afadecdf4beb98c187082c24
    git diff --name-only 765924d <TREE>          ->   7   THE PRESCRIBED FORM
    git diff --name-only c4c15c8..2e5704a        ->   7   branch-only, TWO dots
    git diff --name-only 765924d...2e5704a       ->   7   AGREES — SIXTH MERGE RUNNING
    git diff --name-only 765924d..2e5704a        ->  17   FORBIDDEN, 2.43x
    git diff --name-only c4c15c8..765924d        ->  10   main's advance

Checked as SETS and not as counts: prescribed vs three-dot `diff` exit
**0** in BOTH directions, prescribed vs branch-only `diff` exit **0**,
`comm -12` over the branch and main lists is **EMPTY**, and the union of
the two is byte-identical to the forbidden two-dot set under `diff`
(exit 0). 7 + 10 = 17 — disjoint, proved.

**AND THIS MERGE IS THE CLOSEST THE THREE-DOT FORM HAS COME TO BEING
WRONG, WHICH IS THE CARD'S OWN SUBJECT ARRIVING UNDERNEATH IT.** Main's
ten paths include **`docs/CONVENTIONS.md`** — the document under test,
edited by T-086's merge while this lane ran. The sets stay disjoint only
because this fence is `[tools/e2e]` and the lane never opened that file.
**Had the lane widened its fence to satisfy the twelfth acceptance
criterion, the two sides would have touched the same path and the
three-dot form would have stated the lane's edit against the branch
point and silently dropped main's 62-line addition** — this bullet's own
warning, manufactured by obeying this card. That is the strongest
available argument for the routing (below) and it was derived, not
reasoned: the RANGE RULE bullet itself is byte-identical at `c4c15c8`
and `765924d` (`diff` exit 0 over the extracted paragraph), so nothing
the reader computes moved.

**THE READER GENUINELY DERIVES. PROVED BY MOVING A FIGURE, TWICE.**
The claim that survives a green run only if it is true is *the two sides
share no constant*, and it holds three ways here. (1) **Source
inspection**: every numeric literal in `range-rule.mjs` is a capture
index, a `maxBuffer`, or an entry in the `NUMBER_WORDS` language table —
**not one figure from the bullet appears as a literal**, and every
expectation arrives through `num(m, i, …)` from a `\d+` capture. (2)
**The shipped body**: `the expectation side is READ from the document,
never pinned` moves the document's `31` to `32` in memory and requires
the parsed expectation to follow; reproduced. (3) **On disk, which is
the half that kills a doc-ignoring pin**: mutant V7 moves `**31**` to
`**30**` in a scratch checkout and the reader REDS. A reader that
hard-coded 31 is green on V7 and dies there.

**THE POISON DRILL — MINE, DERIVED FROM THE CRITERIA WITH THE READER'S
SOURCE CLOSED. 22 MUTANTS ATTEMPTED, 21 APPLIED, 18 KILLED, 3 PROVEN
EQUIVALENT, ZERO GENUINE SURVIVORS.** One side only: every mutation is
applied to the DOCUMENT, never to an assertion and never to a literal
the two sides share. Run in a detached worktree **outside** the
repository (`drill-T-091-verify`, driver and results likewise), never in
the lane; each mutation read back with `git diff -U0` BEFORE running;
each restore proved by sha256 against
`a84d560406b7e457b158a7e358855c6e6d7f143223c14753090b25a867009dfb` and
by `git status` (clean, every time, including after the last).

| # | mutation (in the DOCUMENT) | result |
|---|---|---|
| V1 | T-027's prescribed `**9**` → `**7**` | KILLED — *"T-027 prescribed: doc says 7, git says 9"* |
| V2 | relabel T-076 `79ae34a` out of BOOT GATE into GRAPH REGEN | KILLED |
| V3 | a split-merge hash `bdada11` → `dc3ef5b` | KILLED |
| V4b | printed recipe loses `--write-tree` | **EQUIVALENT** (see below) |
| V5 | DOCS GATE matrix: promised BSD verdict code `1` → `3` | KILLED |
| V6 | the two-metric scoreboard TABLE retired entirely | KILLED — **THROWS** *"expected exactly one"*-class, never an empty expectation |
| V7 | scored count `**31**` → `**30**` (the exclusive spelling's true answer) | KILLED |
| V8 | ceiling merge `634c405` → `bdada11` | KILLED |
| V9 | three dots' BYTE cell `**24**` → `**23**` | KILLED |
| V10 | third metric `**25**` → `**26**` | KILLED |
| V11 | the `Not "rarely"` refusal deleted | KILLED — *"no longer states the `Not \"rarely\"` refusal"* |
| V12 | identity spelling `..B` → `...B` | **EQUIVALENT** (see below) |
| V13 | T-076's parenthetical `(0 paths against 5)` → `against 6` | KILLED |
| V14 | T-090 reverted — the printed DOCS GATE line regains `\| xargs` | KILLED |
| V15 | printed THREE-DOT forecast loses one dot | KILLED — **5 bodies red** |
| V16 | the `GRAPH REGEN at` flip-segment head retired | KILLED — **THROWS**, naming the sentence |
| V17 | scored range's LEFT endpoint `94ee306` → `94ee306^` | KILLED — **THROWS** |
| V18 | `merge-tree`'s PATH cell `**29**` → `**28**` | KILLED |
| V19 | DOCS GATE matrix: piped/BSD empty-list `**0**` → `**2**` | KILLED — *"doc's measured matrix says 2 on an empty list, this machine observes 0"* |
| V20 | identity's RIGHT endpoint `..B` → `..A` | KILLED — per-merge detail at five refs |
| V21 | scored range's RIGHT endpoint `ddcc8bb` → `4683566` | **EQUIVALENT** (see below) |

(V4 was attempted with a mis-wrapped anchor of my own and never applied;
it is re-run as V4b. That is a defect in my driver, not in the reader.)

**THE THREE SURVIVORS ARE EQUIVALENT MUTANTS, EACH PROVED BY
MEASUREMENT AND NOT BY ARGUMENT** — and the meaning-changing neighbour
of each is killed, which is what makes the claim a defence rather than
an excuse. `..B` → `...B` is a no-op because `merge-base(base, B)` IS
`base` (identical sha256 over both spellings at four merges), while the
right-endpoint change V20 reds. `--write-tree` is the DEFAULT of the
two-commit form on git **2.50.1 (Apple Git-155)** (identical tree oids at
three merges, identical exit 1 at `bdada11`), while V15's dot removal
reds five bodies. `ddcc8bb` is a **non-merge** three first-parent commits
above `4683566`, the newest merge in the range, so both spellings select
the identical 31 hashes (same sorted sha256), while V17's left-endpoint
move throws. Recorded for the next driller as **`T-091-s6`**.

**EVERY FIGURE THE BULLET CARRIES WAS RE-DERIVED HERE BY AN INDEPENDENT
SCRIPT — NOT BY RUNNING THE LANE'S READER — AND EVERY ONE REPRODUCES.**

| figure | ref / spelling | derived here |
|---|---|---|
| 9 / 36 / 27 | `dc3ef5b`, BOOT trigger | **9 / 36 / 27** |
| 76 / 16 / 16 | `d92dceb`→`d219482`, merge `fed70a2` | **76 / 16 / 16** (merge-tree also 16) |
| exit 0, 12, 12, 60, 12 | T-080's `99791ea` / `4683566` / `72bc98a` | **0, 12, 12, 60, 12** |
| 31 merges | `94ee306^..ddcc8bb` | **31**; the exclusive spelling **30**; `94ee306` has **2 parents** |
| path 29 / 30 / 3 | over the 31 | **29 / 30 / 3** |
| byte 29 / 24 / 3 | over the 31 | **29 / 24 / 3** |
| index-forgiving 25 | over the 31 | three dots **25**, merge-tree **29**, two dots **3** — neither other row moves |
| the six split merges | path hit, byte miss | `91ab46e`, `827511e`, `bdada11`, `64469dd`, `3b0d974`, `f4b38c8` — exactly, and only, those |
| `bdada11` refuses | `merge-tree --write-tree M^1 M^2` | **exit 1**, `CONFLICT (content)` on `docs/tasks/T-014-…md`. And the refusal is worse than the doc's word for it — see the correction below |
| `634c405` 28 vs 27 | the carried edit | merge's own diff **28**, merge-tree forecast **27**, three-dot **27**, the extra path is `tools/e2e/tests/window-contract.spec.ts`, which differs from BOTH parents while `merge-tree` exits **0** — the SOLE merge of 31 whose tree ≠ the mechanical merge of its parents |
| BOOT 8 of 10 | `ddcc8bb` | **8 of 10**, all eight hashes and every parenthetical |
| GRAPH 5 of 5 | `ddcc8bb`'s trigger | **5 of 5**, all five hashes and every parenthetical |
| zero reverse flips | all three trigger vintages | **0**, under BOOT, GRAPH-at-ref and GRAPH-on-disk |
| the dating | `98f931e` vs `59558de` | 05:50:09 against **02:21:02 the same morning**; `is-ancestor` exit **0** |
| T-083-s1's correction | `79ae34a` | GRAPH **13 against 13** (no flip), BOOT **0 against 5** — the doc is right and `cb3aa31` was not |

**AND THE CARD'S OWN HAZARD FIXTURE REPRODUCES**: `94ee306..ddcc8bb`
returns **30**, `94ee306^..ddcc8bb` returns **31**, `94ee306` is itself a
merge, "from … through" is inclusive, so the published **31** is the
right number and the obvious command is a different question. The reader
ships that pair as a fixture and additionally requires the gap to BE the
left endpoint and that endpoint to BE a merge — the REASON is checked,
not only the number.

**RULING ON THE TRIGGER-VINTAGE DISCLOSURE (`T-091-s3`) — THE LANE IS
RIGHT, AND I RULE FOR DISCLOSURE OVER RE-DERIVATION.**

The premise is confirmed: `git show ddcc8bb:docs/CONVENTIONS.md` gives
GRAPH REGEN's trigger as `*.ts/*.tsx/*.js/*.jsx` outside docs/ with **no
`*.rs`**, which the trigger on disk has. Derived here independently:
under the ref's trigger GRAPH flips **5 of 5**; under the disk trigger
**1 of 1**, only `fed70a2` surviving; and the headline **13 in 15 over
12 becomes 9 in 11 over 8**. BOOT is unmoved at 8 of 10 either way.

1. **THE CARD ALREADY RULED, ONE VARIABLE OVER.** Its own words: *"a
   reader that re-derives with the natural spelling reds on a true
   number … a figure and the command that produces it are ONE claim, and
   a reader that stores them apart invents failures as readily as it
   misses them."* Substitute *trigger* for *range spelling* and the
   sentence is unchanged in force. Redding here is the third criterion's
   own defect arriving through a second argument.
2. **THE ALTERNATIVE MISTAKES THE CLASS OF THE CLAIM.** "GRAPH REGEN's
   flips are 5 of 5" is not a standing assertion about the repository; it
   is an evaluation with two bound arguments, one of which the paragraph
   binds out loud (*"Derived at `ddcc8bb`"*). Re-binding the trigger to
   HEAD while leaving the merge range at `ddcc8bb` evaluates a THIRD
   expression that neither the document nor git asserts — a left endpoint
   from one place and a right endpoint from another, which is the exact
   error this whole bullet exists to name.
3. **THE DECIDING TEST IS WHAT THE RED WOULD TELL AN EDITOR TO DO.**
   Under the alternative the only compliant repair is to overwrite `5 of
   5` with `1 of 1` — **which destroys the evidence**. Those five merges
   are the empirical refutation of *"it has never yet changed WHETHER the
   gate fires"*; four of them stop being counterexamples only because a
   trigger widened AFTERWARDS. They were real flips when they happened. A
   gate that forces the document to forget them launders history and lets
   the sentence this correction was written to kill creep back.
4. **AND IT WOULD NEVER TERMINATE.** Every future widening would red a
   paragraph nobody edited, on whatever lane is nearest — *"a false red
   on somebody else's work, which is the one kind of noise nobody can
   dismiss by looking at it"*, in this bullet's own closing words.
5. **BUT THE ALTERNATIVE'S WORRY IS REAL, AND DISCLOSURE ONLY ANSWERS IT
   BECAUSE THE LANE PAID FOR IT.** A reader asking that paragraph "how
   many GRAPH flips are there?" tonight gets 5 and is wrong about today.
   Three things make the lane's arm an answer rather than a shrug, and I
   checked all three rather than reading them: the divergence is
   **printed on stdout on every run** (observed in the full 171-test run
   and in both drill-root runs, not merely pushed to a Playwright
   annotation nobody reads); the arm **asserts the monotonic
   relationship** between vintages — a wider trigger can only LOWER the
   not-owed count and can produce no flip that was not one before —
   which is a real derived property that holds on a quiet tree too, so
   the check is not vacuous; and it **REDS if the trigger ever NARROWS**,
   which is the one direction that is a genuine defect and is GRAPH
   REGEN's own argument. Silence would have lost to the alternative.
   Disclosure-plus-monotonicity beats both.
6. **THE RESIDUE IS A DOCUMENT EDIT, CORRECTLY ROUTED.** What would make
   the paragraph readable is one clause naming the trigger beside the
   ref. That is `docs/CONVENTIONS.md`, outside `[tools/e2e]`.
   **`T-091-s3` is the right disposition and should be taken.**

**`T-091-s1`'s FIX DISTINGUISHES THE TWO CASES AND DOES NOT SWALLOW A
VERDICT — VERIFIED WITH A MATCHED PAIR.** Run against a detached
checkout with **no `tools/e2e/node_modules`**: exit **1**, 24 passed / 1
failed, and the one red is the intended diagnostic — *"the DOCS GATE
never LINKED in … node could not resolve one of its imports, so the code
observed is node's and not the gate's"* — naming three of the four arms
and, tellingly, NOT the piped-empty arm, because the pipe eats the code
there. It **REDS rather than skipping**, so "the gate never ran" is
reported as the failure it is. Then the same checkout with
`node_modules` linked: **25 passed, exit 0**, the real exit-code
comparisons running and matching. The arm can only mis-fire on stderr
carrying `ERR_MODULE_NOT_FOUND` or `Cannot find package`, and
`docs-gate.mjs` and `docs-scan.mjs` print neither string (grep exit 1) —
only node's loader emits them. No path from this arm reaches a green.

**THAT SECOND RUN IS ALSO THE MERGE-READINESS EVIDENCE THE LANE COULD
NOT PRODUCE**, and it is the check this card most needed: the drill
checkout sits at **main `765924d`**, so those 25 green bodies are the
reader running against the POST-MERGE `docs/CONVENTIONS.md`, T-086's 62
new lines included.

**THE CRITERIA, EACH WITH HOW IT WAS ATTACKED.**

1. *Lives in `tools/e2e/tests/`, derives not pins, two sides share no
   constant, a parse failure THROWS.* **MET.** Attacked by literal-grep
   over the source, by V7 on disk, and by V6/V16/V17 — three distinct
   retirement shapes, all THROWING with the sentence named, none
   yielding an empty expectation.
2. *Flip lists BY GATE, never merged.* **MET.** V2 relabels T-076 in the
   document; the merged thirteen-hash set is unchanged (so a set check is
   blind) and the by-gate comparison reds. V13 kills the parenthetical
   too.
3. *Four headline counts recomputed, each side against the gate's own
   trigger, each count stored WITH its range spelling.* **MET**, and
   generalised to the TRIGGER as well. V7 and V17 kill the count and the
   spelling separately; V21 is equivalent and proved so.
4. *T-027 at its own ref.* **MET** — V1 kills it; 9/36/27 re-derived.
5. *The reverse-flip universal.* **MET** — zero under all three trigger
   vintages, derived here independently, with the forward count as the
   arm's own positive control.
6. *The three-dot identity EXECUTED, not read.* **MET** — V20 changes the
   identity's meaning and reds with per-merge detail at five refs; V12
   changes its spelling without changing its meaning and is right to stay
   green.
7. *Both scoreboard columns, each under its own metric, plus the six.*
   **MET** — V18 (path), V9 (byte) and V10 (third metric) red
   independently; V3 kills a split-merge hash; all three columns and the
   six hashes re-derived here.
8. *Prose commitments checked for PRESENCE, not value.* **MET** — V11
   kills the `Not "rarely"` deletion; no value assertion sits on any of
   the three.
9. *The printed recipe EXECUTED, never re-implemented.* **MET** — V15
   removes one dot from the printed three-dot forecast and **five bodies
   red**; a reader that re-implemented beside the doc is green on V15.
10. *The ninth item — an exit-code-bearing recipe run end to end.*
    **MET, twice over** — V5 and V19 kill the two halves of the matrix
    independently, and V14 reds a reversion of T-090's `xargs` fix.
11. *The merge-commit ceiling as a DERIVATION.* **MET** — V8 kills the
    hash; `634c405` re-derived here as the sole tree mismatch in 31.
12. *IF the predicted-tree comparison is relied on THEN write it in the
    governing file.* **NOT BUILT, ROUTED — AND THE ROUTING IS CORRECT.**
    The antecedent is not triggered by anything this lane ships (the
    reader derives the ceiling instead of relying on the ritual); the
    governing file is outside `[tools/e2e]`; `git grep -n "merge-tree"
    method/` returns zero rows at both the lane tip and main, so the
    absence is derived; and, decisively, **widening the fence to satisfy
    it would have made this lane's path set intersect main's and turned
    the three-dot form wrong for the first time in six merges.** A card
    that specified this criterion inside this fence specified a defect
    into existence, which is the POISON DRILL bullet's own T-057 lesson.
    `T-091-s4` is the right home.
13. *No criterion met by grepping for digits.* **MET** — see 1.

**SECURITY SWEEP — CLEAN, WITH ONE BOUNDARY WORTH A SENTENCE.** No new
dependency of any kind (no `package.json`, no lockfile, no `Cargo.*` in
the diff); imports are `node:child_process` plus the pre-existing
`docs-scan.mjs`, which this lane does **not** modify. No secret, key or
token in the diff. No new endpoint, query or authz surface. ADR-011's
boundary holds — neither new file imports app or parser. The one real
observation is that the reader executes command strings parsed out of a
markdown file through `/bin/sh -c`, which the card REQUIRES; it grants no
privilege the runner does not already grant, since the same person could
edit the spec, and the package is `private: true` dev tooling. **Not a
finding.** Filed as **`T-091-s5`**, because the file's numbered CONTRACT
does not name the boundary and this product's own subject is reading
documents it did not write.

**SUITES — every exit off its own `$?` on the very next token, unpiped,
and every COUNT derived as well as the exit.**

- **E2E `npm test` from tools/e2e/, port 15300 — 171 passed, exit 0**,
  first run, no re-run, nothing discarded. **25 of those are this card's**
  (20 named checks, the coverage floor, the parse-throw drill, the
  pinned-expectation drill, the by-gate relabel drill, the `xargs`
  guard). `token-scan.spec.ts:201` **passed** — this worktree is not a
  fresh checkout, so `T-120-s3` had already healed here; no fractional
  millisecond, and nothing was re-run to make it green.
- **`npx vitest run` from lib/parser — 264/264 across 12 files, exit 0.**
- **`npm run build` from app — exit 0.** **`npm test` from app —
  958/958 across 46 files, exit 0.**
- **`cargo test` from app/src-tauri — exit 0, 455 passed / 0 failed / 3
  ignored**, summed over **16** `test result:` lines, lib suite **3.99s**
  — inside `T-088-s4`'s green band and well clear of the 9.5–14.6s gap.
  **NOT OWED** (the DOCS GATE named three suites and cargo was not among
  them; the diff carries zero `.rs` paths and does not touch
  `docs/CONVENTIONS.md`, which is what `kit.rs` reads) — run anyway, and
  **neither Rust intermittent fired**: `docs_watch::…startup_arm…` ok and
  `a_hostile_session_id…` ok, one run each, charged to nothing.
- **`npm run typecheck` exit 0.** **`npm run lint:tokens` exit 0 at
  TOKEN 134 / CONTROL 691**, derived at this ref. **`npm run lint:tokens
  -- --selftest` exit 0** (65 TOKEN + 4 CONTROL samples, 87 walk-policy,
  9 evidence-floor). **`npm run lint:docs` exit 0.**

**GATES, EACH DERIVED WITH ITS PATH COUNT OVER THE PRESCRIBED SEVEN.**

- **GRAPH REGEN — 1 of 7, OWED, AND ASKED.** The only match is
  `tools/e2e/tests/range-rule.spec.ts`; `range-rule.mjs` does **not**
  match, because the printed suffix list is `*.ts/*.tsx/*.js/*.jsx` or
  `*.rs` and `.mjs` is none of them. That is NOT a gap: `graph.rs:206`
  asserts `Lang::for_extension` returns **None** for `"mjs"`, so the walk
  does not take it either — checked rather than assumed, and no finding
  filed. `cargo run -p nputer-index -- index --check --root ../..` is
  **exit 0, CURRENT** at **920 597 bytes / 178 files / 1959 symbols /
  1878 edges**, unmoved. No regen owed — the `tools/` exclusion in
  `.nputerignore`, the T-054 and T-058 precedent.
- **BOOT GATE — 0 of 7, NOT OWED.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. `npm run boot:check` was NOT run, and
  that is derived rather than skipped.
- **DOCS GATE — exit 1, FIRES on 5 of 7, THREE suites**, invoked
  DIRECTLY from the repo root with root-relative arguments, **never
  through `xargs`**. Owed: `npm test from app/`, `npm test from
  tools/e2e/`, `npx vitest run from lib/parser/` — **all three run and
  green above**. The census reports **13 derived readers across 4
  suites** (was 12) and **0 frontmatter issues**; the thirteenth is
  `tools/e2e/tests/range-rule.spec.ts` via `call conventionsText()`,
  which is `T-091-s2`'s claim confirmed from the gate's own output.

**WHERE THE CARD IS WRONG, AND WHERE THIS PASS'S BRIEF WAS.**

- **The card's Verification section is wrong about its own drill
  hazard.** It says *"the document under test is a tracked file this lane
  is also editing, which is exactly the restore-versus-revert hazard
  T-092 carries."* This fence is `[tools/e2e]` and the lane's seven paths
  contain **no `docs/CONVENTIONS.md`** — derived, not read off the notes.
  The hazard is real for the DRILL (which must mutate a tracked file) and
  the answer is the detached worktree both passes used; it is not real
  for the lane. The executor reports the same and is right.
- **The card's DRAFTER'S NOTE still says "remove before landing"** and is
  still there. The executor left it deliberately and said so, for the
  integrator. Recording it so it is not lost twice.
- **The card says three files opened `docs/CONVENTIONS.md`** (and its
  head paragraph says two, then three). At this ref the gate answers
  **five** by name for that path and the census counts thirteen readers
  across all of docs/. That number went stale between filing and
  building, which is T-086's whole subject happening to this card too.
  Not a defect in the build; the reader prints no such count.
- **The brief's `634c405` phrasing** — *"the one merge whose tree differs
  from the mechanical merge of its parents"* — is right, and worth
  sharpening: `merge-tree` exits **0** there, so it is not a conflict
  resolution but an integrator writing a file that exists on neither
  side.
- **The doc's own words for the `bdada11` refusal are the one place this
  bullet understates itself.** It says a swallowing substitution *"hands
  you an EMPTY forecast"*. Measured here: `git merge-tree --write-tree
  bdada11^1 bdada11^2` exits 1 and **still prints a tree oid on its first
  line** (`4556eeb…`, the conflicted tree) followed by the conflict rows,
  so `TREE=$(…)` captures a multi-line value whose first line looks
  exactly like a clean answer. The costume is better tailored than the
  sentence claims. Not this card's to fix — the reader checks the exit
  code the doc promises and gets it — but a re-deriver who greps for
  "empty" will not find the failure they were warned about.
- **A scratchpad collision, reported because it nearly corrupted this
  pass.** A file this session wrote under a generic name
  (`prescribed.txt`) was **replaced mid-pass by another live session's
  file of the same name** — it came back holding T-107's lane paths. The
  brief warns about exactly this and it happened anyway. Every range and
  gate figure above was re-derived from scratch into per-lane-named files
  afterwards, and the numbers were unchanged; but a pass that had not
  re-checked would have reported another lane's diff as this one's.

**PROCESS.** Nothing was merged, no `done` stamp written, no worktree of
this lane removed, and **the card's frontmatter was deliberately not
touched** — `verifier:`, `verified_by:` and `review:` stay empty for the
integrator, whose call the provenance class is. The lane's own worktree
was never written to: the drill lived in a detached
`/Users/ujju/Projects/drill-T-091-verify`, restored and removed. Scratch
ports **15300–15303** were `lsof`-read FIRST and bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` in that order before use, and all
four confirmed free afterwards. Port **1420** was read with `lsof -nP
-iTCP:1420 -sTCP:LISTEN` and nothing else: holder `node` pid **88948**,
one socket `TCP [::1]:1420 (LISTEN)`, unchanged throughout; that tree was
never entered. No `pkill`, no `cargo clean`, no `npm ci`. The untracked
`z` was left alone.

**TWO NON-BLOCKING SUGGESTIONS** are filed rather than folded into this
verdict: **`T-091-s5`** (the reader's trust boundary is real, unstated,
and dangerous only if the shape is copied to a document this repository
does not own) and **`T-091-s6`** (the three equivalence classes above,
so the next drill does not spend an hour rediscovering them).

**APPROVED.** The card asked for a reader that DERIVES, and this one
does — proved by moving figures in the document and watching the
expectation follow, not by reading the code and believing it. Twenty-one
document mutants were applied and every one that changed a meaning was
killed, each with a finding in its own words. Every published figure in
the paragraph reproduces at the ref it names. The one place the reader
declines to fail — GRAPH REGEN's flip figures under a trigger that moved
after they were measured — is the right call, is disclosed loudly on
every run, is fenced by a monotonicity assertion that would catch a mixed
derivation, and reds outright in the one direction that would be a real
defect.

## Integration

Merged 2026-08-25 by a third hand that neither built nor verified this
card. Main-before **`41900d6`**, lane tip **`1e134b1`**, merge
**`ca5fb96`**, checkpoint the commit after it. `review: same-model` per
T-104's ruling SEVEN — the independence that pays is INFORMATIONAL, not
model diversity.

**THE RULING THIS CARD TURNS ON, CARRIED HERE BECAUSE IT IS THE
SUBSTANCE.** The bullet's flip figures were measured before GRAPH REGEN's
trigger gained `*.rs` at `e1f3023`, so **they carry their ref and not
their trigger**: at the refs they name GRAPH REGEN flips **5 of 5**;
under the trigger as it stands the same derivation is **1 of 1**, and the
headline *"thirteen flips in fifteen chances over twelve merges"* becomes
**9 / 11 / 8**. The lane DISCLOSED rather than re-derived and the
verifier ruled for it on four grounds. **The decisive one**: the only
compliant repair under the alternative is to overwrite `5 of 5` with
`1 of 1`, **which destroys the five merges the whole correction rests on
— a gate that launders history.** Those five were real flips when they
happened, and four of them stop being counterexamples only because a
trigger widened afterwards. The other three grounds: the card had already
ruled one variable over (its own 31-vs-30 fixture holds that a figure and
the command producing it are ONE claim — substitute *trigger* for *range
spelling* and the sentence is unchanged in force); re-binding the trigger
to HEAD while leaving the merge range at `ddcc8bb` evaluates a THIRD
expression mixing vintages, which is this bullet's own named error; and
it would never terminate, redding paragraphs nobody edited on whatever
lane is nearest.

**AND DISCLOSURE ONLY WINS BECAUSE THE LANE PAID FOR IT.** The note
prints on **stdout on every run** — observed here in the full 171-test
run, stamped with this integration's own ref: *"range-rule DISCLOSURE
[flip-counts-carry-their-trigger]: /Users/ujju/Projects/nputer @ ca5fb96
… 5 of 5 at that ref, 1 of 1 under the trigger on disk."* The arm
**asserts monotonicity** (a wider trigger can only lower the not-owed
count and can add no flip that was not one before) and it **REDS if the
trigger ever NARROWS**, which is the one direction that is a genuine
defect and is GRAPH REGEN's own argument. The verifier says plainly that
silence would have lost. That is `T-091-s3`, whose residue — one clause
naming the trigger beside the ref — is a `docs/CONVENTIONS.md` edit that
**T-104 holds right now**, so it is routed rather than taken here.

**THE RANGE, AT MY OWN REFS, NOTHING INHERITED FROM THE BRIEF.**
`git merge-tree --write-tree 41900d6 1e134b1` exit **0** (read from `$?`
BEFORE the substitution), tree `b8e05dca…`; prescribed
`git diff --name-only 41900d6 <TREE>` = **9**; three-dot = 9; main's
advance `c4c15c8..41900d6` = **70**; intersection **EMPTY**; forbidden
two-dot = **79**, and 9 + 70 = 79 with the union byte-identical to the
two-dot set under `diff`, so the two are disjoint as SETS and not merely
as counts. **The forbidden form overstates by 8.78x, the widest ratio
this project has recorded.** The merge's own diff `41900d6..ca5fb96` is
**9**, identical to the forecast, and `git rev-parse HEAD^{tree}` equals
the forecast tree byte for byte — **nothing was written into the merge
commit**, which is criterion 12's own ritual practised at the merge that
lands the card asking for it to be written down.

**THE CARD'S OWN CRITERION, MET INSIDE THIS FENCE, WOULD HAVE
MANUFACTURED ITS OWN COUNTEREXAMPLE.** Main's 70-path advance under this
lane includes **`docs/CONVENTIONS.md`** — the document under test, +62/−18
lines by T-086's merge. The two sets stayed disjoint *only* because the
fence is `[tools/e2e]`. Had the lane widened it to satisfy criterion 12,
the two sides would have touched the same path and the three-dot form
would have stated the lane's edit against the branch POINT and silently
dropped main's 62 new lines. Re-derived here: main's edit lands in THE
FOUR WALKS and the DOCS GATE bullets and **not** in the RANGE RULE bullet,
so nothing the reader computes moved — which is why the suite is green
and not why the fence was right.

**FOUR THINGS THE CARD AND THE DISPATCH BRIEF GOT WRONG.**

1. **The card's Verification section is wrong about its own drill
   hazard.** It says *"the document under test is a tracked file this
   lane is also editing"*. Derived here: the lane's paths contain **no
   `docs/CONVENTIONS.md`**. The hazard is real for the DRILL and the
   answer is the detached worktree both passes used; it is not real for
   the lane. Executor and verifier agree and both are right.
2. **The DRAFTER'S NOTE said "remove before landing" and was still
   there**, left deliberately by the executor for the integrator.
   Removed by this checkpoint.
3. **The reader count.** The card says three files open
   `docs/CONVENTIONS.md` (its head paragraph says two, then three). At
   **my** ref the gate answers **FOUR by name** — `kit.rs`,
   `docs-input-gate.spec.ts`, `range-rule.spec.ts`,
   `workflow-parity.spec.ts` — plus TWO whole-`docs` readers
   (`shell-frame.spec.ts`, `window-contract.spec.ts`) that also reach it,
   so SIX in total. **The brief's "FIVE by name" does not reproduce
   here.** The census is **13 derived readers across 4 suites** (was 12
   on main before this merge), and the thirteenth is
   `range-rule.spec.ts` itself via `call conventionsText()` — which is
   `T-091-s2` confirmed from the gate's own output, and T-086's whole
   subject happening once more to the card that names it.
4. **The brief's GRAPH REGEN derivation.** It reasoned that the trigger
   does not fire because `.mjs` is not in the suffix list. That is true
   of `range-rule.mjs` and irrelevant: `tools/e2e/tests/range-rule.spec.ts`
   is a `.ts` outside `docs/`, so the trigger **FIRES, 1 of 9**. The
   verdict is the same — exit **0, CURRENT** — but it was reached by
   asking the gate, not by predicting from the suffix list, which is what
   that bullet requires.

**GATES AND SUITES ARE IN THE CHECKPOINT**, derived at this merge and not
copied: GRAPH REGEN fires 1 of 9 and answers exit 0 CURRENT; BOOT GATE is
**NOT OWED, 0 of 9**, derived rather than skipped; DOCS GATE is exit 1 on
7 of 9 naming THREE suites, all three run and green.
