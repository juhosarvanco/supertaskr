---
id: T-002
title: Task-file parser
feature: F-02
milestone: 1
priority: 2
size: M
status: building
blocked_by: []
touches: [lib-parser]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE system SHALL parse every docs/tasks/T-*.md into a typed model
  (frontmatter fields per method/tasks/TASK-FORMAT.md + body sections)
  and every docs/ROADMAP.md backbone line into feature records.
- WHEN a task file has malformed frontmatter THE system SHALL return a
  structured validation error naming file and field, and continue
  parsing the rest.
- IF two task files share an id THEN THE system SHALL report a
  duplicate-id error listing both paths.
- THE parser SHALL be a pure library with unit tests covering: valid
  task, missing required field, duplicate id, suggested + parked
  statuses, model@session syntax in builder/verifier.

## Implementation notes

## Verdicts
