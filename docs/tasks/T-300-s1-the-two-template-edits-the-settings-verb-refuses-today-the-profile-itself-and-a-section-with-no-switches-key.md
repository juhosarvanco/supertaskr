---
id: T-300-s1
title: "The two template edits `settings set` refuses today: the profile itself, and a `process:` section that carries no `switches:` key — the commonest change of all still needs a hand edit of method text"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300, measured at the lane tip, 2026-09-11"
blocked_by: []
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`settings set <switch> <value>` writes a DEPARTURE. Two edits to the
same section it does not make:

- **The profile itself.** Moving a project from `standard` to `fast` or
  to `guarded-everything` is the largest settings change available and
  the only one the schema describes profile by profile, and it is the
  one the command cannot do. A user reaches for `settings set profile
  fast`, gets told `profile` is not a switch the schema declares, and
  hand-edits method text — which is the state this card's parent set out
  to end.
- **A section with no `switches:` key.** `processSection` treats that
  key as optional, so a template naming a profile and nothing else is
  legal. `switchesBlock` refuses it rather than creating the block,
  naming the repair. That refusal is honest and it is also the shape a
  genesis-created project starts in, so the first departure anyone ever
  records is the one this command cannot write.

## What a fix looks like

A `profile` case in the same command: the value set is the schema's own
profile list, the refusal is the one `resolveProcess` already raises for
a profile the schema does not declare, and the whole resolution is
re-run under the new profile so the constraints refuse a move that would
leave the project in a forbidden combination — the same machinery the
switch path already borrows. Setting a profile should also say how many
departures survive the move and which of them the new column makes
redundant, since a departure that now agrees with its profile is a line
that will read as a decision.

For the missing block: insert `  switches:` at the end of the section
and the entry under it, in one edit, keeping the same line discipline.

## Why it was not done in T-300

The card's criterion names `settings set <switch> <value>` and the size
is S. Both of these are new behaviour with their own refusals and their
own bodies, and the parent's diff already carries six.

## Acceptance criteria

- WHEN `settings set profile <p>` runs THE template's `profile:` line
  SHALL be edited only where the schema declares that profile and the
  resolution under it satisfies every constraint, and a refusal SHALL
  name the profile and the constraint.
- WHEN a `process:` section carries no `switches:` key AND a departure
  is set THE block SHALL be created with the entry under it, and the
  section's existing lines SHALL be unchanged.
