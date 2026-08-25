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

**AND THE OWNERSHIP IS DECIDED — ARM (a), T-033 decision (3),
2026-08-25.** **This crate OWNS the reality-side join**; **TypeScript
owns the intent ⨝ tasks half** — status and provenance rollups, the task
join, and everything the map renders on top.
`docs/decisions/015-indexer-rust-derivation-ts.md` now carries the same
clause in its Decision section plus a dated addendum saying why, so the
registry and the ADR are one sentence instead of two incompatible ones,
which is what this half of the card existed to fix.

Arm (b) — move `arch` to the Node CLI — was **refused**: it is the purest
reading of ADR-015 and it costs the capability, since C-02 does not exist
and the engine is not in a shareable package, so `nputer arch` could not
exist at all in the meantime. Arm (c) is **retained rather than
replaced**: pinning the two engines' agreement is **`T-059`**, which
therefore does **NOT** dissolve and stays `blocked_by: [T-033]`.
ADR-015's 2026-08-17 addendum still governs what this reader may do — it
REFUSES rather than guesses, and the three latent divergence classes it
names are unchanged and still latent.

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
