---
id: C-06
name: lib-parser
layer: lib
paths:
  - lib/parser/**
depends_on: [C-01]
decisions: [ADR-002, ADR-009, ADR-011, ADR-015]
status: auto
touch_slugs: [lib-parser]
---
The one hardened frontmatter parser (@supertaskr/parser): docs/tasks/ +
ROADMAP backbone + architecture component files into a typed model,
collect-don't-throw. Pure library with a node entry and a browser-safe
pure entry; every other component consumes files through it so the
format never forks.
