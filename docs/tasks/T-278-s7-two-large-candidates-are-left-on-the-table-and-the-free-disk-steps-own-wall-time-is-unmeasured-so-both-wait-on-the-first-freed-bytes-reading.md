---
id: T-278-s7
title: "Two of the image's largest trees are deliberately left on the table and the free-disk step's own wall time is unmeasured — both are decided by the first freed-bytes reading, and one of them may say the step should not run at all on a healthy image"
feature: F-04
milestone: 4
size: S
priority: 4
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

## The candidates not taken

T-278-s2's criterion names six candidate groups and this lane took
exactly those six: `/usr/share/dotnet`, `/usr/local/lib/android`,
`/opt/ghc` with `/usr/local/.ghcup`, `/opt/hostedtoolcache/CodeQL`,
`/usr/share/swift`, and the shipped docker images. Two large trees the
image also carries were left alone, each for a reason:

- **`/usr/lib/jvm`** (five JDKs on ubuntu24/20260831.293's manifest: 8,
  11, 17, 21, 25). No step of this job invokes java — checked against
  every step of ci.yml — but `/usr/lib` is in the step's PROTECTED set,
  because that is where the apt step's Tauri v2 prerequisites land, and
  a candidate inside a protected path is refused by the step at run time
  and by `freeDiskProblems` at lane time. Taking it means splitting the
  protected entry into the directories the apt set actually uses, which
  is a smaller, more brittle guard than `/usr/lib`.
- **`/usr/local/share/powershell`** and the PowerShell modules. Not in
  the card's list; no argument against it beyond that.

## The cost nobody has measured

The step runs UNCONDITIONALLY, and that was deliberate: a step that only
fires on a bad image is a step nobody ever sees run, and the arrival
reading is owed on every run anyway. But it `du -sh`s six trees and
`rm -rf`s what is likely tens of GiB on EVERY run, including the ones
that reach the floor with 4.3 GiB free and never needed a byte of it.
**No seat can measure that here**: it is a property of the runner, and
this lane says so plainly rather than guessing.

## What a fix decides

- Whether the freed figure (T-278-s1's fourth reading) makes any further
  candidate worth taking at all — six groups already free far more than
  the ~4.2 GiB deficit the two red runs showed.
- Whether the step's wall time justifies a headroom condition. That
  buys a SECOND number needing a keeper beside the floor, and costs the
  removal path its exercise on healthy images; it is worth it only if
  the measured cost is minutes rather than seconds.
- If the answer is a condition, whether the ledger's arrival reading is
  what it tests, so the two numbers stay in one place.

## Read beside

T-278-s1 (the floor re-derived from a measured reading), T-278-s6 (the
step's placement), and the software manifest this lane read:
`gh api repos/actions/runner-images/contents/images/ubuntu/Ubuntu2404-Readme.md?ref=ubuntu24%2F20260831.293`.
