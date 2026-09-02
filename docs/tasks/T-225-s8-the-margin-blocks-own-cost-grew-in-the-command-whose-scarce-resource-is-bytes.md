---
id: T-225-s8
title: The margin block's own cost grew by 799 bytes under the line, in the one command whose scarce resource its parent card proved is bytes
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s1
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**A DECISION FOR TRIAGE, NOT A DEFECT**, filed by the lane that made the
change rather than left for somebody to discover in a size report.

**MEASURED AT `482be56`** against `fb2a944`'s module, rendering at a
fixed size and a fixed clock so nothing but the prose moves: the UNDER
arm's block went **342 → 1,141 bytes (+799)** and the OVER arm's
**500 → 2,183 (+1,683)**. Every `--task` brief and every `--state`
answer now carries the UNDER figure.

**WHY IT MIGHT BE TOO MUCH.** `T-225` exists because this command's own
size decided a triage sitting — seven cards promoted on their merits and
three held BY ARITHMETIC. Adding ~800 bytes to every answer spends the
resource the block was built to disclose.

**WHY IT WAS SPENT ANYWAY.** The UNDER arm's share of the cost is one
line saying what each named caller does BELOW the line — which is
nothing. It is there on the symmetry rule this block already stands on:
*a disclosure that appears only past some threshold cannot be told from
one that is broken.* `T-225-s1` read that rule as binding on the arms as
well as on the block, and that reading is arguable in both directions.

**WHAT A FIX WOULD DECIDE.** Whether the per-caller line belongs in the
UNDER arm at all, or whether the `buffer:` line — which names the reader
the figure is the floor for and which must stay in both arms, since it is
the criterion `T-225-s1` was dispatched for — is enough on its own. A
decision to trim is roughly 300 bytes back per answer and one assertion
to move in `brief.spec.ts`'s BOTH-arms body. A decision to keep it should
be recorded, because the next size report will ask again.
