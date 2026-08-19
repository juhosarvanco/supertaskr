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
verified_by: claude-opus-5 @T-083-verify
review: same-model
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

### 2026-08-19 — REJECTED (claude-opus-5 @T-083-verify, review: same-model)

**One defect, one phrase wide, and it is in the one place this card
cannot afford one: a figure that does not survive its own stated
derivation.** Everything else — every commit, every count, the
recommendation itself — re-derived cleanly and independently. This is a
narrow rejection with a one-line fix, not a rebuild.

**Range derived, not quoted, and the lane is its own worked example.**
Main moved under this review (T-082 merged at `7a37b37`), so the two
forms stopped agreeing exactly as the bullet predicts. Measured at
`7a37b37`: `git diff --name-only main 886e64e` returns **20** paths,
six of them Rust and TypeScript this lane never opened
(`app/src-tauri/src/agent/runner.rs`, `app/src/lib/agent-store.ts`,
`tools/e2e/tests/resume-fallback.spec.ts` among them) — a docs-only lane
reported as firing BOTH gates. `main...886e64e` and
`git merge-tree --write-tree main 886e64e` (exit **0**) each return the
correct **6**, all under `docs/`. The fence `[docs/CONVENTIONS.md]`
holds; the rule this card writes is the reason I can say so.

### THE DEFECT — "byte-for-byte **30**" is a name-only score wearing a byte-level label

The bullet reads: *"the merge-tree forecast reproduces the merge's later
diff byte-for-byte **29** times, three dots **30**, and the pre-merge
two-dot form **3**."* Re-derived at `94ee306^..ddcc8bb`, 31 merges, both
metrics, comparing each forecast against `git diff M^1 M`:

| metric | merge-tree | three dots | pre-merge two-dot |
|---|---|---|---|
| `--name-only` sets identical | **29** | **30** | **3** |
| full patch identical (`cmp`) | **29** | **24** | **3** |

**29 and 3 are metric-independent; only the 30 moves.** Under the metric
the sentence names, three dots scores **24**, not 30 — and forgiving
blob-hash `index` lines only lifts it to **25**, because six of its seven
patch losses carry real content divergence (`91ab46e`, `827511e`,
`634c405`, `bdada11`, `64469dd`, `f4b38c8`; only `3b0d974` is metadata
alone). The bullet uses "byte" precisely eleven lines earlier —
*"BYTE-IDENTICAL under `cmp`"* — so a reader is entitled to read it
precisely here, and a reader who re-derives as the same paragraph
instructs (*"DERIVE THE LIST, NEVER QUOTE IT"*) gets 24 and concludes
the doc is wrong. **That is this file going stale inside the document
correcting it — T-078-s7's shape, reproduced by the card that cites it.**

**The recommendation is right and must not change.** The brief's worry —
that recommending merge-tree at 29 over three dots at 30 prefers an
argument over a measurement — is the opposite of the truth. Under the
stated metric merge-tree wins outright, **29 to 24**, and the card's own
prose reason ("three dots answers a proxy question") is exactly what the
byte-level number measures: same path set, different content, because
the merge combines both sides' hunks in one file. **The mislabel hides
the card's strongest evidence and makes its central recommendation look
unsupported by its own table.** That is why this is a rejection and not
a nit.

**FIX (in-fence, one line):** say which metric. Either *"reproduces the
merge's later diff path-for-path 29 / 30 / 3, and byte-for-byte
29 / 24 / 3"*, or drop "byte-for-byte" for "path-for-path". Both merge-
tree losses are already named correctly and neither figure moves.

The two merge-tree losses, confirmed exactly as written: `bdada11`
(T-014) where `merge-tree --write-tree` exits **1** with a conflict
report, and `634c405` (T-028) where no pre-merge form can predict —
verified independently at 27 forecast against 28 actual, the odd path
being `tools/e2e/tests/window-contract.spec.ts`, which differs from
main-before by 13 insertions / 3 deletions and from the branch tip by
405 insertions, with `merge-tree` exiting **0**. T-083-s4 is correct in
every particular.

### The falsification list, derived from the graph rather than read

Independently, from `git rev-list --first-parent --merges 94ee306^..ddcc8bb`,
matching each side against each gate's own trigger:

**31 merges. 15 chances. 13 flips over 12 distinct merges. Zero reverse
flips.** BOOT GATE is not owed **10** times and the naive range fires on
**8**; GRAPH REGEN is not owed **5** times and it fires on **5 of 5**.

