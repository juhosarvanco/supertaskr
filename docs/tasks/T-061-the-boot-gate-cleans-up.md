---
id: T-061
title: The boot gate cleans up, and sees what it overlays
feature: F-02
milestone: 3
priority: 27
size: M
status: done
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-061
verified_by: claude-opus-5 @T-061-verify
review: same-model
---

Absorbs: T-046-s1, T-046-s2, T-046-s4 (triage 2026-08-17). The
suggestion files are removed in the same commit as this card. Three
findings in `tools/e2e/scripts/tauri-boot-check.mjs` +
`boot-port.mjs` + `tools/e2e/tsconfig.json`, and T-046-s2 explicitly
says its own drill is the one T-046-s1 changes — so they are one card
or they are three re-runs of the same drill.

THE LEAK IS DEMONSTRATED, NOT ARGUED. Three of the four terminal paths
signal the process group via `finish()` then `killTree()`. The fourth
— `child.once("exit", …)`, the T-040 case and every future "the app
failed to boot" case — prints the report and calls `process.exit(1)`
immediately with nothing signalled (re-verified at triage:
`tauri-boot-check.mjs:226-236`, no `killTree` on that path). T-046's
verifier reproduced the orphan by SIGKILLing the tauri CLI mid-boot,
denying it the chance to tear down its own `beforeDevCommand`: the
check exited 1 with a correct legible report and left **a live vite
listener on 14521 plus an orphaned esbuild helper**. On the DEFAULT
path that listener is on **1420 — the human's port**, and the gate
would have broken the very thing it exists to protect.

Two things keep that from being merge-blocking and neither is a reason
to leave it: the CONVENTIONS BOOT GATE bullet mandates a scratch port
(a convention a tired human can forget), and CI runs on ephemeral
runners (true only while CI is the sole default-path caller).

## Acceptance criteria
- THE CHILD-EXIT PATH SHALL signal the process group before exiting.
  The naive `killTree("SIGTERM")` is NOT sufficient and the notes
  SHALL say why: `killTree` signals the negated child pid, and by the
  time the `exit` event fires node has reaped the child, so that pgid
  names a group whose leader is gone — on a busy machine a recycled
  pid could put the signal somewhere else. Capture the pgid at SPAWN
  time and signal it only if a zero-signal liveness probe on that
  pgid still succeeds (T-046-s1).
- THE ORPHAN DRILL SHALL BE A SHIPPED PROCEDURE, not a one-off:
  start the check on a scratch port, SIGKILL the tauri CLI mid-boot,
  and assert no vite listener and no esbuild helper survives the
  check's exit. The verifier's transcript is the failing case to
  reproduce first.
- THE OVERLAY SHALL BE DERIVED FROM THE COMMITTED VALUES so they stay
  load-bearing. Measured, both directions, at T-046: a broken
  `default-run` exits 1 and a dead `dev` script exits 1 (the
  reassuring half), while `devUrl` pointed at a dead port and
  `beforeDevCommand` pointed at a nonexistent script BOTH exit
  **0 — GREEN**. `beforeDevCommand`: take the committed string and
  append the port flags rather than emitting a fresh `npm run dev`
  (today the overlay hard-codes it, so a renamed committed script
  would silently run the wrong one). `devUrl`: rewrite only the PORT
  of the committed URL, leaving scheme and host. This shrinks the
  hole from "two whole keys unverified" to "one integer unverified"
  — it does not close it, and the notes SHALL say so (T-046-s4).
- THE TWO MUTATIONS ABOVE SHALL JOIN THE EXISTING FIXTURE DRILL (red
  then revert then green), alongside the two that already red.
- `checkJs` SHALL be ON for `tools/e2e`'s `.mjs` scripts, with
  `scripts/**/*.mjs` added to `include`. T-046 added `allowJs` so the
  lane spec could import `boot-port.mjs`, which means tsc now READS
  those JSDoc annotations to type the spec's imports but never CHECKS
  the script against them — a wrong `@param` silently mistypes the
  spec's expectations. Expect to fix the process-kill call where the
  child pid is `number | undefined` under strict, the `recent` array
  and `seen` set inferred from empty literals, and implicit `any` on
  stream chunks (T-046-s2).
- ALL FOUR EXIT-PATH DRILLS (0 / 1 / 2 / 3) SHALL be re-run after the
  flag flip, because the kill path is exactly what changes — which is
  why T-046-s2 asked for its own task and why it is here instead.
- THE DEFAULT PATH SHALL REMAIN untouched in shape: no change to the
  two `[nputer]` startup lines, the timeouts, or the report format.

Verification: headless — `npm run typecheck` from tools/e2e, the four
exit-path drills, the orphan drill, and the four config mutations.
**Every run on a scratch port; 1420 is the human's and SHALL be probed
free and left alone.** @human: none.

## Implementation notes

Built on branch `task/T-061-boot-gate-cleanup` in worktree
`../nputer-T-061`, cut from main's `Checkpoint:` commit **`2036fb2`**, by
claude-opus-5 @T-061, 2026-08-23. Three sibling lanes were live
throughout — T-013 (`app-map`), T-064 (`app-shell`), T-070 (`app-agent`,
`app-interview`) — and this lane's fence is `[tools/e2e]`, disjoint from
all three. **Main moved twice under me while I measured**: `2036fb2` →
`c2179d6` → `09b83e8` → `dc4199d` (the fifth triage landed mid-build).
Every range figure below names the ref it was taken at, twice where the
two answers differ, which is the whole point of naming it.

**The human's app was up the entire time — `node` pid 82549, one socket,
`TCP [::1]:1420 (LISTEN)`, identical at the first read and the last.**
Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else: never bound, never connected to, never signalled. Every
boot ran on a scratch port bind-probed free on all four stacks
(`127.0.0.1`, `0.0.0.0`, `::1`, `::`) first — 14631 through 14653,
prefixed and logged. **No `pkill` was used at any point**, and no signal
in this session was addressed to anything but a pid or a negated pgid
this session had captured at spawn.

### The three criteria, and what each one cost

#### 1. The child-exit path signals the group — and WHY the naive fix is not enough

`killTree("SIGTERM")` on that path is wrong for a reason that is easy to
state and easy to get wrong: **by the time `exit` fires, node has reaped
the child**, so `-child.pid` names a group whose LEADER no longer exists,
and a reaped pid is a pid the kernel is free to hand to somebody else.
Signalling it is a bet that nothing has taken it yet.

What makes the bet winnable is a POSIX guarantee, and I measured it here
rather than quoting it. A process-group id is reserved for as long as
the group has a MEMBER, so:

    a detached `sh -c '/bin/sleep 25 & /bin/sleep 1; exit 7'`
    -> ps pgid of the leader == its own pid                    (detached is setsid)
    -> leader 'exit' event {c: 7}                              (node has reaped it)
    -> process.kill(-pid, 0)                       -> ALIVE    (the orphan holds the id)
    -> ps by pgid                                  -> exactly the orphaned sleep
    -> process.kill(-pid, "SIGTERM"); 400 ms
    -> process.kill(-pid, 0)                       -> throws ESRCH
    -> process.kill(-999999, 0)                    -> throws ESRCH

So the zero-signal probe is not a nicety, it is the discriminator: **a
group that still has members is a group whose id is still reserved**, and
a group that is empty is exactly when the id becomes recyclable. Hence
`groupAlive()` first, `signalGroup()` only if it says yes. `signal 0`
performs the kernel's error checking and delivers nothing, so asking the
question does not answer it in the destructive direction.

**Both branches are exercised in this session's transcripts, which is
the part I would not have believed without seeing.**

- The GROUP-STILL-ALIVE branch, from the orphan drill on 14653:
  `[boot-check] child process group 33377 still has members after the
  child exited — SIGTERM to the group` then `… is empty — no orphan
  survives this check`.
- The GROUP-ALREADY-EMPTY branch, from config mutation M1 (a broken
  `default-run`) on 14641: `[boot-check] child process group 3729 is
  already empty — nothing to signal`. The tauri CLI exited in an orderly
  way there and tore down its own `beforeDevCommand`, so there was
  nothing to reap — and the check **signalled nothing at all**, which is
  the whole safety property. A naive `killTree("SIGTERM")` would have
  fired a signal at a recyclable pgid on that run.

**Two further hardenings, one of which is not decoration.** `pgid` is
captured at SPAWN (`const pgid = isSignalableGroup(child.pid) ? … `) and
never re-read; and `isSignalableGroup` refuses any id that is not an
integer **greater than 1**. That guard is load-bearing:
`process.kill(-0, sig)` is `process.kill(0, sig)` because JavaScript has
`-0 === 0` (measured: `-0 === 0` is `true`, `Object.is(-0, 0)` is
`false`), and POSIX defines that as *every process in the CALLER's own
group*; `process.kill(-1, sig)` is the BROADCAST to every process this
user may signal, which on this machine includes the human's `tauri dev`.
Neither can arise from a real spawn. Both were one typo away in the file
whose job is killing process trees, and the pre-T-061 code had no guard
at all (`process.kill(-child.pid, signal)` with `child.pid` typed
`number | undefined`). `isSignalableGroup` lives in `boot-port.mjs`
precisely so the lane can pin it, which it now does in both directions.

**The `child.kill()` fallback is safe and I measured why.** When the
group probe says gone, `killTree` falls back to the child HANDLE. Node
addresses that through its own record of the spawn: `child.kill()` after
the `exit` event **returns `false`** and signals nothing — it cannot
reach a recycled pid. So the fallback is inert exactly when it would be
dangerous.

**What the child-exit path does now**, in order: print the failure
report **byte-identical to the pre-T-061 one, and FIRST**; probe; if the
group is empty, say so and exit 1; otherwise SIGTERM the group, poll the
probe every 50 ms for `ORPHAN_GRACE_MS` (3 s, env-overridable), escalate
to SIGKILL, poll another second, and exit 1 either way — with a
`WARNING` naming the surviving group and the `ps` incantation to find it
if anything outlives SIGKILL. The exit is inside the continuation, so
the process cannot leave before the reap has had its say.

