# State

Updated: 2026-08-19 by integrator (T-043 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-043 — the kill path: an honest grace and an honest scope.** F-03,
milestone 3, size M, `touches: [app-agent, app-shell]`. Built and
verified by `claude-opus-5 @fresh`, `review: same-model`. Approved
branch tip **`fb583ee`**; merge **`38886d3`**. The card was at
`status: verifying` on its branch (main still read `planned`); the
integrator stamped **`done`**.

**The defect was one question asked once.** The grace poll tested
`kill(pid, 0)` — and that is TRUE FOR A ZOMBIE. The turn's child is
always our own unreaped child, so the poll could not answer "gone" until
somebody reaped it, and nobody did until the grace expired. **Every
cancel and every app quit paid the full five-second grace even when the
CLI died obediently on the first SIGTERM.** Early release now requires
TWO facts: the direct child reaped AND `killpg(pgid, 0)` returning
ESRCH. A cooperative group leaves in tens of milliseconds; observed
release inside the poll is **25.5 ms** of a 3000 ms grace.

**The counterweight is what makes it honest rather than merely fast.** A
child that exits while a same-group grandchild ignores SIGTERM still runs
the poll to the deadline and still SIGKILLs the survivor — the exact
regression a bare `child.try_wait()` followed by `return` would
introduce, and the card names that shape and reds it in both directions
(P3 drops the group limb, P4 drops the reaped limb). Escalation is
guarded by GROUP MEMBERSHIP rather than by the clock, because once the
direct child is reaped its pid is free for reuse and the pgid IS that
pid: SIGKILLing unconditionally at the deadline is a use-after-free of a
pid number.

**The structural change is an ownership relocation, not a faster poll.**
Exactly one thread owns the `Child` and may `waitpid`; three observers —
`genesis_cancel`, the exit hook and `AgentState`'s `Drop` — need the
answer and own nothing. `ChildHandle` (a `Clone` handle over an
`Arc<AtomicBool>`) lets the owner PUBLISH its reap and the observers
READ it. **This answers the open question the last checkpoint parked**,
the second of the two ways it offered — coordinate with the worker,
rather than hand a second child handle around — and the first way is not
merely worse but unavailable, since a second owner is a second `waitpid`
on the same pid.

**The guarantee is narrowed wherever it is live**, to *no orphaned
descendant THAT STAYS IN THE GROUP*. A descendant that calls `setsid()`
leaves the group and survives; that is a property of process groups, not
a defect, and it is measured (`child_alive=false escapee_alive=true
escapee_pgid == escapee_pid`) rather than asserted. A descendant sweep is
a deliberate NON-GOAL: after `setsid()` and reparenting the ancestry is
undiscoverable, and the narrower true bound is that none of the six
granted `Bash(...)` patterns daemonizes. **Re-derived here rather than
transcribed:** a repo-wide `git grep -i orphan` from the root finds the
qualification present at every live site — `agent/mod.rs:216`,
`runner.rs:6`, `lib.rs:513`, and T-025's `:48`, `:78`, `:185`, `:244`,
`:329` — and no unqualified restatement survives outside T-025 §7's
historical verification plan. ARCHITECTURE never carried an unqualified
form; its C-14 sentence already read "kill the group on cancel", which is
the narrow claim.

## The six findings this merge delivers

`T-043-s1` through `s6` arrive with the merge, all at
`status: suggested`, and go to triage immediately. **None is a defect
against the shipped kill path.** The executor filed s1–s3; the
adversarial pass added s4–s6.

- **s1 — two orphaned `fake_agent`s from a SIBLING worktree.** Pids
  `52504`/`52505`, ppid 1, from `nputer-T-060`, start
  `Tue Aug 18 16:21:18`. Confirmed unchanged at this checkpoint, before
  and after every suite; **not this branch's and not touched**. The
  briefing's five orphaned `nputer` binaries did not reproduce. Whether
  they came from committed code or a hand-run probe is deliberately not
  attributed.
- **s2 — the kit BYTE figure is wrong too.** T-025 §3's `~60 KB` is off
  by roughly 2.5×. See the ruling below; it is the one card correction
  deliberately NOT applied.
- **s3 — `run_with_timeout` SIGTERMs a probe without escalating**, then
  waits unbounded, stranding the single-flight latch. Same file,
  different code path, deliberately outside this fence. The verifier
  reproduced it and agrees leaving it out was RIGHT: it needs its own
  resistant fixture and its own typed outcome, and this card was already
  re-scoped S→M once.
- **s4 — a THIRD green poison, and the sharpest of the six.** Deleting
  the SYNCHRONOUS `killpg` from `terminate_group_async` leaves the suite
  **60/60 green**, because the observer thread it spawns opens with the
  same signal microseconds later. The criterion says `genesis_cancel`
  SHALL "send SIGTERM synchronously" and **that clause has no falsifying
  body**. Evidence line 5 cited `:1073` for it; `:1073` measures only
  that `cancel` RETURNS — instrumented at **0 ms** against a 300 ms
  ceiling. The line is present, correct, and load-bearing only where
  `thread::spawn` panics, which no test can reach. Verified structurally
  at the merge, not transcribed.
- **s5 — probe children are never written to `child_slot`**, so
  `reap_for_exit` cannot reach them and a SIGTERM-immune probe outlives
  the app. This widens s3 onto the very sentence this card corrected.
- **s6 — the zombie pin does not assert the zombie.** Its wait loop calls
  the `try_wait` its own comment forbids, its `deadline` is unreachable,
  and nothing asserts the `Z` state. Instrumented `stat="Z"` 3/3 today:
  **correct now, fragile by construction.**

**A shape question for triage, deliberately not given an ordinal here.**
s4 is not shape five (an assertion set with no cardinality floor) and not
shape six (a body that reds while killing no unique mutant). It is a
third thing: **a mechanism made unfalsifiable by a REDUNDANT second
path**, so no body can distinguish its presence from its absence. P11 was
the same shape before it moved. Whether that is shape seven or a variant
of six is a taxonomy decision, and taxonomy is triage's, not an
integrator's — the precedent set at the last two checkpoints.

## Integration truth

T-043 and main shared base **`adb32c3`**. Main-before was **`e4a5ae7`**
and the approved worktree was clean at **`fb583ee`**. Main advanced
**seventy-seven** paths from that base (the whole fourth triage); T-043
changed **thirteen**. **Their changed-file intersection is EMPTY**,
computed with `comm -12` over the two sorted lists rather than argued
from the slugs. The read-only `merge-tree` predicted tree **`cd1e4cf5`**
before anything was written, and the no-ff merge **`38886d3`** produced
that tree exactly, with parents `e4a5ae7` and `fb583ee` and nothing else.

**The merge's diff (`e4a5ae7..38886d3`) is THIRTEEN files**: five Rust
under `app/src-tauri/**` (`src/agent/mod.rs`, `src/agent/runner.rs`,
`src/bin/fake_agent.rs`, `src/lib.rs`, `tests/agent_runner.rs`), T-025's
card carrying the durable correction, the T-043 card, and the six new
`T-043-s*` files. By suffix that is **8 `.md` + 5 `.rs` and nothing
else**. The naive `merge-base..HEAD` derivation returns **NINETY** — and
because the intersection is empty, 13 + 77 = 90 exactly, which is the
arithmetic check that the two sets really are disjoint. Six of the
thirteen are additions; `file --mime` reports `charset=utf-8` on all
thirteen.

**The board, derived from disk at both ends.** Main-before: **100 task
files, 51 done / 29 planned / 20 parked, suggested ZERO** (T-043 read
`planned` in main; the `verifying` stamp lived only on the branch). At
this checkpoint: **106 task files, 52 done / 28 planned / 20 parked, and
suggested is back to SIX.** The deltas are exactly T-043 planned→done and
the six new suggestion files; 52 + 28 + 20 + 6 = 106. Ten files sit in
`docs/tasks/rejected/` and are counted separately, as always.

Security movement is zero, re-derived rather than carried:
`acl_pin.rs` is byte-identical at the base and in the merged tree
(sha256 `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`),
with **92** grants counted twice from the `EXPECTED_GRANTS` array body —
92 entry lines and 92 unique strings agreeing — never from a byte range.
`ENV_ALLOWLIST` is **423 bytes / 16 entries**, and it was compared by
CONTENT rather than by line range across the two refs, because the branch
shifted the file and an anchored range no longer names the same bytes at
both ends. Exactly **three** `#[ignore]` ATTRIBUTES repo-wide
(`crates/nputer-index/tests/perf.rs:53`,
`crates/nputer-index/tests/self_graph.rs:58`,
`tests/agent_runner.rs:3037`); the other fifty-odd `git grep` hits are
prose in doc comments and markdown. No dependency, manifest, lockfile,
IPC command, capability grant, environment allowlist, network, real CLI
or model surface moved. The IPC surface is unchanged at thirteen
commands.

## Suites, every number derived at this merge, exits read unpiped

No suite was piped through `tail`, `head` or `grep`; every command
redirected to a file and the exit code was read with `echo $?` from the
command itself.

- **parser: 234/234 across 12 files**, `tsc --noEmit` exit 0, build exit
  0 — unchanged, this card touches no TS.
- **app: 825/825 across 42 files**, exit 0, unchanged; build exit 0 with
  **265 modules transformed**. The build is a PREREQUISITE, not a
  courtesy: without `app/dist` twelve shipped-bundle assertions fail by
  design.
- **bare Rust workspace: 337 passed / 0 failed / 3 ignored**, exit 0,
  summed from **fifteen** `test result:` lines. Per target, reproducing
  the card exactly: `nputer_lib` **117** · `fake_agent` 0 · `nputer` 0 ·
  `agent_runner` **60 + 1 ignored** · `nputer_index` lib **123** ·
  `nputer-index` bin 0 · arch 7 · cli 13 · containment 3 · golden 7 ·
  perf **0 + 1** · self_graph **2 + 1** · watch 4 · doctests 1 / 0.
  **The +12 is DERIVED, not carried**: main's advance `adb32c3..e4a5ae7`
  contains **zero `.rs` files**, so the Rust baseline at main-before is
  the base's 325 + 3, and 337 − 325 = 12 new bodies.
- **E2E: 88/88**, exit 0, scratch port **17957** bind-probed free first,
  one worker, zero retries, zero skips.
- **token lint: TOKEN 118 / CONTROL 502**, exit 0; selftest **49 TOKEN
  samples + 2 CONTROL samples, 37 walk-policy checks**.
- **`cargo audit -n`** (no fetch) exit 0: **0 vulnerabilities / 17 allowed
  warnings** over 472 locked crates against the existing 1,216-advisory
  database.

**CONTROL is 502, and the 529 in circulation is STALE.** This is worth
stating plainly because the figure was handed to this integration as
current. 529 was true at the T-058 merge `7c6c5aa`, where 547 tracked
files minus the 18 binary assets gives 529. **The fourth triage then
deleted 33 net files** — eight discharged findings at `9b15f7d`, then 35
suggestions absorbed into 12 new cards, then two folds — taking tracked
to **514** at main-before, i.e. CONTROL **496**. This merge adds exactly
the six `T-043-s*` files, so tracked is **520** and CONTROL is
**496 + 6 = 502**, which is what the shipped scanner reports. The
arithmetic closes at every ref. TOKEN is unchanged at 118, correctly: the
card adds no file under `app/src`, `app/test` or `tools/e2e`. **Nothing
pins either count**, which is precisely what T-058-s1 is about and what
T-080 inherits — a corpus figure quoted from a previous checkpoint is a
figure about a previous tree.

**Fresh-checkout proof, taken in a scratch worktree at the MERGED
commit** — never in the main checkout, because `npm ci` there removes
`node_modules` under the human's running vite (T-052 mechanism B, which
has happened). The order is the point. With **zero `node_modules`
anywhere in the tree**, CI's first two steps ran green: selftest 49 + 2
samples and 37 walk checks, then `lint:tokens` clean at **TOKEN 118 /
CONTROL 502** — and CONTROL derives from `git ls-files`, which works in a
detached worktree, so the number is the same one main reports. Only then
were the three packages installed lockfile-exact (parser **55** packages,
app **499**, tools/e2e **8**; **0 vulnerabilities** each), giving parser
build + **234/234**, app build 265 modules + **825/825**, and tools/e2e
typecheck exit 0. `lint:tokens` re-run WITH nineteen `node_modules`
directories present reports the **same 118 / 502**: `SKIP_DIRS` genuinely
excludes them. The worktree was removed.