- BOOT (8, chronological): `59558de` T-030 · `3b0d974` T-045 ·
  `f58fc2b` T-054 · `20c45d4` T-055 · `7c6c5aa` T-058 · `79ae34a` T-076
  (0/5) · `fed70a2` T-078 (0/6) · `4683566` T-080 (0/4)
- GRAPH (5, chronological): `3f2eb1e` T-047 · `91ab46e` T-060 ·
  `38886d3` T-043 · `7e3e8b5` T-069 (0/18) · `fed70a2` T-078 (0/18)

**Every hash, every task id, every parenthesised pair and the
chronological-and-by-gate ordering match the merged text exactly.** The
universal holds too: **zero** merges where the naive range says a gate
is not owed while the prescribed one says it is, and the pre-merge
two-dot set is a **superset of the merge's path set at all 31 of 31**
merges — so "only ever adds paths" is measured, not asserted.

Also re-derived and exact: T-027 at `dc3ef5b` — **9 / 36 / 27**, and all
27 extras really are `nputer-index` under
`app/src-tauri/crates/nputer-index/**` plus `Cargo.lock` (criterion 6:
the example is re-measured and RETAINED, not deleted or softened).
T-078's lane at `d92dceb`/`d219482` — **76 / 16 / 16**, and `fed70a2`
itself **16**. T-080 — `--is-ancestor` exit **0**, then **12 / 12 /
60 / 12**, a 48-path swing off the right-hand ref alone.

**T-083-s1 is confirmed against the committed archive.** `cb3aa31` says
*"T-076 (GRAPH REGEN 0 vs 5)"*. At `79ae34a` GRAPH is **13 against 13**
and it is BOOT GATE that is **0 against 5**. The figure is right and the
gate is wrong. The error is older than that checkpoint — the same
attribution appears in the text `cb3aa31` replaced — so it has stood
across two checkpoints, and s1 is the right place for it.

### THE RULING: is a card whose product is unfalsifiable an acceptable card?

**Yes — but not for the reason offered, and "s2 is filed" is not the
answer.** The defence in the notes is that prose in a conventions file
has no mechanical reader. **That defence is false for this bullet's
factual half, and I can show it rather than argue it.**

I derived **ten mutants from the acceptance criteria**, not from the
executor's pins, applied them together, read every one back out of the
file, and ran every gate:

| # | criterion attacked | mutation | tree |
|---|---|---|---|
| M1 | c1 correct before the merge too | table's executor row → `<main tip>..HEAD` | GREEN |
| M2 | c2 a COMMAND not prose | "build the tree" → "just reason about it" | GREEN |
| M3 | c3 trap named correctly | `merge-base(A,B)..B` → `..A` (now false) | GREEN |
| M4 | c4 SHALL NOT be softened | `Not "rarely"` → `Rarely … sometimes` | GREEN |
| M5 | c5 two costs distinguished | whole paragraph deleted | GREEN |
| M6 | c6 T-027 still correct | 9/36/27 → 7/12/5 | GREEN |
| M7 | c7 figures carry their ref | `dc3ef5b` stripped | GREEN |
| M8 | s1's own defect | T-076 relabelled GRAPH REGEN | GREEN |
| M9 | the headline count | THIRTEEN/TWELVE → FOUR/FOUR | GREEN |
| M10 | the zero-reverse universal | "NO merge" → "THREE merges" | GREEN |

`cargo test` **343 passed / 0 failed / 3 ignored, exit 0** (unchanged,
including `snapshot_version_matches_the_live_method_stamps`);
`npm test` in tools/e2e **91 passed, exit 0**, workflow-parity **14/14**;
`lint:tokens` clean exit **0**; `index --check` CURRENT exit **0**;
parser **263 passed** exit **0**. **Ten mutants, zero survivors killed.**
The executor's rounds 3 and 4 reproduce, from a mutant set it never saw.

**Then I built the reader, to find out whether "no mechanical reader" is
a property of the claim or of the fence.** Ninety lines of Node: it
DERIVES the flip lists, the counts, T-027's figures and the reverse-flip
universal from `git`, PARSES what the bullet claims, executes the
three-dot identity rather than trusting it, and compares. The two sides
share no constant — `git` is one side, the doc is the other, which is
the one-sidedness the POISON DRILL bullet requires.

