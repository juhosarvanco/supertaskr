---
id: T-153-s9
title: A pull_request checkout has no local `main`, so twenty-nine bodies red on the ONE instrument a lane is given to run CI with — the derivations resolve the integration branch by bare name and the event type decides whether that name exists
feature: F-01
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

## The measurement — two runs, one repository, one difference

| run | event | checkout | e2e lane |
|---|---|---|---|
| 33260414204 | `push` to main | the `main` branch | 4 failed / 254 passed |
| 33264083542 | `pull_request` (PR #3, this lane) | detached at the PR merge ref | **31** failed / 250 passed |

Twenty-nine of that difference are ONE cause, and every one of the
twenty-nine is **green in run 33260414204 at the same body index**:

    fatal: ambiguous argument 'main': unknown revision or path not in
    the working tree.

thrown out of `git log --first-parent --format=%H %s main`.

The bodies: `brief.spec.ts` at :255, :291, :313, :630, :656, :679, :706
(seven); `card-figures.spec.ts` at :121, :132, :144, :157, :173, :187,
:198, :213, :226, :264, :276, :291, :316, :331, :347, :384, :398, :409,
:425, :431, :438 (twenty-one); `dispatch-order.spec.ts` at :200 (one).
The remaining two are `T-153-s6`'s and are a different card.

## The mechanism

`tools/e2e/scripts/dispatch-brief.mjs` derives `integrationBranch` from
`docs/CONVENTIONS.md`'s lane bullet — correctly, that is where the
project's spellings live — and then spends it as a BARE REVISION:
`git log --first-parent --format=%H %s ${s.integrationBranch}`.
`card-figures.mjs` spends the same spelling the same way for its
`history <branch> first-parent commits` figure.

`actions/checkout` on a `pull_request` event leaves the workspace at a
DETACHED merge ref and creates no local branch, so the name `main` — a
local branch on a push-to-main runner and in every developer checkout —
resolves to nothing. The spelling is right and the RESOLUTION is
event-dependent, which is why no local run and no push run has ever seen
it.

**IT IS NOT A LINUX DIVERGENCE**, and that matters for how it gets
triaged: the same PR checkout on macOS would throw identically. It sits
beside `T-153-s2`, `T-153-s5` and `T-153-s6` only because CI's first
contact is where all four became visible.

## Why it is worth a card rather than a shrug

**The lane's ONE sanctioned way to run CI is a draft PR.** `ci.yml`
triggers on `push` to `main`, on `pull_request`, and on
`workflow_dispatch`; a lane may not push main, so a PR is the instrument
a dispatch brief hands an executor. That instrument currently
manufactures twenty-nine reds that the merge will not reproduce — and a
lane reported as reddening trees it never opened is the failure
`docs/CONVENTIONS.md`'s RANGE RULE calls *the worse of the two*, arriving
through CI instead of through a diff. Any lane that reads the run's
COLOUR rather than its per-body results now draws the wrong conclusion,
and the next one will not have this card's list to check against.

## What it would take

Resolve the integration ref rather than assuming it: take the first of
`main`, `origin/main`, `refs/remotes/origin/main` that
`git rev-parse --verify` accepts, at the one place the spelling is spent.
Two call sites today (`dispatch-brief.mjs`, `card-figures.mjs`), which
argues for ONE resolver rather than two fixes (T-057). Where none
resolves, the derivation should reach its own COULD-NOT-RUN code rather
than throwing an exec error through a body — the four-code discipline the
rest of this tooling already keeps.

**A POSITIVE CONTROL IS OWED AND IS CHEAP HERE**, because the fix is a
fallback and a fallback that never fires is indistinguishable from one
that is wrong: exercise the resolver against a checkout where `main` does
NOT resolve, not only against one where it does.

**FENCE.** `tools/e2e` — the same fence `T-153-s5` held. It is routed
rather than built because it is not that card's subject: the criteria
there are the clock-restore guard's, and a lane widening its own subject
is the class this project refuses even when the paths happen to line up.

## Implementation notes

Lane `task/T-153-s9-pr-checkout-main`, worktree
`/Users/ujju/Projects/nputer-T-153-s9`, base `a533a4d020cd`. Every figure
below is stamped with the ref or the reading time it was taken at.

### What changed

ONE resolver, at the ONE place the integration branch is spent as a
revision. `resolveIntegrationRef(root, branch)` in
`tools/e2e/scripts/dispatch-brief.mjs` asks `git rev-parse --verify
--quiet <candidate>^{commit}` for the first of `main`, `origin/main`,
`refs/remotes/origin/main` that resolves, and `context()` spends the
answer instead of the name. Three consequences, each deliberate:

- **The bare name is asked for FIRST, and that ordering is the whole
  safety property.** On a checkout that holds the local branch — every
  developer tree, every push-event runner — the first candidate resolves
  and this module spends exactly the revision it always spent. Nothing
  the derivations prove there is weakened. A remote-tracking ref can sit
  at a different commit from the local branch of the same name, so
  preferring it would answer a question about THIS checkout with a fact
  about the remote.
- **Where no candidate resolves it refuses by name**, and the wrapper
  turns that throw into the house's `CANNOT_RUN` (3) — the four-code
  discipline the card asks for. It will not substitute `HEAD`: doing so
  would hand a dispatcher a base commit off the lane's own branch, which
  lane-protocol rule 2 wants as a hash precisely because a wrong one is
  invisible.
- **The brief says which ref it spent.** Row 4 now emits `integration ref
  this checkout resolves: <rev>` as a LIVE fact beside the tree-stamped
  `integration branch: <name>` from CONVENTIONS, and every provenance
  taken off that branch names the command that actually ran. A
  provenance naming a revision the checkout does not hold is a
  provenance nobody can re-run.

`card-figures.mjs`'s `history` deriver splits the other way round on
purpose: the figure's TEXT keeps the project's branch NAME (a `card:`
stamp is verified character for character, so a text that moved with the
event type would go STALE on a PR run and VERIFIED on a push run — one
figure with two answers), while its provenance names the resolved ref.

### Where the card is wrong, and where the brief was

- **"Two call sites today (`dispatch-brief.mjs`, `card-figures.mjs`)" is
  wrong, and the card's own remedy is righter than its diagnosis.** There
  is ONE site that spends the spelling as a REVISION —
  `context()`'s `integrationLog` read. `card-figures.mjs` never runs a
  git command with it: it consumes `ctx.integrationLog`, already read,
  and spends the spelling only as a provenance LABEL. So the card's
  "which argues for ONE resolver rather than two fixes (T-057)" landed on
  the right shape for the wrong reason — there was one fix to make, not
  two.
  **THE CLASS AND ITS SWEEP.** The class is *a git revision spelled as a
  bare local branch name*. Swept over an extraction of `tools/e2e/` at
  `a533a4d020cd` for `git(` / `execFileSync("git"` / `spawnSync("git"`:
  **53 invocation sites, 31 in `scripts/` and 22 in `tests/`**, and
  exactly ONE of them spends a branch NAME as a revision —
  `dispatch-brief.mjs:1784`, the one fixed. The rest spend `HEAD`, hashes
  read out of documents, or no revision at all (`ls-files`, `worktree
  list`, `status`, `init`). The sweep is shown capable of finding
  something before its one-hit answer is written down: run against the
  base tree it names that site by line.
- The dispatch brief's ROW 4 named base `f63f8a0dc0c1`; this lane was cut
  at `a533a4d020cd`, two dispatch commits later, exactly as the
  orchestrator's brief said. No contradiction, recorded because the two
  hashes differ.

### A red this lane inherited, repaired in fence

`brief.spec.ts`'s "a figure read from the MOVING integration ref is a
LIVE fact" states the rule *every line whose SOURCE names the integration
branch carries a clock*, and matched it with `\bmain\b` against the
provenance. A hyphen is a word boundary, so that pattern fires inside
this card's own file name —
`T-153-s9-a-pull-request-checkout-has-no-local-main-so-…md` — and any
live lane whose card SLUG carries the branch's name reddens the body with
a card-file provenance that is a tree fact and is correctly stamped as
one.

**Measured at `a533a4d020cd` against the UNCHANGED module**, driven
through a copy of the base scripts pointed at this worktree: 5 matching
lines, **2 violations**, both this lane's own `T-153-s9 touches:` and
`T-153-s9 board status:` lines. So the red pre-dates every line of this
diff and would have appeared in this lane's PR run as a thirtieth
failure. It is repaired here rather than routed because it is inside the
fence, it is the same class as the card's own subject (a name matched
too loosely), and the lane cannot show the 29 green while it stands. The
match is now on a revision TOKEN — preceded by a space or a slash,
followed by a space, a comma or the end — and the lines the narrowing
drops are asserted to be tree facts, so nothing hides in the difference
between the two patterns.

