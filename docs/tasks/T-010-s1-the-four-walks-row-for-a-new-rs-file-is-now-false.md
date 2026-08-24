---
id: T-010-s1
title: THE FOUR WALKS says a new .rs is seen by CONTROL only, and T-010 makes that false
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

`docs/CONVENTIONS.md`'s FOUR WALKS bullet carries a signpost sentence
that T-010's merge falsifies word for word:

> A new `.rs` is seen by CONTROL ONLY — the indexer deliberately does not
> collect Rust (`Lang::Rust` maps to no extension).

Both halves are now wrong. `Lang::for_extension("rs")` returns
`Some(Lang::Rust)`, `IndexOptions::default().languages` is
`[Ts, Js, Rust]`, and the GRAPH row's "what it sees" column needs `.rs`
beside the six TS/JS extensions it already lists. The AUTHORITY column is
already right and needs nothing — it names
`Lang::for_extension` and `walk_root` in
`app/src-tauri/crates/nputer-index/src/{graph,walk}.rs`, which is exactly
where the change is. That is the bullet's own design working: the row went
stale and the authority did not.

**Fence: `[docs/CONVENTIONS.md]`.** T-010's fence is
`[crate-index, docs/architecture/components/]`, so this correction is
routed rather than made — the executor may not widen a fence from inside
the lane. It is a one-row edit and it should land with, or immediately
after, T-010's merge: until it does, the file that is the authority on
what each walk sees is wrong about one of them.

Note the second-order effect for whoever writes it: the GRAPH REGEN
bullet cites this row (*"No suffix rule can match the walk: see THE FOUR
WALKS above"*) and its argument is unaffected — `.nputerignore` still
excludes `docs/`, `tools/` and the indexer's fixture trees, so the
trigger is still deliberately wider than the walk. What changes is only
which extensions the walk admits.
