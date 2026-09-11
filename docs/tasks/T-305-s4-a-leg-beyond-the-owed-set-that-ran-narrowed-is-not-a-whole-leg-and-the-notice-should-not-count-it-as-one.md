---
id: T-305-s4
title: "A leg beyond the owed set that ran NARROWED is not a whole leg, and the over-run notice counts it as one — the same sentence then prices it as the subset it was, so the notice contradicts itself in two lines"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-305, 2026-09-11, measured on a clone of the bench at adaace727bed7daa65638630df86ba856d63f939"
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-305's suite axis names every leg the token records as graded at this
tree which the range does not owe, and the clause that names them calls
them WHOLE legs. The arm's pricing does not agree: a leg carrying a
`scope` is priced by that scope, deliberately and for a stated reason —
pricing a narrowed run at the whole leg would tell a seat it spent time
it did not spend.

So a seat that ran the browser leg narrowed for one range and then pushed
a range that does not owe that leg at all reads a notice saying it ran a
WHOLE leg, followed one line later by a figure that is a small fraction
of the whole leg. Measured on a clone of the bench: the same token reads
as half a minute where the whole leg is ten, under a sentence that calls
it whole.

The actionable content is right — the leg ran and the range did not owe
it — and only the word is wrong. But the word is the one a seat reads
before it reads the figure.

## The shape that would work

The clause distinguishes a leg the token records as graded WHOLE from one
it records with a scope, and says of the narrowed one what it says of the
scopable leg elsewhere: how many spec files it graded. One sentence, two
shapes, and the figure below it stops contradicting the words above it.

## Acceptance criteria

- WHEN a leg beyond the owed set records a scope THE notice SHALL name it
  with the number of spec files it graded rather than as a whole leg.
- WHEN a leg beyond the owed set records no scope THE notice SHALL name
  it as the whole leg, as it does today.
