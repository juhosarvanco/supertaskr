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
