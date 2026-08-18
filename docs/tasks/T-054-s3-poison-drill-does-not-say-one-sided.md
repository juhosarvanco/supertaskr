---
id: T-054-s3
title: The POISON DRILL bullet does not say a mutation must be ONE-SIDED — and the omission bites
status: suggested
suggested_by: verifier claude-opus-5 @T-054-verify
---

T-054 ratifies the poison drill in `docs/CONVENTIONS.md` and the bullet
is otherwise complete and actionable — I executed it against this branch
using nothing but its own text and needed no interpretation. One clause
is missing, and it is not hypothetical: it bit me on the first drill of
this verification.

**THE MISS.** The drill "change the `is an INDENTED BULLET` message text
and require the RED" was run as a global substitution over
`tools/e2e/tests/workflow-parity.spec.ts`:

    SUBS=3
    14 passed (850ms)     exit 0

The literal appears THREE times — once in the producer
(`structuralProblems`, `:162`) and once in each of the two assertions
that check for it (`:713`, `:739`). The mutation changed both sides at
once, so the test still agreed with itself and stayed green. **A
symmetric mutation produces a green that is indistinguishable from a
vacuous assertion** — the exact failure the drill exists to detect,
wearing the drill's own costume.

The card's recorded lesson — "count your substitutions, never assume a
mutation landed" — would NOT have caught it. The count was correct.
Three was the true number of occurrences; three is what applied.

Mutating a producer-only literal (`is an INDENTED BULLET: `, with the
colon, which occurs once) reds 12 and 13 and leaves 14 green, as the
notes claim. The drill is sound; only its instruction is under-specified.

**THE SAME FAILURE ONE LEVEL DEEPER, also from this session.** A doc
mutation written as
`perl -0777 -pe 's/…/exit 0 current \x{00B7} 1 STALE …/'` reported
`SUBS=1` and changed nothing observable: without a UTF-8 output layer
perl emitted the raw byte `0xB7`, not the two-byte `·`, so the splitter
never saw a separator. The count was right; the TEXT was wrong.

**One clause closes both**, in the bullet's "MUTATE every new or changed
assertion" sentence:

> …so that it ought to fail — mutating the code under test OR the
> assertion, never a literal the two SHARE, and confirming the mutated
> text is what you intended rather than only that a substitution count
> was non-zero. A symmetric mutation stays green and reads exactly like a
> vacuous assertion.

Related, and probably the same edit: the bullet says "mutate every new or
changed **assertion**, not every body" and is right about why. The
one-sidedness rule is the natural companion — both are about making the
mutation land where the assertion can see it.
