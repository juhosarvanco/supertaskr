---
id: T-256-s1
title: The second install spelling survives outside T-256's fence — app/README.md, the app launcher's step 4, and one error message still say `npm install` for app/
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-256
blocked_by: []
touches: [app/README.md, bin/app-dev.mjs, app/test/graph-budget-bench.mjs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-256 made `npm ci` the one setup spelling for app/ in docs/CONVENTIONS.md
and retired the parity spec's mapping, but three files outside that
lane's fence still tell a reader to run `npm install` from app/ — and one
of the three may be RIGHT to, which is why this is a card and not a
sweep.

**FOUND WHILE BUILDING T-256, NOT FIXED THERE.** That lane's fence is
`docs/CONVENTIONS.md` and `tools/e2e/tests/workflow-parity.spec.ts`;
none of the files below is inside it.

## The sweep, at `cf7c690`

`git grep -n "npm install"` over the tree with the record directories
excluded (`docs/tasks`, `docs/checkpoints`, `docs/decisions`,
`docs/rooms` — records are never rewritten):

    app/README.md:6                     `npm install` — setup
    bin/app-dev.mjs:14, 361             the documented ritual and the
                                        printed plan
    bin/app-dev.mjs:425                 the RUN itself, as the argv
                                        ["install"] — which the grep above
                                        does NOT match, because the
                                        spelling is split across the call
    app/test/graph-budget-bench.mjs:193 an error message telling the reader
                                        to run `npm install` from app/ first

`docs/reference/14-versions.md:55` also names the change as a p3 entry in
the version catalogue; that is a record of the plan and stops being true
on its own when the board moves.

## What each one decides — and one of them is NOT a rename

- **`app/README.md`** is the cheap half, and it reads as a contradiction
  the moment T-256 lands: CONVENTIONS says `npm ci` for setup and the
  package's own README says `npm install`. A reader who follows the
  README inside a lane meets the exit 243 EACCES T-256 exists to remove.
- **`bin/app-dev.mjs` step 4 IS ARGUABLY CORRECT AS IT STANDS AND MUST BE
  RULED, NOT RENAMED.** The launcher opens @human's app worktree, which
  is DETACHED and holds no fence, so `npm install` cannot fail there the
  way it fails in a lane. And CONVENTIONS' relaunch bullet says the
  opposite thing about `npm ci` in that seat: it removes
  `app/node_modules` while the human's vite serves out of it, destroying
  `node_modules/.vite`, which that bullet calls the one channel that
  CORRUPTS rather than interrupts. T-256's own new sentence names this
  case as the legitimate `npm install`. So the question is whether the
  launcher should keep `npm install` WITH THAT REASON WRITTEN BESIDE IT
  in its header comment, not whether to change it.
- **`app/test/graph-budget-bench.mjs:193`** is a message only, and costs
  a word.

## Acceptance criteria

- WHEN `app/README.md`'s setup line is read THE command SHALL be the one
  docs/CONVENTIONS.md's app/ bullet publishes.
- `bin/app-dev.mjs`'s step 4 SHALL either keep `npm install` with the
  live-app reason cited in its own header comment, or move to `npm ci`
  with the relaunch bullet's corruption hazard answered in writing.
- WHEN the esbuild message in `app/test/graph-budget-bench.mjs` fires IT
  SHALL name a command a fenced lane can run.
- Verification: headless.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the second install spelling survives at three named sites outside the fence that retired it. Not dispatched by this sitting.
