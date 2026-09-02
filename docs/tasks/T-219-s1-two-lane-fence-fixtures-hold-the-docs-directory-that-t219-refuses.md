---
id: T-219-s1
title: "Two lane-fence fixtures declare a bare `docs` token, which T-219's containment refusal now rejects — the specs pin a fence no card may hold and red at the parser change that retires it"
feature: F-06
milestone: 4
size: S
priority: 1
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-219's fence is `lib-parser` and this half is in `tools/e2e`, so it is
routed rather than built** (`method/roles/executor.md`: a criterion that
cannot be built inside the fence is recorded and routed, never
performed). It is not a suggestion in the improvement sense: **T-219's
merge reds the e2e lane by exactly these two bodies until this lands**,
and the two commits belong in one landing.

## Measured

At `3858818` (T-219's lane tip), `node tools/e2e/scripts/gate-run.mjs
e2e` from the lane root with `NPUTER_E2E_PORT=15219`:
`gate-verdict suite=e2e exit=1 bodies=554 verdict=RED`, **2 failed / 552
passed**, and both failures are in `tools/e2e/tests/lane-fence.spec.ts`:

- `tests/lane-fence.spec.ts:987` — *the three carve-outs each free a
  DIFFERENT write, and the fence still holds around them*
- `tests/lane-fence.spec.ts:1711` — *`excluded` PARTICIPATES — a card's
  own file is not a collision with the lane that holds its directory*

Both die inside `buildLaneFence`'s `fence.unusable.length > 0` refusal,
quoting T-219's own new sentence, so the attribution is direct and needs
no measurement at the base:

    lane-fence: T-901's fence carries 1 token(s) this expansion could not
    resolve — "docs". … entry "docs" fences 'docs', which CONTAINS
    'docs/tasks' … (T-108, T-219)

## Why the fixtures cannot simply keep the token

Both fixtures fence the bare `docs` precisely because it is the domain
that contains the lane's card, the other cards' stamps, this seat's
standing writes and an ordinary refused path — one token reaching all
four carve-outs. **T-219 is the ruling that no fence may reach the first
two that way**, so the fixture has to name the pieces. The property each
body pins is unchanged and reachable; only the spelling of its fence
moves.

## What to build

- `tests/lane-fence.spec.ts:987` SHALL arm its fixture with a fence that
  names its pieces instead of swallowing `docs/tasks` — the shape that
  reaches all four assertions is
  `touches: [tools/e2e, docs/tasks/<the fixture card>, docs/STATE.md,
  docs/checkpoints, docs/ROADMAP.md]`: the card file lands in
  `excluded` exactly as the body already asserts (`expandFence` drops a
  token that IS the own file), `docs/ROADMAP.md` stays inside the fence
  so the discriminating half still blocks, and the
  unfenceable-directory and standing-write carve-outs are unaffected
  because neither is computed from `paths`. Its
  `expect(manifest.paths).toContain("docs")` moves to the domains the
  new fence declares.
- `tests/lane-fence.spec.ts:1711` SHALL give its sibling lane a fence
  that carves out its own card WITHOUT holding `docs/tasks` — e.g.
  `touches: [docs/rooms, docs/tasks/T-902-a-sibling-lane.md]`, which
  keeps `excluded` equal to that card file (what the body asserts) and
  keeps `paths` non-empty, which `buildLaneFence` requires separately.
- A BODY SHALL PIN THE NEW REFUSAL AT THIS CALL SITE, so the
  disappearance of the `docs` fixtures is not the only trace of the
  ruling: arming a lane whose card declares a token containing
  `docs/tasks` SHALL be refused by `buildLaneFence`, naming the token
  and the unfenceable path.
- The suite SHALL be green at the merged tree, measured with
  `gate-run.mjs e2e` and read as a COUNT.

## Read beside

`T-219` (the refusal, and the lane that measured this), `T-154` /
`T-154-s2` (the write-time guard these bodies are about),
`method/lane-protocol.md` rule 5.
