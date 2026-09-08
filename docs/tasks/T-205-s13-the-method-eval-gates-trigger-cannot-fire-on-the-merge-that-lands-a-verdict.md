---
id: T-205-s13
title: The METHOD EVAL GATE fires on `method/**` and a verdict lands in `docs/tasks/`, so the check T-205-s1 wired runs on every merge EXCEPT the one that lands the citation it would check
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s1, 2026-09-09
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/reference/10-gates.md]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-205-s1`. DISPOSITION HINT: **promote — it is three
sentences in two documents, and without it the first acceptance
criterion of `T-205-s1` reads stronger than it measures.**

## The finding

`T-205-s1` made `MF-10` the invoker of the verdict-digest checker, so
`node tools/method-evals/run.mjs` — the METHOD EVAL GATE — runs it and
no seat has to remember. But the gate's own trigger, `docs/CONVENTIONS.md`
line 1539 at `6dd44a6`, is *"at any merge whose diff touches
`method/**`"*, and **a verdict lands in `docs/tasks/`**. So the check
runs on every merge that moves the method text and not on the merge that
lands the citation. It is a real residual, named here rather than left
for a reader to discover behind a criterion that sounds closed.

Three edits, none of them inside `T-205-s1`'s fence:

1. The METHOD EVAL GATE bullet gains a clause: the gate also fires where
   the diff adds a line matching the citation grammar under `docs/tasks/`.
2. The bench bullet's own retraction. Lines 321-325 at `6dd44a6` say
   *"WHAT IS STILL A HAND STEP IS THE WIRING … Do it by hand until
   `T-205-s1` lands"* — that sentence names this card's parent as its
   retirement condition and is false the moment it merges. The
   replacement owes the command, the invoker, and the ONE thing still
   done by hand: reaching the scratchpad (`T-205-s12`).
3. `docs/reference/10-gates.md` line 147 enumerates MF-07, MF-08 and
   MF-09. MF-10 belongs in it; that sentence goes stale silently.
