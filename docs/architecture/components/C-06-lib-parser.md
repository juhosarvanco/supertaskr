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
format never forks. It also holds the PROCESS SETTINGS READER
(`src/process-settings.ts`, T-317): the schema parser, the section
reader, the resolver, the accessor, the ledger and the constraint
findings, text in and values out, so the terminal, the app's settings
screen and the skill read one implementation.
