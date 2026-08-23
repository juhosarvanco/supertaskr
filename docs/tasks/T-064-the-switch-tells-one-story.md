---
id: T-064
title: The switch tells one story — one reading of the folder, and the tree it carries survives
feature: F-03
milestone: 3
priority: 11
size: M
status: verifying
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-064
verified_by:
review:
---

Absorbs: T-042-s2, T-042-s3 (triage 2026-08-17). The suggestion files
are removed in the same commit as this card. Both are
`PickOutcome::Genesis` truthfulness at the same seam, both were filed
by T-042's executor and verifier respectively, and both want a RULING
between named arms rather than a hot-patch. Serialize app-shell.

Also absorbs T-063-s3 (fourth triage, 2026-08-19); its suggestion file
is removed in the same commit as this line. Same shape at a different
seam — the shell claiming more than it knows, closable only by choosing
between named arms. `startupStepPhrase("subscribe")` says *"the watcher
subscription was refused, so no file change can reach the board."* The
first clause is true. **The second is false whenever a refused
RE-subscribe leaves attempt 1's live subscription attached** — a state
`startup-recovery.test.ts` pins GREEN on purpose, because turning a live
watcher into no watcher in the name of retrying is strictly worse than
doing nothing. So the shell holds a subscribe failure while a live
`docs-changed` handler is attached, and tells the user the app cannot
recover on its own when the next file change will bring it up. They
correctly conclude they must retry or reopen; they need not.
Reachability is low but not zero — a refused invoke followed by a
refused listen — which is exactly the sort of state that shows up in a
real bug report and nowhere else.

THE THREE ARMS, none free: **(a)** a `resubscribe` step distinct from
`subscribe`, with copy saying the watcher is still live — most honest,
adds a fourth step to a type that just grew a third; **(b)** derive the
sentence from whether a subscription is HELD rather than from the step,
which the store already knows, roughly six lines, but it puts a second
fact about the subscription into shell state; **(c)** weaken the copy
for all subscribe failures, losing the consequence clause that makes
T-050's wording useful. **(b) is preferred and the ruling SHALL be
recorded before implementation**, alongside the @human copy judgment
T-063 already reserved.

TWO MEASUREMENTS OF ONE FOLDER, TAKEN AT DIFFERENT MOMENTS.
`probe = probe_plan(&canon)` runs BEFORE the rendezvous because its
answer decides whether genesis is offered at all; `snapshot =
build_snapshot(&canon, seq)` runs AFTER the ack and after the commit
because collecting earlier could produce a snapshot older than the
emit baseline. Between them sits a channel round trip with a 10 s
timeout. Write `docs/ROADMAP.md` in that window and the probe says "no
plan, offer genesis" while the snapshot ships a tree WITH a roadmap —
the interview screen over a folder that now has a plan, the exact
state criterion 5 exists to make unreachable, reached by timing rather
than by routing. What is NEW is that both readings ride the same
payload, so they CAN be compared, and nothing compares them.

AND THE TREE THE SWITCH CARRIES CAN BE DROPPED BY ITS OWN WATERMARK.
`resetDocsForProjectSwitch` KEEPS the seq watermark (the T-007
stale-drop invariant) and `applySnapshot` opens with
`if (payload.seq <= prev.seq) return prev`, so an overtaking
`docs-changed` emit for the NEW root leaves `switched` — the EMPTY
model. Measured through the real reducers by T-042's verifier:

    in-order    switch@7 -> fileCount=2 seq=7 phase=genesis
    overtaken   emit@8   -> fileCount=3 seq=8
                then switch@7 -> fileCount=0 seq=8 phase=genesis

"0 files written" over a docs/ that is not empty — the exact T-026-s4
symptom criterion 1 exists to remove, surviving one layer down.
NOT a regression either way: the branch point produced the same empty
model in the same interleaving and additionally regressed the
watermark. Criterion 1 is what makes a fix cheap for the first time —
before it there was nothing to salvage.

## Acceptance criteria
- THE SWITCH SHALL WIN, or the LATER READING SHALL WIN, and the
  choice SHALL be recorded with its reasoning before implementation.
  Preferred arm (b): if `snapshot.seq <= switched.seq` AND
  `switched.projectDir` already equals the switch's `projectDir`, the
  overtaking emit is the FRESHER measurement of the SAME folder —
  keep it instead of resetting to empty. Arm (a) — apply
  unconditionally for the genesis case with
  `max(switched.seq, snapshot.seq)` as the watermark — also keeps the
  stale-drop invariant and is acceptable if argued (T-042-s3).
