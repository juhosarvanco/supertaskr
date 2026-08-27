---
id: T-093-s2
title: T-093 and T-142 are one card under two names — a search and a census are the same false-empty, and T-142 should absorb T-093's residue
status: suggested
suggested_by: executor claude-opus-5 @T-093
---

**This is a triage recommendation, recorded rather than taken** — T-093's
brief asked its executor to decide whether the two are one card and to
say which absorbs which, and that is triage's call.

## They are one class

T-093's anchor is *a search that finds nothing is not a refutation*.
T-142's is *a census that names a field the data does not have returns
zero, and zero is indistinguishable from a clean result*. Both are: a
query ran, produced no error, returned an answer shaped exactly like the
answer you wanted, and the answer was about a different question.
T-093's three causes are three MECHANISMS for a false empty; T-142's
three instances are three more of the same mechanism one layer up — a
field name that does not exist is a needle that cannot match, in the
same way a wrapped line is.

T-142 already names the unifying rule and it is one this repository
wrote for itself: **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.** It
is stated in `docs/CONVENTIONS.md` for TEST BODIES and was never carried
across to the one-off queries that feed cards, briefs and STATE. Every
instance on both cards is that rule un-applied.

## The recommendation: T-142 absorbs T-093's residue, not the reverse

**T-093 is DONE and its content has landed**, so absorption in the
`Absorbs:` sense runs one way only. What is left over from T-093 is
exactly the arm T-142 calls the one that generalises:

1. **T-142 arm 1 — extend the positive-control rule to censuses, in the
   place it is already stated.** T-093 wrote the positive-control
   discipline into the CITATION bullet for SEARCHES (`file(1)` and the
   token lint for a byte, a shorter needle for a wrap, the repo root for
   a scope). The census half belongs in the SAME bullet, in the same
   voice, and would have been in T-093's diff had its criteria named it.
2. **T-142 arm 2 — name the layer boundary once** (frontmatter keys are
   snake_case, model properties are camelCase). STATE carries it today
   as a live-hazard line; a hazard that recurs belongs in CONVENTIONS.

**Arm 3 (give the census a tool) should NOT be folded in.** It is a
`tools/e2e` build with its own fence and its own verifier row, it only
covers queries that go through the parsed model, and T-142's own
instance 1 went through `graph.json` directly. Split it out rather than
letting it hold arms 1 and 2 hostage.

## The practical consequence for triage

T-142 is `priority: 4` and `touches: [method/]`; arms 1 and 2 as argued
above touch `docs/CONVENTIONS.md`. **The fence on the card does not
match the work the card recommends**, which is worth fixing before
dispatch whichever way triage rules — a lane cut to `method/` cannot
write the sentence this suggestion is about.

**One more instance for the pile, measured at `bc2d82a`:** T-093's own
card cites `grep -n "silent in exactly"` as the needle that FINDS a
sentence a longer needle misses. It no longer does — ADR-019's
compaction reflowed the line. A remedy needle recorded without a ref
went stale in four days, in the card whose subject is that this happens.
