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
non_code: true            # T-033 decision (2), argued below
---
The design language's values: measured tokens (six diverged status
colors, both schemes), bundled Geist/Geist Mono, pulse and motion
variables. All UI color resolves here — Tailwind is wired to these
tokens and arbitrary values are deliberately dead.

**`non_code: true` — WHY, IN THIS COMPONENT'S OWN WORDS (T-033).** This
territory is `.css` and font binaries. `Lang::for_extension` answers
`Some` for `ts`, `tsx`, `js`, `jsx` and `rs`, and for nothing here, so
"declared but matching no indexed file" is a statement about **what this
component is made of**, not a state it will grow out of. The D3 finding
is still reported and still explained; it stops counting as drift, which
is the whole downgrade. The day the indexer walks stylesheets this line
comes out and the finding clears on its own — that is the test for
whether the flag was honest.
