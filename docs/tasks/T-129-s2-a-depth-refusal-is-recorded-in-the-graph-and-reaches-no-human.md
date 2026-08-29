---
id: T-129-s2
title: A depth refusal is recorded in graph.json and reaches no human — and `skipped` has had the same silence since T-009
status: parked
suggested_by: executor claude-opus-5 @T-129
---

T-129 made the extractors REFUSE past a depth bound and RECORD the
refusal: `FileEntry.depth_refused` names the traversal that stopped, and
`Stats.depth_limited` counts the files. Both are in the committed
`graph.json`, which is C-07's entire job.

**Nothing reads either one.** Not the CLI, not the app, not a gate.

## Derived rather than assumed, at `ae16fbe`

| surface | what it prints | does it mention a refusal? |
|---|---|---|
| `nputer-index index` summary line (`cli.rs`) | `wrote … (N bytes, N files, N symbols, N edges)` | no |
| `nputer-index index --check` (`check.rs`) | bytes/files/symbols/edges + a `+`/`-`/`~` file diff | no |
| `nputer-index --watch` (`render_watch_event`) | files/symbols/edges/ms | no |
| `IndexOutcome::Indexed` (`index_cmd.rs`, C-05) | `changed, files, symbols, edges, truncated, graph_bytes, …` | no |
| the map pane (C-12) | components, files, symbols, edges | no |

**`stats.skipped` HAS THE IDENTICAL SILENCE and has had it since T-009**,
which is why this is filed as one card and not two: a file skipped for
being non-UTF-8 or over the 4 MiB parse cap is *"counted, never silent
(plan §3)"* in the graph and invisible everywhere a person looks. T-129
deliberately gave `depth_limited` the same shape as `skipped` rather than
inventing a one-off reporting path — consistency was the right call for
one card, and it makes the gap exactly one size bigger.

## Why it matters more for a refusal than for a skip

A skip is mechanical: the file could not be read at all. A depth refusal
is a file that WAS read, DID parse, and is in the map with **part of its
content missing** — the symbols above the bound are there and the ones
below are not, and nothing on any screen says so. The map's whole claim
is that it shows reality. A silently partial file is the one failure
mode that claim cannot survive.

## Arms

1. **CLI ARM, cheapest, `[crate-index]`.** One clause on the `index`
   summary line and one on `--check`'s report, printed only when the
   count is non-zero — the same "visible only when it carries
   information" rule the optional stats fields already follow. Note that
   `tests/cli.rs` pins the summary text, so this is a test edit too.
2. **APP ARM, `[app-shell]`.** `IndexOutcome::Indexed` gains
   `skipped` and `depth_limited` beside `truncated`, which it already
   carries for exactly this reason — the budget's own "never silent"
   flag. Nothing new crosses IPC in kind.
3. **MAP ARM, `[app-map]`.** A file whose symbols are partial is drawn
   the same as one that is complete. This is the arm with real design
   content and it should not be bundled with the other two.

**Arm 1 and arm 2 are the same sentence in two places and should be
taken together or not at all**; arm 3 is a separate card.

Amnesty triage 2026-08-29 (triage seat): PARKED — live and correctly reasoned: depth_refused and depth_limited are written into graph.json and read by no CLI surface, no app payload and no gate — and skipped has had the identical silence since T-009, which is why it is one card. The severity argument is the good one: a skip is mechanical (the file could not be read), while a depth refusal is a file that WAS read, DID parse, and sits in the map with part of its content missing, which is the one failure mode the map's claim to show reality cannot survive. RESURFACES: the next crate-index dispatch for arm 1, which SHALL be taken together with arm 2 (app-shell) or not at all — they are the same sentence in two places. Arm 3 (the map drawing a partial file differently) has real design content and is a separate card.
