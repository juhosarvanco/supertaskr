---
id: T-076-s4
title: The ambiguous-mapping winner past 309 digits is unpinned, and a mutant proves it
status: suggested
suggested_by: verifier claude-opus-5 @T-076
---

T-076 fixed `compareComponentIds` and pinned `compareComponentIds`. It
did not pin the property the fix exists to protect: that the
`ambiguous-mapping` message's declared winner — "first by id,
'<id>', wins file mapping" — is decided by ID order at every id length.
The executor flagged this against itself ("there is no pin that says the
ambiguous-mapping WINNER is id order past 309 digits. Worth deciding
whether one belongs"). It belongs, and this file is the measurement that
turns the flag into a fact.

**Measured, not argued.** One one-sided source mutant, applied at
`lib/parser/src/component.ts:412` only — inline the pre-T-076 comparator
at the `ambiguous-mapping` sort site while leaving `compareComponentIds`
itself total:

    const inIdOrder = [...components].sort((a, b) => {
      const na = /^C-(\d{2,})$/.exec(a.id)?.[1];
      const nb = /^C-(\d{2,})$/.exec(b.id)?.[1];
      let d = 0;
      if (na !== undefined && nb !== undefined) {
        const diff = Number(na) - Number(nb);
        d = diff !== 0 ? diff : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      } else { d = a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }
      return d || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
    });

`npx vitest run` from `lib/parser/`: **263 passed (263), exit 0.** The
mutant survives the entire suite. It is not equivalent — built and
driven over two components with 400- and 401-digit ids and overlapping
`paths`, varying only which FILE holds which id, it restores the defect
verbatim:

    MUTANT winner digits: A=400  B=401  | same id? false
    MUTANT winner file:  A=C-aaa.md  B=C-aaa.md
    comparator itself still total? compareComponentIds = -1

The declared winner is the id in the first-sorting FILE in both
orderings, because `component.ts:412` reads
`compareComponentIds(a.id, b.id) || (file compare)` and `NaN` is falsy.
That is the second, deterministic half of the defect T-076 was written
to close, and today nothing would notice its return.

**Why it survives.** Every `ambiguous-mapping` pin in
`lib/parser/test/component.test.ts` (`:697`, `:706`, `:724`, `:738`,
`:753`, `:766`) uses two- and three-digit ids, and the branch-point and
fixed comparators agree on every id a double can weigh — verified here
over all 1,210,000 ordered pairs of every 2- and 3-digit `C-` id, zero
sign disagreements. So no existing pin can distinguish the two bodies,
and T-076's own new pins all assert the comparator in isolation rather
than through the consumer.

**What to take.** One body in `component.test.ts`: two components with
genuinely different ids past 309 digits and provably overlapping
`paths`, parsed twice with the ids swapped between two file names that
sort in opposite orders, asserting `ids[0]` is the smaller ID both
times — the shape of the reproduction above. Cheap, and it is the only
assertion that would state criterion 1's actual purpose rather than its
mechanism. Consider the same for the component-space `aliased-id` `ids`
array, which degrades by the other mechanism at the same threshold.

**A note for the drill discipline, not just this card.** T-076 ran 16
one-sided mutants with zero survivors and the notes report that
honestly. This mutant is of the same class and survives, because the 16
were derived from the pins that exist rather than from the criteria that
were written. "Zero survivors" is a statement about the mutant set, and
a mutant set chosen by reading the tests cannot find the property the
tests forgot. Worth stating once in the poison-discipline record: at
least one mutant per card should be derived from a CRITERION with the
test file closed.
