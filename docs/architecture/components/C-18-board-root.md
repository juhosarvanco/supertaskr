---
id: C-18
name: Board root
layer: app
paths:
  - app/src/components/board/Board.tsx
depends_on: [C-06, C-08, C-09, C-17]
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-board]
---
The board's composition root: the one file that mounts the columns and
opens a card into the detail drawer. It is the ONLY file on the board
side that reaches both the card faces (C-08) and the drawer (C-09), which
is precisely why it is its own node.

**WHY A NODE OF ITS OWN, AND WHY FOLDING IT INTO C-05 IS REFUSED —
MEASURED RATHER THAN PREDICTED (T-127-s1, at `95cf2d0`).** `Board.tsx`
was C-08's — one of five files behind `C-08 -> C-09`, and once the model
leaves for C-17 it is the single remaining file that makes it true; the
return hop is the drawer reading the card faces and the board model.
Splitting the model out (C-17) is not enough on its own, because the
composition root still points down at both halves. The obvious economy is
to fold it into the shell instead of declaring a fifteenth component —
and that trades one cycle for another: `BoardCrescendo.tsx` (C-13) imports
`Board`, so C-05 would gain `C-13 -> C-05` beside the declared
`C-05 -> C-13`. Run, not forecast:

    cycle    C-05 -> C-13 -> C-05
    verdict  DECLARED CYCLE  1 cycle(s) among 14 components
    exit 1

**NO IMPORT WAS SEVERED AND NO FILE MOVED ON DISK** (T-127's own
constraint, carried through T-127-s1 to T-127-s6). `Board.tsx` still
imports what it always imported; only its owner changed. Its four
declared dependencies are all observed — the seam is drawn where the code
already was.

**THE SLUG IS `app-board`** for C-16's reason, stated in full in
`C-17-board-model.md`: this file is C-08's today, so `app-board` is
exactly who may edit it, and a new word would silently narrow every live
card that already reads `[app-board]`.

**WHY THIS COMPONENT DECLARES NO `app/test/**` PATH (T-112-s4).**

**THE COMPOSITION ROOT IS PINNED, AND NOT FROM HERE.** `Board.tsx`'s prop
threading is covered by `app/test/board-truth.test.tsx`, which is
**C-05's** — `command grep -n 'board-truth' docs/architecture/components/*.md`
answers `C-05-app.md`, and that is the derivation rather than a memory.
The pin landed at `T-112-s1`; before it, deleting the two lines that
thread `dispatch` and `brief` into the drawer left the whole app suite
green, which is the measurement `T-112-s4` was filed on. Re-run at that
card's own base, each threading line deleted one side only and restored
by sha256, **every such mutant now dies.** What this file records is
therefore about WHO MAY WRITE THE PIN, never about whether one exists.

**THE PIN CANNOT BE RE-HOMED TO C-18, AND THE REASON IS THE ONE THIS
COMPONENT WAS SPLIT OUT TO FIX.** `board-truth.test.tsx` imports `App`
beside `Board`. `C-05-app.md` already declares `C-05 -> C-18`, so C-18
owning that file buys `C-18 -> C-05` and the pair is a declared cycle —
the same shape `C-08 -> C-09 -> C-08` was, refused by @human's no-cycles
ruling of 2026-08-25. The verdict a re-route would spend, run rather than
forecast at `T-112-s4`'s base:

    cargo run -p nputer-index -- arch cycles --root ../..
    verdict  ACYCLIC   exit 0

**A one-file move is not available here.** `T-169-s1` reached this same
wall from the other side and parked on it, naming the condition for
deciding it: *the next `app-board` card that needs to pin something in
the board's general DOM file.* This is that customer, and this section is
the decision.

**WHAT A TEST PATH OF ITS OWN ACTUALLY COSTS, SO THE NEXT LANE DOES NOT
RE-DERIVE IT.** It is a NEW file under `app/test/`, importing `Board` and
nothing of C-05's; every edge such a file needs is already declared,
because this component sits above the whole board side. **The obstacle is
not architectural — it is the ORDER.** A `[app-board]` fence expands to
this component's `paths:` **as they stand at dispatch**, so the registry
line and the file it names cannot land in one lane: the lane that adds
the line still may not write the file. `C-05-app.md`'s own T-149 note
prescribes most of the remedy — *"the card adding a test now fences its
own component's slug plus that component's own registry FILE"* — and it
needs one word more, which `T-112-s4` paid to learn: **the card must also
name the TEST FILE ITSELF in `touches:`.** Routed as `T-112-s6`, with
that line spelled out there.

**AND THE SEAM'S REAL TEST-REACHABILITY BLOCKER IS C-15, NOT THIS
COMPONENT.** `T-126-s2`'s ruling names C-18 as what stands between the
dispatch join and TypeScript. At `T-112-s4`'s base the dispatch VIEW
MODEL is already reachable from inside `[app-board]`: `selectDispositions`
is driven from `select-board.test.ts` (C-08's), `selectBriefPanel` from
`select-task-detail.test.ts` (C-09's), and the drawer's own dispatch
block from `detail-assignment.test.tsx` (C-09's). What no component's
test file may reach is `app/src/lib/dispatch-store.ts` — **C-15 declares
no `app/test/**` path at all**, and nothing under `app/src` or `app/test`
imports that module by `import`, `require` or `import()`. Routed as
`T-190`, and **accepted by the architect seat on 2026-08-31**: the
ruling's DIRECTION stands — the join goes to TypeScript behind a test
path — and its BLOCKER moves from C-18 to C-15.
