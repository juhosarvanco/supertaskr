---
id: T-237-s2
title: A `timed_out` or `startup_failure` run is a red the CI arm declines to call red — the announcement is keyed to the single conclusion the card named, and the other three reach a seat as "not read"
feature: F-06
milestone: 4
priority: 3
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE CARD SAID `failure` AND THE BUILD OBEYED IT LITERALLY, WHICH IS
CORRECT AND IS NOT COMPLETE.** T-237's second criterion reads *"WHERE the
newest completed run is `failure`"*, so `FAILED_CONCLUSION` is the single
string `"failure"` and the full announcement — run id, failing step, and
whether the pushed tree reaches that step's package — fires only there.

GitHub's other terminal conclusions do not vanish; they land in the arm's
catch-all sentence:

    CI'S LAST VERDICT WAS NOT READ: run <id> concluded `timed_out`,
    which this guard reads as neither `success` nor `failure`.

That is honest and it is thin. A `timed_out` run IS main being red — a
suite that hung is a suite that did not pass — and a `startup_failure`
is a runner that never got as far as the code. Both currently cost the
seat a `gh run view` by hand, which is the manual step this whole arm
exists to remove.

**WHY IT WAS NOT WIDENED IN THE LANE.** Widening `FAILED_CONCLUSION`
changes what the guard SAYS about a tree, which is a change to a guard's
behaviour and therefore a card rather than an edit — and one of the four,
`cancelled`, must NOT be widened into, because under
`.github/workflows/ci.yml`'s `cancel-in-progress: true` a cancelled run is
usually **this guard's own subject** (a superseded push) rather than a
verdict about the tree. T-237 already counts and reports those
separately. So the widening is a judgement per conclusion, not a set
union, and it deserves its own argument.

## Acceptance criteria

- WHERE the newest run that reached a verdict concluded `timed_out` or
  `startup_failure` THE guard SHALL announce it with the same shape it
  gives `failure` — the run id, the failing step where one is named, and
  whether the pushed tree reaches that step's package — and SHALL NOT
  refuse on that ground.
- THE `cancelled` conclusion SHALL remain OUT of that set, and the
  reason SHALL be recorded where the constant is: a cancellation is the
  footprint of a superseded push and not a verdict about a tree.
- A body SHALL show each widened conclusion producing the full
  announcement AND a `success` producing silence in the same fixture
  shape, so the arm cannot pass by announcing everything.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3; two siblings ride

The architect seat, at the stamp of T-237's merge (44a95c3). Three
findings edit the same hook and the same spec, each a few lines; they
are one lane, behind T-238, which holds both files for the holder
record. Criteria: `timed_out`, `startup_failure` and `action_required`
SHALL reach the same announcement as `failure`, with the conclusion
named; the two absorbed asks below are criteria of this lane.

## Absorbs: T-237-s4 (2026-09-02)

The 15-second `gh` timeout is a bound picked in a lane. The lane SHALL
measure the two `gh` calls' wall time on this machine and in CI (the
push-guard spec's own shim can time them; a real `gh run list` against
this repository gives the figure), print both beside the bound in the
hook's declared-limits header, and either justify 15 s from the
measurement or move it; the two calls SHALL be issued in one round trip
where the API allows, or the header SHALL say why not.

## Absorbs: T-237-s6 (2026-09-02)

The CI arm derives its branch from HEAD, so a refspec push
(`git push origin HEAD:refs/heads/main`) from a lane checkout is asked
about the lane's branch and allowed in silence while the same push from
a `main` checkout is refused (measured by the verifier with a
branch-aware shim). The lane SHALL read the push's TARGET branch from
the refspec when one is spelled, fall back to HEAD's when none is, and
disclose the alias/eval residue in the header the way `gitInvocations`
already does; a body SHALL drive the refspec form from a non-main
checkout through the wired hook and show it refused.

## Absorbs: T-238-s2 (2026-09-02, handed to this live lane — main is RED on CI)

