---
id: T-010-s11
title: The nputer-index crate describes itself as a TS/JS indexer in two places and T-010 makes both stale
status: suggested
suggested_by: integrator claude-opus-5 @T-010-integrate
---

T-010's verifier recorded this as **"ONE IN-FENCE NIT, NOT BLOCKING"** —
*"`crates/nputer-index/Cargo.toml`'s own `description` still reads
'deterministic tree-sitter TS/JS indexer'. It is inside this fence and is
now stale by one word."* The count is one too low. Derived at the merge
`d64c673` with `grep -n 'tree-sitter' app/src-tauri/crates/nputer-index/Cargo.toml`:

    2:# Deterministic tree-sitter TS/JS indexer; NO tauri dependency (ADR-015).
   13:description = "nputer-index (C-07) … deterministic tree-sitter TS/JS indexer, no tauri dependency (ADR-013/014/015, F-06)"

**TWO sites, not one** — the file's own header comment and the published
`description` — and they are the same sentence written twice, which is
why fixing only the one a reader was pointed at leaves the file still
saying it. The crate collects `.rs` on the same walk as `.ts` since
T-010; `docs/ARCHITECTURE.md`'s C-07 row and
`docs/architecture/components/C-07-nputer-index.md` both already say
"TS/JS/Rust", so the manifest is now the only place in this repository
that still claims TS/JS only.

**Why the integrator did not just fix it.** It is a CODE file inside
`crate-index`, and the checkpoint ritual covers STATE, ROADMAP,
ARCHITECTURE, decisions, the card and the regenerated artifacts — editing
a verified lane's manifest at the checkpoint would put an unverified byte
into a merge that has a verdict against a named tip. It is a two-line
edit for whoever next holds `[crate-index]`; T-015, T-032 and T-059 all
carry that slug.

**Not blocking, and it moves no gate**: `Cargo.toml` is not a walked
extension, so no graph, no fixture and no suite reads either string.
