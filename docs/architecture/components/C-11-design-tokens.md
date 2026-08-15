---
id: C-11
name: Design tokens
layer: app
paths:
  - app/src/styles/**
  - app/src/assets/**
depends_on: []
decisions: [ADR-016]
status: auto
touch_slugs: [app-shell, app-board]
---
The design language's values: measured tokens (six diverged status
colors, both schemes), bundled Geist/Geist Mono, pulse and motion
variables. All UI color resolves here — Tailwind is wired to these
tokens and arbitrary values are deliberately dead.
