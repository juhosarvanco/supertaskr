---
id: T-229-s1
title: lane-protocol.md rule 4 still names orchestrator.md as the concurrency ceiling's home, and T-229 moved that home to TASK-FORMAT
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [method/lane-protocol.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-189-s2`**, the rider T-229 carried. **Disposition
hint: promote and fold into whatever card next opens
`method/lane-protocol.md`** — it is a two-word edit and needs no card of
its own if a lane is already in that file.

T-189-s2 named TWO files stating the 3–5 concurrent ceiling with neither
citing the other, and ruled that `method/tasks/TASK-FORMAT.md` owns the
value while `method/roles/orchestrator.md` cites it. Derived at
`179a7cc` with `command grep -rn "3–5\|concurrent" method/`, there are
THREE: `method/lane-protocol.md` rule 4's STANDING, NOT THE SEAT clause
opens *"At roles/orchestrator.md's ceiling of 3–5 concurrent lanes"* —
stating the value AND naming orchestrator.md as its home. After T-229
that pointer is one hop stale: orchestrator.md now cites TASK-FORMAT,
which is the home.

`method/lane-protocol.md` is outside T-229's fence
(`method/tasks/TASK-FORMAT.md, method/roles, docs/CONVENTIONS.md,
method/interview/plan-interview.md, app/src-tauri/src/agent/kit.rs,
tools/method-evals`), so the edit was PARKED rather than taken. The edit
is to repoint that clause's citation at `tasks/TASK-FORMAT.md`'s
Parallelism guardrails. Whether the NUMBER stays there is the same
question T-229 answered for orchestrator.md: keep it where a checker
joins it to something, drop it where nothing does — and nothing reads
lane-protocol.md's copy today (`git grep -l "lane-protocol" -- app/ lib/
tools/` at your own ref is the derivation).
