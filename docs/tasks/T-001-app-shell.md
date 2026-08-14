---
id: T-001
title: App shell boots
feature: F-02
milestone: 1
priority: 1
size: M
status: building
blocked_by: []
touches: [app-shell]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE system SHALL open a Tauri 2 desktop window on macOS and Linux
  from `npm run tauri dev` run in `app/` (code layout per
  docs/ARCHITECTURE.md) with a React + Vite + Tailwind + shadcn
  frontend rendering a placeholder screen.
- THE frontend SHALL take its colors, spacing, and type exclusively
  from a design tokens file created by this task
  (`app/src/styles/tokens.css`, CSS custom properties, placeholder
  values — T-006 replaces the values, never the mechanism).
- WHEN the app starts THE system SHALL log the resolved project folder
  path (default: the repo the app lives in).
- IF the frontend fails to build THEN THE system SHALL exit non-zero
  with the build error printed (no silent white window).

## Implementation notes

## Verdicts
