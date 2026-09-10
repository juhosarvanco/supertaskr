---
id: T-297-s5
title: "The token parse reads the first number the word `tokens` is attached to, and one seat writing its budget as `310,000 tokens` would silently read the budget as the reading"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-297, 2026-09-11"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

`parseSeatTokens` takes the first number the word `tokens` is attached
to, and its own comment argues the choice well: on all four blocks the
readings file carried at the lane's base, the seat states its reading
and the window it was taken against in the same sentence, and the window
is always the larger number. That rule is measured and it holds against
that corpus — because every one of those four writes the window as a
`budget` or a `window`, never as `tokens`.

The rule is one regular expression and the corpus is four blocks, all
written by the same two seats within a day. Measured by the verifier at
the lane's tip: `budget 310,000 tokens; used 20K tokens` reads 310,000,
which is the budget, and the band would report that seat at a hundred
percent of a budget it never spent. Nothing warns, because the quote
travelling beside the value is `310,000 tokens` and reads perfectly.

The cheap remedy is not a cleverer parse. It is to say what a meters
block owes — one line naming the seat's own consumption — where the
seat can read it before writing one, and to keep the prose parse as the
fallback it already is. A stated shape also gives `loop/token-budget-used`
a route out of being dark whenever any one seat is silent.

## Acceptance criteria

- WHEN a meters block states a token figure in the stated shape THE parse SHALL read that figure and never a number stated as a budget or a window in the same block.
- WHEN a block states only prose THE parse SHALL behave as it does today, so no block on record changes its reading.
- WHEN a block states a budget using the word `tokens` and a reading elsewhere THE reading SHALL be the one taken, seen on a fixture carrying both.