## The two gates, with their triggers computed

**BOOT GATE — computed, and it FIRES.** The trigger is `app/src/**`,
`app/src-tauri/**`, `app/package.json` or `app/src-tauri/Cargo.toml` over
`e4a5ae7..38886d3`. That set matches **five paths**, all the Rust under
`app/src-tauri/**`. `boot:check` was therefore run, on scratch port
**18461**, bind-probed free with a real `net.createServer().listen()`
before and after (`18461 FREE` → `18461 FREE again`). Both startup lines
were detected — `[nputer] project folder:` and `[nputer] window "main"
created` — and the tree stopped on SIGTERM. **The script prints no exit
code; `BOOT_EXIT=0` is the integrator's own `echo $?`** and any figure in
a checkpoint that is not labelled that way is not a figure the script
produced. Port 1420 was never bound, connected to or signalled.

**GRAPH REGEN — the trigger does NOT fire, and this was MEASURED rather
than assumed from the wording.** The CONVENTIONS trigger is
`*.ts/*.tsx/*.js/*.jsx` outside `docs/`; over the merge's diff that
matches **zero files**, because the diff is 8 `.md` + 5 `.rs` and the
indexer is TypeScript-only. `index --check --root ../..` was run anyway
under T-054's standing clause — there is still no git remote and `ci.yml`
has never executed a single step — and reports **exit 0, CURRENT,
571,733 bytes / 117 files / 989 symbols / 1,508 edges**, sha256
`e50ba36e…`, byte-identical to main-before. `graph.json` was NOT
regenerated and did not need to be. Note that the branch's own card
records **568,598 bytes / 117 files / 982 symbols / 1,502 edges**: that
is honest for the BRANCH, which was cut from `adb32c3` before T-057 and
T-058 moved `app/src`, and it is not the figure at this merge — another
instance of the same lesson as CONTROL.

