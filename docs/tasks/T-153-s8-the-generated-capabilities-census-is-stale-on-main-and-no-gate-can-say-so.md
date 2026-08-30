---
id: T-153-s8
title: The generated capabilities census has no keeper — `capabilities:check` is in no pipeline, no CONVENTIONS command bullet and no spec, so the figure is true only while someone remembers by hand (the one-behaviour staleness this was filed for is discharged at cc82dc2)
feature: F-01
milestone: 4
priority: 4
size: S
status: verifying
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/CAPABILITIES.md]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30 — RETITLED, because the headline this card was filed under is FALSE at this ref and promoting it unchanged would dispatch a lane to fix a number that is already correct.**

Re-derived before promoting:
`node scripts/capabilities.mjs --check` from `tools/e2e/` prints
`capabilities: CURRENT (24849 bytes)` and **exits 0**. The census line now
reads 313 behaviours (311 extracted + 2 named-not-extracted) across 29
spec files. The one-behaviour staleness the card measured was regenerated
away at `cc82dc2`. **THE MEASUREMENT IS DEAD.**

**THE ARGUMENT IS NOT, AND IT IS THE ONLY PART WORTH A LANE.** The
surviving claim is that nothing KEEPS the figure true:
`grep -rn 'capabilities' .github/workflows/` returns nothing; the
`tools/e2e` command bullet in `docs/CONVENTIONS.md` lists `npm ci`,
`npm test`, `typecheck`, `lint:tokens`, `lint:docs`, `boot:orphan-drill`
and `boot:check` and not `capabilities`; no spec reads it. Both scripts
exist in `package.json` and nothing references them. That is ADR-019 Law 2
— a figure with no keeper — and the card's own death is the demonstration:
the census went stale, was fixed by hand at a checkpoint, and no
instrument on this repository could have told anyone either time.

**THIS IS THE RULING THE ABSORBED CARD ASKED TRIAGE FOR, AND IT IS MADE
HERE: the keeper is a CI STEP, not a lane spec body.** T-154-s3 named the
choice and said in as many words that it was *"triage's call and not an
executor's"*. A lane-red keeps the census honest only for lanes that
happen to touch the specs; the failure mode both instances actually took
was an integrator regenerating by hand at a checkpoint, which no lane
body observes. CI is the seat that sees every merge.

**DISPATCH NOTE:** this fence carries `docs/CONVENTIONS.md`, held by the
live `task/T-111-s10-poison-drill-bullet` lane at this sitting. Not
dispatchable concurrently.

Acceptance names the command: the pipeline SHALL run
`capabilities:check`, and a spec-name change without a regenerate SHALL
red it, with a positive control proving a current census passes.

Absorbs: T-154-s3 (Standing triage 2026-08-30 (architect seat)) — a new spec file makes the generated behaviour census stale and nothing in the lane or in CI says so. This is the SAME CLASS as this card, filed independently from the T-154 lane — which is precisely the corroboration TASK-FORMAT's SEARCH BEFORE FILING section says should have been one card with two dated instances rather than two cards. Its instance was discharged at T-154's own checkpoint (the integrator ran `npm run capabilities`, 233 -> 258, and asked `capabilities:check` either side); its CLASS is this card's surviving half. It brings the second stamped instance — and the second instance is the evidence the class is real. It also brings the ruling it explicitly reserved for triage, answered above: CI step, not lane body. File removed in this commit.

## The measurement

