---
id: T-225-s7
title: The margin guard announces six live arms and not the seventh, which is the biggest one there is and the view T-225 made the triage default
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s1
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-197`/`T-225`.** `LIVE_ARMS` in
`tools/e2e/tests/brief-flush.spec.ts` enumerates six invocations and
announces each one's size against a loss point derived in the same run —
*"the failure this guard exists for is an approach nobody could see"*.

**`--dispatch --full` IS NOT IN THAT LIST.** Measured at `482be56` on
`Mac.lan` it renders **119,809 bytes**, about 183% of one pipe buffer,
where every arm the list does carry sits near or under it. It is also the
arm the project reads most deliberately: since T-225 it is the TRIAGE
view (docs/STATE.md's "TRIAGE IS OWED AT THE STAMP"), so the arm most
likely to meet a ceiling is the one the guard never mentions.

**AND THE OMISSION IS SILENT BY CONSTRUCTION**, which is what makes it
worth a card rather than a one-line addition somebody remembers: the list
is a hand-kept enumeration, and nothing compares it to the flag set
`brief.mjs` actually accepts. The same shape as every stale enumeration
this project has paid for.

**WHAT A FIX WOULD DECIDE.** Whether the arm list gains one row, or
whether it is DERIVED from the command's own flags so a seventh arm
cannot be forgotten again. The second is the standing preference here
(*"DERIVE THE LIST, NEVER QUOTE IT"*) and it costs a second reader of
`brief.mjs`'s flag table; the first costs one line and stays stale-able.
Fence: `tools/e2e/tests/brief-flush.spec.ts`, which `T-225-s1`'s fence
did not reach.
