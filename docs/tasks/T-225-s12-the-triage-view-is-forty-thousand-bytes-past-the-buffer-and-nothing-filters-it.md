---
id: T-225-s12
title: The triage view `--dispatch --full` is 40,672 bytes past one pipe buffer — the biggest arm there is, now announced on every run and filtered by nothing
feature: F-06
milestone: 4
size: M
priority: 2
status: building
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/tests/dispatch-order.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE ARM T-225-s7 ASKED TO HAVE ANNOUNCED IS NOW ANNOUNCED, AND WHAT IT
ANNOUNCES IS THE WORST NUMBER ON THE BOARD.** T-225-s2 added
`--dispatch --full` to the margin guard's `LIVE_ARMS`. Measured back to
back at one held board, the base `09526da` in a detached drill and the
diff in the lane immediately after:

    --dispatch --full    105,910 -> 106,208 bytes

against a 65,536-byte pipe buffer: **40,672 PAST**, about 162% of one
buffer, and T-225-s2 moved it in the wrong direction by 298 bytes
because the margin block now discloses its own cost.

**T-225-s2 COULD NOT SHRINK IT AND SAYS SO.** That card's two passages —
`docs/CONVENTIONS.md`'s LANE PROTOCOL bullet and `method/lane-protocol.md`
rule four — are row 4 and row 10 of the `--task` arm and appear nowhere
in the dispatch arm. The `--dispatch --full` answer is a function of
`dispatch-order.mjs`'s own rendering: since T-225 the default arm carries
the dispatchable-now filter and `--full` spells out every set the filter
dropped, which is exactly what makes it the TRIAGE view
(`docs/STATE.md`, TRIAGE IS OWED AT THE STAMP) and exactly what makes it
the biggest invocation this command has.

**SO THE CEILING HAS MOVED ONE ARM ALONG AGAIN**, which is this family's
whole pattern: T-225 moved it off `--dispatch`, T-225-s2 moved it off
`--task <id> --state --full`, and the arm the project reads most
deliberately is the one still past the line.

**WHY IT WAS NOT BUILT IN THE LANE.** `tools/e2e/scripts/dispatch-order.mjs`
is outside T-225-s2's fence.

**WHAT A FIX WOULD DECIDE.** Whether `--full` spells out every dropped
set at full width or only the sets a triage sitting acts on; whether the
per-card body is truncated with its own disclosure the way the margin
block discloses the whole; or whether the arm is SPLIT so a reader asks
for one dropped set at a time. The third is the shape T-225-s2 took for
its two passages — an address rather than the bytes — and it is the one
that does not have to choose what to leave out.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-225-s2 merge (6691fc5)

The architect seat. The biggest arm there is, announced on every run and filtered by nothing.
