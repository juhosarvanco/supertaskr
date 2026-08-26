---
id: T-140
title: The graph's floor is 802 bytes per file, so the map stops working at about a thousand files — nputer cannot currently be pointed at a real codebase
feature: F-06
milestone: 5
priority: 6
size: L
status: planned
blocked_by: [T-139]
touches: [crate-index, app-map, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

**@human, 2026-08-26, on being shown that T-139 raised the budget**:
*"If the graph is already starting to have too much data, then it's not
going to work for bigger projects. How do we fix this? 1MB can't be the
limit."*

**That is correct, and the arithmetic is worse than "the limit is tight".
This card exists so `T-139`'s raise is not mistaken for an answer.**

## The floor, measured

`emit::apply_budget` drops symbol arrays when the graph exceeds its budget
and **never drops files or `import` edges**. So there is a floor the budget
cannot go below, and at this repository's shape it is **802 bytes per
file** (146 788 bytes for 183 files, derived by serializing files-without-
symbols plus import edges alone).

| project | skeleton ALONE | against the 1 MiB collector cap |
|---|---|---|
| this repo, 183 files | 147 KB | 0.14× |
| **1 000 files** | **802 KB** | **0.8× — at the wall** |
| 5 000 files | 4.0 MB | **3.8× over** |
| 20 000 files | 16 MB | **15× over** |

**So the graceful degradation stops being graceful at roughly a thousand
files.** Past that the part that *cannot* be dropped is itself over the
cap, and the collector's response to over-cap is not truncation — it is
`SkipReason::Oversize` and `continue`. **The pane stops receiving a graph
at all.**

`T-139` raised the emit budget from 1 000 000 to 1 040 000 on a correct
argument and bought this repository a few weeks. **It does not move this
number, because the binding constraint is the skeleton and the skeleton is
linear in file count.**

## Three measurements from T-139 that all point the same way

1. **THE LIMIT IS NOT PROTECTING PERFORMANCE.** Cost is **linear to 25 MB
   with no knee**, and loading today's 989 KB graph takes **3.7 ms** total.
   Nothing is slow at a megabyte. **A cap defending against slowness would
   sit somewhere else entirely, or nowhere.**
2. **THE GRAPH IS TRAVELLING THROUGH THE DOCUMENTS PIPELINE.** It is
   subject to `MAX_FILE_BYTES` only because it lives under `docs/` and is
   collected by `is_collected_docs_path`'s `.json`-under-`docs/architecture/`
   branch. **That pipeline is built for markdown a human wrote**, and its
   per-file cap is sized for prose. Measured: the real payload is
   **372 files / 7.5 MB, of which `graph.json` is 13.7% — 86% is markdown.**
   The graph inherited a constraint designed for something else.
3. **65% OF THE LOAD COST IS THE DELIVERY MECHANISM, NOT THE DATA.**
   `emit_js_script` splices the serialized JSON **verbatim into a JS source
   string** which the webview `eval`s, so it is parsed by the general JS
   parser rather than the JSON fast path — **1.76 ms to eval against
   0.92 ms to `JSON.parse` the same bytes.** (`T-139-s2`.)

## The shape of the fix, measured rather than asserted

**The pane should not receive the whole graph.** It should receive the
component-level picture, and pull file-level detail only for what the user
is actually looking at.

**Measured at this ref**: the component rollup — every component and its
`depends_on` — is **720 bytes against the graph's 989 181. About 1 370×
smaller, and FLAT in project size**: thirteen components whether the repo
holds 183 files or 20 000. The per-file detail is the part that scales,
and it is exactly the part a pane needs only for what is on screen.

**That is the only shape on the table that is not linear in file count.**
Raising a constant, compressing the format, or interning path strings all
buy a constant factor and leave the growth curve alone.

## Acceptance criteria

- **THE FLOOR SHALL BE RE-DERIVED AT THE EXECUTING REF, NOT INHERITED.**
  802 bytes per file is this repository's shape today. **Derive it, and
  derive the file count at which the skeleton crosses the collector cap** —
  that number is the card's whole subject and it moves as the format does.
- **THE PANE'S ACTUAL NEED SHALL BE ESTABLISHED BEFORE ANYTHING IS BUILT.**
  What does the map render without a user drilling in? IF it already draws
  only components at rest THEN the rollup is sufficient by construction and
  this card is smaller than it looks. **Measure what the pane reads, do not
  assume it needs what it is sent.**
- **THE DEGRADATION SHALL BECOME HONEST AT SCALE.** Today an over-cap graph
  is **dropped whole** and the pane's own truncation rendering
  (`MapView.tsx:969`) never fires, because the payload never arrives.
  **Whatever ships, a project too large to map fully SHALL say so on
  screen** — silence is the current behaviour and it is the defect.
- **THE DOCUMENTS PIPELINE SHALL BE RULED ON, NOT WORKED AROUND.** Either
  the graph leaves it and gets a channel with its own limit, or the `.json`
  branch gets a graph-specific cap — `T-139`'s criterion 4 already names
  the second and `T-139-s3` holds the general form. **Say which and why;
  do not raise `MAX_FILE_BYTES`, which governs all 372 collected files and
  whose largest markdown is 145 078 bytes.**
- **THE `eval` CHANNEL SHALL BE MEASURED AGAIN AT THE NEW SHAPE.** If the
  payload becomes kilobytes, `T-139-s2`'s 65% becomes irrelevant and the
  finding should be closed with that measurement rather than left open.
  IF it stays large THEN the channel is the next constraint and this card
  SHALL say so.
- **NO PIN SHALL ENCODE A PROJECT SIZE.** A body asserting "works to N
  files" rots the day the format changes. **Pin the RELATION** — that the
  shipped payload does not grow with file count — which is the property
  that actually distinguishes the fix from the status quo.
- **`T-139`'s RAISE SHALL NOT BE RE-LITIGATED.** It was correct on its own
  argument and its reasons are written at their definition sites. This card
  records that it bought time; it does not reverse it.

Verification: headless — bare `cargo test --no-fail-fast` from
`app/src-tauri`, exit **unpiped from `$?`**, total SUMMED from the
`test result:` lines and cross-checked against the `running N tests`
headers. `npm test` from `app/` (the pane is C-12's, the collector C-10's).
**Build `lib/parser` first, then `npm run build` from `app/`.**
**POISON DRILL on every new assertion**, producer mutated and never the
assertion, read back with `git diff` before its run, restores per-path by
sha256, detached worktree **OUTSIDE the repository at a SHORT path** with
its `CARGO_TARGET_DIR` named `target` — and note `walk.rs:58` hard-skips
only `.git` and `node_modules`, so `target/` is excluded by the root
`.gitignore` and that protection is a line anyone can edit (`T-111-s10`,
as corrected by `T-139`). **Uniqueness of kill SHALL be measured against
the whole suite.** **A benchmark is not an assertion** — if this card
measures, say so and state why the measurement is not drilled, as `T-139`
did. **Ask GRAPH REGEN rather than predicting it and ask AGAIN after any
write.** **Ports are machine-wide while rule 4 partitions by CHECKOUT.**
**This is an L card and owes a planning pass before any code.**
**@human: one look at the shape**, because how much of a codebase the map
shows at rest is a product decision about what the pane is for.
