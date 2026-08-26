---
id: T-137-s11
title: R1 IS ALIVE IN A SECOND IMPLEMENTATION — `fenceLedger` drops a lane whose card this checkout cannot read, so `--state` prints FREE for ground a live lane holds, four lines below its own "no live card" warning
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [tools/e2e]
---

**FOUND WHILE CHECKING SOMEBODY ELSE'S CLAIM, WHICH IS THE ONLY REASON IT
WAS FOUND.** The architect handed this lane a claimed defect about
`status: building` cards (refused, and filed as `T-137-s10`). Checking it
meant reading `--state`'s ledger, and the ledger carries **the rework's
own R1, verbatim, in a different file**.

## THE LINE

`tools/e2e/scripts/dispatch-brief.mjs`, `fenceLedger`:

    for (const lane of ctx.lanes) {
      const card = ctx.cards.get(lane.taskId);
      if (card === undefined) continue;          // <- R1's own shape
      for (const entry of fieldList(card.fields, "touches")) { ... }
    }

A lane whose card is not in this checkout contributes **no holder**, so
every slug it reserves reports `FREE`. `lanes.ts:293` said `if (other ===
undefined) continue` and was rejected at `62a4364` for exactly this; this
is the same sentence about the same join in the other consumer.

## MEASURED, AT `9d0700e`, `Mac.lan`, with `T-141` live and its card only on main

`node tools/e2e/scripts/brief.mjs --state`, exit 0:

    line  9   T-141 branch refs/heads/task/T-141-lane worktree …-T-141   <- read … live
    line 11   T-141 touches: no live card — board says unknown           <- @ 62a4361 ; no card
    line 16   # THE FENCE LEDGER — held or free, derived from the lanes above
    line 22   app-shell: FREE    <- read … ; …, joined to each lane's card
    line 23   crate-index: FREE  <- read … ; …, joined to each lane's card

**Supplying T-141's real card off `main` moves 15 cards from `startable`
to `fenced` through the same fence module**, so those FREE rows are about
ground a live lane demonstrably reserves.

## IT IS SMALLER THAN R1 WAS, AND THE REASON IS WORTH KEEPING

**The warning is already printed, four lines above the verdict.** `T-137`
itself narrowed that branch as `s9`, so `--state` does say *"no live card
— board says unknown"*. What it does not do is carry that qualifier into
the LEDGER's own word. So this is not a silent false green like R1; it is
**a verdict word that its own report already contradicts, further up the
page** — which is the failure `docs/CONVENTIONS.md`'s DOCS GATE bullet
calls *"three layers from its cause"*, at a distance of four lines.

`FREE` is the same class of word as `disjoint`: it is a claim about the
whole world, and it must not be reachable when part of the world could
not be read.

## THE REPAIR

Give `fenceLedger` a third value beside a holder list and `FREE`. The
rework's own vocabulary is already correct and already shipped in
`lib/parser/src/lanes.ts`: **`unusable` / "no overlap PROVED and none
ruled out"**. Concretely, when any lane's card is missing, every row that
is not explicitly held should read `UNKNOWN — <ids> hold fences this
checkout cannot read` rather than `FREE`. Do not fold it into `FREE` and
do not drop the row.

**A cheaper half, if the full repair is not wanted**: keep `FREE` and
append the qualifier to the SECTION note, so the reader meets it in the
same block rather than four lines up.

## WHY THIS WAS NOT TAKEN INSIDE T-137

`tools/e2e` is inside T-137's fence, so the fence is not the obstacle.
`fenceLedger` is **`T-133`'s arm and `T-133`'s pinned output**, and this
card's own notes record (item 7) that weakening another card's pin from
inside this lane, without that card's context, is not a repair an
executor makes — a rule this lane relaxed exactly once (`s9`) and only
after the dispatching role handed it the decision explicitly. **The
architect's hand-off named the `building`-card question, not this.** If
the dispatching role wants it taken, that is the precedent to invoke.

**AND ONE CORRECTION TO THE HAND-OFF WHILE HERE**: the claim that
`method/tasks/TASK-FORMAT.md` *"does not appear in the fence ledger at
all"* is true today for the LANE reason, not for a vocabulary one.
`fenceLedger` keys on `[...ctx.slugs.keys(), ...holders.keys()]` and
`holders` keys are raw `touches:` ENTRIES, so a PATH token does appear
the moment a LANE's card declares one. It is absent because T-135 is not
a lane, not because the ledger cannot spell it.
