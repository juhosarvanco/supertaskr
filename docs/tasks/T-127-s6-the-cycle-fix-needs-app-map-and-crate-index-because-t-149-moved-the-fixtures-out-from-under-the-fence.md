---
id: T-127-s6
feature: F-06
milestone: 4
priority: 5
size: M
title: The cycle fix needs [docs/architecture/components/, app-map, crate-index] — T-149 moved the two dogfood fixtures out from under T-127-s1's fence, so the card written to reach them no longer does
status: building
blocked_by: []
touches: [docs/architecture/components/, app-map, crate-index]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
suggested_by: executor claude-opus-5 @T-127-s1
---

**T-127-s1 was cut to carry the fence its parent lacked, and the same
failure happened to it — one generation later, for a different reason.**
Its `touches:` is `[docs/architecture/components/, app-shell,
lib-parser]`, chosen at T-127 because the two live-registry fixtures then
sat under C-05's catch-all `app/test/**` glob. **T-149 replaced that glob
with sixteen named files and routed the dogfood pair to C-12**, whose
slug is `app-map`. The fence line did not move; the files moved out from
under it.

This card is the same work with the fence DERIVED at `95cf2d0` rather
than inherited, and with the partition MEASURED rather than proposed.

## The fence this work actually needs, derived not assumed

`docs-gate.mjs --census` at `95cf2d0` names every reader of
`docs/architecture/components`, and each one's owner comes from that
component file's own `touch_slugs:` field:

| reader | suite | component | slug | in T-127-s1's fence? |
|---|---|---|---|---|
| `app/test/architecture-dogfood.test.ts` | `npm test` from app/ | C-12 | `app-map` | **NO** |
| `app/test/map-dogfood-render.test.tsx` | `npm test` from app/ | C-12 | `app-map` | **NO** |
| `app/src-tauri/crates/nputer-index/tests/arch.rs` | `cargo test` | C-07 | `crate-index` | **NO** |
| `app/test/select-board.test.ts` | `npm test` from app/ | C-08 | `app-board` | **NO** |
| `lib/parser/test/smoke.test.ts` | `npx vitest run` from lib/parser | C-06 | `lib-parser` | yes |
| `lib/parser/test/fence.test.ts` | `npx vitest run` from lib/parser | C-06 | `lib-parser` | yes |
| `lib/parser/test/rejected-exclusion.test.ts` | `npx vitest run` from lib/parser | C-06 | `lib-parser` | yes |

**Proposed `touches:` — `[docs/architecture/components/, app-map,
crate-index]`.** Measured, not guessed:

- `app-map` is REQUIRED — it is the only slug that reaches the two
  fixtures that actually red.
- `crate-index` is REQUIRED — `KNOWN_DECLARED_CYCLES` at
  `app/src-tauri/crates/nputer-index/tests/arch.rs:228` is an exact set
  and reds by name the moment the cycle goes. Its own panic message says
  so: *"A MISSING one means a cycle was fixed and its allowlist entry
  was left behind - delete the entry."* Two doc comments in the same
  crate also describe the cycle as standing
  (`src/arch/cycles.rs:52`, `src/cli.rs:78`).
- `app-shell` bought NOTHING — no C-05/C-10/C-11/C-16 body moved under
  either partition measured below.
- `lib-parser` bought NOTHING — the parser suite is **15 files, exit 0**
  under the partition. T-127-s1's claim that `smoke.test.ts` *"pins the
  exact id array, so declaring a new component id moves it"* was true
  when written and is FALSE at `95cf2d0`: T-033 replaced the literal
  array with one derived from the directory listing
  (`smoke.test.ts:119-134`), so a legitimately-named new registry file
  passes.
- `app-board` (`select-board.test.ts`) reads the registry but did not
  red under either partition. Carry it only if a fixer needs it; it is
  named here so its absence is a decision rather than an oversight.

`docs/STATE.md`'s standing exception paragraph is NOT in any slug and is
the INTEGRATOR's to retire at the checkpoint that lands this — the
STATE-template replacement, not a lane write.

## The partition, MEASURED at `95cf2d0` — T-127-s1's `MARKED UNVERIFIED` is discharged

The four-node extraction T-127-s1 proposed from the file graph was
applied to the registry in lane `task/T-127-s1-cycle-fence-reaches-fixtures`
and run. It is correct.

- **`C-17 Board model`** (new): `app/src/lib/board-model.ts`,
  `app/src/lib/task-detail.ts`. `depends_on: [C-06, C-16]` — derived,
  and `arch` confirms `observed_deps=2` against `declared_deps=2`.
- **`C-18 Board root`** (new): `app/src/components/board/Board.tsx`
  alone. `depends_on: [C-06, C-08, C-09, C-17]`, all four observed.
