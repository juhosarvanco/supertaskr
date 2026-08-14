---
id: T-001
title: App shell boots
feature: F-02
milestone: 1
priority: 1
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE system SHALL open a Tauri 2 desktop window on macOS and Linux
  from `npm run tauri dev` with a React + Vite + Tailwind + shadcn
  frontend rendering a placeholder screen using the design tokens file.
- WHEN the app starts THE system SHALL log the resolved project folder
  path (default: the repo it lives in).
- IF the frontend fails to build THEN THE system SHALL exit non-zero
  with the build error printed (no silent white window).

## Implementation notes

## Verdicts
