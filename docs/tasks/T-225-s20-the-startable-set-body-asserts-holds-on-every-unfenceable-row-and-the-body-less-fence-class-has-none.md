---
id: T-225-s20
title: The STARTABLE-set body asserts holds on every UNFENCEABLE row, and T-225-s11's body-less-fence class has none — the live-board equation reds on the first planned card whose criteria demand a test and whose fence holds no spec
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: the architect seat, from battery30's e2e RED at d8ccd8c (dispatch-order.spec.ts, "the STARTABLE set is exactly the ready set minus what the live lanes hold"), 2026-09-03
blocked_by: []
touches: [tools/e2e/tests/dispatch-order.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What happened

T-242 and T-244 were filed at the form sitting with criteria in the
"a test SHALL" shape and fences of method/ and tools/e2e/scripts paths
— no spec file. T-225-s11's rule classified both UNFENCEABLE with the
reason "holds no path any suite collects, so the body has nowhere
inside the lane to go", and holds `[]`. The STARTABLE-set body then
failed its last loop: `for (const r of o.unfenceable)
expect(r.holds.length).toBeGreaterThan(0)` — received 0. The body's
premise is the OLDER meaning of unfenceable (an overlap by containment
that cannot be proved, so something is HELD); T-225-s11 added a second
meaning (a fence that cannot be COMPUTED, nothing held) and the
assertion never learned it. The seat widened both fences with
tools/e2e/tests (the seat's own amendment, fast path A) and the view
returned 0 unfenceable; the spec's assumption stays latent.

**Why battery29 was green on the same cards:** the body reads the
board at HEAD (its rows are stamped `@ <ref>`), and the four cards were
uncommitted when battery29 ran at `c066ccd`. The form sitting record's
"ORDER, disclosed" paragraph says the suites ran on a working tree that
"already held" the cards — true of the tree, not of what this body
read. That correction lives here and in the next record, never in the
record already written.

## Acceptance criteria

- WHEN an UNFENCEABLE row's reason is T-225-s11's body-less-fence class
  THE body SHALL assert holds is EMPTY and the reason names the class;
  WHEN the row's reason is the containment class THE body SHALL keep
  asserting holds is non-empty — the two classes SHALL be told apart by
  a field the view emits, never by parsing the prose.
- WHEN a planted card with a test-demanding criterion and a method-only
  fence is added to a fixture board THE body SHALL stay green and the
  planted row SHALL land in the body-less class (positive control);
  IF the view ever folds such a row into STARTABLE THEN THE body SHALL
  red BY NAME.
- The body SHALL say, in a comment, which tree it reads (HEAD or the
  working tree) so a seat running a battery on uncommitted cards knows
  what the run did and did not test.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
