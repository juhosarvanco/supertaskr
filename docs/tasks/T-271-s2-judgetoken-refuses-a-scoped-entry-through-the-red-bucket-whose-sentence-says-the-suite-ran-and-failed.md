---
id: T-271-s2
title: "judgeToken refuses a SCOPED-GREEN entry through the RED bucket, whose sentence reads \"the verdict token records a suite that RAN AND FAILED\" — the refusal is right and the reason is false"
feature: F-06
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3"
blocked_by: []
touches: [.claude/hooks/gate-token.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

T-271 gives a lane's subset run the verdict word `SCOPED-GREEN` or
`SCOPED-RED` and relies on `judgeToken` refusing it, which it does: the
function accepts exactly the string `GREEN` and everything else that is
not `REFUSED` falls into the `red` bucket. Measured in that lane, with a
body pinning it.

**The refusal is correct and its sentence is not.** A seat that ran a
scoped leg and then tried to push is told *"the verdict token records a
suite that RAN AND FAILED: e2e is SCOPED-GREEN"*. Nothing failed. That
file already split RED from UNMEASURED for precisely this reason
(T-203, closing a finding against it): "calling that 'your suite is
red' sends a seat to debug a failure that never happened." A subset
reading is a third thing again — it ran, it passed, and it does not
answer the question a push asks.

Disposition hint: one more bucket beside `red` and `unmeasured` —
state `scoped`, code `token-scoped`, detail naming the suite and saying
the full battery is owed on the pushed tree. It is one branch and one
sentence, and its drill is the body T-271 already wrote, re-pointed at
the new code. The reason it is not in T-271 is the fence: that card's
manifest names three paths and this hook is not one of them.
