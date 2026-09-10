---
id: T-264-s10
title: The launcher renamed its environment variable and a shell still exporting the pre-rename one is answered by the default, in silence — the one variable a human sets by hand is the one whose rename cannot be seen
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: verifier claude-opus-5@subagent, at T-264-s3's bench, 2026-09-10 — measured while checking that no pre-rename environment prefix survives outside docs/
blocked_by: []
touches: [bin/app-dev.mjs, tools/e2e/tests/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`bin/app-dev.mjs` reads exactly one environment variable and it moved to
`SUPERTASKR_APP_WORKTREE` in T-264-s3. Measured at that lane's tip: the
file reads `process.env[ENV_VAR]` once and nowhere else, so there is one
name and no compatibility read — which is what the criterion asked for.

**The cost lands on the one caller the variable exists for.** Every other
variable in this repository is set by a script or a suite, which moved in
the same commit. This one is set by a human, by hand, in a shell that
outlives the rename: an exported pre-rename name is now simply not read,
the launcher falls back to its stated default, and the run succeeds
against a directory the human did not choose. There is no error, because
from the launcher's side nothing is wrong.

The remedy is one guard and one message: if a variable spelled with the
pre-rename prefix is set and `SUPERTASKR_APP_WORKTREE` is not, refuse
loudly and name both spellings. A REFUSAL rather than a fallback, because
the file's own header says one variable and one stated default with no
second source — and a silent fallback IS a second source wearing the
default's clothes.

Two things the card owes whoever takes it. First, a guard that spells the
pre-rename prefix puts an occurrence back in `bin/`, which the rename
scan now walks — so the guard needs an enumerated class in
`tools/e2e/scripts/rename-scan.mjs`'s table naming the ruling that holds
it, exactly as the migration refusal in the fence hook is held today.
Second, the guard is dead code the day the last such shell is gone, so it
wants a stated expiry rather than a permanent seat.

## Acceptance criteria

- WHEN a variable carrying the pre-rename environment prefix is set and
  `SUPERTASKR_APP_WORKTREE` is not THE launcher SHALL refuse, naming both
  spellings, rather than falling back to its default.
- WHEN both are set THE launcher SHALL read `SUPERTASKR_APP_WORKTREE` and
  say in as many words which one it used.
- IF the guard spells the pre-rename prefix THEN
  `tools/e2e/scripts/rename-scan.mjs` SHALL carry an enumerated class for
  it naming the ruling that holds it, and
  `only the enumerated classes of the pre-rename identifier survive in the
  corpus` SHALL stay green.
