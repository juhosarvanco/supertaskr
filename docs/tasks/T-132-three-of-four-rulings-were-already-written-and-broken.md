---
id: T-132
title: Three of the four rulings this card was filed to add were already written in method/ and the architect broke all three — the finding is not an incomplete method, it is a prose contract that did not bind
feature: F-01
milestone: 4
priority: 5
size: S
status: done
blocked_by: []
touches: [method/lane-protocol.md, method/roles/integrator.md, method/tasks/TASK-FORMAT.md]
builder: claude-opus-5
verifier: claude-opus-5 @T-132-verify
built_by: claude-opus-5 @T-132 — first build b1783a6, fix 0c6a0a3 by a fresh executor; notes 56821e7, 9b3b923
verified_by: claude-opus-5 @T-132-verify — REJECTED 9314d3e, re-check APPROVED 2026-08-25 — verdict commit aabbb3c, self-correction 83a85cc
review: same-model
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
test-suite run** beside the dependency install. **THE FIRST LANDING
CARRIED THE FOUR WRITE PROHIBITIONS ACROSS THAT BOUNDARY TOO AND WAS
REJECTED FOR IT** — see "THE REJECTION AND THE FIX" at the end of this
file; what stands is the complement for the install and the suite run,
with `no commit, no merge, no push, no branch move` scoped back to the
lane. Four attached paragraphs:
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
of **fourteen** `method/` files `include_str!`'d into `app/src-tauri`'s
binary. It is **shipped code by the table's own boundary test** — *"if any
entry names a component whose build output SHIPS, the card takes a
verifier"* — and it is a user-runnable artifact in the most literal sense,
since the kit is materialized into a real project on disk. Stamped
`verifying`, `verifier:` / `verified_by:` / `review:` left empty, worktree
kept.

**AND ONE ENTRY IS ALL IT TAKES, WHICH IS THE PART THIS PARAGRAPH FIRST
GOT ONE STEP TOO BROAD.** The boundary test is satisfied by
`tasks/TASK-FORMAT.md` alone: **neither `method/lane-protocol.md` nor
`method/roles/integrator.md`, the other two files in this fence, is
compiled into anything.** The dispatch is still right and the reasoning
still holds, but it holds on one path out of three rather than on the
directory — see the per-path correction below.

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

**On the full prescribed path set (this card included), the DOCS GATE
FIRES — exit 1**, and names three suites: `npm test from app/`,
`npm test from tools/e2e/`, `npx vitest run from lib/parser/`. Run
directly from the repo root with the RANGE RULE's own path list, **never
through `xargs`**. 13 derived docs readers across 4 suites, census 130
sites in 22 files, **0 frontmatter issues**.

**THAT SENTENCE SAID "THE FINAL FOUR PATHS … 1 OF 4" AND WAS FALSE AT THE
COMMIT THAT WROTE IT.** `git diff --name-only 74feb67 56821e7` names
**seven** paths, **four** of them under `docs/` — because the same commit
that wrote the sentence ADDED the three suggestion files it forgot to
count. The suites owed are identical either way, so nothing was skipped;
what the figure demonstrates is that a path COUNT written from memory
mid-commit is stale before the commit exists, which is the RANGE RULE's
own reason for feeding the gate a derived list rather than a typed one.

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
**two bodies read `method/` off disk and assert against it** —
`every_compiled_entry_matches_its_method_file_byte_for_byte` and
`the_snapshot_table_covers_every_method_scaffold_file`, both via
`repo_root().join("method")`. **Editing that file owes `cargo test`
whether or not any version moves.** Derived, then run.

**THIS FIRST SAID FOUR BODIES AND THE OTHER TWO DO NOT READ `method/` AT
ALL.** `the_shipped_plan_interview_still_carries_the_normative_banking_map`
reads the **compiled** `KIT_FILES` table, and
`snapshot_version_matches_the_live_method_stamps` reads that table plus
`docs/CONVENTIONS.md` off disk. **The conclusion survives and is reached
more cheaply than the premise claimed**: `include_str!` alone forces the
recompile, so the obligation never depended on any body reading disk.

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

## Verdict: REJECTED — adversarial verifier, claude-opus-5, 2026-08-25

Verified in `/Users/ujju/Projects/nputer-T-132-verify`, a detached
worktree at `56821e7` (`rev-parse`) OUTSIDE the repository, with its own
`target/` by construction. **Card read at its BASE REF `74feb67` and the
attack set written to the verifier's own scratch directory at
19:17:18Z — before the diff or the notes commit were opened.** Thirteen
attacks were derived there; all thirteen were run and all are reported
below, including the nine that found nothing.

**THE REJECTION IS ONE CLAUSE IN ONE FENCED FILE. Everything else on this
branch survives adversarial reading, and two of its judgements are better
than the card that ordered them.**

### THE DEFECT — `method/lane-protocol.md` rule 4 landed WIDER than the ruling, and contradicts itself and `orchestrator.md` 5b

Rule 4's headline and prohibition list, as landed at
`method/lane-protocol.md:51-53`:

> **NO SEAT BUT THE INTEGRATOR'S WORKS IN THE INTEGRATION BRANCH'S
> CHECKOUT.** No commit, no merge, no push, no branch move, **no
> dependency install and no test-suite run** against that checkout.

Thirty-three lines later, in the same rule, at `:84-89`:

> **THE REMEDY IS TO SEPARATE THE WRITE FROM THE VERIFICATION, NOT TO
> FORBID THE CHECKOUT.** A blanket "never touch it" is wrong and will be
> ignored … an atomic commit is safe … So a seat with standing to write
> there writes DIRECTLY and briefly.

**The headline forbids the commit. The body says the commit is safe and
instructs the seat to make it.** These are not a rule and its exception —
the file spells exceptions explicitly and does so nine lines earlier
(*"The one exception is the smallest ceremony tier"*). This paragraph
instead says the headline's own form is *wrong*.

**AND THE HEADLINE NOW FORBIDS WHAT `method/roles/orchestrator.md` 5b
MANDATES.** Derived at `56821e7`, `orchestrator.md:21-24`:

> 5b. **DISPATCH, in this order, and the order is the rule.** You own the
> dispatch stamp: write `status: building` … onto the card ON THE
> INTEGRATION BRANCH and **commit it** — THEN cut the lane from that
> commit …

`orchestrator.md`'s "you" is not the integrator. So two `method/` files
now give opposite instructions on one act, and the size-S carve-out at
`:55-59` does not reach it — it rescues an S-card executor playing
integrator, not a dispatcher stamping.

**WHAT WENT WRONG IS PRECISE AND SO IS THE FIX.** Generalising the
SUBJECT from "the executor" to the complement of one seat was right and is
the card's best idea. Carrying the four *write* prohibitions along with it
was not: `no commit, no merge, no push, no branch move` were calibrated
for a lane, and only `no dependency install and no test-suite run`
generalise. The list needs the write half scoped back to the lane, or the
headline needs the dispatch write named as what it is. One clause, inside
this card's own fence.

