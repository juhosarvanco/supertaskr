---
id: T-028
title: Decomposition crescendo — cards rain in, timed completion, board handoff
feature: F-03
milestone: 3
priority: 6
size: M
status: planned
blocked_by: [T-027]
touches: [app-interview, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

The interview's last act: when the planner reaches decomposition
(Q7 banked; task files start landing), the right pane graduates from
the genesis lens to the real board materializing — "cards rain into
the board" — then hands off to the board pane. The board already
renders live task files for free (watcher); this task is the
transition, the completion state, and the local timer (criterion 2 is
TIMED; display-only, no telemetry — NORTH_STAR non-goal).

Absorbs: T-027-s1 (architect, 2026-08-17). The answer box loses focus
after every send, so answering twice in a row needs the mouse — on a
screen whose whole premise is a seven-question conversation. Its
suggestion file names its home as "T-027's own lane
(`app/src/genesis/`)", which is this task's lane, and the fix is three
lines plus a guard. Folded rather than given a lane of its own; the
suggestion file is removed in the same commit as this line.

## Acceptance criteria
- WHEN task files begin landing under docs/tasks/ during genesis THE
  right pane SHALL switch to the real board renderer (existing board
  components read-only; board files untouched — composition only)
  with cards appearing live as files land; the rain treatment is one
  entrance transition within the established motion budget,
  motion-safe gated.
- WHEN the interview completes (T-023's completion signal: planner's
  closing turn + a parseable board present) THE view SHALL render
  the completion state — board ready, elapsed time shown from the
  local genesis clock ("~N min", ephemeral, restart re-base rule
  recorded in notes) — with one CTA landing in the board pane on the
  new project (rail restored); no dispatch affordance (F-04 fence).
- WHILE genesis is in progress THE elapsed indicator SHALL render
  (the design's "~9 min elapsed" slot) without any network or
  persistence beyond .nputer/ (asserted: zero new IPC, zero
  telemetry).
- IF the planner ends without a parseable board (no tasks, or all
  parse-failing) THEN the completion state SHALL NOT render — the
  view stays in-interview showing the honest artifacts state and the
  existing parse-chip family (planning theater is the named failure
  mode; an empty board must never be celebrated).
- IF prefers-reduced-motion is set THEN cards appear without the
  entrance transition.
- WHEN a turn the user sent from the answer box leaves flight THE
  focus SHALL return to that box, so a keyboard-driven user can answer
  seven questions without ever reaching for the pointer. IF focus had
  been moved elsewhere while the turn was in flight THEN it SHALL NOT
  be stolen back — the box refocuses only when it HELD focus at submit
  time, recorded at submit rather than inferred on landing. The box
  stays `disabled` in flight (T-027's criterion 4 is unchanged; the
  blur is the HTML spec's, and the defect is that nothing gave focus
  back). `tools/e2e/tests/interview.spec.ts`'s tripwire, which today
  asserts `not.toBeFocused()` after a real ⏎ send and then has to
  `.click()` the box before typing again, SHALL be INVERTED and the
  re-click deleted — a spec that still needs the click has not fixed
  this. (T-027-s1, option 1 of three; options 2 and 3 change what "in
  flight" LOOKS like and are @human's, so they are not taken here.)

Verification: headless — jsdom + served-bundle probe: scripted
fake-CLI decomposition writing real task files into a temp project,
asserting lens→board switch, live card appearance, completion
gating, no-board failure path. @human, listed explicitly: THE
MILESTONE CLOSER — a real, timed, end-to-end genesis on a toy idea
(target ≤30 min, criterion 2), judged live; light+dark completion
screenshots.

## Implementation notes

## Verdicts
