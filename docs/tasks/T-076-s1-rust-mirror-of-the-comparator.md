---
id: T-076-s1
title: The Rust mirror of compareComponentIds is now wrong in a different way than the original
status: parked
suggested_by: executor claude-opus-5 @T-076
---

`app/src-tauri/crates/nputer-index/src/arch/registry.rs:75-90` declares
itself a mirror: "Numeric-aware component id order — `C-09` before
`C-100`. Mirrors @nputer/parser's `compareComponentIds`
(lib/parser/src/component.ts), which is what decides first-match-wins in
the mapping." Its `numeric_id` parses the digits into a `u64` and
returns `None` when the parse fails, so from 20 digits up it falls back
to whole-string comparison, while the TypeScript side used `Number`:
exact to 15 digits, approximate to ~309, and `NaN` beyond that. The two
have therefore disagreed above 15 digits since T-008, in a range neither
gate has ever exercised.

T-076 did not create the divergence and did not close it — the fence was
`lib/parser/**`. What it changed is the SHAPE: `compareComponentIds` now
compares digit runs textually and is exact at every length, so the
mirror is no longer two implementations wrong in different ways, it is
one right and one that silently gives up at `u64::MAX`. Note that giving
up is the SAFE failure — Rust's fallback is total, where the old
TypeScript returned `NaN` — so this is a correctness gap, never a
crash-class one, and `compare_component_ids` orders the live registry
(C-01…C-14) identically to the parser today.

Whoever takes it owns three questions: whether the mirror should carry
the same digit-run rule (`u64` → a textual compare on `&str`, a few
lines and no dependency), whether the doc comment should stop claiming
to mirror a function it does not, and whether a shared pin belongs
somewhere — the two sides are compared by nothing, and the only reason
this was noticed is that a card went looking at the comparator.
`registry.rs:368` and `:390` are the existing Rust order pins and both
use two-digit ids.

**PARKED at the fifth triage (2026-08-20).** Unpark when T-076-s4's promoted card lands a shared pin, or when any C- id exceeds 15 digits. Verified: the live registry is C-01..C-14, so the divergence is unreachable today.
