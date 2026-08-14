---
title: Parked tasks have no detail surface (count row is a dead end)
status: suggested
suggested_by: executor claude-fable-5 @T-005
---

T-004's ParkedRow collapses parked tasks into a static "N parked" row
per column, and its code comment deferred expansion to T-005 — but
T-005's criteria (and its dispatch scope) cover clicking CARDS only,
and parked tasks never render as cards. Result after T-005: every
suggested/planned/building/verifying/rejected/merging/done task and
every ghost opens a detail panel, while parked tasks remain the one
population you cannot inspect at all from the board — the count row is
inert, and nothing lists which tasks are behind the number.

Not a T-005 failure (no criterion mentions parked; the count row is
T-004's design of record), but the asymmetry is now visible in the UI
rather than latent in a comment.

Suggest: make the parked row expandable — clicking it toggles an inline
list of ghost-like entries (title + id when present) that open the
existing TaskDetailPanel via the same cardRef mechanism (id when
present, else file). The selector work is trivial: selectBoard already
sees the parked TaskRecords and only surfaces a count; surface
minimal entries instead. Fits naturally with T-006's design pass or as
a small follow-up; components touched are ParkedRow.tsx,
FeatureColumn.tsx, board-model.ts. Architect should also decide
whether the design's "parked row collapsed under each feature"
(docs/design/dashboard.md) intends expansion at all.
