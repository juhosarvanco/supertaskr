---
id: T-238-s4
title: "`--take-seat` writes over a record it could not READ without saying it replaced anything — re-taking is the documented remedy and stays right, and announcing a takeover only for a DEAD holder is what is wrong"
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-238-s1
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE ASYMMETRY THE SIBLING ARM MADE VISIBLE.** T-238-s1 taught
`--release-seat` to refuse a record whose shape it could not read, on the
ground that removing it retires an unread claim. `--take-seat` reaches
the same record by a different route and OVERWRITES it, and that is
correct: `holderVerdict`'s own sentence for the unreadable state is
*delete the file or re-take the seat*, so re-taking is the documented way
past it and a refusal here would leave a checkout no arm could ever
claim.

**WHAT IS WRONG IS THE SILENCE.** The arm announces a takeover for
exactly one prior state — `h.state === "dead"`, which renders *TAKEN OVER
from a dead holder* — so a seat that takes a checkout carrying an
unreadable record is never told there WAS one, and the file that might
have named the previous holder is gone with no line in the transcript.
That is the same class as the release defect, one act over: an arm acting
on evidence it did not read.

## Acceptance criteria

- WHERE `--take-seat` replaces a record this reader could not parse, THE
  arm SHALL say so before it writes — naming the reason the record could
  not be read, the way the DEAD branch names whose record it took over.
- THE seat SHALL still be taken; this is an announcement and never a
  refusal, because refusing would leave the checkout unclaimable.
- A body SHALL drive `--take-seat` over an unreadable record and read the
  announcement back, with a takeover over a DEAD holder and a take over a
  VACANT checkout as its controls.
- Verification: headless.