**`--root` is load-bearing, and it was demonstrated rather than quoted.**
Run from `app/src-tauri` WITHOUT it, `index --check` exits **1** and
prints the STALE headline, character-identical to a real staleness
report, with `committed: MISSING at docs/architecture/graph.json` only on
the SECOND line. A reader who stops at the headline reads a false red.

**Fixture forecast: zero dogfood assertions move, and it is ENTAILED
rather than sampled** — a byte-identical `graph.json` cannot move an
assertion that reads it — and confirmed independently by
`architecture-dogfood.test.ts` and `map-dogfood-render.test.tsx` passing
inside the merged-main app suite. Nothing in this checkpoint stales the
graph either: `docs/` is `.nputerignore`d, so STATE.md, ROADMAP.md and
ARCHITECTURE.md are all outside the walk, and `index --check` was re-run
after the doc edits to prove it rather than reason it.

## The five card corrections, and the one that was refused

The verifier listed four; a fifth was carried as a judgement call. All
five were **re-derived at the merge rather than transcribed**, and the
four applied ones are inlined at their own sites in the card so a reader
meets each correction where it would otherwise have misled them.

1. **The recorded restoration sha for `runner.rs` was STALE, and this is
   the card's own discipline failing on its own central file.** The card
   recorded `fb1f3b61…`; HEAD is `cc06dd93…`. Confirmed at the merge:
   `fb1f3b61…` is the real value at `4d75bac` and `cfa86ef`, the commits
   the drills actually ran against, and the ONLY intervening change is a
   single `#[cfg(unix)]` line added to `POLL_INTERVAL` at `ade2d1a`. It
   is inert on darwin, and the verifier re-ran six drills at HEAD with
   the claimed blast radius, **so the evidence stands** — but a reader
   following the card's own instruction (sha256 against
   `git show HEAD:<path>`) would have got a mismatch on the one file the
   card is about. `mod.rs` `080107fe…` and `fake_agent.rs` `63b8a9bf…`
   both match HEAD. The failure mode is the durable part: a restoration
   sha is a claim about a COMMIT, and it goes stale the moment the file
   moves for any reason, including one the drills do not care about.
