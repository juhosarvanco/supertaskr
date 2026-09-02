---
id: T-228-s1
title: A card whose criteria say a body SHALL prove it was startable with a fence holding no test file, and only a verifier's ground measurement said it could not be built as fenced
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: the architect seat, room loop-efficiency item 24, 2026-09-02
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

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
- Positive controls demonstrated failing; the live board's startable set
  is derived at base and tip and every card that moves is named.

