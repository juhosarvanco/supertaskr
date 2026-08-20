---
id: T-072-s2
title: Poison shape six has no mechanical remedy but it does have a mechanical check
status: suggested
suggested_by: executor claude-opus-5 @T-072
---

CONVENTIONS' POISON DRILL bullet records shape six as *"a body that reds
under an expected-value poison while killing no mutant another test does
not already kill"*, cites `app/test/interview-model.test.ts` (T-057-s1,
absorbed by T-072), and closes: *"SIX HAS NO MECHANICAL REMEDY — the
drill has to ASK."* That is right about the REMEDY and it leaves the
reader without a procedure. **T-072 ran one, and it is short enough to
write down.**

**THE CHECK.** After the drill reds, do not ask "is this a duplicate?" —
that is a judgement about two texts and it is exactly what T-057's
executor got wrong in good faith. Ask instead: **name a mutation of the
code under test that this body kills, run the WHOLE suite under it, and
require that the failing-body count is ONE.** A count of one IS the
non-duplication, mechanically; a count above one names the bodies that
already cover you, in the reporter's own output, and the disagreement is
over before it starts.

**WORKED, AT T-072, ON THE FILE THE SHAPE WAS FOUND IN.** The surviving
body is `a second banking in the same turn merges in PATH order, not
arrival order`. Two mutants isolate it:

    M1  observeBanking's merge sort dropped   -> 1 failed / 832 passed of 833
    M2  set(turn, banked) for set(turn, merged) -> 1 failed / 832 passed of 833

Both name that body and nothing else, across the whole app suite rather
than the file — which is a stronger claim than the criterion asked for
and costs the same run. For contrast, the SUPERSEDED body would not have
found one: every mutant that kills `a docs snapshot during an active turn
produces a chip` also kills the two bodies whose scripts open with the
identical first step.

**AND THE CHECK HAS A HONEST FAILURE MODE, WHICH IS THE POINT OF
RUNNING IT.** If no such mutant exists, that is the finding — the body
is covered elsewhere and its name is the only thing it contributes.
Recording "I looked and there is none" is a real result; the current
wording leaves a reader with no way to say that.

**WHERE IT GOES.** One paragraph under SHAPE SIX in the POISON DRILL
bullet, which is `T-084`'s fence at the time of writing. It does not
replace *"the drill has to ASK"* — it says what the asking looks like
when it is answered rather than argued.

**A SECOND, WEAKER OBSERVATION, offered as evidence and not as a
proposal.** The isolating-mutant count also grades a body that is not
suspected of anything: `M10` (drop the whole-observation identity, keep
the map identity) reds exactly one body too, and that body is the ONLY
holder of a guarantee the render pin does not need. A body whose count is
one is load-bearing; a body whose count is zero is decoration. Running
the check over a whole file would be a survey, not a gate, and it is not
being proposed as one.
