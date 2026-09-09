---
id: T-281-s4
title: "Whether a verdict assigns corrections at all is decided by a text predicate over prose a model wrote, so a verdict that assigns them in other words carries no blocks and is never noticed"
feature: F-04
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-281, 2026-09-09, at 0ecbab9"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts, method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

The refusal that matters most in T-281 is the one for a verdict that
assigns corrections and carries NO mutant block — that is the transcript
recovery this whole card exists to end. It fires off
`assignsCorrections`, which matches the words "ASSIGNED CORRECTION" or a
`CORRECTION` heading in the verdict's text. Both are conventions of how
this project's verifiers have happened to write, not properties of a
verdict.

A verdict that says "three fixes are required before this merges" and
heads them "FIX 1", "FIX 2", "FIX 3" assigns three corrections, carries
no block, and reaches the STOP with the drill reporting that nothing was
owed. The failure is silent in exactly the direction the card is about,
and it is one a model's wording changes from pass to pass.

The remedy is a COUNT the verdict states rather than a phrase a reader
infers: a line the verifier writes and the reader parses, compared
against the number of blocks, so a shortfall is arithmetic instead of
vocabulary. That is a change to the verdict's contract in
method/roles/verifier.md as much as to the reader, which is why it is a
card rather than a widening of the regex.

Class parent: T-281. Disposition hint: promote with T-281-s3; the two
touch the same contract and would be one sitting.