2. **"the three ceilings" was wrong — there are FIVE.** Re-derived by
   reading every timing literal in the new bodies: ceilings at
   `tests/agent_runner.rs:771`, `:894`, `:964`, `:1006` (`< 1000 ms`
   against a 3000 ms grace) and `:1102`
   (**`cancel_returned < 300 ms` against a 900 ms grace**), the tightest
   literal on the branch and the assertion P11 created when it moved. The
   five FLOORS are `:813`, `:851`, `:917` (`>= 800 ms`) and `:1050`,
   `:1108` (`>= 900 ms`), and they are genuine floors: a floor can only
   fail if the code returns EARLY, which slowness cannot cause. The
   correction is to the card's inventory of its own risk surface, not to
   the branch — instrumented, the tightest ceiling measures 0 ms.
3. **Evidence line 5 over-claimed** and now says only what `:1073`
   proves; the synchronous-SIGTERM clause is `T-043-s4`.
4. **Two anchors drifted**, both re-confirmed by locating the symbol
   rather than trusting the number: `if is_reaped && empty` is at
   **1178**, not 1177; the P11 note is at **956**, not 938. The other
   twenty-five anchors the verifier checked are exact.
5. **T-025 §3's "~60 KB" is left standing, and that is a ruling, not an
   oversight.** Measured independently a third time here, by extracting
   the fourteen `include_str!` paths from `KIT_FILES` and summing them:
   **14 files, 23,890 bytes**. Executor, verifier and integrator agree to
   the byte, so the figure is wrong by roughly 2.5×. **On the merits
   `T-043-s2` is right** — the file COUNT is load-bearing (a parity walk
   asserts it, and a wrong count sends a reader hunting a fifteenth file)
   while the byte total is pinned by nothing and re-falsified by every
   method bump, so deleting beats correcting. It was not done here for
   three reasons: the criterion authorised the 13→14 count and nothing
   else, and the executor changing only what it was authorised to change
   is the discipline the verifier praised — an integrator overriding it
   at the merge undoes it; delete-versus-correct is an editorial ruling
   on ANOTHER card's plan text, which is triage's call; and the hazard is
   already closed in place, since §3 now discloses its own error in the
   same parenthetical, which beats a corrected figure that will silently
   go wrong again. `T-043-s2` carries it to triage with three independent
   measurements behind it.

