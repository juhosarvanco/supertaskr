---
id: T-127-s4
title: A touch_slugs edit is invisible to every suite in this repository — the field that decides who may edit what has no gate at all, measured 973 of 973 green under a change
status: parked
suggested_by: executor claude-opus-5 @T-127
---

`touch_slugs:` is what a card's `touches:` expands to. It is the field
that decides which lane may edit which file, and **nothing in this
repository can tell when it moves.**

## Measured on T-127's lane at `afe23c1`

One line changed in `docs/architecture/components/C-10-docs-watcher.md`:

    - touch_slugs: [app-shell]
    + touch_slugs: [app-watcher]

read back with `git diff` before the run. Then, from `app/` with the
tree built in the documented order:

    npm test        ->  47 files, 973 / 973 passed, exit 0

**Green.** Restored afterwards, sha256 identical.

The change is not a no-op: at that ref **20 live cards name `app-shell`**
in `touches:`, so C-10's task rollup went from 20 cards to zero. Ten
`app/test/*` files mention `touchSlugs` and every one of them builds its
own synthetic registry; `app/test/architecture-dogfood.test.ts` derives
over the live tree but pins statuses it computes rather than literals, so
the rollup can move underneath it. The Rust reader parses the line and
`arch` never prints it. `lib/parser`'s smoke test pins ids, not slugs.

## Why this is worth a card rather than a shrug

The contrast is the argument. **DECLARING a component is loud** —
CONVENTIONS devotes a gotcha to the three live-registry fixtures it moves,
and T-127 measured the smallest `paths:` re-partition redding `npm test`
at 6 of 973. **Re-drawing a FENCE is silent.** The louder edit is the one
that changes a diagram; the silent one is the one that changes who may
write to a file, and a lane that believes it holds a path it no longer
holds is the disjointness bug `T-111-s1` recorded from the other side.

## Shapes, not a prescription

- A pin over the live registry asserting the slug→path map — the shape
  `snapshot_version_matches_the_live_method_stamps` already uses for the
  method version, which CONVENTIONS calls an ENFORCED pin rather than
  bookkeeping.
- Or a card-input check: every slug named by a live card's `touches:`
  resolves to at least one component's `touch_slugs:`, which would also
  catch a card fenced on a word that no longer exists.
- Or the DOCS GATE's own arm: `docs/architecture/components/**` already
  triggers it, and the slug map is exactly the kind of derived fact that
  gate exists to keep honest.

**MARKED UNVERIFIED**: none of the three was built or measured. The
diagnosis above was.

## Fence

`[crate-index]` or `[tools/e2e]` depending on which gate takes it, plus
`[app-shell]` if the pin lands in `app/test/**`. Read beside `T-127-s2`,
which is the change this absence would let through.

Amnesty triage 2026-08-29 (triage seat): PARKED — the measurement is unarguable — one line changed in C-10's touch_slugs: took its task rollup from twenty cards to zero and npm test answered 973/973 exit 0 — and the contrast is the argument: DECLARING a component is loud enough to have its own CONVENTIONS gotcha, while RE-DRAWING a fence is silent. It is held rather than promoted for one reason: T-154 is a LIVE LANE building write-time fence enforcement with a dispatch-time manifest, and whether that manifest closes this is not knowable until it lands. RESURFACES: the merge of T-154 — at which point the next seat SHALL re-derive whether the dispatch-time manifest sees a touch_slugs: edit, and if it does not, this is owed. All three remedy shapes on this card are MARKED UNVERIFIED and none was built.
