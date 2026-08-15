---
id: T-009-s3
title: Advisory audit lane for the exact-pinned indexer crate tree
status: suggested
suggested_by: verifier claude-fable-5 @T-009-verify
---

T-009's supply-chain review is binding AT the six exact `=` pins
(Cargo.lock checksums verified against crates.io; grammar/blake3 build
scripts read at these versions). Exact pins cut both ways: security
fixes do NOT float in, and nothing re-checks the tree as advisories
land. Suggest a `cargo audit` (or cargo-deny advisories) step over
app/src-tauri/Cargo.lock in the CI lane T-020 builds, so a RUSTSEC
advisory against tree-sitter/cc/blake3/ignore/jsonc-parser becomes a
visible failure prompting a deliberate re-pin + re-review (the
stop-and-consult gate in the crate's Cargo.toml header) instead of
silence.
