# Roadmap

## Backbone
<!-- Features ordered as the USER experiences the product, left to right
     on the story map. Not build order. -->
- F-01: Log — `streak done <habit>` appends one completion to the
  plain-text store; first use of a name creates the habit implicitly
- F-02: Week view — `streak week` renders the current week in one
  80×24 glance
- F-03: Habit management — rename and retire habits without hand-editing
- F-04: History & stats — longest streak, month view, totals

## Milestones
<!-- The slice lines. Everything in milestone 1 ships before anything in 2. -->

### Milestone 1 — the two commands (current)
Goal: `streak done` + `streak week` on one plain-text store — the
smallest slice that lets the 2-week riskiest-assumption self-trial
start. Deliberately feels too small.
Tasks: T-001 (store + done) → T-002 (week view), T-003 (malformed-store
resilience); T-001 unblocked on day one.

### Milestone 2 — habit management
Goal: rename/retire without hand-editing the store. Gated on the
2-week self-trial surviving (NORTH_STAR riskiest assumption).

## Parked
<!-- Ideas noticed but not committed. Reviewed at each /plan for the next
     milestone. This row is what protects the slice from scope creep. -->
- `streak undo` (mis-logs are hand-edits for now)
- CSV export
- color/theme flags
- month view beyond F-04's minimum
- longest-streak column in week view (founder ask at board review; F-04 candidate)
- shell completions
