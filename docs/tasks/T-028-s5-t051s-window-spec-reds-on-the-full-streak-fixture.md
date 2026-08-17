---
title: T-051's window-contract spec reds on merge — its genesis() helper uses the full streak fixture
status: suggested
suggested_by: verifier claude-opus-5 @T-028
---

**Reproduced, not predicted.** T-051 merged into main first
(`bd88b87`), so T-028 is the branch merging second and this reconcile is
T-028's integrator's to own. T-051's own verifier filed the same fact as
**T-051-s6** while it was still a prediction; this file records the
measurement and the exact fix.

## What happens

`tools/e2e/tests/window-contract.spec.ts` (new on main, 395 lines) has a
`genesis()` helper at **:104** whose last act is **:112**:

    await applyDocs(page, streakFixture(11, GENESIS_DIR));

`streakFixture` is the FULL harvested streak tree — nine files, three of
them under `docs/tasks/`, all three parsing. Under T-028 three parsed
tasks means `showsBoard(docs)` is true, so `genesis-pane-slot` renders
`BoardCrescendo` and there is no `genesis-artifact` row anywhere on the
screen. Two assertion sites then fail:

- **:206**, in `the default window renders both halves of T-027's split`
- **:318**, in the parameterised `every screen is usable at …`, which
  instantiates twice (`the declared minimum (1024x700)` and
  `the declared default (1280x840)`)

**Measured by simulating the merge inside T-028's worktree** — T-028's
code, T-051's `tauri.conf.json` and T-051's spec, run on scratch port
14903:

    ✘ 1 window-contract.spec.ts:172 › the default window renders both halves of T-027's split
    ✓ 2 window-contract.spec.ts:211 › the declared minWidth sits at or above the lens's measured breakpoint
    ✓ 3 window-contract.spec.ts:249 › the declared minHeight sits above every fitting screen's natural content
    ✘ 4 window-contract.spec.ts:308 › every screen is usable at the declared minimum (1024x700)
    ✘ 5 window-contract.spec.ts:308 › every screen is usable at the declared default (1280x840)

    Expected: "40/40"
    Received: "absent"

Three of five. The other two — the breakpoint and the minHeight walk —
are unaffected, so the blast radius is exactly the `genesis-artifact`
reachability claim and nothing else.

## The reconcile, and it is one line

The same one T-028 already applied to `interview.spec.ts` and
`genesis-screen.spec.ts`: point the helper at the tree the LENS is
actually for. T-028 adds `streakMidInterview` to
`tools/e2e/fixtures/shell.ts` — the identical harvested tree minus
`docs/tasks/`, with a guard that throws if the fixture stops carrying
exactly three task files — so after the merge the fix is:

    -import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakFixture } from "../fixtures/shell";
    +import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakMidInterview } from "../fixtures/shell";
    …
    -  await applyDocs(page, streakFixture(11, GENESIS_DIR));
    +  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));

Nothing is loosened: the spec's subject is "the last artifact row is
reachable inside the lens's own scroll region", and `streakMidInterview`
is the state in which the lens renders. `reach()`'s `"40/40"` should be
re-derived rather than assumed — the mid-interview tree carries seven
artifact rows against the full tree's nine, and the row the assertion
reaches is the last one, so the expected string may change.

**The alternative — leaving `streakFixture` and retargeting the
assertion at `genesis-board` — is the wrong reconcile.** It would change
what the spec measures (the board's region, not the lens's) while
keeping the name of the old claim, and `crescendo.spec.ts:204` already
makes the board-half version of exactly that assertion.

Do NOT delete the assertion. It is T-051's criterion and it is the only
place the lens's reachability is checked against the SHIPPED manifest's
sizes.
