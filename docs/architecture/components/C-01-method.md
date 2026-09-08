---
id: C-01
name: method convention
layer: convention
paths:
  - method/**
depends_on: []
decisions: [ADR-001, ADR-004, ADR-005, ADR-006]
status: done              # pinned: built and versioned (v0.1.10); no task slug maps here
touch_slugs: []
non_code: true            # T-033 decision (2), argued below
---
The generic, product-agnostic convention: task/roadmap/decision/room
formats, role prompts, interviews. Everything else in the system is a
producer or consumer of these files; changes here are version-bumped.

**`non_code: true` — WHY, IN THIS COMPONENT'S OWN WORDS (T-033).**
`method/**` is markdown: formats, role prompts, interview scripts. There
is no source file here for any walk to collect, and there is not meant to
be — a convention that shipped executable code would have stopped being
product-agnostic. So its D3 is a statement about **what this component
is**, not a to-do, and it is downgraded to informational rather than left
as amber the map can never turn off. The finding is still reported.

**AND THIS COMPONENT IS THE SHARPEST TEST OF "OPT-IN, NEVER INFERRED".**
Its file list is empty and so is C-15's, and the two mean opposite things
— C-15 is dispatch code somebody has yet to finish. Nothing derivable
from the graph tells them apart, which is why the flag is written here by
hand and read nowhere else.
