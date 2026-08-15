---
id: T-011-s3
title: T-016 is done with an empty review stamp — C-06's provenance rolls up as unreviewed
status: rejected
suggested_by: executor claude-fable-5 @T-011
---

docs/tasks/T-016-rejected-suggestion-encoding.md is `status: done` with
`review:` empty (no verified_by either). The §4.4 provenance rollup
takes the WEAKEST guarantee among done tasks, and a done task nobody
stamped is weaker than self-verified — T-011's engine surfaces it as
`unreviewed`, which renders as the no-mark state (ADR-016). Live
consequence: C-06 (lib-parser), whose other done tasks are all
same-model verified (T-002/T-003/T-008), rolls up `unreviewed` — the
one component of the nine whose map node will carry no provenance mark,
because of one method-ratification task.

Either outcome may be intended; the architect should pick: (a) stamp
T-016 (it had no verifier — `review: self-verified` would be the honest
floor, or run a late verification), or (b) accept that doc-only tasks
can be done-unreviewed and let the map say so. If (b) becomes common, a
convention note in method/tasks/TASK-FORMAT.md would keep the no-mark
state from reading as an accident.

Triage 2026-08-16 (architect): REJECTED — resolved via arm (a):
T-016 stamped review: self-verified with a dated verdict note (the
honest floor; its notes record executor-run per-criterion
verification). Arm (b)'s TASK-FORMAT convention note not taken:
doc-only done-unreviewed stays rare enough to decide case-by-case.
