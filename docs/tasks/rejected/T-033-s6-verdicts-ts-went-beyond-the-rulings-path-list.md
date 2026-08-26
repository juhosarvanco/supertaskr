---
id: T-033-s6
title: C-16 claims verdicts.ts, which the umbrella ruling's path list did not name — disclosed, with the measurement that forced it
status: rejected
suggested_by: executor claude-opus-5 @T-033
---

T-033's decision (1) says *"AUTHOR THE SHARED-UI COMPONENT (arm (a))
claiming `app/src/components/ui/**` and `app/src/lib/utils.ts`"*. C-16 as
built claims a third path, **`app/src/lib/verdicts.ts`**. This file is the
disclosure, and it carries the one-line reversal.

## WHY, MEASURED AT `ad5a0df`

The ruling states its expected END STATE as well as its path list: *"After
the extraction the remaining undeclared rows are the shell genuinely
depending on its children — `C-05 -> C-13` and `C-05 -> C-14`."* Those two
lists contradict each other on this tree.

    D1:C-08->C-05   4 file edges   3x -> lib/utils.ts     1x board-model.ts -> lib/verdicts.ts
    D1:C-09->C-05   2 file edges   1x -> lib/utils.ts     1x TaskDetailPanel.tsx -> lib/verdicts.ts
    D1:C-13->C-05   3 file edges   3x -> components/ui/button.tsx

Extract only the two named paths and `C-13 -> C-05` drains, but
`C-08 -> C-05` and `C-09 -> C-05` **survive on `verdicts.ts` alone** —
rows the ruling does not expect. Every disposition then open to the card
is forbidden by something:

- **Declare them** — `C-05 -> C-08` is declared and confirmed (4 edges),
  so `C-08 -> C-05` closes a cycle. @human's ruling of 2026-08-25 is that
  the registry holds no cycles. Same for C-09 through C-08.
- **Leave them undeclared** — misses the zero-drift criterion, and leaves
  two rows with no owning card, which is the one completion condition the
  card names.
- **Extract `verdicts.ts` too** — what was built.

## WHY IT IS THE SAME KIND OF THING, RATHER THAN A CONVENIENCE

`verdicts.ts` passes every test `utils.ts` passes. Three consumers
across three components (C-08 `board-model.ts`, C-09 `TaskDetailPanel
.tsx`, C-12 `task-waves.ts`), and **zero imports of its own** — it is one
of two files in `app/src` that import nothing at all. Its own header says
it was split out of `board-model.ts` at T-017 *"to keep the dependency
graph acyclic"*, which is C-16's whole thesis stated one file early by
somebody who had not yet been given a component to put it in.

## THE REVERSAL, IF THE ARCHITECT DISAGREES

One line: delete `  - app/src/lib/verdicts.ts` from C-16's `paths:` and
restore it to C-05's. **Measured cost, from the lane's own drill (M5,
one-sided, at `1baed94`):** four dogfood bodies and two map-dogfood bodies
red, `C-08 -> C-05` and `C-09 -> C-05` return as undeclared rows, and the
relation tally goes 26/1/9 back to 26/3/9. Whoever reverses it must then
choose one of the two forbidden dispositions above, or extract the file
somewhere else — so the reversal is not free, and that is the argument
for looking at it now rather than later.

## RATIFIED BY @HUMAN — 2026-08-26, and the reject IS the ruling

**@human ratified the extraction.** C-16 keeps `lib/utils.ts`,
`lib/verdicts.ts` and `components/ui/**`; the placement stands permanently.

**@human's question is the reason this took one line rather than a
review**: *"But isn't the new arrangement true?"* It is. The lane was not
asking whether the boundary was correct — it was disclosing that it had
moved one **mid-flight, without an architect signing off**, and asking for
that to be said out loud rather than inherited silently.

**So the ratification is procedural, not substantive**, and the evidence
had already accumulated: T-127's cycle census and the drift-to-zero pass
were both derived on top of this placement at `afe23c1` and reversed
nothing. The architect offered to rule it alone; @human ruled it.
