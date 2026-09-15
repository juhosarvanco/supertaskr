---
id: T-336
title: "The nightly run and the push run share a concurrency group keyed on the commit, so the schedule cancels the push whose verdict is the landing gate: key the group on the event as well as the commit, or give the scheduled run its own group, and prove a schedule and a push on one commit both reach a conclusion"
feature: F-04
milestone: 4
size: XS
tier: guarded
priority: 1
status: done
suggested_by: "the architect seat on 2026-09-15, from the cancellation of the T-331 landing push's own CI run; observed twice, on 2026-09-14 and 2026-09-15, and read from the runs' own event fields rather than inferred"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts, .claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## Fence widening, 2026-09-15

Widened by the architect seat on the lane's ask, both halves in one act: the two paths added above, and the lane's own fence manifest rewritten to match.

WHY. The lane measured that criteria 1 to 3 sit wholly inside the original fence, and that the last criterion does not: the only thing in this repository that reads a run's conclusion and says anything to a seat is the pre-push guard, which the fence did not carry. Two of that criterion's three halves already hold and are already pinned — a cancelled run is deliberately out of the announced-red set, and it is in the non-verdict set so the newest-verdict search skips it. The half that does not hold is the naming: the guard reports a COUNT of runs that reached no verdict, never the cancelled run's identifier and never the displacing run's, and it prints even that only when the verdict it finally finds is not a success, so a cancellation sitting in front of a green is silent. The guard could not name the displacing run today in any case, because the run-list field set it asks for does not include the event, and after this card's own repair the displacing run is the newer run with the same commit AND the same event.

The seat verified each of those readings against the tree before ruling rather than taking them from the ask.

WHY NOT THE OTHER TWO ANSWERS. Ruling the criterion satisfied by its two holding halves would leave a criterion whose main clause — reported as a displacement naming the displacing run — is performed by nothing in the tree, which is the letter-over-purpose shape this project's whole verification apparatus exists to catch, and the shape that gets copied once it is allowed. Splitting it into a follow-up card is honest but spends a whole further lane on a build the ask scopes as a field added to a list, a derivation beside an existing one, a notice, and its bodies.

THE LIMITS OF THIS WIDENING, WHICH ARE PART OF THE GRANT. It is for the last criterion only. T-333's repair now sits inside this fence, and it is NOT to be performed here: that card is already filed with its own criteria, and performing it as a follow-through would orphan the card and put work in this diff that no criterion of this card asked for. The three lane-local reds it describes are still reported and still not this lane's. Nothing else outside the original fence is opened.

WHAT IT COSTS, RECORDED SO THE NEXT SEAT IS NOT SURPRISED. T-333's fence is now a subset of this card's, so T-333 cannot be dispatched while this lane is live. The widened fence stays disjoint from T-330, which is live beside this lane, and from T-332 and T-335.

## The finding

The workflow declares one concurrency group for every trigger it has, keyed on the workflow and the commit, with in-progress cancellation on. T-294 put the commit into that key so that a NEW push would stop cancelling the run of an older one, and for pushes it works. What it does not account for is another trigger arriving on the SAME commit: the nightly schedule grades whatever the tip is, and the tip is the commit the last push just created. Same workflow, same commit, therefore the same group — so whichever run starts later cancels the one already going, and the later one is the nightly.

Observed twice, both read from the runs' own `event` fields:

- 2026-09-14: the push run on `37d89ff7` created 12:56:49Z was cancelled; the schedule run on the same commit created 12:58:24Z succeeded.
- 2026-09-15: the push run on `ee5bae19` created 11:38:14Z was cancelled at 11:52:02Z, thirteen minutes into its end-to-end shard, with eight of its ten jobs already successful; the schedule run on the same commit created 11:51:43Z took over.

Two details make it worse than an occasional collision. The cron is written for the small hours, and both observed runs were delayed by the service into the working window, so the nightly arrives while a seat is pushing rather than while nobody is. And a cancelled run is neither green nor red: the standing instruction to keep a lane branch until CI is green waits on a verdict that will never arrive, and a seat reading only a run's conclusion sees a word that names no fault in the tree.

