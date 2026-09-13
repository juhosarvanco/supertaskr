---
id: T-205-s3
title: The usefulness floor 5d states — one attack per acceptance criterion — has no mechanical reader, so blindness achieved by uselessness still passes every check that exists
feature: F-06
milestone: 4
size: M
priority: 4
status: parked
wake: T-284
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-205 GAVE `useful` A FLOOR AND NOT A READER.**
`method/roles/orchestrator.md` 5d says a return under the floor — one
attack per acceptance criterion, each naming a way to satisfy that
criterion's LETTER while failing its purpose — is a refusal rather than
an attack set. Nothing counts. The eval corpus has the shape for it:
`tools/method-evals/lib/harness.mjs` already runs a model-in-loop set
against a declared pass rate, and `mil-01`/`mil-03` are the calibration
pair to copy.

**THE CONTROL T-205 RAN, AND WHY ITS RESULT MAKES THIS CARD SHARPER
RATHER THAN REDUNDANT.** Two blind phase-1 spawns were run on T-205's
own card, both returning `tool_uses: 0`: one with the paste 5d
prescribes, one starved to the title and the acceptance criteria alone.
**The starved arm returned MORE attacks — 35 against 20 — and the naive
expectation was wrong.** What the paste bought was AIM, not volume:
roughly 26 of the starved arm's 35 attacked a code implementation the
card explicitly excludes (*"a method-doc change, not a tooling
change"*), while the full arm's set was aimed at the documents actually
under change. **So a counter of attacks would have graded the starved
arm BETTER**, which is the degenerate reader this card must not build.

## Acceptance criteria

- THE eval SHALL grade a return against the CARD's criteria, not against
  a length, a line count or the presence of a numbered list.
- A DEGENERATE return — one that restates each acceptance criterion back
  as an attack — SHALL be graded UNDER the floor, demonstrated by
  running it, not asserted.
- THE eval SHALL use the SAME paste the contract prescribes, built by
  the same code path; a richer test-only paste measures a phase 1 that
  does not exist.
- THE grader SHALL NOT be the seat that produced the set.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the parent of the method-eval batch: the usefulness floor has no mechanical reader, so blindness by uselessness passes.
