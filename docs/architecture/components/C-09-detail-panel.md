---
id: C-09
name: Detail panel
layer: app
paths:
  - app/src/components/board/TaskDetailPanel.tsx
  - app/src/components/board/panel-dismissal.ts
  - app/src/lib/task-detail.ts
depends_on: [C-06, C-08, C-11, C-16]
decisions: [ADR-016]
status: auto
touch_slugs: [app-board]
---
The live read-only card detail drawer: full frontmatter, body sections,
blocker links, provenance marks. Owns the trusted-input dismissal
contract (pointerdown, not click — the T-005 lesson); the map's panel
reuses this drawer primitive.

**THIS PAIR IS THE REGISTRY'S ONE DECLARED CYCLE, AND IT IS LISTED
RATHER THAN LEFT TO BE REDISCOVERED (T-127, 2026-08-25).** `C-08 -> C-09
-> C-08` is the whole census at `afe23c1` — derived, not read by eye, and
now answered by one command: `nputer-index arch cycles --root <repo>`
exits 1 and names it as a path. It predates @human's no-cycles ruling by
nine days (`T-033-s10`) and it is nobody's new mistake.

**THE UNDERLYING FILES ARE A DAG, SO THIS IS EVIDENCE ABOUT THE
BOUNDARY AND NOT ABOUT THE CODE.** Over the whole committed graph — 179
files, `import` edges plus `call` and `type_ref`, Tarjan — the only
file-level SCC in this repository lies entirely inside `C-07`
(`T-127-s3`); **none of C-08's ten files and C-09's three take part in
any cycle.** The two hops that close the component cycle are
`Board.tsx -> TaskDetailPanel.tsx` one way and
`TaskDetailPanel.tsx -> TaskCard.tsx` / `-> badges/ReviewBadge.tsx` and
`task-detail.ts -> board-model.ts` the other. Every one is correct and
**none may be severed to please a diagram**.

**WHY T-127 DID NOT MOVE THE BOUNDARY: THE FIX IS OUT OF ITS FENCE, AND
THAT WAS MEASURED RATHER THAN ASSUMED.** The smallest acyclic
re-partition of these two components' `paths:` takes `npm test` from
`app/` to **6 failed / 967 passed of 973, exit 1**, in
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — the live-registry fixtures
`docs/CONVENTIONS.md` already warns about — and both sit under
`app/test/**`, which is C-05's `app-shell`, outside
`[crate-index, docs/architecture/components/]`. `T-127-s1` carries the
move with the partition it recommends. Until it lands, the exception is
allowlisted BY NAME in `arch::cycles`'s own test, so a SECOND cycle reds
`cargo test` today and a stale allowlist entry reds it the day this one
is fixed.
