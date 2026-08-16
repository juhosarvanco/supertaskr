# Conventions
<!-- GENUINE gotchas only — things a competent agent cannot infer from the
     code. No style rulebooks, no "use descriptive names". If a rule stops
     earning its place, delete it. Audit this file every milestone. -->

## Build & test
- Toolchain: current stable Rust, edition 2024; no MSRV promise in v1
  (added at cold-start test — a fresh executor could not infer it).
- `cargo build --release` — the binary ships from target/release/streak.
- `cargo test` — unit + integration; the verifier runs this verbatim.
- `cargo clippy -- -D warnings` — lint gate.

## Gotchas
- v1 is stdlib-only (ADR-001): adding a crate — even for dates — is a
  decision, not a convenience. Open a room first.
- The store is ONE hand-editable plain-text file (NORTH_STAR hard
  constraint [?]): any code touching it must survive lines a human
  mangled by hand.
