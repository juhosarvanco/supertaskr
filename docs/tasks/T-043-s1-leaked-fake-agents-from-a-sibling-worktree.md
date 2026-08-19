---
id: T-043-s1
title: Two orphaned fake_agent processes from nputer-T-060 are alive on this machine, and the briefing's "five orphaned nputer binaries" did not reproduce
status: suggested
suggested_by: executor claude-opus-5 @T-043
---

Recorded because T-043 is the card about leaked processes, and a claim
about live leaked processes is evidence to reproduce rather than to
repeat.

**What the dispatch briefing said:** five orphaned `target/debug/nputer`
processes, ppid 1, started 04:17–04:21, from the boot check's child-exit
path (T-046-s1's finding, T-061's fix).

**What is actually alive (measured 2026-08-19, `ps -eo pid,ppid,lstart,command`):**

| pid | ppid | started | command |
|---|---|---|---|
| 64161 | **82364** | Tue Aug 18 16:39:01 | `target/debug/nputer` |
| 52504 | **1** | Tue Aug 18 16:21:18 | `…/nputer-T-060/app/src-tauri/target/debug/fake_agent -p --output-format stream-json …` |
| 52505 | **1** | Tue Aug 18 16:21:18 | `…/nputer-T-060/app/src-tauri/target/debug/fake_agent -p --output-format stream-json …` |

So: **one** `target/debug/nputer`, not five; and it is **not an orphan** —
ppid 82364 is the human's own `node …/.bin/tauri dev`, i.e. that process
is the running app, exactly where it should be. No `target/debug/nputer`
on this machine has ppid 1.

**The two genuine orphans are a different binary from a different
worktree.** They are `fake_agent` — the TEST fixture — under
`/Users/ujju/Projects/nputer-T-060`, reparented to init, and they carry
the runner's full planner argv (`-p --output-format stream-json
--include-partial-messages --verbose --permission-mode acceptEdits
--allowedTools Bash(git init:*) … --disallowedTools WebFetch WebSearch`).
That argv is what `adapter::argv` assembles, so these were TURN CHILDREN
spawned through the runner's spawn path — direct children, not
grandchildren (the `grandchild` scenario is spawned with no arguments at
all). They outlived the cargo test process that created them.

**What that is and is not.** It IS the failure class this card is about:
a turn child that nothing reaped. It is NOT evidence that the shipped
kill path leaks, and it is not attributable to T-060's merged change
without more work than this card owns — a hand-run probe, a killed test
process, or a `SIGKILL`ed harness would all produce the same picture, and
the T-060 lane is exactly where hand-run kill-path probes would have
happened. What can be said flatly is that **two SIGTERM-cooperative fake
agents from a test tree have been running for a day**, which is what the
RAII cleanup guard added to `tests/agent_runner.rs` in this card exists to
make impossible for anything T-043 spawns.

**Not acted on, deliberately.** Signalling arbitrary pids is blocked in
the executor environment, and killing another lane's processes is not an
executor's call. This is a @human delete-or-keep decision, in the same
family as the stray `nputer-t025-realsmoke-*` directories STATE.md
already carries.
