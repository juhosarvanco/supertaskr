---
id: T-202
title: ONE BLESSED GATE-RUNNER — an exit code is a summary, and a summary of nothing is indistinguishable from a summary of success; four seats proved that in one night from four directions
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); every instance below was measured at this seat or reported by a lane on 2026-08-31"
builder:
review:
---

**THIS CARD'S CHARTER IS ONE SENTENCE, AND FOUR SEATS REACHED IT
INDEPENDENTLY ON ONE NIGHT**: *an exit code is a summary, and a summary
of nothing is indistinguishable from a summary of success.*

## The instances, all from 2026-08-31, none hypothetical

- **Root-cwd greens.** The architect seat ran `npm run <gate>` from the
  repository ROOT, where there is **no `package.json`**. Every invocation
  exited **254**. Piped through `tail`, `$?` reported **0** — read as
  green **four consecutive times**, with three card commits made on their
  strength. Control both ways: `false | tail -1` → 0; with `pipefail`
  → 1.
- **A red over ZERO BODIES.** `T-167-s8`'s mutant broke syntax, so the
  suite exited 1 having run **no bodies at all**. An exit code calls that
  a kill.
- **A green for an unrelated reason.** The same lane's other mutant left
  a commit non-empty because a bare repo inside the fixture root was
  being added as blobs — the arm's precondition could not be killed from
  the side it depended on.
- **A crate-scope count describing ONE target.** `cargo test -p <crate>`
  without `--no-fail-fast` **stops after the first failing target**.
  `T-186` nearly corrected its verifier's correct `5` into a wrong `4`
  this way; the tell was arithmetic — the parts did not add up to the
  baseline.
- **A comparison over an EMPTY corpus.** Two of `T-186`'s own drill
  checks — a `diff` of two empty files exiting 0, and a duplicate-id
  scan over nothing. *"The failure wore the drill's own costume."*
- **A phantom intermittent.** `T-112-s4` read a suite exit through a pipe
  and nearly shipped an intermittent that did not exist.

## What to build

**A checked-in runner under `tools/gates/`, the ONLY sanctioned way to
run a graded suite.** It:

1. **cds with a guard** (`cd <abs> || exit N`) so a wrong directory is a
   refusal rather than a different answer;
2. **never pipes the graded command** — it redirects, captures `$?`, and
   reads afterwards;
3. emits **one machine-parseable verdict line per suite**, carrying the
   **exit code AND the body count AND the ref** it ran at;
4. **REFUSES a green that ran zero bodies**, and refuses a count whose
   parts do not sum to the run's own baseline;
5. **passes `--no-fail-fast` to cargo** and reports the TARGET count
   beside the pass/fail count.

**This extends the DOCS GATE's one-spelling doctrine to every gate**: the
project already learned that a gate with two invocations grows a mode
whose exit means something else (`T-142-s1`).

## The companion rule, and the half that is NOT this repository's

**Scripts print their own `$?` last; readers trust the printed line and
never a wrapper's summary.** Measured three times on 2026-08-31: a
background runner reported *"exit code 0"* while the script's own
captured `$?` held **1**, in three different agents' sessions.

**That half is upstream's, not this repo's** — it wants a minimal harness
repro filed against the tool, not a card here. This card owns only the
rule that makes this repository immune to it.

## Also folded in: a solo-run guard for benches

A timing bench and a full suite must not run beside each other. This seat
ran `cargo test` alongside a verifier's bench and produced a
`startup_arm` red that cost two attributions; `T-088-s4`'s hazard already
names contention as a cause. **The runner is the natural place to refuse
it** — argue whether a lock, a check, or a declared exclusion is right.

## Acceptance criteria

- EVERY graded suite in `docs/CONVENTIONS.md` SHALL be runnable through
  exactly one command, and the document SHALL name that command and no
  other spelling.
- A run that executes **zero bodies** SHALL NOT report success, and a
  body SHALL prove that by constructing a zero-body run (a syntax-broken
  mutant is the measured instance).