## The verifier's own incident, which produced the best evidence in the card

It belongs in the checkpoint rather than in a footnote, because it is
this card's subject happening to the person auditing it.

The verifier spawned forty CPU burners to test the timing ceilings under
load. **Its cleanup silently failed: zsh does not word-split unquoted
parameters, so `for p in $LOADPIDS; kill -9 $p` passed one malformed
argument and killed nothing — and its `kill -0` verification was vacuous
for the identical reason and reported success.** Forty burners survived
at ppid 1 for eight minutes at load average **148**, and broke four
consecutive bare `cargo test` runs on `docs_watch.rs`, a file this branch
does not touch, whose ten-second `recv_timeout` cannot survive that load.
The red was the verifier's, not the branch's; three quiet runs afterwards
returned 337/0/3 three times.

It found them by `ps`, killed all forty **by verified pid, one at a time,
with no `pkill`**, proved each gone, and excluded the human's app tree and
the `nputer-T-060` pair by pid before any signal went out.

**The accident bought what a quiet machine could not.** With correct
cleanup — pids to a file, killed by `while read` — `agent_runner` at four
threads under forty burners ran **4-for-4 clean at load 26.55, 36.98,
41.46 and 48.95**, loads that deterministically broke a different test's
ten-second timeout. **Every one of T-043's five ceilings held.** The wall
clock moved only 5.1–5.5 s → 5.4–5.7 s, and that is the informative
number: these bodies are SLEEP-bound, not CPU-bound, so CPU starvation
barely reaches them — which supports the executor's structural argument
better than its own table of twelve busy loops did. The executor's honest
caveat was that 38-for-38 on a quiet ten-core box is weak evidence about a
four-core runner; **this is the strong version of that evidence, and it
arrived by accident.** It is still an arm64 machine and CI has still never
run.

## Provenance

T-043 is **built and verified by `claude-opus-5 @fresh`**,
`review: same-model` — the same model on both sides, honestly stamped.
Re-derived across all done cards at this checkpoint rather than assumed:
**52 done cards — 41 read `same-model`, 5 read `self-verified`, 5 read
`independent`, and T-056 is a done card whose `review:` is EMPTY.** T-043
is the card that moves `same-model` from 40 to 41.

Of the five `independent` stamps, **only three have different models on
the two sides**: T-057 and T-058 (codex/gpt-5.6 built, claude-opus-5
verified) and T-060 (claude-opus-5 built, codex/gpt-5 verified). **T-055
and T-066 are stamped `independent` with the SAME model on both sides**,
which is `same-model` by the convention's own definition. That count is
unchanged by this merge, and no card's history was re-stamped.

**A third data point on who stamps `done`.** T-043's verifier closed with
"`status: verifying` left in place for the integrator" and the integrator
stamped it. T-057's verifier left `planned` and its integrator stamped
`done`; T-058's EXECUTOR stamped it in the build commit. Three cards,
three different answers, and `method/roles/executor.md:19` still settles
only who may NOT stamp it at size M.

## In progress / broken right now

Two sibling lanes are live, both cut from `e4a5ae7` and both disjoint
from this merge's Rust fence — verified against their worktrees rather
than assumed from the slugs:

- **T-078 — the conventions describe the machine that exists**
  (`task/T-078-conventions`, worktree `../nputer-T-078`).
  `touches: [docs/CONVENTIONS.md, method/]`. Documentation only; it
  collides with no code lane at all. It moved while this merge was being
  integrated — still at the base `e4a5ae7` when this session started,
  **`c4208c6`** when it finished.
