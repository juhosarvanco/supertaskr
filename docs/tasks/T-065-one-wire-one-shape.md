---
id: T-065
title: One wire, one shape — the picker/status payload is compared, not mirrored three times
feature: F-02
milestone: 4
priority: 30
size: M
status: planned
blocked_by: [T-057, T-058]
touches: [app-shell, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-064-s4, T-064-s3 — files removed in this commit.

Absorbs T-041-s2 and T-042-s1 (triage 2026-08-17). T-042-s1 names the
shallow symptom of T-041-s2's missing comparison. T-027-s5 is no longer
absorbed: T-028 implemented its scroll-property assertion at `286fd2c`, and
T-065 only preserves that gate.

Also absorbs T-051-s8 (fourth triage, 2026-08-19); its suggestion file
is removed in the same commit as this line. **The lens region's content
height is a function of the artifact ROW COUNT and the lens's width —
nothing else.** Three sessions measured that region at 1440x900 and got
three answers; the mechanism now explains all three. Measured at
`f60b3e8` in the exact scenario the frame test drives, fonts confirmed
loaded:

    streakFixture (9 files)     9 rows   970/648  886/600  858/780  margin 78  strict > PASS
    streakMidInterview (6)      7 rows   876/648  792/600  780/780  margin  0  strict > FAIL

The second row was produced by dropping `docs/tasks/` from the same
fixture — T-028's exact subtraction — and it lands on 780/780, the
precise cell T-028 reported going red. Artifact rows are 40px tall on a
47px pitch, so two rows out of the lens is 78px out of the content,
which is the whole of the margin.

**T-027-s5's conclusion is vindicated and its stated lever is not.** s5
attributed its 780/780 to a project dir one character longer than the
spec's. Both dirs were measured here against both fixtures at all three
viewports and **every cell is identical** — one extra path character
moves nothing. T-051-s2 filed the same non-reproduction as "T-027
measured wrong" and has been REJECTED as superseded by this measurement.

So T-065's criterion preserving that gate SHALL name CONTENT VOLUME as
the mechanism rather than any property of the path, and SHALL keep the
split T-028 already shipped — "bounded at every size" as the frame's
property, plus "scrolls where content genuinely exceeds the box" — which
is the shape that survives a fixture change.

`PickOutcome` and `ProjectStatus` cross IPC as JSON and are mirrored by hand
three times. Rust owns the native enums; its current test fully pins three
specimens but checks only the `ProjectStatus::NoDocs` tag, not that status's
complete shape. `app/src/lib/watcher-store.ts` declares the shipped TS mirror.
`tools/e2e/fixtures/shell.ts` declares a third unchecked mirror. Rename one
field coherently at any one end and all local suites can stay green while the
real boundary quietly stops understanding it.

The lane is already blind because of that drift. Re-derived at 2026-08-18
preflight: its genesis variant is still `{ kind, projectDir, seq, probe }`
with no `snapshot`, and **ten** genesis literals across **seven** E2E specs
therefore omit the tree Rust now carries. The browser's genesis-screen route
still obtains artifact rows through a later `docs-changed` push, so it does not
prove T-042's switch-time snapshot path.

## Acceptance criteria
- ONE committed `app/test/fixtures/picker-status-wire.json` corpus SHALL carry
  ten deterministic specimens and every emitted key: all three
  `ProjectStatus` variants (`noProject`, `noDocs`, `open`) and all seven
  `PickOutcome` variants (`cancelled`, `busy`, `noDocs`, `error`, `picked`,
  genesis with a null snapshot, genesis with a full snapshot). Nested probes
  and snapshots SHALL include `skipped`, `skippedTotal` and `truncated`.
- THE Rust test SHALL compile-time-embed that fixture, serialize all ten native
  variants and compare semantic JSON values. One vitest SHALL JSON-round-trip
  the same fixture and feed its exact picker/status values to
  `reducePickOutcome` and the shipped DEV harness's `applyProjectStatus`.
  Production SHALL perform no fixture or checkout read.
- `tools/e2e/fixtures/shell.ts` SHALL statically import the same fixture rather
  than hand-declare a third mirror. Add `resolveJsonModule` only to the tools
  tsconfig. The fixture is a test asset, never a served-app/runtime read.
- THE tools genesis variant SHALL carry `snapshot?: DocsSnapshotPayload |
  null`. One lane spec SHALL apply a genesis outcome carrying
  `streakMidInterview(10, GENESIS_DIR)` and assert its artifact rows render
  with **no `docs-changed` push at all**. Outcome and snapshot SHALL share seq
  10; the full streak tree is not used because it now contains tasks and
  correctly renders the board.
- T-028's existing lens-scroll property and fragility comment SHALL remain:
  overflow is auto, client height is bounded, and strict overflow is required
  only where the fixture has headroom. T-065 adds no duplicate scroll test.
- NO new IPC, command or wire-shape change may occur. This card compares what
  exists; it does not generalize the separate `DocsSnapshotPayload` mirror.
- EVERY new/changed assertion SHALL be poisoned red. Mutants SHALL include a
  Rust field rename, Rust tag rename, omitted genesis snapshot, coherent app
  picker/status field renames, a tools adapter field rename, a null carried
  snapshot, and a canonical-fixture add/remove/rename. Restore exact bytes.

Verification: headless — bare Rust, app build/types/full vitest, tools
typecheck/full E2E, token lint/selftest, the mutation matrix above, graph
regeneration/currentness and boot gate. The new JSON SHALL be staged before
T-058's CONTROL corpus is counted. @human: none.

## Implementation notes

## Verdicts
