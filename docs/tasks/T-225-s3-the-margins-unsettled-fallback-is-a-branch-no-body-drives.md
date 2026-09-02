---
id: T-225-s3
title: The margin's UNSETTLED fallback is a branch no body drives — `withMargin` has a labelled honest answer for a fixed point that will not converge, and nothing proves it is reachable or right
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder:
verifier:
built_by:
verified_by:
review: independent
---

**DISCLOSED BY THE EXECUTOR THAT WROTE IT, RATHER THAN LEFT TO BE
FOUND.** `withMargin` in `tools/e2e/scripts/dispatch-brief.mjs`
discloses the size of the whole answer INCLUDING the block that declares
it, which is a fixed point: each pass renders a candidate total and asks
whether the block that renders it makes that total true. In practice it
settles in a pass or two, because only a digit count can move. **It is
not guaranteed to**: the block's `- N left` field SHRINKS as the body
grows while the `output: N` field grows, so the block's own length is
not monotone in the total and a knife edge could refuse to settle.

The code handles that honestly — after eight passes it discloses the
DERIVATION's size instead, which is exact, under a heading saying so and
with the field relabelled `derivation below:` rather than `output:`. So
the tool never declares a number that is off by a byte.

**WHAT IS MISSING IS A BODY.** `brief.spec.ts` asserts
`wrapped.whole === true` on a board-sized answer, which drives the
SETTLED branch only. The fallback is:

- **unproven reachable** — nobody has constructed a body length that
  refuses to converge, so it may be dead code;
- **unproven correct** — its relabelled line and its two note lines have
  never been rendered by a test, so a typo in them would ship;
- **invisible if it ever fires** — a reader would meet a differently
  worded disclosure with no signal that it is the fallback.

**WHAT A FIX WOULD DO.** Either (a) drive the branch — search a small
window of body lengths for one that oscillates, and pin the labelled
output; or (b) remove the possibility instead of the branch, by taking
the deltas out of the size line so the block's length is monotone in the
total and the iteration provably terminates on the first repeat; or
(c) prove the oscillation cannot occur at any body length and delete the
fallback with the proof in a comment. **(b) is the one to price first** —
this project's own rule is that a construction beats a check
(`method/lane-protocol.md` rule 4), and a branch that cannot be reached
is cheaper to remove than to test.
