---
id: T-225-s13
title: The arm list is now derived against the command's FLAGS and against the biggest arm's `--full` twin, and neither sees a missing combination of flags that are each covered elsewhere
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-225-s7 ASKED FOR A DERIVATION AND GOT TWO, AND THE RESIDUAL BETWEEN
THEM IS FILED HERE RATHER THAN LEFT TO BE DISCOVERED.** T-225-s2 built:

1. `THE ARM LIST IS COMPARED TO THE COMMAND'S OWN FLAGS` — reads
   `brief.mjs`'s frozen `FLAGS` literal and reds on a flag that no arm
   exercises and no `NOT_AN_ARM` entry argues away. Drilled: adding one
   flag to that literal reds that body and nothing else.
2. The margin guard's own closing assertion — it has every arm's
   measured size, so it requires the BIGGEST arm it measured to be a
   `--full` arm, since `--full` only ever adds. Drilled: removing
   `--dispatch --full` from `LIVE_ARMS` reds it by name, and the
   flag-coverage body above stays green.

**WHAT NEITHER SEES.** A missing combination of flags that are each
covered somewhere else and whose absence does not move the biggest arm.
`--card <id> --full`, `--state --full` and `--task <id> --preflight
--full` are all accepted invocations that nothing measures; dropping any
of them from the list leaves both derivations green, because `--card`,
`--state`, `--preflight`, `--task` and `--full` are each exercised by
some other arm and the biggest arm is still a `--full` one.

**A COMBINATORIAL SWEEP WAS REFUSED IN WRITING AND THE REFUSAL IS THE
QUESTION.** Eight read flags are 256 invocations of a command whose
slowest arm takes six seconds — `--task <id> --preflight` sweeps every
checkout on the machine — so the sweep is minutes of a suite whose
seconds band is already breached (`docs/STATE.md`, and T-120-s2).

**WHAT A FIX WOULD DECIDE.** Whether the announced set is the CROSS
PRODUCT of the view flags with the modifier flags, measured once per
run; whether the sizes are cached per tree so a quiet board costs
nothing; or whether the honest answer is that the guard's subject is
what this repository READS and the missing combinations should be
argued into `NOT_AN_ARM` one by one, with a reason each, the way the
writers already are.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-202-s1 merge (0856ed7)

The architect seat. brief-flush.spec.ts carries three residues now: the combination coverage this card names, the margin guard's machine-global inheritance (T-202-s2, absorbed here), and the ranking floor T-225-s12's lane will route. One lane.

## Absorbs: T-202-s2 (2026-09-02, at the T-202-s1 merge (0856ed7))

THE MARGIN GUARD compares two separate invocations of one arm, so a worktree added or removed between them reds it — a THIRD body inheriting machine-global state, and T-205-s8 names only the other two

## The finding, measured

`tools/e2e/tests/brief-flush.spec.ts:631` — *"THE MARGIN GUARD: every
live arm against a loss point DERIVED in this run, for a NAMED reader"*
— asserts, for every arm, that what `spawnSync` receives equals what the
file destination received. It gets those two figures from **two separate
invocations of the assembler**, so anything that moves between them
moves the assertion.

Measured in this lane's `gate-run e2e` leg at `2ed2861`:

    Error: --task T-133 --state --full: spawnSync received 84026 bytes
           where the file destination received 83532
    Expected: 83532
    Received: 84026

A 494-byte delta between two reads of one command. The arm's own size
was **83532 bytes in that run and in three consecutive re-runs of the
body alone, all three GREEN** — so the size did not move and the body is
not measuring a size regression. What moved was the machine: five lanes
are live on this host and their worktrees are added and removed by peer
seats mid-body, and `--state --full` renders the board.

**The body already knows.** Its own comment says: *"If this fails with a
small delta and no `process.exit` in `brief.mjs`, suspect the board
moving between the two runs (a worktree added or removed) before
suspecting the flush."* The hazard is documented and unguarded — the
comment tells the reader how to attribute the red after it has already
cost them the

## Absorbs: T-225-s18 (2026-09-02, at the T-225-s12 merge)

Shrinking `--dispatch --full` past `--task <id> --preflight` REDS the margin guard's biggest-arm assertion, so one arm's fix is now fenced behind another arm's size

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

**THE REMEDY IS O
