---
id: T-229
title: A POSITIVE CONTROL THAT CANNOT FAIL IS THE MOST COMMON DEFECT THIS PROJECT PRODUCES — four in one sitting, each green because the ARMING made both sides agree, and the fourth appeared inside the fix for the third
feature: F-06
milestone: 4
priority: 2
size: M
status: done
blocked_by: []
touches: [method/tasks/TASK-FORMAT.md, method/roles, docs/CONVENTIONS.md, method/interview/plan-interview.md, app/src-tauri/src/agent/kit.rs, tools/method-evals]
suggested_by: "the architect/integrator seat, 2026-09-01 — filed after noticing that the sitting's largest finding was the only one with no card, while four narrower ones had been filed the same night"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**FOUR IN ONE SITTING, AND THE FOURTH WAS INSIDE THE FIX FOR THE THIRD.**

This project asks for a positive control on every guard-class card, and
the request is right. **What it does not ask is whether the control can
FAIL** — and four times on 2026-09-01 the answer was no, in four
different modules, found by four different agents, never by the body the
control was written to protect.

| card | the control | why it could not fail |
|---|---|---|
| `T-203` | *the receipt is git-ignored*, against an ordinary file as control | the DISPATCHER writes the ignore rule at lane setup, so both sides were decided by one act. On a fresh clone both answered the same. |
| `T-221` | a fixture guard proving a domain is DERIVED | its kill set was contained in another body's under every CODE mutant; only a DATA mutant separated them |
| `T-211` | *the card stays writable throughout a widening* | claimed for a state never measured; in that state everything blocks, including the card |
| `T-210` | *the tree stays clean under the lock* | every file the fixture built was mode 644, and the repository's only two tracked 755 files were not among them |

**The common shape, and it is not carelessness.** In each case one
arrangement decided BOTH the subject's answer and the control's. The
control was not comparing itself against the subject; it was agreeing
with it, for a reason that lived outside the code under test.

> **A CONTROL IS ONLY A CONTROL WHERE THE ARMING DIFFERS.**

## Why this is worth a card rather than a habit

**Because it survived every mechanism this project already has.** Each of
these cards was guard-class, carried `review: independent`, was drilled
with mutants, and was read by a blind verifier working from an attack set
stamped before the diff. All four defects went through all of that.

Three were caught by a verifier reproducing the claim in a DIFFERENT
ENVIRONMENT — a fresh clone, a separate bench, a mutated fixture. **That
is the only thing that caught any of them**, and it is currently a habit
rather than a rule.

And the fourth is the argument in miniature: `T-210`'s verifier SUGGESTED
a control, the lane implemented it faithfully, and the result could not
fail. **A verifier proposing a degenerate control is the same defect one
level up.** The lane caught it on itself, which is luck plus diligence
and not a mechanism.

## What a fix decides

1. **Whether a positive control must be shown to FAIL before it is
   trusted to pass.** `T-203`'s lane did exactly this, unprompted — ran
   three new bodies against the pre-fix code, saw all three fail, then
   fixed and re-ran green. That is the cheapest known defence and it is
   currently nobody's rule.
2. **Whether "in a different environment" can be stated precisely enough
   to require.** *A fresh clone* worked for `T-203`. *A planted fixture
   file* worked for `T-210`. *A data mutant* worked for `T-221`. The
   general form is: the control must be evaluated where nothing
   pre-arranged its answer — and naming that in a way a card can be held
   to is the hard part of this card.
3. **Whether the mutant class has to be named.** `T-221` proves a
   code-only drill mis-grades a derivation guard BY CONSTRUCTION. If a
   card's property lives in DATA, its drill owes a data mutant, and no
   count of code mutants substitutes.

## Acceptance criteria

- THE method SHALL require that a positive control be DEMONSTRATED
  FAILING against an implementation that lacks the property, and a card
  SHALL record that demonstration rather than asserting it.
- WHERE a control and its subject are decided by the same arrangement,
  that SHALL be named as a defect by whoever notices, and the remedy
  SHALL be to evaluate the control where the arrangement is absent.