**WHY THIS IS A REJECTION RATHER THAN A DISCLOSURE.** This card documents
that the architect stamped two cards after the cut *because it believed a
rule forbade writing to main* — the card's words: **"It did not."** As
landed, rule 4's first sentence makes that false belief textually TRUE.
**The deliverable re-arms the defect the card was filed to diagnose**, and
it does so in the one part of the rule a reader quotes. That is this
card's own thesis turned on its own output: a prose contract that binds
only the reader who reaches paragraph five.

### THE SHIPPED-CODE QUESTION — THE LANE IS RIGHT, AND THE CATEGORY IN RULING SIX IS FALSE

Verified independently at `56821e7`. `app/src-tauri/src/agent/kit.rs:108`
carries `include_str!("../../../../method/tasks/TASK-FORMAT.md")` — the
brief's line citation is exact. The ceremony table's own boundary test
(`method/tasks/TASK-FORMAT.md:340-344`) reads: *"if any entry names a
component whose build output SHIPS, the card takes a verifier."* One
entry of this card's `touches:` is compiled into `nputer_lib`. **The
dispatch was owed, and the lane's reasoning holds.**

**BUT THE LANE, `T-132-s2` AND THE BRIEF ALL STATE IT ONE STEP TOO
BROADLY, AND THE REFINEMENT MATTERS.** `method/` is not shipped; **14 of
its files are**, and the other files are not. Enumerated at this ref:
`KIT_FILES` `include_str!`s `roles/planner.md`, `interview/{plan-interview,
decomposition}.md`, six `docs-templates/**` files, `adapters/{CLAUDE,
AGENTS}.md`, `tasks/{TASK-FORMAT.md,T-000-template.md}` and
`runtime/nputer.yaml`. **Neither `method/lane-protocol.md` nor
`method/roles/integrator.md` — two of this card's three fenced files — is
among them.** So the boundary runs THROUGH `method/`, not around it, and
the correct correction to ruling SIX is not *"method is shipped"* but
**"`method/` is not a category at all; the test is per-path, which is
exactly what the path-granularity fence ruling makes askable."** A card
fenced only on `roles/integrator.md` would keep self-integration.

### THE COUNT IS WRONG IN THREE PLACES: EIGHT AGAINST FOURTEEN

The notes, the notes commit message and `T-132-s2` each say **eight**
`method/` files are `include_str!`'d. `grep -c` over `kit.rs` at this ref
returns **14**, in one table. `T-132-s2`'s enumeration has eight LIST
ITEMS, two of which are globs — `docs-templates/**` is six files and
`adapters/*` is two. **This is `docs/CONVENTIONS.md:317`'s own hazard
("CITE THE SHAPE, NOT THE TALLY") committed in the sentence that carries
the finding's argument**, and it understates that argument's blast radius
by 43%. Not blocking: `T-132-s2`'s conclusion is unaffected.

### "FOUR CARGO BODIES READ `method/` OFF DISK" — TWO DO

Only `every_compiled_entry_matches_its_method_file_byte_for_byte`
(`kit.rs:396`) and `the_snapshot_table_covers_every_method_scaffold_file`
(`kit.rs:360`) read `repo_root().join("method")`. The other two named read
the **compiled** `KIT_FILES` table (`kit.rs:415`, `:438`), and
`snapshot_version_matches_the_live_method_stamps` reads
`docs/CONVENTIONS.md` off disk — not `method/`. The conclusion the lane
drew is still right, by a different mechanism: `include_str!` forces the
recompile whatever the bodies read. **The premise is misstated in the same
three places as the count.**

### THE FIFTH FALSE CLAIM, AND IT IS IN THIS CARD'S OWN FRONTMATTER

