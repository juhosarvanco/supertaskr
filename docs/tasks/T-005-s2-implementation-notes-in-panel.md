---
title: Detail panel omits the Implementation notes section (criteria-literal)
status: suggested
suggested_by: executor claude-fable-5 @T-005
---

T-005's criterion enumerates the panel's content exactly: acceptance
criteria, blocked_by, touches, verdict history verbatim, and the
built_by/verified_by/review stamps. Implementation notes — the third
body section the parser extracts (TaskSections.implementationNotes) —
is not on the list, so the panel deliberately does not render it.

For finished tasks the notes are often the richest content in the file
(T-004's run ~200 lines: smallest-choice decisions, per-criterion
verification commands, flags for the verifier), and a user who opens
T-004's card today sees its verdicts but has no path to its notes
short of opening the file elsewhere. The omission may well be
intentional (notes are builder-internal working record, verdicts are
the accountability surface) — that is an architect call, not an
executor's.

Suggest: if wanted, add an `implementationNotes` field to
selectTaskDetail (same empty-normalization as the other sections) and
one more Section in TaskDetailPanel.tsx rendering it exactly like
verdicts (preformatted, scrollable, mono — it is the same kind of long
technical text). A collapsed-by-default disclosure would keep the
panel scannable. ~15 lines across app/src/lib/task-detail.ts,
app/src/components/board/TaskDetailPanel.tsx, plus selector tests.