- **A DRILL WHOSE PROPERTY LIVES IN DATA SHALL CARRY A DATA MUTANT.** A
  kill set measured only over code mutants is not evidence about a
  derivation guard.
- **A POSITIVE CONTROL SHALL PROVE THIS CARD'S OWN RULE DOES NOT REFUSE
  EVERY BODY** — a rule that grades every existing control degenerate is
  indistinguishable from one that works, and this card would be the
  funniest possible place to reintroduce its own defect.
- THE four instances above SHALL be cited by card id, because a rule
  stated without its measurement reads as advice (`T-146`).
- Verification: headless.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.

## Read beside

`T-203`, `T-221`, `T-211`, `T-210` — the four instances, each carrying
its own verdict. `T-146` (a rule that lives only in records is a rule
nobody obeys — this one is being written into `method/` for that reason).
`T-213` (blindness has more channels than the instruction enumerates —
the same shape of finding, one level up: **a safeguard is only as good as
the channels nobody has enumerated**).

## Why this was filed late, which is itself the finding's shape

Four narrower cards were filed the same night — `T-225`, `T-226`,
`T-227`, `T-228` — while **the sitting's largest finding got a sentence
in a summary and no card.** It was the thing every verdict kept
rediscovering, which made it feel already-handled; a defect that shows up
four times reads as understood rather than as open.

**Nothing was recording it.** That is the same failure as `T-146`'s, in
the same sitting, by the same seat.

## Absorbs: T-167-s11, T-189-s2 (2026-09-02) — riders on the method bump this card owes

This card edits `method/tasks/TASK-FORMAT.md` and `method/roles/`, both
SHIPPED bytes, so it owes the method version bump (v0.1.9): the three
stamps — the first gotcha of docs/CONVENTIONS.md, the Output heading of
method/interview/plan-interview.md, and `METHOD_SNAPSHOT_VERSION` in
app/src-tauri/src/agent/kit.rs — moved in ONE commit, and
`node tools/method-evals/run.mjs --bump` recorded in that commit's
message. Its fence is widened at dispatch to reach those three files.
Two editorial riders ride the same bump:

- **T-167-s11**: `method/roles/executor.md`'s report row offers the two
  restoration proofs as an either/or — *"a sha256 or an empty per-path
  diff"* — and docs/CONVENTIONS.md's POISON DRILL bullet already retracted
  the alternative, because the empty diff passes on a failed restore
  (measured on T-167-s9's lane, where it certified a destruction the
  sha256 caught). Make it a conjunction: the sha256 is the proof and the
  empty diff a companion. Sweep the other role files for the same
  either/or and record the result even if empty.
- **T-189-s2**: the 3–5 concurrent ceiling is stated in
  `method/roles/orchestrator.md` step 4 and in `method/tasks/TASK-FORMAT.md`'s
  Parallelism guardrails, neither citing the other. RULED: TASK-FORMAT
  owns the value — it is the field's home and it ships — and
  orchestrator.md cites it. Keep the why in one place.

## DISPATCH, 2026-09-02 — the stamp, the bump, and what the audit found

**This lane carries method version bump v0.1.9.** TASK-FORMAT and the
role files SHIP (KIT_FILES in app/src-tauri/src/agent/kit.rs), so the
change is owed a bump, and a bump is a three-file commit whose third
file is Rust: the `currently v0.1.8` stamp in docs/CONVENTIONS.md's
first gotcha, the `(v0.1.8` stamp in method/interview/plan-interview.md's
Output heading, and `METHOD_SNAPSHOT_VERSION` in kit.rs — moved in ONE
commit, or `cargo test` reds by name on whichever moved alone. The
fence is widened at dispatch to reach all three plus `tools/method-evals`,
because the METHOD EVAL GATE is the bump's fourth obligation:
`node tools/method-evals/run.mjs --bump` prints the block that goes into
the bump commit's message, the model-free set must pass, and the
model-in-loop set is owed at a bump and reported as a pass rate naming
its runner. The CONVENTIONS changelog gets one line — date, card, theme —
and nothing itemised (ADR-019's law applied to the changelog).

**Two riders absorbed on 2026-09-02 ride this bump** (the section
above): T-167-s11's conjunction in the executor's report row, and
T-189-s2's single home for the concurrent ceiling (TASK-FORMAT owns it,
orchestrator.md cites it). A THIRD rider joins at dispatch from
docs/rooms/loop-efficiency.md item 8, ruled by @human's "apply all":
TASK-FORMAT SHALL say that a card's FIRST PARAGRAPH is its summary — one
paragraph a seat may read and stop at — and that everything below it is
the record a seat reads when it needs the world. No field, no status.

