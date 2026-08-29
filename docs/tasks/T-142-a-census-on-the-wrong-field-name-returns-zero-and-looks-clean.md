---
id: T-142
title: A census that names a field the data does not have returns zero — and zero is indistinguishable from a clean result
feature: F-06
milestone: 4
priority: 4
size: S
status: planned
suggested_by: architect claude-opus-5
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-111-s6 (Amnesty triage 2026-08-29 (triage seat)) — the fullest worked instance of this card's own instance 3, re-derived on disk by matching ^id: rather than a filename glob, and it retracts its own headline word after main overturned the framing: the counts are an inventory of declarations naming a blocker that has since landed, not an indictment. What was wrong was a QUERY — a shell loop reading a non-empty blocked_by as "blocked" without resolving the ids — which is exactly the positive-control gap this card exists to close, and it cost four accurate declarations being cleared and a card filed against a defect that did not exist.

Absorbs: T-093-s2 (Amnesty triage 2026-08-29 (triage seat)) — the triage recommendation this promotion takes, argued rather than asserted: T-093's anchor (a search that finds nothing is not a refutation) and this card's (a census on a field the data lacks returns zero) are one class — a query ran, produced no error, returned an answer shaped exactly like the one you wanted, and answered a different question. It also supplies a further instance measured at bc2d82a: T-093's own card cites a needle that no longer finds the sentence it was recorded for, because ADR-019's compaction reflowed the line — a remedy needle without a ref, stale in four days, in the card whose subject is that this happens.

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of the
false-empty class.** `T-093-s2` recommended exactly this and said which
way the absorption runs: T-093 is DONE and its content has landed, so
what is left over is the arm this card calls the one that generalises.
Two further findings are absorbed below, taking the instance count to
six across four seats.

Absorbs: T-093-s2, T-111-s6.

## Acceptance criteria

- THE positive-control rule SHALL be extended to CENSUSES in the same
  place it is already stated for test bodies (arm 1). Before a count is
  written into a card, a brief or STATE, the query SHALL have been shown
  capable of returning something else — pointed at a ref where the
  answer is known non-zero, or run once against a planted instance.
- THE layer boundary SHALL be named once (arm 2): frontmatter keys are
  snake_case and model properties are camelCase, so a census of the
  PARSED model for `blocked_by` and a census of FRONTMATTER for
  `blockedBy` both return zero and both read clean. `docs/STATE.md`
  carries this as a live-hazard line today, and a hazard that recurs
  belongs in CONVENTIONS.
- THE fix SHALL NOT be a lint that greps for known-bad field names.
  That is a census about censuses with the same failure mode — it
  returns zero on the day someone invents a new wrong spelling. The
  property worth pinning is *the query was demonstrated able to answer
  non-trivially*.
- ARM 3 (a helper that queries the parsed model and so cannot be asked
  for a field the model lacks) SHALL NOT be folded in. It keeps its own
  `tools/e2e` seat: it covers only queries that go through the model,
  and this card's sharpest instance went through `graph.json` directly.
  IF it is wanted THEN it SHALL be routed as its own card.
- THE fence on this card was CORRECTED once already (from `method/` to
  `docs/CONVENTIONS.md`, by T-093's lane, because a lane cut to
  `method/` cannot write the sentence the card is about). The lane SHALL
  re-derive that the fence still reaches the sentence it intends to
  write before it starts.

**Three instances in one working day, two of them mine.** Each is a
query that ran without error, returned a number, and answered a
different question than the one asked.

## The three

1. **`docs/architecture/graph.json` has no component field.** Its file
   records carry `id, path, lang, hash, loc, symbols` — the component
   join happens later, in the TS derive layer, against registry globs. I
   probed the published graph for unmapped files at nine historical
   checkpoints. It returned a rising series (59, 75, 92, 178, 185) that
   looked exactly like a project accumulating unmapped files. **It was
   the total file count.** Every record matched "no component field",
   because no record has one.

2. **`blocked_by` and `blockedBy` are both correct, in different
   layers.** `lib/parser/src/task.ts:240` reads the frontmatter key
   `blocked_by` into a model property `blockedBy`. A census of the
   PARSED model for `blocked_by` returns 0; a census of FRONTMATTER for
   `blockedBy` returns 0. **Either direction reads as a clean pin.** An
   integrator hit this on the dangling-blocker census and wrote it down.

3. **The `blocked_by` episode itself** — a raw frontmatter census that
   ran fine and supported a wrong belief for most of a day, ending in
   four accurate declarations being cleared and a card filed to gate a
   defect that did not exist. Different mechanism, same ending.

## Why this shape is worse than a wrong answer

A crash is a finding. **A zero is the answer you were hoping for.**
Instance 1 is the sharpest: the probe did not even return zero, it
returned a *plausible rising series*, and I reported it to the human
before noticing. Nothing about the output distinguished it from a
correct measurement — no error, no empty set, no anomaly.

**These three all sit under a rule this project already wrote:**

> A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.

The rule exists for test bodies. **Every instance above was a census,
not a test** — a one-off shell or Python query run to establish a fact
that a decision then rested on. The rule was never carried across, and
census results have been entering cards, briefs and STATE unguarded.

## The shape of a fix, not the fix

1. **Extend the positive-control rule to censuses**, in the same place
   it is already stated. Before a zero (or any count) is written into a
   card, brief or STATE, the query must be shown capable of returning
   something else — point it at a ref where the answer is known
   non-zero, or plant one instance and see it found. Cheapest; prose,
   and `T-131` argues prose does not bind.
2. **Name the layer boundary once.** Frontmatter keys are snake_case and
   model properties are camelCase; that is a real and reasonable design,
   and nothing states it where a session doing a census would read it.
3. **Give the census a tool.** The project already prefers a
   construction to a check. A helper that queries the PARSED model
   cannot be asked for a field the model lacks — it would have failed
   loudly in instance 1 and been impossible in instance 2.

**FENCE CORRECTED 2026-08-27, by T-093's lane.** This card was filed
`touches: [method/]`. Arms 1 and 2 as argued write the citation bullet in
`docs/CONVENTIONS.md` — **a lane cut to `method/` cannot write the
sentence the card is about.** Re-fenced. Arm 3 keeps its own `tools/e2e`
seat and is deliberately NOT folded in: it only covers queries that go
through the parsed model, and this card's sharpest instance went through
`graph.json` directly. See `T-093-s2`.

**Arm 1 is the one that generalises**; arm 3 only covers queries that
go through the model, and instance 1 went through `graph.json` directly.

## One caution for whoever takes it

**Do not let the fix be a lint that greps for known-bad field names.**
That is a census about censuses, and it has the same failure mode: it
returns zero on the day someone invents a new wrong spelling. The
property worth pinning is *the query was demonstrated able to answer
non-trivially*, not *the query avoided a blacklist*.
