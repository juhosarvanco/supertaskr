---
id: T-229-s4
title: The concurrency ceiling's checker reads only orchestrator.md, so after T-229 the DECLARED home is the copy nothing checks
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [app/test/select-board.test.ts, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**Class parent: `T-189-s2`.** **Disposition hint: promote and run it
with any card already inside `app/test/`; it is a four-line edit to one
body.**

`app/test/select-board.test.ts`, in *"the ceiling is a named constant
with its own assertion (criterion 5)"*, has a body *"and it matches the
LIVE orchestrator.md, which is the source it claims"* that regexes
`Ceiling: <n>–<n> concurrent` out of `method/roles/orchestrator.md` and
compares both numbers to the app's own `CONCURRENCY_CEILING`. T-229's
rider makes `method/tasks/TASK-FORMAT.md` the ceiling's declared HOME
and leaves orchestrator.md citing it — so the checker now joins the
CITATION to the code and reads the HOME not at all.

**MEASURED, because this was found by breaking it**: deleting the
number from orchestrator.md redded that body at `0c7227b` (app suite 1
failed / 1130 passed, `AssertionError: expected null not to be null`).
The lane restored the number and made the duplication explicit in both
files rather than widening its own fence, which is why nothing is red
today — but the value the method now calls authoritative is the one
with no keeper, and TASK-FORMAT's own new sentence says so out loud.

The edit is to read BOTH files in that body and require all three
values equal, so a project's code, its role file and its format file
move in one commit. `app/test/**` is outside T-229's fence, so it is
routed rather than taken. The body's own comment already warns that the
DOCS GATE cannot name this suite, because `method/` is not `docs/` —
which is why this drifts silently if nobody takes it.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-229's merge (d641846). Promoted
because the ceiling's declared HOME is now the copy nothing checks, and
the repair is a four-line edit to one body. Fence widened to
`method/lane-protocol.md` for the absorbed rider below. Criterion added:
WHEN the checker runs THE body SHALL read the ceiling from its HOME
(`method/tasks/TASK-FORMAT.md`) AND from orchestrator.md's citation, and
SHALL red when either moves away from `CONCURRENCY_CEILING`; a positive
control SHALL show it red against a planted home with the citation
intact.

## Absorbs: T-229-s1 (2026-09-02)

`method/lane-protocol.md` rule 4's STANDING, NOT THE SEAT clause opens
*"At roles/orchestrator.md's ceiling of 3–5 concurrent lanes"* — a
pointer one hop stale after T-229 moved the home to TASK-FORMAT. The
two-word edit rides this lane, which is the next lane to open the
ceiling's readers; the pointer SHALL name the home, and the checker's
new home read makes the pointer's target the checked copy.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Lane `/Users/ujju/Projects/nputer-T-229-s4`, branch
`task/T-229-s4-ceiling-checker-reads-the-home`, base
`e4cd6d4d27671f6c6064a8853886b2ee62d9237d` (the dispatch stamp — NOT
the brief's row-4 base `6cc3890`, which is T-233's known defect; the
worktree's HEAD is the truth and every figure below is measured at a
commit named beside it).

### What was written, and where

**`app/test/select-board.test.ts`** — the body *"and it matches the LIVE
orchestrator.md, which is the source it claims"* is now *"and it matches
the LIVE method — the HOME in tasks/TASK-FORMAT.md AND orchestrator.md's
citation of it"*. It regexes `Ceiling: N–N concurrent` out of BOTH
`method/tasks/TASK-FORMAT.md` (the HOME since T-229) and
`method/roles/orchestrator.md` (the citation), asserts a match in each,
and compares both numbers to `CONCURRENCY_CEILING.min/.max` — **not to a
literal**. The literal stays pinned in the sibling body above, which is
the shape CONVENTIONS' A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL
prescribes for T-063's family: a test parametrised by the constant it
checks cannot pin that constant, so one body pins the constant and the
other pins the agreement. Each assertion carries a message naming the
file, so a red says WHICH copy moved. The file grows 2311 → 2325 lines.

**`method/lane-protocol.md`** (absorbed T-229-s1) — rule 4's STANDING,
NOT THE SEAT clause opened *"At roles/orchestrator.md's ceiling of 3–5
concurrent lanes"*; it now opens *"At tasks/TASK-FORMAT.md's ceiling of
3–5 concurrent lanes"*. One-line edit, the pointer only. **The pointer's
target is now the checked copy**, which is the half of T-229-s1 the
checker edit above supplies: before this card the pointer aimed at a
citation and the home had no reader at all.

### Every copy of the ceiling number, and which checker reads each

Census at the base `e4cd6d4d2767`, `grep -rn "3–5\|concurrent" method/`
(exit 0, five hits) widened by hand to the code copy, which lives
outside `method/` and so is invisible to that grep:

| # | copy | ref | read BEFORE this card by | read AFTER this card by |
|---|---|---|---|---|
| 1 | `method/tasks/TASK-FORMAT.md:701` — `**Ceiling: 3–5 concurrent agents, and THIS LINE IS THE VALUE'S HOME.**` | `e4cd6d4d2767` | **nothing** — the defect this card names | `select-board.test.ts`'s *"and it matches the LIVE method…"* |
| 2 | `method/roles/orchestrator.md:41` — `Ceiling: 3–5 concurrent.` (declared a CITATION of #1) | `e4cd6d4d2767` | `select-board.test.ts`'s *"…which is the source it claims"* | the same body, renamed |
| 3 | `app/src/lib/board-model.ts:737-740` — `CONCURRENCY_CEILING = {min: 3, max: 5}` | `e4cd6d4d2767` | `select-board.test.ts`'s *"CONCURRENCY_CEILING is 3-5, hardcoded here…"* (literal pin) | that body, PLUS the new body, which now joins #1 and #2 to it |
| 4 | `method/lane-protocol.md:186` — the prose pointer, *"ceiling of 3–5 concurrent lanes"*, and *"tells up to five executors"* two lines below | `e4cd6d4d2767` | **nothing** | **still nothing** — see the routed suggestion below |

The grep's fifth hit, `method/lane-protocol.md:267` (*"lanes
concurrently"*), carries the word and no number; it is not a copy.

**So three of the four copies are one fact checked once, and the fourth
is not.** Copy #4 is inside this card's fence and was deliberately not
taken: the regex the body uses (`Ceiling:\s*(\d+)…`, colon-anchored)
does not match prose spelling it *"ceiling of 3–5 concurrent lanes"*,
and *"up to five"* is a spelled-out word no generic regex reaches.
Widening the checker to a third spelling and eliminating a prose number
are both design decisions past this card's criterion, which names
TASK-FORMAT and orchestrator by path. Routed as `T-229-s7`.

### Acceptance criteria

**TRIAGE criterion — "the body SHALL read the ceiling from its HOME
(`method/tasks/TASK-FORMAT.md`) AND from orchestrator.md's citation, and
SHALL red when either moves away from `CONCURRENCY_CEILING`": MET.** The
body loops over both paths; both comparisons are against
`CONCURRENCY_CEILING`, so a move by EITHER file OR by the code reds it.
Demonstrated by mutants A, B, C, D and E below — one per direction.

**TRIAGE criterion — "a positive control SHALL show it red against a
planted home with the citation intact": MET, and shown FAILING against
an implementation lacking the property.** Mutant A plants `3–7` on the
HOME line and leaves `Ceiling: 3–5 concurrent.` untouched in
orchestrator.md (`grep` re-read after the mutation confirms the citation
intact). The new body REDS. **The same mutant, against the pre-change
body checked out from the base `e4cd6d4d2767` in the same worktree with
the same planted data, PASSES GREEN** — so the arrangement that decides
the subject's answer is not the one that decides the control's, which is
`roles/verifier.md` step 2b's own test of a control.

**Absorbed T-229-s1 — "the pointer SHALL name the home": MET**, and the
second half of its sentence ("the checker's new home read makes the
pointer's target the checked copy") is what the row-#1 line of the
census above records.

### Drills — DATA mutants, in a detached scratch worktree, one side only

The property lives in DATA (the text of two method files), so the
mutants are data mutants (`roles/verifier.md` 2b, T-221's class). Both
method files are OUTSIDE this card's fence and the fence is physically
enforced here by mode (654 tracked files are `r--r--r--` in this lane),
so every mutation was planted in a DETACHED worktree cut from this
lane's own commit `a0d72d4719f56d2f8fecc14fd344c62b84f50a43` at
`<scratch>/drill-T-229-s4`, never in the lane and never committed. Every
mutation was read back with `git diff` before its run; every restore was
`git restore --source=HEAD --staged --worktree` and is proved by sha256
of the HEAD blob against the working file, with `git status --porcelain`
as the companion, never the alternative.

| mutant | what moved (one side only) | the new body | the OLD body |
|---|---|---|---|
| **A** — the positive control | HOME `3–5` → `3–7`; citation untouched | **RED** — `method/tasks/TASK-FORMAT.md ceiling max: expected 7 to be 5` | **GREEN** — the demonstration that the control can fail |
| **B** | citation `3–5` → `4–5`; home untouched | **RED** — `method/roles/orchestrator.md ceiling min: expected 4 to be 3` | (not run; this is the arm the old body already had) |
| **C** | HOME's range deleted (`Ceiling: a small number of…`) | **RED** — `method/tasks/TASK-FORMAT.md states no "Ceiling: N–N concurrent": expected null not to be null` | — |
| **D** | citation's range deleted (`Ceiling: see the home.`) | **RED** — `method/roles/orchestrator.md states no "Ceiling: N–N concurrent"` | — |
| **E** — code | `CONCURRENCY_CEILING.max` 5 → 6; both method files untouched | **RED** (`expected 5 to be 6`), and 2 sibling bodies red with it | — |
| **F** — containment | all THREE moved together to 3–6 | **GREEN** — correctly, they agree | the literal-pin body **REDS** |

**Kill-set containment.** Neither of the two bodies in this `describe`
contains the other, measured rather than argued: mutants A–D kill the
new body and leave the literal-pin body green; mutant F kills the
literal-pin body and leaves the new body green; mutant E kills both. So
the literal pin is not a restatement of the agreement check and the
agreement check is not a restatement of the pin — they answer *"did the
bound change?"* and *"did the copies diverge?"*, which are different
questions. Against the body it REPLACES the containment is deliberate
and one-way: the old body's kill set (orchestrator drifts) is a strict
subset of the new one's (either file drifts, in either direction, from
the code).

Restoration proof, all at `a0d72d4719f56d2f8fecc14fd344c62b84f50a43`
(HEAD blob sha256 == working file sha256 after every drill, and the lane
worktree re-verified byte-identical afterwards):

```
14f9dacd6965e1d5f6375ec84fe75b728d30144a805e4db3af33d905910cbfbd  app/src/lib/board-model.ts
260b6bb146424d4d7b3e6e58f48e60544ed09022bc39b4b853fe1a86d30ce64f  method/tasks/TASK-FORMAT.md
030e03438fdc70c82b27c0d3a439fd2d5faeb4502d9bdf70d37540d53cad61ae  method/roles/orchestrator.md
c74f75bb3a09e1f66c9122aa592abe493157ca04f2ea7caa38aa93cb4e62ef3a  app/test/select-board.test.ts
370c78b3aa1971bc414c698102e218344cad17c4b8352f7b16fd13e4f9aa7b84  method/lane-protocol.md
```

The drill worktree was removed (`git worktree remove --force`, exit 0);
the host's worktree count returned to 17.

### Every command, in order, with its exit read from `$?` unpiped

| # | command (cwd) | exit | what it said |
|---|---|---|---|
| 1 | `grep -rn "3–5\|concurrent" method/` (lane root) | 0 | 5 hits at `e4cd6d4d2767` |
| 2 | `npm ci` (app/) | 0 | fresh worktree had no `app/node_modules` |
| 3 | `npm run build` (app/) | 0 | fresh worktree had no `app/dist` |
| 4 | `npm ci` (tools/e2e/) | 0 | |
| 5 | `npm test` (app/) — BEFORE | 0 | **50 files / 1131 bodies passed** @ `e4cd6d4d2767` |
| 6 | `npm run build` (app/) — after the edit | 0 | `tsc -p tsconfig.test.json` typechecks the test |
| 7 | `npm test` (app/) — AFTER | 0 | **50 files / 1131 bodies passed** @ working tree of `a0d72d4` |
| 8 | `npx vitest run test/select-board.test.ts -t "and it matches the LIVE method"` (app/) | 0 | 1 passed, 94 skipped — the body by NAME |
| 9 | `git commit` (lane root) | 0 | `a0d72d4719f56d2f8fecc14fd344c62b84f50a43` |
| 10 | `git worktree add --detach <scratch>/drill-T-229-s4 a0d72d4` | 0 | |
| 11 | drill baseline, the body by name | 0 | green in the drill worktree — the arrangement is sound before anything is planted |
| 12 | mutant A + the body by name | 1 | RED |
| 13 | mutant A + the PRE-CHANGE body (`git checkout e4cd6d4 -- app/test/select-board.test.ts`) | 0 | GREEN — the control's own demonstration |
| 14 | restore (test file + TASK-FORMAT) | 0 | both sha256 MATCH |
| 15 | mutant B + the body | 1 | RED |
| 16 | restore orchestrator.md | 0 | sha256 MATCH |
| 17 | mutant C + the body | 1 | RED (null guard, home) |
| 18 | restore TASK-FORMAT.md | 0 | sha256 MATCH |
| 19 | mutant D + the body | 1 | RED (null guard, citation) |
| 20 | restore orchestrator.md | 0 | sha256 MATCH |
| 21 | mutant E + the whole `describe` | 1 | 3 red / 1 green |
| 22 | mutant F + the whole `describe` | 1 | 2 red / 2 green — the containment measurement |
| 23 | restore all three | 0 | 4 sha256 MATCH |
| 24 | `git worktree remove --force <scratch>/drill-T-229-s4` | 0 | |
| 25 | `node tools/method-evals/run.mjs` (lane root) | **0** | `...... 6 model-free eval(s)` |
| 26 | `node tools/method-evals/run.mjs --selftest` (lane root) | **3** | `MF-01: COULD NOT RUN — EACCES` — the LANE'S FENCE, not the method; see below |
| 27 | both of the above in a detached worktree at `a0d72d4` | **0** and **0** | `...... 6 model-free eval(s), POSITIVE CONTROL` |
| 28 | `gate-run.mjs parser` (lane root, `NPUTER_E2E_PORT=15229`) | 0 | `bodies=349 ref=a0d72d4… verdict=GREEN` |
| 29 | `gate-run.mjs app` | 0 | `bodies=1131 ref=a0d72d4… verdict=GREEN` |
| 30 | `gate-run.mjs rust` | 0 | `bodies=639 targets=18 ref=a0d72d4… verdict=GREEN` |
| 31 | `gate-run.mjs e2e` | 0 | `bodies=574 ref=a0d72d4… verdict=GREEN` |
| 32 | `cargo run -q -p nputer-index -- index --check --root ../..` (app/src-tauri/) | **1** | STALE, `~1 app/test/select-board.test.ts (content, loc 2311 -> 2325)`; regeneration is the integrator's |

### The METHOD EVAL GATE, and a finding it produced

The diff touches `method/lane-protocol.md`, so the **METHOD EVAL GATE
FIRES**. Model-free set: **exit 0** in the lane, six evals. `--selftest`
(the gate's own positive control): **exit 3 in the lane** —
`MF-01: COULD NOT RUN — EACCES ... /project/method/roles/executor.md` —
and **exit 0 in a detached worktree cut from this same commit**. The
difference is not the tree: this lane's fence is enforced by MODE, so
`method/roles/executor.md` is `r--r--r--` here, `fixture-root.mjs`'s
`cpSync` preserves that mode into its temp copy, and the selftest's
degradation step cannot write the file it is degrading. Setting `TMPDIR`
into the scratchpad reproduces it identically, which rules out the temp
directory. **So the gate is GREEN at this tip and the in-lane exit 3 is
an artifact of the fence.** Routed as `T-229-s6`, because the lanes that
hit it are exactly the lanes whose diff fires the gate.

### For the verifier

- The suite figures either side of the edit are IDENTICAL (50/1131) by
  design: the body was rewritten, not added, so the count does not move
  and the count is therefore not evidence. The evidence is mutants A–F.
- `docs/CAPABILITIES.md` is NOT owed by this rename:
  `tools/e2e/scripts/capabilities.mjs` reads `tools/e2e/tests/*.spec.ts`
  only (its `readdirSync(testsDir)`), and this is an `app/test/` body.
  Nothing outside the T-229 card family quotes the old body name.
- The body's own comment still warns that the DOCS GATE cannot name this
  suite, because `method/` is not `docs/` — that gap is unchanged and is
  the reason the card exists.

### The dispatching seat's six tree facts, re-derived at this lane's tip

Handed to this lane mid-build, measured on the dispatcher's bench at the
base `e4cd6d4d2767`. Each is re-derived here at
`4f7d3fdb548ea1c8a1276800d7ed99e76ace29f0` rather than adopted; five
hold and one is superseded by this lane's own diff.

1. **The home and the pointer were unchecked, the citation was not** —
   HOLDS, and this lane's mutants A–D are the same fact measured from
   the other side: at the base, mutant A (home only) leaves the old body
   GREEN, which is the demonstration this card's positive-control
   criterion asks for.
2. **The regex hazard is the opposite of the obvious** — HOLDS, and it
   decided the shipped spelling. Measured at this tip: the shipped
   `/Ceiling:\s*(\d+)\s*[–—-]\s*(\d+)\s*concurrent/` matches
   `"Ceiling: 3–5 concurrent"` byte-identically in BOTH intended files
   and reads **NULL** from `method/lane-protocol.md`. A loosened
   case-insensitive form was tried against lane-protocol.md for
   contrast and matches `"ceiling of 3–5 concurrent"` — so the
   colon-and-capital anchor is load-bearing, not incidental, and a
   tightened `concurrent\.` anchor would have read NULL from the home.
   Every read is asserted non-null before either number is compared.
3. **Do not cite the home by rule ordinal** — HOLDS and was obeyed: the
   pointer is *"At tasks/TASK-FORMAT.md's ceiling of…"*, a file
   reference with no ordinal, so MF-02 has nothing to resolve against
   TASK-FORMAT's empty top-level ordinal set. MF-02 green.
4. **MF-04's bare-name hole** — HOLDS and was obeyed: the pointer is
   spelled `tasks/TASK-FORMAT.md`, the prefixed form MF-04's
   `METHOD_DIRS` alternation resolves and the form this file already
   uses for its other eight references to that path, never a bare
   `TASK-FORMAT.md`. MF-04 green.
5. **Rule 4 is extracted WHOLE by two assemblers** — HOLDS, and the
   extraction was measured through the real function rather than a
   replica. `numberedStep(laneProtocolText, 4)` from
   `tools/e2e/scripts/dispatch-brief.mjs` returns **12,933 characters at
   `e4cd6d4d2767` and 12,932 at `4f7d3fd`** — a one-character shrink,
   exactly `roles/orchestrator.md` (21) → `tasks/TASK-FORMAT.md` (20) —
   and the span still ends on rule 4's own last sentence (*"…the probe
   stays unbuilt, and this sentence is why."*), so nothing truncated.
   The diff adds **0** lines matching `^\d+\. ` or `^## `. The Rust twin
   `numbered_rule(&protocol, 4)` in `app/src-tauri/src/dispatch/brief.rs`
   is covered by the rust suite, green at 639 bodies.
6. **"The DOCS GATE is not owed (no docs/ path)" — SUPERSEDED, and it
   was true when measured.** It was derived against a diff that did not
   yet exist. This lane's notes commit adds three `docs/tasks/` paths —
   this card plus `T-229-s6` and `T-229-s7` — and `docs-gate.mjs` on
   those three exits **1: FIRES**, owing `npm test` from `app/`, `npm
   test` from `tools/e2e/` and `npx vitest run` from `lib/parser/`,
   because twelve suites read `docs/tasks`. This is the structural case
   `roles/executor.md`'s report spec names: a lane's last commit is its
   notes, so the gate whose trigger is the documentation tree is the one
   it is guaranteed to feed after answering for it. All three owed
   suites are re-run at the final tip. The rest of fact 6 holds: no
   method version bump (`lane-protocol.md` is not in `KIT_FILES`) and no
   `CAPABILITIES` regeneration.

The dispatcher's baselines re-derived here: app **1131**, parser
**349**, e2e **574**, rust **639** (a figure the message did not carry),
all GREEN at `a0d72d4`. **`method-evals` is the one divergence**: exit 0
both arms on the dispatcher's bench, but exit 0 / exit **3** in this
lane, because the bench is not a dispatched lane and so does not carry
the fence's `r--r--r--` modes — the whole of `T-229-s6`. And
`index --check` is CURRENT at the base and **STALE at this tip**, by
design: GRAPH REGEN fires and regeneration is the integrator's.
