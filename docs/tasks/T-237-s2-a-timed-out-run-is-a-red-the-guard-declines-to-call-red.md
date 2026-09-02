---
id: T-237-s2
title: A `timed_out` or `startup_failure` run is a red the CI arm declines to call red — the announcement is keyed to the single conclusion the card named, and the other three reach a seat as "not read"
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-238]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE CARD SAID `failure` AND THE BUILD OBEYED IT LITERALLY, WHICH IS
CORRECT AND IS NOT COMPLETE.** T-237's second criterion reads *"WHERE the
newest completed run is `failure`"*, so `FAILED_CONCLUSION` is the single
string `"failure"` and the full announcement — run id, failing step, and
whether the pushed tree reaches that step's package — fires only there.

GitHub's other terminal conclusions do not vanish; they land in the arm's
catch-all sentence:

    CI'S LAST VERDICT WAS NOT READ: run <id> concluded `timed_out`,
    which this guard reads as neither `success` nor `failure`.

That is honest and it is thin. A `timed_out` run IS main being red — a
suite that hung is a suite that did not pass — and a `startup_failure`
is a runner that never got as far as the code. Both currently cost the
seat a `gh run view` by hand, which is the manual step this whole arm
exists to remove.

**WHY IT WAS NOT WIDENED IN THE LANE.** Widening `FAILED_CONCLUSION`
changes what the guard SAYS about a tree, which is a change to a guard's
behaviour and therefore a card rather than an edit — and one of the four,
`cancelled`, must NOT be widened into, because under
`.github/workflows/ci.yml`'s `cancel-in-progress: true` a cancelled run is
usually **this guard's own subject** (a superseded push) rather than a
verdict about the tree. T-237 already counts and reports those
separately. So the widening is a judgement per conclusion, not a set
union, and it deserves its own argument.

## Acceptance criteria

- WHERE the newest run that reached a verdict concluded `timed_out` or
  `startup_failure` THE guard SHALL announce it with the same shape it
  gives `failure` — the run id, the failing step where one is named, and
  whether the pushed tree reaches that step's package — and SHALL NOT
  refuse on that ground.
- THE `cancelled` conclusion SHALL remain OUT of that set, and the
  reason SHALL be recorded where the constant is: a cancellation is the
  footprint of a superseded push and not a verdict about a tree.
- A body SHALL show each widened conclusion producing the full
  announcement AND a `success` producing silence in the same fixture
  shape, so the arm cannot pass by announcing everything.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3; two siblings ride

The architect seat, at the stamp of T-237's merge (44a95c3). Three
findings edit the same hook and the same spec, each a few lines; they
are one lane, behind T-238, which holds both files for the holder
record. Criteria: `timed_out`, `startup_failure` and `action_required`
SHALL reach the same announcement as `failure`, with the conclusion
named; the two absorbed asks below are criteria of this lane.

## Absorbs: T-237-s4 (2026-09-02)

The 15-second `gh` timeout is a bound picked in a lane. The lane SHALL
measure the two `gh` calls' wall time on this machine and in CI (the
push-guard spec's own shim can time them; a real `gh run list` against
this repository gives the figure), print both beside the bound in the
hook's declared-limits header, and either justify 15 s from the
measurement or move it; the two calls SHALL be issued in one round trip
where the API allows, or the header SHALL say why not.

## Absorbs: T-237-s6 (2026-09-02)

The CI arm derives its branch from HEAD, so a refspec push
(`git push origin HEAD:refs/heads/main`) from a lane checkout is asked
about the lane's branch and allowed in silence while the same push from
a `main` checkout is refused (measured by the verifier with a
branch-aware shim). The lane SHALL read the push's TARGET branch from
the refspec when one is spelled, fall back to HEAD's when none is, and
disclose the alias/eval residue in the header the way `gitInvocations`
already does; a body SHALL drive the refspec form from a non-main
checkout through the wired hook and show it refused.
