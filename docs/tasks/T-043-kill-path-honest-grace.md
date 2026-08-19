---
id: T-043
title: The kill path — an honest grace and an honest scope
feature: F-03
milestone: 3
priority: 6
size: M
status: done
blocked_by: []
touches: [app-agent, app-shell]
builder: claude-opus-5 @fresh
verifier: claude-opus-5 @fresh
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-025-s5, T-025-s7. Triage 2026-08-16: both are measured
properties of the same twenty lines (`terminate_group`/`pid_alive`,
runner.rs:573-630) and both were re-derived by T-025's verifier rather
than argued. One is latency the user feels on two paths; the other is
a sentence in the plan that is wider than the mechanism can be.
Re-derived after T-060 at checkpoint `7d94043` (architect triage
2026-08-18). The defect remains, but the original S card under-scoped the
proof: T-060 moved lines rather than kill semantics; the app-exit claim also
lives in `lib.rs`; and no permanent SIGTERM-resistant fixture exists. This is
M ceremony: executor, fresh adversarial verifier, integrator.

## Acceptance criteria
- WHEN a turn's direct child cooperates with SIGTERM THE child-owning path
  SHALL reap it DURING the grace poll rather than after `terminate_group`
  returns, and the turn latch SHALL release well inside the configured grace.
- EARLY release SHALL require BOTH the direct child reaped and its process
  group empty. If the child exits but a same-group grandchild ignores SIGTERM,
  the poll SHALL continue through the full grace and SIGKILL the survivor; a
  naive `child.try_wait()` followed by return is a regression.
- WHEN the direct child itself ignores SIGTERM THE system SHALL wait the full
  grace, SIGKILL it, reap it and leave no zombie.
- WHEN the app exits mid-turn with a cooperative group `reap_for_exit` SHALL
  complete well inside the grace through coordination with the worker that
  owns `Child`; production grace remains five seconds.
- `genesis_cancel` SHALL still return promptly, send SIGTERM synchronously,
  and retain background escalation. Concurrent cancel, exit and Drop
  observations SHALL remain idempotent.
- PERMANENT fake-agent scenarios and timing pins SHALL cover cooperative
  child/group, resistant direct child, and cooperative child plus resistant
  same-group grandchild. Tests SHALL own exact PIDs/process groups and SHALL
  guarantee cleanup even when an assertion or poison drill fails. The notes
  SHALL NOT claim the pre-task suite already covered resistant processes.
- THE kill guarantee SHALL be corrected everywhere it is live, not only in
  T-025 §5: T-025's acceptance/§5/silences, `agent/mod.rs`, `runner.rs` and
  `lib.rs` SHALL all say no orphaned descendants THAT STAY IN THE GROUP.
  Record the existing `setsid()` escapee measurement
  (`child_alive=false escapee_alive=true child_pid=72417
  escapee_pid=72418 escapee_pgid=72418`).
- A DESCENDANT sweep SHALL remain a deliberate non-goal. The selected CLI can
  create a new session and ancestry becomes undiscoverable after reparenting;
  the narrower current fact is that no planner-granted Bash pattern
  intentionally daemonizes. Revisit when that allowlist widens.
- THE T-025 plan-text off-by-one SHALL be corrected: §3's `(13 files, ~60 KB)`
  SHALL read 14, matching `KIT_FILES` and the parity walk.
- T-060's safety boundary SHALL hold during every test: no process-global
  mutation of `NPUTER_NO_REAL_CLI`, no ignored real smoke, no real CLI/model
  call, and no network. Use `binary_override`, the fake CLI and structural
  guard.
- EVERY new/changed test body SHALL be poisoned and shown red; process cleanup
  SHALL happen before deliberate failure or through an RAII guard, and all
  recorded PIDs SHALL be proven gone afterwards without broad `pkill`.

Verification: headless — bare cargo tests against the fake CLI plus repeated
timing bodies at test-thread counts 1, 4 and 8. Use a comfortably large grace
and broad relative bounds; prove old terminate-before-wait ordering reds the
prompt-death pins. Run offline audit and the boot gate because Rust app files
move. Graph regen does not fire unless an indexed TS/JS file moves. No real
model call or network. @human: the quit-mid-turn check becomes confirmation
rather than tolerance.

## Implementation notes

Executor `claude-opus-5 @fresh`; worktree `nputer-T-043`, branch
`task/T-043-kill-path`, based on `adb32c3`. Fence held: `app/src-tauri/**`
plus the task cards. **Zero bytes** under `app/src/**`, `app/test/**`,
`lib/**` or `tools/**`.

**Understanding, confirmed before anything was touched (CLAUDE.md).** The
grace poll asked one question — `kill(pid, 0)` — and that question is TRUE
FOR A ZOMBIE, so the turn's own unreaped child kept answering "alive" and
every cancel and every app quit paid the whole five-second grace even when
the CLI died on the first SIGTERM. The fix makes early release require TWO
facts, the direct child reaped AND its process group empty, so a
cooperative group leaves in milliseconds while a cooperative child with a
SIGTERM-ignoring same-group grandchild still runs the poll to the deadline
and still gets its survivor SIGKILLed — the regression a bare
`child.try_wait()` followed by `return` would introduce. The observers
(`genesis_cancel`, the exit hook, `Drop`) do not own the `Child` and may
not `waitpid`, so the coordination rides the shared `ChildHandle` the one
owning worker publishes to. Alongside the mechanism, the kill GUARANTEE is
corrected everywhere it is live to "no orphaned descendant that stays in
the group", with the `setsid()` escapee measurement recorded and a
descendant sweep named as a deliberate non-goal, and T-025 §3's kit count
goes from 13 to 14.

### The measurement the card rests on, taken first-hand

Before writing anything, on this machine (darwin 25.6.0, arm64), with a
`/bin/sleep` in its own process group plus a same-group grandchild:

| state | `kill(child,0)` | `kill(gc,0)` | `killpg(pgid,0)` |
|---|---|---|---|
| both running | 0 (alive) | 0 (alive) | 0 |
| child SIGTERMed, **not** waited — a ZOMBIE | **0 (alive)** | 0 | 0 |
| after `wait()`, grandchild still up | −1 | 0 | **0** |
| grandchild SIGKILLed, group empty | −1 | −1 | **−1, errno 3 (ESRCH)** |

Row two is the defect: `pid_alive` cannot distinguish "running" from "dead
and unreaped", and the turn's child is always our own unreaped child. Row
three is why the reap must come FIRST and the group question SECOND. Row
four is the ESRCH arm the new predicate turns on.

### What changed

