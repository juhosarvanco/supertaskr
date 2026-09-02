---
id: T-238
title: THE SEAT THAT HOLDS THE INTEGRATION CHECKOUT IS NOWHERE ON DISK — two architect sessions held it at once on 2026-09-01 and neither could see the other, because the holder is declared in prose and read by nobody
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/scripts/brief.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/lane-lock.spec.ts]
suggested_by: "the architect seat, 2026-09-02 — item 7 of docs/rooms/loop-efficiency.md; the instance is this seat's own arrival, measured with ps and the session list while the retired seat was mid-battery and then mid-checkpoint in the same checkout"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**RULE 4 SAYS ONE HOLDER AT A TIME AND DECLARED AT DISPATCH. NOTHING
RECORDS WHO.** On 2026-09-01 an Opus session was running the four-suite
battery in /Users/ujju/Projects/nputer and then writing its checkpoint
there while a second session, asked to take the same seat, was reading.
The only defence was the second seat reading `ps` for `gate-run.mjs`,
`lsof` for the e2e port, and the harness's session list — none of which
the method names, and none of which the first seat could have used to
learn a second seat existed. Concurrent checkpoints CORRUPT (rule 4),
and any commit by the second seat would have staled the first seat's
push token (T-203) at the moment it was minted.

T-189-s3 gives the holder a CARRIER in the brief; T-216-s1 built the
catcher that names a stale checkout from outside. This card gives the
holder a RECORD on disk that both the arming step and the push guard
read, so a second seat is refused by construction rather than by luck.

## The construction

A runtime file, `.nputer/holder.json` in the integration checkout,
gitignored like the fence manifest, carrying WHO holds the checkout:
the identity of the holding session, when it took the seat, and the
checkout path. **The identity is the open question this card must
MEASURE rather than assume**: a Bash tool call carries no session id
(T-216-s1 measured `CLAUDE_PROJECT_DIR` unset there), but every tool
shell is a descendant of the harness process, so an ancestor pid plus
its start time is a candidate identity that survives across calls and
dies with the session. The lane SHALL measure whether that ancestor is
stable and distinguishable on this machine before building on it, and
SHALL say what it found.

- **Taking the seat** is an explicit arm — `brief.mjs --take-seat` —
  that refuses when a DIFFERENT holder is recorded and its process is
  alive, and takes over when none is recorded or the recorded process is
  dead, announcing the takeover with the dead holder's identity.
- **The arming steps** (`--preflight`, `--write-fence`) and **the push
  guard** read the file and refuse when the recorded holder is alive and
  is not this session — with the holder's identity and the remedy
  (*the other session retires, or takes over explicitly*).
- **Releasing** is `--release-seat`; a dead holder needs no release.

## Limits, disclosed

A seat that never runs an arming step and never pushes is not seen —
a pure reader is not a holder, which is correct. A seat that edits and
commits without pushing is seen only at its next push. Identity by
process ancestry is a fact about this harness; the lane names it as
such and keeps the derivation in one function so another harness can
replace it.

## Acceptance criteria

- WHEN a session runs `--take-seat` in a checkout whose holder file
  names a DIFFERENT live session THE command SHALL refuse, naming the
  holder and the remedy, and a positive control SHALL show the same
  command succeed once the holder's process is dead.
- WHEN the holder file names this session THE arming steps and the push
  guard SHALL proceed silently; WHEN it names another live session THEY
  SHALL refuse; WHEN it names a dead session THEY SHALL announce and
  proceed.
- THE session identity SHALL be derived in one function and its
  stability measured across at least two separate tool shells in the
  report, with the derivation named in the file's own header.
- THE holder file SHALL be un-committable by construction, the shape
  the fence manifest and the gate token already use.
- IF the checkout is not the integration checkout THEN the arms SHALL
  say so and do nothing — a lane does not hold a seat.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

lane-protocol rule 4 (STANDING, NOT THE SEAT — the holder is declared,
never inferred), T-189-s3 (the carrier), T-216-s1 (the catcher that
sweeps the machine), T-203 (the token this protects), and
docs/rooms/loop-efficiency.md item 7.

