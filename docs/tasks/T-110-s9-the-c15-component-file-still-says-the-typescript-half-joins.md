---
id: T-110-s9
title: C-15's component file owes two edits after T-110's rebuild — the TS half no longer joins, and the test shim is now the tree's only unmapped file
status: suggested
suggested_by: executor claude-opus-5 @T-110-rebuild
---

**TWO EDITS TO ONE FILE, in one fence.** The second is the one that reds
a suite, and it did not exist until T-010 merged.

## EDIT ONE — the prose says the TypeScript half joins, and it no longer does

`docs/architecture/components/C-15-dispatch.md` describes the component
as *"the Rust half READS those files and runs no subprocess, and the TS
half mirrors the typed lane list and joins it against the board."*

**The second clause stopped being true in T-110's rebuild, and the
reason is a fence rather than a preference.** T-110's first pass put
`classify`, `joinLanes`, `IN_FLIGHT_STATUSES` and `describeRefusal` in
`app/src/lib/dispatch-store.ts` and was REJECTED, because acceptance
criterion 4 requires *"a pin SHALL drive each"* of the four states and no
suite in this repository can reach that file: `app/vitest.config.ts`
collects `test/**` only, and both that config and `app/test/**` are
C-05's `app-shell`. Four one-side-only producer mutants survived
`npm run build` and `npm test` at exit 0. The join moved to
`app/src-tauri/src/dispatch/join.rs` — C-15's own path, inside the fence,
inside `cargo test` — and the TS half was reduced to the mirrored types
plus `hydrateJoin`, which builds the `Map` ADR-009 requires and decides
nothing.

**WHAT THE PARAGRAPH SHOULD SAY**, so a reader is not sent to the wrong
file: the Rust half reads the lanes AND joins them against the board, and
the TS half mirrors the typed answer and hydrates it into the `Map`s
ADR-009 requires. The rest of the file is unaffected — the two `paths:`
entries, the D2 provenance, the follower-first ruling, the ADR-009 and
ADR-012 claims and the zero-webview-grant claim all still hold exactly.

**Nothing else in the tree carries the stale split**, checked rather than
assumed: `docs/ARCHITECTURE.md` does not describe C-15's internal
division, and `docs/design/dispatch-technical-plan.md`'s D2 rules only
that C-15 is declared with those two paths — it never rules which half
does the joining, which is why the move was an executor's to make.

## EDIT TWO — `paths:` owes `app/src-tauri/tests/dispatch_lanes.rs`, and this one REDS A BODY

**T-010 merged into main at `d64c673` while T-110's rebuild was running,
and it changed what the test shim COSTS.** The indexer now collects
Rust, so `app/src-tauri/tests/**` went from *unclaimed and invisible* to
*unclaimed and INDEXED*. T-010 saw this coming and settled it for the
files it could reach: `C-14-agent-runner.md` gained
`app/src-tauri/src/bin/fake_agent.rs` and
`app/src-tauri/tests/agent_runner.rs`, each with the comment
`# T-010 settlement, see below`, and `C-05-app.md` gained `acl_pin.rs`,
`churn.rs` and `index_cmd.rs` the same way. **It could not settle
`tests/dispatch_lanes.rs`, because that file did not exist on main.**

Measured at the forecast merge of `0c521d5` into `d64c673` — the tree
`git merge-tree --write-tree` predicts, `b0efae0`, built in a throwaway
worktree and confirmed byte-identical — with the graph regenerated:

- **`app/src-tauri/tests/dispatch_lanes.rs` is the ONE unmapped file in
  the whole tree.** 178 indexed files against 48 component globs; every
  other file matches one.
- `app/test/map-dogfood-render.test.tsx` → *"renders all twelve declared
  components in full mode, no unmapped bucket, no banner"* fails
  **13 nodes, expected 12** — the thirteenth IS the unmapped bucket.
- That body PASSES at `d64c673` alone with the same regen, so the cause
  is this lane and nothing else.

The one-line fix follows T-010's own settled shape:

    paths:
      - app/src-tauri/src/dispatch/**
      - app/src-tauri/tests/dispatch_lanes.rs   # T-010 settlement, see below
      - app/src/lib/dispatch-store.ts

**THE FENCE ARGUMENT FOR THE SHIM IS STILL SOUND AND THIS DOES NOT
RETRACT IT.** `app/src-tauri/tests/**` was claimed by no component when
T-110 was dispatched, T-113 had set the precedent, and T-110's verifier
ruled the placement legitimate — all true at the time. What changed is
downstream: after T-010 the same file is visible on the map. **And it
argues for `T-110-s1` rather than against the shim**: the commit that
declares `pub mod dispatch;` in `lib.rs` DELETES `tests/dispatch_lanes.rs`,
which removes the unmapped file rather than claiming it. If s1 lands
first, edit two is unnecessary; if this lane's merge lands first, edit
two is owed at that checkpoint or the map ships a bucket.

## Fence

`[docs/architecture/components/]` — T-010's slug. It was HELD by a live
lane when this rebuild began (T-010 has since merged; the checkpoint had
not landed), which is why both edits are routed instead of made.

Edit one is prose only. **Edit two moves `paths:`**, so it is a REGISTRY
change: T-024's three-fixture rule fires and
`lib/parser/test/smoke.test.ts`, `app/test/architecture-dogfood.test.ts`
and `app/test/map-dogfood-render.test.tsx` must all be reconciled
together. Taking it removes the 13th node and takes C-15's file list from
five to six.
