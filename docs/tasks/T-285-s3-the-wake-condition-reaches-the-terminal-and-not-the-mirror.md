---
id: T-285-s3
title: "The wake condition reaches the terminal and not the mirror — the parser hands `wake:` back in `extra` with no type and no accessor, so the app's board shows a parked card with no way to say what would bring it back"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-285, 2026-09-09, measured at 488e495"
blocked_by: [T-285]
touches: [lib-parser, app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-285's encoding needed no parser change, and that is why it shipped in
one lane: `lib/parser/src/task.ts` preserves unknown frontmatter keys
into `extra`, so `wake:` rides along and
`tools/e2e/scripts/dispatch-brief.mjs` reads it off the fields it
already had.

The cost of that is that the field exists for the TERMINAL only.
`TaskRecord` declares no `wake`, so nothing typed can reach it: the
board model, the map pane and every app-side selector see a parked card
with an opaque bag of extra keys and no condition. `docs/NORTH_STAR.md`
says the folder is mirrored beside the agent app rather than the other
way round, and a parked column that cannot say why anything is parked
is the half of that mirror this field just skipped.

This is a suggestion and not a defect in T-285: the card ruled the
terminal view, the field is preserved rather than lost, and promoting
`wake` from `extra` to a typed field is a parser decision with a
vocabulary of its own — which is the decomposition pass this card asks
for.

## Acceptance criteria

- WHEN the parser reads a card carrying `wake:` THE `TaskRecord` SHALL
  carry the condition as a typed field with the same three forms the
  method text states, and an unplaceable value SHALL be an ISSUE rather
  than a silent drop.
- WHEN the board renders a parked card THE condition SHALL be visible
  on it, and a card with no condition SHALL be visibly flagged — the
  same flag the terminal view counts under PARKED WITHOUT A CONDITION.
- WHEN the vocabulary is declared THE method text SHALL stay its one
  home, so the parser reads the three forms rather than restating them.
- A body SHALL show a parked card with each of the three forms parsed
  into the record, and one with an unplaceable value reported, each
  seen red before the field is typed.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
