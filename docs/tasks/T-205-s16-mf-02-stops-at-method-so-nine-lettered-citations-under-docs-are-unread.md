---
id: T-205-s16
title: MF-02's corpus stops at `method/**`, so the nine LETTERED sub-step citations that live under `docs/` are resolved by nothing
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s4
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE PREDICATE NOW EXISTS AND THE CORPUS STOPS SHORT OF THE FILES THAT
NEED IT.** `T-205-s4` taught `MF-02` to resolve a lettered sub-step
citation — `roles/orchestrator.md 5d`, `` `roles/verifier.md` step 2b ``
— against the cited file's own `^ {0,3}\d+[a-z]\.` items. It reads
`readCorpus()` with no extras, so its corpus is `method/**/*.md` and
nothing else, and 8 citations resolve there.

**NINE MORE LIVE OUTSIDE IT, measured at `86b8803` with the same
predicate**, and every one of them is the exact failure the parent card
describes — a pointer that dangles the day `5d` is renamed, with every
gate green:

    docs/CONVENTIONS.md            `method/roles/orchestrator.md` 5d
    docs/CONVENTIONS.md            method/roles/orchestrator.md 5b   (x2)
    docs/CONVENTIONS.md            method/roles/verifier.md step 2b
    docs/STATE.md                  verifier.md 2b
    docs/reference/05-dispatch.md  method/roles/orchestrator.md step 5b
    docs/reference/07-verification.md  method/roles/orchestrator.md step 5d
    docs/reference/07-verification.md  method/roles/verifier.md step 2b
    docs/rooms/team-enablement.md  roles/orchestrator.md 5b

`docs/CONVENTIONS.md`'s is the one that stings: THE VERIFIER'S BENCH IS
TWO SPAWNS opens by citing `` `method/roles/orchestrator.md` 5d `` as the
one place the shape is stated, which is the same single-source pointer
`roles/executor.md` and `roles/verifier.md` make and MF-02 now checks —
in two files but not in the third.

**WHY IT IS A CARD AND NOT A LINE IN THE PARENT LANE.** `MF-09` already
shows the mechanism (`readCorpus(["docs/CONVENTIONS.md"])`), so the edit
itself is small. What is NOT small is what it does to the gate: an eval's
`reads:` is *"every path it depends on, for the trigger"*, and the METHOD
EVAL GATE fires on `method/**` or a citation-grammar line under
`docs/tasks/` — neither of which a `docs/reference/**` or `docs/STATE.md`
edit matches. Widening the corpus without widening the trigger buys an
eval that can go red on a commit no gate runs it for; widening the
trigger is a change to `docs/CONVENTIONS.md`, outside the parent lane's
fence and above its pay grade. That pairing is the decision this card is
for.

## Acceptance criteria

- MF-02 SHALL resolve lettered and numbered citations in the `docs/`
  files that make them, not only in `method/**`, and its `reads:` SHALL
  name what it actually reads.
- THE METHOD EVAL GATE's trigger SHALL cover whatever is added to the
  corpus, or the card SHALL record why it deliberately does not.
- THE coverage count SHALL rise by the citations the widening adds, and
  a POSITIVE CONTROL SHALL rename a sub-step and require the newly-read
  files to be named among the findings.

## Read beside

`tools/method-evals/evals/mf-02-rule-citations.mjs` (the predicate and
its `citersOf` control), `mf-09-attack-set-digest-refusal.mjs` (the
extra-path corpus), and `docs/CONVENTIONS.md`'s METHOD EVAL GATE bullet.
