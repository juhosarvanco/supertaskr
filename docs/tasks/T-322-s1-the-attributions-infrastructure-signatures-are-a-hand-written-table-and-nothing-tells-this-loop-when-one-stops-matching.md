---
id: T-322-s1
title: "The attribution's infrastructure signatures are a hand-written table matched against a log, and nothing tells this loop when one stops matching: a phrasing change on the runner's side turns a billing block into an attributed regression, silently, and files a repair card against code that is fine"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-322, measured while building the attribution: INFRASTRUCTURE_SIGNS is five regular expressions typed from memory of what a runner says, and no body drives one against a real captured log"
blocked_by: [T-322]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322 asks the infrastructure question BEFORE the failing-body question,
and that ordering is the whole defence against filing a repair card
against code that is fine: every job reports a failure when the account
is blocked. The ordering is right. What carries it is
`INFRASTRUCTURE_SIGNS`, five regular expressions over the run's log,
written from what this project has seen a runner say.

The failure mode is quiet and it is the expensive direction. A runner
that rewords its billing message, a provider that changes a disk-full
phrasing, a new class of infrastructure failure nobody has met yet: each
arrives as a log that matches no signature, so the reader falls through
to the bodies, finds every job failing, and attributes a REGRESSION to
the merge. Nothing reds. The loop then dispatches a repair for a defect
that is not there, and does it while the owner is away.

The bodies this card's lane wrote drive each class from a log the body
itself typed, which proves the table is READ and proves nothing about
whether its rows still match what a runner writes. The two are different
claims and only the READ half is kept today.

## Acceptance criteria

- WHEN an infrastructure signature is claimed THE suite SHALL drive it against a CAPTURED runner log committed as a fixture, one per class, so a row that stops matching reds by name rather than falling through to the bodies.
- WHEN a red's log matches no signature AND every job in it failed THE attribution SHALL report that shape as its own answer rather than as a regression, because a whole run failing at once is the signature of something outside the tree even when the phrasing is new.
- WHEN a new class of infrastructure failure is met THE table SHALL be the one place it is added, and the suite SHALL red on a class the table declares with no fixture behind it.
- WHEN this lands THE conventions SHALL say where the captured logs live and how one is taken, since a fixture nobody can refresh goes stale in the direction that looks green.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