- **T-076 — the id layer is total** (`task/T-076-id-layer`, worktree
  `../nputer-T-076`). `touches: [lib-parser]`. Also moved during the
  integration: `a931bfb` at the start, **`c3560a8`** at the end.

Both tips are recorded because they are moving targets, not because they
were consulted: neither worktree was read into, written to or built from,
and neither lane's fence intersects this merge's five Rust files. The
disjointness was checked against this merge's own file list rather than
inferred from the `touches:` slugs.

Neither was touched by this integration. **`app-agent` and `app-shell`
are released by this merge**, so T-069 and T-070 (both `blocked_by: []`,
both `app-agent`) are now dispatchable, and T-068 still waits on T-065.

Nothing is broken. No lane is blocked on this checkpoint.

## Ports, and what reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid 82549)
serving this checkout. It was never bound, connected to or signalled;
read-only `lsof` only, checked at the start and again at the end, same
pid both times. No `npm ci` or `npm install` ran in the main checkout
(T-052 mechanism B) — every install this session happened in a scratch
worktree under `/private/tmp` that has since been removed. Scratch ports
**17957** (E2E lane) and **18461** (boot gate) were bind-probed free
before use and proven free again afterwards.

**What actually reached their window, stated exactly:**

1. **Their app PROCESS was replaced, one second after the merge
   commit.** This is the news, and it is the opposite of the last merge.
   The binary running at session start (pid `64161`, up since Aug 18) is
   gone; pid **`45155`** started at **11:37:17**, against a merge commit
   at **11:37:16**, under their own unchanged `tauri dev` supervisor
   (ppid `82364`, itself up since Aug 18). The merge's five Rust files
   under `app/src-tauri/**` are the only plausible trigger, since
   `tauri dev` watches that tree and `app/src/**` is a 0-file diff. **The
   supervisor was not restarted and nothing of this integration signalled
   it.**
2. **But that process is NOT running T-043's kill path, and this is
   measured rather than inferred.** The on-disk debug binary was
   rewritten later, at 11:42:59, by this session's own builds in the
   shared `target/` directory. `lsof` shows pid 45155 holding inode
   **26762149** while the on-disk binary is inode **26813168** — a
   different, now-unlinked image. On macOS, replacing a running binary
   does not touch the running process. **So the window they are looking
   at still contains the pre-merge grace poll**, and the relaunch item
   below is not a formality.
3. **No HMR at all.** `app/src/**` is a 0-file diff, so their running
   frontend took no hot update and no module was replaced.
4. **Docs-watcher snapshots.** The watcher ships a full snapshot of
   `<project>/docs` on every change, so their board re-read the tree:
   T-043 now shows `done`, six new `T-043-s*` cards appeared, T-025's
   card changed, and STATE.md, ROADMAP.md and ARCHITECTURE.md all moved
   with this checkpoint.
5. **The map pane saw no new graph.** `docs/architecture/graph.json` is
   inside the watch root but did not move; the pane re-read identical
   bytes.
6. **A second window DID open, briefly.** The boot gate fired, so
   `tauri dev` was spawned on port 18461 and a window was created and
   then stopped on SIGTERM. This is the flash the last checkpoint did not
   have. It also means the boot gate BUILT into the human's shared
   `target/` directory, which is what wrote the 11:42:59 binary above —
   benign, but it is shared state and worth naming.
