---
id: T-161
title: The typed-failure stderr tail races the child's exit on Linux — it arrived EMPTY at the first green-run attempt, on code five prior ubuntu runs passed
feature: F-03
milestone: 4
priority: 21
size: S
status: verifying
blocked_by: []
touches: [app-agent]
suggested_by: integrator nputer-4e @the first green-run attempt, run 33274798983
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-30, integrator)** on the CI-green
standing authorization: it redded the first green-run attempt.

## The evidence

Run 33274798983 (main @ f63f8a0, the first push after every carded
Linux red was fixed):
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail` panicked at
tests/agent_runner.rs:1393 — `stderr_tail.contains("credentials
expired")` over a tail the panic message printed as **EMPTY** — with
81/1/1 in the file and every later step skipped. The same body, on
byte-identical runner code, passed the ubuntu cargo step at least
FIVE times before (runs 33255912812, 33256467475, 33257012982,
33259394002, 33260414204): nothing in the merges between touched
`app/src-tauri/src/**` — the diff since the last green cargo step is
registry/fixtures/tools-e2e/docs only. This is an INTERMITTENT, not
drift.

A rerun of the failed job was fired immediately as the second
measurement (2026-08-30, same run id, attempt 2) — its result stands
in the checkpoint record that cites this card, green or red.

## The mechanism to confirm (hypothesis, stated as one)

The fake's `nonzero` scenario writes `credentials expired` to stderr
and exits 3. The runner types the failure with a stderr TAIL captured
from the pipe. On Linux, a child's exit can be observed before the
last pipe write is drained — whether the tail is read to EOF or
snapshotted at exit-observation decides whether this is a real race
in `runner.rs`'s capture or a fixture race in the harness. THE LANE
MEASURES FIRST: read the capture path, say which side owns the race,
and prove it with a reproduction (a deliberately slow-flushing child)
rather than a timing guess.

## Acceptance criteria

- THE lane SHALL name the owner of the race (product capture vs test
  harness) from the code, with the reproduction that proves it.
- THE capture SHALL be made exit-order-independent (read stderr to
  EOF before typing the failure, or the equivalent the code's own
  shape supports) — never a sleep, never a retry loop in the test.
- THE fix SHALL keep the tail BOUNDED (the existing cap survives) and
  the turn semantics unchanged (typed failure, session resumable).
- A regression body SHALL pin the race's shape (slow-flushing child
  still yields the full tail) and be mutation-proven (capture
  reverted to the racy form -> the body reds).
- THE fix SHALL be proven where it fired: cap 2 CI cycles on the
  lane's branch, per-body reads, run ids on the card.

## Implementation notes

**Executor, 2026-08-31.** Lane `/Users/ujju/Projects/nputer-T-161`,
branch `task/T-161-t161-stderr-drain`, base `155993f`, work at
`b6bcca0` — 3 files, +228/-0 (`git show --stat b6bcca0`).

### THE OWNER IS THE PRODUCT'S CAPTURE, AND THE EXPERIMENT SAYS SO

`agent::runner::run_turn` spawned the stderr drain as a DETACHED thread
and then read the ring at the instant `child.wait()` returned. Two facts,
no ordering between them: *"the process has exited"* is observed by
`waitpid` on the turn thread, *"the pipe has been read to EOF"* is
observed by the drain thread, and nothing made the second happen first.
The relay loop's own exit does not supply it either — it breaks on
`Disconnected`, which is STDOUT's EOF and says nothing about stderr. So a
diagnostic the CLI had fully written could still be sitting in the kernel
pipe buffer, unread, and get reported as `stderr_tail: ""`.

**The harness is not the owner.** The `nonzero` fixture writes its line
to unbuffered stderr and exits 3; by the time the parent reaps it, the
bytes are already in the pipe. Nothing it could do differently would
help, and the experiment below changes only the parent.

**THE SWEEP** (`git grep -n 'Stdio::piped'` + `'wait_with_output|\.output\(\)'`
over `app/src-tauri/src` and `app/src-tauri/crates`): five capture sites,
**one member of the class, and it is the one fixed**.
- `churn.rs:356`, `churn.rs:389` — `Command::output()`, which reads both
  pipes to EOF before yielding the status. Safe by construction.
- `runner.rs:935/996` → `run_with_timeout` — **already had the right
  shape, one function away in the same file**: its reader thread sends on
  a channel and the parent does `rx.recv_timeout(2s)` after `try_wait`
  returns `Some`. Bounded wait, fallback to what is there. The fix below
  is that shape, brought to the turn path.
