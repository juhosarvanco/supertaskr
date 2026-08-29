---
id: T-153-s9
title: A pull_request checkout has no local `main`, so twenty-nine bodies red on the ONE instrument a lane is given to run CI with — the derivations resolve the integration branch by bare name and the event type decides whether that name exists
feature: F-01
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
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
the question instead of posing it.

### Routed, not built

- **`docs/CAPABILITIES.md` is one regen behind.** It is generated from
  the e2e spec names and was `CURRENT (21992 bytes)` at `a533a4d020cd`;
  this diff adds two spec bodies, so it now needs `npm run capabilities`
  from `tools/e2e/`. That file is under `docs/`, outside this lane's
  `touches: [tools/e2e]` fence, so it is NOT written here — it is owed at
  the merge, and it is one command.
