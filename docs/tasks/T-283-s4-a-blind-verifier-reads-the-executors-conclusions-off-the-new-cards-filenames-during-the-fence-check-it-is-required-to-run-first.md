---
id: T-283-s4
title: "A phase-2 verifier's FIRST required act is the fence check — `git diff --name-only` — and a lane that filed self-describing suggested cards hands it the executor's conclusions in that same output, before a single measurement is taken"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-283 phase 2, 2026-09-09, measured on the bench /Users/ujju/Projects/nputer-V-T-283 at the tip afd454b"
blocked_by: []
touches: [method/roles/verifier.md, method/roles/orchestrator.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

`roles/verifier.md` step 0 keeps the verifier out of the executor's
notes, reasoning and commit messages, and `roles/orchestrator.md` 5d
closes it by construction with two spawns. Both reason about the notes,
the report and the commit messages. **Neither reasons about the card
FILENAMES**, and the fence check is the one act a phase-2 brief orders
FIRST — before the criteria, before the mutants, before anything is
measured.

Run on T-283 at `afd454b8f8b866d1f8d5632d7f1414ea32b459cf`, the required
`git diff --name-only 677941a..afd454b` returned, among six paths:

    docs/tasks/T-283-s1-the-in-fence-follow-through-rule-lands-in-method-prose-and-nine-one-side-data-mutants-leave-the-eval-gate-green.md
    docs/tasks/T-283-s2-whether-a-follow-through-may-absorb-an-already-filed-card-that-lies-inside-the-lanes-fence-is-unruled.md
    docs/tasks/T-283-s3-the-more-than-three-follow-throughs-signal-is-written-into-the-notes-and-nothing-at-triage-ever-counts-it.md

Three of the executor's own conclusions — that the eval gate is blind to
the rule, that absorbing a filed card is unruled, and that the
more-than-three signal has no reader — reached the verifier in the
output of the command its brief told it to run first. The lane did
nothing wrong: `tasks/TASK-FORMAT.md` asks a card's title to say what was
found, and the slug is derived from the title.

**The leak is structural and it is the same class the method already
names.** `roles/executor.md`'s brief rules say a duties section naming
executor-derived specifics "has already broken phase 1 above the line";
this is that failure arriving through the filesystem instead of the
brief, and no marker rule or second spawn reaches it — a phase-2 seat
holds shell tools by definition.

## Acceptance criteria

- WHEN a phase-2 verifier runs the fence check THE method SHALL say what
  it does with the card filenames it necessarily reads — either that the
  disclosure is owed in the verdict (the honest weaker thing this method
  already prefers), or that the check is taken over a path list the
  dispatcher redacted to `docs/tasks/<new>` placeholders.
- WHEN the disclosure route is taken THE verifier's verdict SHALL name
  which executor conclusions arrived this way, so a later reader can tell
  a measurement from a confirmation.

## Implementation notes

## Verdicts
