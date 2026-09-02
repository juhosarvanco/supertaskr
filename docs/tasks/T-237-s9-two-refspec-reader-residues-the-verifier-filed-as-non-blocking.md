---
id: T-237-s9
title: Two residues of the refspec reader the verifier filed rather than blocked on — a `--repo=<value>` eats the only refspec, and a destination beginning with `-` reaches `gh` as `--branch`'s value
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-237-s2
blocked_by: [T-237-s2]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FILED RATHER THAN FOLDED IN, AND THE REASON IS THE FIX PASS'S OWN
SHAPE.** T-237-s2's verifier rejected the three residuals on ONE defect
(`--all`/`--mirror` let a live run through) and recorded these two beside
it as *"findings that do NOT block, filed rather than folded in"*. The fix
pass repaired the blocker and DECLARED these in the reader's limits block,
because a fix pass that widens its own diff is a fix pass the verifier has
to judge twice. They are carried here so the declaration has a repair
behind it.

## 1. `--repo=<value>` supplies the repository and the scanner still eats
a positional for one

`git push --repo=origin HEAD:main` is read as: `--repo=origin` skipped as
a one-token option, `HEAD:main` taken as the REPOSITORY, no refspecs left
— so `pushTargetBranch` falls back to HEAD's branch and the spelled
target `main` is never asked about. A FALSE NEGATIVE only: it can cost a
refusal, never cause one.

## 2. A destination beginning with `-` reaches `gh` as `--branch`'s value

`git push origin HEAD:--version` is read as a branch named `--version`,
and `ghRunListArgv` places it in the argv array where `gh`'s own parser
reads it as an option. **BOUNDED, AND THE BOUND IS WHY THIS IS NOT
URGENT**: there is no shell anywhere in this arm, nothing is executed,
`gh` answers non-zero and `classifyGhFailure` turns that into an announced
ALLOW — and git will not accept such a refspec either, so the push it
belongs to never happens and no run is cancelled. It is nevertheless the
class `pathsSince` shape-checks `headSha` against one arm over
(*"where a commit id was expected, and this guard will not hand that to
`git` as a revision"*), and the value off the command line carries no
such check.

## Acceptance criteria

- WHERE a push names its repository through `--repo`, THE reader SHALL
  treat every positional as a refspec, so a spelled target is read rather
  than eaten; a body SHALL drive `git push --repo=origin HEAD:main` and
  read back `main`.
- THE reader SHALL refuse to hand `gh` a target that could be read as an
  option — the narrowest shape check that can be true of a branch name —
  and SHALL say so the way `pathsSince` says it, in an announced allow
  and never a refusal; a body SHALL drive `HEAD:--version` through the
  wired hook and read the shim's own argument record to show it never
  arrived.
- THE limits block SHALL lose both entries as it gains the repairs, so
  the header stays true rather than accumulating retired declarations.
- Verification: headless.
