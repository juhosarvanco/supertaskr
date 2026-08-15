---
id: T-001
title: Cargo project, plain-text store, `streak done`
feature: F-01
milestone: 1
priority: 1
size: M
status: planned
blocked_by: []
touches: [C-01, C-02, src/store.rs, src/main.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE task SHALL initialize the Rust binary crate `streak` (stdlib
  only, ADR-001) at the repo root — Cargo.toml, src/main.rs — so
  `cargo test` and `cargo build --release` run from a fresh clone.
- WHEN `streak done <habit>` runs THE system SHALL append one line
  `YYYY-MM-DD<TAB><habit>` (local date) to the store file, creating
  the file and its parent directory on first use.
- THE store path SHALL be `$HOME/.streak/log`, overridden by
  `$STREAK_FILE` when set (tests use the override; see
  ARCHITECTURE.md Interfaces).
- WHEN the same habit is already logged for today THE system SHALL
  write nothing, print `already done today: <habit>`, and exit 0
  (idempotent per habit per date).
- WHEN `streak done` runs against a 10,000-line store THE command
  SHALL complete within 50ms (release-profile integration test with a
  timed assertion; NORTH_STAR criterion 1).
- IF the habit name is empty or contains a TAB or newline THEN THE
  system SHALL exit 2 with a one-line stderr message and write
  nothing.
- IF the store cannot be created or written THEN THE system SHALL
  exit 1 with the OS error on stderr and never leave a partial line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