- THE verdict line SHALL carry exit code, body count and ref; a body
  SHALL prove each field is present and **that a missing one is refused**.
- **A POSITIVE CONTROL SHALL prove the runner can report RED** — a runner
  that only ever reports green is this card's own subject.
- WHERE cargo is run, `--no-fail-fast` SHALL be used and the target count
  reported.
- THE runner SHALL NOT pipe a graded command, and a body SHALL prove a
  piped invocation is refused or corrected.
- Verification: headless.

## Read beside

`T-142-s1` (the census/gate mode confusion, landed), `T-167-s8` (the
mutants that failed open and closed), `T-186` (the vacuous drill checks
and the fail-fast count), and `T-203`, which consumes this runner's
verdict token.


## Implementation notes (executor)

**Built:** `tools/e2e/scripts/gate-run.mjs` — the runner — and
`tools/e2e/tests/gate-run.spec.ts` — its positive control, written
first — plus one bullet in `docs/CONVENTIONS.md` naming the command.

### The card says `tools/gates/`; the card's own `touches:` does not

`tools/gates/` does not exist at `146ebb6` and is **outside this lane's
fence**, which `--write-fence` derived from this card's own
`touches: [tools/e2e, docs/CONVENTIONS.md]`. The runner was therefore
built at `tools/e2e/scripts/`, where all twenty other gate scripts in
this repository already live (`docs-gate.mjs`, `health-bands.mjs`,
`lane-fence.mjs`, `token-scan.mjs`, …). Widening the fence from inside
the lane is the one repair this role may never make. **Routed:** if
`tools/gates/` is wanted, it is a move of the whole scripts directory
under a fence of its own.

### The six instances, re-measured at `146ebb6` before building

1. **Root-cwd green.** `npm run lint:docs` from the repository root
   exits **254** unpiped; through `tail -1` the shell reports **0**.
   Controls both ways: `false | tail -1` → 0, under `pipefail` → 1.
2. **Red over zero bodies** — reconstructed live, not quoted; see the
   drill table.
4. **Fail-fast truncation.** A four-target scratch crate: `cargo test`
   reported **1** `test result:` line (2 bodies); `--no-fail-fast`
   reported **4** (7 bodies). **Both runs exited 101.** The exit code
   cannot separate a 2-body answer from a 7-body one — the charter in
   one reading.
5. **Empty corpus.** `diff` of two empty files exits **0**; a dupe scan
   over nothing reports zero dupes.

3 and 6 are historical (`T-167-s8`, `T-112-s4`); taken from the card,
cited in the script header, not re-run.

### The runner caught a defect in ITSELF, and failed CLOSED

The positive control first reported **REFUSED** where **RED** was
expected. Playwright exports `FORCE_COLOR` to its children, so a nested
run's summary arrives as `ESC[32m  1 passed ESC[39m`, and a counter
anchored at `^\s*(\d+)` matched nothing: **zero bodies for a run that
executed two**. Had the runner trusted the exit code it would have said
RED and been accidentally right. Because it reads the count, it refused —
loudly, at the one moment its own parser was wrong. `stripAnsi` is the
fix; two bodies pin it, one of them proving the sanitiser cannot eat
`[T-202]` if the ESC is ever dropped from the pattern.

### And a SECOND one: the capture was not a real redirect

`runSuite` first buffered the child's two streams separately and
concatenated them — `stdout + stderr` — which puts every stderr line
after every stdout line. **cargo splits one record across both**:
`Running unittests src/lib.rs` is cargo's progress on stderr, and its
`finished in Xs` is the harness on stdout. Concatenated, the marker and
its number land in different halves of the file, and
`health-bands.mjs` reported `suite/lib-seconds` as **UNREAD** — a band
losing its authority because of how a runner captured, not because of
anything in the tree.

The fix makes the capture a **true redirect**: one file descriptor handed
to the child for both streams, which is `> file 2>&1` without a shell.
After it, the same run reads **0 unread bands** where it had 1. A body
pins the interleaving.

**Both self-caught defects failed in the same direction** — the runner
refused, or a band said UNREAD, rather than either reporting a green.
That is what a gate failing closed looks like, and it is the only reason
either was found.

