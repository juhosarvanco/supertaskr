---
id: T-022
title: Front door — recents, last-project persistence, override precedence
feature: F-02
milestone: 4
priority: 13
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-006-s2, T-007-s1, and T-001-s1's override residual.
Triage 2026-08-15: one store, one precedence order.

## Acceptance criteria
- THE app SHALL persist a recents list (app-config dir; last project
  = head) rendering the design's front-door recent rows (path + task
  stats), with ⌘O opening the picker — pure-lens holds: this is app
  preference state, never project truth.
- THE project resolution SHALL follow one precedence order, recorded
  and tested: explicit override (CLI arg/env) > persisted-valid last
  project > cwd walk-up > exe walk-up > None → front door.
- WHEN a persisted project no longer validates (moved, docs/ gone)
  THE app SHALL fall through to the next precedence step and surface
  a quiet note in the recents row (stale, not silently dropped).
- IF the config store is corrupt or unwritable THEN the app SHALL
  behave exactly as today (resolution without persistence; a parse
  chip note) — persistence is additive, never a new failure mode.

## Implementation notes

## Verdicts
