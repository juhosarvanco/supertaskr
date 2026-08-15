# ADR-015: Indexer in Rust; parsing and derivation in TypeScript

Date: 2026-08-15 · Status: accepted · Decided in: architect promotion
review of docs/design/map-technical-plan.md (which drafted the
opposite for derivation)

## Context
The draft plan computed the derived architecture model
(`load_architecture`) on the Rust side. But the built pattern is the
opposite, and it was chosen deliberately: T-003 established Rust as a
contained file shipper with parsing where TypeScript runs, and the
convention's one hardened frontmatter parser (@nputer/parser: ADR-009
discipline, status-aware requiredness, 78 tests) is TypeScript. A
second frontmatter parser in Rust would fork the format — the exact
drift disease this product treats.

## Options considered
Rust-side derivation (draft): one payload, "frontend stays a
renderer" — at the cost of duplicating format parsing. Chosen split
below.

## Decision
- `nputer-index` (Rust, tree-sitter, app/src-tauri/crates/, no tauri
  dependency) emits `graph.json` ONLY. Code parsing is its entire job.
- Component files are parsed by @nputer/parser (ComponentRecord
  module, node + pure entries).
- The intent⨝reality⨝tasks derivation (mapping, edge relations,
  status/provenance rollups, drift findings) is pure TypeScript in
  the app — unit-testable, DOM-free, the T-004 selector pattern.
- The future Node CLI (C-02, ADR-007) shells out to the crate's small
  `nputer-index` binary (ADR-003 spirit); `nputer index` stays a Node
  command wrapping it.

## Consequences
Single-parser discipline holds. The frontend remains a renderer over
pure functions — the functions are TS. The one new Tauri command is
zero-argument `index_repo()` (ADR-010/012 pattern). Cost: the derived
model is recomputed in the webview per snapshot, acceptable at map
scale (same budget family as the board's selectors).
