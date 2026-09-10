---
id: T-297-s6
title: "A card id out of the readings file reaches `git log --grep` as a regular expression, so a metacharacter in one would price a card against another card's dispatch stamp"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-297, 2026-09-11"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`dispatchStampSec` builds its search from a value that came out of
`docs/checkpoints/meters.jsonl`, and the pattern is a REGULAR
EXPRESSION. `parseMeterRecords` accepts any non-empty string as a card,
so a value carrying a metacharacter is a pattern rather than a name.
Measured by the verifier at the lane's tip, against this repository's
own log: a pattern of that shape standing in for a card id matches a
real dispatch stamp belonging to a different card, and the cycle is
then priced from a commit that has nothing to do with the reading.

This is NOT a shell injection and should not be written up as one: the
call goes through `execFileSync` with an argument vector, no shell
parses it, and the ids a merge actually writes come from frontmatter the
parser constrains to a narrow shape. The exposure is a data-integrity
one and its blast radius is a wrong number in a band, not an execution.
It is worth closing anyway because it is one flag: the same search with
fixed-string matching does not match that pattern, and the verifier ran
both to confirm the remedy works before proposing it.

## Acceptance criteria

- WHEN a card value carries a regular-expression metacharacter THE dispatch-stamp search SHALL match only a stamp naming that card literally.
- WHEN a card has an ordinary id THE stamp found SHALL be the same commit the search finds today, so no reading on record moves.
- WHEN no stamp matches THE card SHALL stay un-priceable and be named, exactly as it is today.
