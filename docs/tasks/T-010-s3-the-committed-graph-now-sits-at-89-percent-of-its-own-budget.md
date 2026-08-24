---
id: T-010-s3
title: The committed graph goes to 89% of the emit budget in one merge, and nothing reports the headroom
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

**This is the largest graph movement this repository has made, and the
number worth keeping is the HEADROOM, not the size.** Measured at T-010's
tip `7a88565`:

| | base `d46f71f` | T-010 | limit |
|---|---|---|---|
| `docs/architecture/graph.json` | 648863 | **890843** | — |
| against `IndexOptions::max_graph_bytes` (1 000 000) | 64.9% | **89.1%** | 109157 bytes left |
| against the docs collector's 1 MiB per-file cap | 61.9% | **84.9%** | 157733 bytes left |

**IT IS NOT A BLOCKING DISCOVERY AND THE ARGUMENT IS MEASURED RATHER THAN
ASSERTED**, which is why this is a suggestion and not a room. The budget
is a designed guard: `emit::apply_budget` drops symbol arrays greedily
until the document fits, never files and never import edges, and flags
`stats.truncated_symbols` / `truncated_files` so a truncation can never be
silent. Its FLOOR — every symbol array emptied and the dependent `s:`
edges dropped — is **186883 bytes** on this tree, so `max_graph_bytes`
can always be met and the 1 MiB cap the map data rides cannot be crossed
while the budget is 1 000 000. Nothing truncates today: `truncated_symbols`
and `truncated_files` are both absent from the regenerated graph.

**WHAT IS ACTUALLY MISSING IS A REPORT.** No suite, gate or checkpoint
prints the headroom, so the first time anyone learns it ran out will be
the day symbol panels go empty in the map with `truncated_files` set and
nothing pointing at the cause. Three arms, cheapest first:

1. `index --check` already prints `<bytes> bytes · <files> files ·
   <symbols> symbols · <edges> edges` on both sides. Add the percentage
   of `max_graph_bytes` to that line — one format string, and the
   integrator reads it at every checkpoint because the gate is already
   run there by hand.
2. A test that FAILS when a fresh index of this repo crosses a stated
   fraction of the budget (say 95%), so the tree reds before the emitter
   starts truncating. Note the trap: parametrising the assertion by
   `max_graph_bytes` makes it move with the thing it checks — CONVENTIONS'
   "a test parametrised by the constant it checks cannot pin that
   constant" applies exactly.
3. Raise nothing. `max_graph_bytes` is deliberately BELOW the collector's
   1 MiB so a graph landing at the cap is not one edit from vanishing out
   of the snapshot; widening it spends the safety margin, and the real
   lever is what gets emitted (see `T-010-s6`).

Whoever takes this should re-derive both figures at their own ref: the
graph grows with every `.ts` and `.rs` file this repository adds, and
T-110's dispatch crate is already on its way in.

**Fence: `[crate-index]`** for arms 1 and 2.
