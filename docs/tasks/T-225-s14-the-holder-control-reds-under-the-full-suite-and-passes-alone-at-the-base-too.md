---
id: T-225-s14
title: The holder body's positive control reds under the FULL e2e suite and passes when the spec runs alone — reproduced at the base with no diff, so it is load and not a lane's work
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**MEASURED FOUR TIMES IN ONE SITTING, TWO REFS, SAME BODY.**
`tests/push-guard.spec.ts`'s *"a lane holds no seat, so a holder record
in one refuses nothing"* fails on its own POSITIVE CONTROL — the final
`expect(control.verdict === "block" || notices includes "SEAT")` — but
only under the whole lane:

    ref       what ran                            that body
    855db9b   the whole e2e suite (607 bodies)    FAILED
    855db9b   the whole e2e suite, re-run         FAILED
    855db9b   push-guard + session-economics only PASSED (86 passed)
    09526da   push-guard + session-economics only PASSED (86 passed)
    09526da   the whole e2e suite (604 bodies)    FAILED — 603 passed

**THE LAST ROW IS THE ATTRIBUTION AND IT IS WHY THIS IS FILED RATHER
THAN FIXED IN A LANE.** The base run was made in a detached worktree at
`09526da` with T-225-s2's diff ABSENT, in the same window as the tip
runs, and the same body reds. It is a property of the SUITE's load, not
of any lane's work — and a red that arrives on whoever happens to be
running the battery is a red attributed to the wrong card.

**THE LIKELY MECHANISM, STATED AS A HYPOTHESIS AND NOT AS A FINDING.**
The control writes a holder record built from `processRow(process.pid)`
— the playwright WORKER's own row — and passes `startedAt:
live?.startedAt ?? ""`. If that `ps` read comes back empty or late under
a loaded machine, the record's `startedAt` is `""`, the guard cannot
match it to a live process, and it correctly declines to call the seat
held. **The control would then be measuring the machine rather than the
guard.** That is a hypothesis: nothing here has driven it.

**WHAT A FIX WOULD DECIDE.** Whether the control asserts its own inputs
first — that `processRow(process.pid)` returned a row and a non-empty
`startedAt`, which is the *"a comparison is evidence only once its
expected side is asserted non-empty"* clause applied to a control — or
whether the control uses a synthesised live process it owns rather than
the worker it happens to be running in. The first is one assertion and
turns a flake into a message naming the machine; the second removes the
dependency.
