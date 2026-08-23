---
id: T-089-s5
title: Twelve app bodies fail on an unbuilt worktree and every message blames a stale build rather than the missing one
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

Measured at `4d2f03c` in a fresh worktree with `npm ci` run in all three
packages and `lib/parser` built, before this lane changed anything:
`npm test` from `app/` is **12 failed / 828 passed of 840, across 5 test
files, exit 1**. After `npm run build` from `app/`, the identical tree is
**840 / 840, exit 0**.

The five files and what they read:

| file | what it reads |
|---|---|
| `test/window-manifest.test.ts` | the built CSS and the emitted breakpoint |
| `test/genesis-mount.test.tsx` | the built bundle carries the lens |
| `test/map-tasks-lens-dom.test.tsx` | every utility the lens uses EMITS into the built CSS |
| `test/shell-harness.test.ts` | the harness is absent from the shipped bundle |
| `test/interview-harness.test.ts` | same, for the interview harness |

All five are legitimate build-evidence bodies. The problem is what they
say when the evidence does not exist: every message is about the build
being **stale** ("the build is at least as new as the mount and the
lens", "the build is newer than the screen it is evidence about"), so a
session reads twelve failures about staleness on a tree where `app/dist`
was never created. Three of the twelve are not even about the bundle
(`the shipped sheet leaves the root font size alone`,
`minWidth is at or above the breakpoint the build emitted`) — they fail
downstream of the same missing directory.

**Nothing in the repository says the order is load-bearing.**
CONVENTIONS' fresh-clone ORDER bullet covers parser-before-app and stops;
the app bullet lists `npm run build` before `npm test` without saying the
second depends on the first. CI never meets it, because `ci.yml` orders
app build ahead of app suite. It is a HAND-RUN-ONLY failure, which is
exactly the population this project's lanes are drawn from — and the
brief T-089 was dispatched with named the fresh-clone order and omitted
this step, which is how it was found.

T-089 wrote the measurement into CONVENTIONS' lane bullet as a gotcha.
That is discipline. The fix is for the tree to say it:

1. **A shared precondition** in the five files — if `app/dist` is absent,
   fail once, with `run npm run build from app/ first`, rather than
   twelve times about staleness. One helper, five call sites; the bodies
   keep their real assertions for the case where the build EXISTS and is
   stale, which is the case they were written for.
2. Optionally, make `npm test` depend on the build in `package.json` —
   rejected here without measurement because it doubles the cost of every
   watch-mode run and this project has not asked for that; state which
   arm and why.

Whoever takes arm 1 should check the same shape in `tools/e2e`, which
reads `app/dist` too, and in nothing else — derive that list, do not
trust this sentence.
