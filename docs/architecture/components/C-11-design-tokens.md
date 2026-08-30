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
touch_slugs: []           # T-163: no slug, so a tokens change enters a lane by its own bare PATH
non_code: true            # T-033 decision (2), argued below
---
The design language's values: measured tokens (six diverged status
colors, both schemes), bundled Geist/Geist Mono, pulse and motion
variables. All UI color resolves here — Tailwind is wired to these
tokens and arbitrary values are deliberately dead.

**`touch_slugs: []` — WHY THIS COMPONENT CLAIMS NO SLUG (T-163,
@human's architecture ruling of 2026-08-30).** THE ONE SENTENCE THE
RULING ASKS FOR, and it sits on the field above as well: a tokens change
still has a legal route into a lane, because a fence may name a bare
PATH as well as a slug, so `touches: [app/src/styles]` (or
`app/src/assets`) fences this territory exactly and names it in the
spelling every reader already expands. This field used to read
`[app-shell, app-board]`, which made C-11 the ONLY component two slugs
expanded through, and that one sharing made every `app-shell` card's
fence overlap every `app-board` card's through a stylesheet. **NO
FIGURE IS RESTATED HERE**: the before/after count is derived and stamped
at its own ref by the `CORRECTION 2026-08-30` on
docs/tasks/T-112-a-card-hands-you-its-brief.md, which names the sweep
that produced it — a number copied into a second file is the drift this
registry's own fence rules exist to prevent. **THE
NEVER-FENCED SLUG WAS THE OTHER SPELLING OFFERED AND IT WAS DECLINED**:
a slug that exists is a slug a card may declare and the expander will
expand, so "never-fenced" would have been a promise kept by nobody,
while an ABSENT slug cannot be named at all — the property becomes
structural instead of conventional. C-01 already carries the empty list
for its own reason, so the shape is not new here. **WHAT DOES NOT
CHANGE**: `component: C-11` still pulls a card into this component, the
`paths:` above still decide what the map and `arch blast` attribute
here, and the fence stays computed from the FIELD rather than from any
prose that copies it.

**`non_code: true` — WHY, IN THIS COMPONENT'S OWN WORDS (T-033).** This
territory is `.css` and font binaries. `Lang::for_extension` answers
`Some` for `ts`, `tsx`, `js`, `jsx` and `rs`, and for nothing here, so
"declared but matching no indexed file" is a statement about **what this
component is made of**, not a state it will grow out of. The D3 finding
is still reported and still explained; it stops counting as drift, which
is the whole downgrade. The day the indexer walks stylesheets this line
comes out and the finding clears on its own — that is the test for
whether the flag was honest.
