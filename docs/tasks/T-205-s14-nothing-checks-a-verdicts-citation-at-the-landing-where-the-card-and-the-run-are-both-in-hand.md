---
id: T-205-s14
title: Nothing checks a verdict's citation AT THE LANDING — the strongest of the three shapes T-205-s1's card named, and the only one outside a method-evals fence
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s1, 2026-09-09
blocked_by: [T-205-s12]
touches: [tools/e2e/scripts/gate-run.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-205-s1`. DISPOSITION HINT: **park behind `T-205-s12`.**
A landing leg that can only ever answer "unavailable" buys a step and no
verdict; give the sets a home first, then this is worth its bytes.

## The finding

`T-205-s1`'s card named three shapes and called the third the strongest:
*"a gate at the landing, where the card and the run's own capture are
both in hand — the shape `gate-run`'s verdict token already uses."* The
lane built shapes 1 and 2 (a checker, and an eval that invokes it) and
could not reach the third: `tools/e2e` was `T-224`'s fence at dispatch
and is outside `tools/method-evals` regardless.

The leg is small — `node tools/method-evals/verdict-digest.mjs` with the
merge's own changed card paths, its exit read unpiped. What it adds over
`MF-10` is the TRIGGER: the landing is the moment the citation and the
saved file are both in hand, and it is exactly the moment `T-205-s13`
says the method eval gate cannot see.
