---
id: T-010
title: Indexer — Rust language support
feature: F-06
milestone: 4
priority: 3
size: M
status: planned
blocked_by: [T-009]
touches: [crate-index, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

REGISTRY DECISION REQUIRED BEFORE DISPATCH (triage 2026-08-16, from
the T-025 integrator's finding; re-verified at triage by enumerating
every `.rs` under app/src-tauri/ against every component's `paths:`).
FOUR Rust files are claimed by NO component and are invisible only
because the indexer is TS-only: `src/acl_pin.rs`, `src/index_cmd.rs`,
`src/bin/fake_agent.rs`, `tests/agent_runner.rs`. C-05 claims lib.rs,
main.rs and build.rs BY NAME; C-10 claims docs_watch.rs; C-14 claims
`src/agent/**`; C-07 claims the nputer-index crate. The moment this
task lands, the dogfood suite's zero-unclaimed-territory assertion
goes red and C-14's indexed footprint jumps from one TS file to ~3,200
lines of Rust. Settle the claims (ADR-004) BEFORE this builds, so the
regen CONFIRMS a decision instead of discovering a problem.

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
- WHEN the golden regen runs over this repo THE unmapped set SHALL be
  exactly the argued set recorded above — every `.rs` file under
  app/src-tauri/ either claimed by a component or explicitly declined
  in that component's prose — and all THREE live-registry fixtures
  SHALL be reconciled in the same change (docs/CONVENTIONS.md,
  "declaring a component moves three fixtures").

## Implementation notes

## Verdicts
