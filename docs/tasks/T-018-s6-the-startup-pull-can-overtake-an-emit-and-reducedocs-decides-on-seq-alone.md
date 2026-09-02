---
id: T-018-s6
title: The startup `docs_snapshot` pull can overtake a `docs-changed` emit and `reduceDocs` decides on `seq` alone, so the same older-read-wins overwrite T-018-s5 closed on the pick reply is still open on the emit path
feature: F-02
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-018-s5
blocked_by: []
touches: [app/src/lib/watcher-store.ts, app/src/lib/docs-model.ts, app/test/watcher-store.test.ts, app/test/docs-model.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-018-s5`** (the ordinary pick's reply overwrote an emit
that overtook it) — same class, a different door, and this is the half
that card's fence could not reach. Filed as its SWEEP, not as a repeat:
T-018-s5 fenced `app/src/lib/watcher-store.ts` and its test alone, and
the decision this card is about lives one layer down in
`app/src/lib/docs-model.ts`.

## What the sweep found

T-018-s5 closed the overtake on the `"picked"` branch of
`reducePickOutcome` by asking `switchIsOvertaken`, which reads BOTH
stamps Rust sends: `seq` (drawn by `WatchState::next_seq` BEFORE the
collect, so it dates the START of a collection) and `generatedAtMs`
(stamped by `snapshot_from` from `now_ms()` AFTER the walk returns, so it
dates the reading itself). Every OTHER site that decides "is this payload
newer?" still reads `seq` alone:

- `reduceDocs` — `app/src/lib/watcher-store.ts`, `if (payload.seq <=
  prev.seq) return prev` — and its two remaining callers,
  `applyDocsPayload` (the `docs-changed` emit path) and
  `applyProjectStatus`'s `"open"` branch (the startup `docs_snapshot`
  pull).
- `applySnapshot` — `app/src/lib/docs-model.ts`, the same rule one layer
  down, which is where a fix would have to land to serve both.

**THE RESIDUAL IS NARROWER THAN T-018-s5's AND IT IS NOT EMPTY.** Two
`docs-changed` emits cannot overtake each other: `handle_fs_batch` draws
its seq, collects and sinks on ONE debouncer thread, so emits are
produced in order. But `docs_snapshot` runs on a command thread and takes
its seq from the same global counter (`project_status` ->
`build_snapshot(&root, state.next_seq())`), so the startup pull can draw
a seq AFTER an emit drew its own, finish its walk FIRST, and hand
`reduceDocs` a higher-seq older read that overwrites the emit's newer
tree — the T-018-s5 defect with the pick reply swapped for the pull. The
watcher-store comment at `commitPickOutcome` already reasons about this
race and concludes the seq guard settles it; that conclusion is the one
T-018-s5 measured to be false for the pick, and nothing about the pull
makes it truer.

## Why it was not built with T-018-s5

Out of that card's fence in two ways: `app/src/lib/docs-model.ts` is not
in its `touches`, and `reduceDocs`'s guard is the T-007 stale-drop
invariant that every emit, every startup pull and both switch branches
sit on — a change there is a wider blast radius than a size-S pick-branch
guard, and it deserves its own card and its own drills rather than
riding one.

## What a fix would have to answer

1. Whether the clock comparison belongs in `applySnapshot` (serving
   `reduceDocs` and therefore every caller at once) or stays at the
   call sites, given that `applySnapshot` is also the harness's entry
   point and a harness composes `generatedAtMs` freely.
2. What a payload with a `generatedAtMs` of 0 means — pre-T-042 fixtures
   and the dev harness both mint them — since an incoming 0 compares as
   older than everything and would be dropped by a naive `<`.
3. Whether the startup pull should simply stop competing: it exists to
   settle the subscribe-then-pull race, and a pull that ARRIVES stale is
   a different repair from a pull that is COMPARED correctly.

## What is deliberately NOT in this card

`reduceGenesisEvent` (`app/src/lib/agent-store.ts:378`) also returns
`prev` on `event.seq <= prev.seq`, and it is CORRECT as written: genesis
turn events carry no collection and no reading time, and one ordered
producer mints them, so `seq` is the only reading they have and the
"stamp dates the start of a collect" argument does not reach them. Named
here so the next sweep does not re-open it. The same goes for the
snapshot-less genesis arm's `Math.max(switched.seq, outcome.seq)`: no
collection produced it, so there is no content time to compare.
