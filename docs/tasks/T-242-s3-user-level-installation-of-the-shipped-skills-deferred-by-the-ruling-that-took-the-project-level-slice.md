---
id: T-242-s3
title: "User-level installation of the shipped skills, deferred by the ruling that took the project-level slice — a skill installed per project is reinstalled per project, and the interview entry is the one a user wants everywhere"
feature: F-04
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-242, carrying forward the owner's ruling of 2026-09-14 that project-level installation ships and user-level follows without blocking it"
blocked_by: []
touches: [tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, docs/conventions/commands.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The installer writes into the opened project's own harness directory,
which is right for a pack that is policy for one repository and wrong
for the entry that STARTS a repository. The interview entry exists to
be invoked in a folder that has no plan yet, so requiring an install
into that folder before it can be invoked there is close to circular:
the user has to know the command before the skill can tell them
anything.

Claude Code also reads skills from a user-level directory, so the
mechanism exists on the harness side. What is missing is the scope
argument, the destination derivation for it, and the refusal shape
when a user-level destination already differs.

The owner's ruling of 2026-09-14 took the project-level slice and said
user-level follows without blocking it, so this card is that follow-up
and nothing here re-opens the ruling.

## Acceptance criteria

- WHEN the install command is given a scope argument naming the user
  level THE destination SHALL be the harness's own user-level directory,
  derived per harness the way the project-level one is, with no branch
  reading a harness id.
- WHEN no scope argument is given THE destination SHALL be the project
  level, so the shipped behaviour is unchanged.
- IF a user-level destination exists and differs THEN the command SHALL
  refuse it exactly as the project-level one does, honour `--force`, and
  honour `--dry-run`.
- WHEN a harness has no user-level directory THE command SHALL say so
  for that harness and install nothing for it, rather than inventing a
  path.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
