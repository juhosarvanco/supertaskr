---
id: T-043-s5
title: A probe child is never registered in the child slot, so reap_for_exit cannot reach it — a SIGTERM-immune probe outlives the app, which the just-corrected guarantee does not cover
status: suggested
suggested_by: verifier claude-opus-5 @T-043
---

Found by the T-043 adversarial verifier while judging whether T-043-s3
was rightly left outside this card's fence. It was — but s3 states its
consequence one step short, and the missing step lands on the exact
sentence T-043 spent the card correcting.

**The mechanism.** `child_slot` is written in exactly one place —
`app/src-tauri/src/agent/runner.rs:1584`, inside `run_turn` — and read in
exactly two, `AgentState::reap_for_exit` (`agent/mod.rs:245`) and
`agent::cancel` (`agent/mod.rs:766`). `run_with_timeout`
(`runner.rs:861`) spawns its own child into its own process group
(`process_group(0)`) and never registers it anywhere:

```
$ git grep -n "child_slot.lock" -- app/src-tauri/src
app/src-tauri/src/agent/runner.rs:1584:    *child_slot.lock()… = Some(handle.clone());
app/src-tauri/src/agent/runner.rs:1849:    *child_slot.lock()… = None;
```

So the app-exit hook has nothing to signal for a probe. Combined with
T-043-s3 — `run_with_timeout` sends SIGTERM and nothing else, then waits
unbounded — a probe process that ignores SIGTERM survives BOTH the
timeout and the app's exit.

**Why this belongs beside T-043 rather than only inside s3.** T-043's
criterion 7 corrected the guarantee "everywhere it is live" to *no
orphaned descendant that stays in the group*. That correction narrowed
the claim in the `setsid()` direction, which is real and measured. It did
not narrow it in this direction, and this direction is a plain
same-group child of our own process that no exit path can see. The
corrected sentence in `agent/mod.rs:216`, `lib.rs:512` and T-025 §5 is
therefore still slightly wider than the mechanism, for a second and
independent reason.

**A second, smaller hole in the same loop.** `run_with_timeout`'s
`Err(_) => return None` arm returns without killing and without reaping,
so a `try_wait` error abandons the child outright. s3 quotes only the
deadline arm.

**Reachability is the same as s3's** and is low: the two programs that
reach `run_with_timeout` are the user's `$SHELL` (name-checked to
zsh/bash/sh since T-060) and the resolved agent binary run with
`--version`. None ignores SIGTERM by default.

**Recommendation.** Fold this into whatever card fixes s3, and fix them
together: give the probe path the turn path's shape
(`terminate_group_owning` with the probe's own grace), and either
register the probe child in a slot the exit hook can reach or state
explicitly, in the same comment blocks T-043 corrected, that the
guarantee covers TURN children only.

Suggested size S, absorbed by T-043-s3 if that is scheduled. Touches
`app-agent` only.
