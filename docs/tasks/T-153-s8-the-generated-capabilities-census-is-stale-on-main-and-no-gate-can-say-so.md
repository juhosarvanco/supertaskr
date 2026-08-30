---
id: T-153-s8
title: The generated capabilities census has no keeper — `capabilities:check` is in no pipeline, no CONVENTIONS command bullet and no spec, so the figure is true only while someone remembers by hand (the one-behaviour staleness this was filed for is discharged at cc82dc2)
feature: F-01
milestone: 4
priority: 4
size: S
status: planned
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/CAPABILITIES.md]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder:
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