The tree itself was never in question on either occasion. What was lost is the push's own verdict, which is the evidence the landing gate reads.

## What would settle it

The group distinguishes the runs that must not cancel each other. Keying it on the event as well as the commit is the smallest change that does so; giving the scheduled run a group of its own is the same idea spelled differently. Either way a push and a schedule on one commit both reach a conclusion, and a push started while another push on the same commit is still running still collapses to one, which is the behaviour T-294 wanted.

The keeper reads the workflow rather than the prose: a body that enumerates the declared triggers and requires that no two of them can land in one cancelling group, so that adding a trigger later without widening the key reds by name rather than silently restoring this defect.

A seat that meets a cancelled run needs to know it is not a red. The cancellation is reported as its own outcome, naming the run that displaced it, rather than read as a failure of the tree or as a verdict still pending.

## Acceptance criteria

- WHEN two runs of this workflow are triggered by different events on the same commit THE concurrency key SHALL place them in different groups, and both SHALL reach a conclusion rather than one cancelling the other.
- WHEN two runs are triggered by the same event on the same commit THE in-progress cancellation SHALL still collapse them to one, which is the behaviour the commit-keyed group was introduced for.
- WHEN the workflow declares a trigger THE keeper SHALL derive the trigger set from the workflow itself and SHALL red by name where any two declared triggers could land in one cancelling group, so a trigger added later cannot silently restore this defect.

## Scope amendment, 2026-09-15 — the reporting criterion split to T-338

Amended by the architect seat on the owner's ruling of 2026-09-15. THE CRITERION IS NOT WITHDRAWN AND NOTHING OF IT IS LOST: its full obligation and its provenance move to T-338, which is filed in the same act. This card's active criteria are now the three above, and its independent verifier judges that revised scope before the merge.

WHAT WAS SPLIT. The criterion required that a run cancelled by another run be reported as a displacement naming the displacing run, and be read as neither a red tree nor a verdict still pending. The lane measured that two of its three halves already hold and are already pinned by bodies in the guard's own spec, and that the naming half does not: the guard reports a count of runs that reached no verdict rather than any identifier, and prints even that only where the verdict it finally reaches is not a success, so a cancellation sitting in front of a green is silent. That is the state this project was actually in when the nightly displaced a push twice in two days.

WHY IT WAS SPLIT, STATED AS WHAT WAS OBSERVED RATHER THAN AS A GENERAL CLAIM. The only thing in this repository that reads a run's conclusion and says anything to a seat is the pre-push guard, which lies under `.claude/`. On 2026-09-15, in the agent harness this session runs inside, two separate attempts by the lane's executor to modify that file were refused with the reason `[Modify Shared Resources]`, and a read-only status command that merely named the path was refused as well, so the match is on the path text. That is one observed harness refusing one path in one session. It is NOT a claim that every harness refuses it, nor that the file is unmodifiable, nor that the project's own fence objected — the seat had granted the fence and the lane-fence hook was satisfied. The executor declined to treat a seat's grant as the owner's consent to modify hook configuration, and declined to look for a way around the refusal. Both were right.

THE SEAT'S GRANT OF THE WIDENING STANDS AND IS NOT WITHDRAWN by this amendment; it is recorded above and was correctly spent on establishing what the criterion needed. What it could not reach was a permission layer no seat owns.

WHAT THE SPLIT DOES NOT DO. It does not lower the bar. T-338 carries the same obligation and owes executable verification of its substance, not a hand edit graded by reading. It does not change hook permissions, which stay as they are. It does not license this card's verifier to grade a criterion that is no longer here.

## Implementation notes

The concurrency group carries the event as well as the commit now, and
`cancel-in-progress` is unchanged at `true`. Every declared trigger
therefore holds its own group on one commit, while two runs of one
trigger over one commit still collapse to one, which is the behaviour
the commit-keyed group was introduced for.

