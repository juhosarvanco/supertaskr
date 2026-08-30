---
id: T-140-s4
title: The graph can now LEAVE the docs collector, because since T-140-s1 nothing reads it from there at rest — the last step of T-140's own ruling, and it needs a value call this lane refused to make
feature: F-06
milestone: 4
priority: 1
size: M
status: planned
blocked_by: []
suggested_by: executor claude-opus-5 @T-140-s1
touches: [app-shell, app-map, crate-index]
---

PARKED at standing triage sitting #3, 2026-08-30 (architect seat),
`@ 51fa31c0964c` — **NOT DECLINED, AND NOT RULED HERE, BECAUSE THE
RULING IS @HUMAN'S.** The card's own precondition says so and this seat
agrees with it: removing the `.json`-under-`docs/architecture/` branch
makes `map-too-large` unreachable unless the new channel is given a
size limit of its own, and a size limit is a VALUE — the class `T-151`
reserves to @human and that `T-140` refused in writing at
`MAX_FILE_BYTES`'s own definition site. A seat that promoted this card
would be handing a lane either an invented number or a deletion of the
banner `T-140` built as the answer to a silence it measured. STATE
already routes it the same way: *"`T-140-s4` (the graph limit ruling)
is @human's when the alarm's number matters again."*

**RE-DERIVED AT THIS BASE RATHER THAN TAKEN ON THE CARD'S WORD**, and
one half of the card's premise has MOVED: the committed graph is now
**TRUNCATING**. `perl -0777 -ne 'print $1 if /"stats"\s*:\s*(\{[^}]*\})/'
docs/architecture/graph.json` answers `truncated_symbols: true,
truncated_files: 2` at `files: 198, symbols: 2095`, and
`wc -c docs/architecture/graph.json` is 1037788 against the crate's
1040000. So "the alarm's number matters again" is closer than the card's
own measurement suggests, and the value question is live rather than
theoretical. That is a reason to route it, not a licence to answer it.

**RESURFACES:** @human rules the graph size-limit question — here, in
`docs/rooms/`, or in session — OR `T-140-s3` (F-06 p13, the sibling
still on the board) is dispatched, whichever is first. Either event is
checkable by the seat that meets it without remembering this card. A
resurfaced card is RE-DERIVED, never trusted: the census figures in the
body below are stamped at refs that have moved and the card says so
itself.

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


## PROMOTED AND RULED (2026-08-30, standing triage sitting #4's seat) — @human ruled RAISE THE BUDGET

**@human's ruling, taken FIRST-HAND in this seat's own session
(2026-08-30): "yes, raise the budget — go ahead".** It was relayed
beforehand by the outgoing integrator session, which recorded the
rationale offered with it and accepted: the 1 MB cap protected the
RESTING map's payload, `T-140-s1` moved the resting map to a rollup so
the full graph is read on DRILL only, and the cap's original pressure is
therefore gone. The relay was treated as context; the word above is the
authority.

**THIS RULING REVERSES `T-151`'s REJECTION, AND THE REVERSAL IS HONEST
RATHER THAN A CONTRADICTION.** `docs/tasks/rejected/T-151-*.md` carries
@human's rejection of "raise the graph budget" from the same day. What
changed is not the argument but a FACT the argument rested on: T-151 was
right that the raise was capped and that spending the gap removed the
early warning — and it was arguing about a graph that was still a
COLLECTED FILE. This card removes it from the collector, which is the
step that dissolves T-151's constraint rather than overruling it.

## THE SEQUENCING FINDING — the raise is capped at 8,575 bytes unless step 1 lands first

Derived at `2370144`, and it is the reason this card carries the budget
constant at all:

    app/src-tauri/crates/nputer-index/src/lib.rs:160   max_graph_bytes: 1_040_000
    app/src-tauri/src/docs_watch.rs:158                MAX_FILE_BYTES: u64 = 1_048_576
    app/src-tauri/src/docs_watch.rs:1908               the_emit_budget_stays_below_the_collectors_file_cap

`graph.json` is subject to BOTH limits, and `lib.rs`'s own doc comment
says why: *"the collector accepts `.json` only under
`docs/architecture/`, a rule written for this file"*. So raising
`max_graph_bytes` ALONE buys at most **8,575 bytes** — about ten files at
T-140's measured floor — and spends the gap that keeps DEGRADATION
(symbols thin, files and import edges survive) in front of the CLIFF
(`SkipReason::Oversize`, the pane receives nothing). **That is exactly
what `T-151` was rejected for.**

**Remove the collector branch — this card's own step 1 — and
`MAX_FILE_BYTES` stops applying to the graph at all**, at which point the
budget is free to rise to a derived number. So the ruling and the removal
are ONE lane in ONE order, which is why the fence now carries
`crate-index` beside `app-shell` and `app-map`.

**AND THE INVARIANT TEST GOES WITH IT.**
`the_emit_budget_stays_below_the_collectors_file_cap` asserts a coupling
whose premise this card deletes. It is RECONCILED — retired with its
reason recorded at the assertion site, or re-aimed at whatever limit the
new channel carries — and never merely deleted to make a suite pass.

## THE ONE SUB-DECISION STILL OPEN, AND IT IS @human's

Step 2 of this card's own list: with the graph out of the collector,
`map-too-large` (`app/src/architecture/MapView.tsx:822`) can never fire,
because the state it names stops existing. The card says retiring it is a
legitimate answer but must be RULED rather than deleted, since `T-140`
built it as the answer to a measured silence. **The seat's recommendation,
routed rather than taken: RETIRE it, and have the lane write one sentence
naming what speaks in its place** — `truncated_files` / `truncated_symbols`
and the crate's own headroom alarm are the live keepers of the signal that
still exists. **DO NOT DISPATCH THIS CARD UNTIL THAT WORD IS GIVEN**; the
rest of the card is ready.

## Derive, do not pick — the new number

The budget's value is the point of the ruling, so it is DERIVED at the
lane's own ref and never rounded to something that looks tidy:

- the graph's NATURAL untruncated size today (regenerate with the budget
  raised high enough not to bind, and read what it wants to be);
- what that costs to read at DRILL, which is the only consumer left;
- growth room proportional to this repository's measured per-merge
  growth — `check::WARN_HEADROOM_BYTES`'s own one-ordinary-merge
  derivation is the pattern to copy, and the alarm should be re-armed
  against the new headroom rather than left pointing at the old one.

Expect a LARGE `graph.json` diff: four files are truncated at this ref and
get their symbols back, `docs_watch.rs` among them at 0 symbols today. The
dogfood pins that count symbols and edges move with it and are re-derived
WITH THE STORY, never loosened.