**Audit (orchestrator 5b)**: the four instances in the card's table are
historical and carry their card ids; T-203, T-221, T-211 and T-210 are
all `done` at 4fc76fe. plan-interview.md's banking table is pinned cell
by cell by app/test/genesis-derive.test.ts — the stamp line may move,
the table may not. T-236 landed the CONVENTIONS compaction at c596847;
this lane opens that document for the stamp line and the changelog line
only.

**Holder**: this lane does NOT hold the integration checkout and does not
merge; it stamps `verifying`, reports ready-to-merge with branch and tip,
and leaves its worktree standing. Ceremony row M, guard-class, review
independent.

## Absorbs: T-230-s1 (2026-09-02, amended IN FLIGHT — a fourth rider on the bump)

T-230 shipped a live marker — a plain body line `CARD CLAIM (<tracked
file>): "<quoted string>"` that `brief.mjs --preflight` checks against
that one file — and `method/tasks/TASK-FORMAT.md`, the file that says
what a card may say, does not mention it, so the grammar exists only in
a tooling module's source. One paragraph in TASK-FORMAT's body sections
names the marker, its shape, and what the preflight does with it; a
grammar addition rides a bump, and this lane is the bump. Amended on the
integration branch and sent to both seats by path (orchestrator 5c).

## Implementation notes

**Executor, claude-opus-5@subagent, 2026-09-02. Lane
`task/T-229-positive-controls-can-fail`, base `179a7cc`, three build
commits.** The rule landed in three sites, the four riders landed, the
bump moved its three stamps in one commit, and the METHOD EVAL GATE's
model-in-loop half could not be measured on this machine and is
recorded as `Runner: NONE` rather than as a replayed 1.00.

### What was written, and where

- `method/roles/verifier.md` step 2b — the rule's HOME. A positive
  control SHALL be run against an implementation LACKING the property
  and SEEN to red, and the card SHALL RECORD that demonstration. Where
  ONE arrangement decides both the subject's answer and the control's,
  that is a DEFECT named by whoever notices, with the remedy of
  evaluating the control where the arrangement is ABSENT. The four
  instances cited by id with what made each degenerate; the existing
  data-mutant paragraph gained `T-221`; and the rule's own control —
  name a body it PASSES — closes it.
- `method/roles/verifier.md`, the *control you propose is yours to
  check* clause — `T-210` named, and the proposer told it owes 2b's
  demonstration rather than the lane that inherits the suggestion.
- `method/tasks/TASK-FORMAT.md` guard-class paragraph — the same two
  SHALLs in the SHIPPED file, plus the data-mutant clause, pointing at
  verifier.md step 2b for the drill mechanics.
- `method/roles/executor.md` report drill row — T-167-s11's conjunction
  (the sha256 IS the proof, the empty per-path diff a companion) and
  the obligation to report a positive control's demonstrated failure.
- `method/tasks/TASK-FORMAT.md` Parallelism guardrails +
  `method/roles/orchestrator.md` step 4 — T-189-s2, in the shape the
  tree allowed (below).
- `method/tasks/TASK-FORMAT.md` body sections — the first-paragraph
  summary rider, and T-230-s1's CARD CLAIM grammar paragraph.
- The bump: `currently v0.1.9` in docs/CONVENTIONS.md's first gotcha,
  `(v0.1.9` in plan-interview.md's Output heading, and
  `METHOD_SNAPSHOT_VERSION` in kit.rs — one commit, `0c7227b`. The
  changelog gained ONE line: date, card, theme.

### THE FOUR IDS ARE CITED IN verifier.md AND DELIBERATELY NOT IN THE SHIPPED FILE