- `runner.rs:1032` `signals::group_has_members` — `killpg(pgid, 0)`, with
  ESRCH (`runner.rs:1007`) as the ONLY "empty" answer; EPERM means somebody
  is there. Exported at `runner.rs:1058` so a test can ask about survivors
  directly instead of inferring them from one pid.
- `runner.rs:1092` `ChildHandle` is the coordination channel — `Clone`, not
  `Copy`, carrying an `Arc<AtomicBool>` the owner sets and the observers
  read. This is STATE.md's open question answered the second way it offered:
  coordinate with the worker rather than hand a second `Child` around.
- `runner.rs:1167` `terminate_group_polling` — the two-limb poll, returning
  `GroupExit { reaped, group_empty, escalated, waited }` (`runner.rs:1118`)
  so a test asserts the SHAPE of a kill and not only its aftermath. The
  escalation is guarded by group membership, never by the clock alone: once
  the direct child is reaped its pid is free for reuse and the pgid IS that
  pid, so SIGKILLing unconditionally at the deadline is a use-after-free of
  a pid number.
- `runner.rs:1214` `terminate_group_owning` (reaps via `try_wait` as it
  polls, publishes), `runner.rs:1256` `terminate_group_observing` (reads the
  flag), `runner.rs:1274` `terminate_group_async` (synchronous SIGTERM,
  observer poll on a background thread).
- `runner.rs:1829` the turn path uses the owning form; `runner.rs:1847`
  publishes after EVERY wait, happy path included.
- `mod.rs:243` `reap_for_exit` uses the observer form and logs the outcome;
  `mod.rs:774` `cancel` hands the handle to the async form.
- `bin/fake_agent.rs` — the permanent resistant fixtures: `sleeper` (92),
  `sleeper-resistant` (84), `hang-resistant` (157),
  `hang-resistant-grandchild` (169), `spawn_grandchild` (388),
  `announce_ready` (421), `ignore_sigterm` (438).

### Evidence per criterion

1. **Reap DURING the grace, latch released well inside it.**
   `tests/agent_runner.rs:758` (owner poll: `reaped`, `group_empty`,
   `!escalated`, `waited < 1000 ms` of a 3000 ms grace) and
   `tests/agent_runner.rs:930` (the latch, through `agent::cancel` +
   `settle`, `< 1000 ms` of 3000). Observed `waited` on the primitive body
   is 25–50 ms. Poison P1 restores the old terminate-before-wait ordering
   and both red.
2. **Early release needs BOTH limbs.** `runner.rs:1178`
   (`if is_reaped && empty` — the card said 1177; corrected at the merge
   by locating the symbol rather than trusting the line). The grandchild
   direction is
   `tests/agent_runner.rs:792` — the direct child cooperates and is reaped
   inside the poll, its grandchild ignores SIGTERM, and the body asserts
   `reaped && !group_empty && escalated && waited >= 800 ms`. Poison P3
   (`if is_reaped {` — the naive shape the card names) reds it and
   `tests/agent_runner.rs:1024`. The reaped direction is
   `tests/agent_runner.rs:879` arm two: the child IS reaped by somebody who
   does not publish, so the group is genuinely empty while the flag stays
   false, and the observer must still pay the full grace. Poison P4
   (`if empty {`) reds exactly that arm.
