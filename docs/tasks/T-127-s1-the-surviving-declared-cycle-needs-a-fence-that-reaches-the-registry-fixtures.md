---
id: T-127-s1
title: The surviving declared cycle C-08 -> C-09 -> C-08 cannot be removed from inside T-127's fence, and until it is, one command on main exits 1 by design
feature: F-06
milestone: 4
priority: 5
size: M
status: done
blocked_by: []
touches: [docs/architecture/components/, app-shell, lib-parser]
suggested_by: executor claude-opus-5 @T-127
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29, and the board already
depends on it.** `docs/STATE.md`'s opening paragraph names this card by
id: *"`cargo run -p nputer-index -- arch cycles --root ../..` is exit 1
by design — the declared cycle `C-08 -> C-09 -> C-08` stands until
`T-127-s1` lands."* Every session is briefed on a red command, and the
briefing ends when this card does. That is the strongest promotion signal
in the backlog: a standing exception in the first document every session
reads, held open by one unbuilt criterion.

T-127's criterion 3 — *"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL
BE GONE, AND NO IMPORT SHALL BE SEVERED TO DO IT"* — is the one thing
that card did not build, and the reason is a fence rather than a
difficulty: the smallest acyclic re-partition reds two live-registry
fixtures under `app/test/**`, which is C-05's `app-shell`. This card
carries the fence the work needs.

## Acceptance criteria

- WHEN the registry is re-partitioned THE declared-cycle census SHALL be
  ZERO, derived at the lane's own ref rather than compared against a
  named pair — T-127's criterion was written over the census and stayed
  true under a history that moved, and that property SHALL be preserved.
