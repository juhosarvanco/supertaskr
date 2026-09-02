---
id: T-225-s18
title: Shrinking `--dispatch --full` past `--task <id> --preflight` REDS the margin guard's biggest-arm assertion, so one arm's fix is now fenced behind another arm's size
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s12
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**A GUARD THAT ANNOUNCES AN APPROACH HAS BECOME A FLOOR UNDER ONE ARM,
AND NOTHING SAYS SO.** `brief-flush.spec.ts`'s margin guard closes with

    expect(biggest.args.includes("--full")).toBe(true)

reasoning that *"`--full` only ever ADDS to an answer, so if every
announced view carried its `--full` twin the biggest arm measured would
carry `--full` by construction"*. That reasoning is sound and the
assertion is right. Its SIDE EFFECT is not announced anywhere: while
`--task T-133 --preflight` is announced and its `--full` twin is not, any
change that takes the biggest arm BELOW the preflight arm makes the
preflight arm the biggest and reds this body — by a message about a
missing twin, in a file the shrinking lane does not hold.

**MEASURED, BOTH SIDES, AT `cde65b5` WITH EIGHTEEN WORKTREES AND FIVE
LANES LIVE** (T-225-s12's lane, base and tip back to back, the guard's
own `readViaFile` figures):

    --dispatch --full          123,153 -> 99,943 bytes   (T-225-s12's fix)
    --task T-133 --preflight    74,443 -> 74,443         (unchanged; renders no dispatch report)
    --task T-133 --preflight --full  82,996 at the tip   (measured by hand; NOT announced)

So the triage view has 25,500 bytes of room and no more. **T-225-s12
stopped at 99,943 for this reason and said so** — the shape that takes it
under one pipe buffer would have taken it under 74,443 first.

**THE REMEDY IS ONE LINE OF THIS FILE AND IT IS ALREADY HALF-WRITTEN.**
`NOT_AN_ARM` excuses no `--preflight`, and the guard's own failure message
says *"Announce that twin"* — so announcing
`--task T-133 --preflight --full` in `LIVE_ARMS` removes the floor
outright, at the cost of one more measured arm per run. **This may be
absorbed by T-225-s13**, which already holds this file for the
neighbouring gap (a missing COMBINATION of flags each covered elsewhere);
the two are the same sentence read from opposite ends.

**AND THE FLOOR MOVES ON ITS OWN.** The preflight arm sweeps every
checkout on the machine, so its size is a function of the worktree count
rather than of the board: read twice minutes apart on this machine it
gave 74,443 and 76,377. A floor nobody can predict is a worse floor than
a high one.
