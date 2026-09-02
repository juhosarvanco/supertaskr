---
id: T-229
title: A POSITIVE CONTROL THAT CANNOT FAIL IS THE MOST COMMON DEFECT THIS PROJECT PRODUCES — four in one sitting, each green because the ARMING made both sides agree, and the fourth appeared inside the fix for the third
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [method/tasks/TASK-FORMAT.md, method/roles, docs/CONVENTIONS.md, method/interview/plan-interview.md, app/src-tauri/src/agent/kit.rs, tools/method-evals]
suggested_by: "the architect/integrator seat, 2026-09-01 — filed after noticing that the sitting's largest finding was the only one with no card, while four narrower ones had been filed the same night"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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
