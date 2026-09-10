---
id: T-297-s1
title: "The readings owe a dispatch stamp and a CI-green stamp, so the cycle band stops being a floor — today it ends at the merge and under-reports every card by the runner's own wall clock"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-297, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

ADR-024 measures the loop from DISPATCH TO CI GREEN and T-297's
`loop/cycle-budget-used` measures dispatch to the merge, because that is
where the tree ends: the dispatch stamp is a commit and the merge is a
commit, and CI green is minutes later inside an API. The band says the
word FLOOR on every line it prints, which is honest and is not the
reading the ruling asked for. The gap is small per card and it is
systematically in one direction, which is the shape that eventually
gets rounded away by a reader who forgot the disclaimer.

The fix is at the CAPTURE, not at the parse. `readingsLines` in
`tools/e2e/scripts/merge.mjs` writes card, size, tier, seat, source,
merge and the block's text; two more fields close this — a
`dispatchedAt` read off the card's own dispatch-stamp commit, and a
`ciGreenAt` the seat stamps when it has read the run. Then the parse
stops shelling out to `git log` per card, the reading stops being a
floor, and a card whose CI never went green is visibly missing its
second stamp rather than quietly counted as fast.

## Acceptance criteria

- WHEN the merge appends a reading THE line SHALL carry the card's dispatch time and, where the seat has read the run, its CI-green time, each as an ISO-8601 stamp.
- WHEN a reading carries both stamps THE cycle band SHALL price the card between them and SHALL stop calling its reading a floor; WHEN a reading carries only the dispatch stamp THE band SHALL keep the floor wording it has today.
- WHEN a reading carries no dispatch stamp THE band SHALL fall back to the dispatch-stamp commit it reads today, so an old line keeps its reading rather than going dark.