The criterion says the four SHALL be cited by card id. They are, in
`method/roles/verifier.md` step 2b — a file `KIT_FILES` does NOT ship.
`method/tasks/TASK-FORMAT.md` DOES ship, and `docs/CONVENTIONS.md`'s
first gotcha opens *"method/ is the generic, product-agnostic
convention — nothing nputer-specific goes in it"*; the file's own
established voice attributes measurements without ids (*"on this
method's own project a card written by the ARCHITECT ordered a deletion
outside its own fence"*). So the shipped paragraph carries the
MEASUREMENT — four, one sitting, four modules, four agents, the fourth a
verifier's own proposal inside the fix for the third — and names where
the ids live. One home per fact; the criterion is met and the kit does
not ship a dangling card id.

### THE POSITIVE CONTROL ON THIS CARD'S OWN RULE, WHICH IS CRITERION FOUR

The rule refuses controls whose arming does not differ. **It does not
refuse every body**, and the proof is a body it PASSES, demonstrated
rather than argued: `node tools/method-evals/run.mjs --selftest`. That
arm degrades each eval's own contract on a COPY of the corpus and
requires the eval to DETECT it — the degradation is applied exactly
where the subject's arming is absent, which is what the rule asks — and
`lib/corpus.mjs`'s `degraded()` THROWS when the mutation is a no-op, so
a vacuous degradation cannot report green. Exit 0 over 6 evals at
`0c7227b`, against this card's own edited method text.

**And it DISCRIMINATES, which is the half a green alone cannot show.**
Blinding one eval's audit so it can no longer detect its own
degradation (`MF-03`, `const audit = (c) => …findings` replaced by one
returning `[]`) leaves the ORDINARY model-free check GREEN at exit 0
and reds the POSITIVE CONTROL at exit 1, naming it: *"rewording the
executor's `# Role:` heading was NOT detected — 0 finding(s)"*. One
mutation, two arms, opposite answers. That is the whole card in one
measurement: the arm whose arming differs is the only one that saw it.

### WHERE THE TREE REFUSED A RIDER, AND WHAT LANDED INSTEAD

**T-189-s2 was stated against a tree that has three copies and a
checker, not two copies and none.** Deleting the number from
`orchestrator.md` redded `app/test/select-board.test.ts` > *"the ceiling
is a named constant with its own assertion (criterion 5)"* > *"and it
matches the LIVE orchestrator.md, which is the source it claims"* — a
body that regexes `Ceiling: <n>–<n> concurrent` out of that file and
compares both numbers to the app's own `CONCURRENCY_CEILING`. 1 failed
/ 1130 passed at `0c7227b`. The repair that would make the deletion
safe lives in `app/test/**`, outside this fence, so it is ROUTED
(`T-229-s4`) and the number stays in orchestrator.md as an explicit
CITATION of TASK-FORMAT's home. The ruling is honoured — one home, one
why, an explicit citation — and the duplicate is disclosed in both
files as one fact CHECKED twice, with the unchecked copy named. A third
copy sits in `method/lane-protocol.md` rule 4, also out of fence,
routed as `T-229-s1`.

### THE MODEL-IN-LOOP HALF WAS NOT MEASURED, AND THAT IS THE RECORD

`node tools/method-evals/run.mjs --bump` exits **3** here and prints
`Runner: NONE`; the block in `0c7227b`'s message is that block verbatim,
including its own sentence that a bump whose eval result is absent and
one whose eval was skipped read the same. The set WAS driven under
`tools/method-evals/fixtures/runners/replay.mjs` to exercise the path —
exit 0, MIL-01..04 each 5/5 = 1.00, 0 tokens — and that is **1.00 by
construction and is not a measurement of any model**; it is recorded as
a path exercise in the commit and nowhere as a rate. Building a real
runner adapter is `T-229-s3`.

### FOR THE VERIFIER

- The three SHALLs have **no mechanical reader**. Nothing greps the
  rule's content; MF-02/03/04/05 read these files for structure only.
  Breaking the `roles/verifier.md` pointer inside the new executor.md
  sentence reds MF-04 by name — that is the drill, and it measures the
  file's readers rather than the rule. Deleting the rule outright reds
  nothing. Filed as `T-229-s5` with its own counter-argument.
- `method/tasks/TASK-FORMAT.md` ships byte for byte through
  `KIT_FILES`, so every edit to it is re-read off disk by `cargo test`.
- The CARD CLAIM paragraph's example is indented FOUR spaces on
  purpose: at three or fewer it is a live claim in every project the kit
  creates. Measured through the exported regex at `637af3f` — plain
  line, bullet+emphasis and three-space indent all parse as claims;
  four-space and mid-sentence-in-backticks do not, the latter reported
  loose. Quote the marker inside a block if you quote it at all.
- `npm run capabilities:check` was run and is reported, never
  regenerated.

### THE E2E LANE IS RED AT THIS TIP AND IT IS NOT THIS LANE'S RED

`gate-run.mjs e2e` returns RED / 548 bodies at `a60309c` with two
failures, `session-economics.spec.ts:179` and `session-economics.spec.ts:365` (the integrator corrected this name at the merge on the verifier's measurement: the notes had named brief-flush.spec.ts:337 here, which is the intermittent named below and passed alone).
Both come from `brief.mjs` exiting 1 over fence-disjointness findings
that name `T-225`, `T-230-s3`, `T-237` and `T-133` and never `T-229`.
Attributed by measurement rather than by argument: `brief.mjs --task
T-133 --root <checkout>` gives exit 1 with **15** findings at this tip
(`a60309c`), at this lane's first commit (`0c7227b`) and at this lane's
BASE (`179a7cc`) alike — the same answer before a byte of this work
existed. `T-143-s1` owns the class and carries the dated corroboration;
this lane holds no `tools/e2e` fence, so the repair is outside it.
The other three suites are GREEN at this tip: parser 349, app 1131,
rust 632.

## VERDICT — APPROVED at `8def123`, 2026-09-02, blind verifier claude-opus-5@subagent

Bench `/Users/ujju/Projects/nputer-V-T-229`, detached, cut at the lane's
BASE `179a7cc` **alongside the lane rather than after it** (orchestrator
5c). Two artefacts stamped before the diff existed and re-stamped when
the contract was amended:

    attack-V-T-229.md  f6748c8a4629abdb74c812e70ef4cd6d757e25bfed3f802f8d7c92605ac1ca51
    ground-V-T-229.md  97c6b8caa7ea018c48aca5601f657cfe9cc95bf916e773716c856ede22695205

**MY BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINARY, AND THAT IS THE
WEAKER OF THE TWO GUARANTEES TO CLAIM — SO I CLAIM IT PLAINLY.** When
phase 1 was written the lane stood at `179a7cca5621`, its own base:
there was no diff to decline to read. The amendment at `37ac590` (the
fourth rider) reached me BY PATH ahead of the work, I read the
committed object, diffed it against my base copy — one hunk, eleven
lines appended at EOF, nothing above touched — and re-stamped. So 5c's
claim held under test: the contract changed and the stamp still
predates every byte of the implementation.

### Every criterion, judged

1. **Demonstrated failing, recorded not asserted** — MET, in three
   sites, and the SHIPPED one is `tasks/TASK-FORMAT.md`'s guard-class
   paragraph (`KIT_FILES` ships that file; of the role files it ships
   only `planner.md`, so a rule living only in `verifier.md` would
   never reach another project — the diff puts it in both).
2. **The same-arrangement defect named, remedy is to evaluate where the
   arrangement is absent** — MET, and stated OPERATIONALLY rather than
   as a predicate: *a fresh clone, a planted fixture, a data mutant.*
   Those are the three that actually worked, not a description of the
   property.
3. **A data mutant where the property lives in data** — MET, and
   `T-221` now travels with the clause that came from it.
4. **The rule does not refuse every body** — MET, and this is the
   criterion I most expected to find degenerate. **I reproduced the
   discrimination rather than reading it.** Blinding `MF-03`'s audit
   (a one-line early return; landing read from `git diff`, not from a
   substitution count):

       ordinary   node tools/method-evals/run.mjs             -> exit 0, GREEN, blind
       control    node tools/method-evals/run.mjs --selftest  -> exit 1, "MF-03: rewording
                  the executor's `# Role:` heading was NOT detected — 0 finding(s)"

   One mutation, two arms, opposite answers. The arm whose arming
   differs is the only one that saw it. Restored, `9ddb25b8…` byte-identical.
5. **The four cited by id with what made each degenerate** — MET, in
   `roles/verifier.md` step 2b, each id carrying its mechanism in one
   clause. **DELIBERATELY ABSENT FROM THE SHIPPED FILE, AND I AGREE
   WITH THE CALL**: `TASK-FORMAT.md` is materialised verbatim into every
   project, `docs/CONVENTIONS.md`'s first gotcha forbids nputer-specific
   bytes there, and at base exactly ONE card id existed as a citation
   anywhere in `method/` — `orchestrator.md`'s `(T-138)`, in a file that
   does not ship. The shipped paragraph carries the MEASUREMENT and
   names where the ids live. **I raised `docs-protocol.md` rule 5
   (*one rule, one provenance citation, one worked example*) against the
   four and cleared it**: the rule binds governing documents, `T-203` is
   named as the worked example, `docs/CONVENTIONS.md` took exactly ONE
   line, and *four in one sitting* is the measurement itself — citing
   one would delete the finding.

### The bump — all four obligations

- **THREE STAMPS, ONE COMMIT**: `0c7227b` carries `kit.rs`,
  `docs/CONVENTIONS.md` and `plan-interview.md` together. Checked from
  the history, because a green tip proves this either way.
- **THE PIN DRILLED ON BOTH ARMS, WHICH ARE ORDERED AND NOT
  INTERCHANGEABLE.** Moving the plan-interview stamp alone:
  `kit.rs:716`, *"plan-interview.md's Output heading no longer stamps
  v0.1.9"*, **exit 101**. Moving the CONVENTIONS stamp alone:
  `kit.rs:728`, *"docs/CONVENTIONS.md's first gotcha no longer says
  'currently v0.1.9'"*, **exit 101**. Same body, different arm,
  different message — so a const-only bump reds on the first and never
  reaches the second, exactly as CONVENTIONS says. Both restored by
  hash.
- **CHANGELOG**: one line — date, card, theme, *"itemised on T-229's
  card"* — in the shape of the v0.1.8 entry above it. Not itemised.
- **THE FOURTH OBLIGATION, WHICH IS WHERE I EXPECTED THIS CARD TO
  COMMIT ITS OWN DEFECT.** `--bump` exits **3**, `Runner: NONE`, and
  `0c7227b`'s message carries that block verbatim including its own
  sentence that an absent result and a skipped one read the same. The
  replay runner WAS driven and is recorded as *"1.00 BY CONSTRUCTION …
  a path exercise, never as a measurement"*, with `T-229-s3` routing the
  real gap. **A replayed 1.00 reported as a rate would have been this
  card's own defect inside its own bump commit. It was not done.**
- **VERSION CENSUS AT THE TIP**: the three pinned places moved; the two
  references that CLAIM the current version and are now stale —
  `docs/ARCHITECTURE.md:28` and `docs/architecture/components/C-01-method.md:9`
  — are both OUT OF FENCE and both routed (`T-229-s2`). Historical
  references (v0.1.3/4/5/7) and parser fixtures correctly untouched: no
  churn.

### The four riders

- **T-167-s11** — conjunction, sha256 leading, and the WHY kept (the
  index write that makes a rangeless diff compare the file against the
  mutation's own source). Sweep: I re-ran it independently over
  `method/` and confirm **exactly one site existed** and it is the one
  fixed; no second either/or in any role file or `lane-protocol.md`.
- **T-189-s2 — THE RIDER WAS UNPERFORMABLE AS WRITTEN AND THE LANE
  MEASURED RATHER THAN OBEYED. I REPRODUCED IT.** Deleting the number
  from `orchestrator.md` reds `app/test/select-board.test.ts > the
  ceiling is a named constant with its own assertion (criterion 5) > and
  it matches the LIVE orchestrator.md` — **1 failed / 94 passed** at my
  own bench. A live checker regexes that line and joins it to
  `CONCURRENCY_CEILING`; the repair is out of fence, routed as
  `T-229-s4`. Home declared in TASK-FORMAT with the WHY, orchestrator
  carrying an explicit citation and the number, and both files
  disclosing the duplicate as one fact CHECKED twice. **The rider's own
  premise was decided by a tree nobody had asked — which is this card's
  subject, one level up.**
- **Room item 8** — landed as a writing discipline, no field, no status.
- **T-230-s1 (amended in flight)** — landed, and it is the paragraph I
  most expected to be wrong. **I predicted it would state the marker's
  visibility by analogy to `PREFLIGHT RULING` and be wrong in both
  directions. THAT PREDICTION IS FALSIFIED.** Driven through the
  exported regex at the tip:

       plain / bullet / bullet+emphasis / 3-space indent -> CLAIM
       4-space indent / backticked mid-sentence         -> not a claim, reported loose

  The paragraph says a bullet and emphasis are fine (the regex allows
  them; the sibling marker does not), says a fenced or indented block
  is an example, says an unseen sighting is REPORTED never refused on,
  and names no paths. **Its own example is indented four spaces and the
  text says *"including the one above"*** — so the documentation cannot
  be copied into a live claim in any project the kit creates.

### Drills, security, gates — measured at `8def123` in this bench

Every drill re-planted here, each landing read from `git diff`, each
restoration proved by sha256 against `git show HEAD:<path>`:

| drill | result | restored |
|---|---|---|
| plan-interview stamp alone | `kit.rs:716` panic, exit **101** | `c2e6d773…` |
| CONVENTIONS stamp alone | `kit.rs:728` panic, exit **101** | `c84bea59…` |
| dangling `roles/verifier.md` pointer | **MF-04** by name, exit 1 | `e48ffb2d…` |
| blinding MF-03's audit | ordinary **0** / control **1** | `9ddb25b8…` |
| the ceiling number deleted | `select-board.test.ts` 1 failed / 94 passed | `030e0343…` |
| **the whole new rule deleted from the SHIPPED file** | **NOTHING REDS** — model-free 0, selftest 0, `cargo --lib` **0** | `260b6bb1…` |

**That last row is the honest limit and the lane disclosed it first**
(`T-229-s5`, with a counter-argument better than the one I brought: an
eval that greps a sentence pins the WORDS, which is `SHAPE EIGHT`).
I extend it by one measurement: the SHIPPED-BYTES cargo pin does not
protect the rule either — `include_str!` moves with the file, so the
byte pin and the tested effect are different claims, exactly as
CONVENTIONS says.

**SECURITY SWEEP — clean, and not a formality here because the fence's
third file is Rust.** `KIT_FILES` is byte-identical base to tip (14
entries): nothing new is compiled in, no new `rel:` path, no traversal
surface. The only Rust change in the diff is the const string. **No
manifest, lockfile or dependency moved, and `tools/method-evals` was
not touched at all**, so its zero-dependency bare-checkout property is
structurally intact and no `NPUTER_EVAL_RUNNER` default was introduced.
Token lint: selftest 0, gate **0 — clean, TOKEN 174 files, CONTROL 1140
tracked text files**.

**FENCE**: every written path is in the declared fence or under
`docs/tasks/` (`alwaysWritable`). Nothing out of fence was edited — the
three out-of-fence findings were routed, not taken.

**GATES**: cargo **628 passed / 0 failed / 4 ignored, exit 0** (628 at
base too — no drop) · app **1131/1131, exit 0** · parser **349/349,
exit 0** · method-evals **exit 0 over 6**, `--selftest` **exit 0 over
6** (count read, not just the exit) · docs gate **exit 1, FIRES**,
naming four suites, frontmatter clean, budgets hold ·
`capabilities:check` **CURRENT (45,968)** · `docs/CONVENTIONS.md`
117,505 → **117,645 bytes** against warn 146,878 — the stamp and one
changelog line, no re-inflation of what T-236 compacted.

### THE E2E RED IS INHERITED, AND I PROVED IT AT THE BASE RATHER THAN ACCEPTING IT

`npm test` from `tools/e2e/` on `NPUTER_E2E_PORT=25229`: **2 failed /
546 passed, exit 1**. Both failures are `brief.mjs` exiting 1 over
**seven** fence-disjointness findings, every one naming `T-225`,
`T-230-s3` and `T-237` — **not one names `T-229`**. Independently:
`brief.mjs --task T-133` at this tip exits 1 with zero findings naming
this card.

**Then the measurement that settles it.** I checked this bench out at
the BASE `179a7cc` and ran the spec alone:

    session-economics.spec.ts at 179a7cc  ->  2 failed / 8 passed, exit 1
    the same two bodies, :179 and :365

Before a byte of this work existed. The class is `T-143-s1`'s and the
lane's corroboration onto it is correct and well-measured.

**ONE CORRECTION TO THAT RECORD, WHICH IS THE ONLY FACTUAL ERROR I
FOUND.** The notes name the pair as `session-economics.spec.ts:179` and
`brief-flush.spec.ts:337`. In a run not racing four bench cuts, the
DETERMINISTIC pair is `session-economics.spec.ts:179` **and `:365`**;
`brief-flush.spec.ts:337` passed for me at this tip. The corroboration
already says the pair *"fails DIFFERENTLY and only one of them is
deterministic"* — it named the wrong second body. Worth a one-line fix
at the merge; it changes no conclusion.

### Note-level corrections, none blocking

1. **The `36 KB` figure in the shipped summary paragraph understates.**
   It is sourced (`T-216-s1` is 36,779 bytes, per the room), and it is
   past-tense so it cannot go stale — but **89 live cards exceed it and
   the largest is 145,078 bytes**. It reads as an outlier and is
   mid-pack, which weakens a rule the tree supports far better.
2. **"RECORD that demonstration" does not say what the record carries.**
   The lane's own practice carried both readings (green at 0, red at 1);
   the rule as written is satisfiable by a sentence asserting a
   demonstration, which is the shape the criterion's second half exists
   to refuse.
3. **"named as a defect by whoever notices" names no artefact** — a
   finding needs somewhere to land, and this project's frontmatter
   rules make *where* load-bearing.
4. **The CARD CLAIM paragraph names two refusal shapes** (quote absent
   from the named file; source unreadable) **and not the third** — a
   payload carrying no quoted run, which the preflight also answers
   `UNCHECKABLE`.

### Pre-committed predictions, resolved honestly — including the two I lost

CONFIRMED: the ceiling had a THIRD site out of fence (routed);
`--bump` exits 3 with `Runner: NONE`; the card's *"the role files
SHIP"* premise is false for four of five (the lane reached the same
conclusion independently and used it to place the ids); the docs gate
fires naming four suites. **FALSIFIED: (a)** criterion 5 would be
degenerate — the ids moved into a durable home with their mechanisms,
so it is met non-degenerately; **(b)** the marker paragraph would
inherit the sibling marker's visibility rule — the lane measured the
regex instead and got the boundary right, example indentation
included.

**APPROVED.** The card asked for a rule against controls that cannot
fail, and the strongest evidence for it is that its own control
discriminates under a mutant I planted myself: one blinding, two arms,
exit 0 and exit 1. The three genuine weaknesses — no mechanical reader
for the rule, no real eval runner, a checker aimed at the cited copy
rather than the declared home — were each found by the lane, measured,
and routed rather than papered over.

**GATES RE-RUN AT THE TIP THIS VERDICT ITSELF CREATED** (`cd43930`,
verifier.md step 7 — appending a verdict is a write, and prose is a code
input here): docs gate **frontmatter clean, budgets hold** · parser
**349/349** · app **1131/1131** · the four card-reading e2e specs
(`landing-gate`, `push-checks`, `shell-frame`, `window-contract`)
**46/46, exit 0**. The verdict's own text was also driven through the
marker reader before committing: **0 live CARD CLAIM markers**, one
loose sighting at the card's amendment line — the backticked mention in
the `Absorbs: T-230-s1` section, correctly reported and correctly not a
claim.

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-230-s1: `git show 37ac590^:docs/tasks/T-230-s1-the-card-claim-marker-is-card-grammar-and-task-format-does-not-carry-it.md`

A lane building this card reads those before it builds.
