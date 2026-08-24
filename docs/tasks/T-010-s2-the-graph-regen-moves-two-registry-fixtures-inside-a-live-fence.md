---
id: T-010-s2
title: T-010's graph regen moves two registry fixtures that sit inside T-123's live app-shell fence
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

T-010's criterion 5 asks that *"all THREE live-registry fixtures SHALL be
reconciled in the same change"*. Two of the three cannot be, and this
file carries the exact derived set so the integrator can apply it at the
checkpoint without re-deriving it.

**WHY IT IS ROUTED, NOT WIDENED.** T-010's fence is
`[crate-index, docs/architecture/components/]`. The three fixtures are
`lib/parser/test/smoke.test.ts` (`lib-parser`),
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` (both `app-shell`, via C-05's
`app/test/**` glob). **T-123 holds `[app-shell, app-agent]` live**, so
widening into `app/test/**` would put two live lanes on one fence — the
exact collision a fence exists to prevent, and a different thing from
STATE's "widen when the fence makes THIS CARD'S OWN criterion
unbuildable".

**AND THE FIXTURES DO NOT MOVE UNTIL THE GRAPH DOES — MEASURED, NOT
ASSUMED.** Both app fixtures read the COMMITTED
`docs/architecture/graph.json`, and T-010 deliberately does not
regenerate it (GRAPH REGEN puts the regen at the CHECKPOINT, and the
reason it gives is exactly this one: the checkpoint edits indexed fixture
files, so a graph regenerated earlier is stale again). With the registry
settlement in and the base graph committed, `app npm test` is
**940/940 at exit 0** on T-010's branch. So the reconciliation is one
job at one moment: regenerate, then fix the two fixtures, in the
checkpoint commit.

**`lib/parser/test/smoke.test.ts` IS NOT OWED, and that is derived.** It
asserts the component ID LIST (`C-01`…`C-15`) and C-06's full record.
T-010 adds no component id and does not touch C-06; it adds `paths:`
entries and prose to C-05, C-07 and C-14. `npx vitest run` from
lib/parser is **263/263 at exit 0** on the branch. CONVENTIONS'
*"declaring a component moves three fixtures"* is about DECLARING a new
component; widening an existing one's `paths:` moves the two
graph-derived fixtures only.

**THE DERIVED SET, measured at T-010's tip `7a88565` against main
`cd79f97`.** Re-derive rather than quote — every figure below is a
function of the tree at the moment of the regen, and T-110 and T-123 may
land Rust of their own first (see `T-010-s5`).

`docs/architecture/graph.json`: 648863 → **890843 bytes**, 126 → **172
files**, 1126 → **1874 symbols**, 1712 → **1842 edges**, 17 → **24
packages**, `languages` `["ts"]` → `["rust", "ts"]`. `unresolved` stays
at 1 entry (the TS `./index.css` asset).

`app/test/architecture-dogfood.test.ts`:

- `derived.fileComponent.size` **126 → 172**; `derived.unmappedFiles`
  stays `[]` and the UNMAPPED node stays gone — the registry settlement
  in T-010 is what keeps that true, and `arch drift` reports
  `unmapped=0`.
- the per-component count array becomes
  `C-05 65` (+6: `lib.rs`, `main.rs`, `build.rs`, `acl_pin.rs`,
  `churn.rs`, `index_cmd.rs`), `C-06 25`, **`C-07 32` (new row — the
  component had no files at all before)**, `C-08 10`, `C-09 3`,
  `C-10 3` (+`docs_watch.rs`), `C-12 18`, `C-13 8`,
  `C-14 8` (+5 under `src/agent/**`, +`src/bin/fake_agent.rs`,
  +`tests/agent_runner.rs`). 65+25+32+10+3+3+18+8+8 = 172.
- **the title and body of "THE FINDINGS: ten undeclared dependencies,
  four declared-only components, no unclaimed territory" both move**:
  eleven undeclared, **three** declared-only. `D3:C-07` is GONE — the
  component that was declared-only because its whole implementation was
  Rust now has 32 files — and a **new `D1:C-05->C-07`** appears with one
  file edge, `app/src-tauri/src/index_cmd.rs -> app/src-tauri/crates/
  nputer-index/src/lib.rs`. C-01, C-11 and C-15 keep their D3.
- `D1:C-05->C-14` goes **7 → 8 file edges**; the new one is
  `app/src-tauri/src/churn.rs -> app/src-tauri/src/agent/runner.rs`
  (T-013's `run_git` calling into the shared resolved-binary gate), and
  `app/src-tauri/src/lib.rs -> app/src-tauri/src/agent/mod.rs` is now
  observable where it was not. Every other D1 list is byte-unchanged.

`app/test/map-dogfood-render.test.tsx`: the node count stays **12** (no
component is added or removed) and the per-node drift counts follow the
findings above — C-05 gains the C-07 ring. `map-edge` and
`map-index-hint` figures are derived from the same graph and must be
re-read, not copied.

**Both files carry the standing warning in their own comments: derive
each row from the added-file list BEFORE running the suite, never off the
failure output**, and note that the size assertion sits ABOVE the count
array, so vitest never reaches the array while the size is red.
