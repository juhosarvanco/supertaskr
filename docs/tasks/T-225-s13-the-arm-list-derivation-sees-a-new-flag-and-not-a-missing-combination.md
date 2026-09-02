---
id: T-225-s13
title: The arm list is now derived against the command's FLAGS and against the biggest arm's `--full` twin, and neither sees a missing combination of flags that are each covered elsewhere
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
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
