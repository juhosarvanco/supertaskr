---
id: T-127-s6
feature: F-06
milestone: 4
priority: 5
size: M
title: The cycle fix needs [docs/architecture/components/, app-map, crate-index] — T-149 moved the two dogfood fixtures out from under T-127-s1's fence, so the card written to reach them no longer does
status: verifying
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

## Implementation notes

**THE CYCLE IS GONE AND NO IMPORT WAS SEVERED.** Lane
`task/T-127-s6-cycle-fix-reaches-fixtures`, base
`fc45724da2ca6eec187c8f6fc1387e13726d6ef3`, work commit `f0ff62d`. Every
figure below is re-derived at this lane's own ref unless stamped
otherwise, and every exit code was read from `$?` on an unpiped command.

    cycles  source=declared depends_on  root=../..  registry=docs/architecture/components  components=15  declared_edges=43
    verdict  ACYCLIC  no declared cycle among 15 components and 43 declared edges
    exit 0

The base was **exit 1**, `cycle C-08 -> C-09 -> C-08`, 13 components / 35
declared edges — re-derived here rather than quoted, and identical to
what `T-127-s1` measured at `95cf2d0`.

### What landed

- **`C-17 Board model`** (new): `app/src/lib/board-model.ts`,
  `app/src/lib/task-detail.ts`; `depends_on: [C-06, C-16]`, `arch`
  reports `declared_deps=2 observed_deps=2`.
- **`C-18 Board root`** (new): `app/src/components/board/Board.tsx`
  alone; `depends_on: [C-06, C-08, C-09, C-17]`, `declared_deps=4
  observed_deps=4`.
- **`C-08`** keeps the card faces and its two tests, `depends_on:
  [C-06, C-11, C-16, C-17]`. **`C-09`** keeps the drawer and its three
  tests, `depends_on: [C-06, C-08, C-11, C-16, C-17]`.
- The three consumer rows: `C-05` and `C-13` swap `C-08` for `C-18`,
  `C-12` gains `C-17`.
- **`KNOWN_DECLARED_CYCLES` is `&[]`**, its doc comment rewritten to say
  the empty list is the point and to name the positive control that
  keeps the pair from going vacuous.
- The three live-registry fixtures reconcile TOGETHER and **none is
  loosened** — every edit tightens or renames, and the two new
  components are asserted by IDENTITY in both files, not only by a
  count.

`arch --root ../..` summary at `f0ff62d`: `components=15 files=189
mapped=189 unmapped=0 edges=45 findings=4 drift_components=4` —
**findings and drift IDENTICAL to the 13-component baseline measured at
this same lane's base.** The acyclicity costs no new drift and strands no
file.

### The C-17/C-18 `touch_slugs:` judgement, which the card left open

The scaffold proposed `[app-board]` on C-16's precedent. **Kept, and the
reasoning is the registry's own rather than the precedent's authority.**
C-16's note says a new slug "would silently move a fence as a side effect
of a registry tidy-up, and a fence that moves without a dispatch is the
one thing the slug table exists to prevent" — and here the direction is
worse than it was for C-16. These three paths are C-08's and C-09's
today, both `[app-board]`, so:

- **A new word NARROWS every live card reading `[app-board]`**, removing
  `Board.tsx`, `board-model.ts` and `task-detail.ts` from its reach
  without any dispatch deciding that.
- **Omitting the field is worse still** and was considered because it is
  the one choice that leaves `docs/ARCHITECTURE.md` alone (below): it
  would make the three paths unreachable by ANY fence word, which is the
  same narrowing with no replacement.
- `app-board` was already a multi-component slug (C-08, C-09, C-11), and
  `docs/ARCHITECTURE.md` states plainly that three slugs are claimed by
  more than one component. Five is not a new shape.

