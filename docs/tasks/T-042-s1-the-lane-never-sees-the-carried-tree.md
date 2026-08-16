---
title: The real-input lane never sees the carried tree — its genesis specs drive only the empty shape
status: suggested
suggested_by: executor claude-opus-5 @T-042
---

T-042 criterion 1 makes a genesis switch carry the folder's existing
docs tree. Every proof of it is headless-vitest: cargo through the
watcher, and jsdom through the real App with the IPC boundary mocked.
**The one lane that drives a real browser sees none of it.**

Two reasons, both structural rather than accidental:

1. `tools/e2e/fixtures/shell.ts` holds a HAND-WRITTEN COPY of
   `PickOutcomePayload` (T-041-s2's finding — "pinned in Rust and
   mirrored by hand in TS with nothing comparing them", and this is now
   the third mirror of the same union). Its genesis variant is
   `{ kind, projectDir, seq, probe }` with no `snapshot` field. T-042
   deliberately declared the app-side field OPTIONAL so this copy would
   keep compiling and T-045's lane would not have to be touched
   mid-flight — which worked, and cost the lane its view of the change.
2. All four `kind: "genesis"` literals in
   `tools/e2e/tests/genesis-screen.spec.ts` (:46, :71, :171, :276) and
   the one in `accelerators.spec.ts:135` therefore exercise the
   snapshot-less shape only. `genesis-screen.spec.ts` reaches T-024's
   lens by pushing a SEPARATE `docs-changed` snapshot afterwards, which
   is the pre-T-042 route and stays valid — so the lane is green and
   silent about the new one.

What that costs, concretely: `genesis-screen.spec.ts:165` asserts the
screen does NOT say "nothing written yet". That assertion passes today
via the docs-changed route. The route T-042 added — the tree arriving ON
the switch, with no fs event at all — has never been rendered by a real
browser, in either scheme, at any viewport.

Cheapest honest fix, and it is small:
(a) add `snapshot?: DocsSnapshotPayload | null` to
    `tools/e2e/fixtures/shell.ts`'s genesis variant; and
(b) one spec: `applyPickOutcome` a genesis outcome CARRYING the streak
    fixture's tree, and assert the pane's artifact rows render with no
    `docs-changed` push at all. The fixture already exists
    (`app/test/fixtures/genesis/streak/docs`, which
    `genesis-screen.spec.ts` already loads).

Worth folding into T-045 if it is still open, or into whichever task
next touches the lane. The deeper problem — three hand-mirrors of one
Rust enum with nothing comparing them — is T-041-s2's and is not
re-filed here.