3. **A resistant DIRECT child: full grace, SIGKILL, reaped, no zombie.**
   `tests/agent_runner.rs:835` at the primitive level (asserts the reaped
   child's status is signal-killed and its pid is gone AFTER the wait) and
   `tests/agent_runner.rs:1073` end to end through `genesis_cancel`.
4. **App exit completes well inside the grace, by coordination.**
   `tests/agent_runner.rs:981` times `reap_for_exit` itself at
   `< 1000 ms` of a 3000 ms grace. Its counterweight is
   `tests/agent_runner.rs:1024`: the same quit against a resistant
   same-group descendant must NOT return early (`>= 900 ms`) and must leave
   it dead. Production grace pinned BY VALUE and alone at
   `tests/agent_runner.rs:1266`.
5. **`genesis_cancel` prompt, escalation in the background; observations
   idempotent.** `tests/agent_runner.rs:1073`
   (`cancel` returns in `< 300 ms` while the latch is held `>= 900 ms`) and
   `tests/agent_runner.rs:1134` (cancel + two exits + a settled cancel +
   `Drop`, all on one turn).
   **INTEGRATOR CORRECTION: this line used to claim `:1073` also covered
   "SIGTERM synchronous", and it does not.** `:1073` asserts two things —
   that `cancel` RETURNS fast and that the latch is nonetheless held for
   the whole grace — and neither can fail if the synchronous
   `signals::kill_group` is deleted from `terminate_group_async`, because
   the observer thread it spawns opens with the same `killpg` microseconds
   later. Verified structurally at the merge: `terminate_group_async`
   (`runner.rs:1274`) does the synchronous SIGTERM and then spawns
   `terminate_group_observing`, which delegates to
   `terminate_group_polling`, whose own first act is the initial SIGTERM
   that drill P12 removes. The line IS present and correct, and it is
   load-bearing on the path where `thread::spawn` panics, which no test
   can reach — so the defect is in the EVIDENCE claim, not the mechanism.
   Filed as `T-043-s4`, which measured the suite staying 60/60 green with
   the synchronous call deleted.
6. **Permanent fixtures, exact pids, cleanup on failure.** The scenarios
   above; `OwnedGroup` (`tests/agent_runner.rs:556`) owns what it spawns;
   `GroupGuard` (`tests/agent_runner.rs:668`) owns what the runner spawns.
   Both SIGKILL exactly the pids and groups they registered — no `pkill`,
   no name match — on the unwinding path too.
7. **The guarantee corrected everywhere it is live.** T-025 acceptance
   (`:47`), §3 count (`:130`), §5 (`:185`), §10 obligation (`:329`),
   silences (`:244`); `runner.rs:5`; `mod.rs:216`; `lib.rs:512`. The
   escapee measurement is recorded verbatim in all four code sites and in
   T-025 §5.
8. **Descendant sweep stays a non-goal**, with the narrower true bound
   stated: the six granted patterns are `Bash(git init:*)`,
   `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git status:*)`,
   `Bash(mkdir:*)`, `Bash(cp:*)` (`adapter.rs:108`) and none daemonizes.
9. **The off-by-one.** Verified before changing: `KIT_FILES` has fourteen
   entries and §3's own enumeration lists fourteen. `13` → `14`.
10. **T-060's boundary held.** No test sets, clears or reads
    `NPUTER_NO_REAL_CLI`; every new config carries `binary_override` +
    `probe_login_shell: false`, and the structural guard is what actually
    holds it. Exactly **three** `#[ignore = "…"]` attributes repo-wide,
    unchanged; the real smoke did not run. No network, no real CLI, no
    model call.

### Timing, at test-thread counts 1, 4 and 8

Ten runs of the whole `agent_runner` binary at each count, then five bare
`cargo test`, then three more at four threads under deliberate load.

| `--test-threads` | runs | failures | wall clock per run |
|---|---|---|---|
| 1 | 10 | **0** | 15.0–16.4 s |
| 4 | 10 | **0** | 5.1–5.5 s |
| 8 | 10 | **0** | 3.7–3.8 s |
| default (10 cores) | 5 | **0** | 11–14 s, whole workspace |
| 4, under 12 busy loops on 10 cores | 3 | **0** | 5.3–5.4 s |

**Read this the way T-060's table has to be read: it is 38-for-38 on a
quiet ten-core machine and that is weak evidence about `ubuntu-24.04`.**
Four threads is the closest proxy for a four-core runner and it is
10-for-10 clean, but the load probe is honestly weak — twelve shell busy
loops barely moved the wall clock, so it did not reach the regime that
matters. What I can say structurally rather than statistically: every
timing assertion is a literal against a grace at least three times larger
(1000 vs 3000; 800/900 as FLOORS, which can only fail if the code returns
early — the direction a slow machine cannot cause), and the observed
release is 25–50 ms, a 20–40× margin. The floors are load-immune by
construction; the ceilings are the ones a genuinely starved runner
could still move.

**INTEGRATOR CORRECTION: there are FIVE ceilings, not three, and one of
them is not 1000 ms.** Re-derived at the merge by reading every timing
literal in the new bodies: the ceilings are `tests/agent_runner.rs:771`,
`:894`, `:964` and `:1006` (`< 1000 ms` against a 3000 ms grace) and
`:1102` (**`cancel_returned < 300 ms` against a 900 ms grace**) — the
tightest literal on the branch, and the assertion P11 created when it
moved out of the cooperative body. The five FLOORS are `:813`, `:851`
and `:917` (`waited >= 800 ms`) and `:1050` and `:1108` (`>= 900 ms`),
and the executor's structural argument about them is exactly right: a
floor can only fail if the code returns EARLY, which slowness cannot
cause. So the correction is to the card's INVENTORY of its own risk
surface, not to the branch: instrumented, `cancel_returned` measures
0 ms, a >300× margin, because it bounds a mutex lock plus a `killpg`
plus a `thread::spawn`. The tightest literal is also the safest.

### Poison drills — 14 mutations, every one moving a VALUE or a BEHAVIOUR

| # | mutation (one-sided) | red |
|---|---|---|
| P1 | the turn path stops reaping during the grace (**the old terminate-before-wait ordering**) | cancel-latch, exit-reap-latency |
| P2 | the owner's poll never reports its reap | cooperative-poll, resistant-grandchild, cancel-latch, exit-latency |
| P3 | early release drops the GROUP limb (**the naive `try_wait()`-then-return**) | resistant-grandchild, exit-reap-resistant |
| P4 | early release drops the REAPED limb | observer control arm |
| P5 | escalate at the deadline regardless of membership | observer control arm |
| P6 | `group_has_members` reads ESRCH as "somebody is there" | 8 bodies |
| P7 | the worker never publishes the reap | happy-path publish |
| P8 | production grace 5 s → 4 s | grace-by-value |
| P9 | the resistant LEAF fixture stops resisting | resistant-direct, resistant-grandchild, exit-reap-resistant |
| P10 | the resistant TURN fixture stops resisting | resistant-turn |
| P11 | `genesis_cancel` escalates on the caller's thread | resistant-turn |
| P12 | the poll sends no initial SIGTERM | 5 bodies, incl. the pre-existing exit hook |
| P13 | `pid_alive` always answers "gone" | 5 bodies, incl. the pre-existing group kill |
| P14 | the child slot is never cleared | happy-path publish, idempotence, two pre-existing |

**Twelve new bodies, every one red under at least one drill.** Restoration
proved by sha256 against `git show HEAD:<path>` after every drill, never by
a clean `git status`: `runner.rs` `cc06dd93…`, `agent/mod.rs`
`080107fe…`, `fake_agent.rs` `63b8a9bf…`.

**INTEGRATOR CORRECTION, and it is the card's own discipline failing on
its own central file.** This line recorded `runner.rs` as `fb1f3b61…`,
which is not the sha of `runner.rs` at this branch's tip. Re-derived at
the merge: `fb1f3b61…` is the value at `4d75bac` and `cfa86ef` — the
commits the drills actually ran against — and `ade2d1a` then added ONE
`#[cfg(unix)]` line to `POLL_INTERVAL` without the drills being re-run,
so HEAD is `cc06dd93…`. The attribute is inert on darwin, where `unix`
is true, and the verifier re-ran P1/P2/P3/P4/P7/P11 at HEAD with the
claimed blast radius, so the EVIDENCE stands. What did not stand is the
rule: a reader following this card's own instruction — sha256 against
`git show HEAD:<path>` — would have got a mismatch on the one file the
card is about. `agent/mod.rs` and `fake_agent.rs` were checked at the
merge too and both match HEAD. Recorded rather than quietly fixed,
because the failure mode is the interesting part: a restoration sha is a
claim about a COMMIT, and it goes stale the moment the file moves for
any reason, including a reason the drills do not care about.

**TWO DRILLS STAYED GREEN, AND BOTH WERE FINDINGS — that is the drill
working, not the drill failing.**

- **P7 green.** Deleting `run_turn`'s trailing `handle.mark_reaped()` red
  nothing, because the cancel path publishes from inside the poll. The line
  is load-bearing only on the HAPPY path, which had no body. Covered now by
  `a_happy_turn_still_publishes_its_reap_to_whoever_holds_the_handle`
  (`tests/agent_runner.rs:1194`), which observes the slot deterministically
  off the `started` event — the slot is written before the event is
  emitted, the same ordering `reap_for_exit` depends on. P7 now reds it.
- **P11 green.** Making `genesis_cancel` escalate on the caller's thread
  red nothing, because against a COOPERATIVE group the blocking form ALSO
  returns in milliseconds once the poll releases early. The promptness
  assertion could not fail where it sat. It moved to the resistant-child
  body, where a blocking escalation costs the whole grace, and it reds
  there. A note at `tests/agent_runner.rs:956` records why it is absent
  from the cooperative body (the card said 938; corrected at the merge).

### The leak this card caused, found and closed

Poison drill P3 failed `the_exit_reap_pays_the_full_grace_…` exactly as
intended and **LEAKED its SIGTERM-immune grandchild** — pid 6373, ppid 1,
`nputer-T-043/…/fake_agent`, alive for sixteen minutes until it was found
by hand. It ignored SIGTERM and died on SIGKILL, confirming which fixture
it was. `OwnedGroup` covered the processes the tests spawn themselves; the
harness-driven bodies got theirs from the runner and their only cleanup was
the code under test doing its job — which is precisely what a poison drill
removes. `GroupGuard` (`tests/agent_runner.rs:668`) closes it: register the
pid the moment the body learns it, SIGKILL exactly those pids and groups on
Drop. **Re-running P3 and P9 after the guard reds the same bodies with zero
processes left.** Eight further repeat runs at 1/4/7 threads: zero leaked.
Every pid this session created is proven gone; the two orphaned
`fake_agent`s from `nputer-T-060` are not mine and are filed as T-043-s1.

### Gates

- bare `cargo test`, unpiped, exit **0**: **337 passed / 0 failed / 3
  ignored** (baseline `adb32c3` was 325 + 3; +12 bodies). Per target:
  `nputer_lib` unit **117**, `tests/agent_runner.rs` **60 + 1 ignored**,
  `nputer_index` lib **123**, `arch` **7**, `cli` **13**, `containment`
  **3**, `golden` **7**, `perf` **0 + 1 ignored**, `self_graph` **2 + 1
  ignored**, `watch` **4**, doctests `nputer_lib` **1** / `nputer_index`
  **0**, three zero-test bins.
- **BOOT GATE fired** (`app/src-tauri/**` moved) and passed, offline npm
  setup, scratch port **18443** bind-probed free first, 1420 never
  contacted. Both startup lines detected — `[nputer] project folder:` and
  `[nputer] window "main" created` — and the tree stopped on SIGTERM. **The
  script prints no exit code; the 0 is my own `echo $?`.** Nothing was left
  holding 18443.
- graph currency `index --check --root ../..` exit **0**, CURRENT —
  **568,598 bytes / 117 files / 982 symbols / 1,502 edges**, byte-unchanged.
  I did NOT regenerate `graph.json`; no indexed TS/JS file moved.
- `cargo audit -n` (no fetch) exit **0**: **0 vulnerabilities / 17 allowed
  warnings** over 472 locked crates against the existing 1,216-advisory DB.
- Security movement zero: `acl_pin.rs` sha256 `8d24cbad…`, identical to
  `adb32c3`, **92** grants. `ENV_ALLOWLIST` byte-identical over its anchored
  range — **423 bytes, 16 entries**. No dependency, manifest, lockfile, IPC
  command, capability grant or network surface moved.

### For the verifier

- **The two-limb release is the whole claim.** If you take one thing apart,
  take apart `terminate_group_polling`: P3 and P4 are the mutations that
  matter, and they must red `…resistant_grandchild…` and the observer
  control arm respectively.
- **`GroupExit.waited` is measured inside the poll.** It is a wall-clock
  number and therefore the flake surface. The floors cannot fail from
  slowness; the ceilings can, in principle, on a starved runner.
- **The ready-handshake is not decoration.** `Command::spawn` returns at
  fork and the disposition is installed after `exec`; the first run of the
  resistant body reaped its "resistant" child in 27 ms because the SIGTERM
  landed in that window. Removing `announce_ready` reintroduces a rare
  false green, not a red.
- **T-025-s3's count half is discharged here** (its `runtime/nputer.yaml`
  half is untouched and still parked). The parenthetical's byte figure is
  measurably wrong too — 23,890 bytes, not "~60 KB" — and is deliberately
  NOT changed; see T-043-s2 for why deleting it beats correcting it.
