---
id: T-010-s7
title: ARCHITECTURE asserts four times that languages ["ts"] hides app/src-tauri/src/agent/**, and T-010 makes all four false
status: rejected
suggested_by: executor claude-opus-5 @T-010
---

`docs/ARCHITECTURE.md` carries the same claim in four places, each one
written as the reason a merge moved no graph:

- C-14's own paragraph — *"None of this is visible on the map —
  `languages: ["ts"]` still hides `app/src-tauri/src/agent/**`, so C-14
  renders as its one TS file — which is the sharpest live argument for
  T-010 the registry has produced"*;
- T-043's — *"the graph is byte-identical because `languages: ["ts"]`
  still hides `app/src-tauri/src/agent/**`"*;
- T-069's — the same sentence again;
- T-113's — *"the graph is byte-identical because `languages: ["ts"]`
  still hides `app/src-tauri/src/agent/**` — the T-043/T-069 shape, and
  the fourth standing argument for T-010"*.

All four are true AS WRITTEN, at the merges they describe, and this is
the T-085 retraction shape rather than a defect: the reasoning is what a
later reader needs and only the tense is wrong. They should be corrected
IN PLACE with a dated note (T-101's precedent for T-081's paragraph),
not deleted. C-14 now carries **8 mapped files** where it carried one:
five under `src/agent/**` plus `src/bin/fake_agent.rs` and
`tests/agent_runner.rs`, which T-010's registry settlement moved to it.

Two more sentences in the same file need the same treatment:

- the C-07 row's status reads *"Rust language extraction T-010 still open
  — milestone 4"*, and C-07's own component file has been updated by
  T-010; ARCHITECTURE's row has not.
- the Map-data bullet's churn paragraph says attribution *"falls back to
  the declared globs for paths the indexer never walked (never Rust,
  never markdown: THE FOUR WALKS), because a map that reported a Rust
  crate as permanently cold would be lying about the busiest component in
  this repository."* The MARKDOWN half still holds; the RUST half does
  not, and the fallback it justifies is now unreachable for `.rs` — which
  means the busiest component in this repository is about to get real
  churn attribution for the first time. That is good news and it should
  be recorded as such rather than left as a stale parenthesis.

**Fence: `[docs/ARCHITECTURE.md]`.** T-010's fence is
`[crate-index, docs/architecture/components/]` — the COMPONENT files, not
the architecture document — so this is routed rather than made.
See `T-010-s1` for the same problem in `docs/CONVENTIONS.md`.

Amnesty triage 2026-08-29 (triage seat): REJECTED — the needle is gone. All four sentences this card names lived in docs/ARCHITECTURE.md's per-merge chronicle, which phase 6 of ADR-019 (925a814) cut from 133,682 bytes to 8,525; command grep -n 'languages: \["ts"\]|still hides' over ARCHITECTURE.md and CONVENTIONS.md returns nothing at this base. The two extra sentences it routed went with the same compaction — ARCHITECTURE's C-07 row now reads "TS/JS/Rust" and the churn paragraph it quotes no longer exists. The chronicle is permanently readable at git show a6491e6:docs/ARCHITECTURE.md, where the sentences are true of the merges they describe, which is what the card asked for.