7. **`app/dist` was rewritten** by the required pre-suite build. The dev
   server does not serve `dist` and no module in its graph imports it, so
   this is invisible to their window.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,stat,lstart,command` at the end: zero `fake_agent` from
this branch, zero stray `cargo`, `rustc`, `playwright`, `vitest`,
`tauri dev` or orphaned shells, and both scratch ports free. **No broad
`pkill` was used at any point.** The two `nputer-T-060` orphans
(`52504`/`52505`, ppid 1, start `Tue Aug 18 16:21:18`) predate this
session, are unchanged before and after, and are deliberately left alone
— they are `T-043-s1`, not this integration's to claim or to clean.

## Next up

1. **Triage the six T-043 suggestions** — they arrived with this merge
   and are the immediate next action. **s4 is the one with reach beyond
   its own card**: it is a poison-drill shape that neither of the two
   ordinals assigned at the last triage covers, and the taxonomy question
   above is triage's to settle. s6 is the one with a deadline in it — a
   test that is correct today and fragile by construction.
2. **T-069 and T-070** are newly dispatchable on the fence this merge
   releases (`app-agent`, `blocked_by: []` on both), alongside the two
   lanes already running.
3. **T-065** (`blocked_by: [T-057, T-058]`) remains unblocked and
   undispatched; **T-067** and **T-068** still wait behind it.
4. The human-owned authenticated genesis below, which is still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3): a merge carries a graph the checkpoint has not regenerated
yet, and a lane cut from one inherits a red `index --check` through no
fault of its own.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light
  and dark completion screenshots. No planner turn has succeeded against
  a real model on this machine.
- **Relaunch the desktop app — and this checkpoint gives it a MEASURED
  reason for the first time.** The process was replaced at the merge but
  is running an unlinked pre-merge image (inode `26762149` against the
  on-disk `26813168`), so it does not contain T-043's kill path. It also
  predates T-051, T-063, T-062, T-060, T-056, T-066, T-055, T-057 and
  T-058. **A cancel in that window still pays the full five seconds**,
  which is worth knowing before judging the cancel latency by hand.
- **Confirm the quit-mid-turn behaviour**, which this card converts from
  tolerance into confirmation: start a `hang`-scenario genesis, quit the
  app, and it should now close promptly rather than after a five-second
  pause. This is the card's own @human line.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and are safe to kill by pid; they are recorded as
  `T-043-s1` rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote. **CI has never run on
  a real runner**, so `index --check` as a CI step remains true in the
  future tense only; the integrator ran it by hand at this checkpoint and
  it exited 0 (T-054's standing clause). The same is true of the token
  lint's dependency on git being on PATH, and now of every Linux claim in
  T-043: `killpg`-versus-zombie is reasoned by case analysis, not
  measured, because no Linux was available.

Milestone 3's implementation list is complete — T-043 was the remaining
process-lifecycle card — but the milestone is not claimed until the real
timed genesis exists. A cancel that releases in 25 ms instead of 5,000 ms
does not prove an interview with a model that can misunderstand the user.

## Health of the tree

At this checkpoint main contains T-043 merge `38886d3` plus this
checkpoint. Parser, app, Rust, E2E, token lint, audit and
graph-currentness gates are all green, and the boot gate fired and
passed.

**ROADMAP WAS ticked and ARCHITECTURE WAS touched, and both are
departures from the last two merges that need arguing rather than
asserting.** On the discriminator this repo actually uses — does it
change what a USER can do? — T-043 is the first card in a while that
answers yes in a form the user experiences directly. It adds no
affordance: cancel and quit both already existed. **What it changes is
that they stop taking five seconds each**, on two paths the user touches
by hand (⌘. and quitting mid-turn), including the common case where the
CLI died instantly. Milestone 3's ROADMAP section narrates exactly this
kind of change — T-042, T-050, T-051, T-062, T-063 and T-066 all have
entries and none of them added a capability either — so the precedent
runs toward inclusion, not away from it. The cards that correctly get
zero ROADMAP narrative (T-044, T-045, T-046, T-053, T-054, T-058) are
gates, lints and dev scripts, and this is not one.

ARCHITECTURE is the sharper call and it turns on a point the last
checkpoint got to make in the negative. T-058 earned no paragraph because
`tools/e2e` has **no C-id** and the Components table stops at C-07.
**That test does not exclude T-043**: `app-agent` maps to **C-14**, which
has no table row but does carry substantial narrative in ARCHITECTURE,
and that narrative already says C-14 "kill[s] the group on cancel" — the
sentence this card is about. What moved is an OWNERSHIP structure, which
is the same kind of movement T-057 earned its paragraph for: the
authority to answer "is the child dead?" goes from three observers each
guessing with `kill(pid, 0)` to one owner publishing to a shared
`ChildHandle` that the observers read. No IPC command, grant, event or
dependency edge moved, the graph is byte-identical, and the paragraph
says so explicitly — what it records is the C-14→C-05 seam's TIMING
contract and the narrowed guarantee, not a new surface.

## Open questions

- **What does `review: independent` mean — a different session, or a
  different model?** Five done cards carry it and only three have
  different models on the two sides. Until it is defined, the field
  cannot be read as cross-model evidence, which is the one thing it looks
  like it is for. T-056 is also a done card with an empty `review:` where
  `self-verified` looks intended. ADR-016 says the distinction remains
  first-class DATA and always visible in TEXT, but never says which
  distinction.
- **Does a size-M card's `status: done` belong to the verifier or the
  integrator?** Three consecutive cards have now answered differently:
  T-058's executor stamped it in the build commit, T-057's integrator
  stamped it at the checkpoint, and T-043's verifier explicitly left
  `verifying` for the integrator. `method/roles/executor.md:19` allows
  `done` only at size S, which settles who may not stamp it but not who
  must.
- **Is `T-043-s4` a seventh poison shape or a variant of the sixth?** A
  mechanism that no body can falsify because a REDUNDANT second path
  covers it is distinct from shape five (no cardinality floor on the
  assertion set) and from shape six (a body that reds while killing no
  unique mutant). P11 was this shape before it moved, which suggests it
  is common rather than exotic. Triage owns the taxonomy.
- **Should a restoration sha be recorded at all?** T-043's own central
  file falsified the card's restoration discipline for a reason that had
  nothing to do with the drills — one inert `#[cfg(unix)]` line landing
  in a later commit. A sha proves restoration at a COMMIT and silently
  stops meaning anything the moment the file moves for any other reason.
  The same failure mode as the four drifted citations the fourth triage
  found, one level down.