### A FOURTH measurement of the companion rule, unplanned

The card records a background wrapper reporting *"exit code 0"* while the
script's own `$?` held 1, three times on 2026-08-31. **It happened again
in this lane.** The full e2e run's harness notification said *"completed
(exit code 0)"* and the captured file's own trailer reads
`[exited with code 0]` — while the script's own printed line held
`E2E_FULL_EXIT=1` and the suite's own summary read `1 failed / 396
passed`. The card routes that half upstream; this is one more datum for
the repro it asks for.

### The solo guard is a LOCK, and the argument is in the header

A declared exclusion cannot see another process; a check races. The lock
**refuses rather than waits**, because a reading taken after a wait is a
reading of the wait — that converts a contention red into a slower green
and loses the signal. It is reclaimed when its holder is gone.

### `docs/CONVENTIONS.md`: **−14 bytes**, headroom improved

147,947 → **147,933**. Warn headroom 10.00408% → **10.01259%**, inside
the 10% drift line with 20 bytes of slack (was 6). Paid for by two
corrections, not deletions:

- the card-preflight sub-bullet **cited** the METHOD EVAL GATE's account
  of why the command is not in "Build & test" and then restated the whole
  mechanism anyway; the fuller copy survives at the gate that owns it.
- *"a bare `| tee` hands you tee's status, which every gate bullet above
  forbids in as many words"* was **false at this ref**: GRAPH REGEN and
  the METHOD EVAL GATE say nothing about piping, and the BOOT GATE's only
  hit is *"this pipeline never issues"* — a release pipeline. Exactly one
  of four forbids it, and the sentence now says so.

The bullet carries no `run from <dir>/:` marker, no code fence and no
indented sub-bullet, so `workflow-parity.spec.ts` reads it as prose and
it adds no CI-parity obligation.

### Poison drills — seven, one side only, all restored

Every drill: exact-string mutation refusing on no-match, `git diff`
read back (2 changed lines each), suite run **unpiped** with `$?`
captured first, **30 bodies ran every time** (never zero — shape TEN),
then `git checkout --` with sha256 identical before and after and an
empty per-path diff.

| mutation | bodies failed |
|---|---|
| zero-body refusal, exits-ZERO half | 1 |
| cd guard's sentinel | 1 |
| shell-metacharacter (pipe) refusal | 1 |
| cargo `--no-fail-fast` rule | 1 |
| verdict missing-field refusal | 1 |
| parts-vs-baseline refusal | **2** |
| Playwright missing-baseline derivation | 1 |

**Shape SIX asked, and was answered.** Six of seven kill exactly one
body. The parts-vs-baseline mutation killed two, so a seventh drill was
cut upstream in `countPlaywright`: it kills **only** the missing-baseline
body. The two are therefore not duplicates — they pin different
derivations (a baseline that is absent, and one that is present and
disagrees) of one downstream refusal.

`gate-run.mjs` is imported by `gate-run.spec.ts` and nothing else
(census at `4531223`), so the lane's other 367 bodies cannot see any of
these mutations; the reachable suite is the whole suite here.

### What is NOT built, and is routed

- **The literal criterion 1 — *"and the document SHALL name that command
  and no other spelling"* — is met only in part.** CONVENTIONS still
  names `npm test`, `npx vitest run` and `cargo test` in the four
  per-package bullets, and it **must**: `workflow-parity.spec.ts`
  derives CI's own steps from exactly those bullets, so deleting them
  would red the lane and desynchronise `ci.yml`. Collapsing them into
  the runner needs `.github/workflows/ci.yml`, which is outside this
  fence. **Routed** — and it is the same shape the METHOD EVAL GATE
  already carries as `T-155-s1`.
- **`docs/CAPABILITIES.md` is STALE and this fence cannot fix it** —
  `T-201` exactly. Committed 29,121 bytes, fresh generation 32,327:
  **+3,206 bytes** for 30 new spec names. The integrator must run
  `npm run capabilities` in the merge commit.