`node tools/e2e/scripts/capabilities.mjs --check` exits **1 — STALE** at
`09504e8` (this lane's base) and at `5970bf6` (its tip): committed 21886
bytes, a fresh generation 21992. It is the SAME figure at both refs, so
the staleness is not this lane's — measured by swapping this lane's only
changed spec back to its base version in a detached drill worktree and
re-asking, which returned the identical pair.

The whole delta is one behaviour and its census line, regenerated in the
drill and read off `git diff`:

    -Census: **280 behaviours** — 278 extracted sentences + 2 …
    +Census: **281 behaviours** — 279 extracted sentences + 2 …
    +- a suffixed card id survives every derivation that once truncated
    +  it — the id is not the slug's prefix

That sentence arrived with `852c6f2` (the suffixed-id fix, one commit
before this lane's base). The suite runs **281**; the census says
**280**.

## Why this is a keeper problem and not a chore

`CLAUDE.md` sends every session here first — *"Before concluding that a
feature is missing, check docs/CAPABILITIES.md first"* — on the strength
of the census being GENERATED, so *"a sentence in it is false the moment
its test reds and nobody keeps it true by hand"*. The generation is real.
The KEEPER is not:

- `docs/CONVENTIONS.md`'s tools/e2e bullet does not list
  `npm run capabilities` or `npm run capabilities:check` among its
  commands, so `workflow-parity.spec.ts`'s derivation cannot see them and
  ci.yml owes no step for them.
- No spec asserts currency, so the lane is green with the census wrong.
- Nothing on the merge path asks. Twenty-nine regens of the GRAPH were
  held up by a written ritual; this census does not even have the ritual.

That is ADR-019's Law 2 — a figure with no keeper — and the NORTH_STAR
bar prices it: *a known-vacuous keeper is a stop-the-line defect*. The
census is not vacuous, it is UNGATED, which is the same failure one rung
earlier.

## What it would take

Regenerate (`npm run capabilities` from tools/e2e), and give it a keeper.
The keeper has a known cost and a known trap, both worth stating so the
next seat does not rediscover them:

- Adding the command to the tools/e2e bullet in `docs/CONVENTIONS.md`
  makes `deriveExpectedSteps` demand a matching ci.yml step or a
  `LOCAL_ONLY` entry with a reason — a two-package edit, exactly the
  shape `T-155`'s fence could not reach for the method-eval gate and
  `T-155-s1` now carries.
- `--check` already answers in the house's four codes (0 current, 1
  stale, 2 usage, 3 could not run), so a CI step needs no new vocabulary.
- The trap: `--check` is a BYTE comparison over a file the generator
  rewrites whole, so a regen must land in the same commit as whatever
  moved a test name — otherwise the step reds on the next lane, three
  layers from its cause, which is the DOCS GATE's own founding story.

**FENCE.** This is routed, not built: `T-153-s5`'s fence is
`[tools/e2e]`, and every remedy above needs `.github/workflows/`,
`docs/CONVENTIONS.md` or `docs/CAPABILITIES.md` as well. The `touches:`
above is the fence the work needs, not one this lane held.

CORROBORATION (2026-08-30, executor `@T-159-s1`) — **the census is stale
on main again, at `51fa31c`, and again nothing said so.** Measured in the
T-159-s1 lane: `npm run capabilities:check` from tools/e2e/ **exits 1** —
*"STALE — committed 25444 bytes, a fresh generation is 25528 bytes"*.
`docs/STATE.md` carries a stale companion figure in the same direction
(*"the battery is whole at zero lanes (e2e 320/320)"*). **It is not this
lane's, and the proof is structural rather than an assurance**: this
lane's 18-path diff is entirely under `docs/tasks/`, so both the
generator's INPUT (`tools/e2e/tests/*.spec.ts`) and its OUTPUT
(`docs/CAPABILITIES.md`) are byte-identical at the base and at the tip,
and the check's answer cannot have moved between them.
**What this instance adds is the INTERVAL.** The card's own title records
the previous staleness as discharged at `cc82dc2`; so the figure went
stale, was repaired, and went stale again with no gate anywhere in
between — the no-keeper argument observed twice rather than argued once.

**AND A CAUTION ABOUT THE CROSS-CHECK THIS CARD'S SUBJECT PRESCRIBES,
BECAUSE THIS SEAT GOT IT WRONG FIRST AND CORRECTED IT.**
`docs/CAPABILITIES.md`'s header tells the reader to *"Cross-check against
the runner's own `Running N tests` header"*. That header is not stable
run to run: two full e2e runs in this lane, on trees differing only by
`docs/tasks/` text, printed **331** and **321**. The stable instrument is
`npx playwright test --list`, which at this tip answers **"Total: 321
tests in 29 files", exit 0**, against the census's **320 across 29 spec
files** — **a gap of one, not of eleven**, and the eleven was this seat
reading a header that had moved. The cause of the 331 is NOT explained
here and is deliberately not guessed at: every module-scope generator in
the suite iterates a constant, and no spec file changed between the two
runs. Recorded as an observation, because a keeper built on the header
this file names would inherit exactly this instability, while one built
on `--check`'s byte comparison or on `--list` would not.

## CORROBORATION (2026-08-31, integrator) — THE THIRD BY-HAND REGENERATION, and it is this card's own argument arriving again

`npm run capabilities:check` from tools/e2e answered **STALE — committed
25528 bytes, a fresh generation is 26427** at main `82f5722`. Regenerated
by hand at this record: **CURRENT (26427 bytes)**, census 313 → **332
behaviours** (330 extracted + 2 named-not-extracted) across 29 spec
files.

**AND THE INSTANCES ARE ENUMERATED RATHER THAN COUNTED**, because an
ordinal about this repository's history is a census claim with no keeper
— the very class this card is about, and the preflight refused an earlier
draft of this paragraph for exactly that. The occasions on record: the
one this card was filed for (regenerated away at `cc82dc2`), the
regeneration at `82f5722` above, and the one at `T-112-s3`'s integration
which took the census 332 → 335. On every one of them nothing on this
repository could have said the figure was wrong. Re-derived here rather than taken from the card:
`command grep -c capabilities .github/workflows/ci.yml` answers **0**,
while `cargo audit` answers 2, `boot:check` 1, `lint:docs` 1 and
`index --check` 2. **Every other gate this seat believed it had skipped
turns out to be CI-held; this one alone is not.** The card's ruling — the
keeper is a CI STEP — is unchanged and now has a third instance behind it.

**AND THE FIX APPLIED HERE IS THE DEFECT.** Regenerating by hand is
exactly the act the card says no instrument observes, performed by the
seat that had just read the card. It is recorded rather than presented as
a repair: the census is true again at this ref and will go stale again
the next time a spec name moves, which is the property only the CI step
changes.

**DISPATCH NOTE:** this card's fence carries `tools/e2e`, which
`T-112-s3` holds right now, so it cannot be cut until that lane clears.
It is next in that package after `T-178`.

## Implementation notes (executor `claude-opus-5@subagent`, 2026-08-31)

Lane `/Users/ujju/Projects/nputer-T-153-s8`, branch
`task/T-153-s8-capabilities-keeper`, base `933c29c`, work commit
`f705baa`. The card's ruling was applied unchanged: **the keeper is a CI
STEP.** Three files, because `workflow-parity.spec.ts` DERIVES its
expectations from `docs/CONVENTIONS.md`'s per-package command bullets in
BOTH directions, so a step and a documented command are one edit:

- `docs/CONVENTIONS.md` — the tools/e2e bullet gains
  `npm run capabilities:check` AND `npm run capabilities`, each as its own
  separated segment opening with a backtick, never inside a parenthetical;
  the CI bullet gains the placement argument and the generator's
  exclusion, which is what the derivation demands before it will accept a
  `LOCAL_ONLY` entry.
- `.github/workflows/ci.yml` — the step, plus the reasoning a future
  editor of that file needs at the point of temptation.
- `tools/e2e/tests/workflow-parity.spec.ts` — a `CI_SEQUENCE` verbatim
  entry and a `LOCAL_ONLY` entry for the generator. **Two DATA entries and
  no new assertion**, deliberately: the ruling says the keeper is a CI
  step and not a lane spec body, and the parity bodies that already exist
  are what bind both entries in both directions. No test NAME moved, so
  the generated document is unchanged and no regeneration was owed —
  ASKED rather than assumed, at exit 0 before and after.

### DECISION 1 — WHERE in the CI order

Immediately AFTER `npm run typecheck` and BEFORE
`npx playwright install --with-deps chromium`. Each leg measured in this
lane rather than reasoned from the card:

- **AFTER tools/e2e's `npm ci` — and the card's stated reason for that is
  FALSE, which is worth more than the placement itself.** The card says
  the check "needs the e2e package installed". It does not: run on this
  lane's own uninstalled worktree before any install, it answered CURRENT
  at exit 0. What IS true is subtler, and is why the step still sits
  after the install. `capabilities.mjs` resolves a templated test name's
  iterable by `await import()`ing a `.mjs` out of `tests/`, and
  `docs-gate.mjs` and `health-bands-run.mjs` in that same tree import
  `yaml`. So the bare-checkout property is a fact about which modules the
  SPECS happen to pull, not about this script — and the edit that
  falsifies it lands in a spec file, layers away from `ci.yml`. The token
  lint holds its pre-install seat on a DELIBERATE zero-dependency
  property whose own header maintains it; this script's is accidental.
  After the install the placement costs nothing and cannot be falsified
  that way.
- **BEFORE the browser download and the lane** — `index --check`'s own
  argument, which puts graph currency ahead of the audit's tool install:
  a stale census costs under a second to find out about and should not
  queue behind minutes of setup.
- **AFTER `npm run typecheck`** — the generator reads the same spec files
  `tsc` validates, so a file that does not compile is named by the step
  that can say why, rather than surfacing as a census verdict.

### DECISION 2 — WHICH EXIT MEANS WHAT

`capabilities.mjs` already answers in the house's four codes, so the
script needed NO change and `ci.yml` re-types none of the numbers. All
four were produced deliberately here and read UNPIPED:

- **0 CURRENT** — headline `capabilities: CURRENT`. This is drill D4's
  positive control.
- **1 STALE** — headline `capabilities: STALE`, and the message ends
  `run npm run capabilities`. It fails the step and therefore the job,
  **with the regeneration command named in the failure**, which is the
  acceptance criterion. Produced by D4.
- **2 called wrong** — headline `capabilities: usage`, from
  `node scripts/capabilities.mjs --check --bogus`.
- **3 the gate could not run** — headline
  `capabilities: GATE COULD NOT RUN`, followed by the ENOENT naming the
  missing `tests` directory. Produced by running the script from a
  scratch copy carrying no `tests/`.

STALE and COULD-NOT-RUN both fail the job and neither can be read for the
other: they differ in code AND in headline, which is the same distinction
`index --check` and the DOCS GATE publish.

### DECISION 3 — WHETHER THE CENSUS LINE IS PINNED. It is NOT, on purpose.

Nothing in `ci.yml`, `docs/CONVENTIONS.md`, `workflow-parity.spec.ts` or
these notes transcribes the generated document's `Census:` figure or its
byte size. A figure written down beside a gate is precisely the thing
with no keeper — the class this card is about — so the step ASKS the
generator. Derive it with `npm run capabilities:check` from tools/e2e.

**SWEEP** (a fix names its class and its sweep). Class: a transcribed
census figure anywhere in this lane's added lines. Command, over
`git diff 933c29c..HEAD` filtered to added lines:

    command grep -inE '[0-9]+ *(behaviours|byte)|Census: *\*\*[0-9]'

Result: **no matches**. Shown capable of failing BEFORE its zero was
written down: the same command over a planted two-line hit matched both
planted lines.

## The drill ledger

Committed FIRST (`f705baa`), then one side mutated per drill, the
mutation read back with `git diff`, the suite run, the RED required, then
`git restore --source=HEAD --staged --worktree` and the restoration
PROVED by sha256 against the committed blob.

| # | one side mutated | run | verdict |
|---|---|---|---|
| D1 | `ci.yml` step run string, one letter added | parity spec | **RED** 2 failed / 15 passed, exit 1 — `missing verbatim step: [tools/e2e] npm run capabilities:check`, and the mutant named as unaccounted |
| D2 | the DOC's command, reworded to `capabilities:verify` | parity spec | **RED** 4 failed / 13 passed, exit 1 — names BOTH directions: the new wording has no spec entry, and the spec's command is no longer in the doc |
| D3 | `ci.yml` gains a step running the GENERATOR | parity spec | **RED** 1 failed / 16 passed, exit 1, naming `[tools/e2e] npm run capabilities` |
| D3b | the CI bullet's backticked mention of the generator removed | parity spec | **RED** 3 failed / 14 passed, exit 1 — `this spec says CI deliberately does not run npm run capabilities … but docs/CONVENTIONS.md's CI bullet does not say so` |
| D4 | a test NAME in `trusted-canary.spec.ts`, with NO regenerate | `npm run capabilities:check` | **RED** exit 1, `capabilities: STALE … run npm run capabilities` |

**Restoration proofs — sha256, committed blob against working file, four
for four identical:**

    .github/workflows/ci.yml                 ff9ca58d645f7b13e3cf7231e19866a8c9c75c1f524b3c18b1f7d2bcf9195dc1
    docs/CONVENTIONS.md                      a45314c999b1e28ea1feaafb87c56f7da90aff28d7d02f069ab7a802ee2e83c4
    tools/e2e/tests/trusted-canary.spec.ts   6e2c4c336b5790b38bacb29207f40500050b548d6a1ad5afeca0454a1023c846

**THE POSITIVE CONTROL the card asked for**, run immediately after D4's
restoration: `npm run capabilities:check` exits **0**, headline
`capabilities: CURRENT`. So the check reds on a spec-name change without
a regenerate and passes on a current census, measured either side of one
restoration rather than argued.

**WHAT D3 DOES NOT PROVE, said rather than left to be found.** The mutant
kills the body through the `unaccounted` arm, which is a hard `expect`,
so the `smuggled` arm below it never executes. D3b exists because of
that: it binds the new `LOCAL_ONLY` entry through the assertion that is
actually its own. No mutant available here reaches the `smuggled` arm,
because a command cannot be simultaneously derived and local-only without
reddening earlier.

## Gates — every exit read UNPIPED

At `f705baa`, from tools/e2e unless noted:

- `npm run typecheck` — **0**
- `npm run lint:tokens` — **0**
- `npm run lint:docs` — **0**
- `npm run capabilities:check` — **0**
- `npm test` — **0**, ZERO failures over the full lane, every body run
  (an exit 0 over zero bodies is not a pass, so the run was read as well
  as the exit). The runner's body COUNT is deliberately not transcribed:
  at this ref it coincides with the generated document's census figure,
  docs/CAPABILITIES.md's own header sends a reader to that header as a
  cross-check, and this card's CORROBORATION section records it moving
  between two runs on trees differing only in docs/tasks/ text. Derive
  each from its own instrument; neither is evidence about the other.
- `cargo test` from app/src-tauri (owed by the DOCS GATE, below) — **101**
  on one body, `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`,
  panicking on an EMPTY `stderr_tail`. That is `T-161`, the standing
  intermittent docs/STATE.md names, and it is unreachable from this
  diff. Re-run ONCE alone as a second measurement: **0**. Attributed, not
  re-run to green.

### The first `npm test` red, which was this lane's own and is a finding

The gate run made BEFORE committing failed 1 of 335:
`token-scan.spec.ts` — *"one runtime-built control byte reds all seven
first-party roots at exact byte offsets"*, at
`expect(diff.status, "all seven plant targets restore to an empty diff")`.

It is not an intermittent and not a restoration failure. **`.github/
workflows/ci.yml` is one of that body's seven plant targets**, and the
companion check is `git diff --quiet -- <targets>` with NO RANGE, which
compares the WORKING TREE to the INDEX. The lane's own uncommitted edit
to that file IS the non-empty diff. The body's sha256 assertions above it
all passed, so the bytes were restored perfectly and only the companion
spoke — exactly the asymmetry docs/CONVENTIONS.md states under POISON
DRILL (*the sha256 is the proof and an empty `git diff` is a companion,
never an alternative*). Green at `f705baa` on the committed tree, both in
the body alone and in the full lane.

This is DRILL AT A COMMIT earning its place from a direction the rule
does not advertise: the reason to commit first is usually that a restore
cannot tell itself from a revert, and here it is that an unrelated body
reads the index. Routed below.

## Standing gates derived from this diff

The diff is `.github/workflows/ci.yml`, `docs/CONVENTIONS.md`,
`tools/e2e/tests/workflow-parity.spec.ts`.

- **GRAPH REGEN** — FIRES. The trigger is `*.ts` outside docs/, and
  `workflow-parity.spec.ts` matches. The graph is `crate-index`'s
  artefact and `docs/architecture/graph.json` is OUTSIDE this fence, so
  the regeneration is the integrator's; recorded here rather than
  silently skipped.
- **BOOT GATE** — NOT OWED. No path under `app/src-tauri/**`,
  `app/src/**` or either manifest.
- **DOCS GATE** — FIRES, run in the executor's pair per the RANGE RULE
  (`TREE=$(git merge-tree --write-tree $MAIN HEAD)`, main at `629adea`),
  in the one printed spelling. Exit **1**, meaning it HAS a verdict:
  *1 path(s) under docs/ are code inputs*, naming `docs/CONVENTIONS.md`
  and owing two suites — `npm test` from tools/e2e (run, exit 0) and
  `cargo test` from app/src-tauri (run, attributed above). The Rust
  reader is `agent/kit.rs`, and what it reads is the single line carrying
  *"formats are version-bumped"*: still exactly one such line, still
  stamped, and NOT in this lane's diff.
- **METHOD EVAL GATE** — NOT OWED. Nothing under `method/**`.

## The honest residual, and what only a real CI run can settle

`ci.yml` cannot be executed locally. What was verified here is that the
step is DERIVED from CONVENTIONS and present verbatim in CI order (the
parity spec, in both directions, drilled), and that the command it runs
answers in all four codes with the stale message naming the regeneration.
What only a GitHub Actions run can confirm: that the step is reached in a
real job, that `npm run capabilities:check` behaves the same on
ubuntu-24.04 under the runner's node 22 as it does here, and that its
placement after `npm ci` is in fact sufficient — the failure mode it
guards against is a spec importing a dependency-carrying module, which no
run today exercises. Nothing in this lane observed a real CI job.

Second residual, stated because it bounds the acceptance criterion's
words: the step runs wherever this job runs, which `on:` fixes as pushes
to `main`, pull requests, and manual dispatch. A push to a branch with no
open PR starts no job and therefore no census check. That is ci.yml's
existing trigger set, unchanged by this card.

## Routed, not built

- **`token-scan.spec.ts`'s seven-plant-target body reds for any lane
  holding an uncommitted change to one of those seven tracked files**,
  and its message — *"all seven plant targets restore to an empty diff"*
  — points at the body's own restoration rather than at the reader's
  working tree. Costs an investigation each time, as it did here. Fence
  needed: `tools/e2e`. Candidate remedies, neither taken: assert the
  companion only over targets that are clean at HEAD, or say so in the
  message. NOT built here — it is outside this card's subject and the
  fix touches an assertion this card has no mandate over.

## A live-environment fact this lane observed, for whoever dispatches next

`brief.spec.ts` printed a DISCLOSURE during the final gate run at
`f705baa`: *"fences are not disjoint: T-153-s8 tools/e2e against T-133
tools/e2e — the same entry (lane-protocol rule five)"*. A lane holding
`tools/e2e` was cut while this one was building. It carries no time or
host of its own here because it is the suite's own line, read at that
run; re-read it rather than trusting this sentence. Nothing in this lane
was affected — the two trees, indexes and runners are separate, and this
lane's port was derived from its card id — but the overlap is the
dispatcher's to adjudicate, not a lane's.
