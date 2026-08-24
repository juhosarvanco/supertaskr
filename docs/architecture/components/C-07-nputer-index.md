---
id: C-07
name: nputer-index
layer: indexer
paths:                    # decided location (ADR-015); code arrives with T-009
  - app/src-tauri/crates/nputer-index/**
depends_on: []
decisions: [ADR-003, ADR-013, ADR-014, ADR-015]
status: auto
touch_slugs: [crate-index]
---
Rust crate + small binary (tree-sitter TS/JS/Rust): code in, committed
deterministic docs/architecture/graph.json out — the map's reality
layer. No tauri dependency; the future CLI shells out to the binary.
Emitting graph.json is its entire job (parsing and derivation live in
TypeScript).

**AND SINCE T-010 IT SEES ITSELF.** The "TS/JS/Rust" above was a promise
until T-010 registered the Rust extractor; `Lang::Rust` mapped to no
extension, so this component's own 25 files were declared territory the
map could not draw and C-07 stood as a D3 declared-only component with
zero files. Both end in the same commit: the crate indexes `.rs` on the
same walk as `.ts`, and the whole `app/src-tauri/` Rust tree — this
crate, the shell's Rust half, the agent runner — becomes reality-side
map content. Rust resolution is a MODULE TREE rather than the TS side's
filename candidates: cargo targets from `Cargo.toml`, `mod` declarations
(`#[path]` honoured) down to files, then `use` paths by longest module
prefix. Two silences are deliberate and named where they are made — no
`call`/`type_ref` candidates are emitted for Rust (ADR-014's size budget
governs: the committed graph rides the docs collector's 1 MiB per-file
cap), and items inside an inline `mod` or an `impl` block are not
extracted, the same way TS namespace and class members are not.