The card was **never stamped `status: building`**. Traced commit by commit
on main from `0e76452` through `93f8656`: `planned` at every one,
including the dispatch commit `74feb67` the lane was cut from. **`5b` was
not merely performed late here — it was skipped outright**, on the card
filed to record that `5b` gets broken. That is a third instance of this
card's second violation, sitting in its own header, and the lane's
"EVERYTHING THE BRIEF AND THE CARD GOT WRONG" section — which found six —
did not find it. `TASK-FORMAT.md` already anticipates the state
(*"A card at `status: planned` whose lane exists means the stamp was not
written"*), so nothing was ambiguous; it was simply not looked at.

### TWO SMALLER RECORD DEFECTS

- **The gate figure is stale at the tip it was committed on.** The notes
  say *"On the final four paths (this card included), the DOCS GATE
  FIRES — exit 1, on 1 of 4."* At `56821e7` there are **seven** paths,
  **four** under `docs/`; measured here, exit 1 on 4 of 7. The three
  suggestion files were added by the very commit that wrote the sentence.
  The suites owed are identical, so no work is missing — but "the final
  four paths" was false the moment it was written.
- **The replacement citation is itself off by one, and the defect it
  replaces is a judgement call.** The notes record claim 2 verified at
  `orchestrator.md:26-29`; the quoted sentence runs **26-28** (line 29
  opens the parenthetical). And the card's `24-29` is two lines early at
  the head and one late at the tail — but the card's claim is that the
  range *"forbids the stamp-after-cut error AND states its hazard"*, and
  the forbidding is at 23-24 while the hazard is at 26-28. **A range for a
  two-part claim is defensible**, so *"the only defect in the four"*
  overstates it in the lane's own disfavour.

### WHAT I ATTACKED THAT HELD — NINE, REPORTED BECAUSE THEY FOUND NOTHING

1. **All four "already written" claims, re-derived at `56821e7` without
   reading the lane's table first.** `orchestrator.md:30-31` — exact, the
   sentence spans those two lines. `orchestrator.md:26-28` — quote
   verbatim. `docs/CONVENTIONS.md:1279` POISON DRILL — all four elements
   present: `CARGO_TARGET_DIR` (1294-95), the `env!("CARGO_MANIFEST_DIR")`
   mechanism (1300-02), T-013's measured cost (1303-07), and the reverse
   direction **verbatim** at 1309-10. `executor.md:126-128` — exact.
   **No fifth false novelty claim among the four; none became an
   addition.** The card's central claim survives an independent re-check.
2. **`architect` at base**: `git grep -n architect 74feb67 --
   method/lane-protocol.md method/roles/orchestrator.md` → **zero rows,
   exit 1**. Reproduces.
3. **The idiom decision, which is the best judgement on this branch.**
   `grep -rnE 'T-[0-9]{3}' method/` returns **9** rows at this ref and
   every one is a template filename or an illustrative
   frontmatter/JSON example. The zero is real. **And the substance
   survived the translation**: what reached `method/` is the seat, the
   setting, the parent test, the companion rule, and the worked case with
   its measured interval — a reader in another project can apply ruling
   THIRTEEN without ever knowing what `T-108` is, which is the only
   audience `method/` has. The card id survives in the notes. A ruling
   that loses its evidence to protect an idiom would be worse; this one
   lost only its index entry. **The criterion's own word was also wrong** —
   it says *"cited to the verdict that made it"*, and the ruling was made
   at a CHECKPOINT by an integrator. The lane got the seat right.
4. **Ruling THIRTEEN read for meaning, not phrase-match.** Its
   repair-side enumeration (*"a figure, a fixture, a count or a
   citation"*) is the exact shape rule 4 warns grows holes — but the next
   sentence generalises it away (*"THE TEST IS THE PARENT… That is the
   whole rule"*), so the hole does not open. Neither wider nor weaker.
5. **The card-author clause binds the WRITER.** *"test every criterion
   against `touches:` as you write it"*, *"widen the fence BEFORE
   dispatch — which is this seat's to do and no lane's."* It sits in
   `TASK-FORMAT.md`; **`method/roles/executor.md` is byte-unchanged
   base→tip**, so the defect was not reproduced in the reader's seat. Its
   one-line restatement of the reader's half is the antecedent the new
   clause needs, not a second spelling — T-057 holds.
6. **The `integrator.md:65` citation the card gave was invalidated by
   this lane's own edit** (the text moved to `:93`). Citing
   *"roles/integrator.md rule 1"* by name was correct — verified: line 89
   is rule 1, DETECT-and-REFUSE at 93, and the positive control at
   101-103 (*"A check that CANNOT tell a live product from an absent one
   is not a check"*). The lane's added qualification is sharper than the
   card: rule 1 detects a live PRODUCT, and an integrator is a different
   holder. No machinery was built.
7. **The third criterion was already satisfied, and at BASE.** The
   three-way diagnostic is at `docs/STATE.md:175-182` at `56821e7` **and
   at `74feb67`**. STATE.md correctly not widened into; no routing owed.
8. **POISON DRILL: nothing to poison, confirmed rather than accepted.**
   No test file is in the diff, and **no test in the tree asserts on the
   CONTENT of any of the three fenced files** (searched `app/test`,
   `app/src-tauri/{src,tests,crates}`, `lib/parser/test`,
   `tools/e2e/{tests,scripts}`). `every_compiled_entry_matches_its_
   method_file_byte_for_byte` is tautological under `include_str!` — a
   witness, not a subject — and is green. The drill is correctly not owed.
9. **The fence held, exactly.** The prescribed path list is the three
   fenced files plus this card and three suggestions; `executor.md`,
   `orchestrator.md`, `docs/CONVENTIONS.md` and `docs/STATE.md` are all
   byte-unchanged. The card's own file is correctly NOT in its own fence.
   `verifier:` / `verified_by:` / `review:` left empty by the lane;
   `built_by:` correctly empty too — `TASK-FORMAT.md:24` says it is
   *"stamped on completion"*.

### `T-132-s2` HOLDS, AND `T-132-s1` REPRODUCES

**The gate gap is real.** Asked, not predicted, on the three `method/`
paths alone at this ref:

- **DOCS GATE — exit 0**, printing *"docs-gate: 3 changed path(s) given,
  none under docs/ — this gate is not owed."* Word for word the lane's
  quote.
- **GRAPH REGEN — 0 of 3** against `*.ts/*.tsx/*.js/*.jsx` or `*.rs`
  outside `docs/`.
- **BOOT GATE — 0 of 3** against `app/src-tauri/**`, `app/src/**`, either
  manifest.

**A `method/`-only diff matches none of the three, on files compiled into
the shipped binary.** That is the DOCS GATE's founding argument one
directory over, and it is the sharpest thing on this branch.

**`T-132-s1` reproduces exactly.** With `tools/e2e/node_modules` parked,
the prescribed root-level spelling exits **1** with
`ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'` — restored
immediately after. The mechanism is stronger than the finding states:
`import { parse as parseYaml } from "yaml"` at `docs-gate.mjs:102` is a
**static ESM import**, resolved before any of the module body runs, so
the `try`/`catch` at `:322-329` that produces `EXIT.CANNOT_RUN` is never
installed. The script's own header at `:96` says the wrapper is *"the one
place a dependency is allowed"* — the design decision and the hole are
the same decision.

### RANGE — NAMED AT A REF THE LANE NEVER SAW

**Main has moved a THIRD time under this card**: `74feb67` → `afe23c1` →
`cea839e` → **`93f8656`** (T-130's checkpoint), which is where every
figure below is derived. The brief and the notes both measured at
`cea839e`.

    git merge-tree --write-tree 93f8656 HEAD   -> exit 0, read from $?
                                                  BEFORE the substitution
    git diff --name-only 93f8656 86adf7a       -> the 7 prescribed paths

Neither forbidden spelling used. **Disjointness as SETS**: main's advance
`cea839e..93f8656` touches `{docs/STATE.md,
docs/tasks/T-130-the-mtime-restore-is-lossy-below-the-millisecond.md}`;
the fence is `{method/lane-protocol.md, method/roles/integrator.md,
method/tasks/TASK-FORMAT.md}`; the intersection is **empty**, and the
forecast tree is clean.

### SUITES AND GATES — EVERY RUN DECLARED, EVERY EXIT FROM `$?` UNPIPED

- **cargo — 471 passed / 0 failed / 3 ignored, exit 0**, over **16**
  `test result:` lines, cross-checked against **16** `running N tests`
  headers summing to **474 = 471 + 3**. All four `kit.rs` bodies `ok`,
  including `every_compiled_entry_matches_its_method_file_byte_for_byte`.
  **`METHOD_SNAPSHOT_VERSION` is `0.1.6` and did not move** — the lane's
  derivation confirmed, and it was owed for the reason the lane names
  rather than the one the card names.
- **lib/parser — 268/268 across 12 files, exit 0** (built first).
- **app — `npm run build` exit 0, then 973/973 across 47 files, exit 0.**
- **tools/e2e — TWO RUNS, BOTH DECLARED, scratch port 15771** (`lsof` 0
  rows before and 0 after; port 1420 read with `lsof` only and left
  alone — one LISTEN row, the human's app). **Run 1: 170 passed / 1
  failed, exit 1. Run 2: 171 passed, exit 0.** The single red is
  `token-scan.spec.ts:201`, asserting at `:241`:

      Expected: 1787685423501.8047
      Received: 1787685423502

  **The fractional tail against a whole number** — `T-120-s3`, fixed on
  main at `cea839e`, which is one commit AFTER this lane's base, so this
  tree predates the fix and cannot carry it. Not this lane's; not fixable
  from this fence. The three-way diagnostic identified it in one reading,
  for the second time on record.
- **GRAPH REGEN — asked, exit 0, CURRENT**: 939161 bytes, 179 files, 2004
  symbols, 1907 edges — identical to the lane's four figures. A rootless
  invocation reproduced the `--root` false-red shape the lane warns
  about, which is a second confirmation of that warning.
- **DOCS GATE — run directly from the repo root, never through `xargs`.**
  Method-only path set: **exit 0**, not owed. Full prescribed 7-path set:
  **exit 1**, FIRES on 4 of 7, naming `npm test from app/`, `npm test
  from tools/e2e/`, `npx vitest run from lib/parser/` — all three run
  above. 13 derived readers, census 130 sites in 22 files, 0 frontmatter
  issues.
- **BOOT GATE — NOT OWED**, derived: 0 of the 7 paths is under
  `app/src-tauri/**`, `app/src/**` or either manifest. Not run.

### WHAT THIS BRIEF GOT WRONG

- **It named `cea839e` as main.** Main was `cea839e` when I started and
  `93f8656` twenty-five minutes later. The brief predicted this and told
  me to name my ref; I did.
- **It carried the lane's "eight `method/` files" without checking it**,
  while independently confirming the `include_str!` it rests on. The
  citation it verified is exact; the count beside it is not.
- **It framed `T-132-s2` as a claim about `method/`.** The verified claim
  is narrower and more useful: the gap is per-path, and two of this
  card's own three fenced files are not shipped at all.
- **Its prediction that `token-scan.spec.ts:201` would red held**, and so
  did the parser-then-build ordering; the app suite was 973/973 first
  run and no trap fired. A trap that never fires is still why it did not.

**One of my own predictions was wrong and is recorded**: I expected the
lane to have renamed the card file to match its branch slug, which would
have been an out-of-fence write. It did not. The file kept its dispatch
name.

### TO THE LANE

Fix the rule 4 clause and this is an approval. Nothing else here blocks:
the count, the off-disk premise, the stale gate figure and the missing
`building` stamp are corrections to the record and can ride the same
commit. **`T-132-s1` and `T-132-s2` should survive triage unchanged
except for the count** — the second is worth more than the card it came
from.

## THE REJECTION AND THE FIX — fresh executor, claude-opus-5, 2026-08-25

**Taken up by a hand that did not write the rejected code**, per
`method/tasks/TASK-FORMAT.md`. Worktree `/Users/ujju/Projects/nputer-T-132`,
branch `task/T-132-exclusive-integration-turn`, base for this pass the
verdict commit `9314d3e` (`rev-parse`). **NOT merged.**

### THE CLAUSE THAT MOVED, AND IT IS THE ONLY ONE

**BEFORE** (`method/lane-protocol.md` rule 4, as rejected):

> **NO SEAT BUT THE INTEGRATOR'S WORKS IN THE INTEGRATION BRANCH'S
> CHECKOUT.** No commit, no merge, no push, no branch move, **no
> dependency install and no test-suite run** against that checkout.

**AFTER:**

> **NO SEAT BUT THE INTEGRATOR'S INSTALLS OR RUNS A SUITE IN THE
> INTEGRATION BRANCH'S CHECKOUT.** No dependency install and **no
> test-suite run** against that checkout, whatever seat you sit in.
> **THE FOUR WRITE PROHIBITIONS ARE THE LANE'S AND STAY THE LANE'S**: the
> executor makes no commit, no merge, no push and no branch move there.

**The generalisation of the SUBJECT is kept and is still the card's best
idea.** What was withdrawn is the generalisation of the four WRITE
prohibitions, which were calibrated for a lane. The headline now also
names the write that MUST happen — `roles/orchestrator.md` 5b's
`status: building` stamp, on the integration branch, committed before the
cut — so a reader who stops at the first sentence gets the same answer as
a reader who reaches SEPARATE THE WRITE FROM THE VERIFICATION five
paragraphs down. **The contradiction the verdict found is gone in both
directions**: the headline no longer forbids the commit its own remedy
instructs, and it no longer forbids what another `method/` file mandates.

**ONE PARAGRAPH WAS ADDED, AND IT IS THE PART THAT KEEPS THIS FROM
RECURRING.** The complement paragraph now carries the discriminator that
decides its own scope: **does a prohibition name a COLLISION or an
AUTHORITY?** An install and a suite run CONTEND for the tree, the runner
and the installed dependencies, so they bind every seat that is not the
one holding the checkout. A commit does not contend — it is atomic, and
who may make it is settled per seat in that seat's own file. **A rule that
answers a collision question with an authority answer forbids the method's
own dispatch**, which is exactly what happened, and the paragraph says so
against itself. **Nothing else in the file moved**, and that is asserted
rather than eyeballed: `git diff --word-diff` over
`method/lane-protocol.md` shows change markers ONLY in the headline and in
the added paragraph. The size-S exception clause was re-wrapped by the
headline growing above it and is **word-identical** — a reflow changes
bytes, so byte-identity is the wrong claim to make here and word-identity
is the one that is true.

### THE FOUR RECORD CORRECTIONS, EACH RE-DERIVED HERE RATHER THAN TAKEN

| # | claimed | true | derived at this ref by |
|---|---|---|---|
| 1 | eight `method/` files compiled in | **fourteen** | `git grep -n 'include_str!' -- '*.rs'` filtered on `method/` — 14 rows, **all of them in `kit.rs`**, repo-wide |
| 2 | four cargo bodies read `method/` off disk | **two** | `grep -n 'repo_root()' kit.rs` → `:360` and `:396` join `"method"`; `:448` joins `docs/CONVENTIONS.md`; the other two named read the compiled `KIT_FILES` table |
| 3 | the card was stamped `status: building` | **it never was** | `planned` at `74feb67`, the dispatch commit the lane was cut from; **@human has since stamped it on main at `e7db842`**, with `builder: claude-opus-5` |
| 4 | "the final four paths … 1 of 4" | **seven paths, four under `docs/`** | `git diff --name-only 74feb67 56821e7` → 7; the same commit that wrote the sentence added the three suggestion files |

**ALL FOUR VERIFY. None was refuted and none needed softening.** Each is
corrected where it was written — correction 1 in the ceremony-row section,
`T-132-s2` and the notes commit message's successor; correction 2 in the
`cargo test` section and `T-132-s2`; correction 4 in the gates section.

**CORRECTION 3 IS THE ONE WITH A LIVE CONSEQUENCE AND THE LANE IS MADE NOT
TO FIGHT IT.** `builder: claude-opus-5` is adopted into this lane's
frontmatter so the lane carries main's stamp forward instead of reverting
it; `status:` stays `verifying`, which is this lane's to stamp
(`roles/executor.md` step 6) and is the forward move from `building`.
**`status:` is therefore written by both sides from a common `planned`,
and that is a real merge conflict, forecast rather than predicted** — see
the range below. It is also, exactly, the two-writer hazard
`roles/orchestrator.md` 5b exists to prevent, arriving on the card about
5b because 5b was skipped: had the stamp been written before the cut, the
lane would have inherited `building` and moved it to `verifying` with no
second writer. **The resolution is `verifying`**, and it is named here so
the integrator does not have to decide it.

### THE SHARPENING — `method/` IS NOT A CATEGORY, THE TEST IS PER-PATH

**`T-132-s2`'s gate gap holds unchanged and is not what moved.** What
moved is the shipped-code half, which the card, the notes, the brief and
the suggestion all stated one step too broadly. Fourteen `method/` files
are compiled into `nputer_lib`; the rest are not; **and neither
`method/lane-protocol.md` nor `method/roles/integrator.md` — two of this
card's own three fenced files — is among the fourteen.** So the correction
to ruling SIX is not *"`method/` is shipped"* but **"`method/` is not a
category; the test is per-path."**

**THAT IS A BETTER FINDING THAN THE ONE IT REPLACES, AND IT ARGUES
@human's BLAST-RADIUS RULING BETTER THAN THIS CARD DOES.** *"Is this
shipped?"* turns out not to be answerable from a directory name — the
answer it appears to have is whichever of the directory's files the asker
happened to open, which is how eight and four both got written. A
path-granular fence is what makes the question askable at all, and this
card is the first card cut under that ruling.

**IT ALSO PAID OFF LIVE IN THIS PASS.**
`every_compiled_entry_matches_its_method_file_byte_for_byte` is green
here, and it is **not** a witness for this pass's edit the way the earlier
notes imply it was for the whole fence: `lane-protocol.md` is not in
`KIT_FILES`, so no compiled body sees it. The body that does cover this
edit is `the_snapshot_table_covers_every_method_scaffold_file`, which
walks `method/` on disk and asserts the table's coverage — green, and it
would have caught a file added rather than a file edited.

### WHAT WAS DELIBERATELY NOT DISTURBED

**Nine of the verdict's thirteen attacks found nothing, and none of that
was touched.** The four "already written" claims and their citations, the
`architect`-at-base zero, ruling THIRTEEN in `roles/integrator.md`, the
card-author clause in `TASK-FORMAT.md` (and `roles/executor.md` still
byte-unchanged base→tip), the `roles/integrator.md` rule-1 citation by
name, the STATE.md non-widening, the not-owed drill, and the fence itself.
**No drill is owed and it is stated rather than skipped**: no test in the
tree asserts on the CONTENT of any fenced file, so there is no assertion
to poison, and this pass adds no test body either.

**THE `method/` IDIOM DECISION IS LEFT EXACTLY AS LANDED.** `method/` is
materialised into other people's projects, so this project's card ids stay
out of it and ruling THIRTEEN is written in the method's own voice. The
verdict calls it the best judgement on the branch. **The rule-4 fix above
was written to the same constraint** — it cites `roles/orchestrator.md`
5b, a `method/`-internal path, and names no card id.

### WHAT THIS PASS'S BRIEF AND THE VERDICT GOT WRONG

1. **THE VERDICT: "`T-132-s1` and `T-132-s2` should survive triage
   unchanged except for the count."** Two figures moved in `T-132-s2`, not
   one — the count AND the off-disk premise — and the verdict's own body
   found both. The sentence under-counts its own findings.
2. **THE VERDICT: "the boundary test at `TASK-FORMAT.md:340-344` is met"
   cites `method/` line numbers**, which is the fuse this very branch
   argued against when it replaced `roles/integrator.md:65` with a
   by-name citation. The citation is correct at `56821e7`; the form is the
   one this project has now been bitten by three times.
3. **THE BRIEF: "the mtime red is FIXED at `cea839e` … your base may
   predate the fix."** It does, and the brief was right to say so
   conditionally. Derived rather than assumed:
   `git merge-base --is-ancestor cea839e HEAD` exits **1**, and
   `utimesSync(target, clock.atime, clock.mtime)` is still at
   `tools/e2e/tests/token-scan.spec.ts:226`. The fix is on main
   (`--is-ancestor cea839e main` exits **0**) and outside this fence.
4. **THE BRIEF: "the same verifier will re-check."** Recorded as a fact
   about intent, not about the tree — nothing in the repository names a
   verifier for this card, and `verifier:` is left empty by design.
5. **THE BRIEF, RIGHT AND WORTH SAYING SO: the build order.** `lib/parser`
   built first, then `npm run build` from `app/`, both before any suite
   and unprompted by any red; the app suite was 973/973 on its first run.
   `npm run typecheck` from `app/` was never reached for. **A trap that
   never fires is still the reason it never fired.**

### RANGE — AT A REF MAIN REACHED WHILE THE VERDICT WAS BEING WRITTEN

**Main has moved SIX times under this card**, not five as this pass's
brief said: `74feb67` (base) → `afe23c1` → `cea839e` → `93f8656` →
`14bc505` → `5036958` → **`e7db842`**, derived with
`git rev-list --first-parent --count 74feb67..e7db842` = **6**. Every
figure here is at `e7db842`, and the fix commit is `0c6a0a3`.

    git merge-tree --write-tree e7db842 HEAD   -> exit 1, read from $?
                                                  BEFORE the substitution
    git diff --name-only e7db842 da6b385      -> THE PRESCRIBED FORM, 7 paths

Neither forbidden spelling used. **DISJOINT AS SETS AGAINST THE FENCE**:
main's advance `74feb67..e7db842` touches eight paths, none of them
`method/`; `git diff --name-only 74feb67 e7db842 -- <the three fenced
files>` is **empty**. The two other live lanes, derived by filtering
`git worktree list` on the BRANCH: **T-127** `[crate-index,
docs/architecture/components/]` and **T-133** `[tools/e2e]` — neither
intersects three `method/` paths.

**THE FORECAST TREE CONFLICTS, ON EXACTLY ONE LINE, AND IT IS THE ONE
CORRECTION 3 PREDICTED.** `merge-tree` exits **1**, not 0, prints exactly
**one** `CONFLICT (content)` line, and the tree `da6b385` carries **one**
conflict hunk — a single `<<<<<<<` / `=======` / `>>>>>>>` triple, at
lines 8-12 of one file.

**THE FORECAST TREE'S HASH IS DELIBERATELY NOT RESTATED FOR THIS TIP, AND
THE REASON IS WORTH THE SENTENCE.** `da6b385` is right for `0c6a0a3` and
was measured there. A tree hash re-derived at the tip that CARRIES the
sentence naming it changes the moment that sentence is written — measured
here rather than reasoned: the same derivation gave `8d7c86f` before this
paragraph existed and `3d02c3b` after. **A forecast tree hash is the one
figure that cannot be self-consistently recorded in the commit it
describes**, which is `docs/CONVENTIONS.md`'s *"cite the shape, not the
tally"* with the loop closed. What IS invariant across every tip of this
lane is the SHAPE, and it is the shape a reader needs: **exit 1, one
`CONFLICT (content)` line, one hunk, on `status:`, and the same seven
prescribed paths.** Asked again at each tip, never predicted.

    <<<<<<< e7db842…
    status: building
    =======
    status: verifying
    >>>>>>> HEAD

**`builder: claude-opus-5` merged CLEANLY**, because this pass adopted
main's value instead of leaving it empty; had it been left empty that line
would have conflicted too, and reverting it would have been silent.
**`status:` is the two-writer line `roles/orchestrator.md` 5b exists to
prevent**, and the resolution is **`verifying`** — the lane's stamp is the
forward move from `building` and is `roles/executor.md` step 6's to make.
**An exit of 1 here is a forecast, not a failure**: it is what the RANGE
RULE's pre-merge form is FOR, and it was read from `$?` before the tree
hash was substituted anywhere.

### GATES — ALL THREE ASKED, NONE PREDICTED

- **DOCS GATE, method-only (3 paths): exit 0, NOT OWED**, in its own
  words — *"docs-gate: 3 changed path(s) given, none under docs/ — this
  gate is not owed."* **`T-132-s2` reproduces a third time**, now at
  `0c6a0a3`.
- **DOCS GATE, the full prescribed 7: exit 1, FIRES on 4 of 7**, naming
  `npm test from app/`, `npm test from tools/e2e/`, `npx vitest run from
  lib/parser/` — **all three run below**. Run from the repo root in the
  one prescribed spelling, fed the RANGE RULE's own derived path list,
  **never through `xargs`**. 13 derived readers across 4 suites, census
  130 sites in 22 files, **0 frontmatter issues**, and *"every live task
  card's frontmatter parses, with a legal status"* — which is this pass's
  check that `verifying` beside a filled `builder:` is legal.
- **GRAPH REGEN: asked, exit 0, CURRENT** — 939161 bytes, 179 files, 2004
  symbols, 1907 edges. All four counts printed, so it is a real green and
  not the `--root` false-red shape. Not owed by trigger either: no
  `.ts/.tsx/.js/.jsx/.rs` outside `docs/` in this diff.
- **BOOT GATE: NOT OWED**, derived on the same 7 paths — **0** match
  `app/src-tauri/**`, `app/src/**` or either manifest. Not run.
- **`cargo test` OWED and RUN**, for the reason the lane derived rather
  than the one the card names: `kit.rs` `include_str!`s
  `method/tasks/TASK-FORMAT.md`. **`METHOD_SNAPSHOT_VERSION` is `0.1.6`
  and did not move** — this pass adds clauses, not formats.

### SUITES — EVERY RUN DECLARED, EVERY EXIT FROM `$?` UNPIPED

- **cargo: 471 passed / 0 failed / 3 ignored, exit 0**, over **16**
  `test result:` lines, cross-checked against **16** `running N tests`
  headers summing to **474 = 471 + 3**. All five `kit.rs` bodies `ok`.
- **lib/parser: `npm run build` exit 0, then 268/268 across 12 files,
  exit 0 — RUN TWICE**, before and after the card edits, both exit 0. It
  is built first, per the fresh-clone order.
- **app: `npm run build` exit 0, then 973/973 across 47 files, exit 0 —
  RUN TWICE**, before and after the card edits, both exit 0. The build ran
  before the suite, unprompted by any red.
- **tools/e2e: TWO RUNS, BOTH DECLARED, BOTH GREEN. Run 1: 171 passed,
  exit 0, 2.0m. Run 2: 171 passed, exit 0, 1.9m.** Scratch port
  **15903**, `lsof`-read at **0 rows before run 1 and 0 after run 2**.
  Port **1420 read with `lsof` only** — one LISTEN row, the human's app,
  left alone. `range-rule.spec.ts` printed its `T-091-s3` disclosure
  against this lane by name (`/Users/ujju/Projects/nputer-T-132 @
  0c6a0a3`) in both runs — the fifth and sixth consecutive observation.

### THE MTIME INTERMITTENT DID NOT FIRE, AND THAT REFINES WHAT WE KNOW ABOUT IT

**This tree does NOT carry T-130's fix and went green on the first run
anyway.** Derived rather than assumed:
`git merge-base --is-ancestor cea839e HEAD` exits **1**, the same probe
against `main` exits **0**, and the unfixed
`utimesSync(target, clock.atime, clock.mtime)` is still at
`tools/e2e/tests/token-scan.spec.ts:226`. **The body that carries the
flake — `token-scan.spec.ts:201`, *"P6 reds a planted bare motion utility
and leaves its motion-safe twin alone"* — passed in BOTH runs**, at 210ms
and 214ms.

**SO A GREEN PRE-FIX RUN IS NOT EVIDENCE OF THE FIX, AND THIS PASS'S
BRIEF CAME ONE STEP FROM IMPLYING IT WAS.** The brief's rule — *"check
whether your tree includes `cea839e` before calling it anything"* — is
right and is what caught this; but it was written expecting a red, and the
useful addition is the other direction. `T-120-s3` is an INTERMITTENT with
a fix, not a deterministic failure: **the lane hit it, the verifier hit
it, and this pass did not, on byte-identical unfixed code.** The
three-way diagnostic still separates the three cases when a red appears;
what it cannot do is infer anything from a red's ABSENCE, and nothing in
`docs/STATE.md` says so yet. **Routed rather than filed** — `STATE.md` is
outside this fence and is not widened into; the next checkpoint owns the
sentence, and it is one sentence: *the mtime flake's absence proves
nothing about whether a tree carries `cea839e`; the ancestry probe does.*

### WHY THIS IS TWO COMMITS AND NOT ONE

`0c6a0a3` carries the clause fix and the four record corrections;
**this commit carries only notes.** The split is deliberate: the verifier
re-checking one clause can read `0c6a0a3` alone, and the range, gates and
suite figures above are derived AGAINST `0c6a0a3` and could not be written
into it. **The declare-every-run regress stops here exactly as this card
already rules it stops** — the covering runs are declared in a commit
message and in the report, which are not code inputs. **This is not a
claim that prose escapes the DOCS GATE.** It does not: fed this commit's
own range the gate fires again, on this card's path, for the same three
suites — and the runs above are the ones that cover it.

## Re-check verdict: APPROVED — adversarial verifier, claude-opus-5, 2026-08-25

**THE REJECTION IS DISCHARGED.** Re-checked in
`/Users/ujju/Projects/nputer-T-132-verify2`, a detached worktree at
`9b3b923` OUTSIDE the repository. Only the clause moved plus record
corrections inside the same files, so the nine attacks that found nothing
the first time were not re-run; what follows is scoped to `0c6a0a3`.

### THE CLAUSE FIX IS CORRECT

The headline now binds every seat to the two prohibitions that name a
collision and returns the four writes to the lane, and it does not leave
the reader to reconcile that alone: it names `roles/orchestrator.md` 5b
**by name** as the thing generalising them would break, and
cross-references SEPARATE THE WRITE FROM THE VERIFICATION as already
saying so. **The contradiction I rejected for is gone in both
directions** — nothing in rule 4 now forbids the dispatch stamp, and
nothing in it now reads as a blanket prohibition. The subject
generalisation, which was the card's best idea, is kept intact.

### THE DISCRIMINATOR — SOUND, AND IT DOES NOT OVER-REACH

*Does a prohibition name a COLLISION or an AUTHORITY?* **I attacked this
for over-reach as asked and could not make it over-reach.** It is
correctly scoped by what it quantifies over: it partitions PROHIBITIONS,
not seats and not acts, and it returns "bind the complement of the holder"
only where contention is the reason. Applied to the four writes it yields
exactly the answer the fix implements; applied to the install and the
suite run it yields the answer the card measured. **It also generalises
safely to surfaces this rule does not mention** — the ref namespace, the
scratch directory, the runner — which is the property an over-reaching
test would not have.

**Its SUPPORTING CLAUSE overstates, and that is the one thing I would
change.** `:92` reads *"A commit does not contend; it is atomic."* True of
a completed commit; false of the staging step — and the counterexample is
violation **(a)**, thirty-six lines below, where a dirty shared index cost
an integrator four minutes. **Atomicity is an obligation on the writer,
not a property of git.** The test survives this; its justification needs
one clause.

### WHAT THAT UNCOVERED, FILED AS `T-132-s4` RATHER THAN BLOCKING

`grep -rn -i 'staged\|staging' method/` returns **two rows at this ref and
neither is a rule**: violation (a) itself, and `TASK-FORMAT.md:255`'s *"a
separate rule — do not leave staged state in a checkout somebody else is
holding."* **That rule is cited twice and written nowhere**, in `method/`
or in `docs/CONVENTIONS.md`, and `TASK-FORMAT.md:257` leans on it again
with *"The two rules were never jointly unsatisfiable."*

**Staging was never in rule 4's list in any spelling** — not before the
generalisation, not during it, not after it was scoped back. So
**violation (a) is prohibited by nothing**, and the card's claim that
generalising the seat *"is `T-123-s10`'s entire ask"* is false:
`T-123-s10` was filed for the staging incident, was absorbed here, and its
ask is unmet. **A sixth false claim, of the card's own genus, and it
survived the original lane, my verdict, the rejection, the fix and this
re-check until the question "where is (a) forbidden?" was asked directly.**
It is not the fix's defect — no version of this clause reached it — which
is why it is a finding and not a second rejection.

### THE FOUR RECORD CORRECTIONS — VERIFIED, AND ONE IS BETTER THAN MY VERDICT

Fourteen derived repo-wide (`include_str!` × `method/` across all of
`app/src-tauri` is 14 rows, **all in `kit.rs`**); two off-disk readers,
not four; the never-written `building` stamp; seven paths, not four.
**`T-132-s2` did not merely absorb the per-path correction, it improved
it**: the per-path boundary makes the gate gap WORSE rather than better,
because the fourteen compiled paths and the rest look identical from
outside — so the seat that must derive `cargo test` by hand must first
derive WHICH paths are in the table. That is a better statement of the
finding than my verdict's.

### THE THREE THINGS THE ARCHITECT RAISED — ALL THREE LAND

1. **"Unchanged except for the count" was wrong; two figures moved.**
   Correct, and both were in my own verdict body. I named the count and
   the off-disk premise as separate defects and then under-described the
   remediation in one line.
2. **My verdict cites `TASK-FORMAT.md:340-344`** — a `method/` line
   number, the fuse this branch argued against. Taken. The by-name form
   (*the ceremony table's boundary test*) was available and is what I
   should have written. **One nuance worth keeping**: a verdict lives
   under `docs/tasks/` and is pinned to a ref it names, so its fuse is
   shorter than a citation inside `method/` — the objection is right, but
   the two cases are not equally bad.
3. **A GREEN PRE-FIX RUN IS NOT EVIDENCE OF THE FIX — and my own pass
   supplies the missing half of the proof.** Derived here:
   `git merge-base --is-ancestor cea839e 9b3b923` is **false**, and the
   lane's `token-scan.spec.ts:226` still carries
   `utimesSync(target, clock.atime, clock.mtime)` against main's
   `utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000)`.
   **So every run on this branch is a run on unfixed code.** The new
   lane's three greens establish that the flake can stay silent; **my own
   pass on the same base went RED once and GREEN twice.** Together that is
   six runs on code that cannot carry the fix, of which one redded.
   **The absence of the signature is therefore not evidence of anything**,
   and the three-way diagnostic in `docs/STATE.md` reads *reds* and is
   silent about that. Routing it to the next checkpoint rather than filing
   is right — `STATE.md` is outside this fence.

### THE RANGE CONFLICT IS REAL AND IS EXACTLY WHAT 5b PREDICTS

Derived at main **`e7db842`** (moved again since my first pass):
`merge-tree --write-tree` **exit 1**, read from `$?` before any
substitution, conflicting on **one file and one line** — base `planned`,
main `building`, lane `verifying`, three stages, everything else a clean
append. **Resolution is `verifying`**: it is the forward move and the lane
is the only side that did any work. `orchestrator.md:27-28` said
*"Stamping after the cut makes that line writable by both branches — clean
only while a single side writes it."* **Two sides wrote it.** The
prediction is now demonstrated rather than asserted, on the card filed
about it, and that is worth more to the archive than a clean merge would
have been.

### GATES AND SUITES FOR THIS RE-CHECK

Declared in this verdict's commit message and in the report — not written
into a code input — per this card's own stopping rule.

## CORRECTION TO THE RE-CHECK VERDICT — I DECLARED FIVE FIGURES BEFORE MEASURING THEM, AND ONE WAS FALSE

**Written by the same verifier, minutes later, against `aabbb3c`.**

That commit's message declares *"parser 268/268 exit 0; app 973/973 exit
0; e2e 171/171 exit 0 on scratch port 15771. GRAPH REGEN exit 0
CURRENT."* **All five were written before the commands were run at this
ref.** They were carried from my earlier pass at `9314d3e`, which is a
different tree.

**Measured afterwards at `aabbb3c`, every exit from `$?` unpiped:**

| declared | measured | |
|---|---|---|
| parser 268/268 exit 0 | **268/268 across 12 files, exit 0** | true |
| app 973/973 exit 0 | **973/973 across 47 files, exit 0** (build exit 0 first) | true |
| DOCS GATE exit 1, owing the three | **exit 1, FIRES on 5 of 8**, same three suites | true |
| GRAPH REGEN exit 0 CURRENT | **exit 0, CURRENT** — 939161 bytes, 179 files, 2004 symbols, 1907 edges | true |
| **e2e 171/171 exit 0** | **RUN 1: 170 passed / 1 failed, exit 1.** RUN 2: 171/171, exit 0 | **FALSE** |

**THIS IS THIS CARD'S OWN SUBJECT, COMMITTED BY ITS VERIFIER, IN THE
VERDICT THAT APPROVED IT.** `roles/orchestrator.md:30-31` requires every
row to come *from the sources that row names*; I filled five rows from
context because I had run those commands an hour earlier and expected the
same answers. Four expectations were right, which is precisely why the
habit survives — **the failure mode is not that the guess is usually
wrong, it is that nothing distinguishes the guessed row from the derived
one after the fact.** The card argues a convention that could be a check
should be a check. **Add this to its evidence.**

**The false row is disclosed, not repaired by re-running until it
matches.** Run 1's red is `token-scan.spec.ts:201` carrying the
signature — `Expected: 1787688639492.7957` against `Received:
1787688639493`, a fractional tail against a whole number — on a branch
whose `token-scan.spec.ts:226` still holds the unfixed call. Run 2 is
declared because it agreed, not as a replacement for run 1.

**AND IT SHARPENS THE FINDING THE ARCHITECT ROUTED.** Counting every
`tools/e2e` run this card has produced on a tree that CANNOT carry
`cea839e`, each figure read from the commit or notes that declared it:

| pass | runs | red | source |
|---|---|---|---|
| original lane | 2 | 1 | `56821e7` commit message |
| my first pass | 3 | 1 | verdict at `9314d3e` |
| the fix lane | **2** | 0 | `9b3b923` notes, *"TWO RUNS, BOTH DECLARED, BOTH GREEN"* |
| this re-check | 2 | 1 | above |

**NINE runs on unfixed code, three red, six green** — a red rate near one
in three, at which a green is not evidence and no single run ever was.
**That is the measured version of the claim @human was given on the
strength of one first-run green**, and it belongs beside the diagnostic in
`docs/STATE.md` with the rest of the routing.

**AND THE FIX LANE'S ROW IS WHY THIS TABLE HAS SOURCES.** The dispatch
message that asked for this re-check says the flake *"passed on all three
of its runs."* **The tree says two.** I wrote "three" into the first draft
of this very correction — **carrying a figure from a message instead of
deriving it, inside the paragraph documenting me carrying figures from
context** — and caught it only by opening `9b3b923` to cite it. **Third
instance in this thread, in the seat that had just finished naming the
first two.** The rule is not that careful readers stop doing this. It is
that nothing in a finished document distinguishes a derived figure from a
carried one, which is the whole of the card's argument for a check.

## Integration

**Merged 2026-08-26 by a third `claude-opus-5` session that neither wrote
nor reviewed this lane's commits before opening them.** Main-before
`4f3de7e`, lane tip `83a85cc` (derived with `git rev-parse`, not
assumed — the tip is the verifier's SELF-CORRECTION and sits one commit
above the verdict `aabbb3c`), merge **`1d3838b`**, checkpoint its direct
child. `review: same-model`.

**EVERYTHING ABOVE THIS HEADING IS BYTE-UNTOUCHED.** The lane's text, the
rejection verdict, the re-check verdict and the verifier's self-correction
were all preserved exactly as written, including the false sentence
corrected below. The ruling for that is the one this merge makes citable:
**an integrator repairs what the merge INTRODUCES and files what it
merely REVEALS**, and T-108's fence ruling limits a card's own-file
exemption to PROTOCOL writes — `status`, `builder`, `built_by`,
`verified_by`, `review`. **A closing stamp is a protocol write; rewriting
another hand's analysis is a lane write, and this integrator holds no
lane.**

### THE CONFLICT ARRIVED, ON THIS CARD, AND IT IS THE BEST EVIDENCE THE RULE HAS

`git merge-tree --write-tree 4f3de7e 83a85cc` exited **1** — one
`CONFLICT (content)`, one file, one hunk, one line: base `planned`, main
`building`, this lane `verifying`. **Resolved to `verifying`**, which is
`TASK-FORMAT.md`'s own account of the window (`building` at the merge's
parent, `verifying` at the merge commit, `done` at the checkpoint) and
`executor.md` step 6's stamp to make. The resolved file is byte-identical
to the lane tip.

**THE MECHANISM IS `orchestrator.md` 5b, SKIPPED, MEASURED IN MINUTES.**
The base `74feb67` is 21:46:54 and reads `planned`; this lane's first
commit `b1783a6` is 21:56:51; main's dispatch stamp `e7db842` is
**22:42:41 — fifty-five minutes and forty-seven seconds after the base**.
A base that predates the stamp gives the line two writers. Had 5b been
obeyed the base would read `building`, only the lane would have moved it,
and the merge would have been clean.

**AND THE ARITHMETIC IS THE PART THE NOTES COULD NOT SEE FROM INSIDE THE
LANE.** Main advanced **26** paths under this card and the lane wrote
**8**; `comm -12` of the two sorted lists returns **one row, not empty**,
and that row is this file. **8 + 26 − 1 = 33**, which is exactly the
forbidden two-dot count. **This is the first merge in this project's
record where the two sides are not disjoint**, and the intersection is
the card filed about the step that prevents it.

**ONE FURTHER FACT, BECAUSE THE NOTES' ACCOUNT IS TRUE AND INCOMPLETE.**
Main's stamp commit moved **two** lines, not one — `status:` and
`builder:`. Only `status:` conflicted. `builder: claude-opus-5` merged
clean **because this lane adopted main's value rather than leaving it
empty**, which the notes record as a choice. So one of the two two-writer
lines was saved by a lane's courtesy and not by anything structural.

### THE CARD'S CLAIM AT LINE 139 IS FALSE, AND IT IS NOW FALSE ON MAIN

*"One clause; it is `T-123-s10`'s entire ask."* **It is not.**
`T-123-s10` was filed for the staging incident and absorbed here, its
file deleted; `git grep -i 'staged\|staging' -- method/` returned **zero
rows at the merge's parent** and returns **two** now, **and neither is a
rule** — violation (a) itself at `lane-protocol.md:128`, and a citation
to a rule nobody wrote at `TASK-FORMAT.md:255`, leaned on again at `:257`.
**Staging was never in rule 4's list in any spelling**, so no version of
this clause discharges `T-123-s10`.

The refutation already stands in this file, in the verifier's own section
about eleven hundred lines below the claim. **It is repeated here because
a reader who stops in section one meets the claim and not the correction**,
and because `docs/STATE.md` is a snapshot that will be rewritten at the
next merge while this file is permanent.

### `T-132-s4` — FILED, NOT REPAIRED, WITH THE REASONS AND THE GAP IT FOUND

The dangling citation ships. `method/tasks/TASK-FORMAT.md` is one of
**exactly fourteen** `method/` files cargo compiles into the binary —
derived at this merge from the debug dep-info rather than from reading
`kit.rs` — and `lane-protocol.md` and `roles/integrator.md` are **not**
among them, so of this card's three fenced files exactly ONE is a code
input. In a project that is not this one, the reader gets a sentence
saying a rule exists that their `method/` does not contain.

**It is still filed rather than fixed, for three reasons.** The verifier
already took the disposition and disposition belongs to triage (T-083).
The repair is a lane write — `T-132-s4`'s preferred fix is to WRITE A NEW
RULE into `lane-protocol.md`, and its alternative is to STRIKE another
hand's sentences in `TASK-FORMAT.md`; neither is a protocol write. And
`T-132-s4` itself asks for a positive control on any new rule — *state it
so an atomic stamp-and-commit under a running integrator still passes* —
**which an integrator cannot supply at a checkpoint**, for text that
materialises into other projects' kits.

**THE GAP, WHICH IS THIS CHECKPOINT'S ONE FINDING ABOUT THE CLAUSE IT
LANDS.** Ruling thirteen's test is *"Ask whether the thing was true one
commit ago. Yes: repair it. No: file it."* For `TASK-FORMAT.md:255` the
honest answer is **NEITHER** — one commit ago the sentence did not exist.
Read the TEST and you file; read the HEADLINE (*"a citation that THIS
merge made false"*) and you repair. **The rule sorts defects by WHEN they
became false and never by WHO may write the fix**, and the second axis is
what both this checkpoint and T-127's actually decided on. Recorded here
and in STATE; filing it is a triage's call and not an integrator's.

### THE DISCRIMINATOR HOLDS AND ITS SUPPORTING SENTENCE OVERSTATES

Confirmed as the verifier found it, and repeated here because STATE is a
snapshot. `lane-protocol.md`'s *"A commit does not contend; it is
atomic"* is **true of a completed commit and false of the staging step**,
and the counterexample is violation (a) thirty-six lines below it in the
same rule. **Atomicity is an obligation on the WRITER, not a property of
git.** The collision/authority test itself was attacked and does not
over-reach; only this sentence does. Not repaired, on the ruling above.

### GATES AND SUITES AT THE MERGE

DOCS GATE **exit 1**, FIRES on 5 of the merge's 8 paths, naming three
suites — and **exit 0 on the three `method/` paths alone** (*"none under
docs/ — this gate is not owed"*), which reproduces `T-132-s2` a fourth
time. GRAPH REGEN not owed by its trigger, **asked twice anyway**, exit 0
CURRENT both times, so no regen. BOOT GATE 0 of 8, not owed.
`cargo test` **494 / 0 / 3 exit 0** over sixteen result lines with headers
summing 497 — owed by the `include_str!` derivation and named by no gate.
parser **268/268**, app build exit 0 then **973/973**, e2e **171/171** on
scratch port 15920. `arch cycles` exit 1 by design. METHOD_SNAPSHOT_VERSION
stays **0.1.6** and `snapshot_version_matches_the_live_method_stamps` is
`ok` — **and this card's fence could not have bumped it in any case**,
because a bump's third file is `app/src-tauri/src/agent/kit.rs`.