- NO import SHALL be severed and NO source file SHALL move to achieve
  it. The paths move in the REGISTRY, not on disk. IF a fixer concludes
  a source file must move THEN it SHALL be routed as its own card rather
  than taken here (T-127's own words).
- THE partition SHALL be argued on the merits, not on minimality. The
  two-node re-partition this card measured is minimal and leaves
  "Detail panel" holding `board-model.ts`; the four-node extraction it
  proposes (a pure `Board model` component, the card faces, the panel,
  and a node for `Board.tsx` alone) is the architecturally honest shape
  and is **MARKED UNVERIFIED** — derived from the file graph and never
  run. WHICHEVER is taken SHALL be measured before it is written down.
- IF `Board.tsx` is folded into C-05 instead of getting its own node
  THEN the lane SHALL show it does not reintroduce a cycle — the refusal
  is measured: `BoardCrescendo.tsx` (C-13) imports `Board`, so C-05 would
  gain `C-13 -> C-05` beside the declared `C-05 -> C-13`.
- WHEN the registry moves THE three live-registry fixtures SHALL
  reconcile together and SHALL NEVER be loosened — `lib/parser/test/
  smoke.test.ts` (which pins the exact id array, so declaring a new
  component id moves it), `app/test/architecture-dogfood.test.ts` and
  `app/test/map-dogfood-render.test.tsx`. CONVENTIONS' DECLARING A
  COMPONENT gotcha governs.
- WHEN the change lands THE lane SHALL run `arch cycles --root ../..`
  unpiped and report its exit, AND `docs/STATE.md`'s standing exception
  SHALL be retired in the same integration — the paragraph exists only
  because this card is open.

## The record, kept verbatim

T-127's criterion 3 — *"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL
BE GONE, AND NO IMPORT SHALL BE SEVERED TO DO IT"* — is **NOT BUILT**,
because the fix lies outside `[crate-index, docs/architecture/components/]`
and a fence is never widened from inside the lane it fences
(`method/roles/executor.md`). Everything else the card asks for shipped.

## The census, derived at T-127's own ref `afe23c1`

**ONE declared cycle: `C-08 -> C-09 -> C-08`.** The card's own table says
*"On main today there are TWO — `C-08 ↔ C-09` and `C-05 ↔ C-12`"*; T-033
dropped `C-12 -> C-05` and the second one is gone. This is the criterion's
own design working: it is written over the CENSUS rather than over a named
pair, so it stayed true under a history that moved.

## What was measured, and why the boundary move is out of fence

The smallest re-partition of these two components' `paths:` that is
acyclic — `TaskDetailPanel.tsx` to C-08, `board-model.ts` to C-09, and
`C-08` dropped from C-09's `depends_on` — was applied on T-127's lane,
read back with `git diff`, and run:

| | before | after the re-partition |
|---|---|---|
| declared cycles (derived) | **1** | **0** |
| `arch` component edges | 36 | 36 |
| `npm test` from `app/` | **973 / 973, exit 0** | **6 failed / 967 passed, exit 1** |
| `npx vitest run` from `lib/parser` | 268 / 268 | **268 / 268, exit 0** |

The six failures are in exactly the two live-registry fixtures
`docs/CONVENTIONS.md` names — `app/test/architecture-dogfood.test.ts` (the
relation table, the findings list, the drift set: `expected [ 'C-10',
'C-12' ] to deeply equal [ 'C-10' ]`) and
`app/test/map-dogfood-render.test.tsx` (the 36-edge list). **Both sit
under `app/test/**`, which is C-05's `app-shell`.** The third fixture,
`lib/parser/test/smoke.test.ts`, holds only because no component ID
changed — it pins the exact id array, so any partition that DECLARES a new
component moves it too, and that fence is `lib-parser`.

The re-partition also materialises `D1:C-12->C-08` (`MapView.tsx` imports
`TaskDetailPanel.tsx`), so C-12's `depends_on` must gain `C-08` in the
same commit. That part IS inside `docs/architecture/components/`.

**Restored and proved**: `git diff` empty and sha256 identical per path
after the measurement.

## The partition to build, and the one that was only measured

The measured one above is minimal, not right: it leaves "Detail panel"
holding `board-model.ts` and "Board pane" holding the drawer. **The
architecturally honest fix is the ADP's sanctioned extraction, and it
needs FOUR nodes because the file order alternates twice**, derived from
the committed graph:

    board-model.ts, SliceLine, panel-dismissal, ReviewBadge, SizeBadge   (leaves)
      -> ModelBadge, task-detail.ts
        -> GhostCard, ParkedRow, TaskCard
          -> TaskDetailPanel
            -> FeatureColumn
              -> Board

- **`C-17 Board model`** (new): `app/src/lib/board-model.ts`,
  `app/src/lib/task-detail.ts`. Pure, React-free, four consumers
  (C-08, C-09, C-12 and the app suite). `depends_on: [C-06, C-16]`.
  Exactly C-16's shape one layer down.
- **`C-08 Board pane`**: the card faces — `FeatureColumn`, `GhostCard`,
  `ParkedRow`, `SliceLine`, `TaskCard`, `badges/**`.
- **`C-09 Detail panel`**: unchanged — `TaskDetailPanel.tsx`,
  `panel-dismissal.ts`.
- **a fourth node for `Board.tsx` alone**, which is the ONLY C-08 file
  that reaches the drawer. Folding it into C-05 instead is REFUSED and
  the reason is measured: `BoardCrescendo.tsx` (C-13) imports `Board`, so
  C-05 would gain `C-13 -> C-05` beside the declared `C-05 -> C-13` —
  a new cycle in place of the old one.

**MARKED UNVERIFIED** (tasks/TASK-FORMAT.md): the 4-node partition is
derived from the file graph and was NOT run against the suites. The
2-node one in the table above is what was measured.

## Fence

`[docs/architecture/components/, app-shell, lib-parser]` — the registry,
the two `app/test/**` fixtures, and the parser's id array if a new
component id is declared. No source file moves and no import changes;
if a fixer concludes one must, that is a third card (T-127's own words).
Nothing outside `app-board` is touched in `app/src`, and `app-board` is
NOT needed: the paths move in the registry, not on disk.

## Implementation notes

**THE CYCLE IS NOT REMOVED, AND THE REASON IS THIS CARD'S OWN TITLE
HAPPENING AGAIN.** Lane `task/T-127-s1-cycle-fence-reaches-fixtures`,
base `95cf2d047f85ca29cb232f5535e811f0385e4b8a`, all figures below
re-derived at that ref unless stamped otherwise.

This card exists because T-127's fence could not reach the registry
fixtures. **T-127-s1's fence cannot reach them either** — for a
different reason, discovered on first contact and measured rather than
argued. The successor with the corrected fence is
**`T-127-s6`**; the partition it carries is no longer `MARKED
UNVERIFIED`, because this lane ran it.

### The refusal, with the criteria quoted

> **WHEN the registry moves THE three live-registry fixtures SHALL
> reconcile together and SHALL NEVER be loosened —
> `lib/parser/test/smoke.test.ts` (which pins the exact id array, so
> declaring a new component id moves it),
> `app/test/architecture-dogfood.test.ts` and
> `app/test/map-dogfood-render.test.tsx`.**

**Two of the three named fixtures are outside this card's fence at
`95cf2d0`, and the third does not move.**

`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` are declared by
**`docs/architecture/components/C-12-map-pane.md`**, whose
`touch_slugs:` is **`[app-map]`**. This card's fence expands
`app-shell` to C-05, C-10, C-11, C-16 and never reaches them. The
card's belief that *"Both sit under `app/test/**`, which is C-05's
`app-shell`"* was TRUE at T-127's ref `afe23c1`, when C-05 carried a
catch-all `app/test/**` glob. **T-149 replaced that glob with sixteen
named files and routed the dogfood pair to C-12.** The fence line did
not move; the files moved out from under it.

Checked against the armed manifest rather than by eye —
`.nputer/lane-fence.json`, 46 expanded paths:

    app/test/architecture-dogfood.test.ts               OUT OF FENCE
    app/test/map-dogfood-render.test.tsx                OUT OF FENCE
    app/src-tauri/crates/nputer-index/tests/arch.rs     OUT OF FENCE
    docs/STATE.md                                       OUT OF FENCE
    docs/architecture/components/C-08-board-pane.md     IN FENCE
    lib/parser/test/smoke.test.ts                       IN FENCE

> **WHEN the change lands THE lane SHALL run `arch cycles --root ../..`
> unpiped and report its exit, AND `docs/STATE.md`'s standing exception
> SHALL be retired in the same integration.**

`docs/STATE.md` is in no slug and in no fence. Its retirement is the
INTEGRATOR's, through the STATE-template replacement at the checkpoint
that lands the successor — not a lane write, so this half is a handoff
rather than a refusal. The `arch cycles` half is reported below.

**A THIRD ENFORCING COPY THE CARD DOES NOT NAME AT ALL.** The cycle
census is an exact set in Rust:
`app/src-tauri/crates/nputer-index/tests/arch.rs:228`,
`KNOWN_DECLARED_CYCLES`. That file is C-07 — `crate-index` — also
outside this fence. Its own panic text is the instruction this lane
cannot follow: *"A MISSING one means a cycle was fixed and its
allowlist entry was left behind - delete the entry."*

**Nothing was worked around and nothing was widened.** The lane's diff
is `docs/tasks/**` only.

### What was measured — the drill, and its restoration proof

All three partitions were applied to `docs/architecture/components/`
IN THIS LANE (in fence), run, and restored. **Restoration proved, not
asserted**: `shasum -a 256 -c` against a pre-drill manifest of all 13
registry files — 13 of 13 `OK`, `git diff --stat` empty and
`git status --short` empty afterwards. No graph regen was run inside
the drill and no source file was touched, so `docs/architecture/graph.json`
is byte-unchanged and every measurement below reads the SAME 189-file,
2111-edge graph.

**Baseline at `95cf2d0`** — `arch cycles` **exit 1**, `cycle C-08 ->
C-09 -> C-08`, 13 components / 35 declared edges; `arch` summary
`components=13 files=189 mapped=189 unmapped=0 edges=37 findings=4
drift_components=4`; `npm test` from app/ **1013/1013 exit 0**;
`npx vitest run` from lib/parser **15 files exit 0**; `cargo test`
**exit 0**.

**(A) The four-node extraction this card proposed and MARKED
UNVERIFIED — it is correct.** `C-17 Board model` (`board-model.ts`,
`task-detail.ts`, `depends_on: [C-06, C-16]`), `C-18 Board root`
(`Board.tsx` alone, `depends_on: [C-06, C-08, C-09, C-17]`), C-08
reduced to the card faces, C-09 unchanged in files, and the three
consumer rows moved (C-05 and C-13 swap C-08 for C-18, C-12 gains
C-17):

    verdict  ACYCLIC  no declared cycle among 15 components and 43 declared edges
    exit 0

`arch` summary `components=15 files=189 mapped=189 unmapped=0 edges=45
findings=4 drift_components=4` — **findings and drift identical to
baseline.** The acyclicity costs no new drift. Every declared edge of
both new nodes is observed (`C-17` 2/2, `C-18` 4/4).

Cost, and it is entirely out of fence: `npm test` from app/ **6 failed
/ 1007 passed of 1013, exit 1** in exactly two files —
`architecture-dogfood.test.ts` at :1101 (id array 13→15), :1386
(per-component file counts), :2003 (relation table 37→45), :2201
(the C-0x→C-06 seam `fileEdges`) and `map-dogfood-render.test.tsx` at
:131 (13→15 nodes) and :404 (37→45 edges). Plus `cargo test --test
arch` **9 passed / 1 failed, exit 101** on
`the_live_registry_declares_exactly_the_cycles_this_crate_still_allows`,
`left: []` vs `right: ["C-08 -> C-09 -> C-08"]`.

**(B) The minimal two-node partition, re-derived.** Also **ACYCLIC,
exit 0**, 13 components / 35 declared edges, summary unchanged at
`edges=37 findings=4`. `npm test` from app/ **2 failed / 1011 passed
of 1013, exit 1** — both in `architecture-dogfood.test.ts` only.

**(C) Criterion 4's refusal is now MEASURED, not predicted.** Folding
`Board.tsx` into C-05 instead of giving it its own node:

    cycle    C-05 -> C-13 -> C-05
    verdict  DECLARED CYCLE  1 cycle(s) among 14 components
    exit 1

exactly as the card forecast, on `BoardCrescendo.tsx -> Board.tsx`.
`C-18` earns its node.

### Where this card is wrong at `95cf2d0` — said plainly

1. **The fence.** *"the two `app/test/**` fixtures … which is C-05's
   `app-shell`"* — they are C-12's `app-map` since T-149.
2. **`lib/parser/test/smoke.test.ts` does NOT pin the exact id
   array.** T-033 replaced the literal with one derived from the
   directory listing (`smoke.test.ts:119-134`), so a legitimately
   named new registry file passes. Measured: the parser suite is
   **15 files, exit 0** under partition (A), which declares two new
   components. The `lib-parser` token in this fence buys nothing.
3. **`app-shell` buys nothing either** — no C-05/C-10/C-11/C-16 body
   moved under any of the three partitions.
4. **The two-node figures are stale.** The card's table records *6
   failed / 967 passed of 973* across both app fixtures at `afe23c1`;
   at `95cf2d0` the same partition reds **2 of 1013 in one file**.
   `map-dogfood-render.test.tsx` holds because neither the node count
   nor the edge count moves when no component is declared.
5. **A third enforcing copy exists** and no criterion names it: the
   Rust `KNOWN_DECLARED_CYCLES` exact set. CONVENTIONS' DECLARING A
   COMPONENT gotcha ("THREE live-registry fixtures") is right about
   the count and wrong about the membership today — the two app
   fixtures plus the Rust allowlist, with the parser pin holding.
   `docs/CONVENTIONS.md` is out of every fence here; correcting it is
   its own card (`T-127-s5` was rejected for that exact shape).

### For the verifier

The diff is `docs/tasks/**` only: this file's `status` and notes, plus
the new `T-127-s6`. **No registry file, no fixture and no source file
is touched** — `git diff` against the base over
`docs/architecture/components/` and everything else is empty, and the
sha256 manifest above is the positive proof rather than an assertion.
`arch cycles` at this lane's tip is **exit 1**, unchanged from base and
unchanged from main: this card did not make it green and says so.

### Routed, not silently omitted

- **`T-127-s6`** — the same work with `touches:
  [docs/architecture/components/, app-map, crate-index]`, carrying the
  now-measured four-node partition and the exact red set to reconcile.
- The standing-hazard half of that card is worth its own attention: a
  `touches:` line is a claim about where files LIVE, and nothing
  re-derives it when a later card moves them. T-149 narrowed a live
  card's fence and no gate noticed. That is `T-127-s4`'s finding
  arriving from the other direction — the field did not move, the
  paths did.

## Verdicts