**It is GREEN on the merged file** — *"31 merges re-derived; doc agrees
on every figure"* — **and RED on the poisoned one, with 12 findings
covering all ten mutants**, naming each by name (*"T-027 prescribed: doc
says 7, git says 9"*, *"BOOT segment names another gate: GRAPH REGEN"*,
*"reverse-flip claim: doc says some, git finds 0"*). Not committed; it
is evidence for the ruling, and it belongs to whoever takes s2.

So the ruling, in three parts:

1. **The card DID owe a reader, and s2's "size-M card of its own" is an
   understatement of what is available and an overstatement of what it
   costs.** Every figure in the bullet is a `git` derivation over commits
   that are immutable once merged. I wrote a working one in a single
   pass. What it should assert is exactly what I asserted: the flip
   lists BY GATE (M8 is the mutant that matters — it is s1's error, and
   only a gate-aware parse catches it), the four headline counts, T-027
   at its ref, the reverse-flip universal, the three-dot identity by
   EXECUTION, and the presence of the merge-tree command and the
   `Not "rarely"` correction.
2. **It was NOT buildable inside this fence, and that is why the card is
   still acceptable.** `touches: [docs/CONVENTIONS.md]`. A reader must
   live in `tools/e2e/tests/`. The executor could not write it without
   breaching the fence, and this file's own BOOT GATE bullet prescribes
   precisely what it did: *"a red the executor's own fence forbids fixing
   is still news … file it as a suggestion and say so in the notes."*
   Filing s2 is the method's own answer, not an evasion.
3. **But the unfalsifiability is an artefact of the FENCE, not of the
   content, and s2 should say so in those words.** "Some claims have no
   mechanical reader" is true only of this bullet's judgement half — *the
   ban has to name the PAIR, not the punctuation*; *the two costs deserve
   different weight*. Its factual half is not merely checkable, it is
   checkable more cheaply than the CI-command derivation `workflow-parity`
   already runs. The card is *"reproducing the very failure it
   documents"* only if that distinction goes unrecorded. **Record it and
   the card is honest; leave it and the archive learns the wrong
   lesson** — that prose is inherently undefendable, when what actually
   happened is that a one-file fence was drawn around a claim whose
   defence lives in another tree. That is a dispatch observation, not an
   executor failure: the executor cannot widen its own fence.

### Criteria, each attacked literally

1. **MET.** Two labelled rows, two readers, two commands. The bullet
   leads with *"it is the RIGHT-HAND endpoint that decides the left one"*,
   which is the actual mechanism and survives both cases.