- `runner.rs:1904` (stdout) — its EOF **is** awaited, via the relay
  loop's `Disconnected`.
- `runner.rs:1863` (stderr, `run_turn`) — the defect.
- `crates/nputer-index/tests/watch.rs:52` — a live watcher polled by
  `wait_until`; it waits on the FACT and never snapshots at a reap. Not
  the class.

### THE REPRODUCTION — AND IT IS A REAL ONE, ON THIS HOST

Both CI sightings are Linux and this host is macOS, so the honest plan
was to name the mechanism and disclose the gap. **The gap did not
survive contact: the race reproduces here.** A standalone `rustc`
program outside the repository replicates the capture shape exactly
(piped stdout+stderr, stdout drained on a thread whose `Sender` drop ends
the loop, stderr drained on a second thread into a 64 KiB ring, reap,
snapshot) and drives a child with the `nonzero` fixture's exact shape
(init line on stdout, one stderr diagnostic, `exit(3)`).

**The child is byte-identical across every row. Only the parent changes.**

| # | child | capture | load | runs | EMPTY tails |
|---|-------|---------|------|------|-------------|
| M1 | `nonzero` shape | racy | idle | 200 | **1** |
| M2 | `nonzero` shape | racy | 32 busy threads | 200 | **4** |
| M2b | `nonzero` shape | racy | 32 busy threads | 500 | **2** |
| M3 | `nonzero` shape | fixed | idle | 200 | 0 |
| M4 | `nonzero` shape | fixed | 32 busy threads | 200 | 0 |

**7 empty tails in 900 runs of the old capture, 0 in 400 of the new.**
That is the ownership proof the criterion asked for: the only variable
between the two halves is the parent's capture.

**The window is ~100 microseconds wide**, measured as the delay from
`wait()` returning to the drain thread actually finishing: max 88 µs over
the idle runs, max 34–35 µs under load. That is why five ubuntu runs
passed and the sixth did not, and why load flips it — the whole race is
decided inside a tenth of a millisecond.

**The deterministic half.** A race decided by scheduling cannot be pinned
by a fixture whose only writer is the child, because by the time that
child is reaped its bytes are already in the pipe. A writer that OUTLIVES
the reaped process turns the same property into a fact — which is not a
contrivance around the defect but the defect at its limit:

| # | child | capture | runs | late line MISSING |
|---|-------|---------|------|-------------------|
| M5 | late writer | racy | 30 | **30** |
| M6 | late writer | fixed | 30 | 0 |

The program is ~200 lines of `std`, built with a bare `rustc -O` and no
cargo, so it indexes nothing and builds nowhere near this tree. It is
**not committed** — it is outside every fence and is not product code —
and it is parked at `/private/tmp/t161-repro/race.rs`
(sha256 `09c5456be880eb47688f270354f4f5019cc940cf9b5b96a2dc3efc4b31bfb221`).
`/private/tmp` is volatile, so treat the path as a convenience and the
description above as the specification: a verifier who wants these
numbers should rebuild it rather than trust a file it did not compile.
Usage: `race run <child-nonzero|child-late> <racy|fixed> <iters> [load]`.

### THE FIX

The drain thread now owns a `Sender<()>` that nothing ever sends on; it
is dropped when the closure ends — at EOF, at a read error, or on an
unwind — so `Disconnected` **is** the EOF. `run_turn` waits for that
disconnect (`await_stderr_eof`) before it types the failure.

- **Bounded by the existing `cfg.kill_grace`, reused rather than
  invented.** The only way EOF does not arrive is a descendant that
  inherited the pipe and outlived the reaped process, which is the same
  question that dial already answers. **The correctness does not rest on
  the number** — in the race being closed, EOF is already in the pipe and
  the wait returns in microseconds. On expiry the tail is taken exactly
  as the old code took it, so the bound is a hang guard and is **never
  worse than the behaviour it replaces**; it prints a `[nputer]` line
  rather than shortening the tail in silence.
- **Never a sleep and never a retry loop.** The wait is on an event.
- **The cap survives**: `MAX_STDERR_RING` (64 KiB) and `Ring` are
  untouched; `agent::runner::tests::the_stderr_ring_keeps_the_tail_not_the_head`
  green alone (1 passed).
- **Turn semantics unchanged**: still a typed `ExitNonZero`, still
  `Phase::Failed`, still `sessions[0].status == "idle"`. The cancel path
  returns *above* the wait and does not pay it, so the four timing bodies
  (`latch_released`, `cancel_returned`, two `reap_for_exit` bounds) are
  untouched — all measure cancel/app-exit paths.

