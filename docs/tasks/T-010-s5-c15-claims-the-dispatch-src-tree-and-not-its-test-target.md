---
id: T-010-s5
title: C-15 claims app/src-tauri/src/dispatch/** and not its tests/ target, so T-110's suite lands as unmapped territory
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

T-010 drains the D2 unmapped bucket to zero by settling the five `.rs`
files that had no component. **The very next lane re-opens it**, and the
two cards are live at the same time, so this is worth writing down before
either merges rather than discovering it at a regen.

`docs/architecture/components/C-15-dispatch.md` declares

    paths:
      - app/src-tauri/src/dispatch/**
      - app/src/lib/dispatch-store.ts

Read at T-010's tip, `task/T-110-lane-reader` adds
`app/src-tauri/src/dispatch/lanes.rs`, `app/src-tauri/src/dispatch/mod.rs`,
`app/src/lib/dispatch-store.ts` **and
`app/src-tauri/tests/dispatch_lanes.rs`**. The first three match C-15's
globs; the fourth matches nothing. Before T-010 that did not matter,
because no `.rs` was territory at all. After T-010 it does: an integration
test under `app/src-tauri/tests/` is walked, mapped and — with no claimant
— becomes an unmapped file, one D2 finding, and a red on
`app/test/architecture-dogfood.test.ts`'s `unmappedFiles` assertion.

**The precedent is already set and is one line.** T-010 put C-14's own
integration suite (`app/src-tauri/tests/agent_runner.rs`) under C-14, on
the rule that a component's suite belongs to the component it exercises —
the same rule that puts `app/test/**` under C-05. C-15 wants the mirror:

      - app/src-tauri/tests/dispatch_lanes.rs

Two notes for whoever writes it. The path is a live lane's file, so this
cannot be settled by guessing at the name — re-read T-110's branch first,
because a test target's filename is the executor's choice and may have
moved. And a `paths:` glob that matches nothing is INTENT rather than a
defect (the dogfood suite asserts exactly that for C-15 today), so
declaring the path BEFORE T-110 merges is legal and costs nothing.

**Fence: `[docs/architecture/components/]`** — free at the time of
writing, and disjoint from T-110's `[app-dispatch]`.
