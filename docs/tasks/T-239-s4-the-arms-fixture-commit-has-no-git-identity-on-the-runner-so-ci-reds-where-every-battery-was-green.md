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

## VERDICT — APPROVED, 2026-09-08, claude-opus-5@subagent (blind verifier, phase 2)

attack set: sha256:da9fb3dc969530be16d8109a3f8b88168f90f7e80eb30f9acfef47c61a802fbb (attack-set-T-239-s4.md)
ground truth: sha256:2d5e33126a88f846fecf2321818a56fd30a36eac51f9f5ecad103f869625a302 (ground-T-239-s4.md)
ground truth: sha256:2c1f0fad0298f2e75540311be1a67d95fcb5f584bf19dcc88397d65a262729ff (ground-T-239-s4-addendum.md)
ground truth: sha256:a911e95483798d23bd99c1df7830ace36e123d9e869a6cf1b1eadb324d9f13ee (g5-T-239-s4.txt)

**FRAME.** Phase 1 was a SEPARATE SPAWN, dispatched before this one and
before any diff existed to it; its no-tool property was kept BY
INSTRUCTION and its own disclosure, because this harness cannot deny a
spawn its tools — that is a construction, not an enforced guarantee, and
it is named here rather than asserted away. I am phase 2, a fresh spawn,
and I read in this order: (1) this card AT THE BASE REF `0f6b37f`, via
`git show`; (2) the sealed attack set, digest verified before opening;
(3) the three hashed ground-truth records; (4) `docs/STATE.md`,
`docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` at the tip; (5)
`method/roles/verifier.md` in full; (6) THEN `git diff 0f6b37f..50b83d4`.
I did NOT read the executor's report — I was not given it. I did not read
`docs/ROADMAP.md`. I read the card's Implementation notes only AS PART OF
THE DIFF and treated every sentence in them as a CLAIM TO BE CHECKED, not
as evidence; every figure below is my own, re-derived at the ref it names.
I read no commit message for its argument. My verifier brief named no
executor-derived specific — no mutant number, no path count, no suite
figure — so phase 1 was not broken above the line from my side.
All work on the bench `/Users/ujju/Projects/nputer-V-T-239-s4` at
`NPUTER_E2E_PORT=25239`.

### THE CARD'S OWN POSITIVE CONTROL IS INERT, AND THE PRE-DIFF RECORD SAYS SO

Acceptance criterion 1 asks for `HOME` at an empty directory. On this host
that arming reproduces NOTHING, and the ground truth taken BEFORE the diff
existed already said so — which is the only reason this can be judged a
CARD defect rather than a convenient substitution. Re-derived by me at
`50b83d4`, in a scratch repository with no configured identity:

