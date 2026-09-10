---
id: T-296-s2
title: "docs/CONVENTIONS.md is past its ADR-019 warn line and the next rule to land pushes it further — the compaction sitting is what the warn is asking for, and no lane can do it inside its own fence"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-296, measured at the lane's tip, 2026-09-10"
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Measured in this lane: the document was 145031 bytes at the base, under
its 146878-byte warn line, and 147605 bytes at the tip — 727 over. The
gate exits 0 (the fail line is 176253) and this is a WARN doing its job,
reported rather than absorbed.

The two additions are the GUARD-CLASS PATHS bullet, which is the
project's half of a rule whose other half is in the method and cannot
live here, and the XS-bound keeper's change from refusing to bumping. The
lane trimmed both by about 1100 bytes after the first reading and stopped
there: ADR-019's rule is that content MOVES to the record when a budget
warns, never that a rule is deleted to fit, and choosing WHICH bullets
move is an architect's reading of the whole document rather than
something a fenced lane can decide.

What the warn is asking for is the compaction sitting: read the document
whole, move the instance narratives onto the cards and records their
citations name, and leave the rules. Every card that lands a rule after
this one makes the same warn louder.

## Acceptance criteria

- WHEN the compaction lands THE document SHALL be under its ADR-019 warn line, with every rule still stated and every moved narrative reachable from the citation that replaced it.
- WHEN a bullet's narrative moves THE record it moves to SHALL be named in the bullet, so nothing is deleted rather than relocated.
