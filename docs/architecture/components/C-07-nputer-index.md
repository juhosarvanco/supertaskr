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

**"EMITTING GRAPH.JSON IS ITS ENTIRE JOB (PARSING AND DERIVATION LIVE IN
TYPESCRIPT)" STOOD HERE UNTIL T-033 AND HAD BEEN FALSE SINCE T-014.**
That sentence and ADR-015 are the pair T-033's decision (3) exists to
reconcile — *"both cannot be literally true at once"* — and this half of
the pair is the false one, so it is corrected in place rather than left
to read as current (the T-010 precedent for a signpost the tree has
overtaken). WHAT THE BINARY ACTUALLY DOES, derived from its own command
surface rather than quoted: it WRITES (`index`), it GATES (`index
--check`, `index --watch`) and it READS (`arch`, `arch drift [--fail-on
undeclared|unmapped|any]`) — and that last pair is a **reality-side
join** computed in Rust: file→component mapping, observed component edges
including the package.path seam, the three relations, D1–D5. It is
deliberately narrow: no status/provenance rollups, no task join, and a
registry reader that REFUSES (exit 3, naming the file) rather than
guessing at anything it cannot read exactly.

**WHAT IS SETTLED, AND WHAT IS NOT.** ADR-015's dated addendum
(2026-08-17, T-014) already rules that ADR-015 stands — derivation is
TypeScript, and this binary's join is a reader that exists because a CLI
cannot call into the app's TS — and records that the two engines can
still disagree where `registry.rs::unquote` and @nputer/parser part
company on YAML escapes. What is NOT settled is the OWNERSHIP clause
T-033's decision (3) asks for: whether the crate formally owns the
reality-side join while TypeScript owns the intent⨝tasks half (arm a),
whether `arch` moves to the Node CLI once C-02 exists (arm b), or whether
both are kept and their agreement pinned (arm c, which is T-059). That
ruling is the architect's pen (ADR-004) and was NOT recorded at T-033's
dispatch, so the clause owed to
`docs/decisions/015-indexer-rust-derivation-ts.md` is routed as
`T-033-s4` and **T-059 stays alive** — it dissolves only under arm (b),
which nobody has chosen. Until the ruling is recorded, the two paragraphs
above are a description of what is built and not a decision about who
should own it.

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
