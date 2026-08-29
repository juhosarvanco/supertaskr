---
id: T-153-s8
title: The generated capabilities census is STALE on main by one behaviour, and neither CI nor any spec can say so — the check exists, is documented nowhere in "Build & test", and runs in no pipeline
feature: F-01
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/CAPABILITIES.md]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder:
verifier:
built_by:
verified_by:
review:
---

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
