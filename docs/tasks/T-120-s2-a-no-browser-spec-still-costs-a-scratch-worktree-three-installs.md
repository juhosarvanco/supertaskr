---
id: T-120-s2
title: 92 e2e test bodies never open a browser, and running any one of them in a scratch worktree still costs three npm installs, a parser build and a vite boot — which every POISON DRILL pays
status: suggested
suggested_by: executor claude-opus-5 @T-120
---

**Found by paying it.** T-120's drill is nine mutants over
`tools/e2e/tests/docs-input-gate.spec.ts` — a spec whose own header
says *"THE DOCS GATE (T-084) — no browser."* The POISON DRILL bullet
requires a detached scratch worktree, so the drill cut one and then
could not run a single body until it had installed the whole
application.

## The measurement, at `0c4fba4` in `/Users/ujju/Projects/drill-T-120`

Before `npx playwright test tests/docs-input-gate.spec.ts` would start:

| step | why it is required | footprint |
|---|---|---|
| `npm ci` + `npm run build` from `lib/parser/` | `assertLanePreconditions` throws on a missing `lib/parser/dist/pure.js` | 50M |
| `npm install` from `app/` | `assertLanePreconditions` throws on a missing `app/node_modules` | 235M |
| `npm ci` from `tools/e2e/` | the lane's own package | 45M |
| a vite dev server boot, **every invocation** | `playwright.config.ts`'s `webServer`, `reuseExistingServer: false` | per run |

**330M of `node_modules` and a parser build to run 42 bodies that open
no page.** Both throws fire at CONFIG LOAD, from
`tools/e2e/preflight.ts`, so naming a single headless spec on the
command line does not avoid them — the config runs before Playwright
decides which files it was asked for.

## THE CLASS IS NOT ONE SPEC

Derived at `c4cfe52` by the strictest available test — spec files in
which the string `page` does not occur at all:

| spec | top-level `test(` bodies |
|---|---|
| `tests/boot-check-guard.spec.ts` | 14 |
| `tests/docs-input-gate.spec.ts` | 42 |
| `tests/token-scan.spec.ts` | 10 |
| `tests/workflow-parity.spec.ts` | 17 |
| `tests/workflow-permissions.spec.ts` | 9 |

**5 files, 92 bodies.** Two more (`blocker-retarget`, `map-retarget`)
have no `async ({ page })` body and are excluded here only because they
mention `page` somewhere, so 92 is a FLOOR rather than the count.

## Why it is worth a card rather than a shrug

**The POISON DRILL is a standing discipline, not an occasional one**,
and it mandates the detached worktree precisely for the specs that read
first-party source — which is the same set as the table above. Every
drill on any of those 92 bodies pays this, and the cost is paid again
per lane because a scratch worktree is per lane by design.

**It also shapes what gets drilled.** A discipline whose setup costs
330M and several minutes is one a session under pressure finds reasons
to run once instead of nine times, which is the direction that turns a
drill into a gesture.

## The shape of the fix, not a decision

Playwright supports more than one `project`, and `webServer` can be
scoped. A `node` project holding the five headless spec files, with no
`webServer` and no browser, would run them from a bare `tools/e2e`
checkout. `assertLanePreconditions` would then need to assert the app
preconditions **for the browser project only** — today it asserts them
unconditionally at module scope.

**THE PORT PROBE MUST NOT MOVE WITH IT.** `resolveLanePort` throws on
1420, the human's live app, and that throw is the only thing standing
between a lane and the running window. Whatever splits, that check runs
for anything that binds a port and for nothing that does not.

**FENCE: `[tools/e2e]`** — the same fence T-120 held. It was NOT built
there because it is out of that card's scope in both directions: T-120's
criteria say *"NO ARM OF THE GATE'S BEHAVIOUR MOVES"*, and a
`playwright.config.ts` split changes how **every** spec in the lane is
run, which is a change that deserves its own drill and its own verifier
rather than a ride on a regression pin.
