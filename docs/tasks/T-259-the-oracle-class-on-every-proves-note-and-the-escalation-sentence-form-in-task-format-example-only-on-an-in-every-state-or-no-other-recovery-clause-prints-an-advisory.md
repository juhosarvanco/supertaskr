---
id: T-259
title: The oracle class on every `proves:` note (proof, type, property, example — strongest first; example-only on an "in every state" or "and no other recovery" clause prints an advisory) and the escalation sentence form in TASK-FORMAT
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human ruling (2026-09-08, the EARS-for-the-AI-era reading: \"as proposed\") — examples are the floor, not the default; and \"ask a human\" has to be a specified behaviour with a specified trigger"
blocked_by: [T-252]
touches: [method/tasks/TASK-FORMAT.md, tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

T-252 has each SHALL clause name the suite that proves it. A name says
where; it does not say how strong. An "in every state" clause or an
"and no other recovery" clause proved by one example is proved on one
path; the verifier's 2b rule already wants a control that can fail
where the arming differs, and a property or generated test is what
that looks like in a note. And nputer's own cards are full of seat
behaviour — halt, hand off, wait for a ruling — with no sentence form
for it; the EARS reading's escalation pattern is one.

## Acceptance criteria

- WHEN a SHALL clause carries a `proves:` note (T-252's grammar) THE
  note MAY end in an oracle class — `proof`, `type`, `property`,
  `example` — and TASK-FORMAT SHALL define the four in one place,
  strongest first, with one sentence each on what earns it.
- WHEN the preflight reads a clause whose text is an "in every state"
  ubiquitous form or an "and no other recovery" unwanted-behaviour form
  and whose note's class is `example` or absent THE preflight SHALL
  print an ADVISORY line naming the clause by ordinal (exit unchanged),
  with a planted positive and a planted negative in the spec.
- WHEN TASK-FORMAT's criteria vocabulary is read THE document SHALL
  carry the ESCALATION form — `IF <condition> THEN THE <seat> SHALL halt
  <action>, hand off to <role> with <fields>, and SHALL NOT proceed
  until <decision event>` — with one worked line from an existing card
  rewritten into it, and the note that rooms are its decision events.
- The method eval gate SHALL run with the bump's eval block.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