- THE INTERLEAVING SHALL BE PINNED BY NAME whichever arm is taken —
  `arm_genesis` arms the watch BEFORE `apply_genesis_folder` commits,
  which is why an emit can overtake the invoke reply — so it cannot
  regress silently.
- THE PROBE AND THE SNAPSHOT SHALL NOT BE ABLE TO CONTRADICT EACH
  OTHER ON SCREEN. Preferred arm (a): re-derive `has_plan` from the
  snapshot (which already contains every docs file path) and route to
  `Picked` instead when the two disagree — one predicate, two inputs,
  the LATER reading wins, which is the truthfulness posture the rest
  of this seam takes (T-042-s2).
- IF instead the probe is kept as a decision record THEN it SHALL say
  so in its own type or doc comment ("what the folder looked like
  when genesis was decided"), and the frozen-lie window SHALL be
  named in notes rather than left implicit (T-042-s2 arm b).
- THE LIVE-CONSUMER QUESTION SHALL BE ANSWERED BEFORE THE FIELD IS
  KEPT: nothing on the genesis SCREEN renders `probe` —
  `reducePickOutcome` stores `genesisDir` and the docs model and lets
  `resolvedProbe` go null. If it has no consumer, dropping it is arm
  (c) and is cheaper than defending it (T-042-s2).
- THE RACE SHALL BE DRIVEN, not argued: a test that writes
  `docs/ROADMAP.md` between probe and snapshot and asserts the app
  does not land on the interview screen over a planned folder.
- RELATED AND NOT ABSORBED: T-026-s1 (the probe's exact-case match)
  is the other place the probe and the filesystem disagree; it stays
  parked pending the Linux lane and SHALL be re-read by whoever
  builds this. If arm (a) re-derives `has_plan` from the snapshot,
  the casing question moves with it — one predicate, one place to
  decide the rule.

Verification: headless — cargo tests through the watcher plus vitest
against the real reducers for both interleavings. @human: none.

## Implementation notes


### THE RULINGS, RECORDED BEFORE IMPLEMENTATION

Built by `claude-opus-5 @T-064` in worktree `nputer-T-064` off `2036fb2`
(main's tip, a `Checkpoint:` commit — the DISPATCH FROM THE LAST
CHECKPOINT rule). This section is its own commit and it is the FIRST
commit on the branch, because three of the criteria say the choice is to
be recorded before the code and a section appended afterwards cannot
prove it was.

**RULING 1 (criterion 1) — ARM (b), THE LATER READING WINS, and the
guard is a NAMED, EXPORTED PREDICATE.** When the overtaking emit and the
switch describe the SAME folder and the switch's reading is not newer,
the emit is a strictly better measurement of that folder taken at a
strictly later moment, and throwing it away to render an empty model is
the T-026-s4 symptom the whole card exists to remove. Arm (a)
(`max(switched.seq, snapshot.seq)`) keeps the watermark too but still
DISCARDS the emit's files, so it fixes the watermark and leaves
`fileCount=0` — it answers the smaller half of the finding. Arm (b) is
preferred BY THE CARD and is also the only one that leaves the model
correct.

**ONE CORRECTION TO THE CRITERION'S OWN SPELLING, said plainly because
this repository asks its executors to trust the tree over the brief.**
The criterion reads "if `snapshot.seq <= switched.seq` AND
`switched.projectDir` already equals the switch's `projectDir`".
`switched` is `resetDocsForProjectSwitch(prev.docs)`, which is
`{ ...emptyState(), seq: prev.seq }` — so `switched.projectDir` is the
EMPTY STRING, always, and the second conjunct as literally written can
never be true. The conjunct that carries the intended meaning is over
`prev.docs.projectDir`, the model as it stood BEFORE the reset, which is
where the overtaking emit landed. `switched.seq` IS `prev.docs.seq` by
construction, so the first conjunct is unaffected. Implemented over
`prev.docs` in both halves, and the predicate is named
`genesisSwitchIsOvertaken(prev.docs, outcome)` so the two conjuncts have
one home.

**AND THE READING SEQ IS `outcome.snapshot?.seq ?? outcome.seq`, which
covers a branch the criterion does not mention.** The criterion is
written for the snapshot-bearing switch, but the snapshot-LESS branch
(`{ ...switched, seq: outcome.seq }`) has the same defect AND a second
one the criterion does not name: it ASSIGNS the switch's seq, so an
overtaking emit at a HIGHER seq is followed by a watermark going
BACKWARDS — exactly the regression the card attributes to the branch
point ("additionally regressed the watermark") and which T-042 removed
from the snapshot branch only. One guard covers both branches because
Rust stamps the carried snapshot with the switch's own seq, so the two
readings are the same number whenever both exist.

**RULING 2 (criterion 3) — ARM (a), re-derive from the snapshot, and it
is ONE PREDICATE with TWO CONSTRUCTORS rather than one predicate spelled
twice.** `PlanProbe::has_plan()` stays exactly as it is and stays the
only place that says what a plan IS. What is new is a second way to
BUILD a `PlanProbe`: `PlanProbe::from_docs_snapshot(&snapshot, git)`,
which reads the same three docs-side facts off the snapshot's own file
list instead of off a stat sweep. `apply_genesis_folder` then asks the
one predicate twice — once before the rendezvous, once after the
collect — and routes to `PickOutcome::Picked` when the later reading
says there is a plan. Routing there is sound with NO extra work because
the two paths have already converged: a genesis arm over a folder that
has a plain `docs/` IS `rearm`, the same call `open_as_project` makes,
so at the moment of the re-read the project is committed, the recursive
docs watch is armed, the sentinel is armed, the seq is taken and the
rejected candidate is cleared — the state is byte-for-byte what the
ordinary open produces, and `Picked { snapshot }` is the outcome that
describes it.

**THE RE-READ CAN ONLY EVER VETO, and that is a property worth naming
rather than a limitation to apologise for.** It runs only in the branch
where the stat probe already said "no plan", so it can turn genesis OFF
and never ON. The opposite disagreement (probe says plan, snapshot says
none) is unreachable as a screen defect: that folder was routed to
`open_as_project` before anything was armed, and a board over a folder
whose plan was deleted mid-pick is the board, not the interview.

**RULING 3 (criterion 5) — ARM (c): `probe` LEAVES `PickOutcome::Genesis`.**
The live-consumer question is ANSWERED, by measurement rather than by
reading: `git grep` over `app/src` finds ZERO reads of the genesis
outcome's `probe` — `reducePickOutcome`'s genesis case sets
`resolvedProbe: null` and stores `genesisDir` plus the docs model, and
`GenesisScreen`/`GenesisPane` render the `DocsModelState` and the
project dir. The only readers anywhere are TEST literals and the wire
pin. `PlanProbe` is untouched and keeps BOTH its live consumers — the
front door's "No plan in <folder>" checklist rides `NoDocs.probe` and
`ProjectStatus::NoDocs.probe`, and nothing here narrows those. Ruling 2
is what makes this cheap rather than merely tidy: after it, the folder
is read TWICE inside Rust and exactly ONE reading crosses the boundary,
which is what the card's title asks for. Criterion 4 is therefore the
road not taken and its obligations do not attach; the frozen-lie window
is named in the notes below anyway, because it still exists INSIDE the
Rust and the next reader deserves its bounds.

**RULING 4 (T-063-s3) — ARM (b), and the fact lands in `ShellState`
rather than on `StartupFailure`.** The sentence is derived from whether
a `docs-changed` subscription is HELD, which the store knows in
`unlistenDocs`. Arm (a) (a fourth `StartupStep`) makes the wire wider for
a copy fix and gives the log a fourth step name that means "the same
refusal, different survivor"; arm (c) throws away the consequence clause
that is the whole value of T-050's wording in the common case. WHERE the
fact goes was decided by the TREE and not by taste: putting it on
`StartupFailure` reds `tools/e2e/tests/startup-recovery.spec.ts:52`,
which asserts `toEqual({ step, message, attempt })` on that exact object
— and `tools/e2e` is a SIBLING LANE'S FENCE this week (T-061). The
card's own wording for arm (b) says "a second fact about the
subscription into SHELL STATE", so the fence-clean placement is also the
literal one. `ShellState.watcherLive` is written by the same `setShell`
that records the failure, from `unlistenDocs !== null`, and is read by
exactly one thing. THE FIRST CLAUSE OF THE COPY IS UNCHANGED IN BOTH
ARMS ("the watcher subscription was refused"), which the card says is
true and which the E2E lane asserts by substring today; only the
consequence clause forks.

**RESERVED FOR @human, not decided here** (T-064's own Verification line
says "@human: none", and T-063's notes put this on the morning list): the
WORDING of the forked clause. The code decides WHICH sentence, the human
decides what it says.

### What landed

Two commits before this one: `f6cf200` the rulings, `8034a03` the code
and its tests. **Ten paths**, one Rust, two `app/src`, six `app/test`,
one card — plus the five findings and this section.

**RUST (`app/src-tauri/src/docs_watch.rs`).** Three named path
constants (`ROADMAP_NAME`, `ARCHITECTURE_NAME`, `TASKS_SUBDIR`) so both
readings of a folder SPELL the plan's paths once; `probe_plan` now joins
them instead of typing them. `PlanProbe::from_docs_snapshot(&snapshot,
git)` builds the same probe from a snapshot's file list — plus its
`skipped` list, because a file the collector could not SHIP still
EXISTS — using `under_docs_dir` and `is_flat_task_file` (non-recursive,
matching both `has_any_task_file` and the parser's flat walk).
`apply_genesis_folder` gained step 5: re-read, and `return
PickOutcome::Picked { snapshot: snap }` when the later reading says
there is a plan. `PickOutcome::Genesis` LOST `probe`.

**TS (`app/src/lib/watcher-store.ts`, `app/src/App.tsx`).**
`genesisSwitchIsOvertaken` is the new exported predicate; the genesis
case keeps `prev.docs` BY IDENTITY when it answers true. The
snapshot-less branch's watermark became `Math.max(switched.seq,
outcome.seq)` instead of an assignment. `PickOutcomePayload`'s genesis
variant lost `probe`. `ShellState.watcherLive` + `ScreenModel`'s
`startupFailed.watcherLive`; `startupStepPhrase(step, watcherLive)`
forks the subscribe sentence's SECOND clause only.

**FOURTEEN NEW BODIES**, three Rust and eleven TS: 840 -> **854** app
tests over 43 files, 352 -> **355** cargo tests over 15 `test result:`
lines.

**THE LINT CORPORA, EACH AT ITS OWN REF, BECAUSE ONE OF THEM MOVED
BETWEEN TWO OF THIS LANE'S OWN COMMITS.** The dispatch brief quotes
TOKEN 123 / CONTROL 590 at `e8c4ab7`, and both reproduce EXACTLY at
this lane's base `2036fb2` and again at the CODE commit `8034a03`,
which adds no file to either corpus. **At the tip they read TOKEN 123 /
CONTROL 595.** CONTROL derives its corpus from `git ls-files`, and the
five `T-064-s*` findings are five new TRACKED text files: 590 + 5 =
595. TOKEN is unmoved because none of them is a `.ts`/`.tsx`/`.mjs`
under `app/src`, `app/test` or `tools/e2e`. The first draft of this
paragraph said "CONTROL stays 590" and was measured one commit before
the tip it was written at — this week's recurring error, committed
inside the notes that name it, and caught by re-deriving rather than by
reading.

### The three things the tree said and the brief or the card did not

**ONE — the criterion's second conjunct, as written, can never be
true.** Recorded in RULING 1 above. `switched.projectDir` is the empty
string by construction; the conjunct that carries the meaning is over
`prev.docs.projectDir`.

**TWO — MAIN MOVED UNDER THIS LANE, TWICE, AND THE SIBLINGS ARE LIVE.**
The brief says "`2036fb2` is main's tip" and "NO SIBLING LANE IS LIVE"
was STATE's position at that commit. Both were true when written and
neither is true now: main is at **`4d2f03c`** ("F-04 opens: T-088
declares C-15, T-089 writes the brief down"), **42 paths** ahead of
`2036fb2` — the fifth triage plus two commits after it — and `git
worktree list` shows all three siblings checked out (`nputer-T-013`,
`nputer-T-061`, `nputer-T-070`). **Nothing collides**: `comm -12` over
the sorted path lists of main's advance and this branch is EMPTY, main
touched none of `T-064`, `T-026-s1`, `T-042` or `T-063`'s cards, and
`git merge-tree --write-tree` exits 0 with no CONFLICT. Every figure
below names the ref it was taken at, because this is exactly the
right-hand-endpoint drift the last two checkpoints wrote down.

**THREE — T-026-s1's expectation is falsified by taking the arm it
named.** It is `T-064-s1`, and it is the finding this card was most
likely to produce: arm (a) moves the PREDICATE, and the casing question
is about the NAME MATCHING, which is a syscall on one side and a string
compare on the other. Shared literals, divergent semantics.

### Ranges, dot count stated on every one, at `4d2f03c` / `8034a03`

    git merge-tree --write-tree 4d2f03c 8034a03  -> tree 749177b…, exit 0
    git diff --name-only 4d2f03c <TREE>                    -> 10  THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 4d2f03c...8034a03  (THREE dots)   -> 10  cmp against the forecast: exit 0
    git diff --name-only 2036fb2..8034a03   (TWO, branch-only) -> 10
    git diff --name-only 4d2f03c..8034a03   (TWO dots)     -> 52  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..4d2f03c   (TWO dots)     -> 42  main's own advance

Merge-base **`2036fb2`**, which is also this lane's dispatch commit
(DISPATCH FROM THE LAST CHECKPOINT). 42 + 10 = **52**, exactly the
forbidden count, and that arithmetic plus the empty `comm -12` is the
check that the two sets are disjoint. `merge-tree`'s exit code was read
from `$?` and not swallowed by a command substitution.

**AND AT THE TIP `947b75a` THE SAME SIX COMMANDS SAY 15 / 15 / 15 / 57
/ 42**, because this section's own commit adds five findings and this
card. Same left-hand refs throughout; the whole swing is the
right-hand one. 42 + 15 = **57**, the forbidden count again, and the
disjointness check holds at both refs. **BOTH SETS ARE PUBLISHED
DELIBERATELY**: the ten is the CODE change and the fifteen is what a
merge will carry, and quoting either without its ref is the error the
last two checkpoints spent a paragraph on. Re-derive at your own ref.

### Gates: all three fire, all three were run

**GRAPH REGEN — OWED, AND IT IS NOT A NO-OP.** Eight of the ten paths
are `.ts`/`.tsx` outside docs/. `cargo run -p nputer-index -- index
--check --root ../..` from app/src-tauri exits **1**, and it is a REAL
red rather than the `--root` false red: it prints BOTH count lines
(committed 585305 bytes · 119 files · 1018 symbols · 1539 edges; fresh
587539 · 119 · 1021 · 1546) and a `~8` file diff, where a false red
would say `committed: MISSING`. The regen was RUN AS A PROBE and
REVERTED, because the graph is the integrator's to commit with the
checkpoint: `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
self_graph -- --ignored` exits **0**, `index --check` then exits **0**,
and the delta is **+3 symbols / +7 edges**, the new symbol being
`genesisSwitchIsOvertaken`.

**THE THREE-FIXTURE RULE WAS DERIVED AGAINST THE REGENERATED GRAPH
RATHER THAN ASSUMED** (T-024-s5). No component is declared and
`docs/architecture/components/` is a 0-file diff, so the parser pin
should hold — and it was checked anyway, on the regenerated graph
before the revert: `architecture-dogfood.test.ts` +
`map-dogfood-render.test.tsx` **17/17 exit 0**, `lib/parser`'s
`smoke.test.ts` **4/4 exit 0**. Every one of the seven new edges has
both endpoints inside C-05, so no relation row moves. **ZERO
assertions move in any of the three.** graph.json was then restored by
byte copy from `git show HEAD:<path>`, proved by an empty per-path `git
diff` and sha256 back to `b5d1cf2c…`.

**BOOT GATE — OWED AND GREEN.** Two `app/src/**` paths and one
`app/src-tauri/**`. `NPUTER_BOOT_PORT=14621 npm run boot:check` from
tools/e2e exits **0**, with both lines: `[nputer] project folder:
/Users/ujju/Projects/nputer-T-064` and `[nputer] window "main"
created`. Port 14621 was bind-probed free on all four stacks
(`127.0.0.1`, `0.0.0.0`, `::1`, `::`) immediately before use.

**DOCS GATE — OWED AND GREEN, on this lane's own path list.** `node
tools/e2e/scripts/docs-gate.mjs $(cat <list>)` from the repo root —
invoked DIRECTLY, never through `xargs`, so the exit code is the gate's
own — exits **1** and owes THREE of the four suites: `npm test from
app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
`cargo test from app/src-tauri/` is NOT owed by the docs path (a flat
task card reaches no cargo reader) and was run anyway, because the code
diff owes it. The gate reports **11 derived docs readers across 4
suites** and **0 frontmatter issues in the live tree**; its census
reads **118 docs-shaped sites in 22 files, 11 of them in 9 files
root-anchored** — one site more than the T-084 checkpoint's 117, from
the `docs/…` literals in this card's own new Rust tests, in a file
already counted and NOT root-anchored, so the reader set is unmoved at
11 in 9.

### Suites, every exit code read unpiped from its own `$?`

- **app: 854/854 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, `index-BAC5mE8s.js`
  **503.16 kB** and `index-CwYF5FQb.css` **43.95 kB**. **The
  stylesheet's hash is UNCHANGED from the base** — no token moved and
  Tailwind emits the same utility set; only the JS hash moves, which is
  the whole of this card's frontend delta.
- **bare `cargo test --no-fail-fast`: 355 passed / 0 failed / 3
  ignored**, `CARGO_TEST_EXIT=0`, summed programmatically from
  **fifteen** `test result:` lines. Not `--all-targets`.
- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`; `npm run build` `PARSER_BUILD_EXIT=0`
  FIRST, because the app build dies at TS2307 without `lib/parser/dist`
  in a fresh worktree.
- **E2E: 121/121**, `E2E_EXIT=0`, on scratch port **14620**
  (bind-probed on all four stacks); `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`.
- **BOTH APP PROGRAMS TYPECHECK** (T-073): `npx tsc --noEmit`
  `TSC_SRC_EXIT=0` and `npx tsc -p tsconfig.test.json --noEmit`
  `TSC_TEST_EXIT=0`. The second is what found every stale `probe:`
  literal and every `ShellState` builder missing `watcherLive` — eleven
  errors across five files, enumerated by the compiler rather than by
  grep.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 123 files under app/src, app/test,
  tools/e2e; CONTROL 590 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples. This is also the repo's NUL-byte gate (P5, raw
  bytes) and it is green; the ten changed paths were independently read
  as bytes (`tr -d '\000' | wc -c` against `wc -c`) and **0 carry a
  NUL**.

### The poison drill — ELEVEN mutants, every one one-sided

Every mutation moved the PRODUCER, except `M5` which is explicitly an
assertion-side poison of an assertion that has no producer of its own.
Every mutated TEXT was READ BACK with `git diff` before a suite ran —
and that is not ceremony here: **the FIRST attempt at `M1b` matched in
the wrong function** (`perl` hit `open_as_project`'s `next_seq` line,
not `apply_genesis_folder`'s), the `git diff` showed it, and the
pattern was re-anchored. Substitution counts were right and the TEXT
was wrong, which is the T-078 lesson landing on its own rule. Every
restore was a byte copy from `git show HEAD:<path>` proved twice: an
empty per-path `git diff` and sha256 equality against `git show`.

| # | mutant | suite | exit | red bodies |
|---|---|---|---|---|
| M1a | the WHOLE commit block hoisted above the `ArmGenesis` send | cargo | 101 | **1** — the interleaving pin |
| M1b | ONLY `let seq = state.next_seq()` hoisted above the send | cargo | 101 | **1** — the interleaving pin |
| M2a | the snapshot veto never fires (`false &&`) | cargo | 101 | **1** — the driven race |
| M2b | the snapshot veto always fires (`true ||`) | cargo | 101 | 4 |
| M5 | the wire pin's absent-key check, poisoned on its own side | cargo | 101 | 1 |
| M7 | `from_docs_snapshot` stops reading `skipped` | cargo | 101 | 1 |
| M8 | `is_flat_task_file` drops `!name.contains('/')` | cargo | 101 | 1 |
| M3a | `genesisSwitchIsOvertaken` returns `false` | vitest | 1 | 6 across 2 files |
| M3b | its projectDir conjunct dropped | vitest | 1 | **2** |
| M3c | its seq conjunct dropped | vitest | 1 | **2** |
| M4a | the subscribe copy's fork collapsed onto the step | vitest | 1 | 1 |
| M4b | `watcherLive` written as the constant `false` | vitest | 1 | 2 |
| M6 | the watermark back to an assignment | vitest | 1 | 1 |
| M9 | a fork added to the `snapshot` step | vitest | 1 | 1 |

**THE ISOLATING MUTANT THE BRIEF ASKED FOR IS `M1b`, AND IT ISOLATES
IN BOTH DIRECTIONS.** The regression criterion 2 exists to catch is a
reorder of the arm/commit sequence. `M1a` is the full reorder and
`M1b` is its minimal form — the ordering STAMP alone, leaving the
project-mutex commit and `clear_rejected` where they are. Under BOTH,
`cargo test --no-fail-fast` reds **exactly one body**,
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`,
at **122 passed / 1 failed** in the lib binary and 354/1/3 across the
workspace. **No neighbour kills it** — not the T-042 tree-carrying
tests, not the T-026 sentinel tests, not the dropped-ack test for the
ordinary `Rearm`, none of which can see the order. And the pin
discriminates INSIDE itself: `M1b` reds only its arm-A assertion (the
seq counter read at dispatch time) while arm B (no ack, no commit)
stays green, which is why both arms are there.

**M3b AND M3c ARE THE SAME DISCIPLINE ON THE TS PREDICATE.** Each drops
ONE conjunct and reds exactly two bodies: the predicate's own truth
table, plus the single behavioural case that conjunct exists for —
`a genesis switch onto a DIFFERENT folder still clears everything` for
the projectDir half, `re-picking the OPEN folder as a genesis root is
not an overtake` for the seq half. Neither conjunct is carried by the
other.

**M2b IS THE POSITIVE CONTROL DOING ITS JOB** (the CONVENTIONS rule
that a negative assertion needs one). Making the veto ALWAYS fire reds
four bodies, and the useful one is the control inside the race test: a
folder that gained only `docs/ARCHITECTURE.md` in the window must still
land on genesis. Without it, "routes to Picked when a plan appears"
would be indistinguishable from "routes to Picked whenever anything is
written".

**ONE ASSERTION IS A DECLARED RESTATEMENT AND IS NAMED HERE RATHER THAN
DISCOVERED** (SHAPE SIX, by this repo's own taxonomy). In
`genesis_and_no_docs_wire_shapes_are_pinned`, the added
`…get("probe").is_none()` kills no PRODUCER mutant that the whole-value
`assert_eq!` two lines above does not already kill — `serde_json::Value`
object equality is key-set sensitive, so re-adding the field reds the
`assert_eq!` regardless. It is kept for its failure MESSAGE ("the
genesis switch carries ONE reading of the folder"), not for its
coverage, and `M5` poisons it on its own side to prove it at least
EVALUATES and discriminates (exit 101, that one body). Said out loud
because a body that reds while killing nothing new is the shape the
drill is documented not to catch.

### The frozen-lie window, named because RULING 3 removed the field and not the window

Arm (c) took `probe` off the WIRE. It did not remove the two readings —
it removed the second one's ability to reach a screen. Inside
`apply_genesis_folder` the window is still there and its bounds are
exactly:

- **OPENS** at `let probe = probe_plan(&canon)`, before the
  `ArmGenesis` send.
- **CLOSES** at `build_snapshot(&canon, seq)`, after the ack, after the
  commit, after `next_seq`.
- **CEILING** is `REARM_TIMEOUT` = 10 s, the rendezvous' own limit; past
  it the pick answers `Error` and mutates nothing.

Anything written into the folder in that window is invisible to the
first reading and visible to the second. What T-064 changes is that the
disagreement now DECIDES something (route to `Picked`) instead of
riding along as two fields. **Three residuals, all in the conservative
direction and all named in the code**: the collector drops symlinks
silently, so a symlinked plan is invisible to the second reading — and
the FIRST reading, which stats, sees it and has already routed that
folder away; the tree caps at `MAX_FILES`, so a plan past the cap is
missed and the pre-T-064 answer stands; and `skipped` clips at
`MAX_SKIPPED_REPORTED`, same direction. The re-read can only ever VETO.

### The live-consumer question, answered by measurement

`git grep -n '\.probe' -- app/src` returns four hits and **none of them
is the genesis outcome**: `App.tsx`'s `planChecklist(notice.probe)`
(the front door's checklist), `watcher-store.ts`'s `outcome.probe` on
the **noDocs** variant, `status.probe` on **`ProjectStatus::NoDocs`**,
and `InterviewChat.tsx`'s `outcome.probed`, which is C-14's agent
outcome and a different word. `reducePickOutcome`'s genesis case sets
`resolvedProbe: null` and stores `genesisDir` plus the docs model;
`GenesisScreen`/`GenesisPane` render the `DocsModelState` and the
project dir. **Zero production readers, so criterion 5's own
instruction applies and the field is gone.** The only readers anywhere
were test literals and the wire pin — eleven of them, every one
enumerated by `tsc -p tsconfig.test.json` rather than by grep.

### Findings filed

- **`T-064-s1`** — the casing rule did NOT move with arm (a), and
  T-026-s1's stated expectation is falsified. Shared literals,
  divergent semantics: a syscall on one side, `==` on the other. Read
  it with T-026-s1; option (b) there is now the cheaper one.
- **`T-064-s2`** — in the overtaking interleaving the BOARD renders
  over the genesis folder until the reply lands. **Measured `board`**
  between the emit and the reply. `shell.picking` already carries the
  window.
- **`T-064-s3`** — `watcherLive` sits BESIDE `startupFailure` rather
  than inside it; the airtight shape reds `tools/e2e`, which was
  T-061's fence this week. The move is written down for when it is
  free.
- **`T-064-s4`** — the E2E lane's hand mirror is stale in TWO places:
  the `probe` this card removed, and the `deadline` step T-063 added a
  card earlier. Neither staleness can red anything. T-065's subject,
  with two live instances.
- **`T-064-s5`** — `has_any_task_file` counts a DIRECTORY named
  `*.md`; the snapshot reading cannot. Both errors point the safe way
  and they cancel, but "one predicate, two inputs" is two questions
  here too.

### What reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else.** Holder `node` pid **82549**, one socket, `TCP
[::1]:1420 (LISTEN)`. Their app process pid **85379** (started Thu Aug
20 00:20:43), vite **82549** (Tue Aug 18 03:45:46) — read before the
work and unchanged. No bind, no connect, no signal, on any interface,
and **no `pkill` at any point**. Every `app/src/**` edit was made in
this worktree, never in the main checkout, so nothing hot-pushed into
their window; every drill mutation was applied AT A COMMIT and restored
per-path, never with `git checkout --` (T-072-s1). `npm ci` was run in
this worktree only. The boot gate opened and closed its own window on
scratch port **14621**, which is what that gate is (@human's 2026-08-16
ruling: not screen control).

### Deliberately not done

- **The graph was NOT regenerated into this branch.** It is owed at the
  merge, it is not a no-op, and the numbers are above; the integrator
  commits it with the checkpoint (GRAPH REGEN's own "WHY THE CHECKPOINT
  AND NOT THE MERGE").
- **No `tools/e2e` path was touched**, on T-061's fence. The two
  consequences are `T-064-s3` and `T-064-s4`, both filed rather than
  taken.
- **The @human copy judgment stands open**, as RULING 4 records and as
  T-063's notes reserved. The code decides WHICH sentence; the wording
  of the forked clause is on the morning list beside T-063's deadline
  copy.
- **T-026-s1 stays PARKED.** Deciding the casing rule is a decision, not
  a hot-patch, and it is not this card's to make — `T-064-s1` carries
  what changed under it.

### One more thing this lane did to itself, recorded because it is the gate's own worked example

**`T-064-s3`'S TITLE OPENED WITH A BACKTICK AND TOOK THE PARSER SUITE
TO 262 OF 263.** A YAML plain scalar may not start with `` ` ``, so the
card became unparseable and `smoke.test.ts` — the body that parses this
repository's LIVE `docs/` tree — reported one `yaml-error` at exit 1
while every other suite stayed green. That is `9c64cd8` verbatim, the
first of the two incidents the DOCS GATE bullet in CONVENTIONS was
written about, reproduced by an executor who had read that bullet the
same morning. It was caught because the gate's own instruction was
followed — the owed suites were re-run AFTER the doc edits and not only
after the code — and the fix was one word in front of the backtick.
Recorded rather than quietly corrected: the failure mode is not that a
suite goes red, it is that the red arrives detached from its edit, and
the only reason this one did not is that something told me to look.

### Closing state

Branch `task/T-064-switch-one-story`, worktree `/Users/ujju/Projects/nputer-T-064`,
cut from **`2036fb2`**. **EXACTLY TWO COMMITS CARRY CODE**: `f6cf200`
the rulings and nothing else, then `8034a03` the whole implementation
and its fourteen new bodies. Everything after `8034a03` is this
section — notes, five findings, and two corrections to figures that had
gone stale between the writing and the tip — so `git diff --name-only
8034a03..HEAD` touches only `docs/tasks/`, and a reader who wants the
change without the prose can read the second commit alone. (The exact
number of notes commits is deliberately NOT stated: a count of commits
written from inside the last one is the same unrefed figure this
section spends two paragraphs on. `git log --oneline 2036fb2..HEAD`
answers it and cannot be stale.) **NOT MERGED, and main was never
touched** — `git worktree list` shows this lane beside
`nputer-T-013`, `nputer-T-061`, `nputer-T-070` and `nputer-T-089`, all
disjoint from it. Working tree `git status --porcelain` EMPTY at the
close; every poison-drill file round-tripped and every restore was
proved twice.

**THE DOCS GATE FIRES ON THIS SECTION TOO**, which is the obligation
T-084's merge created for its own next step and which this card now
inherits: the notes commits are diffs whose whole content is `docs/`,
the gate owes `npm test from app/`, `npm test from tools/e2e/` and
`npx vitest run from lib/parser/` for six paths, and **all three were
re-run AFTER the last doc edit** — 854/854, 121/121 (scratch port
14620), 263/263, every exit code 0. That re-run is what caught this
lane's own backtick title, one section up.

## Verdicts
