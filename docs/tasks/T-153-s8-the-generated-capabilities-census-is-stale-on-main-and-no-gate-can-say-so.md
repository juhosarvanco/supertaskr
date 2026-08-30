---
id: T-153-s8
title: The generated capabilities census has no keeper — `capabilities:check` is in no pipeline, no CONVENTIONS command bullet and no spec, so the figure is true only while someone remembers by hand (the one-behaviour staleness this was filed for is discharged at cc82dc2)
feature: F-01
milestone: 4
priority: 4
size: S
status: building
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/CAPABILITIES.md]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder: claude-opus-5@subagent
verifier:
built_by:
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