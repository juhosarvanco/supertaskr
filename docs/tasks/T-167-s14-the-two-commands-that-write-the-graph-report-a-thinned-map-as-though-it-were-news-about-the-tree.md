---
id: T-167-s14
title: The two commands that WRITE the graph report a thinned map as though it were news about the tree — `index` and `index --watch` print files/symbols/edges and never that the emitter dropped, so the local delivery loop can ship a map that stopped answering
feature: F-06
milestone: 4
priority: 6
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167-s13
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-167-s13, AND DELIBERATELY NOT BUILT THERE.**
That card asked `index --check`'s alarm block to name WHICH files
`emit::apply_budget` emptied, and built the channel that makes it
possible: `apply_budget` returns its dropped set and
`crate::index_with_drops` carries it beside the graph. The GATE now
reads it. **The two commands that actually WRITE the graph do not.**

- `cli.rs`'s `Command::Index` arm prints
  `[supertaskr-index] wrote <path> (N bytes, N files, N symbols, N
  edges)` and never a word about a truncation, although the graph it
  just wrote may have had whole symbol arrays emptied to fit.
- `watch::index_once` builds `WatchEvent::Indexed { changed, files,
  symbols, edges, duration_ms }` from the same run, and `cli`'s
  `render_watch_event` prints exactly those. `index --watch` is the
  LOCAL DELIVERY LOOP — it is what keeps the map current under the
  app's watcher — so a truncation there is invisible until somebody
  independently runs `--check`.

The asymmetry is the finding: the one command that only READS the graph
shouts about a drop in an unindented block, and the two that WRITE one
report a smaller symbol count as though it were news about the tree. A
falling `symbols` figure is exactly what a truncation and a deletion
look like from there, and nothing distinguishes them.

## Why it is a separate card

T-167-s13's four criteria are about the `--check` alarm block, and its
drills are scoped to `check::drop_clause` and the record's own
membership. This is a different render path (two of them), a different
type (`WatchEvent` would gain a member, which is a decision the way
`Stats` gaining one was), and its own poison drills. Same fence,
different card: a suggestion never expands a lane's scope.

## Acceptance criteria

- WHERE `index` writes a graph the emitter thinned, THE command's own
  line SHALL say so, in the unit `check::drop_clause` already publishes
  (FILES whose array was emptied, never symbols).
- WHERE `index --watch` re-indexes and the emit thinned any file, THE
  reported event SHALL carry that fact, so a reader of the watch log
  can tell a truncation from a deletion.
- THE addition SHALL NOT move `WatchEvent::Indexed`'s existing members
  or the `wrote`/`unchanged` line's existing figures, both of which
  have pins.
- WHERE `WatchEvent` gains a member, THE decision SHALL be recorded —
  it is a public type the app's Rust half renders, not a private one.