## Absorbs: T-230-s6 (2026-09-02)

Four e2e bodies — two in checkout-currency.spec.ts, one in
card-preflight.spec.ts, one in lane-lock.spec.ts — assert their OWN
checkout is CURRENT, so they red when main advances underneath them
(measured green then red hours apart on a byte-identical tree at
90dfe53). The CURRENT case moves to a fixture whose vantage the body
controls, the way the same spec's stale bodies already do; the fence
gains the two specs. Criterion added: WHEN main advances past a lane's
base THE suite in that lane SHALL NOT red on the lane's own currency.

## CORROBORATION, 2026-09-02 — a fourth body, and the trigger is the merge of a guard

Measured by T-215's blind verifier on a bench detached at 42520e3, six
commits behind main and cut before T-237's push guard merged at 44a95c3:
`npm test` from tools/e2e reads 555 passed, 4 failed — card-preflight
.spec.ts:719, checkout-currency.spec.ts:852 and :953, lane-lock.spec.ts
:899 — because T-216-s1's catcher fires `guard-surface-behind` on every
`--preflight` and `--write-fence` in a checkout whose `.claude/` is
behind the integration branch's. Every lane cut before a guard merges
reds these four on its own currency for the rest of its life, which is
the class the absorbed T-230-s6 names with a second trigger: not main
advancing past the base in general, but a `.claude/` change landing.
The fixture-vantage move this card owes covers it; the lane SHALL name
card-preflight.spec.ts:719 among the bodies it moves.

## Absorbs: T-240 (2026-09-02)

The T-018-s2 verifier measured that a verifier BENCH cannot run the e2e
leg green at any ref for any diff: four bodies judge the checkout they
run in, and a bench detached at a lane's base is stale to that judge by
construction (`guard-surface-behind`, 28 commits behind). The
fixture-vantage move this card owes covers benches exactly as it covers
lanes; the criterion gains its second subject: WHEN a bench is detached
at a base behind the integration branch THE suite there SHALL NOT red on
the bench's own currency, and verifier.md step 7's e2e column SHALL be
dischargeable from a bench.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Lane `task/T-238-holder-on-disk` at `/Users/ujju/Projects/nputer-T-238`,
cut at `a03259fa4895b462fca067956f583fcfd05b2f39`. Every figure below
carries the ref or the reading time it was measured at.

### THE IDENTITY MEASUREMENT — the question this card said to answer first

Read 2026-09-02 on Mac.lan with `ps -o pid=,ppid=,lstart=,comm=`, walked
up from `$$`, in TWO SEPARATE Bash tool calls:

    call 1   sh 44259 <- zsh 44255 <- claude 65005, Tue Sep  1 23:52:34 2026
    call 2   sh 44310 <- zsh 44308 <- claude 65005, Tue Sep  1 23:52:34 2026

**STABLE: yes.** The per-call shell is a different process every time
(44255, then 44308 — and a second `sh` inside call 2 was 44336 under the
same zsh); the `claude` process above them is the same pid at the same
start time across calls.

**DISTINGUISHABLE: yes, and it was measured rather than assumed.** At the
same minute this machine carried TWO live harness processes — 3414
(started 23:29:18, `--model claude-opus-5`, resuming session
72a12f43-…) and 65005 (23:52:34, `--model claude-fable-5-1`, this
session) — different pids AND different start times, one per session.

**AND THE ANCESTOR ONE HOP FURTHER UP IS NOT.** Both harnesses descend
from `/Applications/Claude.app/Contents/Helpers/disclaimer` (one per
session) and then from application root pid 2295 (ONE per application
instance, shared by every session in it). A walk that climbed to the top
would hand two concurrent sessions ONE identity and this guard could
never fire — so the derivation takes the NEAREST matching ancestor and
answers NOTHING when none matches.

**THE DEPTH IS AN OUTPUT, NEVER AN INPUT**, because the two call sites
differ: the arming steps run under `zsh -> claude` and the push guard
runs as a hook under `node -> claude` with no shell at all. Measured,
same session, four spellings:

    node from the tool shell        pid 65005, 2 hops
    node under `sh -c`              pid 65005, 2 hops
    node under three nested shells  pid 65005, 2 hops
    node under `npm exec`           pid 65005, 3 hops

