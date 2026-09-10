---
id: T-297-s7
title: "The cycle band reports a FLOOR and says the word on every line, while the token band refuses a lower bound outright — the same epistemic situation, answered two opposite ways in one file"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-297, 2026-09-11"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`loop/cycle-budget-used` cannot see CI green, so it measures to the
merge, reports the number, and prints the word FLOOR on every line it
produces. `loop/token-budget-used` cannot see a silent seat's tokens, so
it reports NOTHING and takes the whole card dark. Both are defensible
and both are argued in the file; what is odd is that they are the same
situation — a quantity known to be at least this much — answered two
opposite ways twenty lines apart.

The asymmetry has a live cost. Measured by the verifier at the lane's
tip: the token band reads UNREAD at every ref today and will keep
reading UNREAD for as long as any one card in the window has one silent
seat, which is the state on record. A planted card at more than twenty
times its tier's token budget sat in the window and the band still said
nothing, because a different card's executor block stated no figure.
A band that cannot fire while the record looks the way the record looks
is a band nobody will trust when it finally does.

Either answer would be an improvement on having both. A lower bound
reported AS a lower bound, in the cycle band's own idiom, would let the
token band speak; or the cycle band could go dark on a missing CI-green
stamp the way the token band goes dark on a missing seat. This card asks
for the choice to be made once and stated, not for a particular one.

## Acceptance criteria

- WHEN a card in the window has one seat that stated no token figure THE token band SHALL give the same kind of answer the cycle band gives for its own missing quantity, and the file SHALL state which kind was chosen and why.
- WHEN a reading is a lower bound THE derivation SHALL say so in the words the band uses for it, so no reader takes it for a complete measurement.
- WHEN every seat in the window stated a figure THE reading SHALL be unchanged from today's.
