---
id: T-229
title: A POSITIVE CONTROL THAT CANNOT FAIL IS THE MOST COMMON DEFECT THIS PROJECT PRODUCES — four in one sitting, each green because the ARMING made both sides agree, and the fourth appeared inside the fix for the third
feature: F-06
milestone: 4
priority: 2
size: M
status: building
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
