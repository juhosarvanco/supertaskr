---
id: T-172
title: Interview chrome, two @human rulings from the walk — the "one question at a time · N of 7" line goes, and "Bank answer" is just "Answer"
feature: F-03
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
suggested_by: "@human's genesis walk (2026-08-30) — both rulings verbatim in the walk debrief"
touches: [app-interview]
---

Two rulings from @human's milestone-3 genesis walk, both about the
interview screen's chrome, neither needing a room — @human ruled them
in the debrief and the card exists so the rulings land as code:

1. **The status line under planner messages goes.** @human, verbatim:
   *"this is unnecessary -> one question at a time · 6 of 7"*. The
   stage is already carried by the header ("stage 7 of 7 ·
   decomposition") and the progress segments; the per-message
   repetition is chrome restating chrome.
2. **The bank button says "Answer".** @human, verbatim: *"'Bank
   answer' button should be just answer."* "Bank" is the method's
   internal verb for the write-to-disk step; the person answering a
   question is answering a question. The banked→files confirmation
   line already tells the write story after the fact, where it is
   news.

Acceptance: the line is absent from every planner message; the button
reads "Answer" (the banked→ confirmation stays); the e2e interview
spec's affected bodies updated WITH the rename asserted, so a revert
reds.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-03 p2, with one correction to its acceptance

Both strings located at `b60b06d`, so the lane starts from the sites
rather than from a search: the button is
`app/src/genesis/InterviewChat.tsx:540` (`Bank answer`, with a second
occurrence in a comment at `:231` that is prose about focus and must not
be swept blindly), and the status line is built in
`app/src/genesis/interview-model.ts:386-387`
(`one question at a time · N of M`).

**THE CORRECTION: THE E2E LANE ASSERTS NEITHER STRING TODAY, so there
are no "affected bodies" to update.**
`command grep -rn "one question at a time" tools/e2e/tests/` returns
nothing, and `tools/e2e/tests/interview.spec.ts` reaches the bank step
through `getByTestId("interview-banked")` rather than through the
button's text. So the card's *"e2e interview spec's affected bodies
updated WITH the rename asserted, so a revert reds"* is satisfied only
by ADDING an assertion — the acceptance is a new pin, not an edit to an
existing one, and a lane that reads it the other way will report the
sweep complete with nothing pinning either ruling.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.
