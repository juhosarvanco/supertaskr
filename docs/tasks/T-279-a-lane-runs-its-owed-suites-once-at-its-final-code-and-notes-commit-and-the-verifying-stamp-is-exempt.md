---
id: T-279
title: A lane runs its owed suites ONCE, at its final code-and-notes commit, and the `verifying` stamp commit is exempt — the same tree was graded two or three times per lane last night, and again by the verifier and the push
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: "@human (2026-09-09): \"Yes, file both\" — on the seat's finding that every lane ran the end-to-end leg two or three times (25–36 minutes of a lane's clock) for one tree"
blocked_by: []
touches: [method/roles/executor.md, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the second sitting of 2026-09-09 every lane ran the end-to-end leg
two or three times: T-278 twice, T-256 three times, T-238-s1 three
times (the lanes' own reports, each row with its ref). The leg takes
about twelve minutes, so a lane spent 25–36 minutes of its clock
grading what was, in every case but the fix passes, one tree.

The repeats come from the contract, not from the code. The executor
runs the suites its fence owes at its tip; then it writes its
implementation notes and files its suggested cards, which is a commit;
that commit moves the tip, and the docs gate counts a card write as an
input of the end-to-end suite (brief.spec reads the board), so the
contract's letter asks for the leg again. Then the `status: verifying`
stamp is one more card commit. And the verifier runs the whole battery
at that same tip (T-262), and the integrator runs it again on merged
main before the push (T-203). One tree, three to five full runs.

## Acceptance criteria

- WHEN a lane's tip carries its code AND its implementation notes AND
  its suggested cards THE executor SHALL run the suites its fence owes
  ONCE, at that commit, and the report SHALL name each suite with the
  ref it ran at and the count beside the exit.
- WHEN the last commit of a lane moves ONLY the card's `status:` line
  to `verifying` THE lane SHALL NOT re-run any suite for it, and the
  report SHALL say so in as many words — the verifier's one run at the
  tip (T-262) is what grades that commit.
- WHEN a fix pass lands after a verdict THE suites the fix's own paths
  owe SHALL be re-run at the fix's tip (scoped when T-271 has landed,
  whole until then), and the FIX PASS section SHALL name them.
- WHEN executor.md and method/lane-protocol.md are read THE order
  SHALL be stated once: code, notes and cards, the suites, the stamp —
  and the reason (one tree, graded once by the lane and once by the
  bench) stated beside it; the method eval gate SHALL run and the
  bump SHALL carry its eval block.
- IF a lane cannot tell whether its last commit moved more than the
  status line THEN it SHALL run the suites again rather than assume —
  the exemption is for the stamp alone.

## Implementation notes

### What was built

`method/roles/executor.md` gains one section, "The order of the last four
moves, and the ONE graded run", sitting between step 6 and Run hygiene:
code, then the notes and the suggested cards, then the suites the fence
owes, then the stamp. The reason is stated beside it — a suite result is
a claim about ONE commit and every later commit retires it, so the suites
go last among the moves that change the tree; the verifier grades the
same tip and the integrator grades merged main, which is why the lane
owes one reading of its own rather than three. The 2026-09-09
measurement (three lanes, the end-to-end leg two or three times each for
one tree, about twelve minutes a run, 25 to 36 minutes of a lane's clock)
is in the section, because a rule with no measurement beside it is
advice. The stamp commit is exempt and it is the only exemption; the
report has to say the exemption was taken, since afterwards a skipped run
and a forgotten run look identical; a lane that cannot tell whether its
last commit moved more than the status line runs the suites again; a fix
pass is a new tree and owes its own run at the fix's tip.

Steps 4 and 6 stop carrying the old order implicitly and point at that
section instead, so the order is stated once: step 4 keeps the working
runs (yours, uncounted) and hands the GRADED run to the section, step 6
notes that the stamp is its own last commit and re-runs nothing.

`## The report`'s command bullet now also asks for each GRADED suite by
name with the ref it ran at and its body count beside the exit. With one
run per lane the report is the only place a reader can learn WHICH commit
a suite graded, and the count is what separates an exit 0 over the whole
suite from an exit 0 over nothing (the blessed gate-runner's own
doctrine).

`method/lane-protocol.md` rule 4 gains a closing clause: this rule
partitions the RUNNERS (which checkout a suite may run in, whose
certification a second runner corrupts) while the executor section orders
the RUNS, and the clause cites that section rather than second-spelling
it. What the protocol contributes is its own measurement — a suite run is
the surface that CERTIFIES, so a lane grading one tree twice produces two
certificates of the same tree and a later reader cannot tell which run
graded which commit.

### The order, performed on this lane — criteria 1 and 2 demonstrated here

This lane is the first to obey the rule it writes:

1. `f88b289` — the method text (code).
2. this commit — the implementation notes and the two suggested cards.
3. the suites this fence owes, run ONCE at commit 2's tip.
4. a last commit moving only this card's `status:` line to `verifying`,
   with no suite re-run for it.

**The suite figures are deliberately NOT written back into this file.**
Writing them here would be a third code-and-notes commit, which the docs
gate counts as an input of the board-reading suites, which re-owes the
twelve-minute leg — this card's own subject. They are in the lane's
report instead, with the ref each ran at and the count beside the exit.
The verifier reads this card at the base ref, where none of this exists,
so nothing is lost by the split.

### The read cost, measured before the first edit (T-254's "after" reading)

This lane is the first dispatched under the CONTEXT PACK. Bytes read
before the first edit, per file, at `c768f2f`:

| What | Bytes read | Of the file |
|---|---|---|
| the brief (scratch, whole) | 50,355 | 50,355 |
| the card | 2,967 | 2,967 |
| `.supertaskr/lane-fence.json` | 1,082 | 1,082 |
| docs/STATE.md | 8,322 | 8,322 |
| docs/ARCHITECTURE.md | 9,300 | 9,300 |
| docs/ROADMAP.md | 11,878 | 11,878 |
| docs/NORTH_STAR.md | 5,059 | 5,059 |
| method/roles/executor.md | 22,160 | 22,160 |
| method/lane-protocol.md | 22,809 | 49,274 |
| method/tasks/TASK-FORMAT.md | 3,847 | 43,184 |
| docs/CONVENTIONS.md | 5,020 | 129,450 |
| docs/CAPABILITIES.md | 874 | 65,947 |
| total | 143,673 | |

The pack's own share: the brief's CONTEXT PACK block is 14,975 of the
brief's 50,355 bytes, and the one CONVENTIONS bullet this seat opened at
the file (METHOD EVAL GATE, cited rather than transcribed in the pack)
was 5,020 more. So the CONVENTIONS reading this lane actually performed
is 19,995 bytes against the document's 129,450 — 15.4 per cent of it, and
the pack's own claim for the seat's answerable share was 72,267. A
further 42,105 bytes of SOURCE were read to derive figures rather than
rules (gate-run.mjs, dispatch-brief.mjs's subtraction parser,
brief.spec.ts's four relevant bodies, the method-eval runner and MF-02,
kit.rs's KIT_FILES walk); that is a lane's own derivation cost and no
pack governs it.

### The method version bump's eval block, ready to lift

The bump is the integrator's (docs/CONVENTIONS.md's stamp,
method/interview/plan-interview.md, kit.rs's METHOD_SNAPSHOT_VERSION are
all outside this fence). `--bump` cannot produce the block here:
SUPERTASKR_EVAL_RUNNER is unset, so the model-in-loop half exits 3 by
design. The block below is what `node tools/method-evals/run.mjs --bump`
printed in this lane; the figures are a function of the tree, so the
integrator re-derives them at the merge commit — a bump lands on main and
a block measured in a lane is a figure from the wrong tree:

    Method evals: model-free exit 0, model-in-loop exit 3.
    Corpus: 10 model-free, 4 model-in-loop.
    Runner: NONE
    THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.
    Say that in the commit rather than omitting the line: a bump whose
    eval result is absent and one whose eval was skipped read the same.
    Pass rates and token spend are in the run above, at this ref. Do not
    transcribe them from an earlier run — that is the corpus's own RC-04.

### Gates, derived from this lane's own diff at `f88b289`

- METHOD EVAL GATE: FIRES. The diff touches `method/**` (two files).
- DOCS GATE: FIRES. Three paths under `docs/tasks/` are code inputs;
  `docs-gate.mjs` names app, tools/e2e and lib/parser.
- GRAPH REGEN: not owed. No `.ts/.tsx/.js/.jsx/.rs` outside docs/.
- BOOT GATE: not owed. Nothing under `app/src/**`, `app/src-tauri/**`
  or either manifest.
- `cargo test`, the METHOD EVAL GATE bullet's named residual: NOT owed,
  derived rather than assumed. `KIT_FILES` in
  `app/src-tauri/src/agent/kit.rs` carries 20 entries and neither
  `roles/executor.md` nor `lane-protocol.md` is one of them, and
  `the_snapshot_table_covers_every_method_scaffold_file` walks only
  `docs-templates`, `adapters`, `tasks` and `skills`.
- The gate set does not move at the stamp commit: the status line is a
  path under `docs/tasks/` that already fires the DOCS GATE.

### For the verifier

- The order is stated ONCE by construction: the full statement is in
  executor.md's new section, and lane-protocol.md rule 4 cites it. Steps
  4 and 6 point rather than restate. That is criterion 4's "stated once"
  read as "one statement, everything else points at it" (T-057).
- Criterion 2's exemption originally rested on the bench's run at the
  tip. That is false where the ceremony table gives a card no verifier,
  so the section names the merge's own battery for that row instead.
  MF-02's ordinal citations still resolve: `../lane-protocol.md rule 4`
  exists, and the new lane-protocol clause cites `roles/executor.md` by
  section name with no ordinal.
- `readSubtractions`/`readAdditions` still answer
  `["docs/CONVENTIONS.md","docs/ROADMAP.md"]` and `["tasks/TASK-FORMAT.md"]`
  against the edited file: no sentence was added in either grammar.
- No positive-control drill was run for this card: the change is method
  PROSE, and the mutation site would be a sentence rather than a
  behaviour. The eval suite's own `--selftest` is the control that
  applies, and it is in the report with its exit.

### Suggestions filed

- `T-279-s1` — the docs gate fires on the docs/tasks DIRECTORY, so a card
  body write re-owes the whole leg; measure which readers a body-only
  edit can move and scope the trigger to those.
- `T-279-s2` — a lane decides by hand whether its last commit moved only
  the status line; the blessed runner could answer it in three verdicts,
  with CANNOT TELL meaning the suites are owed.

## Verdicts
