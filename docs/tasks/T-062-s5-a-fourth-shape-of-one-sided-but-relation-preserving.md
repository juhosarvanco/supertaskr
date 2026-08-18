---
id: T-062-s5
title: A FOURTH shape of "one-sided but relation-preserving" — a whole-set equality widened to `expect.arrayContaining` goes green while the defect is live
status: suggested
suggested_by: verifier claude-opus-5 @T-062
---

**T-062's notes asked for a fourth, and there is one in this diff.** The
three-limb rule (a mutation drill only proves something if it is
one-sided **and** relation-breaking) keeps holding; what keeps growing is
the list of ways to satisfy limb one and quietly fail limb three.

Known shapes, each measured on a different assertion family:

1. **T-054** — a `toContain` needle shortened but still a substring.
2. **T-063** — a numeric inequality loosened but still satisfied.
3. **T-062-A2** — an equality widened to `.not.toBe(...)`.
4. **This one** — a whole-SET equality widened to a SUBSET relation.

## The mutation, and it is one character short of plausible

`tools/e2e/tests/shell-frame.spec.ts:184`, the assertion the card's
criterion 5 exists for:

    ).toEqual(screen.name === "map" ? ["map-node"] : []);

widened, assertion side only, one substitution, entirely correct-looking
— a reviewer reads it as "the map has at least `map-node`":

    ).toEqual(expect.arrayContaining(screen.name === "map" ? ["map-node"] : []));

One-sided: yes, the source is untouched. Relation-breaking: **no** — the
true value still satisfies it. And for the four screens whose expected
set is `[]`, `arrayContaining([])` matches **any array whatsoever**, so
the assertion is not merely loosened, it is total.

## Measured, with the defect live underneath it

Run with drill **R3 applied at the same time** (the canvas back to
`overflow-hidden` — the exact regression this task exists to prevent):

    tests/shell-frame.spec.ts   1 failed, 4 passed

**All three sweep executions passed** — including
`the frame holds on every screen at T-048's 800x600 baseline`, which is
the one that reds in 3.3 seconds on the unmutated file with the message
*"map: a box is hiding content with no way to scroll to it"*. Only the
separate canvas-specific test still caught it.

So this widening does not degrade the sweep, it **deletes** it, while
leaving a green suite and a diff that reads like a reasonable
generalisation. That is a worse outcome than either T-054's or T-063's
shape, both of which left an assertion that still discriminated
something.

## What it says about the rule

The rule survives — this is limb three failing, exactly as predicted, and
the drill correctly refuses to count it as evidence. What is worth
recording is the emerging pattern across all four shapes: **every one of
them is a widening of the RELATION rather than a change to the VALUE.**
`toContain` for `toBe`, `>=` for `>`, `.not.toBe` for `.toBe`,
`arrayContaining` for `toEqual`. A cheap mechanical check falls out of
that: in a drill, a substitution that changes the MATCHER is almost
always relation-preserving and almost never a valid poison; a
substitution that changes only the EXPECTED VALUE, with the matcher
fixed, is the shape that discriminates.

That is not a lint anyone can write today, but it is a one-line question
a reviewer can ask of any drill: *did the matcher move?*
