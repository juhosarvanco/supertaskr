---
id: T-127-s7
title: docs/ARCHITECTURE.md's derived slug block is a FOURTH enforcing copy of the registry, it reds `brief.spec.ts` the moment a component is declared, and it sits outside every fence T-127, T-127-s1 and T-127-s6 could carry
status: suggested
suggested_by: executor claude-opus-5 @T-127-s6
---

**T-127-s6 landed the four-node partition and left one file stale that
its fence cannot reach.** `docs/ARCHITECTURE.md` carries a derived slug
block, and `tools/e2e/tests/brief.spec.ts:439` — *"THE SLUG MAP COMES
FROM THE FIELD, and the prose block is compared rather than trusted"* —
asserts that block EQUALS the `touch_slugs:` fields for every slug. The
block is prose the architecture doc's own paragraph describes as
"Derived mechanically from `docs/architecture/components/C-*.md` at this
compaction", and nothing re-derives it.

## Measured at `f0ff62d` (T-127-s6's lane tip), read from `brief.mjs --task T-127-s6`

    app-board -> C-08, C-09, C-11, C-17, C-18   <- the FIELDS
    prose block diverges: app-board: field says C-08, C-09, C-11, C-17,
      C-18 and the prose block says C-08, C-09, C-11

`brief.mjs` itself does NOT red — it reports the divergence as a
finding, which is the design row 5 describes. The spec that DOES red is
`brief.spec.ts`, and it is a `npm test` from `tools/e2e/` body.

## The repair, spelled out so it is one edit and not a judgement

`docs/ARCHITECTURE.md`, the four-space-indented block under **THE SLUG
MAP'S AUTHORITY IS EACH COMPONENT FILE'S OWN `touch_slugs:` FIELD**.
One line moves:

    app-board    -> C-08, C-09, C-11   app-map  -> C-12

becomes

    app-board    -> C-08, C-09, C-11, C-17, C-18   app-map  -> C-12

The parser is `slugMapFromProse` in `tools/e2e/scripts/dispatch-brief.mjs`:
lines starting with four spaces, matched by
`/([a-z][a-z-]*)\s+->\s+((?:C-\d+)(?:,\s*C-\d+)*)/g`. Keep the indent.

**Two more sentences in the same file go stale with it and are NOT
asserted by any suite** — list them in the same edit rather than leaving
a half-repaired doc:

- *"The full component set — C-08 board, C-09 model store, C-10 docs
  watcher, C-11 design tokens, C-12 map pane, C-13 genesis pane, C-14
  agent runner, C-15 dispatch, C-16 shared primitives — is the
  registry"* omits C-17 Board model and C-18 Board root.
- *"pinned by three live-tree fixtures"* was already wrong about
  membership before this card (`T-127-s1` finding 5) and is now wrong
  about the count too — see `T-127-s8`.

## Why T-127-s6 did not do it

`docs/ARCHITECTURE.md` is in NO slug and matches NO fence token. Checked
against the armed manifest rather than by eye — `.nputer/lane-fence.json`
at `fc45724`, whose `paths:` array is the 20 paths of
`[docs/architecture/components/, app-map, crate-index]` — and the
comparison is a case-sensitive PREFIX, so `docs/ARCHITECTURE.md` is not
covered by the `docs/architecture/components` entry that looks nearest to
it. Widening a fence from inside the lane is the one repair an executor
may never make (`method/roles/executor.md`).

**This is the THIRD generation of the same failure on one card**, and the
first two are recorded on `T-127-s1` and `T-127-s6`: T-127's fence could
not reach the two app fixtures, T-127-s1's could not either because T-149
had moved them, and T-127-s6's reaches all three enforcing copies it was
derived against and not the fourth nobody had found. The fence was
derived from `docs-gate.mjs --census`, which does not see this reader —
that gap is `T-127-s8` and is the part worth fixing.

## Fence

`[docs/ARCHITECTURE.md]` — a path token, since the file is in no slug.
It touches no code and no other document. Note that CONVENTIONS' DOCS
GATE fires on it: `docs/ARCHITECTURE.md` is read by
`tools/e2e/tests/brief.spec.ts` through `architectureText()`, so the
owed suite is `npm test` from `tools/e2e/`.