### The drill — 8 mutants, one side each, all killed

Every mutant moves the PRODUCER, never an assertion; each was applied at
commit `f6dceca` / `a0e7a66` (work committed FIRST, so a restore cannot
tell itself from a revert), run against `tests/brief.spec.ts`, and
restored.

| # | mutant | what died |
|---|---|---|
| 1 | `context()` spends `spellings.integrationBranch` again (the defect) | the whole-brief body, on the PR shape, with the card's own `ambiguous argument 'main'` — the resolver body SURVIVED, which is the point of having both |
| 2 | candidate order reversed (`origin/main` first) | the resolver body: expected `main`, received `origin/main` |
| 3 | returns `{rev: "HEAD"}` instead of throwing | both bodies — "received function did not throw", and the refusal's three assertions |
| 4 | the resolved-ref line reworded | the whole-brief body's honesty assertion |
| 5 | `base commit` stamped `tree()` instead of `live()` | the MOVING-ref body's tightened loop |
| 6 | a card-file provenance stamped `live()` | the MOVING-ref body's NEW dropped-class assertion, by its own message — the narrowing is not vacuous |
| 7 | `card-figures` provenance back to the branch spelling | the whole-brief body's card-ledger half |
| 8 | `card-figures` figure TEXT moved to the resolved ref | the same half, on the text side |

