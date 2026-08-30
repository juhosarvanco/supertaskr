---
id: T-167-s6
title: One statistic now lives in two packages as two different numbers — check::WARN_HEADROOM_BYTES and the graph/budget-headroom-bytes band's breach line — and the spec that pins the band to check.rs pins its PARSER, not its THRESHOLD
feature: F-01
milestone: 4
priority: 6
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167-s2
blocked_by: []
touches: [tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: `T-156` (the health bands). DISPOSITION HINT: promote at
low priority, or decline WITH THE REASON WRITTEN DOWN — the honest
outcome may well be "two stamps of one measurement are fine", but that
sentence does not exist anywhere today and the next reader will
re-derive the question from scratch.**

`T-167-s2` added `check::WARN_HEADROOM_BYTES` to
`app/src-tauri/crates/nputer-index/src/check.rs`: the headroom under
which `index --check` shouts. Its value is one mean single-commit growth
of `docs/architecture/graph.json`, **14,914**, re-derived at
`9ed2b7fa430d5088c6b5cbefe8c4f4cbac906803` (61 growths; median 5,230;
max 241,980).

The health band `graph/budget-headroom-bytes` in
`tools/e2e/scripts/health-bands.config.mjs` breaches at **15,751** and
says so in its own `measured.reason`: the same statistic, over 55
growths, read at `13c736e` from `IndexOptions::max_graph_bytes`'s doc
comment. So do `max_graph_bytes`'s own docs.

**Three copies of one measurement, taken at two refs, and nothing joins
them.** Every copy is stamped and none is false — the difference is six
growths of history, not a disagreement — but that is a claim somebody
has to re-derive to believe, and the repo has been bitten by one rule
with two implementations before (T-057, T-137, and the two `expandTouch`
joins). The specific gap: `tools/e2e/tests/health-bands.spec.ts` already
reaches ACROSS the package boundary to pin the band's PARSER to
`check.rs`'s own format strings, by symbol, with the reason written on
the body — *"somebody reformats `budget_line`, this band goes UNREAD
forever"*. The identical argument applies to the THRESHOLD and nobody
made it: somebody re-measures one number, the other keeps a figure from
a ref two months back, and the two instruments quietly stop meaning the
same thing.

Derive the three yourselves before deciding — a card that transcribed
them would be a fourth copy:

    grep -n 'WARN_HEADROOM_BYTES: usize' app/src-tauri/crates/nputer-index/src/check.rs
    grep -n 'breach:' tools/e2e/scripts/health-bands.config.mjs
    grep -n 'MEAN of 15,751\|15_751' app/src-tauri/crates/nputer-index/src/lib.rs

## Acceptance criteria

- THE band's breach line and `check::WARN_HEADROOM_BYTES` SHALL either
  be joined by an assertion that reds when they diverge, or the band's
  `measured.reason` SHALL state that the divergence is deliberate and
  what makes the two thresholds different questions.
- WHERE an assertion is chosen, IT SHALL cite the crate constant BY
  SYMBOL rather than by line, the way the parser pin in
  `health-bands.spec.ts` already does.
- THE change SHALL NOT edit the crate — `T-167-s2`'s doc comment already
  names the band, and a second edit there would make the pin circular.

## Implementation notes

## Verdicts