2. **MET.** `merge-tree --write-tree` is given as a runnable command and
   named as the recommendation, with the reason stated. The exit-code
   warning (*"a command substitution that swallows it hands you an EMPTY
   forecast wearing the costume of a clean gate"*) is right and I
   reproduced it: `bdada11` exits **1**.
3. **MET, and the naming is correct** — verified by execution, not
   reading: at `ddcc8bb`/`886e64e`, `A...B` and
   `$(git merge-base A B)..B` return identical sets. **It cannot be read
   as forbidding three dots everywhere**: the paragraph turns on
   *"What makes three dots harmless before the merge is not the notation
   but the right-hand endpoint"*, and the ban two paragraphs up is scoped
   to `<merge-base>..<the merge commit>`. The bold opener taken alone is
   over-broad, but the misreading **fails safe** — a reader who concludes
   "never three dots" reaches for the table and gets merge-tree, which is
   correct. Left as a readability note for the @human question the card
   already raises.
4. **MET.** Three counterexamples by task id, mechanism named, and
   `Not "rarely"` explicitly refuses the forbidden softening — the
   measured rate is stated as more-often-than-not, which my derivation
   confirms (13 of 15).
5. **MET.** Presentation and correctness separated, with the executor's
   false red named as the worse of the two.
6. **MET.** Re-measured at `dc3ef5b`, retained, and explicitly framed as
   right *at the merge* — the distinction the card exists to draw.
7. **MET.** Every count in the merged text carries its ref. Swept all
   123 lines: T-027→`dc3ef5b`, 76/16/16→`d92dceb`/`d219482`/`fed70a2`,
   T-080's four→`99791ea`/`4683566`/`72bc98a`, 31/29/30/3 and the flip
   list→`94ee306`/`ddcc8bb`, s1's 13-vs-13→`79ae34a`. **One exception,
   recorded not charged:** *"a trigger set 4x too wide"* carries no ref
   of its own, but it is 36/9 from the T-027 measurement reffed in the
   same bullet, and it is inherited wording.

### Adjacent-feature and security sweep

Docs-only: **zero** non-`docs/` paths in the diff, no manifest, lockfile,
workflow or dependency change, no secret-shaped or executable content in
the added lines. The only `1420` in the diff is the card recording the
PORT RULE observance, which I confirmed independently — `lsof -nP
-iTCP:1420 -sTCP:LISTEN` and nothing else; `node` pid **82549** on
`[::1]:1420`, exactly as written. Scratch ports bind-probed on both
stacks (14520 free on IPv4 and IPv6).

**The two readers claim reproduces, re-derived rather than taken.**
Grepping every `.rs`/`.ts`/`.tsx`/`.mjs` for a real read: exactly two
files open `docs/CONVENTIONS.md` — `kit.rs:448` and
`workflow-parity.spec.ts:75`. `genesis-derive.ts:313` names the path as
an artifact constant and performs no filesystem read at all. **And
`workflow-parity` really does read only `## Build & test`**: I checked
all seven `readConventions()` call sites, and every one funnels through
`buildAndTestSection`, whose `split(/^## /m)` discards everything else.
The new bullet lands in `## Gotchas` at lines **372–494**, well after
that section, and introduces no collision with the fixtures' first-
occurrence `replace` anchors (`## Build & test`, `npm run typecheck`,
`npx vitest run` each still occur exactly once). Both gate bullets'
cross-references resolve — the RANGE RULE is physically above both, and
its own "the two gate bullets below" is correct.

**One correction to the notes, immaterial to the verdict:** the section
digest is given as `18583f85…`. I cannot reproduce that value by any
extraction I tried; the spec-identical extraction hashes to
`0662c279efb209f8341d39fa9df5f5ab0e0976157352718058e099a4d8feefb9` and
the heading-inclusive one to `c677cf4d…`. **The claim the digest
supports is nonetheless TRUE and independently confirmed**: the section
is byte-identical at `ddcc8bb`, `886e64e` and `7a37b37`, 12817 bytes,
same hash at all three. Only the quoted digit string is unreproducible.
The U+00B7 count of 21-before-21-after reproduces exactly.

### Gate results — every exit code, read unpiped

| gate | result | exit |
|---|---|---|
| `cargo test` (plain, incl. doc-tests) | 343 passed, 0 failed, 3 ignored, 15 result lines | **0** |
| `cargo run -p nputer-index -- index --check --root ../..` | graph.json CURRENT | **0** |
| lib/parser `npx vitest run` | 263 passed (12 files) | **0** |
| lib/parser `npx tsc --noEmit` | — | **0** |
| tools/e2e `npm test` | 91 passed, workflow-parity 14/14 | **0** |
| tools/e2e `npm run typecheck` | — | **0** |
| tools/e2e `npm run lint:tokens` | clean, TOKEN 119 / CONTROL 546 | **0** |
| tools/e2e `npm run lint:tokens -- --selftest` | — | **0** |

Run in the worktree with `node_modules` symlinked from the main checkout
and `CARGO_TARGET_DIR` pointed at scratch — **no `npm ci`, no
`npm install`, nothing written to the main checkout**, and the symlinks
removed afterwards (`git status` clean). No gate failed to run; had one,
it would be reported here as news.

**Restoration proved three ways** after the drill: working file
`a2aed330d5e81c6ed018fdfb3099d36d78a0ba168645f77b270aa91a817adf26`,
`git show HEAD:docs/CONVENTIONS.md | shasum -a 256` identical, and
`git diff -- docs/CONVENTIONS.md` empty at exit **0**.

### Not blocking

- The `4×` of the old sentence became an ASCII `4x` in the new one. No
  gate covers it and it is outside `## Build & test`, but this file's
  typography is load-bearing elsewhere and the drift was silent.
- T-083-s3's non-emptiness floor is a real and well-drawn shape; I hit
  the same class in my own instrument (my first parse threw on a missing
  anchor rather than passing vacuously, which is the behaviour s3 asks
  for). Worth the ordinal.
- `Absorbs: T-078-s9` checks out: the file was removed at `99791ea`, the
  commit that filed this card, and is absent at both `ddcc8bb` and
  `886e64e`.

**To clear this verdict:** name the metric on the 29/30/3 sentence. That
is the whole of it.