- **Filed:** T-043-s1 (the briefing's five orphaned `nputer` binaries did
  not reproduce; two orphaned `fake_agent` turn children from
  `nputer-T-060` are alive), T-043-s2 (the kit byte figure), T-043-s3
  (`run_with_timeout` SIGTERMs a probe without escalating, then waits
  unbounded, stranding the single-flight latch — same file, different code
  path, deliberately not fixed here).

### What I am not confident about

1. **`killpg` and zombies on Linux.** The ordering (reap, then ask about
   the group) makes the predicate correct whether or not a kernel counts a
   zombie as a group member, and it is measured on darwin. It is NOT
   measured on Linux, and CI has never run on a real runner.
2. **The timing ceilings on a four-core runner.** 10-for-10 at four threads
   here is not the same machine. Margins are 20–40×, but the load probe was
   too weak to claim more.
3. **Whether the two orphaned `nputer-T-060` `fake_agent`s came from
   committed code or from a hand-run probe.** I did not attribute them and
   deliberately say so in T-043-s1.
4. **The `Err(_)` arm of the owner's `try_wait`** treats an error as "the
   child is gone". That is right for ECHILD and unreachable in practice
   here, but it is an assumption no test exercises.
5. **The idempotence body proves no panic and a settled `Idle`; it does not
   prove the absence of a deadlock** under an adversarial interleaving. A
   deadlock would hang the suite rather than red it, which no assertion can
   catch.

## Verdicts

### Adversarial verification — `claude-opus-5 @fresh`, in progress

Worktree `nputer-T-043`, branch `task/T-043-kill-path`, tip `677b46a`,
**six** commits from `adb32c3` (`git rev-list --count adb32c3..HEAD` = 6),
working tree clean. Fence re-derived from `git diff --name-only`: ten
files, all under `app/src-tauri/**` or `docs/tasks/**`. Zero bytes under
`app/src/**`, `app/test/**`, `lib/**`, `tools/**` — confirmed, not
accepted.

**Every drill below was run inline, restoration proved by `sha256`
against `git show HEAD:<path>` and `git status --porcelain` clean.**

#### Gates, re-derived

- Bare `cargo test`, unpiped to a file, `echo $?` = **0**. Summed from
  the fifteen `test result:` lines: **337 passed / 0 failed / 3 ignored**.
  Per target reproduces the card exactly: lib 117 · fake_agent 0 ·
  nputer 0 · agent_runner **60 + 1 ignored** · nputer_index lib 123 ·
  nputer-index bin 0 · arch 7 · cli 13 · containment 3 · golden 7 ·
  perf **0 + 1** · self_graph **2 + 1** · watch 4 · doctests 1 / 0.
- `#[ignore]` ATTRIBUTES repo-wide: exactly **three**
  (`crates/nputer-index/tests/perf.rs:53`,
  `crates/nputer-index/tests/self_graph.rs:58`,
  `tests/agent_runner.rs:3037`). The other eight `git grep` hits are
  prose in doc comments. The real smoke was not run.
