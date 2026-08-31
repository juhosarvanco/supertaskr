---
id: T-185-s2
title: A `DispatchReading` shape change owes a C-05 fixture no `app-board` fence reaches — measured on T-185, two tsc errors and two red bodies from ONE constant
feature: F-04
milestone: 4
priority: 2
size: S
status: verifying
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

## Implementation notes (executor, 2026-08-31)

Lane `task/T-185-s2-c05-fixture`, base `70d09ad`, tip `5f31611` before
this commit. ONE file changed: `app/test/board-truth.test.tsx`,
+17/-2 — inside the 44-path manifest and inside nothing else's.

**THE CARD'S REPAIR IS RIGHT, AND ONLY HALF OF IT IS A TYPE FIX.** I
judged the two values before typing them, which is what the diff is for:

- `truncated: false` IS LOAD-BEARING. `selectDispositions` reads it as
  `scanIsFloor` (`board-model.ts:1254` at T-185's tip); under `true`
  every claim it makes about there being ROOM goes unsound and T-400's
  disposition can move, so the constant would stop naming the quiet
  state its own docstring names. `false` is required, not chosen.
- `notLanes: []` IS INERT, by the frontier's own sentence at
  `board-model.ts:1250` — *"a worktree that is not a lane reserves
  nothing"*. No body here can tell `[]` from a populated list. Noted
  honestly at the site: a real repository always has at least its
  primary checkout as a non-lane worktree, so `[]` is the literal
  reading of *"holding no lane"* rather than a faithful census — and
  choosing a populated list would add a claim these three bodies do
  not make.

Both reasons are written INTO the constant's docstring rather than
here, because the next person to widen the type reads the fixture and
not this card.

### The gates, and the one that fired

Every exit read from `$?` unpiped, in a guarded script, never chained
after a commit.

| where | command | exit | count |
|---|---|---|---|
| `70d09ad`, unmodified | `npm run build` / `npm test` from app/ | 0 / 0 | 50 files, 1105 passed |
| `70d09ad` + repair (`5f31611`) | `npm run build` / `npm test` | 0 / 0 | 50 files, 1105 passed |
| forecast `66ef51c` (repair + T-185) | `npm run build` / `npm test` | 0 / 0 | 50 files, 1113 passed |

**GREEN BOTH WAYS, WHICH WAS THE POINT** — the repair does not depend
on the parent merging first, and it does not red once the parent does.

**GRAPH REGEN FIRED AND IS OWED AT THE CHECKPOINT, NOT HERE.**
`cargo run -p nputer-index -- index --check --root ../..` from
app/src-tauri/ exits **1 STALE** at `5f31611`, and the second line
attributes it with no room for argument: `files +0 -0 ~1`,
`~ app/test/board-truth.test.tsx (content, loc 950 -> 965)`. That is
exactly this diff — 950 + 15 net lines = 965 — and nothing else moved:
committed and fresh agree at 1152374 bytes · 200 files · 2453 symbols ·
2375 edges. `docs/architecture/graph.json` is OUTSIDE the 44 paths, and
the bullet commits the regen WITH THE CHECKPOINT anyway, so it is the
integrator's. **NOT RUN HERE, deliberately** — running
`NPUTER_UPDATE_GOLDEN=1 …` would have written outside the fence.

### For the verifier: what I could not close, and measured rather than assumed

**THE FIXTURE'S GUARANTEE IS ONE-DIRECTIONAL, AND THIS FILE'S HEADER
CLAIMS IT IS NOT.** The header says contextual checking is *"the same
guarantee without the edge"*. It is not the same guarantee. Because the
literal is bound to a `const` before it is passed, it is not FRESH at
the assignment, so excess-property checking never runs on it. Drilled,
one side only:

- **Drill A**, pre-parent tree, `notLanes:` -> `notLane:`:
  `npm run build` **exit 0**. Nothing in the program constrains those
  two keys until the parent lands. Restored, sha256
  `75cbb00b…db587` before and after.
- **Drill C**, forecast tree, same typo: `npm run build` **exit 2**,
  two `TS2322`s. So the parent's own type IS the instrument — but it
  catches a MISSING required field, never a stale or misspelled extra
  one. Restored, same sha256, empty per-path diff.
- **Drill B**, forecast tree, the pre-repair literal put back: build
  **exit 2**, exactly two `TS2322`s at 916 and 952; `npm test` **exit
  1**, `2 failed | 1111 passed (1113)`, `1 failed | 49 passed` files,
  `TypeError: Cannot read properties of undefined (reading 'length')`
  at `selectDispositions src/lib/board-model.ts:1486`. **This
  independently reproduces the card's own measurement**, taken at
  `e18f3eb` inside T-185's lane, at my ref instead.

So the answer to *"what body would catch it if a future change made
`NO_LANES` wrong again"* is: `npm run build`, and only against a
WIDENING. A field REMOVED from `DispatchReading` leaves a stale key
here forever at exit 0. Routed as **T-214**, not taken — the repair
(inline the literal at both use sites to restore freshness) reds at any
tree without the parent, so it cannot be made in a lane required to be
green before the parent lands.
