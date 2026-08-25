---
id: C-08
name: Board pane
layer: app
paths:
  - app/src/components/board/Board.tsx
  - app/src/components/board/FeatureColumn.tsx
  - app/src/components/board/GhostCard.tsx
  - app/src/components/board/ParkedRow.tsx
  - app/src/components/board/SliceLine.tsx
  - app/src/components/board/TaskCard.tsx
  - app/src/components/board/badges/**
  - app/src/lib/board-model.ts
depends_on: [C-06, C-09, C-11, C-16]
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-board]
---
Renders the story map board from the parsed model: columns in backbone
order, card faces, slice line, ghost/parked treatments, model and
review badges. Pure selectors over C-06's model; opens cards into the
detail panel. Never writes.
