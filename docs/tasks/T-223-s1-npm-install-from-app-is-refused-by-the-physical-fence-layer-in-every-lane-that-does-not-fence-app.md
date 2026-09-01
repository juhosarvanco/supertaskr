---
id: T-223-s1
title: "`npm install` from app/ — the setup step CONVENTIONS publishes — is refused EACCES by the physical fence layer in every lane whose fence does not reach app/, because it writes app/package-lock.json"
status: suggested
suggested_by: executor claude-opus-5@subagent @T-223
---

**CLASS PARENT: `T-216-s4`** — *the physical fence layer reds three of
the four suites inside every lane; four bodies write tracked files
outside the fence.* This is the same layer and the same mechanism, ONE
STEP EARLIER: not a test body writing out of fence, but the SETUP a
fresh worktree cannot skip. Filed as a sibling rather than a
corroboration because that card's `touches:` names four test files and
this needs neither of them — the fix is in the lock plan or in
CONVENTIONS' own lane bullet.

## Measured, in T-223's lane at base `28924c7`, 2026-09-01 on Mac.lan

`docs/CONVENTIONS.md` publishes the fresh-worktree order and spells the
app's setup step `npm install` (the "Build & test" app bullet, and CI's
`npm ci` is listed as one of the TWO deliberate divergences). Run in a
freshly armed lane:

    cd <lane>/app && npm install
    -> npm error code EACCES
       npm error syscall open
       npm error path <lane>/app/package-lock.json
       exit 1

`app/package-lock.json` is a TRACKED file outside this lane's fence, so
the layer left it `0444`, and `npm install` opens the lockfile for
writing on every run — even when it changes nothing. The lane is
stopped at its first setup command, before any suite exists to be
measured.

**THE WORKAROUND IS `npm ci`, AND IT WORKED FIRST TRY** — exit 0, and it
is the spelling CI already uses for this exact package. That is the
whole of the practical damage today; what makes it worth a card is that
nothing publishes it, so every lane meets the refusal cold and has to
decide for itself whether the layer is broken, the tree is broken, or
its own setup was wrong.

## Why this is not `T-216-s4` under another name

`T-216-s4` is about SUITES: bodies that plant into tracked files and can
be rewritten to plant somewhere else. This is about a step no lane can
rewrite, and its remedies are different in kind:

1. **Leave lockfiles writable in the lock plan** — narrow, and it
   weakens the layer on exactly the files a lane has no business
   changing, which is the wrong direction.
2. **Publish `npm ci` as the LANE's spelling** in CONVENTIONS' lane
   sub-bullet, beside "A FRESH WORKTREE HAS NOTHING INSTALLED", leaving
   `npm install` as the integration checkout's. Cheapest, and it makes
   the divergence CI already runs into the documented one.
3. **Have the lock plan's own arming print the consequence** — the
   layer knows which paths it locked; naming `app/package-lock.json` as
   "installs in app/ must use `npm ci`" at arm time reaches the seat
   that will meet it.

DISPOSITION HINT, the filer's and advisory: **promote, and take arm 2 as
the floor** — it is a documentation edit that costs a sentence and
removes a cold refusal from every future lane, and it does not preclude
arm 3. Arm 1 should be refused in writing rather than left open. Note
that arm 2's fence has to carry `docs/CONVENTIONS.md` AND
`tools/e2e/tests/workflow-parity.spec.ts`, because that spec derives
CI parity from the command bullets and a new command in that section
reds it by name.

## Verification, when it is taken

Headless. Arm a scratch lane whose fence excludes `app/`, run the
published setup step, and require it to complete — with the positive
control that the same step in an UNARMED detached worktree already
completes, so the refusal is the layer's and not the tree's.
