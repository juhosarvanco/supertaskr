---
id: T-278-s2
title: "The job now reads the runner's disk around the e2e lane and still cannot say which step consumed it — a red floor names the lane, never the apt install, the cargo target or the browser download that filled the disk"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278's pair of steps answers "was there room for the lane" and "what
did the lane spend". Neither answers the question the four ENOSPC runs
actually raise, which is what filled a runner that starts the job with
room: between the checkout and the lane the job installs six apt
packages (268 MB by its own log), restores a cargo cache and builds a
target, installs three node trees, builds the app bundle and downloads
Chromium with its deps (79.5 MB by its own log). When the floor fires,
the seat learns the lane could not run and nothing about which of those
grew. A reading at job start — or a `df` delta emitted after each
heavy step — would attribute it. Held back from T-278 deliberately: its
criteria name two steps, and a third is a different claim.

Class parent: T-278. Disposition hint: park behind T-278-s1 — decide it
with the first real headroom figure in hand, since a runner with 20 GiB
free needs no attribution and one with 3 GiB needs it badly.

## Corroboration (the architect seat, 2026-09-09T09:10Z)

Run 34332162937 on c8d49b3 is this card's claim, observed: the floor fired at 184 MiB free (the three runs before it read 4.3 GiB at the same step; the diff between them is docs-only; the cargo and playwright caches hit the same keys at the same sizes in both; the one differing input is the runner image — 20260831.293.1 against the green runs' 20260907.300.1), and the log cannot attribute the 4.2 GiB to any of steps 3–25 because nothing reads the disk between them. T-278-s1's second reading carries the figures.
