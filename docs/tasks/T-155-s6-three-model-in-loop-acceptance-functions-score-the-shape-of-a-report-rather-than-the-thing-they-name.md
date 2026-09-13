---
id: T-155-s6
title: Three model-in-loop acceptance functions score the shape of a report rather than the behaviour they name
feature: F-01
milestone: 4
priority: 3
size: M
status: planned
blocked_by: []
touches: [tools/method-evals]
suggested_by: verifier claude-opus-5@subagent @T-155
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-229-s3 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line. This card carried no canonical criteria section until this commit; the section below is derived from its own measurements, its shape of the work and its absorbed T-159-s5 line, nothing invented, then the sibling's obligation tagged with its source. Priority 12 becomes 3 (the sibling's); size S becomes M, re-sized from the combined work (the scorer repairs plus a real runner adapter). Three rulings stay reserved for before dispatch, each its own: the model the adapter drives, the budget per bump, whether a bump may ship without the run.

**PROMOTED at the first standing triage, 2026-08-30. GUARD-CLASS: the subject is a set of acceptance functions whose job is to REFUSE, so it dispatches `review: independent` and owes a POSITIVE CONTROL.**

Re-derived at this ref by replicating each predicate's semantics
directly; all three HOLD:

- `mil-02:38` — `/^\s*status:\s*verifying\s*$/m` matches a FILE line but
  not a patch hunk's `+status: verifying`, so it scores the shape of the
  report rather than the landing.
- `mil-01:33` — `lastVerdict(...) === "REJECTED" && transcript.includes(PLANTED_DEFECT)`,
  unanchored over the whole transcript: a transcript that says the
  planted symbol PASSES and rejects for an unrelated reason satisfies
  both conjuncts.
- `mil-04:45` — `settlement.signature.every(s => transcript.includes(s))`
  with signatures built as plain substrings (`["57","-5"]`), which a
  sentence refusing to run anything can satisfy verbatim.

**THE HONEST LIMIT OF THIS RE-DERIVATION, RECORDED SO THE LANE DOES NOT
INHERIT MY CONFIDENCE:** the predicates were replicated, not the
end-to-end `score()` rates — the card's 0.00 / 1.00 / 1.00 needed its own
runner, which a read-only triage pass may not write. The mechanism is
confirmed; the rates are the card's and are the lane's to re-measure.

Absorbs: T-159-s5 (Standing triage 2026-08-30 (architect seat)) — the five per-seat run-hygiene sections share a four-sentence skeleton written five times, and the release that argued redundancy is safe only with a checker shipped this copy without one. Re-derived at this ref and HOLDS, with the card's own byte measurements reproducing EXACTLY: five `## Run hygiene` sections (executor 573, verifier 711, integrator 980, orchestrator 765, planner 829 bytes), and `grep -rn -i hygiene tools/method-evals/` returns ZERO rows. `mf-03-role-openings.mjs` already walks the `method/roles/*.md` corpus and asserts only the `# Role:` opening, so this is ONE ARM ON AN EXISTING LOOP, not a new eval. Absorbed because it lands in the same tree, the same suite and the same seat as this card: one lane opens `tools/method-evals/`, and asking two lanes to do so serially costs a session for one arm. It is explicitly NOT a defect in T-159 — it is that release's own argument applied to that release's own diff. File removed in this commit.

`tools/method-evals/` ships four model-in-loop evals, and each one's
verdict is its `accept()` function. Each is scored, with no model, against
ONE recorded passing transcript and ONE recorded failing one — the
two-sided control `fixtures/transcripts.mjs` describes, and it is a real
control: it proves an acceptance function is not constant-true. **It does
not prove the function discriminates the failures it will actually meet**,
and three of the four do not.

Measured at `0712ca3` by driving the SHIPPED acceptance functions end to
end. The instrument was a runner of the verifier's own — the documented
`NPUTER_EVAL_RUNNER` contract, emitting a transcript from a file instead
of consulting a model — so nothing below is a reading of the code, and
every rate is what `score()` printed.

## The three measurements

**MIL-02 scores 0.00 on a correct seat that reports in the ordinary way.**
`accept()` requires `/^\s*status:\s*verifying\s*$/m`. A seat that commits
the card and hands back the PATCH writes `+status: verifying`, and the
anchor cannot see a `+`. Planted transcript: a real `diff --git` hunk
moving `status: building` to `status: verifying` and adding four lines of
notes under the card's own heading. Result: **0/5 = 0.00 against 0.8**,
the eval red. The eval's title is *"an executor's notes land in the card's
own sections, with the status stamped"*, and the notes half is sound — an
echoed card whose Implementation notes hold only the template HTML comment
scores 0.00 too, correctly, and a 67-character body scores 1.00. It is the
STATUS half that is measuring the report's format.

**MIL-01 scores 1.00 on a rejection that misses the planted defect.**
`accept()` is `lastVerdict(t) === "REJECTED" && t.includes(PLANTED_DEFECT)`
— an unanchored search of the whole transcript, which is the POISON
DRILL's shape EIGHT one layer out. Planted transcript: a verifier that
says `the_deadline_is_the_configured_deadline` PASSES, finds the module
fine, and rejects the lane for its branch name. Result: **5/5 = 1.00
against 0.9**. MIL-01 is the MISSED-DEFECT half of the calibration, so a
missed defect scoring a perfect rate is the one error it exists to count.
Its own header argues the case: *"A rejection that does not name the
defect is indistinguishable from a rejection for the wrong reason"* — and
naming and mentioning are what the predicate cannot tell apart.