- `acl_pin.rs` sha256 `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  byte-identical to `adb32c3`. **92** entries in `EXPECTED_GRANTS`,
  counted from the array body, not from a byte range.
- `ENV_ALLOWLIST` over its anchored range: **423 bytes / 16 entries**,
  `diff` against `adb32c3` empty.

#### The measurement the card rests on — re-measured first-hand, not read

Own probe (perl, `setpgrp(0,0)` leader + SIGTERM-immune same-group
grandchild), darwin 25.6.0 arm64:

```
child=34606 gc=34607 pgid=34606
ROW1 both running:            kill(child,0)=0(alive)  kill(gc,0)=0(alive)  killpg(pgid,0)=0(alive)
ROW2 child TERMed NOT waited: kill(child,0)=0(alive)  kill(gc,0)=0(alive)  killpg(pgid,0)=0(alive)
     ps state of child        = "Z"
ROW3 after wait(), gc alive:  kill(child,0)=-1/errno3(ESRCH)  kill(gc,0)=0(alive)  killpg(pgid,0)=0(alive)
ROW4 group empty:             kill(child,0)=-1/errno3(ESRCH)  kill(gc,0)=-1/errno3(ESRCH)  killpg(pgid,0)=-1/errno3(ESRCH)
LEAK CHECK: gc alive? no   child alive? no
```

All four rows reproduce, `ps` independently confirms row two is state
`Z`, and ESRCH is numerically 3. The card's table is honest.

#### P7 — re-run, and the happy-path body is real

Deleted `run_turn`'s trailing `handle.mark_reaped()` (`runner.rs:1847`)
inline. Result: **exactly one** body red, and it is the new one —

```
failures:
    a_happy_turn_still_publishes_its_reap_to_whoever_holds_the_handle
test result: FAILED. 59 passed; 1 failed; 1 ignored
panicked at tests/agent_runner.rs:1251:5:
a turn that ended HAPPILY never published its reap, so an exit observer holding
this handle would poll the full grace for a child that is already gone
```

The body exists at `:1194`, it reds, and it kills a mutant no other body
kills. Restored, `runner.rs` sha256 `cc06dd93…` == `git show HEAD:`.

#### P11 — it reds where it moved, and I measured that it would NOT have red where it was

Two-part drill: (a) `terminate_group_async` made blocking
(`std::thread::spawn(move || terminate_group_observing(…))` →
`terminate_group_observing(…)`), AND (b) the promptness assertion
RE-INSERTED into `a_cancel_releases_the_turn_latch_well_inside_the_grace`
at exactly the line it used to occupy (`:952`).

```
failures:
    a_turn_whose_child_ignores_sigterm_pays_the_full_grace_and_leaves_no_zombie
test result: FAILED. 59 passed; 1 failed; 1 ignored
panicked at tests/agent_runner.rs:1103:5:
genesis_cancel held the caller for 918 ms of a 900 ms grace - the SIGTERM is
synchronous but the escalation must not be
```

**59 passed** — the re-inserted assertion in the cooperative body stayed
GREEN under the very mutation it claimed to catch. The counterfactual is
therefore measured, not argued: the promptness claim was vacuous where it
sat and has teeth where it moved. Both files restored and sha-verified.

#### P3 — re-run, and NOTHING leaked

Early release stripped of its group limb (`if is_reaped && empty` →
`if is_reaped`, with `group_empty: empty` so the struct stays honest —
the naive `try_wait()`-then-return the card names).

```
failures:
    a_reaped_child_with_a_resistant_grandchild_pays_the_full_grace_and_kills_the_survivor
    the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists
test result: FAILED. 58 passed; 2 failed; 1 ignored
the survivor must have been SIGKILLed: GroupExit { reaped: true, group_empty: false,
    escalated: false, waited: 25.510083ms }
the exit reap returned after 31 ms of a 900 ms grace while a resistant same-group
    descendant was still running - it abandoned it
