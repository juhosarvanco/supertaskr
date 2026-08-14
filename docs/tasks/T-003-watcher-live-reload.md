---
id: T-003
title: Docs watcher + live reload
feature: F-02
milestone: 1
priority: 3
size: M
status: building
blocked_by: [T-001, T-002]
touches: [app-shell, lib-parser]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN any file under docs/ changes on disk THE system SHALL re-parse
  and push the updated model to the frontend within 1 second.
- WHILE the watcher is running THE system SHALL survive rapid
  successive writes (editor save bursts) without crashing or
  duplicating events (debounce).
- IF a changed file fails to parse THEN THE system SHALL keep showing
  the last valid state and surface a non-blocking parse-error badge.

## Implementation notes

## Verdicts
