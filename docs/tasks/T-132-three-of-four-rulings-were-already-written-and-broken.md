---
id: T-132
title: Three of the four rulings this card was filed to add were already written in method/ and the architect broke all three — the finding is not an incomplete method, it is a prose contract that did not bind
feature: F-01
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [method/lane-protocol.md, method/roles/integrator.md, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (2026-08-25, at @human's instruction): **`T-123-s10`** and
**`T-128-s1`** — both files removed in this commit. Both were filed by
the architect against the architect, hours apart, for the same defect.

`blocked_by` was cleared and the fence narrowed from `[method/]` to the
three files this card writes — **the first card dispatched under the
path-granularity ruling @human adopted tonight**, applied to itself.

**THIS CARD WAS DRAFTED TO ADD FOUR RULINGS AND SHRANK TO ONE AND A HALF
WHEN ITS OWN CLAIMS WERE CHECKED.** The checking is the deliverable. It
is recorded in full rather than quietly corrected, because the corrected
version is a better finding than the draft was.

The architect drafted this as *"four rulings were made in tonight's
verdicts and have nowhere to live"*, on the model of `T-104`. Then read
the files. **Three of the four were already written in `method/`, in
detail, with their mechanisms and in two cases their measured costs — and
the architect had violated all three during the same session.**

## WHAT WAS ALREADY WRITTEN, AND WHO BROKE IT

**1. `method/roles/orchestrator.md:30-31` already specifies how a brief
is built:** *"The brief is assembled to the contract in
roles/executor.md — **every row, from the sources that row names**."*
And `executor.md`'s row 5 names those sources exactly: the card's
`touches:`, **the repository's live worktree list on a task branch**, and
the slug↔path map with the authoritative field named.

**Every dispatch brief written on 2026-08-25 violated that contract.**
Not by omitting rows — by filling them from the dispatcher's context
instead of from the sources the row names. The consequences were
measured: at least one error per brief, a lane list wrong four times, and
in the worst case an assertion that a lane *"notes"* something the lane
records nowhere. **The rule was not missing. It was not read.**

**2. The same file, at lines 24-29, already forbids the stamp-after-cut
error and states its hazard**: the stamp is written on the integration
branch and committed BEFORE the cut, *"and the lane inherits the stamp in
its own base rather than writing that line itself. Stamping after the cut
makes that line writable by both branches — clean only while a single
side writes it."*

**The architect stamped two cards after the cut**, believing the
held-index rule forbade writing to main. **It did not**, and this file
already said what to do instead. Two lanes then derived fence
disjointness from a stale fence on main and got the wrong answer. That is
`T-128`'s fourth instance, and it was a violation of a written rule
rather than a gap in one.

**3. `docs/CONVENTIONS.md`'s POISON DRILL bullet already carries the
drill-pollution class in full** — the required per-drill
`CARGO_TARGET_DIR`, the mechanism (`env!("CARGO_MANIFEST_DIR")` baked in
at compile time and not fingerprinted by cargo), the measured cost of
getting it wrong on T-013's lane, **and the reverse direction verbatim**:
*"a mutant can look DEAD against a stale binary that never saw the
mutation."* The architect drafted this as a hazard nobody had named. It
is named better than the draft named it.

**4. `method/roles/executor.md:126-128` already rules the out-of-fence
criterion**: *"A criterion that cannot be built inside the fence is NOT
built. Record it, route it as a suggestion naming the fence it needs, and
build the rest."*

T-126's lane deleted a file outside its fence because its card told it
to. **That is a violation of an existing rule, not a question the method
had left open** — which is what T-126's verifier concluded independently,
and its reasoning is worth reading at the verdict rather than
paraphrasing: `executor.md` is unconditional, a criterion-shaped
exception would nullify it because *every* out-of-fence edit is made
because some criterion seemed to want it, and *"held by no live lane"* is
a statement about collision risk rather than authority.

## THE REFRAME, WHICH IS THE POINT OF THE CARD

**A prose contract in `method/` did not bind the seat that writes
briefs — and that seat is the architect's own.** Three rules, all
written, all clear, all violated in one session by the reader most
responsible for them.

**This is the strongest available evidence for a claim `T-131` makes on
weaker grounds**: a convention that could be a gate should be a gate.
`T-131` argues it from cost — prose is re-read by every agent, expensively
and lossily. **This card argues it from failure**: the prose was read
*enough to be quoted* and still did not change what the dispatcher did.

**And it changes the fix.** "Adopt a rule that briefs carry no state" is
the wrong remedy for a rule that already exists. The remedy for a
violated contract is a **check**, not more prose — a dispatcher that
cannot emit a brief row without naming the command it came from, or a
brief template whose rows are commands rather than values.

## FOURTEEN — THE INTEGRATION TURN IS EXCLUSIVE, AND RULE 4 NAMES ONE SEAT WHERE IT MEANS ALL OF THEM

**Absorbed from `T-123-s10` and `T-128-s1`, and this is now the largest
item in the card.** It is the fourth instance of this card's own subject:
a rule that exists, in the right file, and does not reach the seat that
breaks it.

**Measured on main, not assumed.** `method/lane-protocol.md` rule 4 reads:

> **The executor** never touches the integration branch. No commit, no
> merge, no push, no branch move, **no dependency install** run against
> that checkout.

**Two gaps, and both are load-bearing:**

1. **It binds ONE SEAT.** `git grep -n architect -- method/lane-protocol.md method/roles/orchestrator.md` returns **zero**. The seat that dispatches, triages and files cards has never been named as bound by anything, and it is the seat that writes to that checkout most often.
2. **It lists the INSTALL and not the TEST RUN.** An install is the destructive case everyone anticipated. **A test run only reads, so it looks harmless** — and it is the one that actually collided.

### What the omission cost, twice, in one session

**`T-123-s10`** was filed against the architect hours before this card, for staging into a shared index while an integrator held main; that integrator spent about four minutes deciding whether the tree was safe to write.

**`T-128-s1`**: the architect then ran the full suite in the integration checkout while a *second* integrator worked there. The result was **2 failed / 169 passed** — a 30-second click timeout, and `Invalid package config` on a `tools/e2e/package.json` that was provably valid and untouched. **Re-run alone: 171/171, exit 0.** Both failures were collision artifacts.

**The second was worse than the first and the reason generalises.** Every other shared surface this project has named — the index, the ref namespace, the scratch directory, the board — **obstructs or confuses. This one CERTIFIES.** An integrator's suite result is what a merge is signed off on, and the corruption is symmetric: a spurious red it would investigate, or a spurious green that prompts no second look. Nothing in the tree records that a second runner was present. **`git status` is clean, no lock exists, and the checkout looks idle.**

**And `T-104` merged tonight WITHOUT taking `T-123-s10`**, because the triage that folded it there was never executed. **The architect then committed the same class of error three hours after filing the finding about it.**

### The fix, and its parts are not equal

- **GENERALISE THE SEAT AND EXTEND THE LIST.** Rule 4 binds *any seat that is not the integrator*, and the prohibition gains **the test run**. One clause; it is `T-123-s10`'s entire ask.
- **SEPARATE THE WRITE FROM THE VERIFICATION — this is the real fix and it is free.** What collided was not the commit. Commits are atomic and were proved safe repeatedly tonight, including under a running integrator at that integrator's own request. **What collided was a four-minute suite run.** So the remedy is targeted rather than total: write to the integration branch directly, and run gate-owed suites in a checkout of one's own. **This card was verified that way** — an architect verification checkout was cut and installed specifically to land it, and it is the first card in this project to be gated from outside the integration tree.
- **DETECT AND REFUSE, as a backstop only.** The precedent is already written at `method/roles/integrator.md:65` — *"DETECT the live process and REFUSE LOUDLY — naming the step skipped, the evidence, and what has to happen before it can run"* — and it carries the positive control with it: a check that cannot tell a live process from an absent one is not a check. **Build it only if the first two leak**, because it is machinery and the first two are a clause and a habit.

### A stopping rule two integrators derived and neither stated exactly

**Both integrators who met it got it right in practice and wrong in
justification, which is why it belongs here rather than in either
checkpoint.** The problem: a checkpoint writes suite counts into
`docs/STATE.md`, and `STATE.md` is itself read by a suite — so declaring
the run appears to owe another run, forever.

The wrong justification, written into a correction commit tonight and
retracted by its own author within the hour: *"no suite figure in this
file moves, so the declare-every-run regress does not restart."* **That
conflates two obligations that are not the same, and asking the gate is
what separates them:**

- **THE REGRESS** is about a file's own figures going stale — writing
  suite counts into a file a suite reads. **That does not restart on a
  prose edit.**
- **THE DOCS GATE'S OBLIGATION** is about the file being a code input *at
  all*. **It fires on ANY write under `docs/` that a suite reads,
  regardless of what changed inside.** Asked rather than predicted on the
  correction's own range: exit 1, one suite owed, which was run.

**The honest rule: the regress stops because the covering run is declared
somewhere that is NOT a code input — a commit message, or a report — and
NOT because prose escapes the gate. It does not escape the gate.**

Recorded here because **we are two for two on integrators deriving this
and neither stating it exactly**, which by this card's own thesis means it
is a rule that exists only in practice and will be re-derived by the
third.

### The diagnostic, which is prevention's other half

The failure was **plausible rather than loud**. A future reader meeting a red in `tools/e2e` must now separate **three** things that look alike: a real defect, the known mtime intermittent, and a concurrent-run artifact.

**The tell is the ABSENCE of the fractional-millisecond digits.** `T-120-s3`'s signature is a float against a whole number; neither of these two failures carried it. **That distinction belongs in `docs/STATE.md` beside the intermittents**, and it is worth more than the incident — it is the first recorded e2e red in this repository that is neither a defect nor the known flake.

## WHAT SURVIVES AS GENUINELY NEW

- **THIRTEEN — repair what the merge introduces, file what the merge
  merely reveals.** Stated by T-108's integrator. Verified absent from
  `method/` and `docs/CONVENTIONS.md`. It is the missing companion to
  `T-083`'s ruling that discharging a finding is not the integrator's
  call: that rule says what an integrator may not CLOSE; this says what it
  may FIX. The same integrator then applied it against itself, repairing a
  citation its own lane had shipped that went stale in thirty-one minutes.
- **~~A third pollution direction~~ — REMOVED FROM THIS CARD BEFORE
  FILING, and the removal is worth more than the item.** T-129's verifier
  found that its own drill left a mutated binary in its target directory
  and produced a well-formed, entirely false defect report before it
  caught itself. That sentence belongs in the POISON DRILL bullet of
  `docs/CONVENTIONS.md` — **and this card's fence is `[method/]`, which
  cannot reach that file at all.** As drafted the item was not merely
  duplicative but **unperformable**.
  **It already has a home**: `T-104`'s integrator routed it to **`T-092`**
  (`touches: [docs/CONVENTIONS.md, app-agent]`), in ONE edit with
  `T-079-s3` items 2–3 and `T-130-s1`, on the argument that all three are
  **one gap seen three ways — the bullet rules how a restoration is PROVED
  and never says what restoring MEANS.** Caught by T-129's integrator
  reading this draft; recorded rather than silently deleted, because *a
  card drafted to stop rulings from scattering had begun scattering one.*
- **A CARD-AUTHOR CLAUSE for the out-of-fence rule.** `executor.md:126`
  binds the EXECUTOR. Nothing binds the person WRITING the criterion.
  T-126's card ordered an out-of-fence edit and the rule as written puts
  the whole burden of refusal on the lane. One clause in the
  criteria-writing guidance closes it.
- **`T-108-s3` and `T-108-s4`**, both already filed: step 5's notes
  requirement is unperformable for a card fenced at path granularity
  (a card's own file is never in its own fence, and two lanes split on it
  the same night); and the pathspec rule needs a ROOT clause, because
  `git grep -- .` from a subdirectory exits 1 on a string that is present.

## Acceptance criteria

- **RULE 4 SHALL BIND ANY SEAT THAT IS NOT THE INTEGRATOR**, and its
  prohibition list SHALL name **the test run** beside the dependency
  install. **Derive the current wording at your own ref before editing** —
  `T-104` moved that file tonight and the sentence may already have
  changed.
- **THE WRITE/VERIFICATION SPLIT SHALL BE STATED AS THE REMEDY, NOT THE
  PROHIBITION.** A blanket "never touch that checkout" is wrong and would
  be ignored: the atomic commit is safe and was performed under a running
  integrator at that integrator's own request. **Name what actually
  collides — a long-lived suite run — and say where it goes instead.**
- **THE THREE-WAY DIAGNOSTIC SHALL REACH `docs/STATE.md`**: a `tools/e2e`
  red is now a real defect, the known mtime intermittent, or a
  concurrent-run artifact, **and the tell is the ABSENCE of the
  fractional-millisecond digits.** IF `STATE.md` is outside this card's
  fence THEN route it to the next checkpoint rather than widening —
  and say so, because a diagnostic nobody can find is not a diagnostic.
- **NO DETECT-AND-REFUSE MACHINERY SHALL BE BUILT BY THIS CARD.** It is
  the backstop and its precedent already exists at
  `method/roles/integrator.md:65` with its positive control attached.
  **Cite it; do not implement it.** IF the clause and the habit are judged
  insufficient THEN route the machinery as its own card with a measured
  argument.
- **THE THREE VIOLATIONS SHALL BE RECORDED WHERE THE RULE IS, not only
  here.** A rule that has been broken once by the seat that owns it earns
  a sentence saying so — the project's archive is trustworthy because it
  records its own errors with attribution, and an unattributed rule reads
  as advice.
- **NO ALREADY-WRITTEN RULE SHALL BE RESTATED** (T-057). For each of the
  three, the deliverable is a citation and at most a clause — **not a
  second spelling.** IF a closer reading shows one of the three is NOT in
  fact covered THEN say so with the line, and it becomes a real addition.
- **RULING THIRTEEN SHALL LAND IN `method/roles/integrator.md`**, beside
  the ritual, and SHALL be cited to the verdict that made it.
- **THE CARD-AUTHOR CLAUSE SHALL BIND THE WRITER, NOT THE READER.** It is
  a criteria-writing rule; putting it in `executor.md` again would
  reproduce the defect it fixes.
- **THE COUNT AND THE ABSENCES SHALL BE RE-DERIVED AT THE EXECUTING REF.**
  This card's central claim is "already written" and the executor SHALL
  verify each of the four independently before acting. **The architect
  drafted three false novelty claims here and caught them only by opening
  the files; the same check is owed again.**
- **THE REFRAME SHALL NOT BECOME A PROPOSAL.** Whether to build a check
  is `T-131`'s question and @human's ruling. **This card records the
  evidence and SHALL NOT implement a gate.**

Verification: headless. **This card adds no test body and that is stated
here rather than left silent.** The DOCS GATE fires on this card and on
any `method/` path a code suite reads — run it **directly, never through
`xargs`**, and record what it owed and each exit. `cargo test` is owed IF
the method snapshot version moves; it should not, since this card adds
clauses rather than formats — **derive that rather than assuming it.**
Ask GRAPH REGEN rather than predicting, and ask again after any write.
@human: none — every ruling here was made by a hand with standing, and
the corrections are to the architect's own draft.

## Implementation notes

Branch `task/T-132-exclusive-integration-turn`, worktree
`/Users/ujju/Projects/nputer-T-132`, base **`74feb67`** (main's tip at the
cut). Built by `claude-opus-5`. **NOT merged**, per the dispatch.

### THE FOUR "ALREADY WRITTEN" CLAIMS, RE-DERIVED AT `74feb67` BEFORE ANYTHING WAS EDITED

**All four verify. None became a real addition.** The card's central claim
survives its own re-check, which is the result it asked for and not the
one it hedged for.

| # | claim | verified at | verdict |
|---|---|---|---|
| 1 | the brief is assembled to `executor.md`'s contract, every row from the sources that row names | `method/roles/orchestrator.md:30-31`; sources at `method/roles/executor.md:87` (row 5) | **VERIFIED, exact** |
| 2 | stamp-after-cut is already forbidden and its hazard stated | `method/roles/orchestrator.md:26-29` (the card says 24-29); the FIELD's authoritative copy at `method/tasks/TASK-FORMAT.md:208-221` | **VERIFIED; the citation is two lines wide** |
| 3 | the POISON DRILL bullet already carries drill pollution in full | `docs/CONVENTIONS.md:1279`, with `CARGO_TARGET_DIR` at 1294-95, the `env!("CARGO_MANIFEST_DIR")` mechanism at 1300-02, T-013's measured cost at 1303-07, and the reverse direction *verbatim* at 1308-10 | **VERIFIED, all four halves** |
| 4 | the out-of-fence criterion is already ruled | `method/roles/executor.md:126-128`, with the never-widen sentence at 129 | **VERIFIED, exact** |

**Claim 2's line span is off by two and that is the only defect in the
four.** The card cites `orchestrator.md:24-29`; the quoted sentence begins
at **26**. Lines 24-25 are the preceding clause (*"THEN cut the lane from
that commit, THEN hand over the brief. Fields lock at that write"*). The
whole rule is 5b, lines **21-31**. **Recorded rather than silently
corrected, because a citation that is two lines wide today is a citation
that names the wrong paragraph after the next merge** — the hazard this
project has now met three times.

**T-104 MOVED NEITHER OF THE TWO FILES THE CARD WARNS ABOUT.** The card
says *"`T-104` moved that file tonight and the sentence may already have
changed."* `git diff --name-only` across T-104's merge names neither
`method/lane-protocol.md` nor `method/roles/orchestrator.md`; rule 4's
wording at `74feb67` was byte-identical to the card's block quote of it.
**The warning was right to give and wrong on the facts** — which is the
correct direction for a warning to be wrong in.

**AND THE CARD'S OWN `git grep` REPRODUCES.** `git grep -n architect --
method/lane-protocol.md method/roles/orchestrator.md` returns **zero
rows, exit 1**, at `74feb67`. The seat that broke rule 4 twice was named
nowhere in either file.

**THE ABSORPTION IS REAL**: `T-123-s10` and `T-128-s1` are both gone from
`docs/tasks/` at this ref.

### WHAT LANDED, AND WHERE

**`method/lane-protocol.md`, rule 4 — the seat, the list, the remedy, the
backstop, the attribution.** The rule now binds **the complement of one
seat** rather than an enumeration, and its prohibition list names **the
test-suite run** beside the dependency install. Four attached paragraphs:
why a complement and not a list; why the test run is the worse half (it
CERTIFIES where the others obstruct); the **write/verification split** as
the remedy, naming the long-lived suite run as the thing that actually
collides and the seat's own sibling worktree as where it goes; and
detect-and-refuse **cited and deliberately not built**. Both violations
recorded with attribution to the ARCHITECT seat, with their figures
(2 failed / 169 passed, then 171/171 alone).

**`method/roles/integrator.md` — ruling THIRTEEN, inside step 3, beside
the checkpoint ritual.** *Repair what the merge INTRODUCES; file what the
merge merely REVEALS*, with **the parent as the test** rather than the
size of the fix, and with `tasks/TASK-FORMAT.md`'s "THERE IS NO FOURTH
MOVE" named as its companion — that rule says what an integrator may not
CLOSE, this one says what it may FIX.

**`method/tasks/TASK-FORMAT.md` — the card-author clause, plus one
violation.** The clause sits in the criteria-writing guidance, where
criteria are written, and **binds the WRITER**: a criterion may not order
work outside its own card's `touches:`; test each criterion against the
fence as you write it; either widen the fence BEFORE dispatch or write the
criterion as a ROUTE. It says in one sentence why it is not in
`executor.md` — a third refusal sentence in a file that already carries
two would reproduce the defect it fixes. The **stamp-after-cut violation**
is recorded beside the lifecycle bullet it broke.

### THE ONE CONSTRAINT THAT DECIDED THE PROSE, AND IT IS NOT IN THE CARD

**`method/` CONTAINS ZERO CITATIONS TO THIS PROJECT'S CARDS OR VERDICTS.**
Derived, not assumed: `grep -rn "T-[0-9]" method/` returns nine rows and
**every one is an illustrative frontmatter example** (`id: T-016`,
`blocked_by: [T-015]`, `Absorbs: T-001-s2`, `task: T-014`,
`"tasks": ["T-013","T-017"]`) **or a template filename**. There are no
real dates either. The established idiom for grounding a rule in real
operation is `roles/integrator.md:14`'s *"Measured on this method's own
project"*.

**This matters because `method/tasks/TASK-FORMAT.md` is `include_str!`'d
into the shipped binary and materialized into OTHER projects' kits**
(`app/src-tauri/src/agent/kit.rs`), where `T-108` names nothing at all.
So the criterion *"RULING THIRTEEN … SHALL be cited to the verdict that
made it"* was satisfied in `method/`'s own idiom — the seat, the project,
and the **content** of the case (the citation that was correct when
written and false thirty-one minutes later, which is recoverable and
instructive) — and the card ids live here in the notes, where the
project-side trail belongs. **Writing `T-108` into `method/` would have
been the first leak of this project's board into a product-agnostic
file.**

### THE CEREMONY ROW WAS RE-DERIVED, AND THE RULE OF THUMB IS FALSE HERE

The dispatch said stamp `verifying` and do not merge — row 2 of the
ceremony table. **`TASK-FORMAT.md`'s own rule of thumb says the
opposite**: *"docs, method and tooling self-integrate; anything a user
could run does not"*, which would put a `method/`-only card on row 1 with
no verifier and self-integration.

**The rule of thumb is wrong for this fence, and the dispatch is right for
a reason the dispatch did not give.** `method/tasks/TASK-FORMAT.md` is one
of eight `method/` files `include_str!`'d into `app/src-tauri`'s binary. It
is **shipped code by the table's own boundary test** — *"if any entry
names a component whose build output SHIPS, the card takes a verifier"* —
and it is a user-runnable artifact in the most literal sense, since the kit
is materialized into a real project on disk. Stamped `verifying`,
`verifier:` / `verified_by:` / `review:` left empty, worktree kept.

### RANGE — THE PRESCRIBED FORM, AT A REF MAIN HAS ALREADY LEFT

**Main moved twice under this lane**: `74feb67` (base) → `afe23c1`
(T-127's dispatch) → **`cea839e`** (T-130's merge). Every derivation below
is at **`cea839e`**, re-derived rather than carried forward, and the exit
was read from `$?` **before** any substitution.

    git merge-tree --write-tree cea839e HEAD   -> exit 0, tree read after
    git diff --name-only cea839e <TREE>        -> THE PRESCRIBED FORM

**NEITHER OF MAIN'S TWO ADVANCES TOUCHES THIS FENCE.** `git diff
--name-only 74feb67..cea839e -- <the three files>` is **empty**, and
`merge-tree` exits 0, so the forecast tree is clean.

**THE FORBIDDEN FORM DID NOT ANNIHILATE HERE, AND THAT IS A REFINEMENT OF
WHAT STATE RECORDS.** `git diff --name-only main..HEAD` returned **0** at
T-129's checkpoint because that reader was an *integrator*, whose HEAD IS
main. **At a lane it does not annihilate — it inflates**, returning the
same 4 paths as the two-dot form against a prescribed 3. So the two
forbidden spellings have **three** behaviours between them, not two, and
which one you get depends on the seat rather than on the spelling.

### GATES — ALL THREE ASKED, NONE PREDICTED

**On the three `method/` paths alone (pre-stamp), every gate answers NOT
OWED**, and the DOCS GATE says so in its own words: *"3 changed path(s)
given, none under docs/ — this gate is not owed."* Exit **0**.

**On the final four paths (this card included), the DOCS GATE FIRES —
exit 1, on 1 of 4**, and names three suites: `npm test from app/`,
`npm test from tools/e2e/`, `npx vitest run from lib/parser/`. Run
directly from the repo root with the RANGE RULE's own path list, **never
through `xargs`**. 13 derived docs readers across 4 suites, census 130
sites in 22 files, **0 frontmatter issues**.

**GRAPH REGEN — ASKED, exit 0, CURRENT**, and it is a real green rather
than the `--root` false shape: the second line printed all four counts
(**939 161 bytes · 179 files · 2004 symbols · 1907 edges**), which a false
red cannot do. Not owed by trigger either — this diff has no `.ts/.tsx/
.js/.jsx/.rs` outside `docs/`.

**BOOT GATE — NOT OWED**, derived: zero of the four paths is under
`app/src-tauri/**`, `app/src/**`, or either manifest. Not run.

### `cargo test` WAS OWED, AND THE CARD SAYS IT WAS NOT

**The card's Verification line reads *"`cargo test` is owed IF the method
snapshot version moves"*. That is not the only trigger and it is not the
one that fired.** `method/tasks/TASK-FORMAT.md` is a cargo-suite input in
its own right: `app/src-tauri/src/agent/kit.rs` `include_str!`s it, and
**four bodies read `method/` off disk and assert against it** —
`every_compiled_entry_matches_its_method_file_byte_for_byte`,
`the_snapshot_table_covers_every_method_scaffold_file`,
`the_shipped_plan_interview_still_carries_the_normative_banking_map`,
`snapshot_version_matches_the_live_method_stamps`. **Editing that file
owes `cargo test` whether or not any version moves.** Derived, then run.

**THE VERSION CORRECTLY DID NOT MOVE.** These are clauses, not formats:
no new field, no new status, no new size, no change to the normative brief
table. `METHOD_SNAPSHOT_VERSION` stays **0.1.6**, and the two live stamps
it cross-checks (`docs/CONVENTIONS.md:266`, `method/interview/
plan-interview.md:26`) are untouched and outside this fence — which is the
card's own three-file-commit warning, and it did not fire.

### SUITES — EVERY RUN DECLARED, EVERY EXIT FROM `$?` UNPIPED

- **cargo: 471 passed / 0 failed / 3 ignored, exit 0**, summed over
  **16** `test result:` lines. **THE COUNT WAS CROSS-CHECKED AGAINST THE
  `running N tests` HEADERS**, which sum to **474 = 471 + 3** — so no body
  vanished into a SIGABRT. Lib suite **197 bodies in 4.05s**, deep inside
  T-124's green band, on a fresh isolated target. All three watched
  intermittents read **by name** as `ok`:
  `startup_arm_watches_the_initial_root`, `a_hostile_session_id_in_the_
  init_line_fails_the_turn_and_is_never_recorded`,
  `snapshot_version_matches_the_live_method_stamps`. **And
  `every_compiled_entry_matches_its_method_file_byte_for_byte` is `ok`**,
  which is this edit's own proof that the compiled kit and the file on
  disk still agree.
- **parser: 268/268 across 12 files, exit 0** — after `npm ci` and
  `npm run build` from `lib/parser/`, run FIRST, per the fresh-clone
  order.
- **app: `npm install` exit 0 · `npm run build` exit 0 · `npm test`
  973/973 across 47 files, exit 0.** The build was run before the suite in
  this fresh worktree, unprompted by any red; 973 matches the pre-existing
  baseline, which is right, because this diff contains no TypeScript.
- **E2E: TWO RUNS, BOTH DECLARED, scratch port 15436** (`lsof`-read at
  zero rows before run 1 and again after run 2, so nothing of this lane's
  survives). **Run 1: 170 passed / 1 failed, exit 1, 2.3m. Run 2: 171
  passed / 0 failed, exit 0, 2.1m** — the self-repairing intermittent
  behaving exactly as `docs/STATE.md` documents, and the second run is
  declared **because** it agreed, not as a replacement for the first.
  `range-rule.spec.ts` printed its `T-091-s3` disclosure against this
  lane by name (*"`/Users/ujju/Projects/nputer-T-132 @ b1783a6` — GRAPH
  REGEN's published flip figures are stated at `ddcc8bb` … 5 of 5 at that
  ref, 1 of 1 under the trigger on disk"*), which is the fourth
  consecutive observation of it.

**THE ONE RED IS `T-120-s3` AND IT IDENTIFIES ITSELF BY THE DIGITS.**
`token-scan.spec.ts:201`, *"P6 reds a planted bare motion utility and
leaves its motion-safe twin alone"*:

    Expected: 1787683714264.4028
    Received: 1787683714264

**A fractional tail against a whole number** — which is the whole of the
identification, and it is the three-way diagnostic paying off live on the
first tree that met it after the diagnostic was written. **It is not this
lane's**: this diff touches no `tools/e2e` path at all, and this branch is
based at `74feb67`, one commit BEFORE `cea839e` merged **T-130**, which is
the fix. The unfixed `utimesSync(target, clock.atime, clock.mtime)` is
still at `tools/e2e/tests/token-scan.spec.ts:226` in this tree, exactly as
expected. **Nothing was re-run until green and nothing was fixed here** —
the fix is already on main and outside this fence.

### THE DRILL HAS NOTHING TO POISON, AND THAT IS STATED RATHER THAN LEFT SILENT

**This card adds no test body and changes no assertion.** All three files
are prose in `method/`; no literal moved that any body compares against.
The drill's own clause about bodies that cannot be poisoned is therefore
what applies, and it is being applied deliberately rather than skipped.
**The nearest thing to an assertion this diff touches is
`every_compiled_entry_matches_its_method_file_byte_for_byte`, whose input
changed and which is green** — but that body is unchanged, so it is a
witness here, not a drill subject.

### WHAT WAS NOT BUILT, AND WHERE IT WENT

- **THE THREE-WAY E2E DIAGNOSTIC IS ALREADY IN `docs/STATE.md`, AT LINES
  175-182, AND THE CRITERION IS ALREADY SATISFIED ON MAIN.** *"the way to
  tell the three apart is now one question: does the failure carry a
  fractional millisecond against a whole number?"* — with the
  untouched-file tell for the concurrent-run case beside it. **The card
  asks for this as though it were owed; it landed at T-129's checkpoint.**
  So there is nothing to route: `STATE.md` is outside this fence, it is
  not widened, and **no work is owed there for this criterion.** The one
  thing the next checkpoint may want is the sentence that the diagnostic
  has now been exercised, by this lane, against a real red.
- **NO DETECT-AND-REFUSE MACHINERY WAS BUILT.** Cited in rule 4 and left
  alone. Cited **by name rather than by line** — `roles/integrator.md`
  rule 1, not `:65` — on this project's own standing instruction to cite
  bodies by name, because a line number in `method/` is a citation with a
  fuse. **And the citation is qualified where it needed to be**: that rule
  detects a live PRODUCT; a live INTEGRATOR is a different holder needing
  a different probe, which the clause now says.
- **`docs/STATE.md` IS STALE ON THIS CARD AND THAT IS THE NEXT
  CHECKPOINT'S.** Its "Next up" items 5, 9 and 23 still list `T-128-s1` as
  a live untriaged suggestion and item 5 gives this card's fence as
  `[method/]`; both went stale at `74feb67`, the dispatch commit that
  absorbed the two suggestions and narrowed the fence. **Ruling THIRTEEN
  adjudicates it in the checkpoint's favour**: that commit INTRODUCED the
  staleness, so it is a repair and not a filing. Recorded here rather than
  filed, on exactly that ground.
- **Three findings routed as suggestions**, all with fences named:
  `T-132-s1` (the DOCS GATE answers **1** when it could not run, measured),
  `T-132-s2` (`method/` is a code input and **no** standing gate fires on
  it), `T-132-s3` (two of the three violations have their rule-home
  outside this fence).

### THE FENCE HELD, AND THE ONE PLACE IT COULD NOT

**`git diff --name-only` against the base names exactly the three fenced
files**, plus this card and the three suggestions. Lane disjointness
proved as sets against the two other live lanes at `cea839e`: **T-127**
`[crate-index, docs/architecture/components/]` and **T-130** `[tools/e2e]`
— no overlap with three `method/` paths.

**THIS CARD'S OWN FILE IS NOT IN ITS OWN FENCE, WHICH IS `T-108-s3`
ARRIVING EXACTLY AS FILED.** `executor.md` step 5 requires notes appended
to the task file and step 6 requires the `verifying` stamp there; the
suggestion route requires new files under `docs/tasks/`. **Under a
path-granular fence a card can never reach its own card**, so the method's
two most basic executor obligations are unperformable as written. Both
were performed, because ruling NINE and step 5 are unambiguous and the
alternative is a lane that lands work and no record. **Named here rather
than glossed**, and it is the first card fenced this way, so it is also
the first to meet it.

### EVERYTHING THE BRIEF AND THE CARD GOT WRONG

**Six, and the useful half is that four of them are the card's rather than
the brief's — which is what a card about an architect's false claims
should produce.**

1. **THE CARD: the DOCS GATE does NOT fire on `method/` paths.** The
   Verification line says it *"fires on this card and on any `method/`
   path a code suite reads."* Asked rather than predicted: on the three
   `method/` paths the gate exits **0** and prints *"none under docs/ —
   this gate is not owed."* Its trigger is spelled `docs/` and nothing
   else. The gate fires here **only** because of this card's own path.
   **The card's underlying instinct was right and its mechanism was
   wrong**, and the gap that opens is `T-132-s2`.
2. **THE CARD: `cargo test` is owed for a second reason it does not
   name.** Not only "if the method snapshot version moves" — editing
   `method/tasks/TASK-FORMAT.md` at all owes it, because `kit.rs`
   compiles that file in and four bodies compare it against disk. The
   card's conclusion (*it should not move*) is correct; its premise is
   incomplete.
3. **THE CARD: the third criterion is already satisfied on main.** *"THE
   THREE-WAY DIAGNOSTIC SHALL REACH `docs/STATE.md`"* — it reached it at
   T-129's checkpoint, `docs/STATE.md:175-182`, before this card was
   dispatched.
4. **THE CARD: claim 2's citation is two lines wide** (`orchestrator.md`
   24-29 for a sentence beginning at 26).
5. **THE BRIEF: `T-104` moved neither file it warned about.** Rule 4's
   wording at `74feb67` was byte-identical to the card's quote of it, and
   `method/lane-protocol.md` is not in T-104's merge diff. **The
   instruction to re-derive was still right** — it asked for a
   measurement, and the measurement agreeing with the quote is a fact
   about tonight, not about the method.
6. **THE BRIEF: main's tip was already stale when the brief was
   written.** It moved twice more during this lane (`74feb67` →
   `afe23c1` → `cea839e`). The brief said so would happen and told me to
   name the ref I measured at; every figure above does.

**AND ONE THING THE BRIEF GOT EXACTLY RIGHT THAT NOTHING IN THE TREE
WOULD HAVE TOLD ME.** *"Build `lib/parser` before any app suite, and
`npm run build` from `app/` before the app suite in a fresh tree —
skipping the second gives 14 failures that look exactly like defects."*
Both were done first, unprompted by any red, and the app suite was
973/973 on its first run. **A trap that never fires is still the reason
it never fired.** Likewise `npm run typecheck` from `app/` was never
reached for, and the mtime intermittent was recognised from its digits in
the first ten seconds instead of debugged.
