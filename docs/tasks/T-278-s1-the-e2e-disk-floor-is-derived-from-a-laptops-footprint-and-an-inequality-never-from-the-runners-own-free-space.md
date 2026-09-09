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

## The second reading (the architect seat, 2026-09-09T09:10Z, from run 34332162937 on c8d49b3 — the floor FIRED)

    runner disk before the e2e lane (floor 2 GiB), 09:09:30Z
    /dev/root  72G  72G  185M  100% /          (df -h . and df -h /tmp — one filesystem)
    inodes     9699328 used 1181382 free 8517946 (13%)
    free at .: 188480 KiB against a floor of 2097152 KiB (2 GiB)
    ::error title=runner disk below the e2e floor:: . has 184 MiB free …
    e2e lane: skipped.  runner disk after the e2e lane: ran (the pair is unconditional).

What differs from the first reading and what does not: the diff from the last green run (9d82341, 4,439,512 KiB free) to this red one (c8d49b3) is docs-only — four card and room commits, no .ts, .rs, .mjs, .yml or lockfile moved; the cargo cache was a HIT on the same key (cargo-Linux-63478ea…, 1,564,741,738 B) in both runs; the playwright cache was a HIT on the same key in both. Steps 1–25 were green in both. One input did differ, and it is the runner's, not ours: the "Set up job" step names the image, and the red run got ubuntu-24.04 image version 20260831.293.1 where the four green runs before it (34310933505, 34317380241, 34322246861, 34327558326) all got 20260907.300.1. So the fleet handed this run a week-older image, and that image reaches step 26 with 4.2 GiB less free — which of steps 3–25 grows on it the job cannot say (T-278-s2's claim, corroborated here: the two df readings bracket the lane and nothing reads the disk between steps 1 and 25).

What the floor bought: a red with the RUNNER'S DISK named in its first line at 09:09:30Z, eleven minutes in, instead of an ENOSPC ninety seconds into the lane with the repository blamed. Main is red on CI at c8d49b3 for that reason and no other; the tree is the tree that was green at 9d82341 plus four docs commits.

The band so far: 4,439,936 / 4,439,564 / 4,439,512 KiB on three consecutive runs, then 188,480 KiB. Two points at two levels is not a distribution either; the floor is not re-derived from this reading. The reading the next card needs is a `df` AFTER EACH of steps 3, 6, 7, 15, 17, 21 and 25 (the prerequisites, the two caches, the app build, cargo, e2e install, browsers) — one line each, with the image version printed beside the first — so a swing like this one is attributed to a step on a named image, not to "the VM".

## The third reading (the architect seat, 2026-09-09T09:31Z, from run 34334103318 on cc41ff3 — the floor fired AGAIN)

    free at .: 188156 KiB against a floor of 2097152 KiB (2 GiB); image ubuntu-24.04 version 20260831.293.1

The same image as the second reading, the same free space to within 324 KiB, on a push whose diff from the red c8d49b3 is the T-256 merge and the T-271 stamp. Two consecutive runs on the older image, both at 184 MiB; four consecutive runs on 20260907.300.1 before them, all at 4.3 GiB. The fleet is handing out the older image now, so every push is red at the floor until either the image rotates or the job frees the runner's disk before the e2e lane — which is what T-278-s2's amendment asks for.
