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

**THE CARD'S REPAIR IS RIGHT, AND THE VALUES WERE JUDGED RATHER THAN
TYPED** — but my first account of WHY was measurably wrong, and the
correction is the more useful half.

**WHAT I FIRST WROTE, AND WHAT REFUTED IT.** I claimed
`truncated: false` was LOAD-BEARING and `notLanes: []` INERT, reasoning
from `selectDispositions` reading `truncated` as `scanIsFloor`
(`board-model.ts:1254`). The source reading is exact and the model
output genuinely differs — `floorCaveat` at 1471, `floorLine` at 1526 —
but **the contrast does not exist at any level a test can see.** Caught
at review, then reproduced here at forecast ref `18971ef` (this lane's
tip merged with `task/T-185-dispatch-reading-fields`), each mutation
one side only and restored sha256-identical (`75cbb00b…db587`):

| drill | mutation | build | test |
|---|---|---|---|
| D | `truncated: false` -> `true` | **0** | **0**, 50 files / 1113 passed |
| E | `notLanes: []` -> one populated `NotLaneHold` | **0** | **0**, 50 files / 1113 passed |
| F | `truncated` DROPPED | **2**, 2×TS2322 | **0**, 50 files / **1113 passed** |
| G | `notLanes` DROPPED | **2**, 2×TS2322 | **1**, `2 failed \| 1111 passed`, 1 failed file |

**D refutes the claim I made.** No body can tell `false` from `true`.
`false` is still the right value — it names the quiet state the
constant exists for — but on the fixture's own meaning, not on any
instrument.

**AND F/G INVERT THE ASYMMETRY I WROTE.** Dropping `notLanes` reds BOTH
gates; dropping `truncated` reds ONLY the type, because a missing
boolean is falsy and slides silently into the `false` branch while the
suite stays at 1113. **`truncated` is precisely the field that reads as
`false` and says nothing — the silent floor `T-185` exists to remove,
reproduced in miniature inside the fixture that card repairs.** The
docstring now says that instead, because the next person to widen the
type reads the fixture and not this card.

**AND THE PRINTED REPAIR RESTS ON A `readonly` NOBODY NAMED.** `as
const` types `notLanes` as `readonly []`, assignable only because
`board-model.ts:713` declares `readonly notLanes: readonly
NotLaneHold[]`. Confirmed with the project's own compiler on a two-line
control: the same literal against a mutable `NotLaneHold[]` fails
`TS2322` — *"the type `readonly []` is `readonly` and cannot be
assigned to the mutable type"* — while the readonly form passes. Had
the parent declared the mutable form, the card's printed line would
have red at the parent-landed tree. Now noted at the site.

`notLanes: []` stays, with the one honesty kept from the first draft: a
real repository always has at least its primary checkout as a non-lane
worktree, so `[]` is the literal reading of *"holding no lane"* rather
than a faithful census — and E shows no body can tell.

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
here forever at exit 0. Routed as **T-214**, not taken.

**AND MY REASON FOR NOT TAKING IT WAS OVER-NARROW, WHICH IS ITSELF
WORTH THE LINE.** I wrote that the repair *"cannot be made in a lane
required green before the parent"*. That is true of INLINING the
literal — it reds at any pre-parent tree — and false of the GOAL. A
runtime key-set assertion over `NO_LANES` is in-fence and green at both
trees, and would catch a stale key without waiting for anything. The
card now carries inlining as one option rather than the option; I did
not build either, because closing the residual is not this card's
acceptance criterion and the choice deserves its own judgement.

### The standing-gate ledger, derived at the tree this tip WILL have

The RANGE RULE's executor form —
`TREE=$(git merge-tree --write-tree main HEAD)` (exit 0, tree
`9af6395`) then `git diff --name-only main "$TREE"` — returns **3
paths** at `7ad7789`: the fixture and these two cards. **The path set
is INVARIANT under this commit**, which only re-edits a card already in
it, so no decision below moves when this lands.

| gate | trigger matched | verdict |
|---|---|---|
| GRAPH REGEN | `app/test/board-truth.test.tsx` | **FIRES.** `index --check` exit **1 STALE** at both `5f31611` and `7ad7789`, `~1` naming this file alone. graph.json is outside the fence and the regen is committed WITH THE CHECKPOINT — **the integrator's**. |
| BOOT GATE | 0 of 3 paths | **NOT OWED.** No `app/src/**`, no `app/src-tauri/**`, neither manifest. `app/test/**` is in none of them. |
| DOCS GATE | 2 of 3 paths | **FIRES**, exit **1**, naming three suites. All three run and GREEN at `7ad7789` — see below. |
| METHOD EVAL | 0 of 3 paths | **NOT OWED.** Nothing under `method/`. |

The three suites the DOCS GATE named, at `7ad7789`, each exit read
from `$?` unpiped:

- `npm test` from app/ — **0**, 50 files / **1105** passed
- `npx vitest run` from lib/parser/ — **0**, 16 files / **344** passed
- `npm test` from tools/e2e/ — **0**, **404** passed (5.2m), on
  `NPUTER_E2E_PORT=18552` derived from this card's id and `lsof`'d to
  zero rows immediately before binding, released after. The lane's
  seven control-byte writes restored themselves: `git status` empty.

Also at `7ad7789`, the CI steps that are not merge-diff gates:
`lint:tokens` **0** (clean, 166 TOKEN files / 1065 CONTROL files),
`capabilities:check` **0** (CURRENT, 33163 bytes), `lint:docs` **0** —
and that 0 is the census half saying *"I was not asked"*, never
*"nothing owed"*, which is why the spelling above was run separately.

**A FRESH LANE WORKTREE CANNOT RUN THE DOCS GATE, AND IT FAILS AT
EXIT 1.** First invocation here died with
`ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'` — tools/e2e has no
`node_modules` in a fresh worktree, and CONVENTIONS' fresh-worktree
ORDER names only lib/parser and app. The gate legends 3 for *"could not
run"*, but this lands at **1**, indistinguishable by code from *"the
gate HAS a verdict"*. That is the T-080-s4 hole — documented for a
parse error in the gate's own two files — reached instead by a missing
dependency, in the one place every executor is told to run it. Fixed
here by `npm ci` from tools/e2e/ (exit 0); the exit-code hole is not
this card's to close and is noted for whoever holds T-090's line.
