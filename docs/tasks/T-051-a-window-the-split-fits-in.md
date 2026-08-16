---
id: T-051
title: A window the split fits in — raise the default, floor the minimum
feature: F-03
milestone: 3
priority: 7
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-048-s5. Human-ruled 2026-08-17, after T-027's planning pass
measured the consequence: **the app's flagship screen does not fit in
the window the app opens.**

`app/src-tauri/tauri.conf.json` opens at **800×600** with no `minWidth`
and no `minHeight`. T-027's split — ruled by @human the same evening —
is 640px of planner chat plus a 1px rule beside T-024's lens. At 800
that leaves the lens **159px**, so T-027's plan drops the lens below
Tailwind's `lg` (1024px) rather than render a useless sliver. The
consequence, stated plainly in that plan and escalated here: **at the
size the app actually launches, a user sees chat only** — not the
composition that was just ruled on. A new user never widens the window
before forming an opinion.

T-048-s5 is the other half of the same missing constraint: below about
**250px of window height** the genesis pane's scroll region collapses
to 44px and the last artifact row cannot be reached at all. T-048
bounded the frame; nothing floors it.

Deliberately NOT taken inside T-027: the window governs every screen,
it fires the BOOT GATE, and a flagship screen's width requirement is a
reason to raise the default — not a licence for a feature task to
change global chrome in passing.

## Acceptance criteria
- THE default window SHALL open large enough for T-027's split to
  render both halves — approximately **1280×840**, the exact figures
  recorded in notes with the arithmetic (640 chat + 1 rule + the lens
  at no less than the 639px T-027's plan calls the design's geometry).
- THE window SHALL declare a `minWidth` and `minHeight` that keep every
  screen usable: at minimum, wide enough that the split still renders
  rather than silently dropping the lens, and tall enough that the
  genesis pane's scroll region still engages (T-048-s5 measured the
  floor at ~250px, so the minimum must sit well above it).
- WHEN the window is resized to the declared minimum THE genesis
  screen, the board, the map and the front door SHALL each remain
  usable — measured at that size, not asserted; the T-048 criterion-4
  table is the form.
- THE change SHALL be confined to `app/src-tauri/tauri.conf.json`'s
  window block: no new grant, no capability change, no Rust, no
  frontend edit. `EXPECTED_GRANTS` byte-unchanged and proven so.
- IF T-027 has NOT yet landed THEN the criteria SHALL still hold for
  the screens that exist — this task does not depend on the split, it
  makes room for it.

Verification: headless — the config diff plus measurements at the new
default and at the declared minimum through T-041's shell harness in
the tools/e2e lane. The BOOT GATE fires (a manifest change) and its
result is recorded. @human: whether the new default feels right on
your display, which is the one thing no measurement settles.

## Implementation notes

## Verdicts
