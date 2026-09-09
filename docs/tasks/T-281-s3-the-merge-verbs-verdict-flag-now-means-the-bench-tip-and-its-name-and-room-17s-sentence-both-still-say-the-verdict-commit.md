---
id: T-281-s3
title: "The merge verb's --verdict flag now has to be handed the BENCH TIP, because the verifier commits its bodies after the verdict commit — the flag's name and room 17's sentence both still say the verdict commit"
feature: F-04
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-281, 2026-09-09, at 0ecbab9"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts, docs/rooms/loop-efficiency.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-281's first criterion puts the verifier's body commits AFTER the
verdict commit, deliberately, so the verdict's figures still name the tip
they were measured at. The consequence is that the commit the merge must
carry is the bench TIP and no longer the verdict commit — and three
things still say otherwise: the flag is spelled `--verdict`, the
`branch:move` step's title reads "move the lane to the verdict", and room
17's own sentence is "move the lane branch to the VERDICT commit before
merging".

Nothing here is silent — the drill reads the block's spec off the merged
tree and refuses with a message naming exactly this cause when a body is
missing, which is what turned a whole wasted spec run into one read. But
a refusal is a worse instrument than a name that is right. The work is to
decide which of three it is: rename the flag, teach the verb to derive
the bench tip from the lane's checkout, or leave the flag and correct
room 17's sentence and the step's title so all three agree.

Class parent: T-281. Disposition hint: promote at the same sitting as the
first merge that carries committed bodies, when the right answer will be
obvious from having done it once.
