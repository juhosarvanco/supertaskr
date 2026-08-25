---
id: T-127-s3
title: The file import graph is not a DAG once the claim is made global — one SCC of four files lives inside C-07, it is idiomatic Rust rather than a defect, and no standing sentence says which
status: suggested
suggested_by: executor claude-opus-5 @T-127
---

T-127's card states, twice and in bold, that **"The file import graph is
a DAG on BOTH refs — zero cycles over 51 files and 133 edges"**. That
derivation walked `app/src/**` only, and its own LIMITS paragraph says
so. T-127's criterion 2 asked for the claim to be **MADE GLOBAL**, and
made global it is false.

## Derived at `afe23c1` over the committed graph

Tarjan over every indexed file, both ways:

| edge kinds | file nodes | file edges | SCCs of size > 1 |
|---|---|---|---|
| `import` only | 166 | 379 | **1** |
| `import` + `call` + `type_ref` | 166 | 897 | **1**, the same one |

The SCC, in both:

    app/src-tauri/crates/nputer-index/src/resolve/mod.rs
    app/src-tauri/crates/nputer-index/src/resolve/rust.rs
    app/src-tauri/crates/nputer-index/src/resolve/ts.rs
    app/src-tauri/crates/nputer-index/src/resolve/tsconfig.rs

Closed by `use super::{parent_dir_of, read_contained}` in `rust.rs` and
`tsconfig.rs`, against `mod.rs`'s `pub mod rust; pub mod ts; pub mod
tsconfig;` — a child using a helper its parent module owns.

## What it is NOT

**It is not a design defect and it must not be routed as one.** In Rust a
`super::` use is not a compilation cycle: `mod.rs` and its children are
one module tree in one crate, and rustc resolves it without difficulty.
It is also entirely inside **C-07**, so it produces no component cycle
and no drift: `nputer-index arch --root .` reports `C-07` with
`drift=-`.

**And it does not weaken T-127's own answer.** The declared cycle
`C-08 -> C-09 -> C-08` was checked against its OWN thirteen files —
C-08's ten and C-09's three — and none of them takes part in any SCC.
The boundary evidence stands.

## What is worth fixing

The SENTENCE, not the code. Three places now assert or imply a
repository-wide file-level DAG on the strength of a walk that saw
`app/src/**` and 51 of the tree's 179 files: T-127's card, `T-033-s10`,
and any checkpoint that repeats them. A DAG claim scoped to one directory
should say the directory, and the global claim should say TypeScript —
`app/src/**` really is acyclic at this ref, and that is the true and
useful version.

**Whether Rust parent/child `use` edges should be excluded from a
file-level cycle report at all is the real question**, and it belongs
beside `T-126-s4`: the same walk that cannot SEE a `mod` declaration
does record the `super::` use it usually comes with, so the graph's Rust
view is skewed in both directions at once.

## Fence

`[crate-index]` if a cycle report is added to `nputer-index`;
`[docs/tasks/]` alone if the answer is the corrected sentence. Read
beside `T-126-s4` and `T-010-s6`.
