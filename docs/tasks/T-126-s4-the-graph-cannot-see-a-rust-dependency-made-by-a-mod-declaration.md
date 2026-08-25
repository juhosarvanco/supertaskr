---
id: T-126-s4
title: The graph cannot see a Rust dependency made by a mod declaration and a path expression — C-05 now really depends on C-15 and the map gains no edge, no finding and no amber
status: suggested
suggested_by: executor claude-opus-5 @T-126
---

**A REAL COMPONENT DEPENDENCY LANDED AND THE MAP DID NOT MOVE.** T-126's
`lib.rs` (C-05) declares `pub mod dispatch;` and calls
`dispatch::lanes::read_lanes(root)` from a shipped `#[tauri::command]`.
That is a genuine C-05 → C-15 dependency: remove C-15 and the binary
stops compiling. `C-05-app.md`'s `depends_on` lists C-01, C-06, C-07,
C-08, C-09, C-10, C-11, C-12, C-13, C-14 and C-16 — **not C-15** — and
F-06's whole premise is that an undeclared observed edge shows up as
drift.

It does not show up at all.

## Measured two ways rather than reasoned

1. `cargo run -p nputer-index -- index --check --root ../..` at T-126's
   tip: committed **1886 edges**, fresh index **1886 edges**. Files move
   (`+0 −1 ~2`) and symbols move (1968 → 1971). **Edges do not move by
   one.**
2. A full regen in a throwaway detached worktree at the same tip: the set
   of graph edges mentioning `dispatch` is **byte-identical at 29
   entries** before and after, and `arch --root ../..` still reports
   `C-10 -> C-14` as the only undeclared edge, `edges=36`, `findings=4`
   (the fourth being the drill's own target dir, see `T-110-s4`).

## The mechanism

The indexer's Rust extraction records **`use` imports**. `join.rs` and
`lanes.rs` produce edges because they say
`use super::lanes::{LaneScan, WorktreeEntry, read_lanes};`. `lib.rs` says

    pub mod dispatch;
    ...
    scan: dispatch::lanes::read_lanes(root),

— a module DECLARATION plus a fully-qualified PATH EXPRESSION, and
neither is a `use`. So the strongest possible form of dependency in Rust,
the one that makes the module part of your crate, is the one form the
walk cannot see.

**The deleted `#[path]` shim was invisible for the same reason**, which
is why removing it cost no edge either: `#[path = "../src/dispatch/mod.rs"]
mod dispatch;` produced zero edges in the committed graph.

## Why this is worse than an undeclared edge

An undeclared edge is amber and gets ruled on. This is a dependency the
registry could not declare *observably* even if it wanted to: adding
`C-15` to C-05's `depends_on` would create a **declared-only** relation
with `observed=0`, which is its own drift class — so the honest edit and
the honest map disagree. That is the `T-033-s11` shape (two engines, one
registry) one level down: here it is ONE engine failing to observe
something real, and both the TypeScript derivation and `arch` inherit it
because they read the same graph.

## What to look at

`Lang::for_extension` / the Rust collector in
`app/src-tauri/crates/nputer-index/src/` — the same authority column
`docs/CONVENTIONS.md`'s FOUR WALKS table already names, which is that
table's design working again. Whether `mod` declarations and path
expressions SHOULD produce edges is a ruling: path expressions are
everywhere and could flood the graph, while `mod` declarations are few,
unambiguous and exactly the containment relation a component map wants.
**Starting with `mod` alone is the cheap half and it would have caught
this one.**

## Fence

`[crate-index]`, plus `[docs/architecture/components/]` if C-05's
`depends_on` is corrected in the same lane. Read it beside `T-033-s11`
and `T-010-s7`.
