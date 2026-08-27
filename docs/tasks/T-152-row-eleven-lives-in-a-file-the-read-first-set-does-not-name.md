---
id: T-152
title: The executor contract's row 11 — the ceremony tier, the status to stamp, whether to merge — lives in a file no reading list names, and the same dispatch error has now been made twice
feature: F-01
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: architect claude-opus-5
blocked_by: []
touches: [method/roles/]
---

## The error, twice, identically

`T-145` and `T-093` are both **S cards outside shipped code**, whose
ceremony row makes the executor its own integrator. Both dispatches
carried the architect's standing line *"Do NOT work on main"* and no
merge instruction. Both lanes built, stamped, and **correctly stopped**
rather than guessing upward against an explicit restriction — six hours
apart, by different hands, reporting the same thing.

## The cause was reported between the two, and not acted on

`T-150`'s executor named it precisely:

> The brief omits contract rows 6, 7, 8, 9 and 11. Rows 6–9 are
> recoverable from CONVENTIONS, which is the T-148 design working.
> **Row 11 is not**: the ceremony row, the status to stamp and whether
> to merge live in `method/tasks/TASK-FORMAT.md`, which the root
> adapter's read-first set does *not* name.

So `T-148` worked — the standing half now reaches the executor through
CONVENTIONS — **for every row whose source the reading list names.**
Row 11's source is the one it doesn't.

## Why the dispatcher keeps filling the gap wrongly

The architect's blanket "never touch main" is a good lane-safety default
and a wrong instruction for exactly one tier. Because the executor
cannot read the tier from its own reading list, **it cannot tell a
mistaken restriction from a deliberate one** — and correctly treats an
explicit instruction as binding. The failure is therefore not the
executor's and cannot be fixed at the executor's seat.

## The shape of a fix, not the fix

1. **`executor.md` step 1 gains `method/tasks/TASK-FORMAT.md`'s ceremony
   table** as its one addition, with the reason: *you must know whether
   you are your own integrator before you finish.* Cheapest, and it is
   the same difference-with-a-reason shape T-148 established.
2. **The dispatching seat states the tier in every brief**, derived not
   recalled — `brief.mjs` already assembles from `executor.md`'s own
   table and could emit the row. Stronger, because it puts the answer in
   the brief the executor is already reading.
3. **Make the blanket instruction tier-aware** in the architect's own
   practice. Weakest: it is a habit, and habits are what failed twice.

**Arm 2 has the machinery** — `dispatch-brief.mjs` already derives the
contract rows and would report a missing row as NOT DERIVED, which is
how this gap would have announced itself the first time.

## One caution for whoever takes it

**Do not solve it by deleting the safety line.** "Never work on main" is
right for every tier but one, and a lane that merges when it should not
is worse than a lane that stops when it could have merged. The fix is to
make the exception *derivable*, not to remove the rule.
