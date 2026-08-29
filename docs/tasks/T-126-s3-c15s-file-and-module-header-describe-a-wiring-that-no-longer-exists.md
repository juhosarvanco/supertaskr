---
id: T-126-s3
title: C-15's component file names a deleted path and its module header says lib.rs does not declare it — three stale sentences and one dangling glob, all created by T-126 landing
status: parked
suggested_by: executor claude-opus-5 @T-126
---

Absorbs: T-149-s1 (Amnesty triage 2026-08-29 (triage seat)) — the same file's same field from the other direction: C-05's depends_on carries C-09 with observed=0 after T-149 routed all three of its file edges to the component they exercise, so a planned row now asserts an intent that was never there — the shell never meant to import the drawer, it meant to import the board, and both hops of C-05 -> C-08 -> C-09 are declared and observed. The precedent is exact and already in this registry: C-12 dropped C-05 for the identical reason at T-033.

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

## ITEM 4, FILED BY T-135: `C-05`'s `depends_on:` DOES NOT DECLARE C-15, AND `arch drift` CAN NOW SEE IT

**T-135 Half A made `mod` declarations carry graph edges, and the very
first thing the fix found is a fourth false statement about C-15 — this
one in `C-05-app.md` rather than in C-15's own file.**

Measured at `5547f02` with the fix applied, `arch drift --root ../..`,
exit **0** read unpiped:

    finding  D1  D1:C-05->C-15  C-05 -> C-15  file_edges=1
      file-edge  app/src-tauri/src/lib.rs -> app/src-tauri/src/dispatch/mod.rs

and `arch` moves `edges=36 -> 37`, `findings=3 -> 4`,
`drift_components=3 -> 4`, with `C-05` going `drift=- -> drift=D1` and
`observed_deps=9 -> 10`.

**THE FIX DOES NOT CREATE THIS DRIFT. IT REVEALS DRIFT THAT HAS BEEN REAL
AND INVISIBLE SINCE T-126** — `lib.rs` has declared `pub mod dispatch;`
since that merge, and no gate could see it because a `mod` declaration
produced no edge at all (`T-126-s4`).

**The one-line repair is `depends_on:` in
`docs/architecture/components/C-05-app.md`**, which is this card's
existing fence and not T-135's (`[crate-index]`). Take it with items 1-3.

**AND IT CANNOT BE TAKEN ALONE.** `app/test/architecture-dogfood.test.ts`
pins `derived.findings` and the whole relation table as exact literals, so
the row moves either way: with the declaration it becomes a
**confirmed** `C-05 -> C-15` row, without it a **fifth D1**. Whoever takes
this reconciles that suite in the same commit — changed, never loosened.

Absorbs (eleventh triage, 2026-08-26): T-110-s9 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.

Amnesty triage 2026-08-29 (triage seat): PARKED — ITEM 1 IS DISCHARGED — C-15's paths: no longer names the deleted tests/dispatch_lanes.rs (removed in the eleventh triage's cleanup), and the component file now carries the settlement's obituary instead. Items 2 and 3 are live at this base: dispatch/mod.rs:26 still says "No #[tauri::command] registers it and lib.rs does not declare it", and C-15's opening paragraph still says the TS half "joins it against the board", which stopped being true at T-110's rebuild. Item 3 IS T-110-s9's EDIT ONE, and its half-discharge is why it survived a merge and a checkpoint. RESURFACES: the next app-dispatch dispatch, paired with docs/architecture/components/ — one lane takes both surviving items and T-110-s9 with them. Item 4 (C-05's depends_on missing C-15, now visible to arch drift) rides T-135 Half B, which owns ADR-018 and is never re-dispatched whole.