- **`C-08 Board pane`**: the card faces only — `FeatureColumn`,
  `GhostCard`, `ParkedRow`, `SliceLine`, `TaskCard`, `badges/**`.
  `depends_on: [C-06, C-11, C-16, C-17]`.
- **`C-09 Detail panel`**: `TaskDetailPanel.tsx`, `panel-dismissal.ts`.
  `depends_on: [C-06, C-08, C-11, C-16, C-17]`.
- and three consumer rows move with it: `C-05` swaps `C-08` for `C-18`,
  `C-13` swaps `C-08` for `C-18`, `C-12` gains `C-17`.

Result, `cargo run -p nputer-index -- arch cycles --root ../..` unpiped:

    verdict  ACYCLIC  no declared cycle among 15 components and 43 declared edges
    exit 0

and `arch --root ../..`: `components=15 files=189 mapped=189 unmapped=0
edges=45 findings=4 drift_components=4` — **findings and drift unchanged
from the 13-component baseline.** The extraction buys the acyclicity and
costs no new drift.

## What reds, exactly — the reconciliation this card is for

`npm test` from `app/` under that partition: **6 failed / 1007 passed of
1013, exit 1**, in two files and no others:

- `architecture-dogfood.test.ts:1101` the id array (13 -> 15)
- `architecture-dogfood.test.ts:1386` the per-component file counts
- `architecture-dogfood.test.ts:2003` the relation table (37 -> 45)
- `architecture-dogfood.test.ts:2201` the C-0x->C-06 seam `fileEdges`
- `map-dogfood-render.test.tsx:131` node count (13 -> 15)
- `map-dogfood-render.test.tsx:404` edge count (37 -> 45)

`cargo test --test arch` under the same partition: **9 passed, 1 failed,
exit 101** — `the_live_registry_declares_exactly_the_cycles_this_crate_still_allows`,
`left: []` against `right: ["C-08 -> C-09 -> C-08"]`.

`npx vitest run` from `lib/parser`: **15 files, exit 0 — unmoved.**

So CONVENTIONS' DECLARING A COMPONENT gotcha is right that three
fixtures exist and wrong about which three move today: it is the two app
fixtures **plus the Rust allowlist**, and the parser pin holds. That
bullet is `docs/CONVENTIONS.md` and out of every fence discussed here;
correcting it is its own card (compare `T-127-s5`, rejected for the same
shape).

## The minimal alternative, also measured — and why it is worse

T-127-s1's two-node partition (`TaskDetailPanel.tsx` to C-08,
`board-model.ts` to C-09, `C-08` dropped from C-09's `depends_on`, plus
`C-12` gaining `C-08`) is also **ACYCLIC, exit 0**, at 13 components and
37 edges, and reds only **2 of 1013, exit 1**, both in
`architecture-dogfood.test.ts`. It is cheaper.

**Take the four-node one anyway.** The two-node one leaves "Detail
panel" owning `board-model.ts` and "Board pane" owning the drawer —
names that no longer describe their contents, which is how this cycle
was born. Criterion 3 of T-127-s1 asks for the partition argued on the
merits rather than on minimality, and both are now measured, so the
choice is free of guesswork.

**And T-127-s1's own figures for the two-node case are stale**: it
recorded *6 failed / 967 passed of 973* across BOTH app fixtures at
`afe23c1`. At `95cf2d0` the same partition reds **2 of 1013 in one
file** — `map-dogfood-render.test.tsx` holds because neither the node
count nor the edge count moves when no component is declared.

## The fold-into-C-05 refusal, now measured rather than predicted

T-127-s1's criterion 4 asks the lane to show that folding `Board.tsx`
into C-05 instead of giving it its own node reintroduces a cycle. It
does, and here is the run: with `Board.tsx` in C-05's `paths:` and
`C-13` depending on `C-05` for its `BoardCrescendo.tsx -> Board.tsx`
import,

    cycle    C-05 -> C-13 -> C-05
    verdict  DECLARED CYCLE  1 cycle(s) among 14 components
    exit 1

One cycle traded for another. `C-18` earns its node.

## Standing hazard this card should carry into its brief

The fence manifest is machine-derived and correct; the CARD's `touches:`
line is what went stale. **A `touches:` line is a claim about where files
live, and it is not re-derived when a later card moves them.** T-149
moved two files between components and no gate anywhere noticed that a
`planned` card's fence had stopped reaching its own acceptance criteria —
which is `T-127-s4`'s finding (`touch_slugs:` edits are invisible to
every suite) arriving from the other direction: the FIELD did not move,
the PATHS did, and a live card's fence silently narrowed. Worth a gate;
worth at least a dispatch-time check that a card's criteria name files
its fence reaches.