The keeper does not transcribe the trigger list. It enumerates the
workflow's own trigger block, renders the declared group once per
trigger with every context value held equal except the event, and reds
by name on any pair that renders to one string. Holding the rest equal
is the conservative direction: a context value may tell two triggers
apart only where it is guaranteed to, and the repository ref is the
member that looks like it does and does not, since a push to main and
the nightly on main carry the identical ref. The same derivation names
a key made unique per run, which retires the collapse in the other
direction, and any expression the keeper cannot model, including one
whose own braces defeat the substitution. Seven one-edit mutants pin
each red, with the unedited clone as the positive control.

Criterion 4 IS NOT BUILT, and this note is where a reader meets that
rather than discovering it. The outcome a cancelled run reports is
produced by the push guard hook, which this lane's fence does not
carry. Two of its three halves already held at the base commit and are
already pinned by bodies in that guard's own spec: a cancellation is
out of the announced-red set, and it is in the non-verdict set, so it
is skipped on the way to the last real verdict and is read neither as a
red tree nor as a verdict still pending. The half that does not hold is
naming the displacing run. The guard reports a count of skipped runs
and never a name, and prints even that only where the verdict it
eventually reaches is not a success, so a cancellation sitting in front
of a green is silent. It could not name the displacing run today in any
case: the displacing run is the newer run in the same group, which
after this change means the same head sha and the same event, and the
event is not among the eight fields the guard asks of the run list. The
executor wrote the ask file and named three ways to settle it, being a
widening onto the guard and its spec, a ruling that the two halves
which hold are enough, or a split onto a follow-up card. No ruling had
arrived when this lane finished.

The poison drill was four data mutants at the site, each read back with
a diff before its run and each restored to a matching sha256. Dropping
the event from the key killed both new bodies and nothing else: the 36
bodies the parity spec carried at the base commit, including the
concurrency assertions already there, all stayed green under the exact
defect this card describes. That is the evidence the keeper was owed.

## Verdicts

### 2026-09-15 — APPROVED — claude-opus-5@subagent (verifier, independent, tier guarded)

APPROVED — all three active acceptance criteria met, with four findings
recorded below and none of them blocking. No corrections assigned.

#### THE SEALED INPUTS, RE-DERIVED RATHER THAN TAKEN ON TRUST

    sha256:dc96edde4eb17cc76a5d9445603a9943b879028586ea17d24c3bf3dc78c58f97  attack-set-T-336.md
    sha256:03ef7be34071079d5715ae1fa1b9d9cd9593be30c505b46d90be16d4d27a8ea6  ground-T-336.md
    sha256:f8f79f73a8cb3c8167d7d930b362a5acf71fbc4bfa213f522de067094c4b72f0  the card at d13a5d8c

All three re-derived on this bench and matching the stamps file. The stamps
file records a HAND RESEAL of the ground after phase 1's ten measurements were
appended under its addendum heading, and asserts the attack-set digest was
unchanged by it. I re-derived all three myself: the assertion holds. The ground
was read to its end, addendum included.

#### PHASE 1'S FRAME WAS NOT CLEAN, AND THIS VERDICT SAYS SO RATHER THAN DESCRIBING ONE THAT WAS

Phase 1 disclosed that post-base material reached it unbidden: the harness's own
environment block carries recent commit subjects at the session HEAD, which is
after the base ref, and the subject of the seat's fence-widening commit describes
the criterion-4 surface in detail. Phase 1 marked attacks C4-1 and C4-5 as
`[CONTAMINATED]` and disclaimed them as pre-commitment. That disclosure is
carried forward here verbatim in force. The seat's addendum confirms the cause
and records that it was the seat's own commit message read by the wrong reader
first.

MY OWN FRAME: the same environment block was present for me. It is of no
consequence to this pass, because I hold tools and read the diff, the tree and
the runs directly, and every figure below was measured on this bench.

#### THE SCOPE I GRADED, AND THE SCOPE I DID NOT

On the owner's ruling of 2026-09-15 the reporting criterion — a cancelled run
reported as a displacement naming the displacing run — was SPLIT OUT to T-338
with its full obligation and provenance carried over. T-336's active criteria
are the three above it. I graded those three.

Phase 1's entire section 4, attacks C4-1 through C4-9, grades work that is not
in this diff. **I did not spend one of them against it.** They transfer to T-338
intact, and C4-2 (a cancelled run laundered into green) is the one T-338's
verifier should reach for first: phase 1 pre-committed it as the most dangerous
available defect and I see nothing to revise in that judgement.

