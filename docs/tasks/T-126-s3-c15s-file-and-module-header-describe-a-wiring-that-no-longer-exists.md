---
id: T-126-s3
title: C-15's component file names a deleted path and its module header says lib.rs does not declare it — three stale sentences and one dangling glob, all created by T-126 landing
status: suggested
suggested_by: executor claude-opus-5 @T-126
---

T-126 declares `pub mod dispatch;` in `lib.rs`, registers
`dispatch_lanes`, and deletes `app/src-tauri/tests/dispatch_lanes.rs`.
**Four written statements about C-15 became false in that commit**, none
of them reachable from `[app-shell]`.

## 1. `paths:` names a file that no longer exists

`docs/architecture/components/C-15-dispatch.md` carries

    - app/src-tauri/tests/dispatch_lanes.rs   # T-033 settlement, see below

and the file is gone. The glob now matches nothing. **Nothing reds** —
measured at T-126's tip, `arch --root ../..` over the regenerated graph
reports `unmapped=0` and the same three findings, because a declared path
matching no file produces no finding in either engine. That is worth
recording as much as the edit is: an intent file may name a deleted path
indefinitely and no gate in this repository will say so.

The whole disclosed paragraph beginning **"`tests/dispatch_lanes.rs` IS
CLAIMED HERE"** goes with it — it argues for claiming a file that no
longer exists — and `T-033-s8`, which asks the architect to confirm or
reverse that claim, is **discharged by removal rather than by ruling**.

## 2. The module header still says the module is unwired

`app/src-tauri/src/dispatch/mod.rs` says, under **"WHAT THIS MODULE IS
NOT WIRED TO, AND WHY"**: *"No `#[tauri::command]` registers it and
`lib.rs` does not declare it"*, and closes with *"until `lib.rs` declares
this module there is no caller to be ergonomic for"*. Both are now false.
The FENCE ARGUMENT in that paragraph is still correct and worth keeping —
it explains why T-110 routed rather than widened — but it wants a past
tense and a pointer to T-126.

## 3. `T-110-s9`'s EDIT ONE is still live

C-15's opening paragraph still says *"the TS half mirrors the typed lane
list and joins it against the board"*. It stopped joining at T-110's
rebuild. `T-110-s9` recorded this and it has never been taken; its EDIT
TWO was discharged by T-033 and its EDIT ONE was not. **A finding half
discharged reads as discharged**, which is how this survived a merge and
a checkpoint.

## Why T-126 did not take any of it

`app/src-tauri/src/dispatch/**` is C-15's `app-dispatch` and
`docs/architecture/components/` is its own slug. T-126's `touches:` is
`[app-shell]`. Editing shipped Rust or a registry file from inside this
lane is the one repair `method/roles/executor.md` says an executor may
never make. (The shim DELETION is the disclosed exception, and it is
`T-126-s5`.)

## Fence

`[app-dispatch, docs/architecture/components/]` — one lane takes all
three, and it should be the same lane that takes `T-110-s9`, because item
3 IS that finding. Item 1 is a `paths:` change, so T-024's three-fixture
rule fires: `lib/parser/test/smoke.test.ts`,
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` reconcile together, changed and
never loosened.
