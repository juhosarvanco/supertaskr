---
id: T-152
title: The executor contract's row 11 — the ceremony tier, the status to stamp, whether to merge — lives in a file no reading list names, and the same dispatch error has now been made twice
feature: F-01
milestone: 4
priority: 2
size: S
status: parked
suggested_by: architect claude-opus-5
blocked_by: []
touches: [method/roles/]
---

Absorbs: T-138-s4 (Amnesty triage 2026-08-29 (triage seat)) — the same reading list from the other end, and @human has already ruled on its ask — keep the reading list the same for now — so what it contributes here is evidence rather than a request: executor.md step 1 is the ONLY reading list in any role file (the verifier, integrator and planner have no reading step at all), its three entries are byte-for-byte the shared list as it stood before 6a6bc87, and its omission of ROADMAP has no stated reason anywhere. That makes it the single place in the method where a second copy of the read-first set lives, which is a T-057 instance by construction — and this card is the one showing what the list's CONTENTS cost when they are wrong.

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

Amnesty triage 2026-08-29 (triage seat): PARKED — TAKE THIS FIRST AMONG T-159's RIDERS. It is the only parked method-text finding with a MEASURED, REPEATED cost: the same dispatch error twice, six hours apart, by different hands, each lane correctly stopping rather than guessing upward against an explicit restriction. The cause was reported BETWEEN the two and not acted on. T-148 worked for every contract row whose source the reading list names; row 11's source is method/tasks/TASK-FORMAT.md, which the root adapter's read-first set does not name — verified at this base, grep returns no hit in CLAUDE.md — so the executor cannot read its own ceremony tier and cannot tell a mistaken restriction from a deliberate one. RESURFACES: the next method/ dispatch — T-159. The absorbed T-138-s4 is the same reading list from the other end and carries @human's standing ruling on its contents.
