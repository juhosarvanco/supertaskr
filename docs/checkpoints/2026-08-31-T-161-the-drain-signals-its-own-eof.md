# Checkpoint: T-161 lands — the stderr drain signals its own EOF, and two seats measuring the same race got answers 300× apart

Date: 2026-08-31. Seat: architect/integrator. Scope: T-161 merge and
close; two notes-only corrections performed; why the statistical half of
the evidence was the wrong half to quote.

## What was wrong

`agent::runner::run_turn` spawned the stderr drain as a **detached**
thread and snapshotted the ring the instant `child.wait()` returned. Two
facts with nothing ordering them: *the process exited*, observed by
`waitpid` on the turn thread, and *the pipe reached EOF*, observed by the
drain. The relay loop did not supply the missing order either — it breaks
on `Disconnected`, which is **stdout's** EOF.

So a fully written diagnostic could sit unread in the pipe buffer and be
typed as `stderr_tail: ""`. **On Linux CI that happened twice**, both
times on commits touching nothing in the app crate, both times taking a
whole battery down with it because the cargo step's failure skips every
step behind it.

**The asymmetry is what settles the ownership**, and both seats reached
it independently from the base file alone: stdout's EOF *was* already
awaited; stderr had no such signal. The harness is not the owner — the
fixture writes to unbuffered stderr and exits, so by the reap the bytes
are already in the pipe.

## What landed

The drain owns a `Sender<()>` nothing ever sends on, and drops it at EOF,
on error, and on unwind — **so `Disconnected` BECOMES the EOF**.
`run_turn` waits for that signal before typing the failure, bounded by
the EXISTING `cfg.kill_grace` (reused, not invented), falling back to
exactly the pre-fix behaviour on expiry. No sleep, no poll, no retry in
the test. The tail's cap and the turn's semantics are untouched, and the
cancel path returns above the wait so the timing bodies do not move.

**The class sweep found one member and it was the one fixed** — and the
interesting half: `run_with_timeout`, in the same file, **already had the
right shape** (a reader thread plus a bounded `recv_timeout` after
`try_wait`). The turn path did not. One file, two capture sites, one of
them correct for years.

## THE VERDICT: APPROVED WITH ASSIGNED CORRECTIONS — both notes-only

**36 attacks written blind; the fix itself needed no change.**

The verifier proved the ownership claim rather than accepting it: its own
in-tree mutant holds child and test byte-identical, reverts only the
capture, and the tail loses the late line **10/10**. It drove the expiry
branch deliberately (a 40 ms grace against a 150 ms holder): no hang, a
loud line, fallback intact. And it measured that the new body finishes in
**0.48 s against a 5 s bound** — proof the wait returns on the SIGNAL and
not on the timeout, which is the difference between a synchronisation and
a disguised sleep.

**Its M1′ is the card's whole point**: the same racy mutant, run against
the OLD body, is **GREEN 10/10**. The body CI reds on cannot see this
defect at all — which is exactly why CI was intermittent rather than red.

### Correction 1 — PERFORMED: the notes quoted the half that does not travel

The executor measured **7 empty tails in 900** racy runs, post-reap
latency up to 88 µs. The verifier re-ran the same arm at its own seat:
**0 empty in 1000**, latency **3 µs**. Same repository, same fix,
different machine.

**The DETERMINISTIC pair reproduced exactly at both seats** — a writer
outliving the reaped child, lost 30/30 racy and won 30/30 fixed — as did
the in-tree mutant. So the proof was never in doubt; the notes simply
pointed their closing sentence at the arm that does not travel.
Corrected, with the general rule written beside it: **a statistical count
over a race is a reading of a MACHINE, not of a tree.** This project
already says that about durations and runner images; this is the same
rule arriving at a race.

### Correction 2 — DISCLOSED, which is what it asked for

The drain wait is paid on **every** non-cancelled turn while the tail is
READ only on the `ExitNonZero` arms, and the success arm performs no
group kill. So a descendant holding the stderr pipe can delay a
**successful** turn by up to `kill_grace` for a tail nobody reads.
Bounded, defensible, and previously undisclosed — recorded rather than
"fixed", because narrowing the wait to the failure arms means deciding
whether the tail is wanted BEFORE the exit status is known, which is a
different card's question.

### And a line that looks inert and is not

The verifier's own mutant deleted `let _eof = eof;` and the new body
reds **5/5** — Rust 2021 closures capture only what they mention, so a
`move` closure that never names the sender never takes ownership and the
signal never fires at EOF. Flagged at the site for whoever eventually
tidies it.

## Gates

- `index --check` — **CURRENT**, regenerated: **1,143,151 of 2,145,959
  (53.3%), 1,002,808 left**, 2,436 symbols
- `cargo test` — **256 lib, exit 0**; `agent_runner` **88 passed** (87 at
  base — the lane's one new body), lib suite 9.22s
- `npx vitest run` from lib/parser — **344**, `npm test` from app/ —
  **1077**, `npm test` from tools/e2e — **341**, all exit 0
- `lint:tokens` / `lint:docs` / `capabilities:check` — **0 / 0 / 0
  CURRENT**
- **BOOT GATE — OWED AND RUN, exit 0**, port 17501 derived, lsof zero
  rows either side; 1420 read with `lsof` only: zero rows
- **HEALTH — 10 inside, 0 drifting, 0 BREACHED, 0 unread, 4 UNKEPT**

**Criterion 5 is STRUCTURALLY OWED, not skipped.** The card asks for CI
cycles on the branch with run ids; the executor had no push and said so
rather than papering over it. **And the honest note is the verifier's**:
a green ubuntu run proves the fix compiles and holds there — it cannot
by itself prove the intermittent is gone, because the intermittent was
already rare. The evidence is the deterministic pair, not a CI tally.
CI on this merge will run it; that is worth having and is not the proof.

## A hazard the verifier met rather than read

**The scratch directory is shared, and a sibling lane clobbered an
unnamespaced drill script mid-verification.** CONVENTIONS already rules
the scratch stem is DERIVED from the lane id and never chosen — this is
that rule being met by a collision instead of by reading it. Everything
was re-created under a lane-derived prefix afterwards.

## Board

`T-161` done, `review: independent` — executor, blind verifier and
integrator all distinct seats. **TEN LANES LANDED overnight.** One in
flight: `T-140-s9`, verifier returned, awaiting this seat's merge.

## Owed after this record

- **@human, untouched as asked**: the FORM question (reopened), the
  steering split, the three permission questions, and thirty seconds on
  the interview's new ending at a narrow width.
- Both CI sightings were ubuntu and every measurement here is macOS —
  **the Linux half remains unobserved by this pipeline**, which is a
  standing limit rather than this card's gap.
