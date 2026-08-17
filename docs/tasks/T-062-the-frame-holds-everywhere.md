---
id: T-062
title: The frame holds everywhere — one scroll model, a canvas that scrolls, a card that fits
feature: F-02
milestone: 4
priority: 28
size: M
status: planned
blocked_by: [T-051]
touches: [app-shell, app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-048-s1, T-048-s2, T-048-s3, T-048-s4 (triage 2026-08-17).
The suggestion files are removed in the same commit as this card.

`blocked_by: [T-051]` is real, not lane serialization: T-051 raises
the default window and declares a minimum, and every measurement in
this card is taken against the window that actually ships. T-048-s3
and T-048-s4 were going to fold INTO T-051 at triage; it was already
building, so they ride here instead.

THE FORK IS STILL OPEN AND ITS NAMED OWNER IS SPENT. T-048 bounded the
genesis column (`h-screen`) and left every other screen a growing page
(`min-h-screen`), and said the decision was T-027's to make. T-027
came and went; re-verified at triage, `App.tsx:472` still reads
`boundedFrame ? "h-screen" : "min-h-screen"`. Two scroll models in one
shell is the kind of thing a user feels without being able to name —
on a tall board at 800x600 the wordmark, project path, parse chips and
theme toggle all scroll off, while the genesis screen behaves the
other way.

THE TRAP UNDERNEATH IT. `MapView.tsx:552` (cited at :490 when filed —
the line moved, the classes did not) gives the canvas
`min-h-0 flex-1 overflow-hidden`: it can shrink, and when it does it
HIDES the overflow. Harmless today only because the column is
`min-h-screen` so the canvas never has to shrink. T-048 measured the
other side while ruling out the unconditional fix: with `h-screen`,
`div.map-canvas-grid` reads **446/320 with `overflow-y: hidden`** at
800x600 — 126px of graph gone, no scrollbar anywhere, and NOTHING
GOES RED (the lane has no assertion about canvas height and jsdom has
no layout). Bounding the frame without this fix is how a quarter of
the map disappears silently. Read with T-034-s1: the tasks lens
inherits this canvas verbatim, and wave 0 is 32+ cards tall.

## Acceptance criteria
- THE SHELL SHALL HAVE ONE SCROLL MODEL: `main` and the column
  bounded unconditionally, so T-048's conditional collapses back to
  one class and `app/test/shell-frame.test.tsx`'s scoping pin is
  rewritten to pin the single model instead.
- `PaneRail` SHALL survive the bound — its own `h-screen` or
  `sticky top-0`. Measured today: as a stretch-height sibling of the
  column it goes 2202px to 720/600px under an unconditional
  `h-screen`, so the sidebar strip and its right border stop at the
  fold while the page still scrolls to 2202.
- THE BOARD SHALL OWN A SCROLL REGION — the same
  `min-h-0 flex-1 overflow-y-auto` idiom the pane and the map already
  use — so app chrome stops scrolling away.
- THE MAP CANVAS SHALL SCROLL RATHER THAN CLIP: `overflow-auto` in
  place of `overflow-hidden`. It changes nothing today (the canvas is
  never smaller than its content today) and it is what makes the
  bound safe. Fit-to-frame is explicitly NOT taken: T-012's layout is
  deterministic and pinned, and rescaling is a design decision
  (T-048-s2).
- A LANE ASSERTION SHALL CONVERT THE SILENT FAILURE INTO A LOUD ONE:
  read `map-canvas-grid`'s `scrollHeight` against `clientHeight` at a
  small viewport and fail if content is ever hidden with no scroll
  region below it.
- THE NO-PLAN CARD SHALL FIT at the window T-051 ships and SHALL BE
  MEASURED at the declared minimum, remedy 1 first (trim the
  empty-state section's `py-12`, tokens-only, buys back more than the
  63px needed). **T-048-s4's correction rides with it and SHALL be
  recorded so nobody treats this as an alarm**: at 800x600 the page
  is 663/600, but `start-interview-here` sits at top 524 / bottom 556
  and the convention footnote's bottom is 590 — **nothing readable
  and nothing clickable is below the fold**; the 63px is the
  section's bottom padding plus 15px of the card's painted panel.
  T-048-s3's prose ("the button and the footnote sit below the fold")
  does NOT reproduce (T-048-s3 + T-048-s4).
- IF T-051's new default makes the no-plan card fit outright THEN the
  padding trim SHALL still be evaluated at the declared MINIMUM and
  the notes SHALL record whether it was needed — "the bigger window
  hides it" is not the same as "it fits".
- THE MEASUREMENT TABLE SHALL BE THE FORM OF THE PROOF, in T-048's
  own idiom: every screen (front door, no-plan, board, map, genesis)
  at the new default, at the declared minimum, and at 800x600, page
  height against viewport, before and after.
- ZERO new tokens; tokens-only styling; both schemes.

Verification: headless — served-bundle geometry probes through
T-041's shell harness in the tools/e2e lane, plus
`app/test/shell-frame.test.tsx`. @human: whether one bounded frame
feels right — a desktop app whose header scrolls away is unusual, and
that judgment is not a measurement.

## Implementation notes

## Verdicts
