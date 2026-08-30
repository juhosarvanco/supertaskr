---
id: T-164
title: One command launches the human's app worktree fresh — detach at main, rebuild the parser, start tauri dev, so the three-step ritual and its silent-staleness trap stop living in a note
feature: F-02
milestone: 4
priority: 8
size: S
status: done
blocked_by: []
touches: [bin]
suggested_by: "@human (2026-08-30): file the launcher script card — a one-command launcher for the separate app worktree"
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
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

## Implementation notes

**THE SCRIPT IS `bin/app-dev.mjs`, ONE FILE, AND THAT IS THE WHOLE
DIFF** (plus this card and its two suggestions). Built at
`6e83065`, dry-run evidence captured at that commit's tree.

THE HOME, ARGUED AND KEPT (2026-08-30): `bin/` stays, deliberately
rather than by default. Three alternatives were weighed. `tools/e2e/
scripts/` is where every other `.mjs` in this repository lives, but that
directory is the E2E PACKAGE — its scripts are gates, they are run
through `npm run` from a package with installed dependencies, and this
launcher is neither a gate nor an e2e artifact; putting it there would
make a human's launcher require `npm ci` in a package the launcher does
not use. A `package.json` script in `app/` was rejected because the
launcher's first act is to move the worktree the script would be running
FROM. A repository-root `Makefile` was rejected because nothing here uses
one. `bin/` is the conventional home for an executable a human types, it
is this card's declared fence, and it costs the map nothing — see the
next paragraph.

THE EXTENSION IS LOAD-BEARING AND `.mjs` IS THE RIGHT ONE: the indexer's
language allowlist DELIBERATELY EXCLUDES `.mjs`/`.cjs`
(`app/src-tauri/crates/nputer-index/src/graph.rs`, `Lang::for_extension`,
pinned by its own exact-set test), so this file enters no graph, spends
no graph budget, and claims no component. A `bin/app-dev.js` would have
entered the graph as an unmapped file and made a launcher a map problem.

THE ONE PLACE THE PATH COMES FROM is `NPUTER_APP_WORKTREE`, default
`~/Projects/nputer-app` (stated in the script's `--help`, in every plan
it prints, and in every refusal). It joins the `NPUTER_E2E_PORT` /
`NPUTER_BOOT_PORT` family. Set-but-empty REFUSES rather than falling
back: an empty value is a mistake, and a silent fallback is how a
launcher opens the wrong tree.

INSTALL-IF-NEEDED IS DERIVED, in `installDecision()`, which is the only
place that decides and carries the reasoning in its own docblock:
node_modules absent -> install; else `package-lock.json` newer than
`node_modules/.package-lock.json` (the marker NPM ITSELF writes at the
end of an install) -> install; else skip. Where npm's marker is absent
the directory's own mtime is the fallback and the printed answer says
so. **AND IT IS RE-DERIVED AFTER STEP 1 IN A LIVE RUN**: `git checkout
--detach main` can move both lockfiles, so a decision taken before it is
a decision about the wrong tree — the plan printed up front says this in
as many words, and the live run prints each decision again, with its
reason, immediately before the step it governs.

THE TWO REFUSALS ARE STRUCTURAL, NOT NOMINAL. A lane is read as
`git symbolic-ref --short HEAD` starting with `task/` — so a DETACHED
head is not a lane, which is the whole reason the app worktree is
detached (CONVENTIONS, @human's ruling 2026-08-25). The integration
checkout is read as `dirname(git rev-parse --git-common-dir)`, the
repository's MAIN worktree, compared through `realpathSync` because
`/tmp` and `/private/tmp` are one directory with two spellings on this
platform and a missed comparison there is a missed refusal. Both fire
before anything executes, exit 3, naming target, reason and fix.

EXIT CODES are the four-code family this project's other scripts use:
0 finished · 1 A STEP FAILED (named, with its command, cwd and the
child's code; nothing after it ran) · 2 called wrong · 3 REFUSED before
executing anything.

VERIFICATION WAS HEADLESS AND THIS LANE RAN NO LIVE LAUNCH. A fixture
git repository was built in session scratch — a main worktree, a
detached worktree, and a `task/T-999-fixture` lane, each with a
`lib/parser` + `app` layout — and NEVER the real `~/Projects/nputer-app`.
Captured against it: the happy plan (both install branches visible in
one run: step 2 SKIP by mtime comparison, step 4 RUN by absent
node_modules); the same plan with the lockfile touched newer, flipping
step 2 to RUN with both timestamps printed; the lane refusal
(`HEAD is on branch task/T-999-fixture`); the integration-checkout
refusal; and the missing-target refusal. A LIVE run against the fixture
(never against the app worktree, never reaching `tauri dev`) proved the
loud stop: step 1 executed, step 2 re-derived and skipped, step 3
FAILED on the fixture's missing build script, exit 1, and `STEP 5`
appeared zero times in the output.

HONEST RESIDUALS, none of them criteria:
- The script writes nothing of its own. On a FAILED npm step, npm writes
  its own debug log under `~/.npm/_logs/` — npm's write on any hand-run
  of the same command, not the script's, and the criterion's subject is
  the script.
- It does not detect a DIRTY target worktree. `git checkout --detach
  main` refuses loudly by itself where the checkout would overwrite
  local changes, and that refusal is step 1's named failure.
- POSIX only (`npm` resolved from PATH by execvp, no shell). This
  project runs on Darwin.
- `npm ci` for lib/parser and `npm install` for app/ are CONVENTIONS'
  own spellings for those two packages, not a choice made here. `npm ci`
  is destructive to node_modules by design, which is the subject of the
  first suggestion below.

ROUTED, NOT FIXED: `T-164-s1` (the launcher cannot tell whether the app
is already running, because this card's own criterion forbids it to
look) and `T-164-s2` (nothing outside `bin/` mentions the launcher, and
CONVENTIONS is outside this fence).
