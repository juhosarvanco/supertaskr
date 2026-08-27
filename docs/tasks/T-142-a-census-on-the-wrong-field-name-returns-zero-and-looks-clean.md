---
id: T-142
title: A census that names a field the data does not have returns zero — and zero is indistinguishable from a clean result
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: architect claude-opus-5
blocked_by: []
touches: [docs/CONVENTIONS.md]
---

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
