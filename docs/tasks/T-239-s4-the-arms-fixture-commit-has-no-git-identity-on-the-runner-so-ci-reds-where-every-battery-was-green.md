---
id: T-239-s4
title: The arm's step-1 commit runs with no git identity on the CI runner, so the file-for-file body reds on CI where twenty-eight local batteries were green — main is red on CI at 9646618
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: the architect seat, from CI run 33672240360's own log, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/dispatch-brief.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding, verbatim from the runner

CI run 33672240360 on 9646618 (the push that landed T-239) failed one
body: brief.spec.ts:3230 *THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND
STEPS LEAVE, file for file*. The arm's dispatch reported *"the dispatch
stopped at step 1 (stamp) — … It ran: git -C /tmp/t239-ritual-…/one/nputer
commit … *** Please tell me who you are."* The runner has no global git
identity; every seat's machine does, which is why the body was green in
the lane, on the bench, and in every battery since. The T-238-s2 class
(room item 20): a property of the host that CI alone measures.

## What is asked

The fixture the two T-239 bodies build SHALL configure a git identity in
the fixture repositories it creates (user.name and user.email in the
repository's own config, as git-fixture.ts's helper does), OR the arm's
step-1 commit SHALL pass an explicit identity for a repository whose
config has none and say so in its plan; the card decides which after
measuring which of the two the hand ritual's own commit in the body uses.
The body SHALL then be run with HOME pointed at an empty directory (no
global config) as its positive control, so the runner's condition is
reproduced locally before the fix and green after it.

## Acceptance criteria

- With HOME set to an empty directory, both T-239 bodies are red at the
  base and green at the tip.
