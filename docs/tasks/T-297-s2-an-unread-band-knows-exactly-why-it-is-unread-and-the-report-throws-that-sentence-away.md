---
id: T-297-s2
title: "An UNREAD band knows exactly why it is unread and the report throws that sentence away — the deriver names the card and the seat, and the operator is told only that something was not read"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-297, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/scripts/health-bands-run.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`cardMeters` in `tools/e2e/scripts/health-bands.mjs` collects a precise
reason whenever a card cannot be priced — the card and the seat that
stated no token figure, the tier ADR-024 sets no budget for, the missing
dispatch stamp — and every one of those sentences is discarded at the
map boundary, because a reading is absent or present and there is no
third thing to return. What the operator reads is the band's authority
name followed by "was not read this run", which says what was wanted and
never what was in the way. Measured at T-297's own landing:
`loop/token-budget-used` is unread because T-296's executor block states
no token figure, and nothing in the run's output says so.

The channel is small and it is worth having for every band, not only
these: `evaluateBand` takes an optional reason, `evaluate` takes a map
of them, `readingsFromTree` returns one beside its readings, and
`health-bands-run.mjs` passes it through. The existing message stays
byte-identical when no reason is supplied, so no band that has one today
changes.

## Acceptance criteria

- WHEN a deriver knows why a reading is absent THE report SHALL print that reason on the band's UNREAD line, after the authority it wanted.
- WHEN no reason is supplied THE UNREAD line SHALL be byte-identical to the one it prints today, so a band with no deriver-side reason is unchanged.
- WHEN the token band is unread because a seat stated no token figure THE run SHALL name that card and that seat.
