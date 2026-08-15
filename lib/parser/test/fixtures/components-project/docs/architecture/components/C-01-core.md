---
id: C-01
name: Core engine
layer: lib
paths:
  - src/core/**
depends_on: []
decisions: [ADR-001]
status: done
touch_slugs: [core]
---
Owns the typed model. Never writes.
