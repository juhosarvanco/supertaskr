---
id: T-164
title: One command launches the human's app worktree fresh — detach at main, rebuild the parser, start tauri dev, so the three-step ritual and its silent-staleness trap stop living in a note
feature: F-02
milestone: 4
priority: 8
size: S
status: planned
blocked_by: []
touches: [bin]
suggested_by: "@human (2026-08-30): file the launcher script card — a one-command launcher for the separate app worktree"
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED AT @HUMAN'S DIRECT REQUEST (2026-08-30), planned at filing.**

@human opens the app through a three-step ritual kept in a personal
note: `git -C ~/Projects/nputer-app checkout --detach main`, then
`npm run build` in that worktree's lib/parser, then `npm run tauri dev`
from its app/. Every step exists for a reason a script can carry so a
note doesn't have to: the detached worktree is deliberate (STATE pins
it — not a lane, never collides with one), the parser rebuild is
mandatory because `lib/parser/dist` is a build artifact no merge
updates (the standing hazard), and a missed `npm install` after a
dependency-moving merge fails with a message about modules rather than
about the actual cause.

## Acceptance criteria

- THE repository SHALL gain one script (`bin/` is the creation-target
  fence; the seat may argue a better home ON THE CARD, dated) that a
  human runs with no arguments to: detach the app worktree at local
  main, install-if-needed and rebuild lib/parser, install-if-needed in
  app/, and start `tauri dev` — in that order, stopping LOUDLY at the
  first failure with the failing step named.
- THE script SHALL take the app-worktree path from one place — an
  environment variable with `~/Projects/nputer-app` as the stated
  default — and SHALL refuse, with the reason, if that path is a lane
  (on a `task/` branch) or is the integration checkout itself: this
  launcher exists so that USING the app never collides with lanes.
- "Install-if-needed" SHALL be derived, not guessed — e.g.
  node_modules absent or lockfile newer than it — and stated in the
  script where it decides.
- THE script SHALL NOT touch port 1420 beyond what `tauri dev` itself
  does, SHALL NOT probe it, and SHALL NOT write anywhere outside the
  app worktree it is pointed at.
- WHEN the script's preconditions hold and the steps pass, THE result
  SHALL be the running dev app — no extra flags, no second command.
- Verification is headless where possible (a dry-run flag that prints
  the derived plan without executing is acceptable evidence for the
  decision logic); the one live launch is @human's to enjoy, not a
  suite's to automate — the pipeline never drives the app (standing
  rule).

## Fence note at filing

`touches: [bin]` is a creation target (T-160 class (a): stated
explicitly). Nothing else on the board fences `bin/`; the card is
dispatchable the moment a seat is free, and collides with nothing.

PREFLIGHT RULING (2026-08-30): the finding "UNCOVERED CRITERION PATH lib/parser" is RULED ACCEPTABLE — the criterion names lib/parser as a directory the SCRIPT acts on AT RUNTIME inside the app worktree it is pointed at (~/Projects/nputer-app or the env-named path), never as a write target in this repository; the lane writes only under bin/. The T-167 runtime-surface precedent, same date. The "bin" token finding was CORRECTED instead: bin/ now exists (.gitkeep), the census exception retired by its own leaving condition in the same commit.
