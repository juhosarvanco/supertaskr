---
id: T-221
title: THE ONE CHARACTER THAT MAKES CONTAINMENT CONTAINMENT IS UNPINNED — drop `sharedDomain`'s separator and NOTHING REDS, while three call sites now decide whether lanes may run at all
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [lib-parser]
suggested_by: "T-209's blind verifier, as suggestion S1 in its APPROVED verdict; re-raised by it after T-212 was dispatched onto the same primitive, and confirmed at the architect/integrator seat"
builder:
review: independent
---

**ONE CHARACTER DECIDES WHETHER `tools/e2e` CONTAINS `tools/e2e-helpers`,
AND NOTHING HOLDS IT THERE.**

`lib/parser/src/fence.ts:270-271`:

```ts
if (b.startsWith(`${a}/`)) return b;
if (a.startsWith(`${b}/`)) return a;
```

The behaviour is CORRECT today. `T-209`'s verifier planted the probe and
measured `tools/e2e` versus `tools/e2e-helpers` correctly **allowed**.

**But drop the `/` and nothing in the repository reds.** Measured at
`9d90978`, rebuilding the parser first:

    parser                                        344/344 GREEN
    lane-fence + card-preflight + dispatch-order   87/87  GREEN

Confirmed independently at this seat: **no body anywhere names an
adjacent-prefix pair.** `grep` over `lib/parser/test/` and
`tools/e2e/tests/` returns nothing.

## WHY THIS GOT WORSE WHILE IT SAT UNFILED

When the verifier raised it, `sharedDomain` had **one** consumer. Since
then:

- **`T-209` merged** (`4cb2313`) — the dispatch guard now REFUSES a lane
  whose fence overlaps a live one, and it computes that with this
  primitive.
- **`T-212` was dispatched** (`0a8dd58`) to add the **push** and **merge**
  call sites onto the same function, by that card's own instruction not
  to re-derive it.

So a silent regression here no longer misprints a row in a brief. It
**serialises lanes that never touch, at three gates**, and it does so
quietly, because a spurious refusal looks exactly like a correct one.

**THAT IS RULE 5'S OWN MEASUREMENT REINTRODUCED BY THE TOOL BUILT TO END
IT.** Rule 5 records the cost precisely: *"Measured on the session that
ran six lanes concurrently: every block was a naming collision and not
one real collision occurred."* Six for six spurious. This is the one
character standing between that measurement and its recurrence.

## The shape of the fix, and why it is small

**One body.** An adjacent-prefix pair asserted DISJOINT — `tools/e2e`
against `tools/e2e-helpers`, or any pair where one string is a prefix of
the other and neither is a path prefix of the other.

**A removal-only mutant cannot find this** and that is the point:
deleting the separator does not delete a behaviour, it WIDENS one, and
every existing body asserts cases that stay true under the widening. This
is the fourth instance in three days of *removal-only mutants cannot
distinguish an exact matcher from a containment one* — and the first
where the containment primitive itself is the subject.

## Acceptance criteria

- A BODY SHALL assert that a pair of paths where one is a STRING prefix
  of the other but not a PATH prefix is **disjoint**, and it SHALL red
  when the separator is dropped from either direction of `sharedDomain`.
- THE drill SHALL mutate **each direction separately**. The function has
  two symmetric lines; a body that only covers one leaves the other
  exactly as unpinned as before, which is this card in miniature.
- **A POSITIVE CONTROL SHALL prove a genuine containment pair is still
  reported as SHARED** — a guard that reports everything disjoint is
  indistinguishable from one that works, and would silently disarm
  `T-209`'s refusal entirely.
- THE mutant's landing SHALL be read from `git diff`, never from the
  mutator's own report — four instances across two agents in one night,
  where a pattern that silently failed to match reported "survived".
- Verification: headless, the parser suite.

## Read beside

`T-209` (the dispatch guard, first consumer, whose verifier raised this),
`T-212` (the push and merge call sites, dispatched onto the same
primitive), `method/lane-protocol.md` **rule 5** — cited by ordinal and by
its own capitals, because a line number is a figure and this project
falsified two of them in one night.

## Why the verifier did not file this itself

Recorded because the reasoning is right and worth keeping: *"I hold no
lane, my bench is gone, and writing into the checkout you're sitting in
is the collision rule 4 answers no."* It handed the finding back rather
than taking a write it had no standing for — and re-raised it unprompted
when the dispatch of `T-212` made it more urgent than when it was
written.
