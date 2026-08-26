---
id: T-143
title: ONE mechanism corrupts the dispatch answer toward FREE and it lives in two implementations — the other two claims in this card did not survive being measured
feature: F-06
milestone: 4
priority: 3
size: M
status: suggested
suggested_by: architect claude-opus-5
blocked_by: []
touches: [lib-parser, tools/e2e]
---

**Found in one sitting, deriving one night's dispatch.** Three separate
mechanisms, three different files, one shared property:

> **Every one of them reports FREE when the fence is HELD. Not one can
> fail the other way.**

A check that can only err toward "go" is not a check.

## The three

**1. A lane whose card this checkout cannot resolve holds nothing.**
`lib/parser/src/lanes.ts:293` — `if (other === undefined) continue`. A
card compared only against such lanes is reported "disjoint from every
live lane" and called `startable`. Found by T-137's verifier, which
measured **15 of 20 startable answers false** with one lane up. The
module states the correct principle fifteen lines above, about an absent
registry — *"every slug token is unresolvable **rather than that every
fence is free**"* — applies it to tokens, and violates it for lanes.
`lanesWithNoCard` IS computed and reaches exactly one place: a field on
the returned summary. **Reported, never acted on.**

**2. REFUSED — see the correction below. Its dual — a card in
`building` with no worktree.** The fence
ledger is derived from lanes, and a lane is a worktree on a task branch.
`T-135` is `building`, declares `touches: [crate-index,
method/tasks/TASK-FORMAT.md]`, and has no worktree because its Half A
merged and the card was deliberately left open. `brief.mjs --state`
prints **`crate-index: FREE`**, and `method/tasks/TASK-FORMAT.md` does
not appear in the ledger at all.

**3. The `--state` LEDGER's FREE column is per-SLUG, and two slugs can
share a component.** `docs/architecture/components/C-11-*.md` declares
`touch_slugs: [app-shell, app-board]`. With `app-shell` held, the ledger
prints `app-board: FREE`. They intersect at C-11.

**MECHANISM 3 IS NARROWER THAN THE OTHER TWO AND THIS CARD ORIGINALLY
OVERSTATED IT — corrected here rather than quietly.** The `--task` half
of the same tool is CORRECT. Asked properly it answers:

    T-141 and T-112: OVERLAP — T-141 app-shell against T-112 app-board,
      both reserve app/src/assets/**
    T-141 and T-112: OVERLAP — ... both reserve app/src/styles/**

with the witness paths named. **So the dispatch VERDICT is sound; it is
the ledger DISPLAY that misleads**, and only a reader who takes a FREE
column for a verdict is misled. That is a real trap — the architect fell
into it on 2026-08-26 — but it is consumer confusion between two
questions, not a wrong answer. Mechanisms 1 and 2 corrupt the answer
itself; 3 does not.

## What this cost, tonight, live

Mechanism 3 nearly took a lane. `T-112` was the highest-priority card
that survived every other filter — `blocked_by: [T-111]` with T-111
`done`, and `touches: [app-dispatch, app-board]` reading FREE, FREE. It
overlaps the live `T-141`. It was the only candidate on the board.

**But the process would have caught it**, and the honest version of this
item is the interesting one: the documented step before dispatch is to
assemble the brief with `--task`, and that step reports the overlap
correctly. **The architect skipped it because the ledger had already
answered** — which is the actual lesson. A cheap display that
approximates an expensive verdict gets consulted INSTEAD of it.

Mechanism 2 was caught by hand seconds earlier: the three cards that
night's stamp freed — T-105, T-128, T-131 — all touch `method/`, which
**contains** `method/tasks/TASK-FORMAT.md` by containment.

**Containment-is-overlap has now been the proximate cause five separate
times in this project.** This is the first time all three mechanisms
were seen together.

## Why the direction matters more than the count

A fence is a WRITE partition and its whole job is to make concurrent
lanes safe. **A false HELD costs a delay. A false FREE costs a
collision, and the collision is silent** — two lanes write the same
region, both suites stay green, and the loss appears at a merge that
looks ordinary. That asymmetry is why three mechanisms all failing
toward "go" is one finding rather than three.

## The shape of a fix, not the fix

1. **State the property once and pin it**: a hold may not vanish because
   one side of a join is absent. Mechanisms 1 and 2 are the two sides of
   exactly that; 3 is the same shape with the join being slug→component.
2. **Make the ledger emit verdicts, not availability.** A FREE column
   keyed by slug cannot express "free as a name, held as a region". The
   consumer asks *may I dispatch this card* and should be answered in
   those terms, with the witness component named.
3. **Distinguish the two questions rather than merging them** — "what is
   physically being written now" (worktrees) and "what is claimed"
   (board status) are both legitimate and they are not the same answer.
   Mechanism 2 may be an *undisclosed split* rather than a bug, and that
   is a smaller, different fix. **Settle which before writing code.**

## One caution for whoever takes it

**Do not verify this with a census.** `T-142` is the card about queries
that answer a different question than the one asked, and every mechanism
here is one. Prove each fix with a POSITIVE CONTROL: construct the held
state, see the tool say HELD, then remove the hold and see it say FREE.
**A fix that only ever prints HELD passes every test written from this
card's text.**

---

# CORRECTION, 2026-08-26 — TWO OF THIS CARD'S THREE CLAIMS FAILED

**Written by the architect who filed it, after both were measured by
other hands. Recorded rather than quietly edited, because a card that
overstates and then tidies itself is worse than one that overstates.**

## Mechanism 2 is REFUSED

T-137's rework was asked to judge it and did, on four of this
repository's own sentences: criterion 2's "every live **lane**" read with
criterion 3's live stamp; `executor.md` row 5, whose two examples are
both the board **under**-reporting; `lane-protocol.md` rule 7 as this
repo applies it — T-111's branch was kept and that checkpoint still says
"there are zero lanes"; and `docs/STATE.md`'s own capitals, **"ONE CARD
IS `status: building` WITH NO LANE, AND THAT IS ALSO ON PURPOSE."**
`T-135-s4` already records that the stamp has no true value.

**The distinction that settles it: R1 drops a PROVED live writer. The
dual would INVENT one.** A hold conjured from a board stamp is not the
same object as a hold erased despite a worktree, and only the second is
a false green. **The board under-reports by construction and the lane
list is authoritative — that is the design, not a defect.**

One further correction to what this card originally implied:
`method/tasks/TASK-FORMAT.md` is absent from the ledger **because T-135
is not a lane**, not because the ledger cannot spell a path token. It
can.

## Mechanism 3 was already narrowed above

The `--task` verdict is sound; only the `--state` display misleads.

## What survives, and it is not small

**Mechanism 1 is real, was measured, and lives in TWO implementations.**
T-137's rework fixed `lanes.ts` and found the identical
`if (card === undefined) continue` in `dispatch-brief.mjs`'s
`fenceLedger`, filed as `T-137-s11` and deliberately left in place as
another card's ground. **One defect, two copies — which is the
`T-057` second-implementation shape, and it is a better finding than the
three-mechanism story this card was filed on.**

## The lesson this card is now also an instance of

Filed with three claims on one night's evidence; **one survived.** The
two that failed were the two the author reasoned to rather than
measured — and mechanism 2 was reasoned to *by the architect and then
handed to an executor as a suggestion*, which is how an unmeasured claim
acquires the authority of a dispatch. `T-142` is the general shape and
this is a second instance of it.
