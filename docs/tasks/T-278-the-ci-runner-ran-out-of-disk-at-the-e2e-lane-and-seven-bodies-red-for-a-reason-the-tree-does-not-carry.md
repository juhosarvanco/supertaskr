---
id: T-278
title: "The CI runner ran out of disk at the e2e lane (run 34300080330 on a6355bb): the arm's fence write and the docs harness both died of ENOSPC, seven bodies red for a reason the tree does not carry — the workflow owes a disk-space read before the lane and a card that names this red by its class"
feature: F-04
milestone: 4
size: S
priority: 10
status: building
suggested_by: "the architect seat, 2026-09-09, at the push of a6355bb (CI run 34300080330, FAILED; re-run requested)"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What happened

CI run 34300080330 on a6355bb (2026-09-09T01:39Z, ubuntu-24.04) FAILED in
the e2e lane with seven red bodies out of 706. The first, brief.spec.ts's
"THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file",
died at the arm's step 4 with the runner's own reason on stderr:

    the dispatch stopped at step 4 (fence) — expand the fence into the lane
    as its manifest. It ran: node .../brief.mjs --task T-901 --write-fence …
    ENOSPC: no space left on device, write

The other six — three shell-frame and three window-contract bodies —
reported "window.__supertaskrDocsHarness never appeared", the same words
T-267 filed for the harness's 15 s wait; on this run they share the cause
above (a dev server on a full disk). The same tree passed the whole
battery locally an hour earlier (battery52: 389/1163/645/706, all GREEN)
and the failed job was re-run rather than the tree changed.

## Why it is a card

The rule in docs/reference/10-gates.md: a platform-only red becomes a card
citing the run id. T-267 named the harness wait; ENOSPC is a different
class — the runner's disk, filled by three package installs, a cargo build
and a vite bundle in one job — and it reds the arm's own body first, which
reads as a landing-gate defect to anyone who does not open the log.

## Acceptance criteria

- WHEN the workflow reaches the e2e lane THE job SHALL print the runner's
  free disk (`df -h .`) as its own step, so a red of this class carries its
  reason in the step that precedes it, not only inside one body's stderr.
- WHEN free disk is below a stated floor THE job SHALL fail that step with
  the floor named, before any suite runs — a red that says "disk" and not
  "the arm could not write a manifest".
- THE workflow-parity spec SHALL pin the new step the way it pins every
  other step (a command changed in one place reds).
- The record of run 34300080330 and its re-run SHALL be in the next
  checkpoint's CI section, attributed to this class.

## Measured at the third red (run 34304932475 on 5775ac0, the seat, 2026-09-09 ~03:25Z)

The first `No space left on device` lands INSIDE the e2e lane, after
roughly five hundred bodies have passed (the log's line 3875, the arm's
bench cut `.git/worktrees/nputer-V-T-901/refs`), not before it: the
runner's caches restore fine (npm ~54 MB, cargo + target ~1.5 GB) and
the cargo suite, the app build and the lints all complete. So the disk
fills DURING the lane — the suspect is the e2e fixtures' own footprint
under /tmp (the ritual fixtures clone the repository with its history
and add worktrees per body; the landing-gate and lane-fence fixtures
each make a repository with a bare remote), not the caches. Three runs
in a row (a6355bb twice, 5775ac0 once) red the same seven bodies; the
last green runner is 683cd60 at 01:14Z with the same 706 bodies, so the
footprint sits at the runner's edge and any growth tips it.

Two more criteria this measurement adds:
- THE job SHALL print `df -h /tmp` before and after the e2e lane, and
  the lane's Playwright config SHALL remove each fixture's temp
  directory at the body's end (or the spec's), so the footprint is
  bounded by the largest single fixture, never by the sum.
- WHERE a fixture clones the repository, THE clone SHALL be
  `--depth 1 --no-tags` (or a `git worktree` of the runner's own
  checkout) unless the body needs history, and the body SHALL say so.
