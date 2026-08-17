---
id: T-065
title: One wire, one shape — the picker/status payload is compared, not mirrored three times
feature: F-02
milestone: 4
priority: 30
size: M
status: planned
blocked_by: []
touches: [app-shell, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-041-s2, T-042-s1, T-027-s5 (triage 2026-08-17). The
suggestion files are removed in the same commit as this card.
T-042-s1 is the shallow half of T-041-s2 (it says so itself — "the
deeper problem is T-041-s2's and is not re-filed here"), and T-027-s5
is a three-line fix in the same spec file the lane work opens.

`PickOutcome` and `ProjectStatus` cross IPC as JSON and are mirrored
by hand THREE times: Rust emits them and
`genesis_and_no_docs_wire_shapes_are_pinned` asserts the serialized
JSON literally (now at `docs_watch.rs:2965` — the file grew; it was
cited at :2641 when filed); `app/src/lib/watcher-store.ts` declares
the TS mirror; and `tools/e2e/fixtures/shell.ts` mirrors the mirror,
because tools/e2e imports neither package. **Each end is pinned.
Nothing compares them.** Rename a field in the TS mirror or the lane's
copy and every suite stays green while the shipped app silently stops
understanding what Rust sends. The board path has partial cover by
accident; the picker/status path has none — no test in the repo feeds
a byte of Rust-produced JSON into the TS reducers.

AND THE LANE IS ALREADY BLIND BECAUSE OF IT. Re-verified at triage:
`shell.ts:51`'s genesis variant is still
`{ kind, projectDir, seq, probe }` with **no `snapshot` field**, and
there are now **SIX** `kind: "genesis"` literals across four spec
files (T-027 added `interview.spec.ts:45` — it was five when filed).
So T-042's whole criterion-1 route, the tree arriving ON the switch
with no fs event at all, has never been rendered by a real browser at
any viewport. `genesis-screen.spec.ts:165` passes via the pre-T-042
`docs-changed` route, so the lane is green and silent about the change.

## Acceptance criteria
- THE RUST PIN SHALL EMIT ITS SHAPES to a committed fixture (or a
  `#[test]` comparing against a committed `wire-shapes.json`), and
  ONE vitest test SHALL feed those exact bytes to
  `reducePickOutcome` / `applyProjectStatus`. One file, two readers,
  red at whichever end moved (T-041-s2 option 1).
- `tools/e2e/fixtures/shell.ts` SHALL READ THAT SAME FIXTURE rather
  than hand-declare a third mirror, or — if the lane genuinely cannot
  import it (ADR-011 addendum) — the fixture SHALL be copied by a
  checked step that fails when the copy drifts. A third hand-mirror
  with nothing comparing it is what this card exists to end.
- THE GENESIS VARIANT SHALL CARRY `snapshot?: DocsSnapshotPayload |
  null`, and ONE lane spec SHALL `applyPickOutcome` a genesis outcome
  CARRYING the `streak` fixture's tree and assert the pane's artifact
  rows render with **no `docs-changed` push at all**. The fixture
  already exists (`app/test/fixtures/genesis/streak/docs`, already
  loaded by `genesis-screen.spec.ts`) (T-042-s1).
- THE LENS-SCROLL ASSERTION SHALL ASSERT THE PROPERTY IT MEANS.
  `interview.spec.ts:363` reads
  `expect(paneLayout.scrollHeight).toBeGreaterThan(paneLayout.clientHeight)`
  at every viewport at or above 1024, and at 1440x900 there is
  **zero** margin — the verifier's own probe, differing only by a
  project dir one character longer, measured the lens region at
  **780 / 780**, so `toBeGreaterThan` fails while nothing is wrong
  with the screen (1024x768: 25px of margin; 1280x720: 57px;
  1440x900: **0**). Assert `overflow-y: auto` AND a `clientHeight`
  bounded by the column, keeping the strict comparison only where
  headroom is guaranteed. "This region scrolls when there is
  something to scroll" is the claim; a region with nothing to scroll
  is not a failure of the frame (T-027-s5).
- THE FRAGILITY SHALL BE NAMED IN A COMMENT so the next person to add
  a row to `streak` or change a line-height does not spend a session
  bisecting a frame that is fine. **Read this beside T-062**, which
  changes the shell's scroll model and will move these numbers: if
  T-062 lands first, re-measure the table rather than trusting these
  three rows.
- NO new IPC, no new command, no wire-shape CHANGE — this card
  compares what exists.

Verification: headless — bare `cargo test` from app/src-tauri/,
`npx vitest run` from app/, `npm test` from tools/e2e, plus a
deliberate field rename at EACH of the three ends shown red and
reverted. @human: none.

## Implementation notes

## Verdicts
