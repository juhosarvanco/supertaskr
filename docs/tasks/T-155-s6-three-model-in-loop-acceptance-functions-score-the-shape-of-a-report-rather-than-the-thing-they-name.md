---
id: T-155-s6
title: Three model-in-loop acceptance functions score the shape of a report rather than the behaviour they name
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-155
---

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
