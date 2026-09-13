---
id: T-301
title: The app's settings screen — the same profile and switches, rendered from the same schema with the same explanations and measured costs, editing the same runtime template through the app's file writer
feature: F-02
milestone: 4
size: M
tier: standard
priority: 3
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [app/src/, app/src-tauri/src/, app/test/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The mirror app renders the board off files; the settings are a file too. One schema, three renderers (T-300 the terminal, this card the app, T-302 the skill).

## Acceptance criteria

- WHEN the settings screen opens THE profile and the switches SHALL render from the schema with their explanations and the project's band readings, and a change SHALL write the runtime template through the app's existing file writer with the constraints enforced.
- WHEN the template changes on disk THE screen SHALL re-render from the file (the board's own arrival mechanism), and a body SHALL show a forbidden combination refused in the screen with the constraint's text.

## Amendment of 2026-09-12 — the mirror first

The owner ruled on 2026-09-12 that the app is a mirror first. This section supersedes the
first criterion's write clause and narrows the second criterion's refusal; the original
criteria above stay as history.

- The first criterion's rendering clause stands: the profile and the switches render from
  the schema with their explanations and the project's band readings. Its write clause,
  that a change writes the runtime template through the app's file writer, is superseded:
  this card writes nothing. The edit is a follow-up card after T-300 lands, in which a click
  runs the terminal command through the native half and the screen re-renders from disk.
- The second criterion's re-render clause stands. Its refusal clause is narrowed: a
  forbidden combination present in the template on disk is shown on the screen as a
  diagnostic naming the constraint; refusing an edit belongs to the follow-up card.
- The shared reader is read from lib/parser once it lands there; until then this lane is
  not resumed. This card resumes only when both the reader in lib/parser and T-300's
  adoption follow-up are merged on its dispatch base.
- The recovery clone's app-side candidate (its settings screen, data source and tests at
  its commit e1e1b14b) is input material for the executor, read as reference; its expanded
  contract of twenty-three paths is not adopted, and its native writer is not used.
- Size and tier are re-derived by the arm at resumption; the fence stays the app's three
  directories.

## Amendment of 2026-09-12, second — the labels and the third prerequisite

The nine cards filed on 2026-09-12 sequence the settings track as T-317, then T-300-s6, then T-299-s6, and T-299-s6 names this card and T-302 as the remaining consumers of the switch labels. This section supersedes the first amendment's resume condition only, and adds one rendering obligation; everything else above stands.

- This card resumes only when T-317, T-300-s6 and T-299-s6 are merged on its resumption base, not merely verdicted.
- The screen SHALL show, beside each switch's value, its label (operational, manual or declarative) and, for a manual switch, its action, read through the parser library's browser entry; a declarative switch SHALL be shown as read-only in the screen's own terms. Editing stays with the follow-up card that runs the terminal command.
- The executor's brief SHALL be rendered only after this section is on the card, so the requirement is in the sealed contract and never added to a live lane.

## Amendment of 2026-09-13, third — the design step with the owner

The owner ruled on 2026-09-13, reading the customization-form room, that this screen is designed with the owner before it is built: the seat tells the owner when it is time to design it and brings a proposal, and no lane builds the screen from the card alone. This section adds one prerequisite to the second amendment's resume condition; everything else above stands.

- This card resumes only when, in addition to the three merges the second amendment names, a design ruling is recorded on this card: what a person does on the screen, how the resolved values and their reasons are previewed, how a diagnostic on a forbidden combination is shown, and where the models section from T-318 sits. The seat proposes; the owner rules; the ruling is paraphrased here, dated, before the executor's brief is rendered.
- The edit follow-up card (a click runs the terminal command through the native half) is not cut until the same design ruling covers the edit flow and the shape of a refused edit.
- The design step is the owner's to take up; it is not started by the seat without telling the owner, and it does not begin a lane.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
