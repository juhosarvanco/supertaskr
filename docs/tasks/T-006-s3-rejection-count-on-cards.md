---
title: Card status word omits the rejection count ("rejected ×2")
status: suggested
suggested_by: executor claude-fable-5 @T-006
---

The board mockup (docs/design/claudedesign_handoff/"nputer
app.dc.html", board tab) renders a rejected card's status word as
`rejected ×2` — the rejection COUNT is part of the designed card face.
T-006 renders the plain word `rejected`: the model carries no
rejection count (BoardCard/TaskRecord have status only), and deriving
one honestly means counting REJECTED entries in the task's `##
Verdicts` section — model work beyond a design pass's remit, so it was
left out rather than faked.

Suggest: derive `rejectionCount` in the parser or in selectBoard from
the verdicts section (T-006 added `verdictEntries()` in
app/src/lib/task-detail.ts which already classifies entries as
rejected/approved — reuse or move it), thread it onto BoardCard, and
render `rejected ×N` for N > 1. Touches app-board (and lib-parser if
the count lands in TaskRecord — architect's call which layer owns it).
