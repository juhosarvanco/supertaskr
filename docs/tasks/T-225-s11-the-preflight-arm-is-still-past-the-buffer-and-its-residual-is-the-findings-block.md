---
id: T-225-s11
title: With rule four cited, `--task <id> --preflight` is still 5,129 bytes past the buffer, and the residual is the preflight's OWN findings block rather than the row set
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-225-s2 TOOK 12,356 BYTES OFF THIS ARM AND IT IS STILL OVER.**
Measured back to back at one held board, the base `09526da` read in a
detached drill and the diff read in the lane immediately after:

    --task T-133 --preflight    83,021 -> 70,665 bytes   (-12,356)

against a 65,536-byte pipe buffer, so the arm went from 17,485 PAST to
**5,129 PAST**. The margin guard in `tools/e2e/tests/brief-flush.spec.ts`
now announces it on every run — T-225-s2 added the arm to `LIVE_ARMS` —
so the approach is no longer silent.

**THE RESIDUAL IS NOT THE ROW SET.** `--task <id>` alone is 41,281 bytes
at the same board, so the preflight's own half is about 29,000: the
claim-by-claim re-derivation and its findings, plus the checkout sweep,
which prints one line per checkout on the machine and therefore grows
with the number of live lanes rather than with the card.

**WHY IT WAS NOT BUILT IN THE LANE.** `tools/e2e/scripts/card-preflight.mjs`
is outside T-225-s2's fence and was held by the live lane T-230-s7 at
dispatch, so the two fences are disjoint by construction and this one
could not be widened from inside.

**WHAT A FIX WOULD DECIDE.** Whether the preflight's per-claim output is
summarised to the claims that FAILED with a count of those that held —
which is what a dispatcher acts on — or whether the sweep's per-checkout
lines collapse to the stale ones plus a count. Both are the same
question T-225 answered for `--dispatch` with the dispatchable-now
filter: print what the reader will act on, and say how much was not
printed.
