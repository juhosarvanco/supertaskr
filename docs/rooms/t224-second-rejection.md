---
type: escalation
task: T-224
status: resolved
max_rounds: 1
---

# T-224's second rejection — the architect waives once, in writing, and says so here

@human — informing, not blocking (TASK-FORMAT, "THE STOP CONDITION
WEIGHS REJECTIONS RATHER THAN COUNTING THEM"; "AN ESCALATION IS STILL
WRITTEN EVEN WHEN THE ARCHITECT WAIVES").

**The two rejections, and why they are distinct:**

1. dde56da (2026-09-08): `touchesAmendments` resolved cards by PATH, so
   a renamed card's widened `touches:` line evaded both landing moments
   — the sealed attack set's falsifier 2, reached by a rename.
2. 40b22e4 (2026-09-08): the rework's FIX introduced a regression — a
   `seen` set deduping by id plus a path-first resolution let a decoy
   file carrying the card's id straddle the two endpoints, so the real
   card's move was skipped; the same falsifier reached by a different
   construction that did not exist before the fix.

**The distinctions this waiver relies on** (each named in the rule):
the second defect is NEWLY FOUND (it did not exist at dde56da — the
verifier measured both forms REFUSED there); it is not the SAME defect
surviving a rebuild (the rename evasion is closed: both orderings
refuse, delete-and-re-add refuses, the id distinction holds); its cause
was not known and left open; and its remedy lies INSIDE the fence
(.claude/hooks/landing-gate.mjs and tools/e2e/tests/landing-gate.spec.ts),
named precisely by the verifier with two of its three bodies already
written and run on the bench.

**The conflict this room exists to catch, named:** the ARCHITECT SEAT
THAT WAIVES IS THE SEAT THAT DISPATCHED T-224 (17:20Z, after @human's
"dispatch T-224 and T-265 together"). The waiver stands on the
verifier's measurements, not on the dispatcher's wish to land the card.

**What follows:** a third pass by a fresh executor, closing exactly the
verifier's corrections (both endpoints resolved from the per-revision
index, path only as a fast path when the index maps the id to that one
path; a duplicate id created by the range REFUSED, never a
cannot-compare allow; the three bodies). A THIRD rejection is terminal
by rule: park and re-plan, never a fourth pass.

— the architect seat, 2026-09-08

## Outcome (the architect seat, 2026-09-09)

The waiver held. The third pass (63b9c3d) closed both rejections — cards
resolved from the per-revision index at both endpoints, a duplicate the
range arrives at refused — and the third verifier APPROVED WITH ASSIGNED
CORRECTIONS at e710e4b, naming one finding it weighed as materially
weaker than either rejection (an inherited ambiguity on one id discarded
a refusal found for another; not lane-reachable; 0 duplicated ids on the
live board). The correction was performed at the merge (d487a2d) to lane
standards, with its body red before and green after. No fourth pass was
needed; the escalation is resolved.