| arming | `git commit` |
|---|---|
| `HOME=<empty dir>` (the card's) | exit **0** |
| strict `env -u GIT_AUTHOR_* -u GIT_COMMITTER_* -u EMAIL -u GIT_CONFIG_GLOBAL -u XDG_CONFIG_HOME HOME=<empty dir>` | exit **0** |
| `GIT_CONFIG_GLOBAL=<file with [user] useConfigOnly=true> GIT_CONFIG_SYSTEM=/dev/null` | exit **128**, *"Please tell me who you are"* |

And ON THE SUITE, at the BASE commit CI had already reddened:

    HOME=<empty> npx playwright test tests/brief.spec.ts -g "file for file"   ->  exit 0, 1 passed, 0 occurrences of the banner

So criterion 1 is UNSATISFIABLE AS WRITTEN here: its premise about the
host is false. The lane substituted `user.useConfigOnly=true` — git's own
switch for *do not auto-detect* — and I judge criterion 1 met in that
STRONGER form, because the substitute reproduces the runner's exact exit
(128) and exact banner on every host rather than only on hosts whose
hostname lacks a dot. **The criterion's text is wrong and is not amended
by this lane; a reader of this card should take the table above, not the
sentence above it.**

### THE 2×2, ALL FOUR CELLS, RUN BY ME

`npx playwright test tests/brief.spec.ts` from `tools/e2e/`, whole file,
every exit read unpiped and every COUNT read:

| tree | environment | exit | count |
|---|---|---|---|
| base `0f6b37f` | ordinary | **0** | 57 passed |
| base `0f6b37f` | identity disabled | **1** | **1 failed**, 56 passed |
| tip `50b83d4` | identity disabled | **0** | 58 passed |
| tip `50b83d4` | ordinary | **0** | 58 passed |

The base red is `brief.spec.ts:3230` *THE ARM LEAVES EXACTLY WHAT THE
EIGHT HAND STEPS LEAVE, file for file*, and it is the RIGHT red: its
captured output carries `Please tell me who you are` and reports
`stopped at step 1 (stamp)` — the runner's own failure, not a cache
directory or an `os.homedir()`. **base/ORDINARY green is the cell that
breaks the degeneracy** and I ran it: the arming, not the tree, is what
flips the answer, and one arrangement does not decide both sides.

**"BOTH T-239 BODIES ARE RED AT THE BASE" IS FALSE — EXACTLY ONE IS.**
Measured, not inferred: at the base under the identity-disabled arming
the count is 1 failed / 56 passed, and the other three bodies that build
a `ritualFixture` pass. They cannot reach an identity-bearing commit —
the dry run writes nothing, the not-the-integration-checkout body is
refused before step 1, and the per-step bodies drive a stub. The lane did
NOT perturb a body to make the card's sentence true, which is the failure
I was watching for; it left every assertion standing (the only deletions
in `brief.spec.ts` are the four `FIXTURE_GIT_ENV` literals, replaced by
references to a frozen constant of identical value, and the
`ritualFixture` signature).

### THE FIFTH DOOR — WHERE THE IDENTITY ACTUALLY ENTERS

The attack I most expected was an identity smuggled to the arm through a
channel the product would not have in the field. It is not there:

- no `env:` on either `--dispatch-lane` `spawnSync` (3284, 3889, 3937 at
  the tip; options are `{ cwd, encoding, maxBuffer }` and nothing else);
  the one added `env:` in the diff is `noIdentityEnv`'s own local copy;
- no `process.env.GIT_*`/`EMAIL`/`HOME` assignment anywhere in the diff;
- no `config --global` and no `config --system` — and empirically,
  `shasum -a 256 ~/.gitconfig` is `82f73095…88cb6f7` AFTER twelve
  whole-file suite runs, byte-identical to the dispatcher's pre-diff
  canary. The developer's real config was not touched.

The identity enters through the fixture repository's OWN LOCAL CONFIG,
which is the card's first blessed branch. **Probed at runtime rather than
read off the source**: instrumenting `configureFixtureIdentity` to read
`git config --local --get` back and running the file-for-file body shows
BOTH fixtures armed —

    ROOT=…/t239-ritual-aFW3lV/one/nputer  name=[t153s9] email=[t153s9@example.invalid]
    ROOT=…/t239-ritual-79CH6v/two/nputer  name=[t153s9] email=[t153s9@example.invalid]

both keys, both fixtures, set INSIDE `ritualFixture` and BEFORE the
fixture's own `Checkpoint: fixture base` commit. No half-identity, no
one-call-site-of-two.

### CRITERION 2 HOLDS, AND IT IS NEARLY FREE — SAID PLAINLY RATHER THAN CLAIMED STRONG

`tools/e2e/scripts/dispatch-brief.mjs` is BYTE-IDENTICAL to the base:
both refs resolve the blob to `0150c268fd4ba817b0338ca8528a5bb635a06ebc`.
`grep -E 'user\.name|user\.email|GIT_AUTHOR|GIT_COMMITTER|"-c"'` over it
exits 1 — the arm injects no identity at all, conditionally or otherwise.
So the attack I was told to press hardest — an unconditional `-c
user.name=…` rewriting the author of every real dispatch stamp on a
human's checkout — is structurally impossible here, and "the plan text
and the stamp commit's author are unchanged" is true because no product
byte moved. **That is a construction, not a measurement, and the
criterion is therefore cheap rather than strongly proven.** It is also
the right trade: the rejected branch would have put a fixture's concern
into production code.

One fact the integrator should have: `inventory()` (3163) excludes
`${root}/.git/*`, so the file-for-file body does NOT compare authorship.
Commit authorship is guarded ONLY by the new body's `%an <%ae>`
assertion, on the fixture — nothing tests the author of a real dispatch
stamp, and nothing needs to while the arm is byte-identical.

### THE DRILL — JUDGED BY CONTAINMENT, EVERY LANDING READ FROM `git diff`

Eight mutations, each applied, its landing read back from `git diff
--unified=0`, run over the WHOLE file, then reverted to an empty
`git status --porcelain`. Each kill is recorded WITH ITS ARMING.

| # | mutation | arming | exit | kill set |
|---|---|---|---|---|
| M1 | repo config `user.email` value → `""` (DATA) | ordinary | 1 | {3463 new body} |
| M1 | same | identity disabled | 1 | {3463 new body} |
| M2 | repo config `user.name` call DELETED (DATA) | ordinary | 1 | {3462 new body} |
| M5 | repo config identity → `zz9`, env untouched (DATA) | ordinary | 1 | {3463 new body} |
| M8 | `noIdentityEnv` writes an EMPTY global config (the CONTROL'S OWN ARMING) | ordinary | 1 | {3463 new body} |
| M3 | `GIT_COMMITTER_EMAIL` dropped from `FIXTURE_GIT_ENV` | ordinary | 0 | {} SURVIVED |
| M3 | same | identity disabled | 1 | {2315, 2380, 2856, 3462} |
| M7 | arm: `io.write(plan.cardFile, stamped.text + "\n")` (CODE, unrelated to identity) | identity disabled | 1 | {3272 file-for-file} |
| M6 | arm: step-1 pathspec `plan.card` → `"."` (CODE, unrelated to identity) | identity disabled | 0 | {} SURVIVED |

**CONTAINMENT: NEITHER KILL SET CONTAINS THE OTHER, so both bodies are
load-bearing and the new one is not a restatement.** M1/M2/M5 kill the
new body and leave the file-for-file body GREEN under the ordinary
environment — because on this host git auto-detects, which is precisely
the asymmetry the new body exists to remove. M7 kills the file-for-file
body and leaves the new body green. That is the disjointness, measured in
both directions rather than counted.

**THE THIRD PROOF — SOMETHING DIED AT THE SITE THE PROPERTY LIVES.** The
property this card adds lives in DATA: two config VALUES written into a
fixture repository. M1, M2 and M5 are DATA mutants landing exactly on
those two lines (landings quoted from `git diff`), and all three die. A
code-only drill would have mis-graded this by construction (T-221); it
was not one.

**THE CONTROL WAS SHOWN FAILING BEFORE I TRUSTED IT PASSING.** M8 removes
`useConfigOnly` from the arming the new body builds for itself, leaving
the subject untouched; the body reds, and reds for the RIGHT reason —
*"the borrowed environment did not disable git's identity at all"* at
line 3501. So the green in the tip cells is not satisfiable by an
environment that disabled nothing. And the arrangement is NOT degenerate:
the arming (`noIdentityEnv`) and the property (`configureFixtureIdentity`)
are two separate acts, and the control and the subject differ in exactly
one of them — the T-203 shape, where one act decides both sides, is
absent. The body also asserts the guard's STATE (`user.email` unset on
the control repository) before it exercises anything, per CONVENTIONS'
LIFTING A SAFETY GUARD bullet, and builds its control WITH THE PRODUCER
(`ritualFixture(name, { identity: false })`) rather than writing one to
look similar, per A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.

**THE TWO SURVIVORS, ATTRIBUTED RATHER THAN EXCUSED.** M3 under the
ordinary environment survives because MY OWN `~/.gitconfig` supplies the
fallback — under the identity-disabled arming the same mutant kills FOUR
bodies, so the `FIXTURE_GIT_ENV` channel is still load-bearing and this
diff does not mask it. M6 survives because it is an EQUIVALENT MUTANT:
the ritual fixture's only dirty path at step 1 IS the card, so `-- <card>`
and `-- .` commit the same tree. That is a real coverage hole in the arm's
pathspec, it is PRE-EXISTING and outside this card, and I have filed it as
`T-239-s6` (`status: suggested`) rather than put it in this verdict.

### SECURITY SWEEP (step 3) — NO FINDINGS

- **Secrets/PII**: the only identity added to code is
  `t153s9@example.invalid`, matching the module's existing convention and
  RFC-reserved. `ujju <ujju@Mac.lan>` appears in PROSE in this card and in
  `T-239-s5` as the measured output of git's auto-detection — a
  non-routable local `user@hostname`, not the user's address and not in a
  fixture. Cleared.
- **Config injection**: the card's second branch would have made `-c
  <key>=<value>` an injection point (`core.pager`, `core.sshCommand`,
  `include.path`). That branch was NOT taken; there is no `-c` in the
  diff's code and none in `dispatch-brief.mjs`. The two values written are
  frozen literals (`Object.freeze`), never interpolated from `plan.*` or
  card text. Cleared.
- **Unsafe default**: the arming file is written under the fixture's own
  `mkdtemp` directory (`path.join(dir, "gitconfig-no-identity")`), not a
  fixed world-writable `/tmp` path — no symlink surface, no cross-run
  collision. `HOME` is never clobbered. Cleared.
- **Destructive default**: no `rm -rf` added; teardown is the existing
  `removeGitFixture`. Cleared.
- **Dependencies**: no manifest or lockfile in the diff. Cleared.

### STEP 4 — ARCHITECTURE AND CONVENTIONS

No interface moved: the change is test-only plus a byte-identical
product file, and `tools/e2e/` is its own component. CONVENTIONS' git
gotchas hold — the default branch stays pinned (`init
--initial-branch=main`, inherited unchanged by the new body's fixture),
and the borrowed-environment bullet's `HOME` warning is respected and
cited. Scope is three files: this card, the new spec body, and one
`status: suggested` sibling — `docs/tasks` is `alwaysWritable` under
`lane-fence.mjs` (`parser.UNFENCEABLE_PATHS`) and filing a suggestion is
`method/roles/executor.md` step 5, so the third file is inside the rules,
not a fence widening.

### GATES AT THE LANE TIP `50b83d4`

    npm run typecheck        (tools/e2e)   exit 0
    npm run lint:tokens                    exit 0   TOKEN 175 files, CONTROL 1218 tracked text files, clean
    npm run lint:tokens -- --selftest      exit 0   65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor
    npm run lint:docs                      exit 0   whole-tree half, 0 findings
    npm run capabilities:check             exit 1   STALE — committed 55273 bytes, fresh 55375

**The census red is CORRECT AND OWED TO THE INTEGRATOR, not a lane
defect.** I regenerated into the worktree and read the delta: it is
EXACTLY the one new body — census 652 → 653, one added line naming *THE
RITUAL FIXTURE CARRIES ITS OWN GIT IDENTITY…* — and nothing else moved. I
restored the file. `docs/CAPABILITIES.md` is read-only inside a lane's
fence (T-210) and CONVENTIONS assigns the regeneration to the
INTEGRATOR'S MERGE COMMIT; **that obligation now covers TWO added test
names if any lane lands beside this one, and the integrator owes `npm run
capabilities` before the checkpoint.**

### VERDICT

**APPROVED.** The card's blessed branch was chosen on a measurement I
independently reproduced, the product file is byte-identical so criterion
2 cannot have been broken, the new body is load-bearing by containment in
both directions, three DATA mutants die at the site the property lives,
the control was demonstrated failing where its arming was absent, the
security sweep is clean, and the one criterion that is not met literally
is not met because the CARD IS WRONG ABOUT THIS HOST — which the hashed,
pre-diff ground truth establishes independently of anything the lane did.

Filed as suggestions, blocking nothing: `T-239-s6` (the arm's step-1
pathspec cannot be poisoned by any fixture state that exists).

Figures above are derived at `0f6b37f` and `50b83d4` as each row names.
This verdict is itself a commit on top of `50b83d4`; the gates it could
move are re-run at that tip and recorded in the handoff.
