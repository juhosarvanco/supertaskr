---
id: T-225-s1
title: The margin discloses ONE pipe buffer, and the caller that actually truncates uses a different number — `spawnSync`'s `maxBuffer` is 1 MiB by default and truncates with an `ENOBUFS` error nobody reads
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-225's DECISION 3, AND DELIBERATELY NOT BUILT
THERE.** That card's criterion is *"WHERE the brief approaches its
boundary it SHALL DISCLOSE the margin in its own output, the way the
graph budget already does"*, and one reference point is what the graph
budget discloses. A second reference is a design change to the
disclosure, not a completion of it.

**THE FACT.** `PIPE_BUFFER_BYTES` in `tools/e2e/scripts/dispatch-brief.mjs`
is 65,536 — one pipe buffer on this platform, and the FLOOR both readers
`tests/brief-flush.spec.ts` derives against share. It is the number
T-225's card is written around. **It is not the number that truncates a
`spawnSync` caller**: node's `spawnSync` defaults `maxBuffer` to 1 MiB
and, past it, returns the output TRUNCATED with an `error` field set to
`ENOBUFS` — a field most callers never read, at a status that looks
ordinary. So the two ceilings a caller can meet are an order of magnitude
apart and the disclosure names only the nearer one.

**WHY THIS IS WORTH A CARD RATHER THAN A COMMENT.** `--dispatch` at
T-225's own ref printed 85,818 bytes unfiltered, which is 131% of one
pipe buffer and 8% of the `spawnSync` ceiling. The filter T-225 landed
puts it near 30,000. **The next ceiling anybody meets on this command is
therefore the 1 MiB one**, and when they do, the disclosure will say
"UNDER" in large friendly letters.

**WHAT A FIX WOULD DECIDE.** Whether `marginRecs` takes a SET of named
reference points rather than one buffer — each with the caller it
belongs to, the way `brief-flush.spec.ts` already labels its derived
loss point with the reader it was measured against. That spec's own
sentence is the precedent: *"This is ONE reader's answer, never THE
boundary."* The disclosure currently makes the opposite implicit claim by
naming one number.
