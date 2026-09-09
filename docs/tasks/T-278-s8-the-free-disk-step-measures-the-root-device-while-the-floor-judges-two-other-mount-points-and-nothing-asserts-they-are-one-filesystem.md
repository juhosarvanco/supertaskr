---
id: T-278-s8
title: "The free-disk step measures / while the floor judges . and /tmp, and nothing in the tree asserts they are one filesystem — on the hosted runner they are, measured once; on a runner where they are not, the job frees a device the floor never reads"
feature: F-04
milestone: 4
size: XS
priority: 5
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-278-s2, 2026-09-09, at 2e9233d"
blocked_by: [T-278-s2]
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278's floor reads `.` (from `tools/e2e`) and `/tmp`, and refuses on
either. T-278-s2's free-disk step and its disk ledger read `/`, because
`/` is the device the removals actually free — every candidate is under
`/usr` or `/opt`.

**On the hosted runner these are one filesystem, and that is measured
rather than assumed**: run 34334103318's floor step printed
`/dev/root 72G 72G 184M 100% /` for BOTH `df -h .` and `df -h /tmp`.
The floor step's own comment already names the case it is guarding —
"on a hosted runner they are usually one filesystem, and the run that
proves they are not is the run this step exists for".

**So the gap is exactly that run.** On a runner where `/tmp` is a
separate mount, this job would free `/`, report a healthy delta, and
then red at a floor reading a device nothing had touched — with a log
whose freed figure argues the opposite of its verdict.

## What a fix decides

- WHETHER the free-disk step reads the same two points the floor does,
  before and after, so its delta and the floor's verdict are about the
  same devices; and whether the ledger does too.
- OR whether the job asserts the single-filesystem property once and
  says so loudly when it fails — cheaper, and it turns a confusing red
  into a named one.
- Either way, whether `workflow-parity.spec.ts` derives the agreement,
  the way it already derives that the floor's name and its `env:` state
  the same figure. Nothing today compares the two steps' measurement
  points at all.

## Read beside

T-278 (the floor and the pair of readings), T-278-s2 (the free-disk
step and the ledger), T-278-s4 (nothing compares the pair's own two
readings either — the same class, one step over).