**LIVENESS ASKS `ps`, NOT `process.kill(pid, 0)`, AND THE REASON IS
MEASURED:** `kill(1,0)` throws EPERM (a LIVE process that is not ours),
`kill(999999,0)` throws ESRCH (dead) — collapsing those two takes over a
live holder — and `kill(0,0)` and `kill(-1,0)` both SUCCEED, so a record
carrying 0 or -1 would read alive for ever. `ps -p` answers non-zero with
no row for 0, for -1 (`Invalid process id`) and for a pid too large, so
every one reads dead; the pid is validated at the write and at the read
anyway, so nothing rests on one platform's `ps` being that careful.

**`CLAUDE_PROJECT_DIR` IS UNSET IN A BASH TOOL CALL**, re-measured here
(`env | grep -c` returns 0 for it while 24 other CLAUDE_* variables are
exported) — T-216-s1's measurement, confirmed.

**AND THE IDENTITY NAMES A SESSION, NOT A SEAT.** A subagent shares its
dispatching session's harness process, so an agent spawned by the holder
derives the holder's identity and is treated as the holder. Correct for
this collision — one session, one checkout, whatever it spawns — and
stated in the artifact because it is not what "identity" makes a reader
expect.

### WHAT WAS WRITTEN, AND WHERE

- `tools/e2e/scripts/checkout-currency.mjs` — the holder section:
  `sessionIdentity` (THE ONE derivation, with the harness named and the
  measurement above in its own header), `processRow`, `programOf`,
  `isHarnessProcess`, `identityAlive`, `isRecordablePid`, `sameIdentity`,
  `HOLDER_REL_PATH`, `readHolder`/`writeHolder`/`removeHolder`,
  `isIntegrationCheckout`, `holderVerdict` (six states) and
  `renderHolder`. `writeHolder` calls `armRuntimeDir` from
  `.claude/hooks/gate-token.mjs` rather than spelling an ignore string,
  so the holder file is un-committable by the SAME CODE the fence
  manifest and the verdict token already use.
- `tools/e2e/scripts/brief.mjs` — arm eight: `--take-seat`,
  `--release-seat`, and the READ half inside `--preflight` and
  `--write-fence`. A live OTHER holder is a finding (exit 1) and GATES
  the manifest write, the way a failed preflight already does.
- `.claude/hooks/push-guard.mjs` — a fifth arm on the same record, placed
  before the landing gate. It imports `checkout-currency.mjs`, which is
  the file's first import outside `.claude/hooks/`; the header rule's
  REASON (a lane worktree ninety seconds old has no `node_modules`) is
  satisfied, that module importing node builtins and these same hooks
  only, and the header now says so.
- the four spec files, below.

### THE FOUR BODIES THAT JUDGED THEIR OWN CHECKOUT (T-230-s6, T-240)

- `checkout-currency.spec.ts` — *THE WIRING'S POSITIVE CONTROL* and
  *THE SWEEP AT ARM TIME* now point at `currentVantageCheckout()`: a
  `git worktree add --no-checkout --detach <mkdtemp> main` of this
  repository, with `main`'s own `settings.json` and the hook files it
  names written in. The vantage is fixed (`defaultVantage()`), so only
  the target can be steered — and a target reads CURRENT only if the
  vantage can answer both arms about it, which a plain temp directory
  cannot. The worktree path is DERIVED from `mkdtemp` and the entry is
  given back in `afterAll`.
- `card-preflight.spec.ts` and `lane-lock.spec.ts` — their CLI helpers
  now set `CLAUDE_PROJECT_DIR` to a directory in no checkout of this
  repository, which puts the catcher in the UNANSWERED state
  `checkout-currency.spec.ts` already pins as speaking and charging
  nobody. Their exit codes become facts about the preflight and the
  physical fence layer rather than about the runner's own position.

