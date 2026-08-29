---
id: C-08
name: Board pane
layer: app
paths:                    # the card FACES only — see the cycle note below
  - app/src/components/board/FeatureColumn.tsx
  - app/src/components/board/GhostCard.tsx
  - app/src/components/board/ParkedRow.tsx
  - app/src/components/board/SliceLine.tsx
  - app/src/components/board/TaskCard.tsx
  - app/src/components/board/badges/**
  # The tests that exercise this pane, routed out of C-05's test
  # umbrella at T-149. Both drive only this component's own files and
  # the parser and board model this component already declares.
  - app/test/review-badge.test.tsx
  - app/test/select-board.test.ts
depends_on: [C-06, C-11, C-16, C-17]
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-board]
---
Renders the card faces of the story map board: columns in backbone
order, slice line, ghost/parked treatments, model and review badges.
Pure views over C-17's selectors. Never writes, and never reaches the
drawer — the composition that opens a card into the detail panel is
C-18's.

**WHAT LEFT THIS COMPONENT AT T-127-s6, AND WHY.** `Board.tsx` went to
C-18 and `board-model.ts` to C-17. Those two files, sitting here beside
the card faces, are what made `C-08 -> C-09 -> C-08` the registry's one
declared cycle from before @human's no-cycles ruling of 2026-08-25:
`Board.tsx` reaches the drawer, and the drawer's `task-detail.ts` reads
`board-model.ts` and the faces come back. **No import was severed and
nothing moved on disk** — the two paths changed owner, which is the
sanctioned remedy (ADP; the same move C-16 was extracted from C-05 by at
T-033). The measurement is in `C-17-board-model.md` and
`C-18-board-root.md`; `arch cycles --root ../..` exits 0 from that commit
forward.
