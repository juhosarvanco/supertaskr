---
id: T-257
title: Two decision modes, audit and auto — a card's decision list is answered by the human before dispatch (the preflight refuses an unanswered item) or taken as the planner's proposed defaults and reviewed in one batch at the checkpoint, chosen per card over a project default like `review:`
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-08): \"Can we build two modes, auto and audit\" → \"file it\"; the decision list from docs/research's EARS-for-the-AI-era reading (its own warning: a skimmed list puts a human's name on a model's guess)"
blocked_by: [T-253]
touches: [method/tasks/TASK-FORMAT.md, method/runtime/supertaskr.yaml, tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts, docs/checkpoints/TEMPLATE.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-033-s1 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review). Records repair in the same commit: the runtime template's filename in the fence and in the criteria was the pre-rename spelling, dead since the rename of 2026-09-10, and now reads method/runtime/supertaskr.yaml (a redaction of the pre-rename identifier, named here as the sanctioned edit).

## Why this card exists

A model does not stall on an ambiguity; it resolves it and leaves no
trace. T-253 makes the decomposition step write each card's decisions
out — a question, the options, the planner's proposed default. This
card decides WHO answers and WHEN, in two modes, because the human's
minutes are the scarce input and the wrong default is the rework.
`review:` already works this way: a project default, a per-card
override, and a class of card (guard-class) that requires the dearer
value. Decisions get the same field.

## Acceptance criteria

- WHEN a card carries a decision list (T-253's `## Decisions` table:
  `D-NN <question> [a] … [b] … → proposed <x>`) AND its mode is
  `decide: audit` THE preflight SHALL refuse the dispatch while any
  item lacks an answer line stamped by the human (`@human: <x>`),
  naming the unanswered items — the human's name goes on the choices,
  never on the prose.
- WHEN the mode is `decide: auto` THE preflight SHALL stamp each
  unanswered item with the proposed default and `decided_by: planner`
  at dispatch, and the checkpoint record's Dispositions SHALL list every
  auto-decided item of every merge in the window, so the human reviews
  them in one batch after the fact (docs/checkpoints/TEMPLATE.md gains
  the row).
- WHEN no per-card `decide:` is set THE project default in
  method/runtime/supertaskr.yaml SHALL apply (a `decisions:` key, default
  `audit`); WHEN the card is guard-class, or its fence touches a
  security control, persisted data or user-facing behaviour, THE mode
  SHALL be `audit` regardless (the same clause that requires
  `review: independent`); WHEN the card took the quick path (T-241)
  THE mode SHALL be `auto`.
- WHEN the health bands run THE bands SHALL carry
  `decisions/items-per-card` (drift above 5, breach above 10, with
  the reason that a breached list is a card to split, not to skim) and
  `decisions/auto-rejections` (rejections whose verdict names an
  auto-decided item, derived from the verdicts' own text at the ref) —
  each declared with a keeper, per T-156's rules.
- TASK-FORMAT SHALL own the field's vocabulary (`audit | auto`) and
  the guard-class clause in one place; the method eval gate SHALL run
  with the bump's eval block; the preflight spec SHALL carry a planted
  audit card with one unanswered item (refused, by name) and a planted
  auto card (stamped, dispatchable) — the arming differs, per 2b.
- WHEN the card's effective decision mode is audit, resolved by the criteria above, THE preflight SHALL refuse while any item in its structured Decisions list lacks the required owner-attributed answer, naming each unanswered item. The fixture SHALL express T-033's three historical unanswered decisions in that list format and show refusal, then acceptance once the required answers are present. Natural-language prose is not parsed to invent decision items; this criterion introduces neither per-item modes nor an alternative answer format. (absorbed from T-033-s1, 2026-09-14)

## Absorbed from T-033-s1 — T-033 was dispatched without the three decisions its own card says must be recorded before dispatch (kept whole)

Title as filed: "T-033 was dispatched without the three decisions its own card says must be recorded before dispatch"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by executor claude-opus-5 @T-033.

T-033's card opens with *"Decisions at dispatch (ADR-004 — the registry
is the architect's pen; record the picks in this file's plan section
before dispatch)"* and then enumerates three of them: (1) the umbrella
shared-primitive/test-edge story, (2) the non-code D3 story, (3) the
ADR-015 one-implementation question. **None was recorded.** The dispatch
commit `25a9e2c` ("Dispatch batch C: T-033 and T-079 stamped building")
changes exactly two lines of the card — `status: planned` → `building`
and `builder:` → `claude-opus-5` — and adds no plan section. Verified
against main as well: `git diff 25a9e2c 5fbfd4e -- docs/tasks/T-033-*.md`
is empty, so the omission is not a stale base.

**THIS IS NOT A STYLE COMPLAINT — IT MAKES THREE OF FIVE CRITERIA
UNBUILDABLE BY THEIR OWN WORDING.** Criterion 1 reads *"SHALL drain (or
be recorded as accepted) **per the recorded decision**"*; criterion 2 has
the same shape; criterion 5 says *"SHALL BE RECONCILED **per decision
(3)**"*. A criterion whose antecedent is a decision that does not exist
cannot be met, and an executor who supplies the missing decision has made
the architect's ruling — which is exactly the single-writer failure
ADR-004 exists to prevent. The card even anticipates this and names the
consequence for one arm: *"IF arm (b) is chosen THEN the notes SHALL say
so explicitly and name T-059 as dissolved"* — a sentence that only a
recorded pick can satisfy.

**Suggested:** the picks belong in the card before it is re-dispatched.
The exact derived material each one needs is already measured and filed —
`T-033-s2` (the umbrella drain set), `T-033-s3` (the non-code D3 story),
`T-033-s4` (the ADR-015 clause) — so the ruling is the only work left,
and each file states which arm costs what.

**And the same check is cheap enough to be a dispatch step.** A card that
says "record the picks before dispatch" is asserting a precondition
nothing verifies; the board's `status: building` is not evidence that it
was met. This is the second time the dispatch stamp has been observed
carrying less than the card asked for (`T-089-s7`'s row-5 finding is the
sibling shape: a fact the brief must transcribe that lives nowhere
mechanical). Worth considering alongside T-104/T-111, which already
compute things a dispatcher currently eyeballs.

---

**DISCHARGED by `bb26a93` + `5e6fc8c` (2026-08-25), recorded here rather
than re-triaged** (CONVENTIONS: a finding resolved by other work keeps
`status: suggested` and records the discharge in its own body). The
architect made all three rulings on T-033's card under THE THREE RULINGS,
corrected the fence to add `app-shell` in the same commit, and stated in
writing that *"the dispatch defect is the architect's"* and that the lane
*"correctly refused to supply them from inside a worktree"*. @human then
overturned one of them (the cycle) at `5e6fc8c`, which is the mechanism
working rather than a second defect.

**What is NOT discharged is the general point**, and it is left here for
triage rather than smuggled into the discharge: nothing verifies a card's
own stated dispatch preconditions, and `status: building` is not evidence
that they were met. The cost was measured this time — the lane held
`app-shell` and `docs/architecture/components/` while idle, blocking two
other cards, until the delay was noticed by hand.

### PARKED — eleventh triage, 2026-08-26 (T-033-s1)

Real and still true; not now. **UN-PARK WHEN:** the second observed instance, or the moment `T-111`/`T-137` ships a dispatch-time reader that could carry the check for free. Its three rulings are discharged; the residual is that nothing verifies a card own stated dispatch preconditions.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
