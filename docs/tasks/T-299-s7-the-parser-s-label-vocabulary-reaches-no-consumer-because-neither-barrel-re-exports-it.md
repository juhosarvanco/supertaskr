---
id: T-299-s7
title: "The label vocabulary the process-settings module declares reaches no consumer: `IMPLEMENTATIONS` and `MANUAL_IMPLEMENTATION` are exported from the module and re-exported by neither barrel, so the app's settings screen and the skill must type the three labels by hand"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent at T-299-s6, which added the two constants and could not publish them: the lane's fence carries the module and neither barrel"
blocked_by: [T-299-s6]
touches: [lib/parser/src/pure.ts, lib/parser/src/index.ts, lib/parser/test/process-settings.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-299-s6 gave every switch an `implementation` field of three words and
declared that set once, in the module that reads the schema, beside
`SWITCH_TYPES` — which the two barrels DO publish. The new constants are
not published by either, because the lane's fence carried
`lib/parser/src/process-settings.ts` and neither `src/pure.ts` nor
`src/index.ts`.

The consequence is a vocabulary that exists and cannot be imported. Every
surface that renders a label has to decide for itself what the legal
labels are: the terminal command reads the field off each row and never
names the set, which is fine; the app's settings screen and the skill will
each want to branch on it, and will each type the three words. That is the
second copy this whole schema exists to prevent, arriving through a
different door.

The parser's own suite already reads the three words as a typed list
rather than an import, for the anti-vacuity reason its neighbours give,
and that stays true whatever this card does.

## Acceptance criteria

- WHEN the parser publishes its process-settings vocabulary THE browser
  entry and the package entry SHALL both re-export `IMPLEMENTATIONS` and
  `MANUAL_IMPLEMENTATION` beside `SWITCH_FIELDS` and `SWITCH_TYPES`, and a
  body SHALL read them through the public browser entry and require the
  set to be exactly the three labels the schema uses.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
