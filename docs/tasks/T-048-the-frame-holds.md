---
id: T-048
title: The frame holds — the genesis page stops growing and the pane starts scrolling
feature: F-03
milestone: 3
priority: 6
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-041-s1, T-041-s3. Human-approved 2026-08-16 during the
visual review session, because the screen is unusable at the size the
app actually opens.

**Measured by T-041's probe and re-derived by its verifier**, at the
real bundle with T-024's `streak` fixture:

| viewport | page scrollHeight | overflow |
|---|---|---|
| 800×600 (the app's OWN configured window) | 1172 | **572** |
| 1024×768 | 1141 | 373 |
| 1280×720 | 1110 | 390 |
| 1920×1080 | 1110 | 30 |

It stops overflowing only at a **1110px** viewport height, and the
pane's own `overflow-y-auto` region measures **796/796** — it never
scrolls, at any size. So the page grows instead of the pane, and at
800×600 you scroll the header and the interview heading off-screen to
reach the artifact list.

**The fix filed with s1 was WRONG and the verifier falsified it by
doing it.** s1's note 1 said flipping the two `min-h-screen` to
`h-screen` "is the whole mechanical fix"; with that edit alone both
columns bind to 720px and **the page still scrolls 1110 vs 720**, the
pane region still 796/796 — `overflow: visible` still spills. The
missing link is **`min-h-0` on `GenesisScreen.tsx:37`**. With all
three edits the verifier measured page 720/720 and pane region
796/406: the frame holds and the pane scrolls.

NOT the composition question. Whether the pane belongs full-width or
as the right half of a split view is T-027's call and is untouched
here — a frame that does not hold is a bug at any width.

## Acceptance criteria
- THE genesis screen's page SHALL NOT grow beyond the viewport at any
  window size: `document.scrollHeight` equals the viewport height at
  800×600, 1024×768 and 1280×720 with the `streak` fixture rendered.
- THE pane's own scroll region SHALL engage instead — its
  `scrollHeight` exceeding its `clientHeight` when the content is
  taller than the frame, so the artifact list scrolls inside a fixed
  header/footer rather than pushing the page.
- THE fix SHALL be the three class edits the verifier proved
  sufficient (two `min-h-screen` → `h-screen`, `min-h-0` on the
  genesis screen's column) or a demonstrably better equivalent — if
  a different shape is chosen, the notes SHALL show the same
  measurements at the same three viewports.
- THE other screens SHALL be unaffected: board, map, front door and
  the "No plan in <folder>" card keep their current layout, pinned by
  the existing suites and by a measurement at one viewport each.
- THE T-041 lane spec that currently PINS the overflow as a tripwire
  SHALL be updated to assert the fixed behaviour, with its comment
  rewritten to name this task rather than the open question — the
  tripwire did its job and must not silently keep passing on the old
  numbers.

Verification: headless — the tools/e2e lane at the three viewports
with real CSS, plus the app suite. @human: the composition judgment
(full-width vs right half) remains open for T-027 and is NOT settled
here; look at the screen again once this lands.

## Implementation notes

## Verdicts
