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

### APPROVED — 2026-09-09, claude-opus-5@subagent (verifier, phase 2)

Tip judged `7b9f2ee49f0b19287206da929911c50990457d39`, against the base
`c768f2f67b2227ea7490b69bbf2cebfe444d56d4`, on the detached bench
`/Users/ujju/Projects/nputer-V-T-279`. Sealed inputs, verified by
`shasum -a 256` before anything else was opened:

- attack set `sha256:1fd9ebc4f9eeb6345d45dbb43d623742fb09255de9a339e4b88f6d716179a711`
- ground truths `sha256:9ebe5c4e0a390d6ff170be7681a7896f7e5cf8b8256b1e53cbcc5d245781d589`

**THE FRAME I ACTUALLY HAD.** Two spawns. Phase 1 wrote its attack set
tool-less by instruction at the base and it is the file hashed above;
this phase read, in order, the two sealed files, `method/roles/verifier.md`,
`docs/STATE.md`, the card AT THE BASE, the diff, and the tip — and opened
the executor's report and this card's implementation notes ONLY after its
findings were written out (`findings-T-279.md`,
`sha256:d52460883d719a3f41c06339bd7386deb6e9d3dbcd0b10c8d6224c1d5158f1a9`,
written before either was read). **My brief carried NO CONTEXT PACK**,
which `roles/verifier.md` step 0 calls a dispatch fault: I therefore read
`docs/STATE.md` whole and opened `docs/CONVENTIONS.md` by the bullets I
needed (the build order, the test commands, the POISON DRILL), and I say
so here rather than claiming a pack I did not have. The brief's duties
half named no mutant number, path count or suite figure, so phase 1 was
not broken above the line.

#### The structural check first — this card REMOVES work, so what went missing

    f88b289  method/roles/executor.md, method/lane-protocol.md      (code)
    c28ec46  the card + T-279-s1 + T-279-s2                         (notes and cards)
    7b9f2ee  the card                                               (the stamp)

The stamp commit's whole diff is one file, one hunk, one line pair:
`-status: building` / `+status: verifying` (`git show --numstat` reports
`1 1`). AC2's precondition holds exactly, and the exemption was earned
rather than assumed.

**Which tree the one surviving run graded.** Re-derived independently of
the report, from the lane's own runner token
(`nputer-T-279/.supertaskr/gate-verdict.json`, read-only): parser, app
and e2e each `verdict=GREEN`, `dirty=false`, all three at
`ref=c28ec464571d1058ab937e26de2adf4007ea3e68`, tree `63c1c1e` — the
commit that carries the code AND the notes AND the two suggested cards,
not its parent. No entry stands at `7b9f2ee`: nothing was re-run for the
stamp. The token records only each suite's LAST run, so it cannot by
itself forbid a second; the e2e stamp at 09:01:42Z against a leg the
report clocks at 13.0m starting 08:48:43Z leaves room for exactly one.
**One end-to-end leg on this lane, against T-278's two and T-256's
three.** The lane is the first to obey the rule it lands.

**Counts re-derived at MY tip, not transcribed.** My own four-suite
battery at `7b9f2ee` returns parser 389, app 1171, e2e 764 — the same
three numbers the report claims at `c28ec46`, and `method/` is
byte-identical across those two commits (`git diff --stat c28ec46
7b9f2ee -- method/` is empty). The eval block on this card is not typed:
`node tools/method-evals/run.mjs --bump` re-run at `c28ec46` in a scratch
clone prints those eight lines, byte for byte, exit 3 for the unset
runner.

**Fence.** `git diff --name-only c768f2f..7b9f2ee` is the two `touches:`
paths, this card and two new cards under `docs/tasks/`. Untouched:
`verifier.md`, `integrator.md`, `merge.mjs`, `cli.spec.ts` (T-281 live),
`gate-run.mjs`, `gate-run.spec.ts`, `docs/CONVENTIONS.md` (T-271 live),
`workflow-parity.spec.ts`, `plan-interview.md`, `kit.rs`. **No bump
inside the fence**: no version literal moved and `0.1.12` still stands in
all three stamp files. **No record rewritten**: everything above
`## Implementation notes` is byte-identical to the base but for the
status line — no criterion reworded, and the measured figures the card
rests on (T-278 two, T-256 three, T-238-s1 three) are untouched. No provenance arrow — the two-character sequence the card preflight reads
as one — was written into any file this lane authored.

