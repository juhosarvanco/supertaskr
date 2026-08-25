---
id: T-110-s11
title: two cards carrying one task id produce two rows, and both spellings of the join's contract say otherwise
status: suggested
suggested_by: verifier claude-opus-5 @T-110-verify2
---

Measured in T-110's second verification, in a temp directory over a
repository built by real `git worktree add` — no board this project
wrote. `join_lanes` iterates the BOARD and pushes one row per CARD, so
two cards carrying one id produce two rows with the same `task_id`:

    board = [BoardStamp("T-110", "building"), BoardStamp("T-110", "done")]
    lanes = one real worktree on task/T-110-a

    rows -> [("T-110", Live), ("T-110", StampSkipped)]

**Both written statements of the contract say this cannot happen**, so
the disagreement is with the code's own documentation rather than with a
criterion. `DispatchJoin::Joined.rows` in
`app/src-tauri/src/dispatch/join.rs`: *"One row per task id, sorted by
task id"*. And `hydrateJoin` in `app/src/lib/dispatch-store.ts`: *"A
duplicate task id on the wire **would be a defect in the producer** —
`join_lanes` emits one row per id — and the last one would win here.
That is stated rather than guarded, because a guard would be a second
opinion about the producer's invariant."* The producer's invariant is
one row per BOARD ENTRY, not one row per id; the guard was declined on a
premise that does not hold, and `rows.set(row.taskId, row)` then drops
the first row in silence — the loss this card forbids one layer down.

**WHY IT IS NOT A REJECTION AND WHY IT IS NOT NOTHING.** It is not an
acceptance criterion, and the condition is already surfaced elsewhere:
`lib/parser/src/project.ts` emits a `duplicate-id` issue naming both
files, so a board with two `T-110` cards lights the parse-error badge
before this join ever runs. But T-110's own ethic is that a reader must
never drop what it cannot classify, and this is the one place in the
change where something is dropped without being reported.

Three dispositions, ranked:

1. **Correct the two comments** and leave the behaviour. Cheapest and
   honest: say the producer emits one row per board entry, and that a
   duplicate id upstream yields duplicate rows which `hydrateJoin`
   collapses last-wins. Zero risk, and it stops the tree asserting a
   property it does not have.
2. **Report it rather than collapse it** — a `duplicate_ids: Vec<String>`
   beside `not_lanes`, which is the shape this module already uses for
   "carried, never dropped". Small, and it keeps the ethic.
3. **Group the board half the way the lane half is already grouped.**
   `lanes_by_task` is a `BTreeMap<String, Vec<LaneRegistration>>`
   precisely because two branches can carry one id; the card half has no
   such shape. Making `DispatchRow.card` a list, or keying the board pass
   by id and folding, would make the two halves symmetrical — and is a
   bigger change than this finding is worth on its own.

`app/src-tauri/src/dispatch/join.rs` and `app/src/lib/dispatch-store.ts`,
fence `[app-dispatch]`. Reproduced at `2b20ea8`.
