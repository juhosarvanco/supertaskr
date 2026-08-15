---
id: T-019
title: Parser model hygiene — ids, cross-references, ghost context
feature: F-02
milestone: 4
priority: 10
size: M
status: building
blocked_by: [T-008]
touches: [lib-parser, app-board]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-002-s1, T-002-s2, T-002-s3. Triage 2026-08-15. Kept
separate from T-011 (task-graph layer, not architecture layer). Land
before milestone 3 — the interview writes the task graphs this
validates. blocked_by T-008 for lib-parser touch serialization only.

## Acceptance criteria
- THE parser SHALL gain validateProject() cross-reference issues:
  blocked_by → missing task id, feature → missing backbone id,
  id ↔ filename mismatch — parse-issue severity, collect-don't-throw.
- THE parser SHALL validate task id format (^T-\d+(-s\d+)?$ family;
  `id: banana` becomes a structured issue) and feature ids on tasks
  (^F-\d+$) — same first-match ordering discipline as existing rules.
- THE suggestion preamble (the context paragraph before the first
  heading) SHALL be preserved in the typed model AND rendered in the
  ghost detail panel (a suggestion's paragraph is its entire content;
  today the panel renders empty).
- IF a file's issues include cross-reference findings THEN the record
  still renders (flagging, not hiding — the T-002 contract).

## Implementation notes

## Verdicts