```

Census immediately afterwards, by full `ps -eo pid,ppid,lstart,command`
and by worktree-path match, **no broad `pkill` anywhere**: zero
`nputer-T-043` processes alive. The only surviving `fake_agent`s are
`52504`/`52505` from `nputer-T-060`, `ppid 1`, start time `Tue Aug 18
16:21:18` unchanged before and after — not this branch's, not touched.
`GroupGuard` closes the gap the card says it closes.

#### The rest of the drill table, sampled rather than trusted

Each run inline, whole `agent_runner` binary, restore + sha256 after each.

| drill | mutation | measured red |
|---|---|---|
| P1 | turn path uses the OBSERVER form — the old terminate-before-wait ordering | `a_cancel_releases_the_turn_latch…`, `the_exit_reap_returns_well_inside…` — **exactly the two prompt-death pins the card names** |
| P2 | owner's poll never registers or publishes its reap | 4 bodies: cooperative-poll, resistant-grandchild, cancel-latch, exit-latency — **the card's count of 4 is exact** |
| P3 | early release drops the GROUP limb | resistant-grandchild + exit-reap-resistant |
| P4 | early release drops the REAPED limb | `the_observers_early_release…` at `:916`, "AN EMPTY GROUP ALONE RELEASED THE OBSERVER after 35 ms" — **the control arm, exactly as claimed** |
| P7 | `run_turn`'s trailing publish deleted | happy-path publish, alone |
| P11 | `genesis_cancel` escalates on the caller's thread | resistant-turn, alone — and green in the cooperative body it left |

Four spot-checks of the card's fourteen-row table, and all four reproduce
at the claimed blast radius. I did not re-run P5/P6/P8/P9/P10/P12/P13/P14.

#### Three mutations of my OWN that stayed green

- **`POLL_INTERVAL` 25 ms → 400 ms: green.** Not a defect — it degrades
  gracefully and 400 ms still clears every 1000 ms ceiling — but the
  interval is unpinned, and at 1000 ms every ceiling would red. Named so
  nobody reads the ceilings as bounding it.
- **The owner's `Err(_)` arm inverted (`mark_reaped(); true` → `false`):
  green.** This is exactly the executor's own disclosure #4, and it is
  accurate: no body exercises that arm. Disclosed, not hidden.
- **`GroupExit.waited` on the early path replaced by `Duration::ZERO`:
  green.** The returned number is consumed only by a `println!` in
  `reap_for_exit`; the two bodies that assert on it
  (`exit.waited < 1000 ms`) are backed by two more that time the same
  thing on the outside with wall clock. A log-only lie, not a hole.

#### THE THIRD POISON THAT STAYED GREEN — filed as `T-043-s4`

Delete the SYNCHRONOUS `signals::kill_group(handle.pid, SIGTERM)` from
`terminate_group_async` (`runner.rs:1278`), leaving the background thread
alone:

```
test result: ok. 60 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out
M2_EXIT=0
```

The criterion says `genesis_cancel` "SHALL … **send SIGTERM
synchronously**", and evidence line 5 cites `:1073` for it. No body can
fail when it is deleted, because the spawned observer's first act is the
same `kill_group`, microseconds later. `:1073` measures only that
`cancel` RETURNS fast — instrumented, it measures **0 ms** against its
300 ms ceiling. Same shape as P11 before it moved. The line IS
load-bearing on the path where `thread::spawn` panics, which no test can
reach, so the fix is to correct the claim rather than chase a body. See
`T-043-s4`.

#### The timing argument — tested, and its arithmetic is wrong

Full inventory of every timing literal in the new bodies (`grep` over
lines 700–1270):

**Floors (5)** — `waited >= 800` ×3 against an 800 ms grace,
`blocked >= 900` and `latch_released >= 900` against a 900 ms grace. Each
one can only fail if the poll returns EARLY, and `waited` is measured
from inside the poll against a deadline computed from the same clock, so
slowness cannot move it down. **The executor's structural claim holds
exactly.**

**Ceilings — there are FIVE, not three, and one is not 1000 ms.**
`:771`, `:894`, `:964`, `:1006` are `< 1000 ms` against a 3000 ms grace;
`:1102` is **`cancel_returned < 300 ms` against a 900 ms grace** — the
assertion P11 created when it moved. The card's defence says "the three
ceilings are 1000 ms against a 3000 ms grace"; that sentence undercounts
its own risk surface and omits the tightest literal on the branch.
**In practice it is the SAFEST of the five**: instrumented,
`cancel_returned` measures **0 ms**, a >300× margin, because it bounds a
mutex lock plus a `killpg` plus a `thread::spawn`. So the finding is that
the card's inventory is wrong, not that the branch is fragile. Correct
the sentence at merge.

**A harder load probe than the executor's, because its own was weak.**

| regime | runs | failures |
|---|---|---|
| `--test-threads 16` (1.6× oversubscribed) | 5 | **0** |
| `--test-threads 24` (2.4× oversubscribed) | 3 | **0** |
| `--test-threads 4` under **40** CPU burners | 3 | **0** |

`uptime` load average went **6.97 → 27.39** on ten cores during the
loaded runs — genuine starvation, unlike twelve busy loops. Wall clock
moved only 5.1–5.5 s → 5.4–5.7 s, and that is the informative number:
these bodies are SLEEP-bound, not CPU-bound, so CPU starvation barely
reaches them. That supports the executor's structural argument better
than its own table did. Eleven more clean runs on top of its 38 is still
a quiet ten-core arm64 machine and still weak evidence about a four-core
`ubuntu-24.04` runner; I agree with the executor's own caveat and did not
improve on it.

#### The pid-reuse hazard, attacked directly

`terminate_group_polling` reads `reaped()` and then `group_has_members(pid)`
as two separate syscalls, and between them the reaped pid is free for the
OS to reuse — and the pgid IS that pid. Three sub-questions:

1. **Can a recycled pid make the group look EMPTY when survivors remain?**
   No. A pid cannot be reused while it is still in use as a pgid, and it
   is in use as a pgid exactly while the group is non-empty.
2. **Can a recycled pid make an EMPTY group look occupied, and so draw a
   SIGKILL at the deadline?** **Yes, in principle** — a recycled pid that
   becomes a group leader answers `killpg(pid,0)` with 0. So the comment
   at `runner.rs:1160` ("re-testing membership immediately before
   escalating is what keeps the signal aimed at the survivors and only at
   them") is **overclaimed**: membership re-testing keeps the SIGKILL off
   an EMPTY pgid, which is the improvement, but it cannot distinguish our
   survivors from a recycled group. It needs pid wraparound to land on
   our just-freed pid AND that process to become a group leader, inside
   one grace. Negligible, and **not a regression** — the pre-T-043 code
   SIGKILLed the pgid unconditionally at the deadline, so this branch
   strictly narrows the exposure. Recorded because the comment states as
   absolute what is only overwhelmingly likely.
3. **I could not measure (1).** Confirming it needs a pid wraparound —
   ~100k spawns on darwin — which I judged not worth doing on the user's
   machine while their app runs on 1420. It is reasoned from the
   allocator's skip rule, not measured, and I say so rather than implying
   otherwise.

**Linux `killpg`-vs-zombie: not probed, and the design does not need it.**
No Linux available here. But the ORDERING makes the predicate correct
under either kernel answer, and that I did verify by case analysis:
if a zombie counts as a member, the reap-first ordering clears it before
the group is asked; if it does not, `killpg` may report empty early —
but `is_reaped` is still false, so there is no early release, and at the
deadline `empty` is true so `escalated` is false and nothing is
SIGKILLed, which is correct because the only "member" was our own zombie.
The one answer that would break it — a live grandchild plus an ESRCH —
is impossible on any kernel. The executor's uncertainty is real and its
mitigation is sound.

#### A red I caused myself, and what it cost to find out

**Recorded first, because it is the most misleading thing in this
verdict if it is not.** After the load probe, four consecutive bare
`cargo test` runs FAILED —
`docs_watch::tests::startup_arm_watches_the_initial_root`, "expected a
docs-changed emit: Timeout" — while the same body passed 8-for-8 in
isolation. `docs_watch.rs` is untouched by this branch
(`git diff --name-only adb32c3..HEAD` does not list it; last moved by
T-042).

The cause was **my own leaked processes**. My load harness wrote
`LOADPIDS="$LOADPIDS $!"` and cleaned up with
`for p in $LOADPIDS; do kill -9 $p; done` — and **zsh does not word-split
unquoted parameters**, so that passed one malformed argument, killed
nothing, and my `kill -0` leak check was vacuous for exactly the same
reason and printed "all load generators gone". Forty busy loops survived
with `ppid 1` for eight minutes at load average **148**, and at that load
a watcher test with a ten-second `recv_timeout` and a 250 ms debounce
fails every time.

Found by `ps -eo pid= -o ppid= -o comm= -o command=`, killed **by
verified pid, one at a time, with no `pkill`**, each proven gone with
`kill -0`; forty confirmed, zero survivors, zero residual matches
system-wide. The human's app tree (`82342`/`82364`/`82549`) and the
`nputer-T-060` pair were explicitly excluded by pid before any signal
went out.

**Three consecutive bare `cargo test` runs on the settled machine
afterwards:**

```
quiet run 1: exit=0 passed=337 failed=0 ignored=3
quiet run 2: exit=0 passed=337 failed=0 ignored=3
quiet run 3: exit=0 passed=337 failed=0 ignored=3
```

The gate reproduces. The red was mine. The irony — a verifier leaking
processes out of an unchecked cleanup while auditing a card about leaked
processes, and being told so by its own vacuous check — is left in the
record on purpose.

**And it produced the sharpest timing evidence in this verdict.** With a
correct cleanup (pids to a file, killed by `while read`), the
`agent_runner` binary at four threads under forty burners:

```
heavy run 1 (4 threads, load 26.55): exit=0  60 passed; 0 failed
heavy run 2 (4 threads, load 36.98): exit=0  60 passed; 0 failed
heavy run 3 (4 threads, load 41.46): exit=0  60 passed; 0 failed
heavy run 4 (4 threads, load 48.95): exit=0  60 passed; 0 failed
burners still alive: 0
```

At loads that deterministically broke a DIFFERENT test's ten-second
timeout, every one of T-043's five ceilings held. That is the strongest
statement available on this hardware about the T-060 flake shape, and it
is a good deal stronger than the executor's twelve busy loops.

#### Remaining gates

- `index --check --root ../..` exit **0**, `graph.json is CURRENT` —
  **568598 bytes, 117 files, 982 symbols, 1502 edges**.
- `cargo audit -n` exit **0**: 1216 advisories, 472 crate dependencies,
  **0 vulnerabilities**, `warning: 17 allowed warnings found`.
- **BOOT GATE re-run on port 18447**, bind-probed free with a real
  `net.createServer().listen()` before and after (`18447 FREE` →
  `18447 FREE again`). Both lines detected — `[nputer] project folder:`
  and `[nputer] window "main" created` — tree stopped on SIGTERM. **The
  script prints no exit code; `BOOT_EXIT=0` is my own `echo $?`.** Port
  1420 was read with `lsof` only and is still held by the human's
  `node 82549`.
- `file --mime` on all ten changed files: every one `charset=utf-8`.

### Criterion by criterion

1. **Reap DURING the grace, latch well inside it — MET.** P1 (turn path
   switched to the observer form = the old terminate-before-wait
   ordering) reds `a_cancel_releases_the_turn_latch…` and
   `the_exit_reap_returns_well_inside…` and nothing else: exactly the two
   prompt-death pins. Observed release inside the poll, printed by P3's
   own failure text: **25.510083 ms** of a 3000 ms grace.
2. **BOTH limbs — MET.** P3 (drop the group limb) reds resistant-
   grandchild and exit-reap-resistant; P4 (drop the reaped limb) reds the
   observer control arm at `:916` with "AN EMPTY GROUP ALONE RELEASED THE
   OBSERVER after 35 ms". The naive `try_wait()`-then-return is caught in
   both directions.
3. **Resistant DIRECT child — MET.** `:835` and `:1073` exist and assert
   signal-death, no zombie, empty group. The fixture resists for real:
   `ignore_sigterm` installs `SIG_IGN` for signal 15 through `libc`
   `signal(2)`, and my own probe confirmed a SIGTERM-immune child
   surviving SIGTERM and dying on SIGKILL.
4. **App exit inside the grace, by coordination — MET.** `:981` bounds
   `reap_for_exit` itself; `:1024` is its counterweight. Production grace
   pinned BY VALUE and alone at `:1266` — `assert_eq!` on the constant,
   not parametrised by it.
5. **`genesis_cancel` — MET except one clause.** Prompt: yes, and P11
   reds it at 918 ms. Background escalation: yes. Idempotence: yes.
   **"Sends SIGTERM synchronously" has no body that can fail** — see
   `T-043-s4`. The mechanism is present and correct; only the evidence
   claim over-reaches.
6. **Permanent fixtures, exact pids, cleanup on failure — MET, and
   re-proved.** P3 re-run left zero `nputer-T-043` processes. Every
   `guard.watch` site registers before the first fallible call. The "notes
   SHALL NOT claim the pre-task suite already covered resistant
   processes" clause is honoured — no such claim appears.
7. **Guarantee corrected everywhere live — MET.** All eight named
   anchors carry the correction; a repo-wide `git grep` from the root
   finds no live unqualified restatement outside T-025 §7's historical
   verification plan. The escapee property re-measured first-hand:
   `child_alive=gone(errno3) escapee_alive=alive`, `escapee_pgid ==
   escapee_pid`.
8. **Descendant sweep a non-goal — MET.** The six granted patterns are
   verbatim at `adapter.rs:108-113`: `git init`, `git add`, `git commit`,
   `git status`, `mkdir`, `cp`. None daemonizes.
9. **The off-by-one — MET.** `KIT_FILES` has fourteen entries; §3's own
   enumeration lists fourteen. `13` → `14` is right.
10. **T-060's boundary — MET.** No test sets, clears or reads
    `NPUTER_NO_REAL_CLI`; the structural guard plus its doctest hold it;
    exactly three `#[ignore]` attributes; the real smoke did not run; no
    network, no real CLI, no model call anywhere in this verification.
