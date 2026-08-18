---
id: T-066
title: The errors stay visible without taking the board — the strip owns a ceiling
feature: F-02
milestone: 4
priority: 23
size: M
status: planned
blocked_by: [T-062]
touches: [app-shell, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-062-s3 (architect triage 2026-08-18). The suggestion file is
removed in the same commit as this card.

T-062 bounded every shell screen and gave the board its own scroll region,
but one unbounded sibling remains above it: `parse-error-details`. Its height
comes from the user's own tree. The list therefore consumes `board-scroll`
first, then pushes through the `h-screen` column and gives scrolling back to
the document.

Reproduced again at main `7d94043` through the served DEV bundle. With short
failure messages, 20 failures collapse `board-scroll` to 154px at 1024x700
and 54px at 800x600. Sixty failures produce a 1376px page at all three
measured viewports and leave the board 30px high. T-062's verifier crossed
the page boundary at 20 because the real parser messages wrapped further.
The count is not the mechanism; an unbounded sibling is.

ARCHITECT RULING: keep the details strip outside `board-scroll`. That
preserves the existing intent that a short diagnostic remains visible while
the user works on the board. Give the strip its own bounded scroll region
instead of moving it into the board.

Use the token-backed `max-h-48` ceiling (192px) with vertical auto overflow.
At the 800x600 historical baseline, the current fixed chrome leaves about
474px for the details and board regions together; a 192px ceiling should
leave about 282px for the board, above the standing 250px region floor.
These are premises the executor must remeasure, not figures it may silently
assume.

## Acceptance criteria

- WHEN the board has parse failures or skipped-file records THE system SHALL
  render the same complete details list outside `board-scroll`; badge counts,
  issue text, skip reasons and last-valid-state wording SHALL remain unchanged.
- WHILE the details list's natural height is at most 192px THE list SHALL
  remain natural-height with no inner overflow, so ordinary one-error and
  short-list states do not acquire an unnecessary scrollbar.
- IF the details list grows beyond 192px THEN THE list SHALL stop at the
  token-backed `max-h-48` ceiling and SHALL expose its remaining rows through
  `overflow-y-auto`; no row may be clipped, elided or moved into the board's
  scroll region.
- WHILE a board containing this repository's normal cards plus sixty
  malformed task files renders at 1280x840, 1024x700 or 800x600 THE document
  SHALL equal the viewport, the bounded column SHALL not overflow the
  document, and `window.scrollY` SHALL remain zero.
- WHILE that pathological board renders at those three viewports THE
  `board-scroll` client height SHALL remain at least 250px and its existing
  tall board SHALL remain independently scrollable.
- WHEN the bounded details list is scrolled to its end THE final diagnostic
  row SHALL become fully reachable without moving the page; WHEN the board is
  then scrolled THE header, wordmark and pane rail SHALL remain visible.
- THE shell-frame unit suite SHALL pin the details region's ceiling and scroll
  ownership on a real parse-failure state, and the E2E every-screen sweep
  SHALL add a board-with-many-errors state so a future unbounded sibling
  cannot hide outside the five clean screens.
- THE implementation SHALL add no token, arbitrary value, IPC command,
  capability grant, Rust change or parser change. `max-h-48` SHALL derive
  from the existing spacing token.
- EVERY added or changed test body SHALL be poisoned, shown red, restored with
  an empty diff or SHA-256 proof, and counted in the implementation notes.

Verification: headless — app typecheck, production build and full vitest
suite; tools/e2e typecheck, token lint plus selftest and full Playwright lane
at a scratch port. Run the boot gate because `app/src/**` moves. The
integrator regenerates and checks the graph because TS/TSX moves. Record the
three viewport measurements before and after, including page, column, details
and board `scrollHeight/clientHeight`. @human: none.

## Implementation notes

## Verdicts
