---
id: T-135-s2
title: A distinct `mod` edge kind would need GRAPH_EDGE_KINDS widened FIRST — the vocabulary is closed, the reader skips an unknown kind while emitting a parse issue, and `arch` filters on `"import"`
status: suggested
suggested_by: executor claude-opus-5 @T-135
touches: [app-map, crate-index]
---

**Filed so the next hand does not discover this at a merge.**

T-135 emits a Rust `mod` declaration as an `import` edge rather than as a
`kind: "mod"` of its own. That was not a preference; it is the ONLY
spelling available inside `[crate-index]`, and the two reasons are both in
files a `crate-index` lane may not write:

- `app/src/lib/architecture/graph.ts:23` declares
  `GRAPH_EDGE_KINDS = ["import", "call", "type_ref"] as const` — a
  **closed** vocabulary. Line ~346 skips any edge outside it **and emits a
  `graph-entry` issue** while doing so, so a `kind: "mod"` would be
  dropped by the map pane and would surface one new entry in the app's
  error strip **per edge** (27 of them on this repository today).
- `app/src-tauri/crates/nputer-index/src/arch/mod.rs` filters
  `edge.kind != "import"` in `join`, so a new kind is invisible to `arch`,
  `arch drift` and D1–D5 — which would have hidden the `C-05 -> C-15`
  drift the fix exists to reveal. `app/src/lib/architecture/derive.ts`
  filters the same way, twice.

**So the order is: widen the vocabulary in `app-map` FIRST, teach both
filters what to do with the new kind, and only then split the kind in
`crate-index`.** Any other order ships a graph the app reports as
defective.

**WHAT IT WOULD BUY, honestly small.** Provenance: telling a `mod`
dependency from a `use` dependency in the map and in drift output. T-135
deliberately carried NO provenance at all — not a kind, not an optional
field — because the alternative it chose has a property worth more than
provenance: with the `mod` occurrence contributing no `symbols` entry and
no `reexport` claim, **the 17 pairs that already carried a `use` edge are
emitted BYTE-IDENTICALLY**, so the entire graph delta of the fix is 27
added edge objects, 0 removed and 0 changed in place (measured at
`5547f02`). An additive optional field would have perturbed those 17.

**Do not take this without a caller.** Nothing in the tree asks the
question today.