**What it moves, measured:** the slug map's field side becomes `app-board
-> C-08, C-09, C-11, C-17, C-18`. Nothing else in the fence layer changes
— `brief.mjs --task T-127-s6` at `f0ff62d` still computes T-127-s6 and
T-153-s5 as DISJOINT.

### NOT BUILT, and out of fence: the FOURTH enforcing copy

`docs/ARCHITECTURE.md` carries a derived slug block, and
`tools/e2e/tests/brief.spec.ts:439` asserts it EQUALS the fields. At
`f0ff62d` it does not:

    prose block diverges: app-board: field says C-08, C-09, C-11, C-17,
      C-18 and the prose block says C-08, C-09, C-11

**Measured, not predicted:** `npm test` from `tools/e2e/` reds on exactly
that one body. `docs/ARCHITECTURE.md` is in no slug and matches no fence
token — checked against the armed `.nputer/lane-fence.json`, whose
`paths:` array is the 20 paths of this card's `touches:`, and the
comparison is a case-sensitive PREFIX, so the `docs/architecture/components`
entry does not cover it. Widening a fence from inside the lane is the one
repair this role may never make, so the edit is ROUTED as **`T-127-s7`**
with the exact one-line replacement and the parser that reads it.

**This is the same failure shape a third time on one card**, and the
reason is worth more than the repair: the fence was DERIVED from
`docs-gate.mjs --census`, which lists `brief.spec.ts` as a reader of
`docs/CONVENTIONS.md` and of nothing else. Its registry reads go through
`components()` and `architectureText()`, helpers the census does not
resolve, so the seven-reader table in this card's own body is one reader
short. Routed as **`T-127-s8`**. Note the gate still did its job at the
SUITE level — the DOCS GATE run below names `npm test from tools/e2e/`
as owed — so what is incomplete is the per-file reader attribution the
fence was built from, not the gate's verdict.

### The exact red set, reconciled — and how each was derived

`npm test` from `app/` went **6 failed / 1007 passed of 1013, exit 1**
under the partition before reconciliation, in exactly the two files and
six assertions the scaffold names (`:1101`, `:1386`, `:2003`, `:2201`;
`:131`, `:404`). Every replacement value was derived from `arch`'s own
`component … files=` and `edge …` lines at the edited registry, never
read off a failure diff — the discipline both fixtures' own comments ask
for. `cargo test --test arch` went 9 passed / 1 failed, exit 101 on
`the_live_registry_declares_exactly_the_cycles_this_crate_still_allows`,
`left: []` against `right: ["C-08 -> C-09 -> C-08"]`, and is 10/10 now.

Two assertions were **widened rather than merely repaired**, because
subtracting would have lost a check the seam body exists to make:

- the `C-0x -> C-06` package seam now asserts **four** components
  (C-08 3, C-09 2, C-17 2, C-18 1) instead of three. 5 + 3 before, 3 + 2
  + 2 + 1 after — the same eight file edges under four owners, so a
  re-partition that DROPPED one shows up as an edge that vanished rather
  than moved.
- the map fixture gained identity assertions for `C-17` and `C-18`
  beside the node count, for the reason its own T-139/T-141 ledger
  gives: a total cannot tell a component from a synthesised bucket.

### The suites, in the order run, exits read unpiped

| command | where | result |
|---|---|---|
| `npm ci` + `npm run build` | lib/parser | exit 0, exit 0 |
| `npm install` + `npm run build` | app | exit 0, exit 0 |
| `npm ci` | tools/e2e | exit 0 |
| `arch cycles --root ../..` (BASE) | app/src-tauri | **exit 1**, 13 components / 35 declared edges |
| `npm test` (BASE) | app | 47 files, **1013 passed, exit 0** |
| `arch cycles --root ../..` (TIP) | app/src-tauri | **exit 0**, ACYCLIC, 15 / 43 |
| `npx vitest run` | lib/parser | 15 files, **314 passed, exit 0 — unmoved** |
| `npx tsc --noEmit` | lib/parser | exit 0 |
| `npm test` | app | 47 files, **1013 passed, exit 0** |
| `npm run build` | app | exit 0 |
| `cargo test` | app/src-tauri | **522 passed / 0 failed / 4 ignored, exit 0** |
| `cargo test -p nputer-index --test arch` | app/src-tauri | 10 passed, exit 0 |
| `npm run typecheck` | tools/e2e | exit 0 |
| `npm run lint:tokens` | tools/e2e | exit 0 — TOKEN 150 files, CONTROL 853 tracked text files |
| `npm run lint:docs` | tools/e2e | exit 0 |
| `npm test` | tools/e2e | **280 passed / 1 failed of 281, exit 1** — `brief.spec.ts:439` only, the routed `T-127-s7`. Two earlier runs read 5 failed; the other four were my own malformed card, see finding 4 |
| `NPUTER_BOOT_PORT=14521 npm run boot:check` | tools/e2e | exit 0, both `[nputer]` lines |
| `docs-gate.mjs $(git diff --name-only …)` | repo root | exit 1, FIRES, four suites named |
| `index --check --root ../..` | app/src-tauri | exit 1 STALE — the integrator's regen, `files +0 -0 ~3`, every count unchanged |

**The parser suite is the criterion's third fixture and it did not move**,
which is `T-127-s1` finding 2 confirmed at a second ref: T-033 made the id
array derive from the directory listing, so two legitimately-named new
registry files pass it. The `lib-parser` token this card dropped from its
predecessor's fence bought nothing, measured twice now.

### Gates, DERIVED from the merge diff

The RANGE RULE's pre-merge pair, `TREE=$(git merge-tree --write-tree
<main tip> HEAD)` then `git diff --name-only <main tip> "$TREE"` —
never `main..HEAD` and never three dots. Measured three times as the lane
grew, because the RIGHT-hand endpoint decides the left one and BOTH
endpoints moved:

| main tip | HEAD | tree | paths |
|---|---|---|---|
| `fc45724` (at dispatch) | `f0ff62d` | `5c45a3d` | 10 |
| `fc45724` | `314aadf` | `11c8069` | 14 |
| `4717ad1` (main NOW) | `314aadf` | `57bc4d0` | **14, byte-identical set** |

**MAIN MOVED UNDER THIS LANE** and the brief's `integration tip right
now: fc45724…` is stale by one commit: `4717ad1`, *"T-160 filed at
@human's request"*, is docs-only and adds one card file, so the merge
diff is the same 14 paths and every gate answer below is unchanged. Said
here rather than left for the integrator to notice.

The four paths the second and third rows add over the first are
`docs/tasks/**` — this card plus the three routed ones — which is a CODE
INPUT (the DOCS GATE's whole subject), so the gate was re-derived and its
four suites re-run at the final tip. All figures below are the FINAL
tip's.

- **GRAPH REGEN — FIRES.** Three `.ts`/`.tsx`/`.rs` paths outside
  `docs/`. **Asked rather than predicted:** `index --check --root ../..`
  at `f0ff62d` is **exit 1 STALE**, and it is a REAL stale rather than
  the `--root` false red — it prints both sides' counts and a file diff.
  `files +0 -0 ~3`, bytes/files/symbols/edges IDENTICAL at
  `1021562 / 189 / 2157 / 2111`; only `loc` and content hashes moved
  (arch.rs 323→333, architecture-dogfood 2402→2556, map-dogfood
  770→795). **The regen is the integrator's at the checkpoint**, per the
  gate's own wording, and it is a no-op on every count the graph carries.
  Budget after: 1021562 of 1040000 bytes, 18438 left.
- **BOOT GATE — FIRES** (`app/src-tauri/**`). `NPUTER_BOOT_PORT=14521
  npm run boot:check` from tools/e2e: **exit 0**, both lines observed —
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-127-s6` and
  `[nputer] window "main" created`. Port lsof'd to zero rows first; 1420
  was read only, never bound.
- **DOCS GATE — FIRES**, run in the one spelling the doc prints, no
  `xargs`: **exit 1**, **11** paths under `docs/` are code inputs at the
  final tip (7 at `f0ff62d`, before the four card files), four suites
  named — `cargo test from app/src-tauri/`, `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`. **All
  four were run at the final tip** and all four are in the table above.
- **METHOD EVAL GATE — NOT OWED.** No `method/**` path in the 14.
- **AUDIT GATE** declares no merge-diff trigger and `Cargo.toml`/
  `Cargo.lock` are not in the diff, so `cargo audit` was not run.

### The poison drill — 18 for 18, one side only, every restoration proved

Detached scratch worktree `/Users/ujju/Projects/np-t127s6-drill` at
`f0ff62d` (a SHORT root, T-133-s5), with its own
`CARGO_TARGET_DIR=<scratch>/.t127s6-target` — the lane's own `target/`
was never entered by a drill build. The work was COMMITTED first, so a
restore cannot be a revert (T-072-s1). No graph regen was run inside the
drill. Each mutant was applied with an exact-string substitution that
**asserts the count is exactly 1 and dies otherwise** — one mutant did
fail to apply on the first attempt and the assertion caught it, which is
the reason the rule asks for the mutated TEXT rather than a non-zero
count.

**Sixteen assertion-side mutants, one at a time** (they mask each other
inside one `it()` body, which both fixtures' comments warn about): the
id array losing `C-17`; the declared count 15→14; the four file-count
rows C-08 10→11, C-09 5→4, C-17 2→3, C-18 1→2; the relation row
`C-08→C-17` 10→9; the relation row `C-18→C-17` deleted outright; the
tally `confirmed` 33→32; the three seam paths renamed (C-17's
`task-detail.ts`, C-18's `Board.tsx`, C-08's `SizeBadge.tsx`); and on
the map fixture the node count 15→14, the edge count 45→44, and the two
new identity selectors pointed at `C-19`/`C-20`. **Every one RED, exit
1.** Restoration proved after each by `shasum -a 256` of the working
file against `git show HEAD:<path>` —
`f24234e364b0eb04bf5ff5b3c5bf51dfabe01697ef20b53197ac7fc001bab43c`
(dogfood) and
`8a0fec92d61a2758c5d4a32dbae5af99858728d8f2bc60e0401dc01566fafe59`
(map), identical on all sixteen.

**Two Rust mutants, one per side, and the second is the one that
matters.** The expected side of `KNOWN_DECLARED_CYCLES` is now EMPTY,
which is poison shape TEN — a comparison is evidence only once its
expected side is shown capable of failing.

- **Assertion side**: put `"C-08 -> C-09 -> C-08"` back on the allowlist
  → `left: []` / `right: ["C-08 -> C-09 -> C-08"]`, FAILED, 9 passed /
  1 failed.
- **Code-under-test side**: give `C-08` back its `C-09` dependency in
  the registry, allowlist untouched → `left: ["C-08 -> C-09 -> C-08"]` /
  `right: []`, FAILED, 9 passed / 1 failed.

Both restored, sha256 identical to `HEAD`
(`8561fee9…` for `arch.rs`, `716c882e…` for `C-08-board-pane.md`), and
the drill worktree's `git status --short` afterwards holds only its own
untracked `.t127s6-target/`.

### Where the brief and the card were wrong, said plainly

1. **The card's reader table is one reader short.** It lists seven
   readers of `docs/architecture/components` and cites
   `docs-gate.mjs --census` as the source; the census output at
   `fc45724` does say seven, and `tools/e2e/tests/brief.spec.ts` is an
   eighth the census cannot see. `T-127-s8`.
2. **"Two doc comments in the same crate also describe the cycle as
   standing (`src/arch/cycles.rs:52`, `src/cli.rs:78`)" — they do
   not.** Both use `C-08 -> C-09 -> C-08` as an illustration of the
   PRINT FORMAT ("rotated to start at its numerically-lowest component
   so one cycle has exactly one spelling"; the `--help` text's example
   of a cycle rendered as a path). Neither asserts the cycle stands, and
   both are still accurate as format examples, so both were LEFT — in
   fence, deliberately untouched. Editing them would have been a change
   with no defect behind it, and `cli.rs`'s is help text.
3. **The predecessor's drill could not have found the `brief.spec.ts`
   red, and the reason is mechanical rather than an oversight.** The
   e2e registry readers walk `git ls-files`, so an edited-but-unstaged
   registry is invisible to them. Measured on this lane: `npm test` from
   `tools/e2e/` was **281 passed, exit 0** with `C-17` and `C-18`
   written and untracked, and **1 failed of 281** at the same content
   once committed. Any future registry drill must commit before it
   believes a green e2e run.
4. **I REPRODUCED THE DOCS GATE'S OWN WORKED EXAMPLE, AGAINST THE GATE,
   IN THE SESSION THAT READ IT — and my first explanation of it was
   wrong.** Two post-commit e2e runs came back **5 failed of 281**:
   `brief.spec.ts:439` plus four `shell-frame.spec.ts` bodies. The first
   run had overlapped a drill worktree's installs and a cold cargo
   build, so I attributed the four to load and wrote that down. **The
   re-run ALONE reproduced them exactly**, which killed that reading.
   The cause was a suggestion card I had written between the two runs
   whose `title:` opened with a BACKTICK — `9c64cd8`'s class verbatim,
   the one the DOCS GATE bullet uses to justify its own existence — and
   it surfaced as `Expected "60"` against `Received "61"` on
   `<main data-failure-count>` in bodies about frame containment.
   Positive control: rewording the title and changing nothing else takes
   `shell-frame.spec.ts` to **6 passed, exit 0**. The card was repaired
   in this lane before hand-off, so nothing is left red by it. **What
   survives is the finding**: `npm run lint:docs` printed *"every live
   task card's frontmatter parses, with a legal status"* and exited 0
   with that card on disk, while the `yaml` package rejects it outright.
   Routed as `T-127-s9`. Two lessons, and the second is the one I would
   not have got any other way: the gate's reassuring sentence is not
   load-bearing, and **a plausible collision story is the most expensive
   wrong answer available to a lane** — it explains a red without
   testing it, and lane-protocol rule 4's own warning about second
   runners is what made it plausible.

### Routed, not silently omitted

- **`T-127-s7`** — `docs/ARCHITECTURE.md`'s slug block, the fourth
  enforcing copy, with the exact one-line replacement. Fence
  `[docs/ARCHITECTURE.md]`. This is the ONE red at this lane's tip.
- **`T-127-s8`** — the census cannot see a reader that reaches `docs/`
  through a helper it does not know. Fence `[tools/e2e]`, which collides
  with `T-153-s5`/`T-153-s6` and must sequence behind them. It also
  carries the corrected fixture count for CONVENTIONS' DECLARING A
  COMPONENT gotcha, which is now wrong about the count (FOUR) as well as
  the membership.
- **`T-127-s9`** — the DOCS GATE's frontmatter check says every card
  parses on a card `yaml` rejects, with the planted hit and the positive
  control both measured on this lane. Same `[tools/e2e]` fence as
  `T-127-s8` and the same file family: **take the two together.**
- **Stale prose about a cycle that no longer stands, all of it outside
  every fence here and none of it red:** `docs/STATE.md`'s standing
  exception (the integrator's, at the checkpoint, through the
  STATE-template replacement — the card already says so);
  `docs/CONVENTIONS.md:39` and `:258`, which describe `arch cycles` as
  LOCAL ONLY *"while the declared C-08 <-> C-09 cycle is held open"*;
  and `tools/e2e/tests/workflow-parity.spec.ts:342`, whose `why` string
  says the same and is prose inside a `LOCAL_ONLY` table — it asserts
  the command is ABSENT from CI, which is still true, so it is green and
  merely stale. **Whether `arch cycles` should now BECOME a CI step is a
  real decision that the cycle's removal makes askable for the first
  time, and it is nobody's to take in passing** — it belongs with the
  CONVENTIONS edit, behind the same `tools/e2e` collision.