### THE REGRESSION BODY

`a_stderr_line_written_after_the_exit_is_observed_still_reaches_the_tail`,
on the new `nonzero-late-stderr` fixture: the fake writes `nonzero`'s own
line, forks a leaf that inherits **only** stderr (stdout deliberately
`null`, or the relay loop would run to `stall_timeout` and type `Stall`),
and exits 3. The leaf writes 150 ms later. The body asserts the EARLY
line too — that is the control: without it, a capture that waited and
dropped everything else would pass, and an empty tail is equally
consistent with "the runner did not wait" and "the fixture wrote
nothing".

### DRILL LEDGER — committed first (`b6bcca0`), drilled in a DETACHED scratch worktree

`/private/tmp/nd-T-161` (detached at `b6bcca0`, short root, stem from the
card id) with `CARGO_TARGET_DIR=/private/tmp/nd-T-161/target`. Drill
baseline there, unmutated: both bodies **ok**, exit 0.

| drill | side mutated | read back | result |
|-------|--------------|-----------|--------|
| 1 | CODE — `await_stderr_eof` call deleted, i.e. the capture reverted to its racy form | yes, `git diff`, one file only | new body **RED 10 of 10** (exit 101); panic shows the tail holding ONLY the early line |
| 1′ | same mutation, old body | — | `a_nonzero_exit_is_typed_…` **GREEN 10 of 10** — the mutation is invisible to the body CI reds on, which is exactly why the new one was needed |
| 2a | ASSERTION — `Some(3)` → `Some(4)` | yes | **RED**, exit 101 |
| 2b | ASSERTION — `contains("credentials expired")` → `"credentials unexpired"` | yes | **RED**, exit 101 |
| 2c | ASSERTION — `contains("after the exit was observed")` → `"…never observed"` | yes | **RED**, exit 101 |