Restoration proof, after each: `shasum -a 256` back to
`f13ac1a2c95c251d7d3574551dc74082c3d209d24e9a3b3bb1af49730a0a393a`
(dispatch-brief.mjs), `eed3d1df54a2c1ef11f2052bde7ec3d6e66d7c558469e6c349835654da44324e`
(card-figures.mjs), `21307d9d50bcd65072663ab9900126acee4ce6d4d24e982564b854f64e9823a7`
(brief.spec.ts), and `git status --porcelain` empty over the three.

### The positive control the card asked for, and the two-sided proof

The card is explicit that a fallback which never fires is
indistinguishable from one that is wrong. The fixture builds three
checkout SHAPES out of this repository's own tracked tree (`git archive
HEAD | tar -x`, then `git init`, two `Checkpoint:` commits, and two
clones):

- **local** — holds the branch. The resolver answers `main`, and the
  command's output says so. This is the guard clause: the bare name still
  wins wherever it exists.
- **detached** — cloned, detached, local branch deleted. What survives is
  exactly what `actions/checkout` leaves on a `pull_request`: a
  remote-tracking ref and no local name. The pre-condition (`rev-parse
  --verify main` non-zero) is asserted BEFORE the fallback is believed,
  so "the fallback fired" cannot be satisfied by a tree that held the
  name all along. The resolver answers `origin/main` at the same commit.
- **orphan** — same, plus `git remote remove origin`. No candidate
  resolves; the command exits 3, names all three spellings it asked for,
  and prints no base commit. `ambiguous argument` appears in neither
  shape's stderr, which is the difference between a verdict and an exec
  error arriving through a body.

Nothing skips on either event type. Both new bodies run identically on a
push checkout and on a PR checkout, because the shapes they drive are
BUILT rather than inherited from the runner.

### The CI proof — read per body, never by colour

The instrument is draft PR #5 on `task/T-153-s9-pr-checkout-main`. Every
verdict below is scored by BODY NAME out of the run's own log, because
the line numbers in the card's enumeration moved with this diff and a
colour says nothing about which body.

**Cycle 1 — run `33275876129`, event `pull_request`, head `cbaa33f5d803`
(the merge of `a0e7a66` into `f63f8a0`), 283 tests, 282 passed / 1
failed.** Of the card's twenty-nine: **28 PASS, 1 FAIL** — and the one is
not the card's cause. Every step before the e2e lane passed on this
`pull_request` checkout, including `graph currency (index --check)` and
the whole-tree `docs gate`.

- The seven `brief.spec.ts` bodies: all pass except *"a figure read from
  the MOVING integration ref is a LIVE fact"*.
- All twenty-one `card-figures.spec.ts` bodies: PASS.
- `dispatch-order.spec.ts`'s *"--dispatch runs on the live repository"*:
  PASS.
- The two bodies this card adds: PASS on the PR checkout.

**The one that remains, and it is a SECOND defect the fix uncovered
rather than the card's.** Pre-fix, that body died inside `git()` with
`fatal: ambiguous argument 'main'` (measured on the T-153-s6 PR run
`33272976860`, same body, same message). Post-fix it gets past the read
and fails a PRECONDITION: *"main carries only one Checkpoint here, so a
second read cannot be built out of it"*. That is the body's own setup —
it builds its second read by dropping the newest `Checkpoint:` and needs
another below it — and it says the runner's first-parent log of the
resolved ref carries only one.

**IT DOES NOT REPRODUCE OFF THE RUNNER'S REF STATE.** The state was
rebuilt exactly: a fresh clone of the remote, `checkout --detach
refs/remotes/pull/5/merge`, local `main` deleted — the same HEAD
`cbaa33f5d803`, the same `refs/remotes/origin/*` set, `main` verified
NOT to resolve. Run there, through that clone's own copy of these
scripts: `integrationRef origin/main`, **481 first-parent lines, 123
Checkpoints, newest at index 0** — the precondition holds and the body
passes. So the runner saw a different log than its ref state implies,
and nothing in this diff explains it. The precondition now DISCLOSES
what it saw — the branch, the ref it resolved to, the line count, the
Checkpoint count, the index and the head line — so the next run answers
the question instead of posing it. Routed as `T-153-s14` with the three
readings that remain open and the measurement that rules none of them
out; it is NOT closed here, and this card does not claim it is.

**Cycle 2 — run `33277133108`, head `3f374a0` — never reached the e2e
lane, and what stopped it is a repository-wide CI blocker.** It died at
step 19, `install cargo-audit`, with `error: binary cargo-audit already
exists in destination`, and skipped eight steps behind it. The cause is
the cargo cache: cycle 1 MISSED the key `cargo-Linux-740f9629d9d8…`,
installed cargo-audit into `~/.cargo/bin`, and saved that binary into the
cache; cycle 2 HIT the same key, restored the binary, and `cargo install`
refused to overwrite it. The key carries no event and no ref, so **a push
to main hits it exactly as a pull_request does** — every run on this
`Cargo.lock` now stops before its suites. Filed as `T-153-s13` against
`.github/workflows/`, outside this fence.

**CYCLE 3 WAS NOT SPENT, AND THE REASON IS THAT IT COULD NOT MEASURE
ANYTHING.** With the cache poisoned, a third run dies at the same step
before the e2e lane and produces no verdict about any body. The cap is
2 of 3 used. Deleting the cache entry would buy exactly one run and
would re-poison itself on that run's own save, so it is a repository
administration call for the integrator rather than a lane's to make.

### Routed, not built

- **`docs/CAPABILITIES.md` is two behaviours behind.** It is generated
  from the e2e spec names and was `CURRENT (21992 bytes)` at
  `a533a4d020cd`; this diff adds two spec bodies, so it now needs `npm
  run capabilities` from `tools/e2e/`. That file is under `docs/`,
  outside this lane's `touches: [tools/e2e]` fence, so it is NOT written
  here — it is owed at the merge, and it is one command. No new card:
  `T-153-s8` already holds the class (the census can go stale and no
  gate can say so), and this is one more instance of it, not a second
  finding.
- **`T-153-s13`** — `install cargo-audit` fails on every run that
  restores the cache the previous run populated. Fence
  `.github/workflows/`. Found by this card's cycle 2; it blocks the whole
  repository's CI, main pushes included, and it is the reason cycle 3 was
  not spent.
- **`T-153-s14`** — the one body of the twenty-nine still red on a
  `pull_request` checkout, for a cause this card's mechanism does not
  explain and the runner's own ref state does not reproduce. Fence
  `tools/e2e`, blocked on `T-153-s13` because a `pull_request` run is
  what answers it and no such run can currently reach the e2e lane.

### The ceremony row, and a divergence recorded rather than decided

`tasks/TASK-FORMAT.md`'s table gives two rows at size S, and the boundary
is read off `touches:` under its own rule of thumb — *docs, method and
tooling self-integrate; anything a user could run does not*. This diff is
`tools/e2e` plus `docs/tasks`, which is tooling, so the table's row is **S,
diff outside shipped code: no verifier, and the executor is its own
integrator**. Under `roles/executor.md` step 6 that row's exit stamp
would be `done`, and the executor would merge and checkpoint its own work.

**This lane stamped `verifying` and merged nothing**, because its
dispatch brief named a separate integrator, withheld the merge, and asked
for a report addressed to that seat. The two do not agree, and this note
is the record rather than the resolution: `verifying` is the
under-claiming half of the disagreement — reversible by whoever
integrates, and wrong only in costing one stamp — while `done` on an
unmerged branch would assert something no tree carries. The seat that
merges owns the flip.

## Verdicts

2026-08-30 — verifier claude-opus-5@subagent (independent hand, two-phase
blind: the card was read at its BASE ref `a533a4d` down to *What it would
take*, and the code diff read, before the notes or any executor text):
**APPROVED WITH ONE ASSIGNED CORRECTION.** The mechanism is right, the
safety property is proven rather than argued, the three checkout shapes
reproduce on fixtures this seat built from scratch, and the sweep's
one-site answer is independently confirmed. The correction is to the
NARROWED regex's accounting claim, which this seat measured false. Three
further findings are routed as cards and none of them blocks. Every
figure below is this seat's own, at the ref named beside it.

### The owed battery — lane worktree, tip `960555d`, exits unpiped

| command | from | exit | figures |
|---|---|---|---|
| `npm run typecheck` | tools/e2e | **0** | — |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | — |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 151 files, CONTROL 869 tracked text files |
| `npm run lint:docs` | tools/e2e | **0** | 22 derived readers across 4 suites, 0 frontmatter issues, 4 budgets held |
| `npm test` (`NPUTER_E2E_PORT=14533`) | tools/e2e | **0** | **283 passed**, 2.8m |
| `npx vitest run` | lib/parser | **0** | **314 passed** / 15 files |
| `npm run build` | lib/parser | **0** | — |
| `npm run build` | app | **0** | — |
| `npm test` | app | **0** | **1013 passed** / 47 files |
| `npm run capabilities:check` | tools/e2e | **1** | STALE, committed 21992 to fresh 22190 bytes |

`lsof -nP -iTCP:14533 -sTCP:LISTEN` returned zero rows immediately before
the lane bound it. **The capabilities staleness is EXACTLY the two new
behaviours and nothing else** — regenerated, diffed, restored: two spec
sentences added under `## brief` and the census line 281 to 283, `3
insertions / 1 deletion`, no other hunk. `docs/CAPABILITIES.md` restored,
`shasum -a 256` back to
`fe5fac7d220b7f5aa8004a5df0fb18a38da8234abf54eb00b5dae6435b920437` with
`git status --porcelain` empty. This is `T-153-s8`'s class and the
integrator's regen; the executor's routing of it is correct.

**No cargo was run and none is owed to this seat**, derivation confirmed
rather than accepted: GRAPH REGEN's trigger DOES fire (`brief.spec.ts` is
a `.ts` outside `docs/`), and `.nputerignore` at `960555d` excludes
`docs/` and `tools/` — so a diff confined to those two trees matches the
trigger and cannot move the graph by construction, which is that bullet's
own "deliberately wider than the walk" clause with its two worked
examples. The regen and the hand `index --check` belong to the integrator
at the checkpoint; CI run `33275876129` step 18 is green on the merged
tree independently.

### THE RESOLVER — attacked on fixtures this seat built

**(a) The safety argument, PROVEN and not read.** The identity claim is
that on a checkout holding the local branch the resolved revision is the
revision the module always spent. Measured two ways at `960555d`. By
construction: candidate one is the bare name, so `rev === branch` and the
argv handed to `git log` is byte-identical to the pre-fix argv. By
experiment: the base module extracted into a detached worktree at
`a533a4d` and the tip module were both run against the same clone, and
the two briefs diff to **one line** with the live clocks normalised —

    27a28
    >   integration ref this checkout resolves: main  <- read <CLOCK> ; git rev-parse --verify, …

143 lines against 144. Every figure, every provenance string and the
`git log --first-parent --format=%H %s main` spelling are character for
character unchanged.

**(b) Three shapes, built fresh** — clones of this repository rather than
the executor's `git archive` plus `git init` fixtures. Driven with
`brief.mjs --task T-133 --root <shape>`:

| shape | how built | exit | resolved | tip |
|---|---|---|---|---|
| local | `git clone` of the main checkout | **0** | `main` | `129e3c92…` |
| detached | clone, `checkout --detach`, `branch -D main` | **0** | `origin/main` | `129e3c92…`, the SAME commit; full brief assembles, 144 lines |
| orphan | the same plus `remote remove origin` | **3** | none | no base commit printed |

The orphan's stderr names all three spellings, says *"will not substitute
HEAD"*, and contains no `ambiguous argument`. The pre-fix module against
those same two non-local shapes: exit **3** with `fatal: ambiguous
argument 'main': unknown revision or path not in the working tree` on
stderr — the card's own repro, on this seat's fixtures.

**A FOURTH SHAPE THE SUITE DOES NOT BUILD, because the property deserves
it.** A clone with one extra LOCAL commit: local `main` `dbabd129…`,
`origin/main` `129e3c92…`, and the brief answers `integration ref this
checkout resolves: main` at the LOCAL tip. That is the doc comment's real
claim — *"a remote-tracking ref can sit at a DIFFERENT commit"* — and it
holds. It is routed as `T-153-s16` arm four because nothing in the suite
drives it: the shipped `local` fixture has no remote at all, so its
positive control passes for a reason unrelated to preference order.

**(c) The sweep, run independently and CONFIRMED.** Method deliberately
different from the executor's: every `git` subcommand argument array
under `tools/e2e/{scripts,tests}`, every use of `integrationBranch`,
`integrationRef` and `integrationLog`, and every literal `"main"`.
Exactly ONE site spends a branch NAME as a revision — `context()`'s
`integrationLog` read, the one fixed. `card-figures.mjs` spends the
spelling only into a provenance STRING and never into a git argv, so the
card's "two call sites" is wrong and the notes' correction of it is
right. Everything else spends `HEAD`, hashes parsed out of
`docs/CONVENTIONS.md` (`range-rule.mjs`), `${sinceHash}..HEAD`
(`health-bands.mjs`), or no revision at all. The two `"main"` literals in
`refShapes()` are a fixture's own `--initial-branch` and its deletion.
**No second spending site exists**; the REJECTED-level condition is not
met.

### THE NARROWED REGEX — two-sided, and the one thing that is wrong

**The inherited red is real.** Reproduced against the UNCHANGED base
module pointed at this worktree: 140 stamped lines, `\bmain\b` matches
**5**, violations **2** — `T-153-s9 touches:` and `T-153-s9 board
status:`, both carrying this card's own file name as a tree-stamped
provenance. Repairing it in fence is correct.

**Positive side — the narrowing still catches a real revision spend.**
Producer-side plant in a detached scratch worktree at `960555d`: one
extra row-4 line with a CONSTANT value, so the earlier `changed` loop
cannot claim it, and a provenance `git rev-list -n1 <branch>` stamped
`tree()`. `tests/brief.spec.ts` gives **1 failed / 24 passed**, dying at
line 408, `for (const line of refReads) expect(line).toContain("  <-
read ")`. Not vacuous.

**Negative side — it does not fire on this card's file name.** At the
tip: 141 stamped lines, `\bmain\b` **6**, token match **4** (all LIVE),
dropped **2** (both TREE). Body green.

**AND THE ASSIGNED CORRECTION.** The diff claims, in the spec comment and
again in the notes, that the dropped class is accounted for *"so a real
violation cannot hide in the difference between the two patterns"*. **A
real violation does hide there, and this seat planted one.** The same
plant with the provenance `git rev-parse <branch>^{commit}` — a genuine
revision spend, TREE-stamped: the token match misses it, because `^` is
in neither `[\s,]` nor the end anchor; the `dropped` loop then asserts it
is a TREE fact, which it is; and the suite reports **25 passed**. The
mutant SURVIVES. Under `\bmain\b` it would have redded. The three
patterns over that same planted tree:

| pattern | matches | violations |
|---|---|---|
| `\bmain\b`, pre-repair | 7 | **3** — the plant plus the two false file-name hits |
| shipped, `(?=[\s,]` or end) | 4 | **0** |
| proposed, `(?=[\s,^~:]`, `@{` or end) | 5 | **1** — the plant, and only it |

**THE CORRECTION, named precisely.** In
`tools/e2e/tests/brief.spec.ts`, body *"a figure read from the MOVING
integration ref is a LIVE fact — two reads at ONE ref disagree"*, in the
local `spendsBranch` predicate, widen the lookahead to admit the
revision-suffix characters — `[\\s,]` becomes `[\\s,^~:]`, with `@\\{`
added as an alternative before the end anchor — so `main^{commit}`,
`main~3`, `main@{u}` and `main:path` are spends while a hyphenated
file-name fragment still is not. **Validated by this seat before
assigning it**, in the drill worktree: with the plant it reds at line 408
(**1 failed / 24 passed**); without the plant `tests/brief.spec.ts` is
**25 passed**; `npm run typecheck` exit 0 and `npm run lint:tokens` exit 0
with the same 151/869 corpora. **The alternative discharge is equally
acceptable and is the integrator's call**: keep the pattern and correct
the two sentences instead, since a stated residual is not a defect and an
overstated guard is. What may not stand is the pair as it is — a keeper
weaker than the claim written beside it is the shape
`docs/NORTH_STAR.md`'s band calls a stop-the-line defect.

### THE DRILL — five mutants of this seat's own, in a detached scratch worktree

Work committed first (`960555d`), worktree detached at that commit, one
stem derived from the lane for the worktree, the driver and every
artefact, every mutation read back with `git diff` before the run,
producer side only, each restored and sha256-proved.

| # | mutant | result |
|---|---|---|
| 1 | `context()` spends `spellings.integrationBranch` again — the resolver exported but unwired | **KILLED, 1 failed / 24 passed.** The whole-brief body only, dying with `fatal: ambiguous argument 'main'` naming the detached fixture. The unit body survives, so the failing-body count is ONE and the whole-brief body is non-duplicative in T-072-s2's sense |
| 2 | candidate order reversed | **KILLED, 1 failed / 24 passed** — the unit body's first-candidate assertion, by its safety message. The whole-brief body does NOT die here, its `local` fixture having no remote, which is `T-153-s16` arm four |
| 3 | the `throw` replaced by a `HEAD` substitution | **KILLED, 2 failed / 23 passed** — the unit body's `toThrow` and the whole-brief body's orphan `CANNOT_RUN` |
| 4 | **third candidate deleted** — this seat's own, not among the executor's eight | **SURVIVED, 25 passed** — POISON SHAPE FIVE. Routed as `T-153-s16` |
| 5 | a constant-valued line whose provenance spends the branch as a revision, TREE-stamped — this seat's own | **KILLED at line 408** as the narrowing's positive control; its `^{commit}` variant **SURVIVED**, which is the assigned correction above |

Restorations: `dispatch-brief.mjs` to
`f13ac1a2c95c251d7d3574551dc74082c3d209d24e9a3b3bb1af49730a0a393a`,
`card-figures.mjs` to
`eed3d1df54a2c1ef11f2052bde7ec3d6e66d7c558469e6c349835654da44324e`,
`brief.spec.ts` to
`d2032e1cfbf11e5d311210efc90f5e57c17a8c3994d2b1e0ff07c0e07ef70844`, each
matching `git show HEAD:<path>` with `git status --porcelain` empty over
tracked paths. The first two agree with the executor's own figures, which
is an independent check on those two files.

### SECURITY SWEEP — no findings

No dependency added; the diff touches three files and no manifest. Every
new git call goes through `spawnSync` or `execFileSync` with an ARGV
array and no shell, so the branch spelling cannot inject a command. The
one residual is named rather than passed over: neither the probe nor the
read puts a `--` before the revision, and neither would survive a
spelling that begins with a dash; the value is parsed out of a tracked
governing document rather than taken from any caller, so this is a shape
and not a live hole. The fixture's `FIXTURE_GIT_ENV` spreads
`process.env` whole, which is `T-153-s4`'s class and belongs to a test
fixture rather than to the runner's built environment — ADR-003 is
untouched. Temp trees are `mkdtempSync` under `os.tmpdir()` and removed
in a `finally`. No secret, no key, no new endpoint, no authz surface.

### ARCHITECTURE AND ADJACENT FEATURES

Nothing in `docs/ARCHITECTURE.md` moves: `tools/e2e` is dev tooling under
no component and `.nputerignore`d out of the map, and no interface in
that file mentions the brief's rows. The new row-4 line is emitted INSIDE
row 4 rather than as a fifth row, so `brief.spec.ts`'s
row-set-from-the-role-file derivation is untouched — confirmed by the
full lane at 283. The `card-figures` split, the figure TEXT keeping the
branch while the provenance names the ref, is the right way round and is
the only way a `card:` stamp can verify identically on both event types;
the executor's mutants 7 and 8 pin both halves.

### CI EVIDENCE — read per body, read-only

- **`33272976860`** (pull_request, head `aadf874`, pre-fix): **29 failed
  / 252 passed**; body `brief.spec.ts:313` dies with `Command failed: git
  -C /home/runner/work/nputer/nputer log --first-parent --format=%H %s
  main` and `fatal: ambiguous argument 'main'`. The card's twenty-nine,
  confirmed at its own run.
- **`33275876129`** (pull_request, head `a0e7a66`, merge `cbaa33f`,
  post-fix): **282 passed / 1 failed**, steps 1 through 24 all success
  including `graph currency (index --check)` and the whole-tree docs
  gate. The single failure is that same body, now at its PRECONDITION —
  *"main carries only one Checkpoint here"* — with no `ambiguous
  argument` anywhere in the log. 282 plus 1 is 283, so **both new bodies
  ran and passed**, and since exactly one body failed overall, 28 of the
  card's 29 pass. **The failure mode changed, which is the claim, and
  this seat verifies it end to end.**
- **`T-153-s14`'s routing is SOUND and the refusal to fix on a guess is
  correct.** The residual is a claim about the CONTENT of the log the
  runner read, not about the resolver — the same run's `brief
  DISCLOSURE` body assembled *"every row"* at `cbaa33f`, which requires
  that read to have found a Checkpoint at all. This seat cannot explain
  it either and did not try to; a fix on an unreproduced cause is the
  guess `docs/CONVENTIONS.md` names in *"a regen skipped on a guess
  proves nothing"*. **One thing that card should carry**: the disclosure
  that would answer it landed at `3f374a0`, cycle 2 died at step 19
  before the e2e lane, and cycle 3 was not spent — so **the instrument
  has never executed**, and `T-153-s14` waits on a run rather than on an
  idea.
- **Cycle 2 `33277133108`** — step 19 failure, steps 20 through 26
  skipped, e2e never reached. `T-153-s13`'s diagnosis, not re-litigated.

### THE ONE PIECE OF NEWS THIS VERDICT CARRIES OUTWARD

`T-153-s13` is FIXED on main and validated — run **`33277730761`**
(push, head `129e3c9`) has step 19 and step 20 both success. **That same
run is RED: 2 failed / 279 passed at `workflow-parity.spec.ts`**, because
the guard rewrote step 19's `run:` and `docs/CONVENTIONS.md` still
publishes the bare `cargo install cargo-audit --locked`. **main's own
e2e lane is not green**, and the next `pull_request` run on this lane
will carry those two reds plus the `T-153-s14` residual — three failures,
none of them this card's. Filed as **`T-153-s15`, priority 1**. The
integrator should read it before merging, because it decides what a
post-merge CI colour means.

### ROUTED, NEVER BLOCKING

- **`T-153-s15`** — the ci.yml, CONVENTIONS and workflow-parity
  divergence above. Priority 1, outside this fence.
- **`T-153-s16`** — the candidate list: `origin/<b>` outranked by a local
  `refs/heads/origin/<b>` (measured: three different commits),
  `refs/remotes/origin/<b>` unreachable whenever it exists, no
  cardinality floor (mutant 4 survived), and no divergent fixture for the
  safety property.
- **`T-153-s17`** — the missing `--` separator: a checkout holding a root
  path named for the branch still produces `fatal: ambiguous argument
  'main': both revision and filename`, end to end, exit 3. Pre-existing
  at `a533a4d`, unchanged by this diff, and worth naming because it
  prints the same first line as the defect this card removed.
- **A note for triage, not a card**: `T-153-s13` is discharged by
  `129e3c9` and still stands at `status: suggested`. Per
  `docs/CONVENTIONS.md`'s fourth-question clause that is correct — it
  wants a `closed_by:` line in its own body and a triage move, not a
  status edit.

### WHAT THIS SEAT DID NOT DO

No merge, no push, no branch move, no write outside this lane. The
`status:` stays `verifying` and no frontmatter field was touched — the
ceremony divergence the notes record is the merging seat's to flip, and
this verdict does not resolve it. Gates owed for THIS seat's own writes —
this Verdicts section plus three suggestion cards, all flat
`docs/tasks/T-*.md`, which the DOCS GATE answers with three suites — are
run at the tip these commits create and recorded immediately below.

### The gates THIS seat's own writes owe — run at `97fc33b`

**A ROLE THAT WRITES TO THE TREE OWES THE TREE'S GATES, EVEN WHEN WHAT IT
WROTE WAS PROSE**, and this seat's first attempt at them found a defect
in its own writing. The DOCS GATE's diff half, fed the RANGE RULE's own
path list —

    TREE=$(git merge-tree --write-tree $(git rev-parse main) HEAD)   # exit 0
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only $(git rev-parse main) "$TREE")

— reported at the first verdict commit `910f31d`: **1 task card the
parser will refuse**. `T-153-s17`'s title carried a SECOND colon-space
inside a plain YAML scalar, so that card did not parse, and the board
would simply have got shorter — `9c64cd8`'s failure exactly, arriving in
the commit that quotes it. Fixed at `97fc33b` by rewording the title;
the gate now says *"every live task card's frontmatter parses, with a
legal status"*. It is recorded rather than quietly repaired because the
gate case is only worth writing about when somebody walks into it.

At `97fc33b`, the merge's diff is **9 paths** — six flat
`docs/tasks/T-*.md` and the three `tools/e2e` files of the executor's
work, nothing else — and the gate FIRES naming three suites, all three
run here:

| gate / suite | exit | figures |
|---|---|---|
| `docs-gate.mjs` diff half | **1** (FIRES, has a verdict) | 6 docs paths are code inputs; 0 cards the parser will refuse |
| `npm run lint:docs` (whole-tree half) | **0** | 22 readers / 4 suites, 0 frontmatter issues, 4 budgets held |
| `npm test` from app/ | **0** | **1013 passed** / 47 files |
| `npx vitest run` from lib/parser/ | **0** | **314 passed** / 15 files |
| `npm test` from tools/e2e/ (`NPUTER_E2E_PORT=14533`, zero rows first) | **0** | **283 passed**, 2.7m |

GRAPH REGEN, BOOT GATE and the METHOD EVAL GATE are all NOT owed by this
seat's own diff: it is `docs/tasks/**` only, which matches no code
suffix, no `app/**` path, no manifest and no `method/**` path. The
commit that appends THIS table is prose under `docs/tasks/` again and
therefore owes the same three suites at its own tip; the figures above
carry the ref they were measured at, which is what
`method/roles/verifier.md`'s figure case asks for in place of a regress
nobody can end.
