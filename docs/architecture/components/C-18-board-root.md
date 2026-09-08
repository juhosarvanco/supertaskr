---
id: C-18
name: Board root
layer: app
paths:
  - app/src/components/board/Board.tsx
  - app/test/board-root.test.tsx
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

**WHY THIS COMPONENT'S OWN `app/test/**` PATH TOOK TWO CARDS —
`T-112-s4` FILED IT, `T-112-s6` LANDED IT.** The path is
`app/test/board-root.test.tsx`, above. Everything below is the derivation
that produced it, kept because the WALLS are still live for the next
component that finds itself in this position — not because the gap is.

**THE COMPOSITION ROOT IS NOW PINNED TWICE, AND THAT IS THE POINT.**
`Board.tsx`'s prop threading is ALSO covered by
`app/test/board-truth.test.tsx`, which is **C-05's** — derived rather
than remembered, by

    command grep -n '^  - app/test/board-truth' docs/architecture/components/*.md

which answers the single `paths:` line in `C-05-app.md`. **The obvious
spelling of that check does not survive being written down**: a bare
`grep -n 'board-truth' docs/architecture/components/*.md` matched ONE
line the day this section was drafted, and has climbed with every
sentence written about the file since — four across two files when that
was first noticed, ten by the time `T-112-s6` landed, and this paragraph
moved it again. **A count that its own prose feeds cannot be stated in
the present tense**, so each figure here is bound to the occasion that
read it. The anchored form above matches a `paths:` entry and nothing
prose can imitate, so it answers ONE whatever the prose does.
The pin landed at `T-112-s1`; before it, deleting the two lines that
thread `dispatch` and `brief` into the drawer left the whole app suite
green, which is the measurement `T-112-s4` was filed on. Re-run at that
card's own base, each threading line deleted one side only and restored
by sha256, **every such mutant now dies.** What this file records is
therefore about WHO MAY WRITE THE PIN, never about whether one exists.

**`T-112-s6` ANSWERED THAT QUESTION WITHOUT DELETING ANYTHING.**
`board-truth.test.tsx`'s bodies stay C-05's and were not touched — the
criterion forbade deleting them from outside `[app-shell]`, and this
component has no standing there. The new file is the copy an
`[app-board]` card may itself edit on the day it changes the threading,
which is the whole of the debt being paid here. **It is not a duplicate
at the PROPERTY level either**, measured rather than asserted: a root
that threads both props while quietly normalising a field inside them —
`{ ...dispatch, truncated: false }` — leaves `board-truth.test.tsx` and
`detail-assignment.test.tsx` GREEN at 38 passed, and dies only in the new
file, which is the verbatim claim `Board.tsx`'s own header makes and
nothing could check before.

**THE PIN CANNOT BE RE-HOMED TO C-18, AND THE FIRST WALL IS NOT THE ONE
THIS SECTION ORIGINALLY PRINTED.** `board-truth.test.tsx` imports `App`
beside `Board`, so honouring that import from C-18 eventually reaches the
cycle this component was split out of C-08 to remove. But the re-route
takes **two steps, and only the second one cycles** — performed rather
than forecast, one side only and sha256-restored:

**Step 1, the path move alone** — add `app/test/board-truth.test.tsx` to
this component's `paths:`. `arch cycles` is **unchanged**, because it
reads DECLARED `depends_on` and a path move declares no edge:

    cargo run -p supertaskr-index -- arch cycles --root ../..
    verdict  ACYCLIC   exit 0          <- the BASELINE, not a finding

What the path move actually buys is an `arch drift` **D4**:

    finding  D4  app/test/board-truth.test.tsx  claimed_by=C-05,C-18  winner=C-05
    summary  findings=5  ambiguous=1            <- 4 and 0 at base

**Step 2, declaring the edge the import requires** — `C-05` into this
component's `depends_on`. Only now does it cycle, and emphatically:

    cycle    C-05 -> C-18 -> C-05
    cycle    C-05 -> C-13 -> C-18 -> C-05
    verdict  DECLARED CYCLE  2 cycle(s) among 15 components
    exit 1

**THE D4 IS THE WALL THAT ACTUALLY STOPS A LANE, AND IT IS A SHARPER
REFUSAL THAN THE CYCLE.** Clearing a double-claim means removing the line
from `C-05-app.md` — and **no component declares its own registry file in
`paths:`**, so a fence expanding from `[app-board]` reaches no registry
file at all. `T-112-s4` could edit this file only because its `touches:`
additionally carried the registry directory; a card holding the slug
alone, or T-149's narrower `…/C-18-board-root.md` spelling, could not
clear the D4 it would itself create.

**A one-file move is not available here — and note WHICH move.**
`T-169-s1` parked two questions. Its "one-file move" is moving the
*review-badge bodies into* `board-truth.test.tsx`; its general question
asks whether that file should be re-routed **to C-08's or C-09's**
`paths:`. What is refused above is a third branch it did not name —
re-homing the file to **C-18** — so this section answers the branch this
component is the customer for and leaves `T-169-s1`'s own two open. Its
RESURFACES clause reads in full: *"the next `app-board` card that needs
to pin something in the board's general DOM file meets this wall and
decides it WITH a customer — that seat re-derives the ownership line
above at its own ref and either moves the bodies under a
`[app-board, app-shell]` fence or routes the file."* This lane took the
second option and routed.

**WHAT A TEST PATH OF ITS OWN ACTUALLY COST — MEASURED AT `T-112-s6`'s
OWN LANE RATHER THAN FORECAST.** It is a NEW file under `app/test/`
importing `Board` and nothing of C-05's, and every edge it needs was
already declared, because this component sits above the whole board side.
`index --check` at `T-112-s6`'s tip names **12** new graph edges and no
removals: seven file-level `import`s — `-> Board.tsx` (this component's
own), `-> board-model.ts` and `-> task-detail.ts` (C-17, declared),
`-> p:@supertaskr/parser` (C-06, declared), and `p:react`, `p:react-dom`,
`p:vitest`, which are packages and no component's — plus three
symbol-level `type_ref`s into those same C-17 symbols and two `call`s
inside the file itself. **NOT ONE OF THEM IS A NEW COMPONENT EDGE**,
which is the claim that matters: only two observed COUNTS move,
`C-18 -> C-06` 1 to 2 and `C-18 -> C-17` 2 to 4, both staying
`confirmed`. **THE 12 AND THE 2 ANSWER DIFFERENT QUESTIONS AND AN EARLIER
DRAFT OF THIS SENTENCE CONFLATED THEM** — a graph edge is per import
site, a component edge is per declared pair, and the first was read off a
truncated view of the gate's own output.

**AND `arch` CANNOT BE ASKED THIS FROM INSIDE A LANE — THE FORWARD
FIGURES BELOW ARE A COPY'S, NAMED AS SUCH.** `arch` and `arch drift`
compute from the COMMITTED `docs/architecture/graph.json`, which NO lane
regenerates: that file is outside every board fence and the regen is the
INTEGRATOR's at the merge (CONVENTIONS' GRAPH REGEN). So at `T-112-s6`'s
own tip `arch` still printed `files=200 mapped=200` and named nothing
new, and the lane's honest in-tree reading is `index --check`: **STALE,
`files +1 -0`, `edges +12 -0`**. The forward numbers —
`files=201 mapped=201 unmapped=0 edges=45 findings=4`, this component's
own `files=1` to `2`, and `arch blast` answering `component=C-18` for the
new path — were read in a THROWAWAY `git archive` copy of that tip whose
graph was regenerated INSIDE the copy. **They are the copy's figures
until the integrator's regen makes them the tree's**, and a lane that
printed them as its own would be reporting a file it never wrote.
**`arch cycles` is the exception and needs no copy**: it reads the
REGISTRY ONLY, so a stale graph cannot redden it, and it answered
**ACYCLIC, exit 0** at the tip itself.

**THE OBSTACLE WAS NEVER ARCHITECTURAL — IT IS THE ORDER, AND IT COST
TWO REFUSED DISPATCHES BECAUSE THE FIRST REPAIR WAS HALF OF ONE.** A
`[app-board]` fence expands to this component's `paths:` **as they stand
at dispatch**, so the registry line and the file it names cannot land in
one lane unless the card names that file itself. `C-05-app.md`'s T-149
note prescribes the first half — *"the card adding a test now fences its
own component's slug plus that component's own registry FILE
(`docs/architecture/components/C-12-map-pane.md`, not the directory), and
two such cards stay disjoint"* — and `T-112-s4` paid to learn the second:
**the card must also name the TEST FILE ITSELF in `touches:`.**

**AND `T-112-s6` PAID TO LEARN THAT BOTH HALVES ARE OWED TOGETHER — ALL
THREE TOKENS, BECAUSE THE SLUG SUPPLIES NEITHER OF THE OTHER TWO.** That
card was dispatched on `[app-board, app/test/board-root.test.tsx]`,
reasoning in its own body that `app-board` already reached this registry
file through the slug. **It does not, and the paragraph four above says
why in as many words**: no component declares its own registry file in
`paths:`, so an `[app-board]` fence reaches every board SOURCE file and
no registry file at all. The lane hook refused the write, the lane
STOPPED rather than working around it, and the fence was re-armed as
`[app-board, docs/architecture/components/C-18-board-root.md,
app/test/board-root.test.tsx]`.

**THE HALF-FENCE WAS NOT MERELY INSUFFICIENT, IT WAS HARMFUL, WHICH IS
WHY STOPPING WAS RIGHT.** Measured on a `git archive` copy of the tree at
that lane's base, the test file WITHOUT this registry line lands as an
`arch drift` **D2**:

    finding  D2  D2:unmapped  unmapped_files  files=1
      file  app/test/board-root.test.tsx
    summary  findings=5  unmapped=1        <- 4 and 0 at base, and with the line
    arch     edges=48  mapped=200          <- 45 and 201 with the line

`app/test/architecture-dogfood.test.ts` asserts against exactly that by
name — *"D2 STAYS EMPTY; the unmapped node stays gone"* — and it reds at
the INTEGRATOR's graph regen, detached from its cause, in a file no
`[app-board]` fence reaches. A lane that shipped the file alone would
have handed a red to somebody who could not attribute it.

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
