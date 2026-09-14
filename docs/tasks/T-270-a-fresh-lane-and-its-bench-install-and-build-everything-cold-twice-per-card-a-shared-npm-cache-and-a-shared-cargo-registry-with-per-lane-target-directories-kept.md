---
id: T-270
title: "A fresh lane and its bench install and build everything cold, twice per card — a shared npm cache and a shared cargo registry, with per-lane target directories kept, so a seat starts in seconds rather than minutes"
feature: F-04
milestone: 4
size: S
priority: 14
status: planned
suggested_by: "docs/rooms/loop-efficiency.md item 9 (2026-09-02), ruled 2026-09-09 by @human (\"yes to all four\")"
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/conventions/app-and-ui.md, docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Every lane runs three `npm ci`, a parser build, an app build and a cold
cargo build; its bench runs the same again. That is minutes of every
seat's wall clock spent on bytes the machine already holds. The cargo
TARGET directory must stay per-lane (T-013-s7: a shared target bakes a
drill's manifest into its siblings), but the cargo REGISTRY and the npm
CACHE are read-only inputs that every checkout can share.

## Acceptance criteria

- WHEN the arm cuts a lane or a bench THE brief's setup row SHALL name
  a shared npm cache (`npm_config_cache`) and a shared cargo registry
  (`CARGO_HOME`'s registry, with `CARGO_TARGET_DIR` per lane), spelled
  once in CONVENTIONS' lane section with the measurement that set them,
  and `npm ci` SHALL run against the cache.
- WHEN a lane is cut twice on one host THE second setup SHALL be
  measured faster than the first by the brief's own stamped timings
  (before and after, on this host, with refs), and the four suites SHALL
  be green in both.
- IF the shared registry or cache is unreadable THEN setup SHALL fall
  back to the cold path and say so — never fail on the cache.
- The per-lane target directory SHALL stay per-lane (a body pins that
  two lanes' `CARGO_TARGET_DIR` differ), and CI SHALL be unaffected
  (the workflow keeps its own caches; the parity spec holds).

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
