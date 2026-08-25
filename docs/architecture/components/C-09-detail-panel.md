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
