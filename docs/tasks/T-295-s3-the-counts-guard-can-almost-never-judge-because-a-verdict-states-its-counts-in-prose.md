---
id: T-295-s3
title: "The counts guard that stops 2d6d354's class can almost never judge, because a verdict states its counts in prose and the merge's own runs produce a count for at most one leg — three of four legs read `not judged` on the card's own fixture"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the T-295 executor, 2026-09-10, reading its own fixture run: the counts step reported one leg unjudged for want of a claim and three for want of a reading, and refused nothing"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, method/roles/verifier.md, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

T-295's counts step exists because `2d6d354` was a merge script that
committed on an exit code while the count under it had moved, and main
went red for it. The step grades the counts THIS merge's own runs printed
against the counts the newest verdict claims, and it is honest about what
it cannot answer: a leg with no claim and a leg with no reading are both
reported `not judged` rather than read as a pass.

On the card's own fixture that was every leg. The claim side is prose —
`parser 389 / app 1171 / rust 655 exit 0 and e2e 852` is a sentence a
verifier writes by hand, in a shape the grammar has to guess at — and the
reading side is whatever the merge happened to run, which is the dogfood
bodies and one drill. So the guard is correct, cheap, and currently
inert.

The two halves that would make it bite are separable: a verdict that
states its counts in a FIELD rather than in a sentence, and a merge that
knows which legs its own range owes (the owed-set token already derives
exactly that).

## Acceptance criteria

- WHEN a verifier writes a verdict THE counts SHALL be stated in a fixed
  field per leg, and the merge SHALL read that field rather than parsing
  prose; a verdict carrying the old prose shape SHALL still be read, and
  SHALL say that it was.
- WHEN the merge grades the counts THE legs it judges SHALL be the ones
  its own range OWES, so a leg the merge never ran is a leg the verdict
  is answerable for rather than one nobody looks at.
- WHEN a claimed count and a read count disagree THE merge SHALL refuse
  before the commit, seen on a planted history where exactly one leg
  moved by one body.