The criterion leaving was not treated as licence to grade the remaining three
more gently. The drill table below is longer than the one phase 1 required.

#### THE DIFF, READ BEFORE THE EXECUTOR'S NOTES

Three files, +430 / -12, from d13a5d8c to 553e4555. All code is in one commit,
85007c9e (2 files, +368 / -10); the two commits above it touch only the card.

- `.github/workflows/ci.yml` — one key line, and a comment block rewritten.
- `tools/e2e/tests/workflow-parity.spec.ts` — the keeper, +326.
- the card under `docs/tasks/` — the stamp, the notes, and the absorption.

**NO UNDECLARED SURFACE.** Phase 1's X-1 required every path outside the card's
`touches` to be a finding. There are none. The fence was widened mid-lane to
four paths, and the diff touches NEITHER of the two the widening added — which
is exactly consistent with the criterion that needed them having moved to T-338.

**X-3, THE SECURITY SWEEP: CLEAN.** No trigger added (the `on:` block is
semantically identical base to tip, verified by parsing both). No
`pull_request_target`. No new dependency, no `package.json` or lockfile in the
diff. Nothing added matching exec/spawn/writeFile/token/secret/curl/fetch/
http/require/eval/process.env/child_process. The keeper mutates only in-memory
`JSON.parse(JSON.stringify(doc))` clones and writes nothing under `.github/`.

**X-2, THE WIDENING'S THREE ASSERTIONS, RE-DERIVED AT THE TIP RATHER THAN TAKEN
AS PREMISES.** Phase 1 required this and it is discharged. All three are TRUE:

- the guard reports a COUNT, not an identifier — `.claude/hooks/push-guard.mjs`
  emits `${last.skipped} newer run(s) reached NO verdict (...)`;
- it prints even that only where the verdict is not a success — the `skipped`
  string is appended only inside the announced-red branch and the
  `conclusion !== "success"` branch, so a cancellation in front of a green is
  silent;
- `event` is absent from the run-list field set — `RUN_LIST_JSON_FIELDS` is
  `conclusion, createdAt, databaseId, displayTitle, headSha, startedAt, status,
  url`, eight fields, no `event`.

The widening's stated justification therefore stands on true readings. That
matters now for T-338, not for this card.

#### THE CRITERIA, A ROW EACH, WITH THE EVIDENCE

| # | criterion | verdict | evidence |
|---|---|---|---|
| 1 | different events on one commit land in different groups, and both reach a conclusion | **MET** | The group is `ci-${{ github.workflow }}-${{ github.event_name }}-${{ github.sha }}`. Parsed at both refs: the four declared triggers are unchanged (`push{branches:[main]}, pull_request, workflow_dispatch, schedule[cron "17 6 * * *"]`) and each now renders its own key over one commit. The body asserts the COUNT of distinct keys equals the count of declared triggers, so a pair collapsing into one is a miss and not a silence. A static proof about the key, which phase 1's C1-9 names as the honest form. C1-1/C1-2 dead (D4, D5, D6 below all red). C1-3 dead — the key differs regardless of arrival order, and D9 shows an event-conditional `cancel-in-progress` reds. C1-4 dead — D10 shows `github.event.schedule`, which separates only the observed pair, reds. C1-5 dead — the keeper holds every non-event context member equal, so no discrimination can come from a field that is not the event. C1-6 dead — one `concurrency:` block, workflow-level, no job-level block at either ref. C1-7/C1-8 dead — one workflow file, trigger set unchanged. |
| 2 | same event on one commit still collapses to one | **MET** | `cancel-in-progress` unchanged at `true`, and `github.sha` retained — so C2-1, phase 1's highest-value attack (dropping T-294's own discriminator while adding the event), is NOT present. The collapse is proved structurally rather than by phase 1's C2-2 rendering-twice: the keeper requires that NOTHING in the key is run-unique and NOTHING is unmodelled, which is a whitelist over what may appear and is strictly stronger. C2-3, the denylist, is the attack phase 1 called decisive, and it is answered — see D5. C2-4 dead: a conditional exempting the schedule from its own collapse is unmodelled and reds. |
| 3 | the keeper derives the trigger set from the workflow and reds by name | **MET** | `declaredTriggers` reads the workflow's own `on:` block through the `yaml` package, handling the YAML-1.1 `on:`→`true` booleanisation; no trigger name is transcribed in the spec. D2b is the proof: a trigger that appears nowhere in the spec file is named in the failure. The pairwise product is complete — 6 pairs for 4 triggers, 10 for 5. The message names BOTH triggers, the rendered key AND the template, so C3-7's count-is-not-a-name is dead. C3-1 dead — the keeper renders and compares, it does not spell-check. C3-2/C3-3 dead by D2a+D2b. C3-4 dead by construction: there is no per-trigger context table to fail open on, because every trigger is rendered against one held-equal context. C3-5 dead by D3 and D8. C3-9 dead — a YAML parser, not a regex, and the comment sitting inside this `on:` block is parsed correctly. C3-10 dead by D7. |

