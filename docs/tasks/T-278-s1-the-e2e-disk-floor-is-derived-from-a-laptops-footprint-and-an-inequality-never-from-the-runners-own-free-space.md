---
id: T-278-s1
title: "The e2e disk floor is 2 GiB derived from a laptop's footprint and an inequality, never from the runner's own free space — the first green run after T-278 prints that figure and nobody is asked to read it"
feature: F-04
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278 gives ci.yml a floor of 2 GiB before the e2e lane. The number is
derived, but from two things that are not the runner: the lane's own
temp footprint sampled on a Mac (peak 228,420 KiB), and the inequality
that a runner which redded ninety seconds in, having spent at most that
peak, had under ~223 MiB free before the lane. Nothing in that chain is
a reading of an ubuntu-24.04 runner's free disk at that point in the
job, because no run has ever printed one. The first run after T-278
lands does print it — `df -h .` and `df -h /tmp` in the step's own
output — and at that moment the floor should be re-derived from a real
headroom figure instead of from a laptop and an argument. The step's
comment says so in prose; prose is not a keeper.

Class parent: T-278 (this is its own follow-up, not a second instance).
Disposition hint: promote as soon as one green run exists on main after
T-278 merges — the whole card is reading two numbers out of a log and
either confirming 2 GiB or moving it in the one place it is written.

## The first reading (the architect seat, 2026-09-09T06:30Z, from run 34317380241 on 9ba3b7b — the first run after T-278 landed)

The runner printed its disk for the first time, before and after the e2e lane, on a GREEN run (26 min):

    runner disk before the e2e lane (floor 2 GiB), 06:09:34Z
    /dev/root        72G   68G  4.3G  95% /      (df -h . and df -h /tmp: the same filesystem)
    /dev/root      9699328 1176653 8522675   13% /   (inodes)
    runner disk after the e2e lane, 06:28:33Z
    /dev/root        72G   68G  4.3G  95% /
    /dev/root      9699328 1177269 8522059   13% /

So a healthy ubuntu-24.04 runner reaches the lane with about 4.3 GiB free on a 72 GiB root at 95% used, and the lane's own footprint is below the reading's resolution (the same 4.3 GiB after; 616 inodes consumed). The 2 GiB floor sits under the healthy reading by roughly 2.3 GiB and above what the four red runners had (at most ~223 MiB, T-278's inequality). Re-derive the floor from this reading and the next few — one reading is a point, not a band.
