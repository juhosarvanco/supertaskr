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
verified_by: claude-opus-5@subagent
review: same-model
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

### 2026-08-31 — `claude-opus-5@subagent` (verifier) — **APPROVED WITH ASSIGNED CORRECTIONS**

Both corrections are **notes-only**. No code change is assigned: the fix
is correct, and the strongest evidence in this verdict is a measurement I
took myself.

**THE BLINDNESS HELD, AND THE BRIEF LET IT.** Phase 1 read only the card
at its base ref `155993f`, `docs/CONVENTIONS.md`, `method/roles/verifier.md`,
`docs/STATE.md` (intermittents), and `src/agent/runner.rs` **as it stands
on main** — then wrote a **36-attack** set to scratch BEFORE the diff, the
commits or the notes were opened, with `tests/agent_runner.rs` closed so
the mutants came from the CRITERIA (shape SEVEN's procedure). The
dispatching brief named no executor-derived specifics — no mutant counts,
no suite figures, no file counts, and it deliberately withheld the port
the lane used — so nothing had to be un-read.

**TWO of the 36 produced findings, and only one of them is about the
code.** Attack D4 — *"does the happy path now pay the wait?"* — survived
contact and is CORRECTION 2. Attack A2 — *"if the product is named, the
harness must be shown incapable, and the reproduction must prove it"* —
did **not** survive as an attack on the fix (the deterministic
reproduction holds, and I reproduced it myself), but running it falsified
a figure in the notes, which is CORRECTION 1. The other 34 are answered
below.

**THE OWNER: the claim is PRODUCT, and it holds.** I reached the same
answer blind, from the base file alone: the drain thread's `JoinHandle`
was dropped at `runner.rs:1911` and the ring was snapshotted at `:2427`
the instant `child.wait()` returned, with nothing ordering the two. The
asymmetry is what settles it — **stdout's EOF *is* awaited**, because the
relay loop ends on `Disconnected` (`:2362`), which requires the stdout
thread to have dropped its `tx`; stderr had no such signal. The notes
reach the same asymmetry in their own words. The harness is exonerated
correctly: `nonzero` writes unbuffered and exits, so its bytes are in the
pipe before the reap and no fixture change could help.

**And I proved ownership myself rather than accepting the proof offered.**
With the CHILD and the TEST byte-identical and **only the parent's capture
reverted** (mutant M1), the tail loses the late line **10 of 10**. That
isolates the parent as the owner in-tree, independently of the external
experiment.

**THE SYNCHRONISATION IS REAL.** It is a `recv_timeout` on a channel whose
`Sender` is owned by the drain thread and dropped when that closure ends —
so `Disconnected` **is** the EOF, and it is a genuine event, not a clock.
Checked for the three things the card forbids and found none: no
`thread::sleep` on the capture path, no poll or spin loop, no retry in the
test. **Measured, because a bound that usually elapses is the forbidden
thing wearing product clothes:** the new body finishes in **0.48 s against
a 5 s bound** — the wait returns on the signal, never on the timeout. The
`drop(stderr_eof_tx)` also correctly covers the `child.stderr == None`
arm, and a panicking drain drops its sender on unwind, so it cannot wedge
the reader.

**THE EXPIRY BRANCH — DRIVEN, NOT REASONED ABOUT.** I wrote a probe on the
bench's test side (code side pristine) giving the fixture's 150 ms holder
a 40 ms grace, so the bound must fire. Result: **no hang**; the
`[nputer] agent: turn 1 stopped waiting for the child's stderr to close
after 40 ms - the tail may be short` line printed, so a short tail is
never silent; the tail fell back to **exactly the pre-fix snapshot**
(the early line, not empty); and the turn's semantics survived —
`code=Some(3)`, `phase=Failed`, `session="idle"`. This is the answer the
card needed: the bound is a hang guard and is never worse than what it
replaces.

**THE BOUND (criterion 3) SURVIVES BY CONSTRUCTION.** `MAX_STDERR_RING`
(64 KiB), `Ring`, `Ring::push`'s byte eviction, the non-destructive
`to_string()` and both `sanitize_for_log` call sites appear in the diff
**as context only** — untouched. The fix does not read to EOF into an
unbounded buffer, so no truncation bug was traded for a memory one. The
trap I most expected was also avoided: `stderr_ring.lock` occurs **3 times
at base and 3 at the tip**, so the tail still comes from the SHARED ring
and the three main-thread writers (the `result` error text, the
`Diagnostic` note, the `NotJson` line) are all preserved — a fix that had
taken the tail from the drain thread's own buffer would have silently
deleted the explanation that `:2154` says may be the only one there is.

**THE CANCEL PATH IS UNTOUCHED**: the wait sits *below*
`if out.cancelled { return out; }`, so cancel does not pay it, and
`mark_reaped()` and the child-slot clear did not move.

**COMPLETENESS.** I re-ran the capture-site sweep myself
(`Stdio::piped` + `output()`/`wait_with_output` over `src` and `crates`)
and confirm the class has exactly one member and it is the one fixed:
`churn.rs:356/389` use `Command::output()` (reads both pipes to EOF by
construction), `runner.rs:935/996` set `stderr(Stdio::null())`,
`runner.rs:1904` is stdout whose EOF *is* awaited, and
`nputer-index/tests/watch.rs:52` waits on a fact. The fix is not partial.

#### GATES — run at this seat, exits observed unpiped

| gate | command | exit |
|------|---------|------|
| cargo | `cargo test` from `app/src-tauri/` (lane, `d536e57`) | **0** — lib **256 passed** in **4.23 s**; `agent_runner` **88 passed / 0 failed / 1 ignored**; `nputer-index` 197 passed |
| BOOT GATE | `NPUTER_BOOT_PORT=16161 npm run boot:check` from `tools/e2e/` | **0** — both lines: `[nputer] project folder: /Users/ujju/Projects/nputer-T-161` and `[nputer] window "main" created` |
| GRAPH | `cargo run -p nputer-index -- index --check --root ../..` | **1 — STALE, ASKED AND REPORTED, NOT REGENERATED** |

**Port discipline**: 16161 is derived from this card's id and is
deliberately **not** the 14161 the lane used, so the gate is measured on a
port the lane never bound. 1420 was read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else — **0 LISTEN rows**,
never bind-probed; 16161 lsof'd to **0 rows** immediately before binding.

`index --check` names exactly this diff and nothing else — `files +0 -0 ~3`
(`runner.rs`, `fake_agent.rs`, `tests/agent_runner.rs`), symbols
2432 → 2436, **edges unchanged at 2351**. **FENCE CLEAN**, verified
against `.nputer/lane-fence.json` itself rather than against the notes:
the manifest grants `src/agent`, `src/bin/fake_agent.rs`,
`tests/agent_runner.rs` (plus `docs/tasks` always-writable) — the three
files touched, and nothing outside.

**INTERMITTENTS ATTRIBUTED, NOT CHASED**: the cache cliff (`T-088-s4`) did
not fire — the lib suite's own time is **4.23 s**, far inside the green
band — and `startup_arm_watches_the_initial_root` and both
`a_hostile_session_id…` bodies (`T-086-s1`, ~1-in-22) passed in the full
run. **SECURITY SWEEP**: no `Cargo.toml`/`Cargo.lock` change, so no
dependency was added; no new input path, endpoint, secret or unsafe
default; the only new surface is one `std::sync::mpsc` channel, and the
new `println!` carries an integer turn and a duration.

#### MUTANT LEDGER — my own bench, one side per drill

The executor's bench (`/private/tmp/nd-T-161`) **no longer exists**, so
**nothing was reused and the independence is structural**: a fresh
`--shared` clone at `nd-T-161-verify`, `CARGO_TARGET_DIR` in scratch and
therefore unindexed. Every mutation was read back with `git diff` before
running and every restoration proved by sha256 against the committed
blob. My independently derived hashes match the executor's ledger on all
three files (`runner.rs` `9cbb5ae7…`, `fake_agent.rs` `e96f7cab…`,
`agent_runner.rs` `cf0d5091…`).

| drill | side | mutation | result |
|-------|------|----------|--------|
| baseline | — | none | both bodies **ok**, exit 0, count **1** body each (not zero) |
| **M1** | CODE | `await_stderr_eof` call removed — the capture reverted to its racy form | new body **RED 10/10** (exit 101); panic shows the tail holding only the early line |
| **M1′** | CODE | same mutant, **old** body `a_nonzero_exit_is_typed_…` | **GREEN 10/10** |
| **M1″** | CODE | same mutant, **whole `agent_runner` suite** | `87 passed; 1 failed` — **failing-body count exactly ONE** |
| **M2** | CODE | *mine, shape SEVEN*: `let _eof = eof;` deleted from the drain closure | new body **RED 5/5**, on the assertion |
| probe | TEST | 40 ms grace against the 150 ms holder — drives the expiry branch | **no hang**, fallback + diagnostic line, semantics intact |

**M1′ IS THE CARD'S WHOLE POINT, MEASURED BOTH WAYS.** Under the identical
mutant the body CI reds on stays **green 10 out of 10**, while the new body
reds **10 out of 10**. The old body cannot see this defect on this host —
which is precisely why CI was intermittent rather than red — and the new
body converts a scheduling coin flip into a fact. **M1″ closes shape SIX
mechanically**: the failing-body count is ONE, so the new body kills a
mutant no other body in the suite kills. It is not a duplicate.

**M2 is mine and it is the sharper one.** `let _eof = eof;` looks like
belt-and-braces and is not: Rust 2021 `move` closures capture only what
the body mentions, so deleting that line drops the `Sender` at the end of
the `if let` block, `Disconnected` fires immediately, and the race returns
through a different door than M1. The new body catches it 5 of 5, so the
pin is on the SIGNAL and not merely on the call site.

#### CORRECTION 1 — the statistical rows did not reproduce at this seat

I rebuilt `race.rs` in my own scratch (source sha256 `09c5456b…`,
**identical** to the notes; I read it in full before running it) and ran
the experiment myself. **The deterministic pair reproduced exactly**:
`child-late` racy loses the late line **40/40**, fixed **0/40**. **The
statistical half did not**: `child-nonzero` racy gave **EMPTY=0 over 500
idle** and **EMPTY=0 over 500 against 32 busy threads** — 0 in 1000 where
the notes record 7 in 900 — with `max_us_after_reap` of **3 µs** against
the notes' 88 µs, i.e. the window never opened on this run.

This does not falsify the notes (a ~0.8 % race is load- and
schedule-dependent, and the two runs plainly met different machine
conditions) and it does not weaken the fix, because the load-bearing proof
is the deterministic pair plus the in-tree M1 drill — both of which
reproduce perfectly. **But the notes currently elevate the least
reproducible measurement to primary evidence**, in the closing line *"The
evidence that it is gone is the 900-run experiment above, not a CI tally."*

**PERFORM:** in `## Implementation notes`, (a) mark the M1/M2/M2b
statistical table as one host-and-moment observation that **did not
reproduce at the verifier's seat** (0 empty in 1000 racy `child-nonzero`
iterations, max 3 µs post-reap drain latency), and (b) repoint that
closing sentence at the **deterministic** experiment (M5/M6) and the
mutation drill, which are the reproducible proofs.