- **Should `docs/CONVENTIONS.md` legend the token lint's exit codes?**
  Answered in principle by the fourth triage — it is a criterion of
  T-078, with T-080 restoring the distinction — and left here because
  T-078 is in flight as this is written.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves against
  T-056's direction; it is T-072's third criterion.

**Now answered, and left in place rather than edited out:** *"Should the
T-043 exit observer own a richer child handle, or coordinate with the
worker that alone owns `Child`, to reap early without abandoning a
resistant same-group descendant?"* — **coordinate**, via `ChildHandle`.
The other option was not merely worse: a second owner is a second
`waitpid` on the same pid. And the "without abandoning" clause is the
half that got tested hardest, in both directions, by P3 and P4.

## The fourth triage — 46 suggestions, then 50, dispositioned to zero

Run by `claude-opus-5 @fresh` as a read-only analyst, then applied in the
main checkout. The backlog was enumerated from disk rather than
inherited: **46** files at `status: suggested` before T-058 merged,
**50** after its four verifier findings landed with it, **42** after the
eight resolutions were committed at `9b15f7d`, and **zero** after that
pass. The analyst held no git permission, so every file was written with
editor tools and staged, removed and moved by the architect — the split
is recorded because it is the reason this landed in several commits
rather than one.

**Twelve cards born, T-069 through T-080**, absorbing 35 suggestions. Two
folds (T-051-s8 into T-065, T-063-s3 into T-064). Four parks, each with a
dated unpark trigger. One rejection (T-051-s2, superseded). Eight
resolutions, recorded at `9b15f7d` as dated lines on the cards that
actually closed them.

**EIGHT FINDINGS WERE ALREADY CLOSED AND NOBODY HAD SAID SO.** Four were
expected; four were not. T-060-s3, s4 and s5 were closed inside T-060's
own re-verification, whose verdict says "No blocker or new suggestion
remains" — the files were never removed, and they sat at
`status: suggested` through three triages. T-029-s1 was closed at
`2fc3475`, a commit whose subject is literally that it corrects the trace
s1 was filed about. **The lesson is in T-078**: a verdict sentence that
reads as closing five findings, while two of them asked for written
rules, is exactly how a rule goes unwritten while everyone believes it
exists.

**Four citations no longer resolved**, every one drifted downward by a
later merge into the same file while the finding's substance reproduced
exactly. T-078 carries the rule that follows: a citation names a symbol,
not a line. **T-043's own two drifted anchors are a fifth and sixth
instance**, found the same way and corrected the same way.

**The poison shapes have ordinals.** **Shape five** — the assertion SET
has no cardinality or coverage floor, so deleting an assertion deletes
its own failure (T-058-s2, absorbed by T-080). **Shape six** — a body
that reds under an expected-value poison while killing no mutant another
test does not already kill (T-057-s1, absorbed by T-072). Both are
written into T-078's drill clause.

**Appended 2026-08-19, at T-043's checkpoint.** Suggested is **no longer
zero**: the six `T-043-s*` findings landed with this merge and are
undispositioned. `T-043-s4` raises a candidate SEVENTH shape (see the
open question above), and `T-043-s2` arrives with a recommendation the
integrator endorsed on the merits but declined to execute, so it needs a
ruling rather than a re-measurement — three independent measurements
already agree on 23,890 bytes. The **corpus figures quoted in this
section are as of `9b15f7d` and are now stale**: CONTROL was 521 there
and is **502** at this checkpoint, because the triage's own later commits
deleted 25 more files. The 20.6%-unpinned analysis that made T-080
survives the change in denominator; the raw totals do not.
