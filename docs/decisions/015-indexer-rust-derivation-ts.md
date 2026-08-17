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

## Addendum (2026-08-17, T-014) — the binary carries a narrow reality-side reader, and it can disagree

T-014 shipped `nputer-index arch` and `arch drift`, which its criteria
required. That places a **second reality-side join in Rust** inside a
decision whose whole point was that derivation lives in TypeScript.
Recorded rather than left implicit:

**What was built, and how narrowly.** The Rust side is a READER, not a
derivation engine: no rollups, no task join, and a registry reader that
refuses rather than guesses. Its output was differentially harnessed
against the TypeScript engine over identical inputs and reproduced
**252 fact lines byte-identical** on the live registry — all 92
file→component assignments, 28 relation rows in order, 100 observed
file edges with annotations, 9 finding ids, 22 D1 edges. Eight of ten
hostile fixtures matched line for line.

**And it can still disagree.** T-014's verifier found a real divergence
in the tenth: `registry.rs::unquote` strips quotes without processing
YAML escapes, while `@nputer/parser` processes them. A component whose
`paths:` carries an escape — `"app/emoji-\U0001F600/**"` — makes BOTH
engines exit 0 and disagree about which component owns a file, and
`arch drift --fail-on unmapped` then fails a repo the TypeScript engine
maps cleanly with zero findings. Two siblings (a duplicate `paths:`
key; a tab-indented item) invert the polarity, with TypeScript the
loud one. Latent today: no live component file carries a trigger.

**The ruling.** ADR-015 stands — derivation is TypeScript, and the
binary's join is a reader that exists because a CLI cannot call into
the app's TS. But the decision's implicit promise, that one engine
means one answer, is now false in a measurable way, and the honest
record says so. The mitigation is T-014-s6's three-refusal close:
refuse an escape, refuse a duplicate key, refuse a tab — restoring
"either it reads the same facts or it stops the gate" without
implementing YAML.

**The trigger for revisiting this decision properly**: a third join,
or the first live divergence, or a consumer that needs the Rust side
to answer a question the reader deliberately does not (rollups, the
task join). Any of those means the two-engine question is no longer
narrow and wants its own ADR rather than an addendum.
