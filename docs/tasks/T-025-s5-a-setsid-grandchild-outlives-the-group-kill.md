---
id: T-025-s5
title: A grandchild that calls setsid() survives genesis_cancel — the boundary of "child processes SHALL not outlive the app"
status: suggested
suggested_by: verifier claude-opus-5 @T-025
---

T-025 §5 states the kill guarantee without a qualifier: "the child is
spawned into its own process group; cancel sends SIGTERM to the group …
**no orphaned grandchildren** (the CLI's own tool subprocesses die with
the group)". The parenthetical is the true scope; the headline is
wider than the mechanism can be.

**Re-derived, not argued.** The verifier built a double-forking fake
whose grandchild calls `setsid()` before sleeping, drove it through
`genesis_start` and `genesis_cancel`, and measured:

    child_alive=false  escapee_alive=true
    child_pid=72417  escapee_pid=72418  escapee_pgid=72418

The escapee left the turn's process group (its pgid is its own pid),
so `killpg(pgid, …)` never reaches it. The direct child died correctly;
the builder's own grandchild test passes because ITS grandchild stays
in the group, which is the honest case for the CLI's tool subprocesses.

**This is a property of process groups, not a defect in the code.** No
portable mechanism prevents a descendant from leaving a group: that is
what `setsid()` is for. The alternatives all cost more than this task's
fence allows — a macOS/Linux sandbox or cgroup, a job object on
Windows, or a supervisor process.

**Practical exposure today: essentially nil.** Nothing in the
six-pattern Bash allowlist daemonizes (`git init/add/commit/status`,
`mkdir`, `cp`), and a model cannot forge the CLI's own process
topology. The exposure grows if the allowlist ever gains a verb that
backgrounds work (`npm`, `make`, anything with `&`) — see T-025-s4.

**What to do, in order of cost:**

1. **Record the qualifier.** §5's sentence should read "no orphaned
   grandchildren that stay in the group", and the silences list should
   gain this alongside the SIGKILL-of-app orphan already named there.
   That is the whole ask if nothing else is taken.
2. **A descendant sweep, if it is ever worth it.** The only reliable
   window is BEFORE the kill: snapshot the child's descendants
   (`pgid`/`ppid` walk) while the child is still alive, `killpg`, then
   sweep the snapshot for survivors. After the direct child dies the
   escapee is reparented to launchd/init and the chain is gone, so a
   post-hoc walk cannot find it.

Belongs wherever the kill semantics are next opened — F-04's
multi-agent work, or whichever task first widens the allowlist.
