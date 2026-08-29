---
id: C-09
name: Detail panel
layer: app
paths:
  - app/src/components/board/TaskDetailPanel.tsx
  - app/src/components/board/panel-dismissal.ts
  # The tests that exercise this drawer, routed out of C-05's test
  # umbrella at T-149. `detail-presentation` also reads C-16's
  # `verdicts.ts` and C-17's `task-detail.ts`, both of which this
  # component already declares.
  - app/test/detail-presentation.test.ts
  - app/test/panel-dismissal.test.ts
  - app/test/select-task-detail.test.ts
depends_on: [C-06, C-08, C-11, C-16, C-17]
decisions: [ADR-016]
status: auto
touch_slugs: [app-board]
---
The live read-only card detail drawer: full frontmatter, body sections,
blocker links, provenance marks. Owns the trusted-input dismissal
contract (pointerdown, not click — the T-005 lesson); the map's panel
reuses this drawer primitive.

**THIS PAIR WAS THE REGISTRY'S ONE DECLARED CYCLE, AND THE RECORD IS
KEPT RATHER THAN DELETED (T-127, 2026-08-25; CLOSED at T-127-s6,
2026-08-29).** `C-08 -> C-09 -> C-08` was the whole declared census at
`afe23c1` — derived, not read by eye, and answered by one command:
`nputer-index arch cycles --root <repo>`, which exited 1 and named it as
a path. It predated @human's no-cycles ruling by nine days
(`T-033-s10`) and it was nobody's new mistake. **It is gone: that command
exits 0 from T-127-s6's commit forward, and the `KNOWN_DECLARED_CYCLES`
allowlist entry in `nputer-index`'s own `tests/arch.rs` went with it in
the same commit** — the exact-set assertion reds in BOTH directions, so a
stale entry is as loud as a new cycle.

**THE UNDERLYING FILES WERE ALWAYS A DAG, SO THIS WAS EVIDENCE ABOUT THE
BOUNDARY AND NOT ABOUT THE CODE — WHICH IS WHY THE FIX COST NO IMPORT.**
Over the whole committed graph — `import` edges plus `call` and
`type_ref`, Tarjan — the only file-level SCC in this repository lies
entirely inside `C-07` (`T-127-s3`); none of these files took part in any
cycle. The two hops that closed the component cycle were
`Board.tsx -> TaskDetailPanel.tsx` one way and
`TaskDetailPanel.tsx -> TaskCard.tsx` / `-> badges/ReviewBadge.tsx` and
`task-detail.ts -> board-model.ts` the other. Every one is correct and
**none was severed**: the fix moved three paths between components and
nothing on disk. `Board.tsx` is C-18, `board-model.ts` and this
component's former `task-detail.ts` are C-17, and this component now
declares C-17 instead of owning it.

**WHY IT TOOK THREE CARDS, RECORDED SO THE SHAPE IS NOT REDISCOVERED.**
T-127 measured the fix and could not reach the fixtures it moves;
`T-127-s1` was cut to carry that fence and could not reach them either,
because T-149 had meanwhile routed
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` out of C-05's `app/test/**`
catch-all and into C-12's `app-map`. **A `touches:` line is a claim about
where files live, and nothing re-derives it when a later card moves
them.** `T-127-s6` carried the fence derived at `95cf2d0` —
`[docs/architecture/components/, app-map, crate-index]` — and landed the
work.
