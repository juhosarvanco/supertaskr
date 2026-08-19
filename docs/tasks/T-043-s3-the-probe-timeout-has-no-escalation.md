---
id: T-043-s3
title: A probe that ignores SIGTERM hangs genesis permanently — run_with_timeout kills without escalating and then waits forever
status: suggested
suggested_by: executor claude-opus-5 @T-043
---

Found while re-deriving the kill path for T-043, in the same file and a
different code path, so it is filed rather than fixed — T-043's criteria
are about the TURN's child, and widening a kill-path card into the
resolver's probe path is how a fence stops meaning anything.

`run_with_timeout` (`app/src-tauri/src/agent/runner.rs`, the
`Ok(None)` arm of its poll loop) is the whole of the timeout handling for
both one-shot probes — the `$SHELL -l -c` login probe and
`<binary> --version`:

```rust
if Instant::now() >= deadline {
    kill_group_now(pid);   // SIGTERM to the group. That is all.
    let _ = child.wait();  // …then block, with no deadline of its own.
    return None;
}
```

`kill_group_now` sends **SIGTERM and nothing else** — there is no grace,
no SIGKILL, no second look. So a probe process that ignores SIGTERM is
not killed, and the very next line waits for it **without a bound**. The
`probe_timeout` (10 s in production) bounds how long the probe is allowed
to RUN; it does not bound this function.

**The consequence is not a slow start, it is a dead genesis.**
`start_genesis` takes the single-flight latch (`begin_turn`) before it
resolves, and `TurnInFlight` releases on Drop — which never happens if the
call never returns. Every later `genesis_start` answers `Busy`, for the
life of the app process, with no error, no event and nothing on screen
that says why. The turn path cannot reach this state: T-043 gave it a
grace, a SIGKILL and a group-membership check.

**Reachability, stated honestly.** The two programs that get here are the
user's `$SHELL` (absolute, executable, and name-checked to zsh/bash/sh
since T-060) and the resolved agent binary run with `--version`. None of
the three shells ignores SIGTERM by default, so this needs an unusual
machine — a wrapper script installed as `/bin/zsh`, a `--version` path
that is not the CLI, a stopped process. Low likelihood, unbounded
consequence, and the fix is small: reuse the turn path's shape
(`terminate_group_owning` with the probe's own grace) instead of the
bare SIGTERM, which also gives the probe a typed "it would not die"
outcome rather than silence.

Suggested size S. It touches `app-agent` only.
