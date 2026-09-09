---
id: T-254
title: The context pack — an executor reads the method's protocol files and the brief's quoted overlay, not CONVENTIONS whole, and the read cost per seat is stamped in the record before and after
feature: F-04
milestone: 4
size: M
priority: 2
status: building
suggested_by: "@human (2026-09-08): \"I'm thinking ways how to reduce token use and time. If there is any sense for them to only read what is relevant to their task\" — and \"This sounds good\" on the seat's one-sentence suggestion (rooms/loop-efficiency.md item 28)"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/executor.md, method/roles/verifier.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

An executor's standing read (executor.md step 1) is its card plus
STATE, ARCHITECTURE and CONVENTIONS — about 160 KB before its own
files, three quarters of it CONVENTIONS, re-read at every compaction and
by the verifier's phase 2. Most of CONVENTIONS is rules a gate enforces
(the fence hook, the landing gate, the docs gate): a rule a gate
enforces does not have to be read to be obeyed. The brief already
quotes bullets by heading rather than restating them (dispatch-brief's
`section` and `rawBullet`); this card finishes that mechanism. GSD Core
hands each agent "exactly what it needs" and budgets every prompt file
(T-245); the lane protocol bullet itself says the generic rules live in
method/lane-protocol.md.

## Acceptance criteria

- WHEN `brief.mjs --task <id>` assembles a brief THE brief SHALL carry a
  CONTEXT PACK: the method files the seat's role names, the CONVENTIONS
  bullets the card's gates and fence cite (quoted by heading, byte-exact,
  through the existing `section`/`rawBullet` readers), and the component
  entries for the touched slugs — and SHALL say, in the brief, that
  CONVENTIONS in full is the architect's read, not the seat's.
- WHEN the pack omits a bullet a gate later enforces THE gate still
  refuses (the safety net is the gates, not the reading); the card's
  report SHALL name every such refusal as a pack gap, and the pack's
  bullet set SHALL be derived from the gates' own citations, never
  hand-listed.
- WHEN executor.md and verifier.md step 1 are read THE step SHALL say
  "the brief's pack" where it says CONVENTIONS today; the method eval
  gate SHALL run and the bump SHALL carry its eval block.
- WHEN the merge is recorded THE checkpoint SHALL stamp the read cost
  per seat — the token meter at the seat's first edit, read off the
  notification — for one lane before this card and one after, with the
  clock, so the saving is a reading and not a claim.
- IF a card's gates cite no bullet THEN the pack SHALL say so and the
  seat SHALL read the role's method files alone — never silently fall
  back to the whole document.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
