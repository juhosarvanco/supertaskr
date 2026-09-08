---
id: T-219-s8
title: "T-274's `touches: [docs/tasks]` fences the one directory no card may hold, and it reds THREE live-board bodies in the parser suite on main — the lane that met it was cut from a commit whose gates were not green"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219-s6, met as a red baseline at 90038e9, 2026-09-09
blocked_by: []
touches: [docs/tasks/T-274-the-model-experiment-two-fix-passes-run-on-a-smaller-model-and-their-verdicts-compared-on-the-same-measures-before-any-seat-rule-changes.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-274` was filed at `cc5bf50` (2026-09-09) with
`touches: [docs/tasks]`. That is `UNFENCEABLE_PATHS`' only entry — the
directory every dispatch stamp and every closing stamp writes to — so
`expandFence` classifies the token `rejected`, the card's fence is
uncomparable, and **three bodies in `lib/parser/test/fence.test.ts` red
on the live board**:

- `every token on every live card resolves, except the three on T-054 and
  one declared creation target` — gains `T-274 docs/tasks`
- `ONE live card holds the directory the parser refuses, it is 'done',
  and it holds no lane` — gains `T-274 docs/tasks [planned]`, and the
  body's whole point is that the ONE card holding it is `done` and holds
  no lane; `T-274` is `planned`
- `T-219-s4: every ready card the DISPATCH oracle sees has a COMPARABLE
  fence…` — the assertion whose message is *"a planned card cannot be
  dispatched with a fence nobody can compute"*

This is the DOCS GATE's own worked failure mode, third instance: a
commit whose whole diff is `docs/tasks/*.md` matching neither GRAPH REGEN
nor BOOT GATE, redding a code suite through frontmatter.

## Attribution, derived at `90038e9`

- `git merge-base --is-ancestor cc5bf50 90038e9` exits **0**
- `git merge-base --is-ancestor cc5bf50 0b7cecd9` (the newest
  `Checkpoint:`) exits **1**

So `cc5bf50` sits in the window between the checkpoint and the dispatch
stamp — the window `DISPATCH FROM THE LAST CHECKPOINT` calls harmless on
the GRAPH count and explicitly does NOT on the frontmatter one: *"a
docs-only non-merge commit can still red a code suite through
FRONTMATTER (the DOCS GATE), which no graph argument covers — so this
holds by PRACTICE, verified, NOT by property"*. `T-219-s6`'s lane was cut
at `90038e9` and inherited it.

## What to build

- `T-274`'s `touches:` SHALL be narrowed to something fenceable, or the
  card SHALL record that it takes no lane at all and say so by name.
- **AND THE OBVIOUS NARROWING IS ITSELF REFUSED, WHICH IS WHY THIS IS
  NOT A ONE-LINE EDIT.** `T-274`'s work is writing a table on its own
  card, so its only real touch is its own file — and a card whose only
  token is its own file reserves NOTHING once `expandFence`'s carve-out
  is taken. `T-219-s6` made that state `unfenceable` by name (its second
  triage item, and `buildLaneFence` already refused to arm it), so
  `touches: [docs/tasks/T-274-….md]` moves the defect rather than
  repairing it. `T-274` is the live instance of exactly the shape that
  card was routed for.
- The filing-time gap is the class: `brief.mjs --preflight` catches an
  uncomparable fence AT DISPATCH, and nothing catches one at FILING, so
  the card sits on the board redding a suite until somebody dispatches
  it. Whether that gate is owed is TRIAGE's call and is not claimed here.

## Read beside

`T-219` (the containment refusal), `T-219-s6`'s second triage item (the
narrowing that does not help), the DOCS GATE bullet in
`docs/CONVENTIONS.md` and its two recorded instances `9c64cd8` and
`fede266`, `T-160` (the preflight).

## DISCHARGED BY OTHER WORK — `closed_by: ab00399`, 2026-09-09

`status:` stays `suggested` and the disposition is TRIAGE's, per
`docs/CONVENTIONS.md`'s FOURTH QUESTION: *"resolved by other work" is not
a fourth move and `closed` is not a ninth status*.

Found while deriving this lane's merge forecast, not by asking. The
architect seat repaired it on `main` at **`ab00399`** — *"T-274's fence
named the unfenceable directory (docs/tasks) — the seat's own debris …
the card's fence is `docs/research/` (it is a measurement the seat
writes), the lanes cut in between attribute the red at their base"* —
which is both remedies at once: a token that resolves, and NOT the
own-file narrowing this card warned would move the defect rather than
repair it.

**MEASURED ON THE MERGE FORECAST**, `git merge-tree --write-tree main
HEAD` at `main` `b825e879` and `T-219-s6` `9a0a747`, wrapped in a
throwaway `git commit-tree` (`e782388`, no ref points at it) and checked
out detached: `npx vitest run` from `lib/parser/` exits **0** with
**388 passed of 388**. So the three bodies this card was filed for are
green the moment `T-219-s6` merges, and the only thing left of this card
is the filing-time gap its last bullet names — which is TRIAGE's to
promote or park, not a lane's.
