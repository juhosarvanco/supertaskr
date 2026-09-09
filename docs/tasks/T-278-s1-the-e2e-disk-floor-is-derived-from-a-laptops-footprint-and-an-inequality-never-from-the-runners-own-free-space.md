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