#### THE DRILLS — WHAT I SAW, NOT WHAT I EXPECTED

Fourteen data mutants applied to the REAL `.github/workflows/ci.yml` on this
bench — not to an inline clone made by the same helper that computes the
expectation, which is phase 1's C3-6. Each restored and proved by sha256 against
`bad8f2811081216564f35ada943e1ef5063ab6f245e777fc039a2964168f1160`; the bench is
clean at the tip.

| drill | phase 1 | mutant | result |
|---|---|---|---|
| D1 | D1 | the key reverted to the pre-T-336 spelling | **RED. 2 failed / 36 passed — ONLY the two new bodies.** All six pairs named, `push` and `schedule` among them, each carrying the rendered key and the template. The 36 bodies the spec already had ALL STAYED GREEN under the exact defect this card is about: the suite could not see it before. |
| D2a | D2 | a fifth trigger added under the REAL key | The two new bodies stay GREEN — correct, the key generalises. (The pre-existing exact-trigger-set body reds, which is its own separate T-294-era contract forcing a deliberate update.) |
| D2b | D2 | the same trigger under the REVERTED key | **RED**, 10 pairs, `repository_dispatch` named in four of them. This is the decisive proof of derivation: that name exists nowhere in the spec file. |
| D3 | D3 | the `concurrency:` block deleted | **RED** — named as the collapse gone, not a vacuous green. |
| D4 | D4 | `github.run_id` added to the key | **RED**, naming `` `github.run_id` `` and "the collapse retired". |
| D5 | D5 | `github.event.repository.pushed_at` added | **RED — AND THIS IS THE ONE THAT MATTERED.** Phase 1 pre-committed that a body passing D4 and failing D5 is a denylist and a correction. It reds, through the fail-closed *unmodelled* path, naming the expression and enumerating the ten members it does model. The run-unique denylist is BACKED by a fail-closed fallback rather than load-bearing. C2-3 is answered. |
| D6 | — | `cancel-in-progress: false` | **RED**, named as the T-294 collapse retired. |
| D7 | D7 | `ci.yml` moved away entirely | **RED — 26 of 38 bodies, both new ones among them, on ENOENT.** No green over zero bodies. C3-10 dead. |
| D8 | — | the `on:` block emptied | **RED** — "THIS DERIVATION FAILING and never as a clean key". |
| D9 | — | `cancel-in-progress: ${{ github.event_name != 'schedule' }}` (phase 1's C1-3) | **RED** — a non-`true` value fails closed. |
| D10 | — | `github.event.schedule` instead of the event (phase 1's C1-4) | **RED** as unmodelled. Discriminating only the observed pair cannot pass as clean. |
| D11 | — | a wholly static group, no interpolation | **RED** on every pair. |
| D12 | — | `format('{0}-{1}', github.event_name, github.sha)` — a key that DOES discriminate in reality but whose own braces defeat the substitution | **RED** as unmodelled. The renderer errs toward red, which is the conservative direction. |
| D13 | — | **THE FALSE-POSITIVE CONTROL** — the same key spelled with no whitespace inside the braces | **The two new bodies PASS.** A legal spelling is not false-red. This is the control phase 1 said it owed before spending a rule on anything it fails, and it is discharged by running rather than asserting. |
| D14 | — | `${{ toString }}` in the key beside the event | **ALL 38 GREEN — see finding 2.** |

**D6 in phase 1's numbering — the C4 fixture mutant — WAS NOT RUN, and the
reason is not a refusal:** it grades the criterion split to T-338, and there is
no C4 surface in this diff to mutate. It transfers with the rest of section 4.

**KILL-SET CONTAINMENT.** Under D1 only the two new bodies fire, so their kill
set is not contained by anything the spec already carried. Under D13 the two new
bodies pass where the pre-existing T-294 assertion reds — which is worth naming
because it shows the contrast the card wanted: the old assertion is a literal
spelling check (phase 1's C3-1 shape), the new keeper is a rendering check, and
they are not restatements of each other.

#### THE WHOLE BATTERY, AT MY OWN TIP

`tools/e2e/scripts/gate-run.mjs parser app rust e2e` at 553e4555, on this bench,
port 25336. Verdicts read from the file, never from the wrapper's exit:

    gate-verdict suite=parser exit=0 bodies=454  targets=1  verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1171 targets=1  verdict=GREEN
    gate-verdict suite=rust   exit=0 bodies=661  targets=18 verdict=GREEN
    gate-verdict suite=e2e    exit=0 bodies=1212 targets=1  verdict=GREEN

**ALL FOUR LEGS GREEN.** The e2e leg reports `1212 passed (22.7m)` with NO
`failed` line at all — read as the failed count above the passed line, not as
the last line of the summary.

**THE THREE push-guard REDS DID NOT APPEAR, AS THE SEAT PREDICTED.** Zero
failing push-guard bodies on this detached bench, against three in the fenced
lane worktree. The seat's measurement that they are T-333 and lane-fence-local
is CONFIRMED rather than merely repeated. Both new bodies are green in the
graded leg (✓1168, ✓1169).

Setup was the fresh-worktree order the preflight demands: `lib/parser` npm ci
then build, `app/` npm ci then build, `tools/e2e` npm ci. The app leg's 12-of-840
class was not hit, because the bundle was built before anything ran.

#### FIGURES, EACH DERIVED AT MY OWN TIP

- diff base to tip: 3 files, +430 / -12; code alone at 85007c9e: 2 files, +368 / -10.
- bodies in `tools/e2e/tests/workflow-parity.spec.ts`: 36 at d13a5d8c (the
  ground's M6/M10), **38 at 553e4555**, and **zero** `test.skip`/`test.only`.
- graded legs at 553e4555: parser 454, app 1171, rust 661 over 18 targets,
  e2e 1212 in 22.7m.
- census: committed 115997 bytes, a fresh generation 116384 — a delta of 387.
  The committed `## workflow-parity` section carries 36 sentences and neither
  new body name, so the delta IS exactly the two bodies.
- `.github/workflows/ci.yml` restoration sha256 after all fourteen drills:
  `bad8f2811081216564f35ada943e1ef5063ab6f245e777fc039a2964168f1160`.
- workflow files under `.github/workflows/`: one, at both refs.
- job-level `concurrency:` blocks: none, at both refs.

#### FINDINGS — FOUR, NONE BLOCKING, NO CORRECTION ASSIGNED

**1. AN EVIDENCE ROW IN THE EXECUTOR'S REPORT IS VOID.** The report's command
table carries `card-preflight.mjs <the card>` (before and after the card edit),
exit 0, "clean both times". `tools/e2e/scripts/card-preflight.mjs` has NO main
guard and says of itself that it "executes nothing" at import — it is a module
with 41 exports whose runnable half is `brief.mjs --preflight`. Invoking it as a
program loads it and exits 0 having derived NOTHING. I confirmed this by feeding
it a card deliberately broken two different ways: both also exited 0 in silence.

This is instance 1 of the gate-run charter wearing a different costume, and it
is the class this project cares about most, so it is recorded even though the
conclusion survives: **I ran the real arm and the card IS clean** — fence
entries 4, every one reserving a tracked file, `criteria name paths the fence
does NOT reserve: 0`, `criteria demanding a test body this fence cannot hold: 0`,
`paths missing: 0`, rulings 0. The claim was true; its evidence was not evidence.

**2. THE KEEPER'S FAIL-CLOSED CONTRACT HAS ONE HOLE, UNREACHABLE BY ANY VALID
WORKFLOW EXPRESSION.** `GROUP_CONTEXT_HELD_EQUAL[expr]` is a plain property
lookup on a frozen object literal, so it resolves through `Object.prototype`.
Any expression whose text equals a prototype member — `toString`, `constructor`,
`valueOf`, `hasOwnProperty`, `__proto__` and the rest — returns a defined value,
is treated as MODELLED, and is silently substituted. D14 confirms it at the real
file: `ci-${{ github.event_name }}-${{ toString }}-${{ github.sha }}` passes all
38 bodies with nothing reported.

This contradicts the keeper's own stated contract — "What it cannot model it
REPORTS rather than passes over" — and its failure message enumerates the ten
members it models, implying anything outside is reported.

**WHY IT IS NOT A CORRECTION, STATED SO THE NEXT READER CAN OVERRULE ME.** Every
GitHub expression context is dotted (`github.*`, `env.*`, `inputs.*`, `needs.*`,
`vars.*`, `secrets.*`, `matrix.*`, `runner.*`); a bare `toString` is not a valid
context and cannot appear in a workflow GitHub will evaluate. No acceptance
criterion is missed, and no collision goes unreported — a bogus member renders
identically across triggers, so the pairwise check still fires wherever the key
relies on it to discriminate. Assigning a correction would cost the merge a
mutant block and a full end-to-end leg at the merged tree for a hole no legal
input reaches. The remedy is one line, offered rather than imposed:

    const held = Object.hasOwn(GROUP_CONTEXT_HELD_EQUAL, expr)
      ? GROUP_CONTEXT_HELD_EQUAL[expr]
      : undefined;

If the seat wants it, D14 is the body that pins it.

**3. THE BEHAVIOUR CENSUS IS STALE AND THE MERGE OWES THE REGEN.**
`capabilities:check` reds: committed 115997 bytes against a fresh 116384. The
delta is exactly the two new bodies, confirmed by reading the committed section.
`docs/CAPABILITIES.md` is a GENERATED file OUTSIDE this card's fence, so the
executor could not have written it and did not; the report discloses the
staleness rather than hiding it. This is the merge verb's regeneration, and it
must be the last write before the merge commit.

**4. TWO CONVENTIONS SENTENCES ARE NOW NARROWER THAN THE WORKFLOW.**
`docs/conventions/commands.md` says "the concurrency group is `github.sha`" and
that `cancel-in-progress` "now supersedes only a second run over the SAME
commit"; `docs/conventions/gates-and-the-push.md` says "ci.yml's concurrency
group is the COMMIT". Neither is FALSE — same-commit remains a necessary
condition — but neither states the sufficient one, which is now same commit AND
same event. Both files are outside this fence; the second is T-330's. No keeper
reds on them, which I confirmed empirically: the parity spec is 38/38 green at
the tip. A sentence at whichever merge can reach them.

#### TWO NOTES THAT ARE NOT FINDINGS

- `declaredTriggers` assumes the MAPPING form of `on:`. `on: [push, pull_request]`
  would derive `['0','1']` and `on: push` would derive `['0','1','2','3']`. This
  workflow cannot use either form — it needs `push.branches` and `schedule.cron`
  — and the pre-existing exact-trigger-set body reds loudly on both. Not
  fail-open: bogus names still render distinctly under the real key and still
  collide under a broken one. Recorded because the next editor of this function
  should know.
- `GROUP_CONTEXT_HELD_EQUAL` holds `github.ref` and `github.ref_name` equal. The
  executor invited a verifier to press on exactly this. Pressed: for criterion 1
  the direction is strictly CONSERVATIVE — `pull_request` genuinely carries a
  different ref and a different sha, so holding them equal can only OVER-report a
  collision, never miss one. For criterion 2 a ref added to the key would not be
  flagged as breaking same-event collapse, but such a key is caught by criterion
  1's pairwise check anyway (the fixture's mutant 2 pins it), and `push` is
  filtered to `main` so two pushes of one commit cannot carry two refs here. The
  map holds the right members equal.

#### THE FENCE AFTER THE SPLIT — FOR THE SEAT, NOT THE LANE

The card merges with a four-path `touches` of which the diff touches two. The
two the widening added were for the criterion now on T-338. The card's own
record says T-333 cannot be dispatched while this fence is live, so the merge
releases that. This is not a defect and the card preflight does not red on it —
I ran it — but a seat reading `touches` afterwards will find two entries no
criterion of this card needed, and the Scope amendment is where that is
explained.

#### WHAT I COULD NOT REACH

Phase 1 named three GitHub semantics no one here can measure: whether
`cancel-in-progress` is evaluated from the incoming run's workflow file; whether
`github.sha` on a schedule run is the default-branch tip; whether cron runs only
from the default branch. The seat did not assert them and neither do I. **The
implementation does not depend on any of them**: the key is a static string
template, and two different `github.event_name` values produce two different
groups whatever GitHub does with the rest. That is why criterion 1 could be
settled by a static proof instead of by two live run ids, and phase 1's C1-9
allows exactly that.

I did not observe a live schedule and push on one commit both concluding under
the new key. No one could: it requires a nightly to land on a pushed commit
after this merges. The card's own evidence for the DEFECT is four real runs
(ground M5, read from the runs' own `event` fields); the evidence for the FIX is
the key and the keeper.

#### THE GATES THIS VERDICT'S OWN COMMIT OWES

Appending this verdict is a WRITE under `docs/tasks/`, so the tip carrying it is
one nobody has graded. Every figure above was measured at 553e4555, which is not
that tip. The docs gate fires on this path: the card is a code input to
`npm test from app/`, `npm test from tools/e2e/` and `npx vitest run from
lib/parser/`. The readings this commit owes are recorded immediately below,
measured at the commit that carries this verdict.

The derivation answers `app, e2e, parser` — NOT rust — with the end-to-end leg
narrowed to the 12 spec files that own this path. Run at `c8bbde1e`, the commit
carrying this verdict:

    gate-verdict suite=parser exit=0 bodies=454  verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1171 verdict=GREEN
    gate-verdict suite=e2e    exit=0 bodies=731  verdict=GREEN  (SCOPED)

The end-to-end leg read `731 passed (7.2m)` with no `failed` line, and zero
push-guard reds once more. **This is the RANGE form, so its end-to-end verdict is
SCOPED and could not mint a push token** — said plainly, because a scoped green
is not a whole leg and must never be read as one. The whole four legs recorded
above, at 553e4555, remain this verdict's own reading of the lane's work.

The other gates this commit could move, each measured at `c8bbde1e`:

- CARD PREFLIGHT — exit 0: paths missing 0, paths truncated 0, fence entries 4
  each reserving a tracked file, criteria naming paths the fence does not
  reserve 0, criteria demanding a body this fence cannot hold 0, rulings 0.
- DOCS GATE on this path — 0 frontmatter issues, every live card's frontmatter
  parses, injection scan 0 hits against 7 patterns. Its exit 1 is the FIRES
  signal naming this card a code input, and it is byte-identical to the same
  gate's answer before this verdict was appended, which I measured as a control
  rather than assumed.
- THE GRAPH — NOT MOVED, measured rather than argued: the committed graph indexes
  203 files of which ZERO lie under `docs/`, so a card-prose commit cannot move
  it and no regeneration is owed here.
- THE BEHAVIOUR CENSUS — unchanged, 115997 committed against 116384 fresh. So
  finding 3 is still exactly the two spec bodies, and this commit adds nothing
  to what the merge owes.

THE REGRESS, DISCLOSED RATHER THAN HIDDEN. These readings were measured at
`c8bbde1e` and then written into that same commit by amending it, so the sha this
card finally carries is one the readings pre-date by exactly this block of prose.
No run escapes that shape — grading a commit requires the commit to exist first.
What the amend changes is nothing in this repository but these lines, in this
file, which is the single path the derivation above already priced.