CI run 33602096600 on 763548c (the push that merged T-238) failed one
body: push-guard.spec.ts:2718 "a lane holds no seat, so a holder record
in one refuses nothing" — `Error: the same record on the integration
branch is not ignored`. This lane holds the hook and the spec, so the
repair rides here, FIRST, because every push until it lands is red on
CI. Both halves of the hand-off are the dispatching seat's: the card on
main and the lane's copy carry this section. The filed text:

**THE FIRST RED MAIN OF THE SITTING, AND IT IS T-238'S ENVIRONMENT
ASSUMPTION.** T-238 derives the seat's identity from the nearest harness
ancestor (`claude`) of the calling process and answers nothing when none
matches — measured stable on this machine across six spellings. A GitHub
runner has no such ancestor: the hook runs under `node ← bash ← Runner`,
the derivation answers nothing, and the arm that should read a holder
record on the integration branch reads nothing instead. The spec body
at :2718 arms a record on the integration-branch fixture and expects it
READ there while a lane ignores it; on the runner both sides ignore it,
and the body reds by its own message. Locally green 20-for-20 in the
lane, the bench and the integration checkout — every one of those has
the ancestor.

## What to build

- WHEN the identity cannot be derived (no harness ancestor) THE holder
  arm SHALL announce that the seat cannot be checked here and ALLOW —
  the disclosed fail-open shape the CI arm already uses for an
  unreachable `gh` — and the declared-limits header SHALL name the
  runner as the case.
- THE spec SHALL arm the identity through the fixture (an injected
  derivation or an environment the hook reads first), never through the
  runner's real process tree, so the bodies discriminate on every
  machine; a positive control SHALL show the undivable case announce and
  allow, and the derivable case refuse a live other holder.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent @T-237-s2

Lane `/Users/ujju/Projects/nputer-T-237-s2`, branch
`task/T-237-s2-push-guard-three-residuals`, base
`763548cc61392f4f034b9c0fb334142f926d4c8b`. Fence held: the only files
touched are `.claude/hooks/push-guard.mjs`, `tools/e2e/tests/push-guard.spec.ts`
and this card. Nothing was merged, pushed or written outside this lane.

### T-238-s2 first, because main was RED

CI run 33602096600 on `763548c` failed one body. The cause was the BODY,
not the guard: it armed the holder arm through the REAL process tree, and
the identity is the nearest harness ancestor, which a GitHub runner
(`node <- bash <- Runner`) does not have.

**REPRODUCED ON THIS MACHINE rather than argued.** The two holder bodies
were run under a double-forked, `setsid` process reparented to launchd —
a tree with no harness ancestor, which is the runner's shape. At
`67563b4` the body fails with CI's exact message (`the same record on the
integration branch is not ignored`); at `17e764f` both pass. Logs:
`detached-base-T-237-s2.log` and `detached-tip-T-237-s2.log` in the
lane's scratch.

The repair is a SEAM: `decide` takes its holder runner as a fifth
parameter, for the reason it already takes `check`, `cheap` and `gh`. The
default is `holderVerdict`, so production is unchanged; it is a parameter
and never an environment override, so nothing outside the process can
reach it and it cannot be used to silence the guard. The arm ALREADY
failed open on an underivable identity — that half was right — and what
was added is the DISCLOSURE: the notice now says the seat cannot be
checked where this session's identity will not derive and that the arm is
inert on a runner by construction, and the declared-limits header names
the runner as the case with the incident that found it.

### The three residuals

**THE CONCLUSION.** `ANNOUNCED_RED_CONCLUSIONS` is the run-level set —
`failure`, `timed_out`, `startup_failure`, `action_required` — and
`FAILED_CONCLUSION` survives as the JOB and STEP word. `failingStep` reads
the same set at both levels, so a timed-out run whose job timed out still
names its step; a run with no jobs (`startup_failure` never has any) SAYS
the step cannot be named rather than pretending. The announcement names
the conclusion it read (`run.conclusion`), because four reds mean four
different things to whoever fixes them. `cancelled` stays OUT and the
reason sits beside the constant, with `NON_VERDICT_CONCLUSIONS` named as
the other half of one argument and the two lists asserted disjoint. A
conclusion on neither list still reaches the seat as the catch-all, which
now names the whole set rather than one word of it.

**THE BOUND (absorbs T-237-s4).** `GH_MEASURED_MS` is a new export
carrying the measurement, and `push-guard.spec.ts` holds the RATIO rather
than the sentence, so halving the bound without re-measuring reds a body
by name. 15 s is KEPT and justified as a HANG bound at ~10x the slowest
of fourteen real calls, with the asymmetry argued: a bound near the median
turns ordinary network variance into a push that silently stopped asking
CI, and a guard that goes quiet leaves nothing behind to notice. Round
trips: ONE per ordinary push (`run list` answers both questions off one
response); a second only over a red, and it cannot be folded in because
`gh run list --json` publishes no `jobs` — pinned by a body. The header
also states that THIS CARD'S WIDENING RAISED THAT COST for three more
conclusions, and that a CI figure for the network call cannot be read at
all (this file is a `PreToolUse` hook and never runs on a runner; the
suite's own `gh` there has `contents: read` only, and
`workflow-permissions.spec.ts`'s exception table is empty). What CI *can*
read is the harness floor, timed and disclosed by a body on every run and
NAMED as the harness's figure rather than as `gh`'s.

**THE BRANCH (absorbs T-237-s6).** `pushTargetBranch` reads the branch a
push LANDS on off the refspec, falls back to HEAD's where none is spelled,
and declares every spelling it cannot read to a branch — with a
`gitInvocations`-style limits block naming the alias/function/script/eval
residue, the `$BRANCH` case, the configured-target case (`push.default`,
`remote.<name>.push`, an upstream — not text, so not read), and the
plain-`<name>`-is-a-tag case with its cost shown to be one-directional.

**A FIRST DRAFT OF THAT FUNCTION WAS WEAKER THAN THE PRE-CARD GUARD AND A
BLIND BODY CAUGHT IT.** It called several named targets `unresolved`, and
`git push origin main NPUTER_CANCEL_CI=7002` reads as two refspecs — so
the live run that body exists to refuse was let through with a sentence.
The rule that replaced it: every name on the list is a REAL target, so
asking about the first can only produce a TRUE refusal, and the rest are
DISCLOSED in a notice. One round trip, and never weaker than what it
replaced.

**THE SHARPEST HAZARD WAS AVOIDED AND IS NOW PINNED.** `decide` computes
ONE `headRef` and feeds it to five arms. The target is a SECOND value the
CI arm alone consumes; `headRef` is untouched. A body drives a lane
pushing `HEAD:refs/heads/main` and shows the holder arm still answers
"not the integration checkout", and a poison drill that redefines
`headRef` from the refspec kills exactly that body.

### Poison drills — five, one side only, sha256-restored

Pristine hook before drills 1-4:
`402765efca9254140cdf5892b4eddf1c2c7d5f5b930f1cb27e3102585e0e76a4`.
Pristine hook before drill 5 (post-T-238-s2):
`4119f8bdad53dd56bd3ffe83456b2374ea1875161c1979e85e37123e70918e26`.
Each mutant was read back with `git diff` against the lane's own commit,
the whole `push-guard.spec.ts` was run against it, and the file was
restored from a scratch copy with the hash re-read and `git status`
verified clean.

| # | mutant (hook only) | mutated sha256 | kill set |
|---|---|---|---|
| M1 | `ANNOUNCED_RED_CONCLUSIONS` back to `[FAILED_CONCLUSION]` (DATA) | `0416a3f2…2014a1` | 2 — both residual-1 bodies; 81 passed |
| M2 | `GH_TIMEOUT_MS` 15_000 to 2_000 (DATA) | `961fa899…89250bd` | 1 — the bound body; 82 passed |
| M3 | `pushTargetBranch` always falls back (`length >= 0`) | `5f85f6ea…198a62` | 2 — both residual-3 bodies; 81 passed |
| M4 | `headRef` REDEFINED from the refspec in `decide` | `b3af88d3…cab9489d` | 1 — the T-238 fifth-criterion body; 82 passed |
| M5 | the holder SEAM removed (`holderVerdict` called directly) | `106def6d…2f6463` | 1 — the runner-case body; 83 passed |

Every kill set is contained to the residual its mutant belongs to. Every
positive control was therefore DEMONSTRATED FAILING against an
implementation lacking the property, not merely observed passing.

### Commands, in order, with their exits

`tools/e2e npm ci` 0 · `app npm ci` 0 · `app npm run build` 0 ·
7x `gh run list` 0 (1026-1256 ms) · 7x `gh run view` 0 (1232-1499 ms) ·
`tools/e2e npm run typecheck` 0 (x5) ·
`npx playwright test tests/push-guard.spec.ts` 1 (2 failed / 81 passed —
two PRE-EXISTING bodies moved by the branch fix, both diagnosed and
repaired below), then 1 (1 failed / 82), then 0 (83 passed), then 0
(84 passed at the T-238-s2 tip) · five drill runs (M1 81/2, M2 82/1,
M3 81/2, M4 82/1, M5 83/1) · detached runner-shape runs: base FAILED as
CI does, tip 2 passed · `gate-run.mjs parser` 0 (363 bodies) ·
`gate-run.mjs app` 0 (1141) · `gate-run.mjs rust` 0 (639, 18 targets) ·
`NPUTER_E2E_PORT=15238 gate-run.mjs e2e` 0 (605) ·
`git merge-tree --write-tree main HEAD` 0 ·
`cargo run -p nputer-index -- index --check --root ../..` 0 (CURRENT) ·
`npm run capabilities:check` 1 (STALE — the integrator's regen).

The two bodies the branch fix moved, both repaired rather than relaxed:
`the acknowledgement names the run` (its trailing-token case, which the
first-target rule above restores to a refusal) and `the branch reaches
gh as ONE argument` (its command now spells NO refspec, so the hostile
branch still reaches `gh` off HEAD — and a companion half shows that the
same name spelled AS a refspec never reaches `gh` at all).

### Gates, derived on the merge forecast

`git merge-tree --write-tree main HEAD` exited 0, tree
`03bf82711fba77e9d104348449b4bf8f003dcbcc`;
`git diff --name-only main <tree>` names 2 paths at `17e764f`
(`.claude/hooks/push-guard.mjs`, `tools/e2e/tests/push-guard.spec.ts`)
and 3 once this notes commit lands, adding this card. The card itself did
not appear at `17e764f` because main already carries the identical
`Absorbs: T-238-s2` text (`2a74287`).

- **GRAPH REGEN — FIRES**, on `tools/e2e/tests/push-guard.spec.ts`, a
  `*.ts` outside `docs/`. ASKED RATHER THAN PREDICTED: `index --check`
  exits 0, CURRENT, 1170079 bytes / 200 files / 2504 symbols / 2395
  edges — the regen is a no-op by construction, since `.nputerignore`
  excludes `tools/` and `.claude/` is outside the walk. It is still the
  integrator's to run at the merge.
- **BOOT GATE — NOT OWED**: no path under `app/src-tauri/**`,
  `app/src/**`, `app/package.json` or `app/src-tauri/Cargo.toml`.
- **DOCS GATE — FIRES** once this commit lands, on
  `docs/tasks/T-237-s2-*.md`, which the parser smoke test and the board
  scripts read.
- **METHOD EVAL GATE — NOT OWED**: no path under `method/**`.
- **THE CENSUS IS OWED AND IS THE INTEGRATOR'S**: seven new spec names,
  `capabilities:check` exits 1 (committed 50248 bytes, fresh 50969), so
  `npm run capabilities` belongs in the merge commit.

### Where the brief was wrong

- **Row 4's base commit** said `6cc38909ab24c9c5c06b4e23a0fa11424662a038`
  while this lane's HEAD at dispatch was
  `763548cc61392f4f034b9c0fb334142f926d4c8b` — T-233's known defect, and
  the worktree's HEAD is the truth. Every figure here is derived at
  `763548c` or later.
- **The brief's fence sentence and the ceremony are otherwise exact.**
  The one departure from its ORDER is the coordinator's: T-238-s2 was
  handed to this lane "before the three residuals" and arrived after they
  were already committed, so it is the SECOND commit (`17e764f`) rather
  than the first. It touches regions `67563b4` does not, so it can be
  cherry-picked ahead of the residuals if the import block is merged by
  hand.
- **The brief said the card's `FAILED_CONCLUSION` sits "around :768"**
  and `GH_TIMEOUT_MS` "around :634". Both were right at the base and both
  are line numbers, which docs/CONVENTIONS.md rules are figures; they are
  cited by SYMBOL throughout this work.
- **Nothing else in the brief was contradicted by the repository.**

### Addendum — the forecast moved because MAIN moved, not because this lane did

The gate derivation above was measured at `17e764f` against main at
`763548c`. Two things have changed since and both are recorded here
rather than left for the integrator to discover:

- **The path set is FOUR**, not three: this card, the hook, the spec, and
  `docs/tasks/T-237-s8-*.md`, the one criterion this lane could not build
  inside its fence and routed instead. The gate READINGS are unchanged —
  GRAPH REGEN still fires on the `*.ts`, BOOT GATE and METHOD EVAL GATE
  are still not owed, and the DOCS GATE still fires on `docs/tasks/`.
- **`git merge-tree --write-tree main HEAD` now exits 1**, and the ONE
  conflicted path is this card. Main moved from `763548c` to `65010e4`
  and carries the `Absorbs: T-238-s2` section at `2a74287`; this lane
  carries the same section plus the stamp and these notes. **The
  resolution is to take THIS LANE'S version of this file wholesale** —
  `git diff` between the two blobs is `185 insertions(+), 1 deletion(-)`
  and every one of them is this lane's own addition, so the lane's copy
  is a strict superset of main's. Main touched NEITHER fenced file since
  dispatch (`git diff --name-only 763548c..main --` over both is empty),
  so nothing else conflicts.
- **T-237-s3 merged onto main at `7cb7a37` and imports from this hook** —
  `CI_WORKFLOW_REL_PATH` and `stepWorkingDirectory`, both untouched by
  this lane's diff, so the post-merge interaction is nil.

**THE DOCS GATE WAS DISCHARGED IN THIS LANE**, at the tip that carries
every path above: `gate-run.mjs parser` 0 (363 bodies), `app` 0 (1141),
`e2e` 0 (605) and `rust` 0 (639 / 18 targets), each keyed to the lane's
own tip. It is still the integrator's to run at the merge, against the
merge's own tree.

## Fix pass — 2026-09-02, executor claude-opus-5@subagent @T-237-s2

The verifier's verdict (`V-T-237-s2`, on the bench card at `d8db32f`)
APPROVED the absorbed T-238-s2 as separable and REJECTED the three
residuals on ONE defect, in its own words:

> **THE DEFECT: `--all` AND `--mirror` MAKE THIS GUARD WEAKER THAN THE
> ONE IT REPLACES.** `PUSH_UNRESOLVING_FLAGS` sends them to `unresolved`,
> and `ciVerdict` then returns without asking `gh` anything — so a push
> that lands on `main` while a run is in flight on `main` is no longer
> refused.

and its ruling on the remedy, also in its own words:

> Both flags push a set that INCLUDES HEAD's own branch — that is what
> they mean — so the run really is cancelled and the refusal the base
> gave was TRUE. This is the lane's own disqualifying rule, left
> unapplied to two of its instances.
> `--delete`/`-d` are correctly on that list and must stay: a deletion
> does not land on HEAD's branch, and the base refusing it was a FALSE
> refusal this lane removes. The list conflates the two.

**THE REPAIR IS THE ONE IT PRESCRIBED.** The list is split:
`PUSH_ALL_BRANCHES_FLAGS` (`--all`, `--mirror`) takes the FALLBACK path —
HEAD's branch is asked about, and the branches the line does not name are
DISCLOSED through the same notice `git push origin main dev` already
earns — while `PUSH_UNRESOLVING_FLAGS` keeps `--delete`/`-d` alone, with
each list's docblock carrying the half of the argument that is its own.

**RED BEFORE, GREEN AFTER, ONE SIDE ONLY.** A new body drives
`git push --mirror origin` and `git push origin --all` through the WIRED
hook against an `in_progress` run for `main`, sees exit 2 and the run id,
and asserts nothing reached the remote; its control is the same two
spellings over a COMPLETED green run, which push; and its third half
shows a `--delete` asking nothing and spending no round trip. With the
repair reverted (M6: `PUSH_UNRESOLVING_FLAGS` back to the four-member
list, read back with `git diff --no-index` against the pre-mutation copy)
that body and the reader's census body BOTH red — 2 failed / 83 passed.
With the repair in place: **85 passed**. Mutated sha256
`b8e0bbb60816bc37e2ec0ac6489d04b2648beed9719f14f5e7838fd02883a3aa`;
restored `a4cc5d6ceb666b62f564868fc7f30aca1e9315629db14cad1f3857ef87253ee8`
with an empty per-path diff beside it.

**THE VERIFIER'S FINDING 1 IS CORRECTED IN THE HEADER, AS IT ASKED.** The
limits block called `git push origin $BRANCH` and `git push origin "main"`
*"the pre-guard state"*, and that is false: the state immediately before
this card asked HEAD's branch unconditionally and REFUSED both. The block
now says so in those words, names it as a trade taken rather than a hole
inherited, and closes with the distinction the whole list was missing —
free limits, limits that cost a refusal the base made, and the two that
used to cost one until a verifier measured it.

**FINDINGS 2 AND 3 ARE DECLARED AND ROUTED, NOT FOLDED IN.** The
`--repo=<value>` positional and the `-`-leading destination are named in
the limits block with their bounds, and `T-237-s9` carries the repairs. A
fix pass that widens its own diff is a fix pass the verifier judges twice.

**AND THE DISCLOSURE THE VERIFIER OWED IS TAKEN UP.** `GH_MEASURED_MS`'s
second reading (1150 ms / 1390 ms at 07:03:05Z) is the VERIFIER'S OWN
phase-1 ground truth relayed into this lane. It agrees with this lane's
independent seven-sample run and it is NOT independent corroboration,
because the seat that measured it is the seat that judged the constant.
The comment now attributes it.
