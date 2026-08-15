---
id: C-01
name: method convention
layer: convention
paths:
  - method/**
depends_on: []
decisions: [ADR-001, ADR-004, ADR-005, ADR-006]
status: done              # pinned: built and versioned (v0.1.5); no task slug maps here
touch_slugs: []
---
The generic, product-agnostic convention: task/roadmap/decision/room
formats, role prompts, interviews. Everything else in the system is a
producer or consumer of these files; changes here are version-bumped.
