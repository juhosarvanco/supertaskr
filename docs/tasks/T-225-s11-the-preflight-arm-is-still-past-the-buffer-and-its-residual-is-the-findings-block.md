---
id: T-225-s11
title: With rule four cited, `--task <id> --preflight` is still 5,129 bytes past the buffer, and the residual is the preflight's OWN findings block rather than the row set
feature: F-06
milestone: 4
size: S
priority: 3
status: building
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, lib/parser/src/lanes.ts, lib/parser/test/lanes.test.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
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

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. The preflight residues share one file: the size past the buffer, the no-spec-file refusal (T-228-s1) and the quote arm pin (T-230-s8) ride together.

## Absorbs: T-228-s1 (2026-09-02, at the T-225-s2 merge (6691fc5))

A card whose criteria say a body SHALL prove it was startable with a fence holding no test file, and only a verifier's ground measurement said it could not be built as fenced

## The finding

T-228 was stamped and armed with `touches: [.claude]`. No test file lives
under `.claude`; every body that can drive the hook sits in two spec files
under tools/e2e/tests. Preflight, the arm and the brief all passed the
card. The executor routed the card's own ORDER body OUT as a suggestion
because the fence refused it, and the blind verifier's phase-1 ground
named the contradiction twenty minutes later. The seat widened by fast
path A (ae7e8a9). Room loop-efficiency, item 24.

## What is asked

`card-preflight` reads the fence and the card already. When a criterion
line carries a body-demanding phrase (`a body SHALL`, `a test SHALL`,
`SHALL red`, `positive control`) and the resolved fence contains no
`*.spec.ts`, `*.test.*` or `tests/` path, the preflight SHALL refuse
with a line naming the criterion and the fence, and the dispatch view
SHALL list the card as unfenceable with that clause. A card whose
criteria are documentary (a reader over prose) is not affected.

## Acceptance

- A planted card with `touches: [.claude]` and a `SHALL prove it`
  criterion is refused at preflight and reaches `unfenceable` in the
  dispatch view; the same card with a spec file added to the fence is
  startable.
- A planted card with a documentary criterion and no spec file stays
  startable (the negative control).
- Positive controls demonstrated failing; the live board's starta

## Absorbs: T-230-s8 (2026-09-02, at the T-225-s2 merge (6691fc5))

markerEnd's typographic-quote term is inert under every census arrangement, so no body pins it — one assertion on markerEnd's own return would

## The finding

V-T-230-s7's drill MV2 dropped the typographic term from `markerEnd` and
every body stayed green (48 of 48). The verifier showed the term is inert
rather than unpinned: all eight census arrangements read identically with
and without it, because a shortened segment can only leak a CLOSING
typographic quote and `QUOTED_RUN` cannot open a run with one. Only
`markerEnd`'s own return value moves. The lane disclosed the same shape as
its M6.

## What is asked

One body drives `markerEnd` directly on a marker whose payload closes
with a typographic quote on a continuation line and asserts the returned
index, so that dropping the term reds by name. The census arrangements
need no change. Kill set: that body and no other.

## Acceptance

- A mutant dropping the typographic term reds exactly one body.
- The eight census arrangements V-T-230-s7 recorded still read identically.