#### CORRECTION 2 — the wait is unconditional, the tail is not

`await_stderr_eof` runs on **every** non-cancelled turn, but `stderr_tail`
is consumed only by the two `ExitNonZero` arms. The success arm takes
`child.wait()` with **no group kill**, so a CLI that leaves a descendant
holding the stderr write end now delays the turn's `completed` by up to
`cfg.kill_grace` — **5 s in production** — waiting for a tail that is then
never read. At base that path waited for nothing. This is reachable, not
hypothetical: `runner.rs`'s own header documents escapees, `spawn_grandchild`
inherits fd 2, and the shipped `nonzero-late-stderr` fixture demonstrates
the mechanism by blocking its own turn for the holder's 150 ms — with the
ceiling confirmed by my expiry probe.

I am **not** assigning a code change. The cost is bounded, it is the
honest price of the fix, and restructuring the classification so the wait
is taken only when an `ExitNonZero` is about to be typed would put a
correct fix at risk for a narrow gain. But it is currently **undisclosed**,
and an undisclosed bounded cost is how the next reader gets surprised.

**PERFORM:** add one paragraph to `## Implementation notes` recording that
the drain wait is paid on every non-cancelled turn including successful
ones, that the success arm performs no group kill, and that a descendant
holding stderr can therefore delay a *successful* turn's completion by up
to `kill_grace` for a tail that arm never reads.

