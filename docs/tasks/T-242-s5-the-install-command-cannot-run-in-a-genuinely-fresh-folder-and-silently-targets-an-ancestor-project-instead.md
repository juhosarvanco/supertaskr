---
id: T-242-s5
title: "The install command cannot run in a genuinely fresh folder, and in a nested one it silently targets an ancestor project — the entry that STARTS a project cannot be installed into a folder that has not started one"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-242, measured on the bench at the lane's tip against the delivered installer"
blocked_by: []
touches: [tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/interview-skill.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`supertaskr install` resolves its destination through
`findProjectRoot`, which walks up from the working directory for a
folder carrying `docs/` and `method/`, or `docs/` beside a `.git`. That
rule is right for every other verb in the table — a gate has to know
which tree it is judging. It is wrong for the one verb whose whole job
is to put the interview entry into a folder that has no project in it
yet, because a folder with no project in it carries none of those
markers.

Two readings taken at T-242's tip, each in a scratch directory under
the system temp root:

- In a genuinely fresh folder — no `docs/`, no `method/`, no `.git` —
  the command exits 3 with "no supertaskr project above <cwd>". So the
  entry that exists to be invoked where there is no plan cannot be
  installed where there is no plan.
- In a fresh folder created INSIDE a directory that has `docs/` beside
  a `.git`, the walk succeeds on the ANCESTOR and the command reports
  that ancestor as "this project". Nothing says the destination is not
  the folder the user is standing in.

T-242's fresh-project body does not meet either, because its fixture
creates the marker directories before installing — deliberately, and
the fixture says so, since those markers are exactly what
`findProjectRoot` looks for. So the arrangement that makes the body run
is also the arrangement that hides this, and the criterion's letter is
satisfied while the story it tells is not available to a user.

T-242-s3 names the same circularity from the other side and answers it
with a user-level destination, which is a different fix: this one is
about what the command does when a user names a folder that is not yet
a project. The shapes are compatible and neither blocks the other.

## Acceptance criteria

- WHEN the install verb runs in a directory that carries none of the
  project markers THE destination SHALL be that directory, created as
  needed, rather than a refusal — the install verb is the one verb whose
  target may legitimately not be a project yet.
- WHEN the install verb runs in a directory nested inside a project THE
  command SHALL name the destination root it resolved in its output
  before writing anything, so an ancestor is never targeted in silence.
- IF the resolved destination is an ancestor rather than the working
  directory THEN `--root` SHALL remain the way to name either, with no
  change to what every other verb resolves.
- WHEN the behaviour is pinned THE bodies SHALL drive the CLI in a
  scratch directory that carries no markers and in one nested under a
  project, asserting the destination in both, with a control that a
  marker-carrying directory still resolves as it does today.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
