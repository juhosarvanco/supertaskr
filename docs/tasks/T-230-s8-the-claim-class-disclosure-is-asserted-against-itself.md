---
id: T-230-s8
title: The claim-class disclosure body is PARAMETRISED BY THE CONSTANT IT CHECKS — five of the six classes' checks/refuses/cannot strings are asserted only through CLAIM_CLASSES itself, so a class that stops disclosing a blind spot reds nothing
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-230-s3
blocked_by: []
touches: [tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE ONE BODY THAT GUARDS THE PREFLIGHT'S OWN HONESTY CANNOT FAIL FOR
FIVE OF ITS SIX CLASSES.** `every run prints which claim classes it
checked and which it cannot` in tools/e2e/tests/card-preflight.spec.ts
loops the frozen table and asserts, per class:

    expect(text).toContain(c.checks);
    expect(text).toContain(c.refuses);
    expect(text).toContain(c.cannot);

The expected value is READ FROM THE THING UNDER TEST. Shorten a `cannot`
line, delete the clause naming a blind spot, or empty the string
outright, and the body still passes — `toContain("")` is true of every
string. This is docs/CONVENTIONS.md's A NEGATIVE ASSERTION NEEDS A
POSITIVE CONTROL, second face: *a test parametrised by the constant it
checks cannot pin that constant.*

It matters more here than the general shape suggests, because the
`cannot` lines ARE the guarantee. The module's own header says a census
that omits its own blind spots reads as coverage, and the third
acceptance criterion of `T-160` requires the tool's output to say which
classes it cannot check. A disclosure nothing can red is a disclosure
that decays to whatever the last editor happened to leave.

## Measured, not argued

`T-230-s3` mutated two `cannot` clauses one capital at a time in a
detached drill worktree (M10, M11): the parametrised loop stayed GREEN
under both, and only the literal assertions that card added reddened.
The mutants and their restoration proofs are on that card's
implementation notes.

## What is already done and what is left

`T-230-s3` pinned FOUR clauses of the `quotes` class as literals — the
frontmatter direction, the frontmatter scalar scope, the floor omission
and the hard-wrap omission — beside the loop, and left the loop's
cardinality pins in place. The other five classes (`paths`, `fence`,
`figures`, `blockers`, `refs`) and the `checks`/`refuses` halves of all
six are still asserted only through the constant.

## The construction

Pin ONE literal phrase per class per column, chosen as the clause the
class's guarantee rests on rather than a whole sentence — a whole
sentence pins the wording and reds on a reflow, which is how a
disclosure pin becomes the thing somebody deletes. The loop keeps the
cardinality (`CLAIM_CLASSES.length`), the literals keep the content;
neither alone is the check.

**AND THE POSITIVE CONTROL IS THE ACCEPTANCE CRITERION, NOT AN EXTRA**:
degrade each clause on a COPY of the table and require the literal to
red, the shape `--selftest` uses one directory over.
