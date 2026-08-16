---
id: T-041-s2
title: The picker/status wire shape is pinned twice and compared never — the harness makes the gap worth closing
status: suggested
suggested_by: executor claude-opus-5 @T-041
---

`PickOutcome` and `ProjectStatus` cross the IPC boundary as JSON and are
mirrored by hand THREE times now:

- Rust emits them, and `genesis_and_no_docs_wire_shapes_are_pinned`
  (app/src-tauri/src/docs_watch.rs:2641) asserts the serialized JSON
  literally — `{"kind":"genesis","projectDir":…,"seq":…,"probe":{…}}`
  and the two `noDocs` shapes, probe field for probe field;
- `app/src/lib/watcher-store.ts` declares the TS mirror
  (`PickOutcomePayload`, `ProjectStatusPayload`, `PlanProbePayload`),
  with a comment naming Rust as the source of truth;
- since T-041, `tools/e2e/fixtures/shell.ts` mirrors the mirror, because
  tools/e2e imports neither package (ADR-011 addendum) — the same shape
  `fixtures/board.ts` already copies for `DocsSnapshotPayload`.

Each end is pinned. **Nothing compares them.** Rename a field Rust-side
and the Rust pin goes red (good) — but rename it in the TS mirror
instead, or in the lane's copy, and every suite stays green while the
shipped app silently stops understanding what Rust sends. The board path
has partial cover by accident (a `DocsSnapshotPayload` drift breaks the
real dogfood suites), but the picker/status path has none: no test in
the repo feeds a byte of Rust-produced JSON into the TS reducers.

T-041 makes this worth closing rather than merely noting, because the
shell harness raises the stakes both ways. Three served-bundle specs now
assert that the shell reaches every phase — and they assert it against
payloads a TypeScript file made up. That is exactly the right proof of
the SHELL and no proof at all of the WIRE, and the gap is now load-bearing
for T-027/T-028/T-029, which will each write specs on this surface.

Cheapest honest fix, in rough order of cost:

1. **Emit the pin.** Have the Rust pin write its `serde_json::Value`s to
   a fixture file (or add a `#[test]` that compares against a committed
   `docs/…/wire-shapes.json`), and have one vitest test feed those exact
   bytes to `reducePickOutcome` / `applyProjectStatus`. One file, two
   readers, drift is red at whichever end moved.
2. **Type-level only**: a TS test that structurally checks the mirror
   against a hand-copied literal of the Rust pin. Cheaper, weaker —
   still two hand-copies, just adjacent ones.
3. **Do nothing, and say so**: rule that the Rust pin plus code review is
   the contract, and record that in CONVENTIONS beside the "declaring a
   component moves three fixtures" gotcha, so the next person mirroring
   a payload knows there is no machine check behind them.

Not blocking T-041: the harness deliberately adds no IPC and changes no
wire shape, so it neither creates nor widens this gap — it only makes it
easier to mistake shell coverage for wire coverage.