#### The criteria

1. **MET.** Step 4 now separates the working runs ("as often as you need
   … nobody counts them") from the graded one and points at the new
   section; the section puts the suites at the commit already carrying
   code, notes and cards; the report spec gained *"AND EVERY GRADED SUITE
   BY NAME, WITH THE REF IT RAN AT AND ITS BODY COUNT BESIDE THE EXIT"*.
   The attack set's likeliest failure — ONCE landed without the reorder,
   so the one run grades a stale tree — does not apply in the text or on
   this lane's own refs.
2. **MET.** The exemption keys on the DIFF, never the subject: *"A last
   commit that moves nothing but your card's own `status:` line to
   `verifying` re-runs no suite"*. Tested adversarially against three
   commits — (a) status only: exempt; (b) status plus a source file: NOT
   exempt; (c) card notes plus a source file: NOT exempt. The grader is
   named beside it (the bench at your tip; the merge's own battery where
   the ceremony row gives no verifier), which is the reason clause AC2
   asks to travel with the rule.
3. **MET.** *"A FIX PASS AFTER A VERDICT IS A NEW TREE AND OWES ITS OWN
   RUN"* — trigger is a fix pass, not a verdict, and the whole-suite
   default is explicit ("scoped where your project can scope them and
   whole where it cannot"). T-271 is not named; that is the RIGHT call,
   not a miss — a project card id does not belong in project-neutral
   method text, and the criterion's substance is carried.
4. **MET, in the strict reading of "once".** The order is stated in
   EXACTLY ONE file; `lane-protocol.md` rule 4 gains a pointer that
   explicitly declines to second-spell it. The reason is the next
   paragraph. The numbered steps do not contradict the section. Method
   eval gate green (exit 0, 10 evals; `--selftest` exit 0), re-run by me
   at both `c28ec46` and the tip.
5. **MET.** *"IF YOU CANNOT TELL … RUN THEM AGAIN"*, direction RUN, with
   the observation that settles it named (*"The check is one diff"*), and
   *"the exemption is for the stamp alone"* in the same sentence. No
   modal was softened anywhere in the chain: no MAY skip, no SHOULD.

#### The grammar collision, checked whether or not the diff looked near it

`readSubtractions` / `readAdditions` over the TIP's `executor.md` answer
`["docs/CONVENTIONS.md","docs/ROADMAP.md"]` and `["tasks/TASK-FORMAT.md"]`
— identical to the base. `lane-protocol.md` subtracts and adds nothing.
No document was removed from every future brief by a wording accident.

#### Security sweep (mandatory, and the diff being prose is why)

The injection surface here is a sentence, and both shapes were tested: an
exemption that widens (bounded, and it fails safe toward RUN) and a
sentence a PROGRAM reads as a subtraction (the live readers, unmoved).
`docs-gate.mjs` over the five changed paths: FIRES for the three
`docs/tasks` writes, owing app + tools/e2e + lib/parser; **injection scan
0 hits in 3 paths against 7 patterns**; every live card's frontmatter
parses with a legal status; governing-document budgets hold. No
dependency, endpoint, secret or executable path is added. The new rule
leans on two files it does not touch and contradicts neither:
`verifier.md` step 1 ("Run the full test commands") and `integrator.md`
step 2 ("Run the FULL suite after merging") are named in the new text as
different seats and, for the integrator, a different tree.

#### The drills — 8 data mutants, one side only, each with its restoration proof

The property lives in PROSE, so every mutant is a DATA mutant
(`roles/verifier.md` 2b, T-221). M1–M8 were run in a `git clone --shared`
of the bench under scratch, so the bench tree was never mutated; M6 and
M7 were re-run against the real `brief.spec.ts` in the bench. Pristine
`executor.md` `sha256:1721c90042fc7fb96fc9ca008cd6dc91b1d8da928d050162ba60e177f8be59df`;
every mutation read back from `git diff --numstat` before its run, and
every restore proved by sha256 back to that value with an empty
`git status --porcelain`.

CONTROL, unmutated tip: `node tools/method-evals/run.mjs` exit 0,
`..........  10 model-free eval(s)` — the base reading.

| # | one-side mutation of `method/roles/executor.md` | method eval gate | brief.spec.ts |
|---|---|---|---|
| M1 | the order sentence deleted | exit 0, 10 evals | — |
| M2 | the order REVERSED, suites before the notes | exit 0, 10 evals | — |
| M3 | the exemption widened to "A last commit re-runs no suite" | exit 0, 10 evals | — |
| M4 | the fix-pass re-run sentence deleted | exit 0, 10 evals | — |
| M5 | the reason clause deleted | exit 0, 10 evals | — |
| M8 | the suite/ref/count row deleted from the report spec | exit 0, 10 evals | — |
| M6 | a stray `do NOT read docs/STATE.md` inserted | exit 0 | exit 0, **66 passed** |
| M7 | a stray `ADDITION TO THAT SET IS` + a backticked path | exit 0 | exit 0, **66 passed** |

**NOT ONE MUTANT REDS ANYTHING.** That is the measurement, and it is
reported here because it is a measurement — it is not a charge against
this card, whose AC4 asked the gate to RUN (it does, green) and never
asked for a new eval. **M2 is the one that matters**: with the order
reversed a lane runs ONCE, reports "once", and grades a tree carrying
neither its notes nor its cards — and no report can disclose it, because
the report is true. The remedy is filed as **T-279-s3**, which carries a
WORKING eval, not a description of one. M6/M7 are a different and
PRE-EXISTING surface, not this lane's doing (the sets are unmoved at the
tip); filed as **T-279-s4**.

**AND THE CONTROL I PROPOSE IS MINE TO CHECK** (`roles/verifier.md` step
0). MF-11, whose full text is in T-279-s3, was run three ways: green
against the unmutated tip (`...........  11 model-free eval(s)`, MF-11
reporting *"stated once in method/roles/executor.md; 1 bounded exemption
sentence(s)"*); `--selftest` green with *"MF-11  4 degradations, all
detected"*; and **red against an implementation lacking the property** —
all six data mutants the current gate ignores now exit 1 with
`..........F  11 model-free eval(s)`, each naming the missing property.
It stays green on M6/M7, which are not its subject. I ran it where the
arrangement that would decide it is absent; I am not passing on a control
I only asserted.

The executor's notes give a reason for filing no drill — *"the mutation
site would be a sentence rather than a behaviour"*. The project's own
POISON DRILL trigger is "a task that ADDS OR CHANGES a test body", which
this card does not, so **no discipline was breached**; but the reason as
stated is the one `roles/verifier.md` 2b rules against, and the eight
mutants above are what a data mutant on this text looks like.

#### My own battery — the whole four suites, ONCE, at my own tip (T-262)

Run through the blessed runner from the bench root at
`7b9f2ee`, `SUPERTASKR_E2E_PORT=25279`:

    gate-verdict suite=parser exit=0 bodies=389  targets=1  ref=7b9f2ee… verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1171 targets=1  ref=7b9f2ee… verdict=GREEN
    gate-verdict suite=rust   exit=0 bodies=654  targets=18 ref=7b9f2ee… verdict=GREEN
    gate-verdict suite=e2e    exit=0 bodies=764  targets=1  ref=7b9f2ee… verdict=GREEN

`node tools/method-evals/run.mjs` exit 0 (10 evals) and `--selftest` exit
0 at the tip. The rust leg is NOT owed by this diff and I re-derived that
rather than taking it: `KIT_FILES` in `app/src-tauri/src/agent/kit.rs`
names neither fenced file, and the snapshot-coverage test walks only `docs-templates`, `adapters`, `tasks` and
`skills`. I ran it anyway; it is green.

#### Filed as suggestions, blocking nothing (`roles/verifier.md` 6)

- **T-279-s3** — the five SHALLs this card lands are pinned by nothing;
  MF-11, demonstrated above, is in the card ready to lift.
- **T-279-s4** — a stray `do NOT read <a docs path>` sentence in any role
  file silently subtracts that document from every future brief, and
  neither the eval gate nor brief.spec reds. Pre-existing.
- **T-279-s5** — the report spec gained the suite row but not the
  exemption sentence, so the one checklist a seat fills top to bottom
  prompts for the count and not for *"no suite was re-run for the stamp"*.

