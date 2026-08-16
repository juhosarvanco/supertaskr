---
id: T-025-s7
title: The 5 s kill grace is always paid in full — `kill(pid, 0)` is true for a zombie, so a cancel blocks the latch and app quit blocks the main thread
status: suggested
suggested_by: verifier claude-opus-5 @T-025
---

`terminate_group(pid, grace)` SIGTERMs the group, then polls
`pid_alive(pid)` — `kill(pid, 0)` — every 25 ms until either the pid
goes away or the grace expires, then SIGKILLs. The escalation works:
the verifier drove a child that installs `SIG_IGN` for SIGTERM and it
was SIGKILLed after the grace, reaped, no zombie left behind.

**But the poll can never exit early**, because the turn's child is our
own unreaped child: from SIGTERM until `child.wait()` it is a ZOMBIE,
and `kill(pid, 0)` returns 0 for zombies. `run_turn` only calls
`child.wait()` AFTER `terminate_group` returns, so the loop always runs
the full grace even when the child died on the first signal. The
executor knew the zombie property — it is written into the exit-hook
test's comment — and applied it to that test's assertion ordering, but
not to the grace loop.

**Measured**, with a fake that dies on the first SIGTERM and a 3 s
grace:

    VGRACE: grace=3s  latch free after 3.035s  (child dies on first SIGTERM)

Production `kill_grace` is 5 s, so:

- **after `genesis_cancel`, `genesis_start`/`genesis_send_turn` answer
  `busy` for ~5 s.** The single-flight guard travels into the turn
  thread and is released when that thread ends, which is after
  `terminate_group`. T-027's "cancel, then retype" is the flow that
  meets this.
- **quitting the app mid-turn blocks the MAIN THREAD for ~5 s.**
  `RunEvent::ExitRequested`/`Exit` calls `AgentState::reap_for_exit()`
  synchronously, which calls the same blocking `terminate_group`. The
  child is already dead by then; the app just sits there. This is worth
  watching for in the @human `tauri dev` quit-the-app check, which is
  the only place it will be seen — the headless test only asserts that
  nothing survives, not how long it took.

Nothing is unsafe here and nothing leaks; it is latency, and it is on
the two paths a user actually feels.

**Fix, small and local:** give the poll a way to know the child was
reaped. Either

1. have `run_turn` own the escalation — `child.try_wait()` in the poll
   loop instead of `pid_alive`, so the reap and the poll are the same
   loop; or
2. pass a `&mut Child` (or a `Fn() -> bool` reaped-predicate) into
   `terminate_group`, leaving the current pid-only form for the
   grandchild sweep where `kill(pid, 0)` is the right probe.

`terminate_group_async`'s background thread has the same shape, but it
does not hold the caller, so it only matters for how promptly SIGKILL
escalates.