One side per drill, never a literal the two share (2c changed the test's
copy, never the fake's). The three assertion mutations were run **one at
a time** because asserts short-circuit — three at once would prove only
the first live. Control before and after each: exit 0.

**A FALSE START, RECORDED BECAUSE AN UNRECORDED ONE IS A LIE ABOUT THE
LEDGER.** The first assertion-drill script `cd`'d to the worktree ROOT and
ran `cargo` from there, so its four "101"s were cargo failing to find a
manifest and not a single verdict. It was caught by its own control —
the UNMUTATED body also read 101, which cannot be right — and the drill
was re-run with every cargo call made from `app/src-tauri`. **The control
is what saved it; a drill whose control is not required to pass first
cannot tell a red from a broken runner.**

**RESTORATION, PROVED BY HASH** (`git diff` kept only as the companion):

    runner.rs      9cbb5ae77e7738fd1bf0af02fa4a27b4d2acd814f55982d905a86ac9200c98a1
    agent_runner.rs cf0d5091c14dd5c86b352bd0b98990a0528d11afd6482308c08fe314a18297db
    fake_agent.rs  e96f7cab9c5e19720fc535fbb01a5bbca23f7003c66e34255ab6c545105a6d84

`git show HEAD:<path>` and the working file agree on all three **in the
lane**, and on the two mutated ones in the drill tree; the drill tree's
`git status` is clean and its restored body runs exit 0. The lane was
never mutated — every drill happened in the detached worktree.

### GATES

| gate | command | exit |
|------|---------|------|
| cargo (baseline, `155993f`) | `cargo test` from app/src-tauri/ | **0** — `agent_runner` 87 passed / 0 failed / 1 ignored; lib 256 passed in 4.23s |
| cargo (at `b6bcca0`) | `cargo test` from app/src-tauri/ | **0** — `agent_runner` **88 passed / 0 failed / 1 ignored**; lib 256 passed in 4.17s |
| BOOT GATE (fires: `app/src-tauri/**`) | `NPUTER_BOOT_PORT=14161 npm run boot:check` from tools/e2e/ | **0** — `[nputer] project folder: /Users/ujju/Projects/nputer-T-161` and `[nputer] window "main" created`, both detected |
| GRAPH REGEN (fires: `.rs` outside docs/) | `cargo run -p nputer-index -- index --check --root ../..` | **1 — STALE, ASKED AND REPORTED, NOT REGENERATED** (`graph.json` is outside this fence) |
| DOCS GATE (fires: this card's own `docs/tasks/*.md` edit, which `app/src/lib/board-model.ts` and friends read) | `npm run lint:docs` from tools/e2e/ | **0** |
| DOCS GATE | `npm run capabilities:check` from tools/e2e/ | **0** |
| DOCS GATE | `npm test` from app/ | **0** — 49 files, **1077 passed** |

The DOCS GATE was DERIVED, not assigned: the dispatch named three gates
and this is a fourth. `git grep -ln 'docs/tasks'` over the suites returns
the app's board readers (`board-truth.test.tsx`, `crescendo-dom.test.tsx`,
the architecture bodies…), and this card's frontmatter moved — which is
the exact shape that redded a suite twice (`9c64cd8`, `fede266`).
METHOD EVAL GATE does not fire: nothing under `method/`.

`index --check` names exactly this diff and nothing else: `~3` files,
`+0 -0`, symbols 2432 → 2436 (runner +1 `await_stderr_eof`, fake_agent +2
`LATE_STDERR_DELAY_MS`/`spawn_late_stderr_writer`, agent_runner +1 body),
edges unchanged at 2351, 1141994 → 1143151 bytes, budget 53.3%.

Ports: 1420 read with `lsof` only and holding nothing; 14161 derived from
the card id and lsof'd to zero rows immediately before binding.

Known intermittents, checked rather than assumed: `a_hostile_session_id…`
(both bodies) green alone, exit 0; the cargo cache cliff did not fire —
the lib suite's own time is **4.17 s**, far under the 9.5 s green band,
and `startup_arm_watches_the_initial_root` passed in the full run. The
one warning in the build (`unused import: Path`, `src/arch_cmd.rs:2`) is
**pre-existing at the base** and outside this fence.

### WHAT IS OWED, AND IT IS THE CRITERION THIS LANE CANNOT CLOSE

**Criterion 5 (CI cycles on the lane's branch, run ids on the card) is
NOT met and cannot be met from here — this seat cannot push and has no
CI.** The local half is complete; the CI half is the integrator's to
decide. What would make it conclusive is the ubuntu cargo step on this
branch: the new body is deterministic on any platform, and the old body's
intermittency is what the fix removes, so a green ubuntu run tells you
the fix compiles and holds there — it cannot, by itself, prove the
intermittent is gone, because the intermittent was already rare. **The
evidence that it is gone is the 900-run experiment above, not a CI
tally.**

### WHERE THE BRIEF WAS WRONG

1. **ROW 4's worktree path** printed
   `/Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-161` — inside
   the repository, which lane-protocol rule three forbids. The real lane
   is the sibling `/Users/ujju/Projects/nputer-T-161` (`git worktree
   list`). Already carded as `T-179`; reported, not moved.
2. **ROW 4's base commit** says `6e128c8c5068`. The lane was actually cut
   from `155993f` — `git merge-base HEAD main` = `155993f` = the
   integration tip the brief's own next row prints. The row is stale
   against the tree it describes.
3. **The dispatch summary of the fence** named only
   `app/src-tauri/src/agent/**` and `agent-store.ts`. The written
   manifest (`.nputer/lane-fence.json`) is wider and also grants
   `app/src-tauri/src/bin/fake_agent.rs`,
   `app/src-tauri/tests/agent_runner.rs` and
   `app/test/agent-store.test.ts`. The manifest is the authority and this
   card's fixture work needed exactly those two extra paths.

## Verdicts

## CORROBORATION (2026-08-30, standing triage sitting #4) — the SECOND CI sighting

CI run **33328885168**, main at `27f609d` (the T-163-s4 close tip),
cargo step: `a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`
**FAILED**, `85 passed; 1 failed; 1 ignored` in
`tests/agent_runner.rs`, panicking at `tests/agent_runner.rs:1485` with
`ExitNonZero { code: Some(3), stderr_tail: "" }` — **the tail EMPTY
again**, the same shape as the first sighting at run 33274798983.

Two facts that sharpen the card and are recorded rather than inferred:

- **It is still INTERMITTENT, confirmed on the successor run.** The same
  body is green at `b60b06d` (run 33329824890, full battery, the session
  close tip) with nothing in the diff touching the capture path. Read
  with `gh run view <id> --log-failed`; the attribution was made at this
  seat and the successor run was reported independently by the outgoing
  integrator session.
- **The line number moved and the mechanism did not** — 1393 at the
  first sighting, 1485 here. The card's own citation rule applies to its
  own evidence: cite
  `a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`, never the
  line.

**The cost is now measured rather than predicted**: this red skipped
every step behind cargo, including the e2e lane and the boot gate, so
one intermittent hides a whole battery's worth of signal from the push
it lands on.
