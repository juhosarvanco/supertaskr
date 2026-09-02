---
id: T-229-s3
title: No real NPUTER_EVAL_RUNNER exists in this tree, so the bump's fourth obligation has a half nobody can measure and a replay runner that scores 1.00 by construction
feature: F-06
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-155-s6`** (three model-in-loop acceptance functions
score the shape of a report rather than the thing they name) — same
half of the suite, different defect. **Disposition hint: promote; this
is the precondition for T-155-s6 being answerable at all.**

`docs/CONVENTIONS.md`'s METHOD EVAL GATE says the model-in-loop set *"is
owed at a METHOD VERSION BUMP"*, and T-229 is the first bump since the
suite landed. Measured at `0c7227b`: `node tools/method-evals/run.mjs
--bump` exits **3**, prints `Runner: NONE`, and lists MIL-01..04 as not
attempted. The only runner in the tree is
`tools/method-evals/fixtures/runners/replay.mjs`, whose own header says
a replayed rate *"must never be recorded as one"* — driven at `0c7227b`
it returns 5/5 = 1.00 on all four evals, 0 tokens, which is 1.00 by
construction.

**So the obligation is currently unsatisfiable rather than skipped, and
the two read the same afterwards** — which is the failure the `--bump`
block's own wording exists to prevent. What is missing is one committed
ADAPTER honouring the contract in `tools/method-evals/lib/model-run.mjs`
(`<program> <eval-id>`, prompt on stdin, transcript on stdout, a
`tokens: <n>` line on stderr, exit 0) around an agent CLI the operator
already has — NORTH_STAR's model-agnostic constraint and ADR-003's
shell-out architecture both point at exactly that shape, and the suite
was designed for it.

**AND THE FIRST REAL RUN IS ITSELF A MEASUREMENT NOBODY HAS TAKEN**:
`--list` says every model-in-loop `model:` and threshold is a DECLARED
FLOOR with no calibration behind it. The adapter is what turns four
declared floors into figures, and until it exists every bump's
model-in-loop line is the honest `Runner: NONE`.

## TRIAGE, 2026-09-02 — stays `suggested`; a ruling is owed first

The architect seat, at the stamp of T-229's merge (d641846). A real
model-in-loop runner spends tokens against a real model at every bump;
which model, what budget per bump, and whether a bump may ship without
it are @human's rulings, not a card's. Held for that ruling; the
precondition for T-155-s6 is noted.
