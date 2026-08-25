---
id: T-033-s8
title: C-15 claims tests/dispatch_lanes.rs — a registry settlement T-033's rulings could not have covered, because the file did not exist when they were made
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

T-033 drains this repository's **first and so far only D2 finding** by
adding one path to C-15: `app/src-tauri/tests/dispatch_lanes.rs`. That
settlement is the lane's, not the architect's, and this file says so.

## WHY IT WAS NOT RULED

T-033's THREE RULINGS are dated at main **`dce93b0`** (2026-08-25
04:18:06). T-110 merged at **`1223543`** (11:38:28) — **seven hours and
twenty minutes later**. `git merge-base --is-ancestor dce93b0 1223543`
exits 0. So when the rulings were written:

- `app/src-tauri/tests/dispatch_lanes.rs` did not exist on main, and
  neither did `src/dispatch/**`'s five source files;
- **C-15 had ZERO indexed files and carried a D3**, which is why decision
  (2) names it as the reason `non_code` must never be inferred;
- there was no D2 in this repository's history at all.

By the time this lane ran, C-15 had five files, its D3 had cleared on its
own, and the shim was unclaimed territory. **Both C-15 sentences in the
ruling are therefore stale, and neither is wrong about anything that
mattered** — the "opt-in, never inferred" rule survives its example
evaporating, and `T-033-s9` carries what that costs.

## THE ARGUMENT FOR THE CLAIM, WHICH IS PRECEDENT AND NOT INVENTION

`dispatch_lanes.rs` is a two-line `#[path]` shim, and its own header says
what it is for: Rust compiles no file no module declares, so `cargo test`
cannot reach `src/dispatch/**` at all without it. T-110's verifier ruled
its placement legitimate, and T-110 could not claim it — `[app-dispatch]`
is C-15's `paths:`, and widening the registry from inside a lane is the
one repair an executor may never make.

**T-010 settled exactly this shape by name**, twice: `src/bin/fake_agent
.rs` and `tests/agent_runner.rs` went to C-14 on the rule *"a component's
test double and its suite belong to the component they exercise"*, the
same rule that puts `app/test/**` under C-05. `dispatch_lanes.rs` is C-15's
suite entry point and belongs to no other component.

## WHAT TO DO WITH IT

Confirm or reverse — both are one line in `C-15-dispatch.md`. **Reversing
costs more than it looks**: the D2 returns, `unmappedFiles` regains a
member, the unmapped bucket renders again, and the card's *"exactly the
honest not-yet-built set"* criterion stops being met, so something else
must own the file. `T-110-s9` is the finding that first named it and
should be triaged in the same breath — it predates this settlement and
proposes the same fix among others.
