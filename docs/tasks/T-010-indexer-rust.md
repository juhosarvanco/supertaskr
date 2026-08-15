---
id: T-010
title: Indexer — Rust language support
feature: F-06
milestone: 2
priority: 3
size: M
status: planned
blocked_by: [T-009]
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN run on a Cargo workspace THE indexer SHALL build the module
  tree from crate roots ([lib]/[[bin]], src/lib.rs, src/main.rs,
  mod declarations incl. #[path]) and resolve use paths (crate::,
  super::, self::, workspace crate names) to file edges.
- THE indexer SHALL emit Rust symbols (fn, struct, enum, trait,
  impl, mod, macro) with export flags and ranges; external crates
  SHALL appear as cargo package nodes; pub use re-exports SHALL be
  recorded as import edges with reexport: true.
- IF a use path cannot be resolved THEN THE indexer SHALL record it
  in unresolved[] with a reason and continue.
- Golden fixture rust-workspace SHALL pass; determinism property
  SHALL hold with Rust files in the tree; indexing this repo's
  app/src-tauri SHALL complete within the T-009 budgets.

## Implementation notes

## Verdicts
