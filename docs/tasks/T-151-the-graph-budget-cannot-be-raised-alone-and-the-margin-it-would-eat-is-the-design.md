---
id: T-151
title: The graph budget can be raised by 8,575 bytes and no further — a cross-crate test pins it under the watcher's file cap, and that gap is what keeps graceful degradation in front of total loss
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: [T-135]
touches: [crate-index, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

**@human ruled "raise the graph budget" on 2026-08-27. This card exists
because the raise is not a one-line change and the obvious version of it
makes the system worse.**

## The measurement

    docs/architecture/graph.json   1,020,023 bytes
    max_graph_bytes                1,040,000   98.1% used, 19,977 left
    MAX_FILE_BYTES                 1,048,576   the docs watcher's hard wall
    gap between the two                8,576

**`docs_watch.rs:104` states the invariant and a test enforces it across
both crates:**

> `max_graph_bytes < MAX_FILE_BYTES` is what keeps the first failure in
> front of the second, and
> `tests::the_emit_budget_stays_below_the_collectors_file_cap` enforces
> it across the two crates.

So **raising `max_graph_bytes` alone buys at most 8,575 bytes.** At
T-140's measured floor of 802 bytes per file, that is **about ten
files.**

## Why eating the gap is worse than not raising

The two limits fail differently, and the order is deliberate:

- **Over `max_graph_bytes`** the emitter degrades — `apply_budget` drops
  symbol arrays largest-first. Files and import edges are never dropped.
  The map still works.
- **Over `MAX_FILE_BYTES`** the file becomes a `SkipReason::Oversize`
  row and **the pane stops receiving the graph at all.** No degradation.

**The 8,576-byte gap is the whole reason the graceful failure happens
first.** Collapsing it to raise the budget removes the early warning and
converts the next overflow from "symbols thin out" into "the map goes
dark".

## So the raise requires moving BOTH, and that reopens a settled ruling

`MAX_FILE_BYTES` is not a performance knob. `docs_watch.rs:67`:

> **`MAX_FILE_BYTES` IS 1 MiB AND T-139 MEASURED IT RATHER THAN MOVING
> IT.** It is an AVAILABILITY control, not a performance one, and that
> is why the measurement argues for leaving it alone rather than for
> raising it.

**T-139 measured this limit and ruled to leave it.** Raising it now is a
reversal, and it needs its own measured reason — what a pathological
repo can do to the IPC payload at 2 MiB — not an inherited one.

## What to do

1. **Re-run the two benches** (`app/src-tauri/tests/graph_budget_bench.rs`,
   `app/test/graph-budget-bench.mjs`) at the current 1,020,023 and at
   candidate ceilings. T-139's figures were taken at `13c736e` on an
   M5; the payload has grown since.
2. **Propose both values together**, preserving a proportional gap —
   the gap is the mechanism, not slack.
3. **Write the reason at both definition sites**, T-139's pattern.
4. **The invariant test must still pass** and must not be relaxed to
   accommodate the new values.

## The honest framing this card owes @human

**This buys time; it does not solve the problem.** `T-140` measured the
real fix: a component rollup is **720 bytes against 989,181 — 1,370×
smaller and flat in project size**. Raising both caps postpones a wall
that T-140 removes. **If only one of the two cards is worth a lane, it
is T-140.**

## Fence

`crate-index` is held by `T-135` (`status: building`, no lane), so this
card cannot dispatch until T-135 closes — recorded in `blocked_by`.