11. **Poisoned and red, cleanup, pids proven gone — MET.** Six drills
    re-run at HEAD, all reproducing the claimed blast radius; three
    mutations of my own that stayed green, all benign and two of them
    already disclosed by the executor; one that stayed green and is a
    real finding (`s4`). No broad `pkill` used anywhere in this
    verification, including on my own leak.

### The three judgements asked for

- **`T-043-s3` — leaving it out was RIGHT.** I reproduced its claim:
  `kill_group_now` is SIGTERM and nothing else, `child.wait()` that
  follows has no bound, and `start_genesis` takes `begin_turn` BEFORE it
  resolves, so the strand is permanent rather than slow. Fixing it needs
  its own SIGTERM-immune probe fixture and its own typed outcome — a card,
  not a rider on this one, and this card was already re-scoped S→M once.
  s3 does understate the blast radius in two ways, which is why I filed
  **`T-043-s5`** rather than reopening the fence.
- **`T-043-s2` — the executor is RIGHT and I endorse it.** I measured the
  fourteen `include_str!` sources myself: **23890 bytes**, against "~60
  KB". The count is load-bearing (a parity walk asserts it, a wrong count
  sends a reader hunting a fifteenth file); the byte total is held by no
  test and is rewritten by every method bump. Delete it. And the executor
  changing ONLY the 13→14 it was authorised to change, and filing the
  rest, is the discipline working.
- **The `Err(_)` arm and the idempotence body — both admissions are
  ACCURATE.** I inverted the `Err(_)` arm (`mark_reaped(); true` →
  `false`) and the suite stayed 60/60 green: no body exercises it, exactly
  as disclosed. And the idempotence body does prove no panic and a settled
  `Idle` and cannot prove the absence of deadlock — though `settle` and
  `wait_for_file` both carry 20 s deadlines that PANIC rather than block,
  so a deadlock inside them would red rather than hang the suite. The
  unguarded surface is narrower than the admission implies, which is the
  right direction for an admission to be wrong in.

