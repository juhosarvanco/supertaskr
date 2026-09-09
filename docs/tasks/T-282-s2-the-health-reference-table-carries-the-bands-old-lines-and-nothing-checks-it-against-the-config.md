---
id: T-282-s2
title: "docs/reference/11-health.md's band table carries the lines by hand, so it went stale the moment a band was re-derived and no gate can see it"
feature: F-06
milestone: 4
size: S
priority: 12
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-282, 2026-09-09, at 3a69385"
blocked_by: []
touches: [docs/reference/11-health.md]
builder:
verifier:
built_by:
verified_by:
review:
---

`docs/reference/11-health.md` carries a table of every band with its
drift and breach lines typed in — the `triage/live-suggestions` row read
`| cards | 20 | 40 |` at `3a69385`. T-282 re-derived that band to 46 and
92 and moved `triage/net-arrivals-per-window`'s breach line from 40 to
46 in the same commit, so two rows of that table are now false.

Derived rather than assumed: `grep -rn "11-health\|docs/reference"` over
`tools/` and `.claude/` at `3a69385` returns NOTHING, so no suite, gate
or generator reads that page. It is a hand-kept copy of a table whose
home is `tools/e2e/scripts/health-bands.config.mjs`, which is the shape
T-057's one-home rule exists against — and the config's own header
already says a band edited without its reason is a number somebody has
to reverse-engineer.

Two shapes, and the second is cheaper than it looks: either the page
stops carrying the numbers and points at `npm run health -- --list`
(which prints every band with its measured reason in full, and is
already pinned by a body), or a docs body derives the table from
`allBands(DOC_BUDGETS)` and reds when the page and the config disagree.
The first is a paragraph; the second is the keeper.

Class parent: T-282. Disposition hint: promote with any docs-reference
lane; the fence is one file and shares no ground with the health bands
themselves.
