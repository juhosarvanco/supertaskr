---
id: T-185-s2
title: A `DispatchReading` shape change owes a C-05 fixture no `app-board` fence reaches — measured on T-185, two tsc errors and two red bodies from ONE constant
feature: F-04
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
suggested_by: executor claude-opus-5@subagent @T-185 (2026-08-31) — a DISPATCH ERROR found from inside the lane and routed, never repaired there
touches: [app-shell]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: none found.** `command grep -rln "board-truth" docs/tasks/`
returns eleven cards, all of them about what that file ASSERTS; none owns
the class *"a change to a board type owes a fixture in a component the
board's own fence cannot reach"*. `T-112-s4` is the nearest neighbour and
is about C-18 declaring a test path, which is a different wall.

**DISPOSITION HINT:** absorb into whichever card next changes a
`board-model.ts` exported type, by adding `app-shell` to its `touches:`
before dispatch — or apply the two-token repair below at an integration.
It is not worth a lane of its own; it is worth being KNOWN before the
next such card is fenced.

## The measurement

`T-185` grew `DispatchReading`'s `joined` arm two REQUIRED fields. Its
fence was `touches: [app-board, app-dispatch]`, twenty expanded paths.
Every file that needed to move was inside it **except one**, and the
lane left that one untouched:

    app/test/board-truth.test.tsx:873
      const NO_LANES = { kind: "joined", rows: new Map() } as const;

That constant is passed to `<Board dispatch={NO_LANES} …>` at lines 906
and 942. Measured at `e18f3eb`, in the lane, with every in-fence file
already repaired:

- `npx tsc -p tsconfig.test.json --noEmit` from `app/` — **exit 2**, two
  `TS2322`s, both at `test/board-truth.test.tsx`, both
  *"missing the following properties … notLanes, truncated"*, and
  **nothing else in the program**.
- `npm test` from `app/` — **exit 1**, `2 failed | 1111 passed (1113)`,
  `1 failed | 49 passed` files. Both failures are in that same file's
  `T-112-s1` describe, and both are a `TypeError` reading `.length` of
  `undefined` inside `selectDispositions`.

**ONE constant, two gates, four symptoms.** The repair is two tokens:

    const NO_LANES = { kind: "joined", rows: new Map(), notLanes: [], truncated: false } as const;

## Why the file is out of reach, and why that is structural

`app/test/board-truth.test.tsx` is **C-05's** — derive it:

    command grep -n 'board-truth' docs/architecture/components/*.md

so it expands from `app-shell` and from no other slug. `app-board`
expands to C-08, C-09, C-17 and C-18; `app-dispatch` to C-15. The board's
own model type therefore has a pinned consumer in a component the board's
own fence word cannot name.

**AND THE COUPLING IS DELIBERATE, WHICH IS WHAT MAKES THIS A STANDING
FACT RATHER THAN ONE FIXTURE'S ACCIDENT.** That file's own header says
so:

> **THE PROPS ARE WRITTEN AS STRUCTURAL LITERALS, NEVER IMPORTED.**
> `DispatchReading` lives in `board-model.ts` … importing either for a
> type would buy exactly the undeclared edge this section exists to
> avoid. TypeScript checks them against `Board`'s own prop types
> contextually, which is the same guarantee without the edge.

The trade is sound and should not be reversed — importing the type would
buy a C-05 -> C-17 edge for a fixture. The consequence is simply
unwritten anywhere a dispatcher reads: **a structural literal is checked
against the type, so ADDING A REQUIRED FIELD to any `Board` prop type
reds `app-shell` from an `app-board` lane, silently, at fence-expansion
time.**

## What was considered and refused inside the lane

Making the two fields OPTIONAL keeps that fixture compiling and passing
untouched. It was refused, and the reason is the parent card's own
subject: an optional `truncated` reads as `false` at every site that
omits it, which is the silent floor `T-185` exists to remove, wearing a
type annotation. The lane took the honest type and routed the fence.

## Read beside

`T-185` (the parent, whose notes carry both gate readings at
`e18f3eb`), `T-199` (the fence is not mechanically enforced, so nothing
would have caught this at the write), and `T-209` (nothing computes
expanded-path disjointness — the same expansion that would have to be
asked "who else is checked against this type").
