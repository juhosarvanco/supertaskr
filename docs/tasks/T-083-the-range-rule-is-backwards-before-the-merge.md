---
id: T-083
title: The range rule is right at the merge and inverted before it — and the sentence saying it never changes a gate's answer is now false three times
feature: F-06
milestone: 4
priority: 41
size: M
status: verifying
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-078-s9 (fifth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

**Two defects in the bullet that exists to stop people getting this
wrong, both found by the machine getting it wrong.** T-078 merged at
`fed70a2` to make CONVENTIONS describe the machine that exists; both of
these survived it, and one of them was falsified *by that very merge*.

## Defect 1 — the rule is stated for the integrator and handed to the executor

`docs/CONVENTIONS.md:403` states, in bold:

> the merge's diff means `<main-before-the-merge>..HEAD`, NEVER
> `<merge-base>..HEAD`

**Correct at the merge, inverted before it.** At the merge, `HEAD` is
the merge commit and contains both parents, so `<merge-base>..HEAD` does
carry everything main did in the meantime — the bullet's reasoning and
its T-027 example (9 files vs 36) are exactly right. **Before the merge
there is no merge commit.** `HEAD` is the branch tip, `git diff main
HEAD` is a symmetric comparison of two divergent tips, and main's own
newer work appears in reverse, as though this branch had modified it.

And the same bullet, twenty lines down, explicitly puts an executor in
the "before" case: *"THE EXECUTOR RUNS IT TOO, on the same trigger,
before handing off."*

Measured on T-078's own branch — nine `.md` files under `docs/` and
nothing else (T-078-s9):

| range, as an executor would run it | paths | BOOT | GRAPH |
|---|---|---|---|
| `git diff main HEAD` — the bullet's notation | **44** | FIRES (5) | FIRES (13) |
| `git diff main...HEAD` | 9 | 0 | 0 |
| `git diff main <merge-tree>` | 9 | 0 | 0 |

A docs-only branch is reported as having rewritten a Rust crate and the
parser library — **the same lie the bullet was written to prevent,
produced by following the bullet.**

**Measured a second time, on this pipeline's own architect.** The T-078
dispatch brief quoted the rule correctly and then computed
`d92dceb...d219482` — three dots, which is *definitionally*
`$(git merge-base A B)..B`, the labelled trap. It reached the right
16-file answer by the forbidden route. The two-dot form the brief
prescribed returns **76** paths pre-merge and misattributes main's own
history to the branch; the integrator reading that list drafted a false
alarm (that `d92dceb` had put `app/package.json` and five Rust files on
main outside any merge) and refuted it only by measuring `d92dceb`
against its own parent — six paths, all `docs/`.

**A rule whose notation is unsafe in the case it explicitly assigns is
not a rule, it is a trap with a warning label.**

**THE MECHANISM, ISOLATED AT T-080's MERGE — and it is sharper than
"imprecise".** At the merge, `<main-before>` is an ancestor of the merge
commit, so `git merge-base <main-before> <merge-commit>` **is
`<main-before>`** (`--is-ancestor` exit 0). Two dots and three dots
therefore **collapse onto the same set** — measured at `4683566`, both
return the same 12 paths. Before the merge they differ by main's entire
advance: 60 versus 12 at the same pair of refs.

So the prescribed and forbidden forms are *indistinguishable* exactly
where the rule is addressed, and differ *only* where the rule says
nothing. **The rule is not merely imprecise — it is true only where
nobody applies it**, which is why quoting it correctly does not protect
you and why three-dot survives as a plausible-looking refinement.

## Defect 2 — a sentence that is now false three times

`docs/CONVENTIONS.md:412`:

> It has never yet changed WHETHER the gate fires — both derivations
> fired all six times

Counterexamples, all from this week, all measured by integrators:

| merge | prescribed | naive |
|---|---|---|
| T-076 | 0 | 5 |
| T-069 | 0 | 18 |
| T-078 | 0 | 18 (GRAPH) **and** 0 vs 6 (BOOT) |

T-078 is the one that matters: **the BOOT GATE bullet's own claim was
falsified by the merge that shipped it.** It is not accidental — any
lane cut from a checkpoint whose main has since advanced with work in
the other language reproduces it, and lanes are now routinely fenced to
one tree.

The consequence is worse than a stale sentence. The bullet's stated
justification for care is that the naive range *"changes what you tell
the human the merge touched"* — a presentation concern. It now also
changes **whether a gate is run at all**, which is a correctness
concern, and the two deserve different weight.

## Acceptance criteria

- THE range rule SHALL be stated in a form that is correct **both** at
  the merge and before it, or SHALL be split into two explicitly labelled
  rules addressed to the two readers the bullet already names. A single
  notation presented to both readers SHALL NOT stand.
- **THE SAFE PRE-MERGE FORM SHALL BE GIVEN AS A COMMAND, NOT AS PROSE**,
  and the card SHALL state which of the three measured forms it is and
  why. `git diff main <merge-tree>` needs no merge commit and was the
  row that settled T-078-s9 — the card SHALL say whether it is
  recommending that, three-dot, or something else, and SHALL NOT leave
  the reader to infer it.
- **THE THREE-DOT TRAP SHALL BE NAMED EXPLICITLY.** `A...B` is
  `$(git merge-base A B)..B` — it IS the forbidden range under a
  notation that looks like a refinement of the prescribed one. This
  pipeline's own architect fell into it while quoting the rule. A rule
  that says "never `<merge-base>..HEAD`" without naming the notation
  that silently spells it is incomplete.
- THE falsified sentence SHALL be corrected to what is now true, with
  the three counterexamples cited by task id, and the mechanism named
  (a lane fenced to one tree, cut from a checkpoint whose main advanced
  in the other). **It SHALL NOT be softened into "rarely"** — the
  measured rate this week is three of three.
- THE distinction between "changes what you tell the human" and
  "changes whether a gate runs" SHALL be stated, since the bullet
  currently justifies the rule only by the weaker one.
- IF the corrected text would make any existing worked example wrong
  THEN the example SHALL be re-measured rather than deleted — T-027's
  9-vs-36 is the bullet's oldest evidence and is still correct **at the
  merge**, which is exactly the distinction this card is drawing.
- **THE CARD SHALL VERIFY ITS OWN FIGURES AT A NAMED REF.** Every count
  in the merged text SHALL carry the commit it was measured at, because
  this file has now gone stale inside the document correcting it
  (T-078-s7) and no corpus figure in it survived a week.

Verification: headless — the parser suite (CONVENTIONS is read off disk
by `kit.rs`'s `snapshot_version_matches_the_live_method_stamps` on every
`cargo test`), `workflow-parity.spec.ts` which derives CI parity from
this file, and a re-measurement of all three ranges on a fixture
repository reproducing the pre-merge and at-merge cases. Every corrected
figure poisoned to its old value and shown RED. @human: whether the
split rule reads as one idea or two.

## Implementation notes

Built by `claude-opus-5` on `task/T-083-range-rule`, cut from `ddcc8bb`.
**Every figure below carries the ref it was measured at**, per the last
acceptance criterion, and every one was re-derived from the tree rather
than copied from this card or from a checkpoint — which was the right
call, because three of the card's own figures turned out to be measured
at a ref that no longer holds and one recorded counterexample names the
wrong gate.

### What changed

**One file, `docs/CONVENTIONS.md`, +134/-17.** The range rule is
PROMOTED OUT of the BOOT GATE bullet into its own Gotchas bullet, THE
RANGE RULE, placed immediately before GRAPH REGEN so both gates can
point UP at it. GRAPH REGEN and BOOT GATE each keep a one-clause
pointer; BOOT GATE keeps its T-027 example by reference rather than
losing it. Nothing outside those three bullets moved.

**The rule is now one idea in two positions, not two rules**, which is
the @human question this card asked. Both gates are addressed to two
readers and BOOT GATE names the second one itself. The single sentence
that makes it one idea: **the rule is about WHICH TWO COMMITS YOU
COMPARE, never about the notation, and it is the RIGHT-HAND endpoint
that decides the left one.** A two-row table gives the two commands.

### The two range derivations, reproduced on a fixture, dot counts stated

Fixture at `$SCRATCH/T083-exec-fixture` — a checkpoint, a docs-only lane
cut from it, main then advancing with Rust + a manifest + a `.tsx`, then
the merge. Torn down after use. Both cases, every dot count named:

| position | command | dots | paths |
|---|---|---|---|
| PRE-MERGE | `git diff --name-only <main> <tip>` | space form | 7 |
| PRE-MERGE | `git diff --name-only <main>..<tip>` | TWO | 7 |
| PRE-MERGE | `git diff --name-only <main>...<tip>` | THREE | 2 |
| PRE-MERGE | `git diff --name-only $(git merge-base <main> <tip>)..<tip>` | TWO | 2 |
| PRE-MERGE | `git diff --name-only <main> $(git merge-tree --write-tree <main> <tip>)` | space form | 2 |
| AT MERGE | `git diff --name-only <main-before>..<merge>` | TWO | 2 |
| AT MERGE | `git diff --name-only <main-before>...<merge>` | THREE | 2 |
| AT MERGE | `git diff --name-only <branch-point>..<merge>` | TWO | 7 |

**`git diff A..B` and `git diff A B` are the same command** — 7 and 7,
which is why the old notation was unsafe pre-merge in the plainest
spelling anyone would actually type.
**Pre-merge, three dots and the explicit merge-base form are
BYTE-IDENTICAL under `cmp`, exit 0.** So `main...HEAD` IS the range the
rule bans by name.
**At the merge, `git merge-base --is-ancestor <main-before> <merge>`
exits 0**, `merge-base(main-before, merge)` IS `main-before`, and two
dots and three dots return the same set — `cmp` byte-identical.
**And the merge-tree forecast taken BEFORE the merge is byte-identical
to the merge's own prescribed diff afterwards.**

Confirmed on real refs, not only the fixture. At T-080: `--is-ancestor
99791ea 4683566` exit 0; `99791ea..4683566` and `99791ea...4683566` both
**12**; `99791ea..72bc98a` (two dots, pre-merge) **60** and
`99791ea...72bc98a` (three dots) **12**. At T-078, main-before
`d92dceb`, tip `d219482`: two dots **76**, three dots **16**, merge-tree
form **16**, and the merge `fed70a2` itself **16**. The merge-tree
forecast is byte-identical to the merge's own diff at all four of
`fed70a2`, `4683566`, `79ae34a` and `dc3ef5b`.

**THE CARD'S OWN TABLE IS STALE AND WAS NOT COPIED.** It records T-078's
branch as 44 / 9 / 9. At the tip that actually merged, `d219482`, the
three forms read **76 / 16 / 16**. The card was measured at an earlier
branch tip; both are honest, neither carries a ref. This is the card's
seventh criterion catching the card.

### Which pre-merge form, and why merge-tree

Recommended: **`git merge-tree --write-tree`**, given as a command, per
criterion 2. The argument is not that three dots is wrong pre-merge — it
is right — but that three dots answers a PROXY question ("what has my
branch changed since it was cut") while merge-tree answers the gate's
own ("what will the merge's diff be"). Scored over the **31**
first-parent merges on main from `94ee306` through `ddcc8bb`, comparing
each pre-merge form against the merge's later prescribed diff:
merge-tree **29/31**, three dots **30/31**, pre-merge two dots **3/31**.

The two misses are both worth having found and both are in the doc:

- `bdada11` (T-014): `git merge-tree --write-tree` exits **1** and
  prints a CONFLICT report instead of a tree. That is news three dots
  does not give — but a command substitution that swallows the exit code
  yields an EMPTY forecast that looks like a clean gate. Filed as
  **T-083-s3**, because the lane's own first sweep fell into it and
  scored merge-tree "0 against a truth of 36".
- `634c405` (T-028): NEITHER form predicts, 27 against a truth of 28.
  The merge commit carries `tools/e2e/tests/window-contract.spec.ts`
  differing from BOTH parents while `merge-tree` on the same pair exits
  **0** — a clean merge with a hand edit inside it. Filed as
  **T-083-s4**; it is also the honest limit of any pre-merge forecast.

### The falsification list, derived rather than quoted

The brief said four; the card said three. **Derived from the git graph
at `ddcc8bb` there are TWELVE distinct merges and THIRTEEN flips**, over
the 31 first-parent merges since BOOT GATE's own merge `94ee306`. The
denominator that matters: the prescribed range says BOOT GATE is not
owed **10** times and the naive one fires anyway on **8**; it says GRAPH
REGEN is not owed **5** times and the naive one fires on **5 of 5**.

**BOOT GATE (8):** T-030 `59558de`, T-045 `3b0d974`, T-054 `f58fc2b`,
T-055 `20c45d4`, T-058 `7c6c5aa`, T-076 `79ae34a`, T-078 `fed70a2`,
T-080 `4683566`.
**GRAPH REGEN (5):** T-047 `3f2eb1e`, T-060 `91ab46e`, T-043 `38886d3`,
T-069 `7e3e8b5`, T-078 `fed70a2`.

So the sentence was not falsified this week — it had been false since
T-030's merge `59558de`, and three checkpoints running believed they
were recording the first exceptions. **Not softened to "rarely"**, per
criterion 4: when the derivations disagree at all, the naive one
manufactures a run more often than not. Reverse flips: **0** — every
error measured is in the OVER-firing direction, stated in the doc as a
property of this history rather than a guarantee.

**T-027's 9-vs-36 was RE-MEASURED, not deleted** (criterion 6). At
`dc3ef5b`, main-before `8120e0d`, branch point `e92056a`: boot trigger
**9** prescribed, **36** naive, difference **27** — exactly T-014's
indexer crate. The bullet's oldest evidence survives its own correction
unchanged.

**AND THE FOURTH RECORDED EXAMPLE NAMES THE WRONG GATE.** `cb3aa31`
lists T-076 under GRAPH REGEN. At `79ae34a` GRAPH is 13 against 13 and
BOOT is 0 against 5. The pair of numbers is right, the gate is not.
Filed as **T-083-s1** and corrected in the doc; STATE itself is outside
this fence and was not touched.

### Which claims have a live reader, and which do not

**Exactly two files open `docs/CONVENTIONS.md`**, verified at `ddcc8bb`
by grepping every `.rs`/`.ts`/`.tsx`/`.mjs` for a real read: twenty name
the path, eighteen only in comments. `workflow-parity.spec.ts` reads the
`## Build & test` section ONLY; `kit.rs`'s
`snapshot_version_matches_the_live_method_stamps` reads one substring
from gotcha one. The FOUR WALKS bullet's "CLOSED AT TWO" reproduces.

- **COVERED, and my edit stays outside it:** every command string and
  every `run from` marker in `## Build & test`. **The section is
  BYTE-IDENTICAL across this diff**, sha256
  `18583f8565be1d7b42ebcb7df84728f3b42112a10e01c5d142a403e34be870f1`
  before and after. The U+00B7 count is **21 before and 21 after**,
  file-wide.
- **COVERED:** the `currently v0.1.5` stamp. Untouched.
- **NOT COVERED — every single claim this card adds.** Nothing in the
  tree can check one figure in the new bullet. Filed as **T-083-s2**,
  with the shape of a fixable remedy (derive the flip list from `main`
  the way T-045 derived the CI command list) and an argument against the
  bad remedy (a fixture that greps for the digits).

### Poison drill

One-sided every time, mutated TEXT read back with `diff` against a
sha256'd baseline snapshot before each run, restored and PROVED by
sha256 — **four for four**, baseline
`a2aed330d5e81c6ed018fdfb3099d36d78a0ba168645f77b270aa91a817adf26`.

| # | one-sided mutation | read back | result |
|---|---|---|---|
| 1 | `npx vitest run` to `npx vitest --run` in Build & test (doc only; the spec's key untouched) | the one line | **RED** 3/14, exit 1, naming both sides |
| 2 | `currently v0.1.5` to `v0.1.6` (doc only; the Rust `const` untouched) | the one line | **RED**, exit **101**, `kit.rs:450` naming the string |
| 3 | five corrected figures at once: 9→7, 36→12, 31→41, 10→2, 8→1, which also breaks the arithmetic the prose states | five lines, nothing else | **GREEN everywhere** |
| 4 | the whole correction deleted, the falsified sentence reinstated verbatim — 32 lines replaced by 2 | the whole block | **GREEN everywhere** |

Rounds 1 and 2 prove the two readers are live and would have caught an
edit that strayed into their half. **Rounds 3 and 4 are the finding**:
parity 14/14 exit 0, `cargo test` exit 0, `lint:tokens` clean exit 0,
selftest exit 0, parser 263/263 exit 0 — with the correction deleted.

### Exit codes, every one read from `$?` unpiped

`FIXTURE_EXIT=0`, `GATES_EXIT=0`, `PREDICT_EXIT=0`,
`PARITY_EXIT=0` (14/14), `KIT_TEST_EXIT=0`, `PARSER_EXIT=0` (263/263,
12 files), `LINT_SELFTEST_EXIT=0` (49 TOKEN + 4 CONTROL samples, 71
walk-policy, 8 evidence-floor), `LINT_TOKENS_EXIT=0`.
Drill: `DRILL1_PARITY_EXIT=1`, `DRILL2_KIT_EXIT=101`,
`DRILL3_PARITY_EXIT=0`, `DRILL3_KIT_EXIT=0`, `DRILL3_LINT_EXIT=0`,
`DRILL3_PARSER_EXIT=0`, `DRILL3B_PARITY_EXIT=0`, `DRILL3B_KIT_EXIT=0`,
`DRILL3B_LINT_EXIT=0`, `DRILL3B_SELFTEST_EXIT=0`,
`DRILL3B_PARSER_EXIT=0`.
**ONE EXIT CODE WAS FIRST TAKEN THROUGH A PIPE AND IS RECORDED AS
RE-RUN**: the drill-3 `cargo test` was piped to `grep` on its first
attempt, caught immediately, and re-measured unpiped — `DRILL3_KIT_EXIT=0`.
The `cargo test` name filter was run `--all-targets` and the WHOLE
output read: **13 test binaries**, the name matches in exactly one
(`nputer_lib`), 1 passed and 116 filtered; every other binary reports 0
running. The tail alone would have shown `watch.rs`'s line.

### Corpora, both closed at their own refs

**CONTROL 542 at `ddcc8bb`** (re-measured in this worktree before
staging, not quoted) **to 546** with the four new finding cards staged:
542 + 4 additions − 0 deletions = 546, and the edit to `CONVENTIONS.md`
is a MODIFICATION so it moves nothing. **TOKEN 119 both sides** — this
diff adds no file under `app/src`, `app/test` or `tools/e2e`.

### The two gate derivations for THIS lane, derived rather than assumed

Computed by the recommended pre-merge command against main's tip
`ddcc8bb`, not by eyeballing the working tree:
`git merge-tree --write-tree ddcc8bb HEAD` exit **0**, tree
`282abb4c54aefe3449be2ff82dcbf7c640b404b5`, and
`git diff --name-only ddcc8bb <that tree>` is **6 paths**, all under
`docs/` — `CONVENTIONS.md`, this card, and four new
`docs/tasks/T-083-s*.md`. **BOOT GATE: 0 paths match `app/src-tauri/`,
`app/src/` or either manifest — DOES NOT FIRE. GRAPH REGEN: 0 paths are
`*.ts/*.tsx/*.js/*.jsx` outside `docs/` — DOES NOT FIRE.** Neither was
run, and neither is a skipped gate: the trigger set is empty, which is
the derivation the new bullet asks for rather than an assumption.

All three forms return the same 6 here — three dots and two dots agree
with the forecast because **main has not moved since this lane was
cut**, which is the one pre-merge case in which the old notation is also
safe. That is not evidence for it; it is the absence of the condition
that breaks it, and a sibling lane merging first is all it takes.

### For the verifier

- **The diff is docs-only and stays out of `## Build & test`.** The
  cheapest check is the section sha256 above; the second cheapest is
  `workflow-parity.spec.ts`.
- **Re-derive the twelve, do not trust the list.** The doc gives the
  two-command recipe. Disagreeing with me is the useful outcome; the
  numbers depend on how the two triggers are spelled as regexes, and I
  matched `app/src/` WITH the trailing slash so `app/src-tauri` is not
  double-counted, and `\.(ts|tsx|js|jsx)$` so `.json` and `.mjs` are
  correctly excluded.
- **The scope call worth arguing with:** I rewrote GRAPH REGEN's pointer
  sentence as well as BOOT GATE's. The card names one bullet, but the
  defective notation was written out in full in BOTH, and shipping a
  correction that the file contradicts eight lines earlier would have
  been the defect proving itself a third time.
- **What I did NOT do:** touch `docs/STATE.md` (outside the fence, and a
  checkpoint is a record of a moment), soften the correction, or add any
  test. T-083-s2 argues the test that would be worth having.

### Corrections to the dispatch brief, since it asked

1. **"There are now four falsifications."** There are **twelve**, and
   the earliest is T-030's merge `59558de`, weeks before "this week".
2. **"CONVENTIONS has three live readers … and the parser suite."** The
   parser does NOT read this file — the FOUR WALKS bullet says so and it
   reproduces. The parser reads my four new task cards, which is a real
   reader of this DIFF, and it is green at 263/263.
3. **The card's T-078 table (44 / 9 / 9)** does not reproduce at the tip
   that merged; **76 / 16 / 16** at `d92dceb`/`d219482`.
4. **`cb3aa31` attributes T-076's flip to GRAPH REGEN**; it is BOOT
   GATE. T-083-s1.
5. Confirmed as stated: `cb3aa31..ddcc8bb` is entirely under `docs/`
   (three files); `ddcc8bb` is main's tip; CONTROL is 542 there; 1420 is
   held by `node` pid **82549** on `[::1]:1420` and nothing on IPv4,
   read once with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and never probed.

## Verdicts