**One path was deliberately NOT changed**: `child.once("error", …)`, the
spawn-failure path. On a spawn failure `child.pid` is `undefined`, so
`pgid` is `undefined` and there is nothing to signal; adding the call
there would be a no-op dressed as care. The card counts four terminal
paths and this is the fifth; saying so is cheaper than leaving a reader
to wonder.

#### 2. The orphan drill is a shipped procedure — and the failing case came first

`tools/e2e/scripts/orphan-drill.mjs`, `npm run boot:orphan-drill` from
tools/e2e, four exit codes in the family the other three gates use: **0**
clean, **1** THE LEAK (named, then reaped by the drill, because a drill
that manufactures an orphan must not leave one), **2** called wrong (no
`NPUTER_BOOT_PORT`, or the port is busy), **3** the drill could not run.

**THE FAILING CASE, REPRODUCED FIRST, exactly as the card asks.** Both
`tauri-boot-check.mjs` and `boot-port.mjs` were replaced by byte copies
from `git show 2036fb2:<path>` (per-path `git diff --stat` empty for
both, i.e. provably the pre-fix code), and the shipped drill was pointed
at them on scratch port 14633:

    [orphan-drill] group 98615 armed: tauri CLI 98638, vite 98885 listening on 14633
    [orphan-drill] SIGKILL the tauri CLI, pid 98638 (pgid 98615, verified == 98615)
    [orphan-drill] boot check exited (code=1 signal=null)
    [orphan-drill] LEAK: the boot check exited 1 and left 3 process(es) in group 98615, with port 14633 STILL HELD:
        98824 (pgid 98615) npm run dev --port 14633 --strictPort
        98885 (pgid 98615) node .../app/node_modules/.bin/vite --port 14633 --strictPort
        98889 (pgid 98615) .../@esbuild/darwin-arm64/bin/esbuild --service=0.28.2 --ping
    DRILL_PREFIX_EXIT=1

T-046's verifier's transcript, reproduced — **and one process larger than
it recorded**: the `npm run dev` wrapper survives too, so the leak is
three processes, not two. The drill then reaped its own mess
(SIGTERM to group 98615, nothing survived) and the port was free.

Restored by byte copy from the saved fixed files, proved twice —
`shasum -a 256` equal on both sides and `cmp` exit 0 for each — and the
same drill on 14635:

    [orphan-drill] group 99973 armed: tauri CLI 99996, vite 376 listening on 14635
    [orphan-drill] SIGKILL the tauri CLI, pid 99996 (pgid 99973, verified == 99973)
    [orphan-drill] boot check exited (code=1 signal=null)
    [orphan-drill] process group 99973 is EMPTY and port 14635 is free on both families
    [orphan-drill] PASS: the child-exit path signalled its group before exiting
    DRILL_FIXED_EXIT=0

Re-run at the committed ref on 14653: **exit 0**, same shape. Red, then
green, on the same shipped procedure.

**AN ACCIDENT WORTH RECORDING BECAUSE IT IS THE HAZARD ITSELF.** In that
green run the tauri CLI is pid **99996** and the vite it started is pid
**376** — the machine's pid space WRAPPED inside a single boot. The
recycled-pid risk the liveness probe exists for is not a thought
experiment on this machine; it is a few seconds wide.

**THE DRILL'S SAFETY RULES, because it SIGKILLs things beside a live
app.** Every signal it sends is addressed either to the negated PGID it
captured from the boot check's own direct child, or to a pid whose PGID
it has just read back from `ps` and compared against that same group. It
never matches a process by NAME alone, never uses `pkill` or `killall`,
refuses to run without `NPUTER_BOOT_PORT` (exit 2 — its whole job is
manufacturing an orphaned listener, and the default port is 1420),
refuses 1420 through the same `resolveBootPort` the check uses (exit 3),
and refuses any group id `isSignalableGroup` rejects. It learns the
group by finding the check's single direct child in `ps` and then
**asserting `pgid == pid`** — the `detached`/`setsid` property this
drill's every safety claim rests on, read back rather than assumed; if
that ever fails it exits 3 having signalled nothing. Deriving the group
from `ps` rather than parsing the check's own new log line is what lets
the identical drill run against the pre-fix check.

#### 3. The overlay is derived — and the residual is measured, not described

`bootConfigJson(port, committed)` now takes the committed values.
`readCommittedBuildConfig(repoRoot)` reads `build.devUrl` and
`build.beforeDevCommand` out of `app/src-tauri/tauri.conf.json`;
`beforeDevCommandWithPort` APPENDS the port flags to the committed
command; `devUrlWithPort` rewrites ONLY the port of the committed URL.

**The derivation is a no-op against today's committed values, byte for
byte**, and the lane asserts it: committed
`{"devUrl":"http://localhost:1420","beforeDevCommand":"npm run dev"}`
derives to
`{"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}`,
character-identical to the string T-046 hard-coded. (The
trailing-slash dance in `devUrlWithPort` is what buys that:
`new URL(…).href` would normalise to `http://localhost:14521/`.) So
anything that reds that body is a change to what the boot check spawns.

**THE FIXTURE DRILL, five mutations, one at a time, each read back with
`git diff` before anything ran and each restored by byte copy from
`git show HEAD:<path>` with an empty per-path `git diff` and a matching
sha256 afterwards.** `app/src-tauri/tauri.conf.json` baseline sha256
`52eb5e69017c4fd0381d3cc82745ef0d56ce0ea9022e74faa65da2fb98718bc5`,
identical before and after all of them.