#### Observations, NOT corrections and not blocking

- On expiry the drain thread stays blocked on the pipe and is leaked;
  bounded per turn, and unchanged in kind from the base's detached thread.
- The drain loop ends on `Err` as well as EOF, so a read error signals
  "done" with the pipe unfinished. Pre-existing at base, unchanged here.
- The 64 KiB cap is pinned at the `Ring` (`the_stderr_ring_keeps_the_tail_not_the_head`)
  but its application at the `Ring::new(MAX_STDERR_RING)` call site is
  pinned by inspection only. Also pre-existing; the criterion asks the cap
  to *survive*, and by diff it does.

#### Criterion 5, and what I could not verify

**Criterion 5 is structurally owed at integration, not failed here.** The
lane had no push and no CI, so the run ids cannot exist yet; the executor
discloses this rather than papering it. The **local** half is complete and
I re-measured it. What remains for the integrator is the ubuntu cargo step
on this branch — and the honest reading, which the notes already state, is
that a green ubuntu run proves the fix compiles and holds there but cannot
by itself prove a rare intermittent is gone.

Also not verified: **the Linux behaviour itself**. Both CI sightings are
ubuntu and every measurement in this verdict is macOS. The mechanism is
POSIX pipe-and-`waitpid` semantics and is not platform-specific, and the
new body is deterministic on any platform — but I did not observe it on
the platform where it fired.

**A HAZARD WORTH RECORDING FOR WHOEVER SITS HERE NEXT:** this session's
scratch directory is shared with the live `T-140-s9` lane, which
overwrote an unnamespaced drill script of mine mid-pass. Every artifact of
this verdict was re-created under a `t161v-` prefix after that. A drill
whose scripts can be clobbered by another seat is a drill whose numbers
cannot be trusted; namespace by card id.

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
