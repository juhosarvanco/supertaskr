---
title: Surface soft issues on the affected card, not only in the header count
status: suggested
suggested_by: executor claude-fable-5 @T-019
---

T-019's cross-reference findings (dangling blocked_by, feature outside
the backbone, id ↔ filename mismatch) flow into model.issues and the
flagged records still render — but the ONLY board surface that changes
is the header's aggregate issue count (App.tsx renders
`{model.issues.length} issues`; the failure banner lists hard parse
failures only). A card whose blocked_by dangles looks identical to a
clean one; the reader must know to go hunting. Soft issues carry a
`file` field, so a pure lens could join them to cards by path and the
card face (or the detail panel) could wear a small issue mark with the
messages on hover/in the panel — the same flagging-not-hiding contract,
one level closer to where the eye already is. Pre-T-019 soft issues
(missing-field, invalid-field) have the same gap; this is not new
breakage, just newly visible. Touches app-board (+ a board-model or
task-detail join); zero parser changes needed.
