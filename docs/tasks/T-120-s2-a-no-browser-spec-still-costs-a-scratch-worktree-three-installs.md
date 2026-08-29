---
id: T-120-s2
title: 92 e2e bodies open no browser and every POISON DRILL still pays 330M of installs and a vite boot to run one of them
feature: F-01
milestone: 4
priority: 11
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5 @T-120
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29.** This is the card that
makes a standing discipline affordable, and the argument for it is the
second-order one the finding states plainly: *a discipline whose setup
costs 330M and several minutes is one a session under pressure finds
reasons to run once instead of nine times, which is the direction that
turns a drill into a gesture.* The POISON DRILL is mandatory for any
task that adds or changes a test body, it mandates a detached worktree
precisely for the specs that read first-party source, and that is the
same set as the five headless spec files.

Needle re-checked at this base: `tools/e2e/playwright.config.ts` declares
exactly one project (`chromium`) and an unconditional `webServer` with
`reuseExistingServer: false`, and `preflight.ts` throws at CONFIG LOAD
for a missing `lib/parser/dist`, a missing `app/node_modules` or a busy
port — so naming a single headless spec on the command line does not
avoid any of it. This sitting paid a version of the same toll: its own
fresh worktree could not run `docs-gate.mjs` until `npm ci` had been run
in `tools/e2e`.

## Acceptance criteria

- WHEN a spec that opens no browser is run from a bare `tools/e2e`
  checkout THE run SHALL succeed without `lib/parser/dist`, without
  `app/node_modules` and without a vite boot.
- THE browser preconditions SHALL be asserted for the browser project
  only, not unconditionally at module scope, and the split SHALL be
  derived from what each spec actually needs rather than from its
  filename.
- **THE PORT PROBE SHALL NOT MOVE WITH THE PRECONDITIONS.**
  `resolveLanePort`'s refusal on 1420 is the only thing standing between
  a lane and @human's live window; it SHALL run for anything that binds
  a port and for nothing that does not, and the lane SHALL pin both arms.
- WHEN the split lands NO arm of any spec's behaviour SHALL move — the
  same bodies run, with the same results, under both projects — and the
  lane SHALL show this by running the full lane before and after at its
  own ref.
- THE headless set SHALL be DERIVED at the lane's ref, not transcribed:
  this card's five files and 92 bodies are a floor measured at `c4cfe52`
  by the strictest available test (the string `page` absent from the
  file), and two further specs are excluded only because they mention
  `page` somewhere.
- THE change SHALL carry its own drill, since it changes how every spec
  in the lane is run.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
