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
  # The panel's assignment row (T-169, D5), moved here at the T-169
  # integration: its TaskDetailPanel import from C-08's review-badge
  # file was the undeclared C-08 -> C-09 edge arch drift caught.
  - app/test/detail-assignment.test.tsx
  - app/test/select-task-detail.test.ts
depends_on: [C-06, C-08, C-11, C-15, C-16, C-17]   # C-15 at T-112-s5: the drawer asks dispatch_brief for its OWN card, because it is the only component that knows which card is open
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
`supertaskr-index arch cycles --root <repo>`, which exited 1 and named it as
a path. It predated @human's no-cycles ruling by nine days
(`T-033-s10`) and it was nobody's new mistake. **It is gone: that command
exits 0 from T-127-s6's commit forward, and the `KNOWN_DECLARED_CYCLES`
allowlist entry in `supertaskr-index`'s own `tests/arch.rs` went with it in
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

**THIS COMPONENT REACHES C-15, AND THE EDGE IS THE WHOLE REGISTRY CLAIM
OF `T-112-s5` (ruled at the architecture sitting of 2026-08-31, shape
3).** `TaskDetailPanel.tsx` imports C-15's `readBrief` and asks
`dispatch_brief` for the card it has open. **The reason it is THIS
component and not the shell is an asymmetry between the two dispatch
props, and it is worth stating once**: a `DispatchReading` is a fact
about the WHOLE repository, so `App.tsx` can compute one and thread it
down; a `BriefOutcomeView` is a fact about ONE card, and the open-card
ref is `Board.tsx`'s own `useState` — so the shell that mounts the board
literally cannot name the card to ask for. The drawer already holds its
`taskRef`. Two shapes were refused and neither on cost: lifting `openRef`
to the shell moves ephemeral VIEW state across a component boundary to
serve one consumer (`A RENDER-PHASE REF STAMP`'s closing warning), and
fetching in `Board.tsx` (C-18) contradicts that file's own design note in
as many words — *"this file makes no decision about them"*.

**IT ADDS NO CYCLE, AND THE CHECK IS ONE COMMAND RATHER THAN THIS
SENTENCE:** `supertaskr-index arch cycles --root <repo>`. C-15's own
`depends_on` is `[C-10]` and C-10's is `[C-06]`, so nothing downstream of
C-15 reaches back here — this is a new leaf hop off an existing DAG, not
a return edge. That is the same command `T-127-s6` closed this
component's one declared cycle with, and it is asked rather than argued.

**WHAT DID NOT CHANGE, BECAUSE THE OBVIOUS READING OF "THE PANEL FETCHES
NOW" IS WRONG.** The `brief` PROP survives and stays AUTHORITATIVE when
supplied — a supplied prop is answered with itself and no `invoke`
happens at all. It is the seam `app/test/board-truth.test.tsx` (C-05's)
and this component's own `app/test/detail-assignment.test.tsx` drive, and
it is what lets a suite put any outcome on screen with no Tauri runtime
anywhere. And the block's GATE is still the `dispatch` prop, whose
producer is still missing (`T-126-s1`'s parked ruling plus `app-shell`),
so the dispatch block still does not render outside a suite. This card
filled the `brief` half of `T-112-s1`'s criterion 3 and could not reach
the other half from inside `[app-board]`.
