---
id: T-202
title: ONE BLESSED GATE-RUNNER — an exit code is a summary, and a summary of nothing is indistinguishable from a summary of success; four seats proved that in one night from four directions
feature: F-06
milestone: 4
priority: 1
size: M
status: planned
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