### Card corrections the integrator should apply before merge

1. **The recorded restoration sha for `runner.rs` is STALE.** The notes
   say `fb1f3b61…`; HEAD is **`cc06dd93…`**. `fb1f3b61` is the value at
   `4d75bac`/`cfa86ef`, i.e. when the drills ran; `ade2d1a` then added
   one `#[cfg(unix)]` to `POLL_INTERVAL` and the drills were not re-run.
   The attribute is inert on darwin and I re-ran P1/P2/P3/P4/P7/P11 at
   HEAD myself with the claimed results, so the evidence stands — but the
   card's own discipline ("prove restoration by sha256 against
   `git show HEAD:<path>`") fails on its own central file. `mod.rs`
   `080107fe…` and `fake_agent.rs` `63b8a9bf…` both match HEAD.
2. **"the three ceilings are 1000 ms against a 3000 ms grace" is wrong.**
   There are FIVE, and the fifth is `cancel_returned < 300 ms` against a
   900 ms grace at `:1102` — the assertion P11 created when it moved.
3. **Evidence line 5 cites `:1073` for "SIGTERM synchronous".** It covers
   promptness and background escalation only (`T-043-s4`).
4. **Two anchors drifted by a line or two:** `runner.rs:1177` names
   `if is_reaped && empty`, which is at **1178**; `tests:938` names the
   P11 note, which is at **956**. Every other anchor I checked —
   twenty-five of them — is exact.

### Findings filed (executor filed s1–s3; these start at s4)

- **`T-043-s4`** — `genesis_cancel`'s synchronous SIGTERM has no body
  that can fail: deleting it leaves the suite 60/60 green.
- **`T-043-s5`** — probe children are never registered in the child slot,
  so `reap_for_exit` cannot reach them; a SIGTERM-immune probe outlives
  the app, which the sentence this card corrected still does not cover.
  Widens s3.
- **`T-043-s6`** — the zombie pin never asserts the zombie: its wait loop
  calls the `try_wait` its own comment forbids, its `deadline` is
  unreachable, and a slow-dying fixture would leave it green while
  measuring nothing. Measured `stat="Z"` 3/3 today, so it is correct now
  and fragile by construction.

## VERDICT: APPROVED

The mechanism is right and it is proved the hard way. The two-limb
release does what it claims in both directions; the escalation really is
guarded by group membership rather than the clock; the darwin measurement
the whole design rests on reproduces row for row under my own probe; the
`GroupGuard` that a leak forced into existence holds under the very drill
that caused the leak, with zero survivors; and every gate re-derives to
the number claimed. The two green poisons the executor found and fixed
are both genuinely fixed — and the P11 counterfactual is now MEASURED
rather than argued, which is the part I most expected to fall over.

The sweep found a third green poison (`s4`), a residual widening of the
corrected guarantee (`s5`) and a fragile pin (`s6`). None of the three is
a defect in the shipped kill path: `s4` is an evidence over-claim about a
line that is correct and present, `s5` is a pre-existing hole on a
different code path already half-filed as `s3`, and `s6` is a test that
is correct today and should be made robust. Four card corrections are
listed above; the stale `runner.rs` sha is the one an integrator must not
skip, because a reader following the card's own instruction will get a
mismatch on the file the card is about.

Verified on darwin 25.6.0 arm64, ten cores. Nothing in this verification
called a real model, touched the network, ran the ignored smoke, or
signalled anything on port 1420. Every process this session created is
proven gone; the two `nputer-T-060` orphans (`52504`/`52505`, start
`Tue Aug 18 16:21:18`) are unchanged and untouched, as `T-043-s1` says.

`status: verifying` left in place for the integrator.

## Integration — `claude-opus-5 @fresh`, merge `38886d3`

Merged into main at **`38886d3`**, no-ff, parents `e4a5ae7` (main-before)
and `fb583ee` (the approved tip, taken unchanged). The read-only
`merge-tree` predicted tree **`cd1e4cf5`** before anything was written and
the merge produced that tree exactly. **The merge's diff `e4a5ae7..HEAD`
is THIRTEEN files** — five Rust under `app/src-tauri/**`, T-025's card,
this card, and the six new `T-043-s*` files. The naive `merge-base..HEAD`
derivation returns **NINETY**, and the extra seventy-seven are main's own
fourth-triage commits, already integrated; the two changed-file sets have
an **EMPTY intersection**, so the merge diff equals the branch diff
file-for-file. `status: done` stamped here.

**Five card corrections, four applied in place and one deliberately not.**
Corrections 1–4 are inlined at their own sites above rather than collected
at the bottom, so a reader hits each one where it would have misled them.
Every one was re-derived at the merge rather than transcribed from the
verdict: the `runner.rs` restoration sha (`fb1f3b61…` is real, but it is
`cfa86ef`'s value, and the only intervening change is one `#[cfg(unix)]`
line at `ade2d1a`); the ceiling count (five, not three, at `:771`, `:894`,
`:964`, `:1006`, `:1102`, against five floors at `:813`, `:851`, `:917`,
`:1050`, `:1108`); evidence line 5's synchronous-SIGTERM over-claim; and
the two drifted anchors (`if is_reaped && empty` is at **1178**, the P11
note at **956** — the other twenty-five anchors the verifier checked are
exact, and both drifts were re-confirmed by locating the symbol).

**The fifth — T-025 §3's "~60 KB" — is left standing, and that is a
judgement, not an oversight.** Measured independently a third time at the
merge, by extracting the fourteen `include_str!` paths from `KIT_FILES`
and summing them: **14 files, 23,890 bytes**. Both prior measurements
reproduce to the byte, so "~60 KB" is wrong by roughly 2.5×. I endorse
`T-043-s2`'s argument ON THE MERITS — the file COUNT is load-bearing
(a parity walk asserts it, and a wrong count sends a reader hunting a
fifteenth file) while the byte total is pinned by nothing and is
re-falsified by every method bump, so deleting it beats correcting it.
But I did not do it here, for three reasons. The criterion authorised the
13→14 count and nothing else, and the executor changing only what it was
authorised to change and filing the rest is the discipline the verifier
praised — an integrator overriding that at the merge undoes it. Delete
versus correct is an editorial ruling on ANOTHER card's plan text, which
is triage's call, not an integrator's. And the hazard is already closed
in place: §3 now reads "The byte figure is a separate, still-wrong number
and is left alone here: see T-043-s2", so the parenthetical discloses its
own error in the same parenthetical, which is strictly better than a
corrected figure that will silently go wrong again. `T-043-s2` carries the
decision to triage with three independent measurements behind it.