| # | mutation | at T-046 | HERE |
|---|---|---|---|
| M1 | `Cargo.toml` `default-run` removed (T-040's class) | exit 1 | **exit 1**, cargo's ambiguity error quoted verbatim, and the group was ALREADY EMPTY |
| M2 | `app/package.json` `"dev": "true"` | exit 1 | **exit 1**, tail shows ten `Warn Waiting for your frontend dev server…` |
| M3a | committed `devUrl` -> a dead PORT (`:14999`) | **exit 0 GREEN** | **exit 0 GREEN — still, by design** |
| M3b | committed `devUrl` -> a dead HOST (`t061-no-such-host.invalid`) | untestable | **exit 1** |
| M4 | committed `beforeDevCommand` -> `npm run no-such-script-at-all` | **exit 0 GREEN** | **exit 1**, `npm error Missing script: "no-such-script-at-all"` quoted |

**M4 is the one the card is about**: the mutation that shipped an app
that cannot launch and reported GREEN now reds, with the cause quoted.

**M3b is the sharper one, and it is not synthetic.** The tauri CLI does
not fail politely on an unresolvable devUrl — it **panics**:
`thread '<unnamed>' panicked at crates/tauri-cli/src/dev.rs:277:52:
called Result::unwrap() on an Err value: … "failed to lookup address
information"`, and the child dies on **SIGABRT** without any chance to
tear down its own `beforeDevCommand`. That is T-046-s1's hypothetical
"a CLI that segfaults" occurring naturally, from a config regression,
with no hand SIGKILL anywhere. Before T-061 that mutation would have
left an orphaned vite on the scratch port; the transcript shows the
group still had members, took SIGTERM, and emptied.

**M3a IS THE HOLE, STILL OPEN, AND THE NOTES SAY SO IN AS MANY WORDS.**
A committed `devUrl` whose PORT is wrong is masked by this overlay and
always will be, because rewriting that port is the one thing the
override exists to do. What T-061 buys is that the committed **scheme**,
**host** and **path** are now load-bearing, and the committed
`beforeDevCommand` is load-bearing in full. **Two whole keys unverified
becomes one integer unverified. It does not close the hole.** The lane
pins the residual as an assertion rather than leaving it as prose
(`THE RESIDUAL, asserted rather than described`), and poison mutant P3 —
restoring T-046's hard-coded `devUrl` — reds the "only the PORT is
rewritten" body while leaving the residual body GREEN, which is that
distinction made mechanical.

**AN UNDERIVABLE COMMITTED CONFIG IS A REFUSAL, NOT A FALLBACK, and the
reason is the whole point of the override.** If `tauri.conf.json` cannot
be read, is not JSON, or has no string `build.devUrl` /
`build.beforeDevCommand`, the check exits **3** before probing or
spawning anything. There is no safe fallback: the only value to fall
back to is the committed port, and on this repository that is **1420**.
A boot check that quietly dropped the overlay would boot on the human's
app. Measured — `devUrl` deleted from the committed config, mutation
read back with `git diff`, restored to the same sha256:

    [boot-check] REFUSED: …/app/src-tauri/tauri.conf.json has no string `build.devUrl`
    to rewrite the port of. The overlay is DERIVED from the committed value and will
    not invent one. Nothing was probed and nothing was spawned.
    EXIT3C=3

This widens the MEANING of exit 3 beyond CONVENTIONS' one-line legend
("the override was refused"); the doc is out of this lane's fence and
the clause is filed as `T-061-s5`.

#### 4. checkJs — and it is three times the change T-046-s2 described

`checkJs: true`, and `include` gains **`scripts/**/*.mjs`** as a GLOB
rather than the three-name list it replaced. T-046-s2 named two scripts;
the directory now holds **six**, three of them T-084's, and a hand list
is the defect T-058 and T-080 each spent a card on.

The flag surfaced **154 errors in 6 files**: docs-scan 97, token-scan 38,
tauri-boot-check 14, docs-gate 3, lint-tokens 1, boot-port 1. 124 of the
154 were TS7006 implicit-any parameters. **Every fix is a JSDoc
annotation, a `@typedef`, or a `/** @type {…} */` cast — no runtime
statement was added, removed or reordered in any of the four scanner
scripts.** The card's own prediction held exactly: `child.pid` typed
`number | undefined` at the process-kill call, `recent` and `seen`
inferred from empty literals, and implicit `any` on the stream chunks.

**THE ANNOTATIONS ARE PROVED BEHAVIOUR-NEUTRAL BY A/B, NOT ASSERTED.**
`docs-scan.mjs`, `token-scan.mjs`, `docs-gate.mjs` and `lint-tokens.mjs`
were each swapped for their `2036fb2` bytes (per-path `git diff --stat`
empty for all four), the same three commands run, then swapped back
(`cmp` exit 0 each):

    diff <pristine --census> <annotated --census>                  -> exit 0
    diff <pristine lint:tokens> <annotated lint:tokens>            -> exit 0
    diff <pristine lint:tokens --selftest> <annotated --selftest>  -> exit 0

And the census reproduces T-084's checkpoint figures at a different ref:
**11 derived readers across 4 suites, 0 frontmatter issues, 117
docs-shaped sites in 22 files, 11 of them in 9 files root-anchored, 24
files holding the root (11 derived / 0 unlinked / 13 unlinkable), 6
unaccounted.**

One `.ts` edit came with it: `tests/docs-input-gate.spec.ts` gained a
single `!` on `DOCS_GATE_BULLET`, because `conventionsBullet` is now
honestly typed `string | undefined`. One character, and it is the
annotation earning its keep on its first day.

#### 5. All four exit paths, re-run after the flag flip

Every code read from `$?` immediately, unpiped, on a bind-probed scratch
port.

| code | how | evidence |
|---|---|---|
| **0** | 14638, 14652 | both `[nputer]` lines, `process tree stopped (exit=null signal=SIGTERM)` |
| **1** | 14639, overall timeout 2500 ms | `timed out after 2500 ms`, 10-line tail, tree stopped, no survivors |
| **1** | 14640, watchdog `NPUTER_BOOT_QUIET_MS=1200` | `no output for 1200 ms (watchdog)`, tree stopped |
| **1** | M1/M2/M3b/M4 above, the child exiting early | the new cleanup path, both probe branches |
| **2** | 14636 held by a listener this session owned | `ABORT: port 14636 (NPUTER_BOOT_PORT) is in use` |
| **3** | `NPUTER_BOOT_PORT=1420` | `REFUSED: … refusing … Nothing was probed and nothing was spawned.` |
| **3** | `NPUTER_BOOT_PORT=not-a-port` | `REFUSED: … is not a valid port number` |
| **3** | committed `devUrl` deleted | the new refusal, above |

`npm run` propagates all four (measured: bare node exits 0/1/2/3 arrive
as 0/1/2/3 through `npm run`).

#### 6. The default path's shape

**Unchanged**: the two `[nputer]` needles, `TIMEOUT_MS`, `QUIET_MS`,
`TAIL_LINES`, the `finish()` SIGTERM-then-SIGKILL-after-10s grace, the
exit-2 messages, the exit-3 messages, the `spawning` log line, the
overlay log line's wording, and the child-exit failure report **byte for
byte** — it is still printed FIRST, before any cleanup line, so the
diagnosis a reader came for is still the last thing in the failure
block. With `NPUTER_BOOT_PORT` unset the argv is still exactly
`["run","tauri","dev"]`, no overlay is derived, `tauri.conf.json` is not
even read, and both committed keys are therefore still tested for real —
which is why the default path is the one place the residual above does
not apply.

**Added, and it is one stdout line plus the cleanup lines**:
`[boot-check] child pid N; captured process group N (detached: setsid,
so pgid == pid)`, printed after a successful spawn. It is none of the
three things the criterion protects, it is the only external witness
that the capture happened, and the paths the lane asserts spawn nothing
still print nothing (`assertNothingSpawned` is untouched and green).

### Ranges, every dot count stated, at their own refs

**At `c2179d6`** (main's tip when I first measured):

    git merge-tree --write-tree c2179d6 HEAD  -> tree bc84cf57…, exit 0
    git diff --name-only c2179d6 <TREE>                   -> 11   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only c2179d6...HEAD   (THREE dots)    -> 11   cmp against the forecast: exit 0
    git diff --name-only c2179d6..HEAD    (TWO dots)      -> 18   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..c2179d6 (TWO dots)      ->  7   main's advance, all docs/
    git diff --name-only 2036fb2..HEAD    (TWO dots)      -> 11   the branch's own

**At `dc4199d`** (main's tip an hour later — the fifth triage landed
mid-build):

    git merge-tree --write-tree dc4199d HEAD  -> tree 0ca45730…, exit 0
    git diff --name-only dc4199d <TREE>                   -> 11   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only dc4199d...HEAD   (THREE dots)    -> 11   cmp against the forecast: exit 0
    git diff --name-only dc4199d..HEAD    (TWO dots)      -> 51   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..dc4199d (TWO dots)      -> 40   main's advance, all docs/

`merge-tree`'s exit was read from `$?` and not swallowed by a command
substitution; it is 0 at both refs. `comm -12` over main's advance and
the branch's own is **EMPTY** at both, and the arithmetic checks it:
7 + 11 = 18 and 40 + 11 = 51, which are exactly the two forbidden counts.
**The prescribed answer is 11 at both refs and the forbidden one moved by
33 in an hour** — the same right-hand-endpoint drift T-081 and T-084
each recorded, watched happening live this time.

### Gate derivations, over the prescribed 11

| gate | prescribed (11) | forbidden two-dot at `c2179d6` (18) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — NOT OWED** | 0 — also not owed |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **2 — FIRES** | 2 — fires |
| DOCS GATE (a `docs/` path a code suite reads) | **0 — NOT OWED** | **7 — FIRES**, one suite |

**THIS IS THE THIRD GATE'S FIRST RECORDED FLIP, and it is in the
over-firing direction, which is the direction CONVENTIONS says every
measured error has been.** Main's advance from my merge-base is entirely
`docs/`, so the forbidden range hands this tools-only lane seven
documents it never opened — a room, two design docs and four Codex
captures — and manufactures a DOCS GATE run owing `npm test from
tools/e2e/`. BOOT GATE and GRAPH REGEN answer identically under both
ranges here, so the flip is the new gate's alone. Measured, not
predicted:

    node tools/e2e/scripts/docs-gate.mjs $(cat <prescribed 11>) -> exit 0
      "11 changed path(s) given, none under docs/ — this gate is not owed."
    node tools/e2e/scripts/docs-gate.mjs $(cat <forbidden 18>)  -> exit 1
      "FIRES — 7 path(s) under docs/ are code inputs. Run: npm test from tools/e2e/"

**The `$(cat <list>)` spelling was used deliberately and never `xargs`.**
See `T-061-s3`: on this machine `xargs` loses two of the gate's four
codes, and it loses them differently from how CONVENTIONS says it does.

**BOOT GATE: NOT OWED, AND RUN ANYWAY, BEFORE AND AFTER.** The trigger
matches 0 of the 11 paths — but this card edits the gate itself, so
running it is not optional here. **Before** any edit, on 14631: exit
**0**, both `[nputer]` lines. **After**, at the committed ref, on 14652:
exit **0**, both lines, plus the new pgid line. Plus the six mutation
runs and the three orphan-drill runs in between: **thirteen boots this
session, zero survivors after any of them.**

**GRAPH REGEN: OWED, RUN, A PROVEN NO-OP.** The trigger matches
`tools/e2e/tests/boot-check-guard.spec.ts` and
`tools/e2e/tests/docs-input-gate.spec.ts` (the three `.mjs` files that
are the substance of this change do NOT match it — `.mjs` is absent from
the trigger, read off the bullet). `index --check --root ../..` from
app/src-tauri exits **0** BEFORE — *graph.json is CURRENT … 585305
bytes, 119 files, 1018 symbols, 1539 edges* —
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored` exits **0** and moves **ZERO paths** (`git status --porcelain`
empty), and `index --check` exits **0** again after. Derivable rather
than lucky: `.nputerignore` excludes `tools/`, so **none of the eleven
paths is indexable** — the fourth worked example of the trigger being
deliberately wider than the walk.

**THE THREE-FIXTURE RULE DOES NOT FIRE**: no indexed file moves, and
`git diff --stat 2036fb2..HEAD -- app/ lib/ crates/ docs/architecture/`
is empty.

### Suites, every exit code from `$?` unpiped, at the committed ref

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`;
  `npx tsc --noEmit` `PARSER_TSC_EXIT=0`; `npm run build`
  `PARSER_BUILD_EXIT=0` FIRST, per the fresh-clone order — this worktree
  started with no node_modules and no `lib/parser/dist`.
- **app: 840/840 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, `index-kNOKiTKD.js`
  **502.75 kB** and `index-CwYF5FQb.css` **43.95 kB** — both hashes
  identical to the ones at `e8c4ab7`, as they must be, since this branch
  moves no `app/**` path at all.
- **Rust, bare `cargo test --no-fail-fast`: 352 passed / 0 failed / 3
  ignored**, `CARGO_TEST_EXIT=0`, summed programmatically over **fifteen**
  `test result:` lines. **The first run of it was 351/1/3 at exit 101**
  and that is filed as `T-061-s4`, not swept: a stderr-tail assertion
  read an empty tail once under parallel load, went 5-for-5 green in
  isolation, and the immediate re-run of the whole suite was 352/0/3.
  `app/`, `lib/` and `crates/` have a ZERO diff on this branch.
- **E2E: 129/129**, `E2E_EXIT=0`, one worker, zero retries, zero skips,
  scratch port 14651 — 121 at the merge-base plus the 8 new bodies.
  `npm run typecheck` `E2E_TYPECHECK_EXIT=0` **with `checkJs` on**.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `clean (TOKEN 124 files under app/src, app/test, tools/e2e; CONTROL
  591 tracked text files)`, selftest at 49 TOKEN + 4 CONTROL samples, 71
  walk-policy checks, 8 evidence-floor checks. The figures at `e8c4ab7`
  were TOKEN 123 / CONTROL 590; this branch adds exactly one tracked
  first-party file, `scripts/orphan-drill.mjs`, which is both a `.mjs`
  under tools/e2e and a tracked text file, so **+1 to each**. Derived at
  my own ref, and the arithmetic is the check.
- **DOCS GATE: exit 0, NOT OWED** on the code commit; see below for the
  notes commit, which is a different answer.
- **`index --check`** exit **0** before and after the regen.

**ONE RED I CAUSED AND DID NOT FIX, because fixing it was not the
answer.** Before committing, the lane ran **128 passed / 1 failed**:
`token-scan.spec.ts`'s seven-plant body asserts
`git diff --quiet -- <seven tracked files>`, one of which is
`tools/e2e/package.json`, and this lane adds an npm script to it. The
sha256 round-trip three lines above it passed for all seven, so the
restore was byte-exact and the assertion was answering a different
question — *is the working tree clean* rather than *did the lane put
back what it took*. Committing and re-running, nothing else changed,
gave 129/129 at exit 0. Filed as `T-061-s2`.

### The poison drill — NINE mutants, one-sided, every mutated text read back

Every mutant is a change to the PRODUCER (`scripts/boot-port.mjs`) and
never to an assertion, built from a saved base file with an exact
substitution count of 1 (the planter aborts otherwise), each mutated
text read back with `diff` against the base **before** the suite ran,
each restored by byte copy with `cmp` exit 0. Base sha256
`de005bc0c40f51b296c57f06c39246f1cb34402f78ceb1d6ed7dacbda546704a`,
identical at the end.

| mutant | one-line change | reds |
|---|---|---|
| P1 | `beforeDevCommandWithPort` emits `npm run dev` instead of the committed command | 2 failed / 12 passed — *carries the COMMITTED dev command*, *already carries `--`* |
| P2 | the `--` separator is always inserted | 1/13 — *already carries `--`* |
| P3 | `devUrlWithPort` returns T-046's hard-coded `http://localhost:${port}` | 1/13 — *only the PORT … survive* |
| P4 | the trailing-slash preservation dropped | 4/10 — *threads the matching --config*, *only the PORT*, *THE RESIDUAL*, *no-op byte for byte* |
| P5 | the port is rewritten only when the committed one is 1420 | 2/12 — *only the PORT*, *THE RESIDUAL* |
| P6 | the missing-`devUrl` refusal short-circuited | 1/13 — *an underivable committed config REFUSES* |
| P7 | `tauriDevArgs`'s no-committed-config refusal short-circuited | 1/13 — *an OVERRIDE with no committed config refuses* |
| P8 | `isSignalableGroup` accepts `>= 0` | 1/13 — *the process-group guard* |
| P9 | the load-bearing `--` dropped from the spawn argv | 1/13 — *threads the matching --config* |

All nine exit 1. **Every one of the 8 new bodies and the 1 changed body
reds under at least one mutant**, and the mutants discriminate rather
than merely killing: **P3 leaves THE RESIDUAL green while killing *only
the PORT*** — restoring T-046's hard-coded devUrl does not change the
fact that a wrong committed port is masked, which is exactly what that
body claims and the reason the two are separate bodies rather than a
duplicate pair (the SHAPE SIX question, asked and answered with a
mutant).

**WHAT THE DRILL CANNOT SEE HERE, said plainly**: the group-signalling
helpers live inside `main()`'s closure in a module that runs `main()` at
import (deliberately, T-046), so **no lane body can poison them**. Only
`isSignalableGroup` was liftable and it is pinned. The rest is pinned by
the orphan drill, which is a hand procedure. Filed as `T-061-s6` with a
concrete shape for closing it.

### Security sweep, re-derived at this ref

- **No lockfile, no `Cargo.toml`, no `tauri.conf.json`, no capability
  file, no `.entitlements`** in the range — 0 paths matched. The one
  `package.json` is `tools/e2e/package.json` and its whole diff is **one
  added script line**; `devDependencies` is untouched. **No dependency
  added.**
- `app/src-tauri/src/acl_pin.rs`: **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` —
  the brief's figure, reproduced. `EXPECTED_GRANTS` declaration line
  **54**, closing `];` line **147**, entries 55–146 = **92**, with **92**
  quoted strings, **92 UNIQUE** quoted strings and **zero** blank or
  comment lines. Counted from the symbol, never the line.
- **Exactly THREE `#[ignore]` attributes**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo ROOT:
  `crates/nputer-index/tests/perf.rs:53`,
  `crates/nputer-index/tests/self_graph.rs:58`,
  `tests/agent_runner.rs:3767`, all three carrying `= "reason"`.
- **IPC is THIRTEEN at both ends**: 13 anchored `#[tauri::command]`
  attributes, 13 `generate_handler!` entries counted after stripping
  comments from the macro body.
- **0** secret-shaped added lines (`sk-`, `AKIA`, PEM, bearer, and
  `key|secret|password|token` assignment shapes). **0** of the eleven
  paths carries a NUL byte, read as BYTES rather than through a shell
  argument — a `grep` for `$'\x00'` cannot express a NUL in argv and
  matches everything, which this executor did once before catching it.
- **TWO new process surfaces, named rather than denied**, both in
  `orphan-drill.mjs`: `execFileSync("/bin/ps", [argv array])`, read-only
  with no shell and no interpolated input, and
  `spawn(process.execPath, [bootCheck])`, an argv array with no shell.
  Neither is an IPC command or a grant. The third surface is the point
  of the card — `process.kill` — and it is guarded by
  `isSignalableGroup` plus the zero-signal probe, and addressed only to
  a pgid captured at spawn.

### What reached the human's machine

1. **Their app process is unchanged** — `node` 82549, `TCP [::1]:1420
   (LISTEN)`, one socket, identical at the first read and the last. This
   branch touches no `app/src/**` and no `app/src-tauri/**` path, so the
   watcher had nothing to rebuild, and BOOT GATE's own trigger set
   predicted that.
2. **Thirteen `tauri dev` boots ran in `../nputer-T-061`**, each on its
   own scratch port, each cleaned up. `ps -Ao pid,pgid,command` filtered
   to this worktree is EMPTY at the end; `lsof` on every scratch port
   used is empty.
3. **`../nputer-T-061/app/src-tauri/target` was written** by the warm
   build, `cargo test` twice, the regen and every boot. It is this
   worktree's own target directory — there is no `CARGO_TARGET_DIR` and
   no `.cargo/config.toml` on this tree, so the main checkout's target
   was never touched.
4. **`docs/architecture/graph.json` did not move** — 119 files, 1018
   symbols, 1539 edges, before and after the regen.
5. **The two `nputer-T-060` `fake_agent` orphans (52504 / 52505, ppid 1,
   started Tue Aug 18 16:21:18) are untouched and still running**,
   verified at the end. They are a human decision recorded in STATE
   (`T-043-s1`) and this card is about orphans, which is exactly why
   they were left alone.
6. **The scratch directory is not private**: every file this session
   wrote there is prefixed `T061-`.

### Findings

Six, all filed as `status: suggested` with `suggested_by: executor
claude-opus-5 @T-061`:

- **`T-061-s1`** — the `T-046-s4` id was REUSED after promotion, so this
  card's own preamble tells its executor to delete a live unrelated
  finding.
- **`T-061-s2`** — the seven-plant body asks git whether the tree is
  clean, not whether the lane restored what it planted.
- **`T-061-s3`** — what BSD `xargs` actually does here: it does not run
  the utility on an empty list, and it maps non-zero to **1**, not 123.
  Both facts CONVENTIONS records are wrong, and T-084's exit-2 fix is
  unreachable through the documented pipe.
- **`T-061-s4`** — the flaky `stderr_tail` assertion.
- **`T-061-s5`** — the orphan drill ships and CONVENTIONS does not name
  it; plus exit 3's legend is now incomplete.
- **`T-061-s6`** — the group-signalling path has no headless pin.

### Two things in the dispatch brief that the tree disagreed with

- **"BSD `xargs` maps a utility exit of 1–125 to 123."** Not on this
  machine. Its man page says 127 / 126 / **1**, and 1, 2, 3, 4 and 255
  all measure as **1**. The 123 mapping is GNU findutils'. The brief's
  CONCLUSION — do not read an exit code through that pipe — is right,
  and `T-061-s3` measures the real behaviour, which is worse: the empty
  list never reaches the gate at all.
- **"The suggestion files are removed in the same commit as this
  card"**, inherited from the card's own preamble. All three were
  already removed at `abc6814`, the triage commit that created this
  card. The file that now carries the name `T-046-s4` is a DIFFERENT,
  live finding and was **not** removed (`T-061-s1`).

Everything else in the brief reproduced: the `e8c4ab7` figures (app
840/840 over 43, parser 263/263, cargo 352/0/3 over 15 lines, e2e 121
before my 8, TOKEN 123 and CONTROL 590 before my one new file), `.mjs`
absent from the GRAPH REGEN trigger, the `acl_pin.rs` hash, the three
`#[ignore]`s, IPC 13 at both ends, `[::1]:1420`, and all three sibling
lanes live and disjoint.

### The notes commit's own gate run, because this card is a code input too

The section above measures the CODE commit `44007bc` (11 paths, DOCS
GATE not owed). This card and its six findings are seven more paths, and
they are `docs/tasks/T-*.md` — so the DOCS GATE fires on the branch as a
whole and this is the obligation T-084's merge created for its own next
step, met here rather than left to the integrator.

Derived at main tip **`4d2f03c`** — main's FOURTH position during this
build, and the reason every count above names its ref:

    git merge-tree --write-tree 4d2f03c HEAD  -> tree 20dddca5…, exit 0
    git diff --name-only 4d2f03c <TREE>                   -> 18   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 4d2f03c...HEAD   (THREE dots)    -> 18
    git diff --name-only 4d2f03c..HEAD    (TWO dots)      -> 60   THE FORBIDDEN PRE-MERGE FORM

Eighteen = the eleven code paths plus the seven docs paths.

    node tools/e2e/scripts/docs-gate.mjs $(cat <the 18>)  -> exit 1

**FIRES — 7 paths under docs/ are code inputs, owing THREE suites**
(`npm test from app/`, `npm test from tools/e2e/`,
`npx vitest run from lib/parser/`, and NOT `cargo test`, which is the
proportionality the gate promises for a flat task card). All three run
with the seven cards on disk:

- **parser 263/263 across 12 files, exit 0** — its smoke test parses this
  repository's live `docs/` tree and requires zero issues, which is the
  body that would have caught `9c64cd8`.
- **app 840/840 across 43 files, exit 0** — the two dogfood bodies.
- **E2E 129/129, exit 0**, scratch port 14654 — the two specs that walk
  all of docs/.

The gate's frontmatter half is green over the WHOLE tree, not just the
diff: *every live task card's frontmatter parses, with a legal status*,
with `status: verifying` on this card and `status: suggested` on all six
findings.

**BOOT GATE and GRAPH REGEN are unmoved by the seven docs paths** —
neither trigger can see `docs/`, by construction, which is the sentence
the DOCS GATE exists because of.

## Verdicts

### 2026-08-23 — APPROVED (claude-opus-5 @T-061-verify, review: same-model)

**Every criterion holds and I proved the load-bearing one with my own
mutant rather than the card's.** Five findings below, none blocking:
four are corrections to the notes and one is a defect in the new drill's
exit-code contract that produces a false ALARM, never a false green.
Verified in worktree `../nputer-T-061` at **`cc14fc9`**, against main
tip **`4d2f03c`**. **The human's app was untouched throughout — `node`
pid 82549, one socket, `TCP [::1]:1420 (LISTEN)`, identical at the first
read and the last, read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else.** Eleven `tauri dev` boots on bind-probed scratch ports
14671–14680; no `pkill`; every signal addressed to a pgid captured at
spawn or to a pid read back as a member of it. The `nputer-T-060`
orphans (52504 / 52505, ppid 1, started Tue Aug 18 16:21:18) are
untouched and still running.

#### Ranges, every dot count stated

    git merge-tree --write-tree 4d2f03c cc14fc9  -> tree 0d4c0ec7…, exit 0
    git diff --name-only 4d2f03c 0d4c0ec                 -> 18   THE PRESCRIBED FORM
    git diff --name-only 4d2f03c...cc14fc9  (THREE dots) -> 18   agrees
    git diff --name-only 4d2f03c..cc14fc9   (TWO dots)   -> 60   THE FORBIDDEN FORM
    git diff --name-only 2036fb2..4d2f03c   (TWO dots)   -> 42   main's advance
    git diff --name-only 2036fb2..cc14fc9   (TWO dots)   -> 18   the branch's own
    comm -12 over the last two                           ->  0   EMPTY

42 + 18 = 60, which is exactly the forbidden count. The notes' table
says **11** at `c2179d6` and `dc4199d`; that was the CODE commit, and
the notes' own closing section re-derives **18** at `4d2f03c`. Both are
right at their refs and I reproduce the second.

#### Suites, every code from `$?` unpiped

- **parser 263/263 over 12 files, exit 0**; `npm run build` exit 0 first.
- **app 840/840 over 43 files, exit 0**; `npm run build` exit 0.
- **E2E 129/129, exit 0**, one worker, zero retries, zero skips;
  `npm run typecheck` **exit 0 with `checkJs` on**.
- **token lint exit 0, `--selftest` exit 0 — TOKEN 124 / CONTROL 597.**
  The notes say CONTROL **591**; see finding 4.
- **Rust, bare `cargo test`: 352 passed / 0 failed / 3 ignored** summed
  over **fifteen** `test result:` lines, exit 0. Under
  `--no-fail-fast` × 7 it is **NOT stably green**; see finding 5.

#### Gates

- **BOOT GATE** — 0 of the 18 paths match, NOT OWED, run anyway because
  this card edits the gate: **exit 0** on 14671, both `[nputer]` lines,
  no survivor on the port.
- **GRAPH REGEN** — fires on the two `.spec.ts` paths. `index --check
  --root ../..` **exit 0** (585305 bytes, 119 files, 1018 symbols, 1539
  edges) → `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` **exit 0**, `git status --porcelain` **empty,
  zero paths moved** → `index --check` **exit 0**. A proven no-op,
  re-derived.
- **DOCS GATE** — invoked directly over the prescribed 18 with the
  `$(cat <list>)` spelling: **exit 1, FIRES**, 7 docs paths, owing
  **three** suites. All three run green above.

#### The criteria, attacked

**1 — the child-exit path.** The naive fix is rejected for the right
reason, and I built the mutant the card implies but does not name.
Replacing only the child-exit continuation with a bare `process.exit(1)`
— the pre-T-061 behaviour of that path, everything else byte-identical —
and running the SHIPPED drill on 14674:

    [orphan-drill] LEAK: the boot check exited 1 and left 3 process(es) in group 94247,
      with port 14674 STILL HELD:
        94457 (pgid 94247) npm run dev --port 14674 --strictPort
        94519 (pgid 94247) node …/app/node_modules/.bin/vite --port 14674 --strictPort
        94520 (pgid 94247) …/@esbuild/darwin-arm64/bin/esbuild --service=0.28.2 --ping
    DRILL_MUTANT_A_EXIT=1

and the same drill against the shipped code on 14672:

    [boot-check] child process group 90797 still has members after the child exited — SIGTERM to the group
    [boot-check] child process group 90797 is empty — no orphan survives this check
    [orphan-drill] PASS: the child-exit path signalled its group before exiting
    DRILL_FIXED_EXIT=0

Red, then green, on the same shipped procedure — three orphans, not
T-046's two, exactly as the notes record.

**THE PROBE-REMOVAL DEMONSTRATION, and it does not say what the card
says it says.** Measured headlessly with detached `sh -c "sleep N &
exit 0"` trees that bind no port and that this verifier created and
reaped itself:

| # | state | `kill(-pgid, 0)` | what the mutant's unguarded signal hits |
|---|---|---|---|
| P2 | leader reaped, member alive | ALIVE | the right tree — the fix signals here, correctly |
| P3 | group empty, id not yet reused | ESRCH | nothing; ESRCH, harmless **today** |
| P4 | id now names a LIVE stranger | **ALIVE** | **the stranger — and THE FIX KILLS IT TOO** |

So the zero-signal probe buys exactly one thing: it refuses to signal an
**empty** group. It is not recycling protection, because a recycled id
that has become live again passes the probe. The card's rationale —
*"a recycled pid could put the signal somewhere else. Capture the pgid
at SPAWN time and signal it only if a zero-signal liveness probe still
succeeds"* — reads as though the pair closes that hole. It narrows it;
P4 is the measurement. The code's own comment on `groupAlive` states the
narrow claim correctly and does not overreach.

**And "captured at SPAWN" is type hygiene, not recycling protection.**
Measured: `child.pid` is the **same integer after the `exit` event**
(81368 → 81368, `typeof number`), so `-child.pid` read at kill time
names the same group the spawn-time capture does. `child.kill()` after
the event returns `false`, as the notes say. The comment at
`tauri-boot-check.mjs:212` — *"Capturing it here rather than reading
`child.pid` at kill time is the whole point"* — is not true on Node; the
whole point is the probe, plus evaluating `isSignalableGroup` once at a
moment when the pid is known good. Finding 2.

**The `> 1` guard, attacked.** `isSignalableGroup` refuses `undefined`,
`null`, `NaN`, `Infinity`, `-0`, `0`, `1`, `-1`, `-1420`, `1.5` and the
strings `"2"` / `"1420"`. It accepts **every integer > 1 with no upper
bound** — including 100000, 2\*\*53 and `MAX_SAFE_INTEGER`, none of
which can be a pid on this machine (`kern.maxproc` 6000, PID ceiling
99999). So the answer to *what value could pass while naming the wrong
group* is: **the predicate is a SHAPE check, not an identity check — any
integer > 1 passes, and the one that names the wrong group is a RECYCLED
pid, the same integer at a later time.** That is unconstructible from a
real `child.pid`, and the residual is the P4 row above, not the guard.
The lane's own assertion that `isSignalableGroup(2 ** 20)` is *"a real
spawned group"* is a cosmetic over-claim; 1048576 is ten times the pid
ceiling.

**Recycling is not hypothetical here, and I saw it too.** Sequential
allocation, ceiling 99999. My own busy-port holder, spawned after this
session had reached pid 98xxx, came back as **pid 176**. The pid space
wrapped inside my verification run, exactly as it wrapped inside the
executor's (tauri 99996 → vite 376).

**2 — the orphan drill.** Refusals verified BEFORE trusting it with
anything: no `NPUTER_BOOT_PORT` → **exit 2**; `=1420` → **exit 3**;
`=not-a-port` → **exit 3**; each printing *"Nothing was probed and
nothing was spawned"*, and nothing was. Its `pgid == pid` assertion is
strong for a reason the notes do not state: `detached: true` is
`setsid(2)`, so the group lives in a **new SESSION**, and POSIX
`setpgid` cannot move a process into a group in another session — so a
foreign process cannot join, and the id cannot be recycled while the
group has a member. The one escape is a member that calls `setsid()`
itself, which leaves the group and would be invisible to
`groupMembers()`; the drill's second assertion, `portFree(port)`, covers
that for the vite listener but not for a hypothetical daemonising
esbuild. I could not construct the case the brief asked for, and I
believe it is unconstructible on POSIX by any route but that one.
**But the drill's documented red direction does not work — finding 1.**

**3 — the overlay.** Re-run, both halves of the discriminating pair:

| run | mutation | result |
|---|---|---|
| M4, port 14675 | committed `beforeDevCommand` → `npm run no-such-script-at-all` | **exit 1**, `Error The "beforeDevCommand" terminated with a non-zero status code.` quoted in the tail |
| M3a, port 14676 | committed `devUrl` → `http://localhost:14999` | **exit 0 — GREEN, the residual, live** |

`tauri.conf.json` baseline sha256
`52eb5e69017c4fd0381d3cc82745ef0d56ce0ea9022e74faa65da2fb98718bc5`,
identical before and after both, each mutation read back with
`git diff` and restored by `git checkout`. Poison mutant **P3** re-run
(`devUrlWithPort` returns T-046's hard-coded string, exactly one
substitution, read back): **1 failed / 13 passed** — it kills *only the
PORT of the committed devUrl is rewritten* and leaves **THE RESIDUAL
green**. The two bodies are genuinely distinct and the residual is
asserted, not described. Against today's committed values the derived
overlay is byte-identical to T-046's:
`{"build":{"devUrl":"http://localhost:14671","beforeDevCommand":"npm run dev -- --port 14671 --strictPort"}}`,
observed on the wire in the BOOT GATE run.

**5 — `checkJs`.** On, with `scripts/**/*.mjs` as a glob; typecheck
exit 0. I did not take the A/B on trust and I did not only repeat it.
Repeated first: the four `2036fb2` script bodies swapped in, `--census`,
`lint:tokens` and `lint:tokens --selftest` **byte-identical** (diff exit
0 each), plus a full **DOCS GATE run over the prescribed 18 also
byte-identical**, then swapped back with sha256 equal. Then proved
statically: both versions transpiled with `tsc --removeComments` and
compared. `docs-gate`, `lint-tokens` and `token-scan` are **token-
identical modulo added parentheses**. `docs-scan` has exactly four
non-parenthesis edits, and all four are inert:

- `const spec = m[3]` / `const called = m[1]` — a second read of a
  RegExp match property, hoisted; no side effect either way.
- `data.status` → `data["status"]` — identical semantics.
- `calleeCache.get(key)` → `… ?? null` — the map is `set` only from
  `found`, which is an object, `null`, or a recursive call returning
  `CalleeHit | null`; **by induction it never holds `undefined`**, so
  the coalesce is unreachable.
- `if (hit === null)` → `if (hit === null || hit === undefined)` — the
  `resolved.get(name)` two lines above is guarded by
  `if (!resolved.has(name)) { … resolved.set(name, hit) }`, so
  `undefined` is **unreachable**; under the old code that value would
  have thrown at `hit.ctx` rather than continuing.

So: two edits are not syntactically inert, and both are provably
unreachable on any input where the old code did not already throw. The
annotation pass is behaviour-neutral, and now for a stated reason rather
than a passing diff.

**6 — the four exit paths, re-run at my refs.** **0**: 14671. **1**:
overall timeout 2500 ms on 14678, no-output watchdog 1200 ms on 14679,
and the child-exit path on 14675 and in every drill run. **2**: 14680
held by a listener this session owned and reaped. **3**: `=1420` and
`=abc`, plus the drill's own three refusals. Every code read from `$?`
unpiped through `npm run`.

**7 — the default path's shape.** `NEEDLES`, `TIMEOUT_MS`, `QUIET_MS`,
`TAIL_LINES`, the 10 s `finish()` grace and the `tauri dev exited on its
own` report string are **byte-identical to `2036fb2`**, compared at both
refs. `tauriDevArgs({port: 1420, overridden: false})` is still exactly
`["run","tauri","dev"]` and reads no config. The one added stdout line
is none of the three things the criterion protects.

#### Security sweep, re-derived

`acl_pin.rs` **0-file diff**, sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
Exactly **three** `#[ignore]` (`^[[:space:]]*#\[ignore`, pathspec
`'*.rs'`): `crates/nputer-index/tests/perf.rs`,
`crates/nputer-index/tests/self_graph.rs`, `tests/agent_runner.rs`. IPC
**13** `#[tauri::command]`. **No dependency added** — the only manifest
in the range is `tools/e2e/package.json` and its whole diff is one
script line. Shell-adjacent sweep of the new code: **no `shell: true`
anywhere**, `execFileSync("/bin/ps", [argv])` read-only with no
interpolation, `spawn(process.execPath, [bootCheck])` and
`spawn("npm", args)` both argv arrays; **no `pkill`/`killall`; no
hardcoded pid; no path outside the worktree**. Every `process.kill` is
addressed to `-pgid` captured at spawn, or (once) to `cli.pid` read back
from `ps` and compared against that same group in the line above the
signal.

#### Findings — none blocking

**1. The shipped drill cannot run against pre-fix byte copies, and its
crash reports itself as a LEAK.** `orphan-drill.mjs` imports
`isSignalableGroup` from `./boot-port.mjs`, which does not exist at
`2036fb2` (0 occurrences). With both scripts byte-copied from that ref —
the procedure the notes describe under *"THE FAILING CASE, REPRODUCED
FIRST"* — the drill dies at ESM link time:

    SyntaxError: The requested module './boot-port.mjs' does not
    provide an export named 'isSignalableGroup'
    DRILL_PREFIX_EXIT=1

Two things. (a) A future verifier following the notes cannot reproduce
the red direction that way; the transcript must have come from an
earlier revision of the drill. I reproduced it instead with the isolated
child-exit mutant above, which is a sharper instrument anyway — it
changes one continuation rather than 442 lines. (b) **Exit 1 is
`EXIT_LEAK`**, the drill's most alarming verdict, reached here by a
script that probed nothing and spawned nothing; `EXIT_CANNOT_RUN` (3)
exists for precisely this and cannot be reached, because the failure is
before `main()`. It is a false alarm and not a false green, and the
output is an unmistakable stack trace rather than a `[orphan-drill]
LEAK:` line, which is why this is a finding and not a rejection. Worth a
top-level `try`/`catch` around a dynamic import, and a note that the
pre-fix comparison needs the mutation, not the byte copy.

**2. Two sentences claim more than the mechanism delivers**, both about
the same thing and neither affecting behaviour: the code comment at
`tauri-boot-check.mjs:212` says capturing the pgid at spawn *"rather
than reading `child.pid` at kill time is the whole point"* — measured
false, the integer is identical after reaping; and the card's own
criterion frames capture+probe as answering pid recycling, which P4
shows it does not. The honest statement is the one `groupAlive`'s
comment already makes: *signal only a group that still has members*.

**3. The liveness probe is pinned by nothing, and I demonstrated it.**
Mutant C — the `!groupAlive()` guard removed from `signalGroup` and the
early return removed from `reapOrphanedGroup`, i.e. the probe deleted —
gives **`npm test`'s boot-check-guard spec 14/14 green** and **the
orphan drill exit 0, PASS**. Nothing in this repository, automated or
hand-run, can see the difference. This is exactly `T-061-s6`, filed by
the executor before I looked; I am recording that it is confirmed by
measurement rather than by argument, which raises its priority.

**4. The notes' CONTROL figure is one commit stale, inside the section
that says otherwise.** *"Suites … at the committed ref"* reports CONTROL
**591**; at `cc14fc9` it is **597**. The delta is exactly the six
finding files the notes commit added (609 → 615 tracked files). 591 was
right at `44007bc`. Same class as `T-078-s7`.

**5. `T-061-s4` names the wrong body, and the flake is far commoner than
"observed once".** Seven `cargo test --no-fail-fast` runs at `cc14fc9`:
**four green (352/0/3, exit 0) and three red (351/1/3, exit 101)**. In
all three reds the failing body was
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
(`tests/agent_runner.rs:1091`), and
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail` — the body s4
names — **passed in all seven**. The flaky one is 5-for-5 green in
isolation, the same signature s4 records. So `agent_runner.rs` has **at
least two** load-flaky bodies and the measured rate for the one I caught
is **3 in 7 full runs**, not "once". This branch cannot be the cause:
`git diff --name-only 4d2f03c 0d4c0ec -- app/ lib/` is **0 paths**. It
is worth someone's attention beyond a re-run, because the failing
assertion is the RUST MIRROR of this card's own mechanism — a process-
group reap that polls for group-emptiness across a grace — and it failed
with `groupEmpty=true` after 28 ms of a 900 ms grace while a same-group
descendant was asserted alive. Whether that is a harness race about when
the grandchild joins the group, or the emptiness probe answering wrongly
under load, is the question; the second answer would matter to
`reapOrphanedGroup` too. A hypothesis for whoever takes it, not a
diagnosis: the two `nputer-T-060` `fake_agent` orphans are the same
binary this harness spawns, and the pid space is wrapping.

#### `T-061-s3` re-measured independently, and CONVENTIONS is wrong

The brief that dispatched me carried the **123** figure, so I measured
from scratch rather than inheriting either claim. Both of `s3`'s facts
reproduce, and one of them reproduces wider than `s3` states:

- **Empty input runs NOTHING.** `printf '' | /usr/bin/xargs ./util.sh`
  → the utility never executes (observed on stderr, not inferred),
  xargs **exit 0**.
- **Every** non-zero utility exit maps to **1** — I measured 0, 1, 2, 3,
  4, 5, 100, **123, 124, 125, 126, 127** and 255; all non-zero → **1**
  (255 additionally prints *"exited with status 255; aborting"*). The
  man page on this machine says 127 / 126 / otherwise **1**, verbatim.
  `s3`'s table lists 1, 2, 3, 4, 255; it is a subset and nothing in it
  is wrong.
- **On the real gate:** `node tools/e2e/scripts/docs-gate.mjs` with no
  arguments → **exit 2** with the loud usage block, T-084-s6's fix
  working. `printf '' | /usr/bin/xargs node tools/e2e/scripts/docs-gate.mjs`
  → **exit 0, no output at all**. And a genuine exit 2 with a non-empty
  list (`--bogus docs/STATE.md`) → **1** through the pipe. Two of the
  four codes are lost, in the directions the codes exist to prevent.

**So `docs/CONVENTIONS.md:690` carries a FALSE sentence** — *"BSD
`xargs` runs the utility once even on empty input"* — and the paragraph
it anchors mis-states why the exit-2 guard was needed. The guard is
correct; it is simply **unreachable through the invocation the same
bullet prints**. `T-084`'s card and `docs/tasks/rejected/T-084-s6-*`
repeat it. The fix is out of this lane's fence (`[tools/e2e]`) and is
owed by **`T-089`** (`status: planned`, `touches: [method/,
docs/CONVENTIONS.md]`), the card that holds the CONVENTIONS fence.
`T-061` used `$(cat <list>)` throughout and never the pipe, which is the
right call and the one I followed.

#### What reached the human's machine

`node` 82549 on `TCP [::1]:1420 (LISTEN)`, one socket, unchanged at
first read and last. Every scratch port 14671–14680 verified empty by
`lsof` after its run; `git status --porcelain` empty at every restore
and at the end, with sha256 equality re-checked on
`tauri-boot-check.mjs` (`344f55a9…`), `boot-port.mjs` (`de005bc0…`),
`tauri.conf.json` (`52eb5e69…`) and the four scanner scripts. No
`app/**` or `lib/**` path was written. The `nputer-T-060` orphans were
read with `ps` and left exactly as found — this card is about orphans,
which is the reason to be careful with somebody else's.

---

## 2026-08-23 — INTEGRATOR: merged at `ea7ea0a`, and both corrected figures went stale again (claude-opus-5 @T-061-integrate)

**History appended, never rewritten** (the T-081 ruling): the notes and
the verdict below are left exactly as their authors wrote them, and
every correction is here with the ref it was measured at.

Merged `--no-ff` as **`ea7ea0a`**, main-before **`f306ee9`**, approved
tip **`ed0c622`**. Nothing was written into the merge commit
(`T-083-s4`); every edit in this section is in the checkpoint.

### The range rule, every dot count stated, at MY refs

    git merge-tree --write-tree f306ee9 ed0c622  -> tree b118ce50…, exit 0
    git diff --name-only f306ee9 <TREE>                       -> 18   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only f306ee9...ed0c622   (THREE dots)     -> 18   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..ed0c622    (TWO, branch-only)-> 18   cmp against the forecast: exit 0
    git diff --name-only f306ee9..ed0c622    (TWO dots)       -> 130  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only f306ee9..ea7ea0a    (TWO dots)       -> 18   THE MERGE'S DIFF
    git diff --name-only f306ee9...ea7ea0a   (THREE dots)     -> 18   collapses onto the line above
    git diff --name-only 2036fb2..ea7ea0a    (TWO dots)       -> 130  the naive at-merge range

Merge-base **`2036fb2`**; main advanced **112** paths from it, the
branch **18**, `comm -12` over the sorted lists is **EMPTY**, and
112 + 18 = 130 — the forbidden count, and that arithmetic is the proof
the two sets are disjoint.

**THE VERIFIER'S FORBIDDEN COUNT MORE THAN DOUBLED IN AN AFTERNOON AND
THE TRUE COUNT NEVER MOVED — 60 at `4d2f03c`, 130 at `f306ee9`, 18 at
both.** The whole 70-path swing is main's own triage work arriving on
the LEFT-hand endpoint. That is this rule's entire thesis, and it is now
measured twice on one card.

**The forecast was exact under BOTH metrics.** `merge-tree --write-tree`
returned **`b118ce5026d7b6a909376a7240184564af9927b8`** at exit 0, and
the no-ff merge's own `HEAD^{tree}` IS that tree, with parents `f306ee9`
and `ed0c622` and nothing else; `cmp` of the whole patch against the
merge's later diff exits **0**. The staged set at `git merge --no-commit`
was the eighteen paths and nothing more, `cmp`-ed against the forecast
at exit 0.

### CORRECTION 1 — CONTROL was 591, then 597, and at the merge it is 566

The notes report CONTROL **591** "at the committed ref"; finding 4 of
the verdict corrects that to **597**. **Both are right at their own
refs, and NEITHER is right at the merge.** Derived at every ref from
`git ls-tree -r --name-only` minus the `SKIP_DIRS` and
`CONTROL_BINARY_EXTENSIONS` sets read out of `token-scan.mjs` (the skip
set matches nothing tracked; the binary set matches 18 everywhere):

| ref | what it is | tracked | CONTROL |
|---|---|---|---|
| `2036fb2` | merge-base | 608 | **590** |
| `44007bc` | the CODE commit | 609 | **591** ← the notes' figure, right here |
| `4d2f03c` | main's fourth position | 609 | 591 |
| `cc14fc9` / `ed0c622` | branch tip | 615 | **597** ← the verdict's figure, right here |
| `f306ee9` | main-before-the-merge | 577 | **559** |
| `ea7ea0a` | **the merge** | 584 | **566** |

The lint printed `CONTROL 566` at the merge and it closes three ways:
main NET-REMOVED 31 tracked files (29 A + 12 R099 − 60 D — the sixth
triage taking the suggestion backlog to zero), the branch adds 7 (six
findings plus `orphan-drill.mjs`), and 590 − 31 + 7 = 590 + 7 − 31 =
**566**. TOKEN is **124** at the merge and at the branch tip both, because
main's 112-path advance is entirely `docs/` and TOKEN counts only
`app/src`, `app/test`, `tools/e2e`.

**The lesson is not that a figure was wrong.** The verifier corrected
591 → 597 and was right to; the correction then went stale from the
LEFT-hand endpoint before it could be merged, because main deleted
thirty-one files underneath it. A count is a function of a ref on BOTH
sides. This is the third consecutive card to record that sentence.

### CORRECTION 2 — `T-061-s4` names the wrong body, and at my ref the flake did not appear at all

The verdict's finding 5 is confirmed as to the NAME and **contradicted
as to the RATE, in the reassuring direction**. `T-061-s4` is titled for
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`; the body the
verifier caught red three times in seven runs is
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
(`app/src-tauri/tests/agent_runner.rs:1066`, the panic at :1091). `s4`
gains a dated integrator section carrying the right name.

**MY OWN TALLY, same sample size, at the merge: SEVEN GREEN OF SEVEN.**
Bare `cargo test --no-fail-fast`, seven consecutive runs, every one
**352 passed / 0 failed / 3 ignored, exit 0**, summed programmatically
over **fifteen** `test result:` lines each. Zero reds, zero failing
bodies. So the measured rate is **3 of 7 at `cc14fc9` under the
verifier's load and 0 of 7 at `ea7ea0a` under mine** — which is the
signature of a load-dependent race, not of a fix: `git diff --name-only
f306ee9..ea7ea0a -- app/ lib/ crates/` is **0 paths**, and
`agent_runner.rs` was last touched by T-081 at `6251d37`, long before
this branch. **Nothing here fixed it and nothing here can have; a
future integrator who sees it red should not read my seven greens as a
baseline.** The honest statement is that the flake is real, is
pre-existing, and did not fire on this machine at this hour.

### The three gates, derived over the prescribed 18

| gate | prescribed `f306ee9..ea7ea0a` | naive `2036fb2..ea7ea0a` |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — NOT OWED** | **0** |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **2 — FIRES** | 2 |
| DOCS GATE (a `docs/` path a code suite reads) | **7 — FIRES**, three suites | 119 — fires |

**THIS IS THE COMPLEMENT OF T-084's FLIP AND THE REPEAT OF T-081's
AGREEMENT, and the reason is derivable rather than lucky**: main's
112-path advance is **entirely under `docs/`** (0 non-docs paths), so
neither suffix-triggered gate can see it and the naive range cannot
manufacture a BOOT CHECK this time. The DOCS GATE still differs, 7
against 119, because that gate's trigger is exactly what main moved —
the naive range would have owed the same three suites for the wrong
reason, which is how a right answer by a wrong route looks.

- **BOOT GATE — NOT OWED at 0 of 18, AND RUN ANYWAY, because this merge
  is what CHANGES the boot check.** A gate whose own implementation
  moved cannot be cleared by its trigger arithmetic; the trigger asks
  "did the app's shell move", and here the answer is no while the
  question-asker itself moved. `NPUTER_BOOT_PORT=14721 npm run
  boot:check` from tools/e2e: **exit 0**, both `[nputer]` lines
  (*project folder:* and *window "main" created*), child pid 45360,
  captured group 45360, tree stopped on SIGTERM, no survivor on the
  port afterwards on any of the four stacks.
- **THE OVERLAY, READ OFF THE WIRE AT MY REF.** Committed
  `tauri.conf.json` (sha256 `52eb5e69…`, unmoved) holds
  `beforeDevCommand: "npm run dev"` and `devUrl:
  "http://localhost:1420"`; the overlay the check threaded was
  `{"build":{"devUrl":"http://localhost:14721","beforeDevCommand":"npm run dev -- --port 14721 --strictPort"}}`
  — only the PORT of the committed devUrl rewritten (scheme and host
  preserved), and the committed beforeDevCommand APPENDED to rather
  than replaced. The criterion holds on the observed bytes.
- **GRAPH REGEN — OWED on the two `.spec.ts` paths, RUN, and a PROVEN
  NO-OP.** `index --check --root ../..` from app/src-tauri exits **0**
  before (*CURRENT … 585305 bytes, 119 files, 1018 symbols, 1539
  edges*), `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` exits **0** moving **zero** paths (`git
  status --porcelain` empty), and `index --check` exits **0** after.
  Derivable rather than lucky, the fourth worked example: `.nputerignore`
  excludes `docs/` and `tools/`, and **all eighteen paths are under one
  or the other**, so the indexable-path count of this merge is **0**.
  The exit code was read from `$?` UNPIPED — the first attempt read
  `${PIPESTATUS[0]}`, which is empty in zsh, and printed nothing.
- **DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with
  `$(cat <the 18>)` and never through `xargs`. Seven `docs/` paths (this
  card and its six findings), owing **three** suites — `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  `cargo test from app/src-tauri/` is correctly NOT owed: its two
  readers resolve `docs/architecture/components` and
  `docs/CONVENTIONS.md`, neither of which this merge touches. The gate
  reports **11 derived readers across 4 suites**, **0 frontmatter
  issues**, and *every live task card's frontmatter parses, with a legal
  status* — which is the check that the six new findings are legal, run
  by the gate rather than by eye.

### Suites at the merge, every exit code from `$?` unpiped

- **parser 263/263 over 12 files, `PARSER_EXIT=0`**; `npm run build`
  and `npx tsc --noEmit` both **0**, build FIRST per the fresh-clone
  order.
- **app 840/840 over 43 files, `APP_TEST_EXIT=0`**; `npm run build`
  **0**, **265 modules transformed**, `index-kNOKiTKD.js` **502.75 kB**
  and `index-CwYF5FQb.css` **43.95 kB** — byte-for-byte the hashes at
  `e8c4ab7` and at the branch tip, as they must be: this merge moves no
  `app/**` path, so the bundle is a function of `f306ee9` alone.
- **E2E 129/129, `E2E_EXIT=0`**, one worker, zero retries, zero skips,
  scratch port **14723**; `npm run typecheck` **0** with `checkJs` on.
- **Rust, bare `cargo test --no-fail-fast`, SEVEN runs: 352/0/3 at exit
  0 every time**, fifteen `test result:` lines each. See CORRECTION 2.
- **token lint 0, `--selftest` 0** — *clean (TOKEN 124 … CONTROL 566)*,
  49 TOKEN + 4 CONTROL samples, 71 walk-policy checks, 8 evidence-floor
  checks. This is also the repo's only NUL gate; independently, all 18
  paths were read as bytes and **0 carry a NUL** (the first probe,
  `grep -qU $'\x00'`, matched all 18 — the shell truncates the pattern
  at the NUL and greps for the empty string, so it is a FALSE POSITIVE
  generator and not a gate; the byte-level re-read is the real answer).
- **`cargo audit -n` exit 0**: 472 crate dependencies, **0
  vulnerabilities / 17 allowed warnings**, unmoved — which a 0-file
  `Cargo.lock` diff requires.

### The poison drill — the verifier's headline mutant, at the MERGED commit

Detached scratch worktree at `ea7ea0a` under the scratchpad, with
`CARGO_TARGET_DIR` set INSIDE the drill directory (T-013-s7: a shared
target bakes the drill path into cached binaries and reds 33 bodies
after cleanup). **Correspondence established by hash before anything was
mutated** — `orphan-drill.mjs` `a026f5cb…`, `tauri-boot-check.mjs`
`344f55a9…`, `boot-port.mjs` `de005bc0…`, each identical to `git show
ea7ea0a:<path>`, so the drilled artifact IS the merged artifact by
construction (the latter two also reproduce the verifier's own hashes).

- **CONTROL, shipped code, port 14724: exit 0, PASS** — *the child-exit
  path signalled its group before exiting*. Run in the same scratch
  worktree as the mutant, so the environment is not the variable.
- **MUTANT — the child-exit continuation replaced by a bare
  `process.exit(1)`**, i.e. the pre-T-061 behaviour of that one path,
  substitution count **1**, mutated text read back with `git diff`
  before anything ran. Port 14725: **exit 1, `EXIT_LEAK`** —
  *the boot check exited 1 and left **4** process(es) in group 59945,
  with port 14725 STILL HELD*: the `npm run dev` shell, an `npm list`
  of the tauri plugins, the vite listener and the esbuild helper. The
  drill then reaped its own mess and the group went empty.

Red, then green, on the same shipped procedure, against the merged
bytes. Restored by byte copy from `git show ea7ea0a:<path>` and proved
twice — empty per-path `git diff`, and sha256 back to `344f55a9…`.

**AND THE T-013-s7 PRECAUTION COST NOTHING AND PROVED UNNECESSARY FOR
THIS PARTICULAR DRILL, which is worth writing down rather than
re-deriving.** The scratch `CARGO_TARGET_DIR` finished the drill at
**0 bytes**: the drill SIGKILLs the tauri CLI as soon as vite is
listening, which is during `beforeDevCommand` and BEFORE cargo is ever
invoked, so no Rust build starts and the shared target was never at
risk by any route. Take the precaution anyway — it is free here and the
failure it prevents is not.

### The findings, and what this role did with each

The verdict's five findings were written into the card and **filed as
no files at all**, so triage — which reads `docs/tasks/*.md` — could not
have seen them. Two are genuinely new defects and are filed here; three
are corrections that belong on the cards they correct, and are appended
there rather than duplicated:

- **verdict 1 → `T-061-s7`**, new. The shipped drill imports
  `isSignalableGroup`, absent at `2036fb2`, so it cannot run against
  pre-fix byte copies and dies at ESM link time — and exit 1 is
  `EXIT_LEAK`, the drill's loudest verdict, reached having spawned
  nothing. A false ALARM, never a false green. **Filed and left**, per
  this merge's brief; disposition is triage's.
- **verdict 2 → `T-061-s8`**, new. Two sentences claim more than the
  mechanism delivers — the `tauri-boot-check.mjs:212` comment ("capturing
  at spawn rather than at kill time is the whole point", measured false:
  `child.pid` is the same integer after the exit event) and the card's
  own criterion framing capture+probe as answering pid RECYCLING, which
  the verifier's P4 row shows it does not.
- **verdict 3 → appended to `T-061-s6`**, which the executor had already
  filed. The probe is pinned by nothing: with it deleted, the guard spec
  is 14/14 green and the drill exits 0. Confirmed by measurement rather
  than argument, which raises its priority; no second card for one
  defect.
- **verdict 4 → CORRECTION 1 above.**
- **verdict 5 → CORRECTION 2 above and a dated section on `T-061-s4`.**

`T-061-s3`'s CONVENTIONS:690 arm is **NOT this merge's to fix** and was
confirmed untouched: `git diff f306ee9..ea7ea0a -- docs/CONVENTIONS.md`
is a **0-file diff**. `T-089` holds that fence, is live, and has been
told.

### Security sweep, re-derived at the merge

`acl_pin.rs` **0-file diff**, sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`;
`EXPECTED_GRANTS` declaration line **54**, closing `];` line **147**,
entries 55–146 = **92**, counted four independent ways over the
symbol-anchored body (92 quote-bearing lines, 92 quoted strings, 92
UNIQUE quoted strings, **0** comment or blank). **IPC 13/13** — 13
anchored `#[tauri::command]` and 13 `generate_handler!` entries with
comments stripped; both census traps reproduce, the unanchored literal
reading **14** and a naive comma-split of the raw block reading more
because two comments inside the macro carry commas. **Exactly THREE
`#[ignore]`**, anchored `^[[:space:]]*#\[ignore` with pathspec `'*.rs'`
from the repo root, all three carrying `= "reason"`; the closed literal
`#[ignore]` matches **8 lines in 5 files and every one is prose**, a set
DISJOINT from the truth.

**No dependency added**: the only manifest in the range is
`tools/e2e/package.json` and its entire diff is the one
`boot:orphan-drill` script line. All **2796** added lines scanned for
`sk-`/`AKIA`/PEM/bearer/assignment shapes — **0 hits**.

**THE SWEEP THIS CARD ACTUALLY NEEDS — every signal, and what it is
addressed to.** No `shell: true` anywhere in `tools/e2e/scripts`; no
`pkill`, no `killall`, no hardcoded pid. Every group signal in both new
scripts is `process.kill(-pgid, …)` where `pgid` was captured at spawn
and passed `isSignalableGroup` (integer `> 1`, so `-0`/`0`/`1`/`-1` —
the caller's own group and the POSIX broadcast — are refused). **There
is exactly ONE signal to a bare pid**, `orphan-drill.mjs:308`
`process.kill(cli.pid, "SIGKILL")`, and it is guarded in the right
direction: the line above re-reads that pid's membership out of `ps` and
requires `cliMembership.pgid === pgid`, exiting `EXIT_CANNOT_RUN` with
*"Nothing was signalled"* if the CLI left the group between the census
and the signal. `execFileSync("/bin/ps", ["-Ao", …])` is read-only with
no interpolation; `spawn(process.execPath, [bootCheck])` and
`spawn("npm", args)` are argv arrays.

### What reached the human's machine

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** Holder `node` pid **82549**, one
socket, `TCP [::1]:1420 (LISTEN)`, identical at the first read and the
last. No bind, no connect, no signal, on any interface. The app process
**85379** and the whole supervisor chain are unchanged. **No `pkill` at
any point.**

`app/src-tauri/target/debug/nputer` **WAS relinked** by my seven cargo
runs and the regen — sha256 `25cedbed…` → `8ef00495…`, mtime Aug 20
15:46 → Aug 23 20:04. That is a shared target directory being written by
any cargo invocation (T-083's correction to `cb3aa31`, holding a fifth
time) and NOT this merge's content: the merge has a 0-path diff under
`app/`, `lib/` and `crates/`. A file on disk cannot reach a loaded
process, so pid 85379 is unaffected and the next `tauri dev` rebuild
overwrites it. The **poison drill did not touch it at all** — its
scratch target stayed at 0 bytes.

Scratch ports **14721, 14722, 14723, 14724, 14725** were each
bind-probed free on all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`,
`::`) before use and verified empty after — an IPv4-only probe of a v6
listener reports free, which is why all four. The two `nputer-T-060`
`fake_agent` orphans (**52504** / **52505**, ppid 1, started Tue Aug 18
16:21:18) were read with `ps` and left exactly as found. **This card is
about reaping orphans, which is precisely the reason to leave somebody
else's alone** (`T-043-s1`, a parked human decision).