**THE DEMONSTRATION, RED THEN GREEN, ON A GENUINELY STALE BENCH.** A
detached worktree at `42520e3` (25 commits behind `main`, judged STALE
by the catcher's own CLI with `guard-surface-behind` naming `99349db`):

    with the bench's OWN pre-change specs   4 failed  — card-preflight:719,
                                              checkout-currency:852 and :953,
                                              lane-lock:899
    with this lane's specs restored into
    its working tree, HEAD UNCHANGED         4 passed, exit 0

Same bench, same HEAD, still stale to the catcher. That is the absorbed
criterion for lanes and for benches in one measurement, and it names
`card-preflight.spec.ts:719` as the CORROBORATION asked.

### THE SWEEP — every other reader that judges its own checkout

Class: a body that spawns an ARMING step (`--preflight` / `--write-fence`
run T-216-s1's catcher) and then asserts an exit code or a currency
verdict about the checkout the suite is running in. Searched at
`e881a5c`:

- arm 1, every spec naming an arming step: `brief.spec.ts`,
  `card-preflight.spec.ts`, `checkout-currency.spec.ts`,
  `lane-fence.spec.ts`, `lane-lock.spec.ts`, `landing-gate.spec.ts`.
- arm 2, every body asserting a currency verdict: only
  `checkout-currency.spec.ts`.

**RESULT: the four this card moves are the whole set.** The three others
are safe for reasons that were READ rather than assumed —
`brief.spec.ts:1965` spawns `--write-fence` and asserts on the output
TEXT, which the catcher's block only adds to; `lane-fence.spec.ts:642`
reaches the USAGE refusal during argument parsing, before the catcher
runs; `landing-gate.spec.ts` names the arm only in prose. **And the
sweep was shown capable of finding something before its answer was
written down** — the same query over a planted needle returns 1.

### EVERY COMMAND, IN ORDER, WITH ITS EXIT

    npm ci (tools/e2e)                                        0
    npm ci (app)                                              0
    npx playwright test <the three specs>  [baseline, at a03259f]   0  (82 passed)
    npm run typecheck (tools/e2e)   x7 across the build        0 each
    npx playwright test tests/checkout-currency.spec.ts        0  (41 passed)
    npx playwright test tests/card-preflight.spec.ts           0  (42 passed)
    npx playwright test tests/lane-lock.spec.ts                0  (14 passed)
    npx playwright test <the four fenced specs>                0  (173 passed)
    npx playwright test  [the whole e2e lane, at 759547b]      0  (594 passed)
    git worktree add --detach <bench> 42520e3                  0
    npx playwright test -g <the four bodies>  [bench, before]  1  (4 failed)
    npx playwright test -g <the four bodies>  [bench, after]   0  (4 passed)
    git worktree remove --force <bench>                        0
    <13 poison drills, below>
    node tools/e2e/scripts/gate-run.mjs parser                 0
    npm run build (app)                                        0
    node tools/e2e/scripts/gate-run.mjs app                    0
    node tools/e2e/scripts/gate-run.mjs rust                   0
    node tools/e2e/scripts/gate-run.mjs e2e                    1
    npx playwright test tests/session-economics.spec.ts        1  (attributed below)
    git merge-tree --write-tree main HEAD                      0
    cargo run -p nputer-index -- index --check --root ../..    0

### THE FOUR-SUITE BATTERY, at `e881a5c` on Mac.lan

    gate-verdict suite=parser exit=0 bodies=349  targets=1  verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1131 targets=1  verdict=GREEN
    gate-verdict suite=rust   exit=0 bodies=634  targets=18 verdict=GREEN
    gate-verdict suite=e2e    exit=1 bodies=594  targets=1  verdict=RED

**THE E2E RED IS TWO NAMED BODIES AND NEITHER IS THIS DIFF'S**, and the
attribution is a measurement rather than a claim:
`session-economics.spec.ts:179` and `:365` — T-143-s1's own pair, whose
corroboration this lane appended to that card. They assert exit 0 from a
brief the LIVE LANE LIST can correctly refuse; lanes cut after this
lane's base carry cards this lane's board does not have, so the
assembler cannot read a fence it can see a worktree for. The same suite
in the same lane read **594 passed, exit 0** at 07:33 before those lanes
existed, and the POSITIVE CONTROL — the same two bodies on a detached
bench at `main` (`fb2a944`), where every live lane's card IS on the
board — reads **2 passed, exit 0**.

### THE DRILLS — 13 mutants, one side only, all killed

Run in a detached worktree cut from this lane's OWN commit
`e881a5c0fe0a7fd92c09db23572f0429da2183c6`, over the spec set DERIVED
from the import graph (12 files, 357 bodies) rather than defaulted. Each
mutation was read back with `git diff` before the run and restored with
`git restore --source=<that commit> --staged --worktree`, proved by
sha256 against `git show <commit>:<path>`. **The unmutated baseline in
that worktree is 2 failed / 355 passed — the same two session-economics
bodies — so every kill set below is stated NET of them.**

    M1  sameIdentity -> always true            8 bodies, incl. all three refusals
    M2  identityAlive drops the start time     1 (liveness is the pid AND its start time)
    M3  harness match becomes case-insensitive 1 (the shared application root is never the identity)
    M4  holder record leaves .nputer/          5 (incl. un-committable by construction)
    M5  push guard's held branch disabled      3 (the three push-guard refusal bodies)
    M6  brief's fence gate disabled            1 (no manifest ... while another live session holds)
    M7  isRecordablePid accepts 0 and -1       1 (0 and -1 are refused ...)
    M8  isIntegrationCheckout always yes       3 (both lane bodies + the state machine)
    M9  programOf cuts at the first space      3 (the two identity bodies + a control)
    M10 push guard's dead-holder notice off    1 (a DEAD holder is announced ...)
    M11 push guard's unknown notice off        1 (a holder record this guard cannot READ ...)
    M12 brief's holder block never printed     1 (a lane holds no seat: both arms say so)
    M13 the takeover announcement removed      1 (--take-seat REFUSES ... and takes it over)

Restoration hashes (`shasum -a 256`, identical before and after every
drill, and equal to the blob at the drill's base commit):

    ba6a6f94edeae85eb1d21bcb96ef2846a2261b762198a1af3a45270badbcfe35  .claude/hooks/push-guard.mjs
    9d5c961b68114babacb1872247a0a4ea3bfa61a32c6d70a5fadf0842d9a57bc3  tools/e2e/scripts/brief.mjs
    72f355390066e9f2fae356c38a62cecb9c81effb613c18d33b09ca09d9a9fba4  tools/e2e/scripts/checkout-currency.mjs
    27d550423c9fcc0c7b6d6091ff0d49fdaf5d27acae5f107f0ba3a7d10e66e2bd  tools/e2e/tests/card-preflight.spec.ts

Both drill worktrees were removed afterwards and this lane's own status
is clean.

**EVERY POSITIVE CONTROL WAS DEMONSTRATED FAILING, NOT ASSERTED.** M5,
M10, M11, M12 and M13 exist for exactly that: each disables one ANNOUNCE
or SAY-SO arm and each kills exactly the body written for it. The
refusal's own control — `--take-seat` succeeding once the holder's
process is dead — is driven by a genuinely spawned second harness that
is genuinely SIGKILLed, awaited on its own `exit` event.

**AND THE HARNESS IN THOSE BODIES IS A FIXTURE**: a symlink to node named
`claude`. A body resting on the real ancestry would derive an identity on
this machine and NONE on a CI runner, so the refusal would be unreachable
exactly where nobody is watching. No production flag and no environment
override was added to make the tests reachable.

### WHAT IS ROUTED RATHER THAN BUILT

- **The root `.gitignore` line is NOT needed and the self-ignoring shape
  SUFFICES** — measured in a repository nobody armed: `git status
  --porcelain` is empty before and after the write while an ordinary file
  written beside it in the same breath IS reported. `T-154-s1` already
  owns that class and this lane appended a dated corroboration to it
  rather than filing a sibling card.
- **The e2e red** is `T-143-s1`'s class; a dated corroboration was
  appended there, with the third cause (ref skew rather than fence
  overlap) and the positive control at `main`.
- **Two new spec-name additions mean `docs/CAPABILITIES.md` is STALE**;
  regenerating it is the integrator's in the merge commit
  (docs/CONVENTIONS.md, the `npm run capabilities` bullet).

### WHERE THE BRIEF WAS WRONG

1. **"the four guard-surface bodies … are exactly the ones that red in a
   lane today" — FALSE for this lane at this base.** Measured at
   `a03259f`: `git rev-list -1 main -- .claude` is `99349db`, and
   `git merge-base --is-ancestor 99349db a03259f` exits 0 — this lane
   CONTAINS the newest guard-surface commit, so all four bodies were
   GREEN here before any edit (82 passed across the three specs, exit 0).
   The class is real and conditional: it needs a `.claude` commit
   strictly between a checkout's base and the integration tip, which is
   why the demonstration had to BUILD that condition on a bench at
   `42520e3` rather than read it off this lane.
2. **Row 4's base commit is right and the "integration tip" is stale.**
   The brief names `4a9c68cc9c13426593e464440fddc8c851e2dea7` as the base
   and `a03259fa4895` as the integration tip; this lane's HEAD is
   `a03259fa4895`, which is the dispatch stamp and the true base, and
   `main` had already moved to `43e0fe8` when this lane started, then to
   `e4cd6d4`, then to `a7cc65b`, then to `fb2a944` while it worked. A
   live tip is a reading, not a fact about a tree.
3. Nothing else in the brief was contradicted by the repository. The
   fence, the ceremony row (M: executor -> verifier -> integrator), the
   port, the scratch naming and the no-merge instruction all held.

## VERDICT — APPROVED at `7705ac49`, 2026-09-02

Blind verifier, `claude-opus-5[1m]@subagent`, bench
`/Users/ujju/Projects/nputer-V-T-238` detached at the BASE `a03259fa`.
**THE BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINE-SHAPED**: phase 1 ran
before the lane's first commit existed, so there was no diff to decline
to read. Three artefacts sealed at `2026-09-02T04:01:09Z`, before any
byte of the work: attack set `11891017…`, ground truth `29fcc82e…`,
stamps `9a5ad38d…`. The lane's branch was never fetched in phase 1, its
worktree never opened, and no executor note read until the tip arrived
BY PATH.

### The ground truth said this card's own prediction was FALSE, and said so first

Sealed before the diff: at `a03259f` this bench CONTAINED `99349dba`,
the newest `main` commit touching `.claude`, so the four bodies were
**already green here** — the whole e2e leg read 574 bodies, exit 0.
**The absorbed T-240's wording is false as a universal**: a bench cannot
run the leg green *only while a `.claude`-touching commit sits strictly
between its base and the tip*, which is a fact about the clock and not
about any diff. That was pre-committed, so a green leg could never be
mistaken for evidence about this fix.

By phase 2 the clock had turned: at `7705ac4` this bench is judged
**STALE** by the catcher's own CLI — `guard-surface-behind`, 50 commits
behind, not containing `.claude` commit `7129d90b`. The condition the
card is about arrived on its own, and the test below is the real one.

### T-240's ask, measured at the judged tip in a genuinely stale bench

Same bench, same HEAD `7705ac4`, same machine, minutes apart; only the
spec files differ:

    the BASE's three specs in the tree   1  — 4 failed: card-preflight:719,
                                             checkout-currency:852 and :953,
                                             lane-lock:899
    the TIP's specs, HEAD UNCHANGED      0  — 4 passed

That reproduces the lane's own red/green independently, at a different
ref and by a different route, and it discharges verifier.md step 7's e2e
column from a bench: the leg ran here, 594 bodies.

### Every acceptance criterion, attacked where the deciding arrangement was mine

**Criterion 1 — refuse a live holder, take over a dead one with
disclosure.** Controls hand-written, never through the lane's own writer.
A record naming pid 1 (alive, not ours) and one naming the OTHER live
harness `3414` both REFUSED, exit 1, record untouched. Then a process I
spawned myself, its true identity recorded by hand, SIGKILLed and reaped:
alive -> REFUSED; dead -> TAKEN OVER, exit 0, **disclosing the dead
holder's pid, start time, host and `takenAt`**. One arrangement varied,
one answer changed.

**Criterion 2 — the arming steps and the guard.** Seat MINE: the arming
step prints no holder block and the guard emits no holder notice — silent,
as the criterion asks. Another LIVE session: `--preflight` exits 1 with
the finding on stderr, and `--write-fence` leaves **no manifest on disk**.
Dead: announced, push proceeds.

**AND THE GUARD'S ARM IS REACHABLE IN THE STATE THAT MATTERS.** Driven
through `decide()` against a root with NO verdict token: a live other
holder returns `holder-live-elsewhere`, and the same request with the
record removed returns `token-missing`. That contrast is the placement
proof — one arm later and the second seat would have been refused for
the token and never told about the holder.

**Criterion 3 — one derivation, measured across shells.** Stable across
two separate tool shells (pids 31756 and 36547, both -> `65005`) and
across six spellings: direct node, `sh -c` (the hook's own shape), `zsh
-c`, three shells deep, `npm exec`, and under `env -i` with every
`CLAUDE_*` variable stripped. **Identity identical in all six; hop count
2 and 4.** Depth is an output, exactly as claimed.
**MY STRONGEST PRE-COMMITTED PREDICTION WAS REFUTED HERE** — I expected
the arming step (`zsh -> claude`) and the hook (`node -> claude`) to
derive different identities and the guard to refuse the session that took
the seat. A nearest-matching-ancestor walk survives it.
The two traps are closed and I measured both: the shared application root
`2295` (`/Applications/Claude.app/Contents/MacOS/Claude`) does NOT match,
the case-sensitivity being load-bearing; and the `disclaimer` launcher
`65004`, whose *arguments* name the harness path, does not match either,
because `programOf` reads only the program. The other live harness on
this machine derives a different identity — pid and start time both.

**Criterion 4 — un-committable by construction.** Measured in a
repository nobody armed: a fresh `git clone` put on `main` at the tip,
`--take-seat`, then `git status --porcelain` **empty** and
`git check-ignore -v` naming `.nputer/.gitignore:3:*` for the holder file
AND for the ignore file itself. `armRuntimeDir` is imported, not
re-spelled.

**Criterion 5 — a lane does not hold a seat.** A lane worktree carrying
the identical live-other record answers `not-integration`, writes
nothing, adds no finding, and the arming step's exit is unchanged. A
detached bench likewise.

### Malformed input, and the security sweep

Every degenerate record ANNOUNCED and none silently stepped over: pid
`0`, pid `-1`, `"65005"` as a string, `1.5`, a torn `{"version":1,`,
version `2`, a missing identity object and a bare array all read
`holder-unreadable`; `999999` reads `holder-dead`. **`0` and `-1` are the
ones that matter** — both answer ALIVE to `kill(2)` for ever, and both
are refused at the write AND at the read.

The whole surface is one `spawnSync("ps", ["-o", …, "-p", String(pid)])`
in argv form. **No shell, no `execSync`, no template-interpolated command,
no `process.kill`, and no signal is ever sent to a pid read off disk.**
No dependency added. The record carries pid, start time, program path,
checkout, clock and host — **no argv, no `--resume` token, no session id**
— and the file-controlled `program` field is never echoed into a refusal.

### Poison drills — graded by containment, each landing read from `git diff`

    A  isHarnessProcess case-insensitive     kills 1  (the shared-app body)
    B  identityAlive drops the start time    kills 1  (the recycled-pid body)
    C  writeHolder skips armRuntimeDir       kills 4  (incl. un-committability)
    D  the guard's holder call site neutered kills 5  (the new guard bodies)
    E  judge() always "current"              kills 11 stale-discriminating bodies
    G  judge() always "stale"                kills the TWO MOVED CONTROLS

**E AND G TOGETHER ARE THE ANSWER TO THE ATTACK SET'S SHARPEST
QUESTION** — whether the moved bodies became unfalsifiable when their
vantage became a fixture. They did not. `E` leaves them alive because a
positive control asserting CURRENT is satisfied by an always-current
implementation; `G` kills both. Neither kill set contains the other, so
the moved controls and the stale-discriminating bodies are both
load-bearing, and every mutant died at the site its property lives.
`card-preflight:753` and `lane-lock:899` survive both, correctly: their
helpers now put the catcher in the UNANSWERED state, so their exit codes
became facts about the preflight and the fence layer rather than about
the runner's position. **Twenty bodies added, ZERO removed** — nothing
was made green by deleting the teeth, and `:936` / `:971` / `:1005`
still die under a neutered wiring.

### The battery at `7705ac4`, and the two reds attributed by measurement

    parser  349 GREEN · app 1131 GREEN · rust 634 GREEN
    e2e     594 bodies, 2 failed
    index --check CURRENT · typecheck 0 · lint:docs 0 · lint:tokens 0
    git merge-tree against main at 34f4db2: exit 0 over 10 paths

The two are `session-economics.spec.ts:179` and `:365`. **NOT THE
DIFF, AND I DID NOT TAKE THAT ON ANYBODY'S WORD**: the file is
byte-identical base-to-tip, and the same two bodies fail **at
`a03259f` in this same bench at the same clock** — while this seat's own
phase-1 leg at that ref, hours earlier, was green. Between the two
readings `main` advanced and lanes were cut. That is T-143-s1's
machine-scoped-list class exactly, and the lane filed the corroboration
on that card rather than absorbing the red.

`capabilities:check` is STALE by the twenty new spec names. **That is
OWED, not a defect** — the lane's fence leaves the census read-only, the
card reports it, and the regeneration is the INTEGRATOR'S in the merge
commit. Forgetting it reds CI on that push; it has before (`e67cb44`).

### Findings — none blocking, all recorded rather than routed

1. **A dangling symbol in a user-facing refusal.**
   `checkout-currency.mjs` tells the reader to *see
   HARNESS_ARGV0_BASENAME*; no such symbol exists — it is
   `HARNESS_PROGRAM_BASENAME`. CONVENTIONS' A CITATION NAMES A SYMBOL
   rule, broken in the one sentence a reader meets when the identity
   cannot be derived.
2. **`--release-seat` removes a record it cannot read.** A truncated
   record is deleted with *RELEASED. The next session to arm this
   checkout takes it unopposed*, exit 0 — contradicting the arm's own
   rule that it *refuses to remove a record it cannot show belongs to
   this session*. No guarantee is lost (both readers already ANNOUNCE
   and ALLOW in that state, so nothing was protecting that seat), but
   the sentence misdescribes the act. `writeHolder` uses a plain
   `writeFileSync`, which is how the state is reached.
3. **This card's own premise is false as measured, and the lane left it
   standing.** The construction section says *a Bash tool call carries no
   session id*. Measured in a Bash tool call at `7705ac4`:
   `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_HOST_SESSION_ID` and
   `CLAUDE_PID` are all exported, and `CLAUDE_PID` equals the derived
   harness pid. Only `CLAUDE_PROJECT_DIR` was re-measured. **The
   derivation is still the better instrument and that is measured too** —
   it survives `env -i`, needs no cooperation from the harness, and a pid
   carries LIVENESS that an id does not — but a card whose own
   instruction was to MEASURE rather than assume should not ship the
   assumption it displaced.
4. **A DETACHED integration checkout holds no seat.** The test is
   `HEAD == refs/heads/main`; mid-merge and mid-rebase keep that ref, so
   the checkpoint window is covered, but an integrator who detaches has
   no seat and no refusal. Narrow, and worth naming in the limits.
5. **The e2e suite now writes to the host's list of worktrees.**
   `currentVantageCheckout` runs `git worktree add` against the real
   repository and gives the entry back in `afterAll` with a `prune`. It
   cleaned up across every run this seat made. But rule 4 names that list
   as a MACHINE-scoped surface in those words, and an interrupted run
   leaves an entry the sweep, the dispatch guard and STATE's LANES
   derivation all read.

Findings 1 and 2 are cheap edits; 3 is a card correction; 4 and 5 are
limits to name. None of them is a defect in a shipped guard and none
gates the merge — they are recorded here rather than filed as cards so
that the routing stays the architect's.

**APPROVED.** The construction does what the card asked, the identity
question was measured rather than assumed and measured correctly, the
controls fail where they should, and the four bodies that judged their
own checkout no longer do.
