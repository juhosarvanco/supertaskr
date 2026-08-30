---
id: T-140-s4
title: The graph can now LEAVE the docs collector, because since T-140-s1 nothing reads it from there at rest — the last step of T-140's own ruling, and it needs a value call this lane refused to make
status: suggested
suggested_by: executor claude-opus-5 @T-140-s1
---

**T-140 RULED, at `MAX_FILE_BYTES`'s own definition site in
`docs_watch.rs`, that "THE GRAPH LEAVES THIS PIPELINE".** `T-140-s1` built
the channel that makes leaving possible — `arch_rollup` serves the
component picture and `arch_detail` serves file-level detail for one named
target, both reading `docs/architecture/graph.json` Rust-side so the file
never crosses IPC. **It did not remove the `.json`-under-
`docs/architecture/` branch of `is_collected_docs_path`.** This card is
that removal, and it is filed rather than done for a reason that is worth
reading before anyone does it.

## Why `T-140-s1` stopped short, in its own words

The four numbered steps under `T-140-s1`'s "What this card would do" are
its criteria, and **criterion 4 is "keep the honest degradation T-140
built (`map-too-large`) as the backstop for whatever limit the new channel
does carry."** `map-too-large` fires on
`derived.indexNotRun && graphSkip === "oversize"` — the collector's own
`SkipReason::Oversize` row for `graph.json`. Remove the collector branch
and that signal cannot occur, so the backstop the criterion says to KEEP
becomes unreachable unless the new channel is given a size limit of its
own — **and a size limit needs a VALUE, which is the decision `T-151`
reserves to @human and which `T-140` refused in writing at the same
definition site.** A lane that removed the branch and invented a number to
keep the banner alive would be doing `T-151`-shaped work under another
card's name.

So the removal is correct and its precondition is a ruling, not code.

## What it costs today to leave it in place, measured

Nothing on the map, and that is the point of the shape that landed: at any
project size the pane rests on the rollup, whose serialization is a
function of the REGISTRY (measured over synthetic trees in
`crates/nputer-index/tests/budget.rs`: **464 -> 464 bytes, 1.000x, over
23 -> 83 files, 3.61x**, while the graph floor moved 3.61x in the same
run). What it costs is the SNAPSHOT: `graph.json` is still collected,
still counted against `MAX_FILES`, and still the one collected file
anywhere near `MAX_FILE_BYTES` — so every docs push still carries it, for
a consumer that no longer needs it at rest.

## What this card would do

1. Remove the `.json`-under-`docs/architecture/` branch from
   `is_collected_docs_path`, and with it `docs-model.ts`'s `GRAPH_FILE`
   passthrough and `MapView`'s `graphContent` prop — **or say why each
   stays**. The pane's graph-derived path is deliberately retained as the
   browser/dev-harness fallback (`rollup-source.ts` answers `notTauri`
   there), so "remove the prop" and "remove the fallback" are two
   decisions, not one.
2. Re-source or retire `map-too-large` per @human's ruling on the limit
   question above. Retiring it is a legitimate answer — the state it names
   may simply no longer exist once the map is independent of the snapshot
   — but it must be RULED rather than deleted, because `T-140` built it as
   the answer to a silence it measured.
3. Re-measure the collected census at the executing ref. The last two
   readings are `372 files / 7.5 MB / graph.json 13.7%` (T-139) and
   `421 files / 8 215 112 bytes / 12.4%` (T-140, at `a533a4d`); both are
   dated and neither is to be quoted. The harness is
   `app/src-tauri/tests/graph_budget_bench.rs` plus
   `app/test/graph-budget-bench.mjs`.

## Fence and hazards

`touches: [app-shell, app-map]` at minimum (`docs_watch.rs` is C-10's,
`docs-model.ts` C-05's, the pane C-12's). It moves `map-shell-dom`,
`map-view-dom` and `docs-model` bodies by name, and the `docs_watch`
collector tests. **`T-139-s3` holds the general form of the
graph-specific-cap question** and should be read first if the ruling goes
the other way.
