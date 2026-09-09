---
id: T-278-s2
title: "The job now reads the runner's disk around the e2e lane and still cannot say which step consumed it — a red floor names the lane, never the apt install, the cargo target or the browser download that filled the disk"
feature: F-04
milestone: 4
size: S
priority: 2
status: building
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

## Amendment (the architect seat, 2026-09-09T09:33Z, after the second consecutive red at the floor)

Run 34334103318 on cc41ff3 fired the floor again at 188,156 KiB free on image 20260831.293.1 — the same image and the same figure as run 34332162937 — so the condition is not one runner's bad day: main is red on CI on every push until the job either gets the newer image back or makes its own room. Attribution alone (the criteria above) leaves main red. These criteria are added, under @human's ruling of 2026-09-09 that cards sharing a fence are one lane (T-284), so the remedy and the attribution land together:

- WHEN the job reaches the e2e lane on an image that arrives below the floor THE job SHALL have freed the runner's disk BEFORE the floor is read — by removing preinstalled toolchains this workflow never invokes (the candidates, each measured with `du -sh` in the step's own log before removal: the .NET SDKs, the Android SDK, the Haskell toolchain, CodeQL bundles, Swift, and the docker images the image ships) — and the step SHALL print `df` before and after with the bytes it freed, so the reading in the log is the remedy's own measurement.
- WHEN the free-disk step runs THE step SHALL be idempotent and SHALL NOT remove anything under the checkout, the caches this workflow restores, `~/.cargo`, `~/.npm`, `~/.cache/ms-playwright`, or the toolchains the job invokes (node, rust, cargo-audit, the Tauri prerequisites); a candidate that is absent on the image SHALL be skipped with one line, never an error.
- WHEN the free-disk step and the floor step are read together THE floor SHALL remain the floor (2 GiB until T-278-s1 re-derives it), the free-disk step SHALL sit before it, and the workflow-parity spec SHALL pin the order and the protected paths, seen red on a ci.yml that lacks the step and on one that lists a protected path among the candidates.
- WHEN the first run after this lane's merge completes THE seat SHALL read the freed bytes and the free-at-floor reading from its log and append them to T-278-s1 as the fourth reading, on either image.