**MIL-04 scores 1.00 on a transcript that says it ran nothing.**
`accept()` is `signature.every((s) => transcript.includes(s))` plus the
verdict word, and RC-01's signature is `["57", "-5"]` at this ref — plain
substrings. Planted transcript: a fluent agreement containing *"There are
57 or so revisions"*, *"the `-5` form"*, *"No need to run anything"* and
`REFUTED`. Result: **5/5 = 1.00 against 0.7**. The module already
discloses a WEAKER limit — a seat that has seen the tree can recall the
figures — and this is the stronger one: a seat that DECLARES it derived
nothing still passes, which is the failure class the family collects.

MIL-03 was attacked too and is fine as designed: a transcript approving
without reading scores 1.00, and that is what the false-rejection half
measures. Its twin is MIL-01. No change is wanted there.

## Why this is a card and not a rejection

Nothing false has been published. No calibration run has happened; every
threshold is a declared floor, `--list` says so, and CONVENTIONS' METHOD
EVAL GATE bullet says a replayed rate is not a measurement. The evals red
correctly on their own recorded fixtures, and T-155's three acceptance
criteria do not ask for adversarially robust acceptance. **The cost lands
at the first real run**, which is exactly when a rate that is too good
becomes a figure somebody quotes.

## The shape of the work

- Widen the corpus before widening a predicate. Each MIL wants a SECOND
  recorded pass and a SECOND recorded fail, drawn from the shapes above,
  so the control tests discrimination rather than non-constancy. The three
  transcripts are reproduced in this card's measurements and cost nothing
  to re-plant.
- MIL-02: accept the card as a PATCH as well as as a file, or state in the
  module that a diff-shaped handback is scored as a failure and why. Both
  are honest; silently scoring format is not.
- MIL-01: anchor the naming — require the symbol inside the rejecting
  passage rather than anywhere in the transcript, the way
  `the_one_line_carrying` anchors the method-version pin in `kit.rs`.
- MIL-04: match the signature on token boundaries rather than as
  substrings, and consider requiring the COMMAND as well as its output.
- Whatever is chosen, the acceptance functions themselves want the
  treatment their evals give the method: a positive control per shape, not
  per eval.

## Acceptance criteria

- WHEN MIL-02 scores a handback THE acceptance SHALL accept the card as a PATCH as well as a file, or the module SHALL state that a diff-shaped handback scores as a failure and why; silently scoring the report's format is refused. (from T-155-s6's measurement)
- WHEN MIL-01 scores a rejection THE planted defect SHALL be required inside the rejecting passage, not anywhere in the transcript. (from T-155-s6)
- WHEN MIL-04 scores a derivation THE signature SHALL match on token boundaries rather than as substrings; whether the COMMAND is required beside its output is considered and the conclusion of that consideration recorded on this card. (from T-155-s6)
- WHEN MIL-01, MIL-02 and MIL-04 are controlled THE corpus SHALL carry a SECOND recorded pass and a SECOND recorded fail for each of those three, drawn from the planted transcripts the card reproduces, so the control tests discrimination and not only non-constancy — a positive control per shape; MIL-03 keeps its existing controls and behaviour, which the source names as correct; the rates the card cites (0.00 / 1.00 / 1.00) are re-measured by the lane with a runner of its own. (from T-155-s6)
- WHEN the five per-seat run-hygiene sections are checked THE shared four-sentence skeleton SHALL have a checker that reds when one copy drifts. (absorbed T-159-s5, carried)
- WHEN the method version bumps THE model-in-loop set SHALL be runnable by ONE committed adapter honouring the contract in tools/method-evals/lib/model-run.mjs around an agent CLI the operator has, so `run.mjs --bump` no longer answers `Runner: NONE`; the replay runner stays a fixture and its rate is never recorded as one; the first real run's figures are recorded as the calibration of the four declared floors. (absorbed from T-229-s3)
- BEFORE dispatch THE three rulings SHALL be on this card, each its own: which model the adapter drives; the budget per bump; whether a bump may ship without the run. Model settings (T-318) may inform the first and decide neither of the others. (absorbed from T-229-s3's triage)

## Absorbed from T-229-s3 — no real eval runner (the environment variable named with the pre-rename identifier) exists in this tree, so the bump's model-in-loop obligation, the fourth of the four the bump owes at 0c7227b, has a half nobody can measure and a replay runner that scores 1.00 by construction (kept whole)

Title as filed (the runner variable's name spelled with the pre-rename identifier in the original, redacted here on the living-text rule; the ordinal is the fourth of the four obligations the bump owes, measured at 0c7227b): "No real <the pre-rename identifier>_EVAL_RUNNER exists in this tree, so the bump's fourth obligation has a half nobody can measure and a replay runner that scores 1.00 by construction"

Filed as: status suggested, priority 3, size M, touches [tools/method-evals], wake None, suggested_by executor claude-opus-5@subagent @T-229.

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

### TRIAGE, 2026-09-02 — stays `suggested`; a ruling is owed first (T-229-s3)

The architect seat, at the stamp of T-229's merge (d641846). A real
model-in-loop runner spends tokens against a real model at every bump;
which model, what budget per bump, and whether a bump may ship without
it are @human's rulings, not a card's. Held for that ruling; the
precondition for T-155-s6 is noted.

## Implementation notes

## Verdicts
