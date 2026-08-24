---
id: T-010-s6
title: Rust files enter the graph with symbols and import edges but no call/type_ref edges, so semantic zoom T2 is half-lit for them
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

T-010's Rust extractor deliberately emits **no `call` and no `type_ref`
candidates**. Its criteria ask for symbols, module-tree file edges, cargo
package nodes, `pub use` re-exports and `unresolved[]` — and nothing
else. The silence is named in `resolve/rust.rs`'s own header rather than
left to be discovered, and the reason is measured: `T-010-s3` records the
committed graph going to 89% of the emit budget on IMPORT edges alone.

**What that costs a reader, concretely.** T-013's semantic zoom draws T2
from `graph.json`: an expanded component shows its files, and the panel
shows their symbols and RESOLVED EDGES. For a TS file both halves are
populated. For a Rust file the symbol list is real — 1874 symbols total,
748 of them Rust — and the resolved-edge half is empty by construction.
Nothing in the UI says why, so it reads as "this file has no relations"
rather than "this indexer does not extract that for Rust".

Three arms, and the ordering matters because the cheapest one is not the
smallest:

1. **Say so where it shows.** The panel already knows a file's `lang`; a
   single line distinguishing "no edges" from "not extracted for this
   language" is honest and costs no graph bytes. This is the arm to take
   first.
2. **Extract them, gated by budget.** The TS gating rule ports directly:
   a bare name inside a module-level symbol's span binds to (a) a
   module-level symbol of this file or (b) a resolved `use`. The Rust
   catch is that `impl` blocks and inline `mod`s are NOT extracted as
   containers, so most Rust function bodies sit inside no extracted span
   and would produce no candidate at all — which means arm 2 is really
   "extract impl members first", a bigger change than it looks, and one
   that spends the headroom `T-010-s3` measures.
3. **Leave it and record it.** Also legitimate: the map's Rust story
   today is components, files, module structure and cross-crate
   dependencies, which is what the architecture lens is for. Call graphs
   are a different product.

**Fence: `[crate-index]`** for arm 2; arm 1 is `[app-map]`.
