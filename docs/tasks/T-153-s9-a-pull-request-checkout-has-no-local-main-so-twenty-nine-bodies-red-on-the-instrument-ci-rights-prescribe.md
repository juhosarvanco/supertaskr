---
id: T-153-s9
title: A pull_request checkout has no local `main`, so twenty-nine bodies red on the ONE instrument a lane is given to run CI with — the derivations resolve the integration branch by bare name and the event type decides whether that name exists
feature: F-01
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder:
verifier:
built_by:
verified_by:
review:
---

## The measurement — two runs, one repository, one difference

| run | event | checkout | e2e lane |
|---|---|---|---|
| 33260414204 | `push` to main | the `main` branch | 4 failed / 254 passed |
| 33264083542 | `pull_request` (PR #3, this lane) | detached at the PR merge ref | **31** failed / 250 passed |

Twenty-nine of that difference are ONE cause, and every one of the
twenty-nine is **green in run 33260414204 at the same body index**:

    fatal: ambiguous argument 'main': unknown revision or path not in
    the working tree.

thrown out of `git log --first-parent --format=%H %s main`.

The bodies: `brief.spec.ts` at :255, :291, :313, :630, :656, :679, :706
(seven); `card-figures.spec.ts` at :121, :132, :144, :157, :173, :187,
:198, :213, :226, :264, :276, :291, :316, :331, :347, :384, :398, :409,
:425, :431, :438 (twenty-one); `dispatch-order.spec.ts` at :200 (one).
The remaining two are `T-153-s6`'s and are a different card.

## The mechanism

`tools/e2e/scripts/dispatch-brief.mjs` derives `integrationBranch` from
`docs/CONVENTIONS.md`'s lane bullet — correctly, that is where the
project's spellings live — and then spends it as a BARE REVISION:
`git log --first-parent --format=%H %s ${s.integrationBranch}`.
`card-figures.mjs` spends the same spelling the same way for its
`history <branch> first-parent commits` figure.

`actions/checkout` on a `pull_request` event leaves the workspace at a
DETACHED merge ref and creates no local branch, so the name `main` — a
local branch on a push-to-main runner and in every developer checkout —
resolves to nothing. The spelling is right and the RESOLUTION is
event-dependent, which is why no local run and no push run has ever seen
it.

**IT IS NOT A LINUX DIVERGENCE**, and that matters for how it gets
triaged: the same PR checkout on macOS would throw identically. It sits
beside `T-153-s2`, `T-153-s5` and `T-153-s6` only because CI's first
contact is where all four became visible.

## Why it is worth a card rather than a shrug

**The lane's ONE sanctioned way to run CI is a draft PR.** `ci.yml`
triggers on `push` to `main`, on `pull_request`, and on
`workflow_dispatch`; a lane may not push main, so a PR is the instrument
a dispatch brief hands an executor. That instrument currently
manufactures twenty-nine reds that the merge will not reproduce — and a
lane reported as reddening trees it never opened is the failure
`docs/CONVENTIONS.md`'s RANGE RULE calls *the worse of the two*, arriving
through CI instead of through a diff. Any lane that reads the run's
COLOUR rather than its per-body results now draws the wrong conclusion,
and the next one will not have this card's list to check against.

## What it would take

Resolve the integration ref rather than assuming it: take the first of
`main`, `origin/main`, `refs/remotes/origin/main` that
`git rev-parse --verify` accepts, at the one place the spelling is spent.
Two call sites today (`dispatch-brief.mjs`, `card-figures.mjs`), which
argues for ONE resolver rather than two fixes (T-057). Where none
resolves, the derivation should reach its own COULD-NOT-RUN code rather
than throwing an exec error through a body — the four-code discipline the
rest of this tooling already keeps.

**A POSITIVE CONTROL IS OWED AND IS CHEAP HERE**, because the fix is a
fallback and a fallback that never fires is indistinguishable from one
that is wrong: exercise the resolver against a checkout where `main` does
NOT resolve, not only against one where it does.

**FENCE.** `tools/e2e` — the same fence `T-153-s5` held. It is routed
rather than built because it is not that card's subject: the criteria
there are the clock-restore guard's, and a lane widening its own subject
is the class this project refuses even when the paths happen to line up.
