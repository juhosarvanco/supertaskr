---
id: T-132-s5
title: Ruling thirteen sorts defects by WHEN they became false and never by WHO may write the fix — and it has no answer at all for a citation the merge introduces already false
status: suggested
suggested_by: architect claude-opus-5
---

**Found by T-132's own integrator, at the merge that landed the rule.**
It is the **second consecutive checkpoint** to decline ruling thirteen's
repair half on this ground, which makes it a property of the rule rather
than a preference of one hand.

## The rule, as landed

*Repair what the merge INTRODUCES; file what the merge merely REVEALS.*
Its operative test is **"was it true one commit ago? Yes: repair. No:
file."**

## Two defects, and the second is worse

**ONE — THE TEST HAS NO ANSWER FOR A CITATION THE MERGE INTRODUCES
ALREADY FALSE.** T-132's own card claims its fix is *"`T-123-s10`'s
entire ask."* That claim is **false on arrival** — the merge introduces
it, and it was never true one commit ago either, because it did not
exist. **The honest answer to the test is *neither*, and the headline
and the test then point in opposite directions**: "introduced" says
repair, "was it true one commit ago" says file.

**TWO — THE RULE SORTS BY TIME AND THE ACTUAL CONSTRAINT IS AUTHORITY.**
Both checkpoints that declined the repair half declined it for the same
reason, and it is not a timing reason. **T-108's fence ruling exempts a
card's own file only for PROTOCOL writes** — `status:`, `built_by:`,
`verified_by:`, `review:`. An integrator's stamp is a protocol write.
**Writing a new rule, or striking another hand's sentences, is a LANE
write — and an integrator holds no lane.**

So an integrator can meet ruling thirteen's *when* test and still be
forbidden by T-108's *who* test. **The two rules are both correct and
the pair is incomplete**, because nothing tells a reader which binds
first.

## Why it matters more than it looks

**The rule was written to stop an integrator quietly repairing what it
should have filed.** As landed it can also license the reverse — a
checkpoint that reads only the headline, finds a defect its own merge
introduced, and repairs it with a lane write it has no standing to make.
**Nothing in the sentence stops that**, and the only reason it has not
happened is that two integrators independently reached for T-108 instead.

**AND IT SHIPS.** Ruling thirteen lives in `method/roles/integrator.md`,
which `method/` materialises into other projects. **Measured at T-132's
merge from cargo's own dep-info: exactly fourteen `method/` files compile
into the binary, and `roles/integrator.md` is NOT one of them** — so this
particular sentence travels by materialisation rather than by
`include_str!`. Either way it leaves this repository.

## The shape of a fix, not the fix

**Order the two tests rather than adding a third.** The candidate: *who
may write the fix* is asked FIRST and *when it became false* second —
because authority is a hard constraint and timing is a routing
preference. A defect an integrator may not fix is filed whatever its
vintage; among the ones it may fix, the merge's own get repaired.

**IF that ordering is right THEN ruling thirteen's sentence needs one
clause, not a rewrite** — and the already-false-on-arrival case falls out
for free, because authority answers it where timing cannot.

**A POSITIVE CONTROL IS OWED AND IS AWKWARD HERE**, which is worth saying
now: the rule's own text materialises into repositories this project
cannot run a suite against, so "prove the fixed rule admits the ordinary
case" has to be argued rather than executed. `T-132-s4` hit the same wall
and said so.

## What is already on the record

- `T-132-s4` — the card's *"entire ask"* claim, recorded false in STATE,
  in the card's `## Integration` section, and in the checkpoint message.
- **Both declining checkpoints named T-108's protocol-write clause as the
  reason.** That convergence is the evidence; neither hand had read the
  other's reasoning when it wrote its own.
