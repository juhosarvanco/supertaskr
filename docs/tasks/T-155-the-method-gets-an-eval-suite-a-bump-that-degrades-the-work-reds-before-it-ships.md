---
id: T-155
title: The method gets an eval suite — a version bump that degrades the work reds before it ships, the way a code change already does
feature: F-01
milestone: 4
priority: 32
size: L
status: building
blocked_by: []
touches: [tools/method-evals, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 2, and `T-093-s1`'s class ("the hand rules have no
mechanical reader") given the playbook's mechanism: the method files —
roles, lane protocol, docs protocol, brief assembly — are byte-pinned
into the kit but never TESTED FOR EFFECT. A rewrite of `executor.md`
or a model swap changes what sessions produce, and nothing reds.
T-148 already measured brief sizes moving under a role-file edit;
this card makes that class of measurement a gate.

## The shape (small first, honest about cost)

1. Five to ten CANNED TASKS with derived acceptance checks — e.g.: a
   fixture card dispatched headless against the current method
   produces notes in the card's own sections; a verifier run on a
   planted-defect fixture produces a REJECT with the defect named; a
   brief assembled at a fixture ref carries every row the contract
   requires (this one is pure `dispatch-brief.mjs`, no model call).
2. Split MODEL-FREE evals (brief assembly, fence expansion, kit
   materialization — cheap, run in CI) from MODEL-IN-LOOP evals
   (headless role runs — expensive and nondeterministic; run at
   method version bumps and on schedule, never per-commit; pass-rate
   threshold, not single-run pass/fail).
3. A method version bump's three-file commit gains a fourth
   obligation: the eval suite ran and its result is recorded in the
   bump's own commit message.
4. Every method-process incident becomes a candidate eval, the way
   every code incident already becomes a pin. The founding corpus is
   the best-attested failure class on record — "a query that runs
   clean and answers a different question" — with FOUR stamped
   instances across three hands in one week: the architect's
   `git log -15 -- <path>` cap-after-filter and its unlabeled-KiB
   review divisor, this session's stale figure transcribed hours
   after measuring the fresh one, and an external review's
   Unix-convention claim that `diff(1)` refutes. Review-claim
   verification is therefore an eval fixture family of its own, and
   verifier CALIBRATION (false-rejection vs missed-defect rates, at
   ~1.2M tokens per rejection) is in scope.

## Token economics (ADR-020 + the session-economics comparison)

Model-in-loop evals are the method's most token-expensive machinery,
so the economics are design inputs, not afterthoughts: each eval
declares the CHEAPEST model that discriminates (a `model:` line per
eval, never the session default); output runs quiet (dot-reporters,
bounded logs); and tokens-per-eval-run is recorded so the suite's own
cost has a band from day one. An eval suite nobody can afford to run
is a ritual with extra steps.

## Acceptance criteria

- WHEN any method file changes THE model-free eval set SHALL run and
  red on a contract the change breaks.
- WHEN a method version bump is prepared THE model-in-loop set SHALL
  have a recorded run against the new method text, with its pass rate
  in the bump commit.
- IF an eval cannot run THEN it SHALL say so loudly with the house
  exit codes — a skipped gate is news, never silence.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
