---
id: T-205-s18
title: "MF-02's lettered control pins `CONTROL_ORD = 5d` and needs two citers, so removing one legitimate citation reds `--selftest` with a POSITIVE-CONTROL banner over a predicate that is fine"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205-s4
blocked_by: []
touches: [tools/method-evals/evals/]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE CONTROL DERIVES ITS EXPECTATION AND PINS ITS SUBJECT.** `T-205-s4`
did the hard half right: `citersOf` reads the citing files out of the
corpus instead of typing two paths beside the assertion, so the arm
cannot assert against itself. What is still typed is the SUBJECT —

    const CONTROL_HOME = "method/roles/orchestrator.md";
    const CONTROL_ORD = "5d";

— together with a guard that fails the arm when fewer than two files
cite it.

**MEASURED, AT `0bf398c`.** Replace `roles/executor.md`'s
`` `roles/orchestrator.md` 5d `` with a pronoun — an ordinary editorial
edit that breaks nothing — and:

    node tools/method-evals/run.mjs            -> exit 0  (33 citations, 7 lettered)
    node tools/method-evals/run.mjs --selftest -> exit 1

with the banner *"A POSITIVE-CONTROL failure means an eval did NOT
detect its own degradation: the eval passes whatever the method text
says, which is a vacuous check"* over an arm whose own line says the
truthful thing: *"method/roles/orchestrator.md 5d is cited from 1
file(s) in the corpus, so there is no multi-citer sub-step to
demonstrate against."*

**IT FAILS LOUD AND IT FAILS TRUE, WHICH IS WHY THIS IS A SUGGESTION AND
NOT A DEFECT.** No false green is possible. What it costs is a future
seat's afternoon: a red banner accusing the eval of vacuity, on a commit
whose only sin was tightening a sentence.

**THE FALLBACK EXISTS TODAY.** `method/roles/verifier.md` `2b` is cited
from two distinct files (`roles/executor.md` and
`method/tasks/TASK-FORMAT.md`), so a control that SEARCHES the corpus for
any lettered sub-step with two or more citers has a second candidate
right now, and degrades to a skip-with-reason only when the method
genuinely stops citing any sub-step twice.

## Acceptance criteria

- THE lettered control arm SHALL derive its subject from the corpus —
  any lettered sub-step with two or more distinct citers — rather than
  naming one, and SHALL report which subject it chose.
- WHERE no such sub-step exists, the arm SHALL say so in a way that is
  distinguishable from a control that failed to detect its degradation.
- A POSITIVE CONTROL SHALL remove one citer of the chosen subject and
  require `--selftest` to stay GREEN by choosing another — demonstrated
  red against the pinned implementation before it is trusted passing.

## Read beside

`tools/method-evals/evals/mf-02-rule-citations.mjs` (`citersOf`,
`CONTROL_HOME`, `CONTROL_ORD` and arm 2 of `degrade()`), and
`T-205-s4`'s verdict, which records the measurement above as mutant
D2.7b.
