---
id: T-237-s8
title: The identity's own home file lists its limits and does not name the ONE machine where it will not derive at all — a CI runner — so the limit is stated only in the file that consumes it
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-237-s2
blocked_by: [T-237-s2]
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A POINTER THAT PROMISES MORE THAN THE FILE IT POINTS AT CARRIES.**
`.claude/hooks/push-guard.mjs`'s holder section says, in as many words:

    THE LIMITS ARE THE IDENTITY'S AND THEY ARE STATED WHERE IT IS
    DERIVED, in `checkout-currency.mjs`

and then lists three — a seat that never arms, a seat that commits
without pushing, and the one-harness fact. That pointer is the right
shape: one home for the limits, and a consumer that refers to it rather
than copying it. **It is now incomplete in the direction that cost main
a red.** `sessionIdentity` derives from the nearest ancestor process
that IS the harness, and there is a whole class of machine where no such
ancestor exists: a CI runner, whose tree is `node <- bash <- Runner`.
Every local checkout has the ancestor and is green; the runner has none,
and on 2026-09-02 that difference reddened main through a body that
armed the arm from the real process tree (T-238-s2, absorbed into
T-237-s2 and closed there).

**T-237-s2 NAMED THAT CASE IN THE CONSUMER, WHICH IS THE WRONG HOME AND
WAS THE ONLY ONE INSIDE ITS FENCE.** `push-guard.mjs`'s declared-limits
header now carries the runner with the incident, and
`checkout-currency.mjs` — the file its own pointer calls the home of
these limits — still does not. A reader who starts where the pointer
sends them meets a limits list that is missing the limit that has
actually fired.

## Acceptance criteria

- THE identity's own header in `tools/e2e/scripts/checkout-currency.mjs`
  SHALL name the machine on which the derivation answers nothing — a CI
  runner, with the ancestry that makes it so — beside the three limits
  it already states, and SHALL say what the callers do there (announce
  and allow).
- WHERE that file's header and `push-guard.mjs`'s consumer header state
  the same limit, ONE of them SHALL be the home and the other SHALL
  point at it rather than restate it, so the pair cannot drift.
- A body in `tools/e2e/tests/checkout-currency.spec.ts` SHALL show
  `sessionIdentity` answering `ok: false` for an ancestry carrying no
  harness — driven through an injected process reader, never through the
  machine the suite happens to run on — with the derivable ancestry as
  its positive control.
- Verification: headless.
