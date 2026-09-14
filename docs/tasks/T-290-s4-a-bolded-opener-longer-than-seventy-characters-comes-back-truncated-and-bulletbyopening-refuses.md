---
id: T-290-s4
title: "boldedOpeners caps an opener at seventy characters and one bullet's name is longer, so bulletByOpening refuses for that heading over the untouched document and only the pack's own filter hides it"
feature: F-01
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-290, found by a probe's CONTROL failing over the unmutated tree and reported in its notes"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`boldedOpeners` reads a bullet's shouted name with `[A-Z'`’ ,\-]{7,70}`
and `bulletByOpening` then requires a bullet to OPEN with that name and
for the next character not to continue the word. One bullet of this
project's conventions has a bolded name longer than seventy characters,
so the opener comes back TRUNCATED MID-WORD, the next character is a
letter, and `bulletByOpening` refuses with "0 bullets OPEN with" over a
document nobody has touched.

It was found by a control rather than by a red: T-290 built a probe that
ran every document parser over the UNMUTATED tree before trying any
move, and the control refused. A body that had asked for every heading
would have been red on main; the pack never asks, because
`citedConventionBullets` only calls `bulletByOpening` for a heading some
gate source cites, and no gate source cites this one.

**SO IT IS LATENT, NOT LIVE**, and it is filed for that reason: the day a
script's message string happens to name that bullet, the pack stops
assembling and the cause is seventy characters in a regular expression
two files away.

## Acceptance criteria

- WHEN an opener is read off a bullet THE name SHALL either be complete or the reader SHALL refuse by name rather than returning a truncation that a later lookup cannot match, and a bullet whose name exceeds the cap SHALL be reported rather than silently shortened.
- WHEN the check runs over the tree as it stands THE bullet that exceeds the cap today SHALL be named, and asking the pack for every derived heading SHALL answer rather than refuse.
- WHEN the cap changes THE body SHALL read it from the module rather than restating it, so the assertion cannot move with the thing it checks.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