- The arm's dispatch on a real checkout with an identity is unchanged
  (the plan text and the stamp commit's author).
- Existing brief.spec.ts bodies green; kill sets disjoint.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, main RED on CI

The architect seat. The user's standing instruction is no new dispatch,
so this waits at the head of the queue; main is red on CI until it
lands. Nothing else in the run failed (651 of 652 bodies green).

## Implementation notes (executor, 2026-09-08, at `a0a8385`)

### The ruling the card left open, and the measurement behind it

The card asks the executor to choose between fixing the FIXTURE and
fixing the ARM, *"after measuring which of the two the hand ritual's own
commit in the body uses."* **Measured**: the hand ritual's step-1 commit
is `fixtureGit(hand.root, ["commit", …])`, and `fixtureGit` passes
`FIXTURE_GIT_ENV` — `GIT_AUTHOR_NAME/EMAIL` and `GIT_COMMITTER_NAME/EMAIL`
as ENVIRONMENT VARIABLES. It uses neither the repository's config nor an
explicit `-c` identity: the identity is supplied by the TEST HARNESS.

**So the fix is the FIXTURE'S**, and the arm is untouched. The arm is
re-entered as a spawned `node` process, which inherits `process.env` and
not `FIXTURE_GIT_ENV`, so the one channel that reaches both this process
and that subprocess is the fixture repository's OWN config. Writing it
there makes the two sides symmetric — each gets its identity from the
fixture — and leaves acceptance criterion 2 true BY CONSTRUCTION rather
than by measurement: no byte of `dispatch-brief.mjs` moved, so neither
the plan text nor the stamp commit's author on a real checkout can have.

The rejected alternative is worth naming. Having the arm pass an explicit
identity *"for a repository whose config has none"* would put a fixture's
concern into production code and, in the one case it fires — a seat that
forgot to configure git — would author a real dispatch stamp under a
synthetic name instead of refusing. The arm's current behaviour there is
correct: it stops at step 1, names the step, the command and the exit,
and unwinds. That is the ritual working.

The card's parenthetical *"as git-fixture.ts's helper does"* is wrong:
`tools/e2e/tests/git-fixture.ts` sets no identity at all — it carries
`NO_BACKGROUND_MAINTENANCE` and `removeGitFixture` and nothing else. The
house pattern the fix actually follows is `gate-run.spec.ts:784`,
`landing-gate.spec.ts:115`, `push-checks.spec.ts:79`,
`push-guard.spec.ts:470`, `checkout-currency.spec.ts:207` and
`app/src-tauri/src/churn.rs:1041`, every one of which writes `user.name`
and `user.email` into the fixture repository's own config.

### THE CARD'S PRESCRIBED POSITIVE CONTROL IS INERT ON THIS HOST

`HOME` pointed at an empty directory does **not** reproduce the runner
here, and neither does `docs/CONVENTIONS.md`'s published borrowed-git
recipe. Measured at `0f6b37f34665` on Mac.lan, 2026-09-08, in a scratch
repository with no configured identity:

| environment | `git commit` |
|---|---|
| `HOME=<an empty directory>` | exit **0** |
| `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` | exit **0**, author `ujju <ujju@Mac.lan>` |
| a `GIT_CONFIG_GLOBAL` file carrying `[user] useConfigOnly = true` | exit **128**, *"Please tell me who you are"* |

With no configured identity git AUTO-DETECTS one from `getpwuid` and the
hostname and refuses only when it judges the result bogus — and whether
it so judges is a property of the HOST. This machine answers to `Mac.lan`;
git reads the dot as a domain and commits. A runner's hostname carries
none and git refuses. `user.useConfigOnly=true` is git's own switch for
*do not auto-detect*, so it produces the runner's ANSWER on every host.
**`HOME` is deliberately never clobbered** — Playwright caches its
browsers under `~/`, and CONVENTIONS' own bullet records the 54 red
bodies that mistake cost.

The substitution is recorded rather than assumed, and the criterion is
met in the stronger form: the same body, the same banner and the same
exit 128 as CI run 33672240360, reproduced locally.

### The measurements

`npx playwright test tests/brief.spec.ts` from `tools/e2e/`, `NPUTER_E2E_PORT=15239`:

| tree | environment | exit | count |
|---|---|---|---|
| base `0f6b37f` | ordinary | 0 | 57 passed |
| base `0f6b37f` | identity disabled | **1** | **1 failed**, 56 passed |
| tip `a0a8385` | identity disabled | 0 | **58 passed** |
| tip `a0a8385` | ordinary | 0 | 58 passed |

The one red at the base is `brief.spec.ts:3230` *THE ARM LEAVES EXACTLY
WHAT THE EIGHT HAND STEPS LEAVE, file for file* — the body CI failed, and
the only one. **The card says "both T-239 bodies" are red at the base;
exactly ONE is.** The other three bodies that build a `ritualFixture`
cannot reach a commit: the dry run writes nothing, the
not-the-integration-checkout body is refused before step 1, and the eight
per-step bodies drive a pure stub that starts no process at all.

### The new body, and why the fixture change alone was not enough

A fixture change on its own is invisible to every gate this repository
has: deleting the two `git config` lines again would be green on every
developer machine and red only on CI — the exact regression this card
exists to close. `THE RITUAL FIXTURE CARRIES ITS OWN GIT IDENTITY, so a
git that inherits none can still commit in it` is the keeper, and it is
the one body in the file that answers the same way on a developer machine
and on a runner.

Its POSITIVE CONTROL is built by the producer with the step withheld
(`ritualFixture(name, { identity: false })`), is run FIRST, and is
required to fail with the runner's own banner before the subject is
allowed to pass — so a green cannot be satisfied by an environment that
disabled nothing. The guard's STATE is asserted before anything is
exercised (`git config --get user.email` must exit non-zero on the
control repository), per CONVENTIONS' LIFTING A SAFETY GUARD bullet.

### POISON DRILL — 5 mutants, 5 kills, each attributed by name

Drilled at `a0a8385`, one side only, each mutation read back with
`git diff` before its run.

| # | mutation (code under test) | killed by | count |
|---|---|---|---|
| A | the two `git config` lines dropped from `configureFixtureIdentity` | the `user.name` config assertion | **1 body**, ordinary env |
| B | `noIdentityEnv` writes an empty global config instead of `useConfigOnly` | *"the borrowed environment did not disable git's identity at all"* | 1 body |
| C | `configureFixtureIdentity` writes a different `user.email` | the `user.email` config assertion | 1 body |
| D | the probe smuggles `-c user.name/-c user.email` of its own | the control's non-zero-exit assertion | 1 body |
| E | the probe passes `--author "someone <…>"` | *"the commit was authored by somebody other than the fixture's own identity"* | 1 body |

**Mutant A is also the shape-six answer**: it is a mutation of the code
under test that this body kills, and under the ORDINARY environment the
whole-file failing-body count is **exactly ONE** — the file-for-file body
stays green on this machine because git auto-detects, which is precisely
why the new body is not a duplicate of it.

Restored with `git restore --source=HEAD --staged --worktree`. **PROOF**:
`shasum -a 256` of the worktree file and of `git show HEAD:<path>` both
`8b8d008c92dbe12f334dcbbf9f31d8314b82924fd970e734faf2513a032da173`, and
`git status --porcelain` empty.

### THE CLASS AND ITS SWEEP

**The class**: a fixture repository in which a git process the spec does
not run itself — a spawned subprocess — makes a commit, while the
identity is supplied only through THIS process's environment.

**The sweep**, at `a0a8385`: `git grep -l "GIT_AUTHOR_NAME" -- tools/
app/ lib/` names three files. `tools/e2e/tests/git-fixture.spec.ts`
passes its `PROBE_ENV` to every git call it makes and spawns no other
program that commits — not an instance.
`tools/e2e/tests/session-economics.spec.ts:244` spawns `brief.mjs
--task`, which is a READ and commits nothing — not an instance.
`tools/e2e/tests/brief.spec.ts` is the instance, and it is this card.
**One instance, fixed; no sibling.**

**The sweep is shown capable of answering otherwise**: its discriminating
column moves across this very fix. At the base `0f6b37f` all three files
carried ZERO `user.email` lines; at `a0a8385` `brief.spec.ts` carries
four and the other two still carry none.

### For the verifier

- `dispatch-brief.mjs` is UNTOUCHED. Criterion 2 holds by construction,
  and the diff is the place to check it.
- The card's own prescribed control (`HOME` → empty directory) is inert
  on any host whose hostname carries a dot; the table above is the
  measurement, and `noIdentityEnv`'s comment carries the mechanism.
- **The census is STALE**: this lane ADDS a test body, and
  `docs/CAPABILITIES.md` is read-only inside a fence (T-210). `npm run
  capabilities` is owed IN THE MERGE COMMIT, by the integrator.
- `T-239-s5` is filed for CONVENTIONS' borrowed-git-environment bullet,
  which this lane's fence cannot reach.
