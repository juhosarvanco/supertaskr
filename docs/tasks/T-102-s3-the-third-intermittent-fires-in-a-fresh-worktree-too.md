---
id: T-102-s3
title: STATE's third intermittent fires in a FRESH worktree with a small target dir, which is the one place the slow-checkout hypothesis said it would not
status: suggested
suggested_by: executor claude-opus-5 @T-102
---

**STATE's "Next up" item 3 asks for the `T-088-s4` treatment of
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
rather than another sighting. This is not another sighting — it is a
data point in the one place the leading hypothesis predicts a green.**

## The hypothesis, and what it predicts

STATE's account of `T-088-s4` is measured and convincing: main's
checkout has an 8.7 GB `target/`, the lib test binary is byte-identical
across the experiment and runs ~4x slower there, and the bodies that red
are the ones with wall-clock deadlines. The corollary STATE states in
terms is:

> A lane worktree and a poison drill both start with a small target dir
> and see green; main's checkout has been accumulating since the project
> began and sees red.

**So a fresh drill worktree with its own small `CARGO_TARGET_DIR` is
where this family should NOT fire.**

## What was observed

T-102's poison drill ran in `/Users/ujju/Projects/drill-T-102`, a
detached worktree cut at `023ab3b`, outside the repository, with
`CARGO_TARGET_DIR` inside itself — a cold, small target directory, the
exact configuration STATE calls green. Across **thirteen** full
`cargo test --no-fail-fast` runs there (one clean baseline, eleven
mutants, one post-restore baseline):

- `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
  reddened in the run named **M6b**, alongside
  `the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`;
- the **IDENTICAL mutant re-run immediately afterwards** reddened
  neither, and only the mutant's intended target failed;
- neither body reddened in any other run, mutated or clean.

**The mutant could not have caused it, and that is derived rather than
asserted**: M6b reverses a `Vec<String>` inside
`TurnError::ToolDenied`'s construction. It cannot reach `send_turn`'s
`NoSession` outcome, the session registry, or a process-group reap. The
same-mutant re-run is the control, and it is the strongest form of one
— same source, same binary inputs, same machine, minutes apart.

## Why this is worth a card rather than a line in a checkpoint

1. **It weakens the single-variable story.** The target directory is
   not the only variable; parallel LOAD is. This drill ran the full
   workspace suite thirteen times in quick succession on a machine also
   holding four other lane worktrees and @human's app. A small target
   dir removes one source of slowness, not all of them.
2. **It reproduces the pairing STATE noticed.** The two bodies that
   reddened together here are BOTH deadline-bearing, and STATE records
   `a_hostile_session_id…` redding "in the SAME run as the watcher body
   and in neither of the two runs where the watcher body was green".
   Same shape, third body, different checkout. The common factor is a
   deadline, not a directory.
3. **It gives the controlled experiment a cheap arm nobody has run.**
   `T-088-s4`'s experiment held the tree constant and varied the target
   dir. The arm this suggests is the mirror: hold the target dir small
   and vary the PARALLELISM (`cargo test -- --test-threads=1` against
   the default), which is one flag and no worktree surgery.

## Disposition

STATE's own preferred fix for `T-088-s4` — *"(b) give the body a
deadline proportional to what it is waiting for, which fixes the symptom
in every checkout and is the smaller change"* — is the one this
observation argues for and (a) argues against. **Reclaiming main's 8.7 GB
would not have prevented what was measured here**, because there was no
8.7 GB.

Fence: `[app-agent]` for the two agent bodies
(`app/src-tauri/tests/agent_runner.rs`); the watcher body
`docs_watch::tests::startup_arm_watches_the_initial_root` is in
`app/src-tauri/src/docs_watch.rs` and is outside it, so a card covering
all three needs both.

**No suggestion file existed for this body before now.** STATE records
that T-110 and T-124 deliberately filed none, because filing at a
checkpoint moves the board counts that checkpoint derives — this is
filed from a LANE, where that objection does not apply.
