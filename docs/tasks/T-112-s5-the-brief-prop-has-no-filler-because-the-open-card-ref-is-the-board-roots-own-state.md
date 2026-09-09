---
id: T-112-s5
title: The brief prop has no filler even once the join lands — the open-card ref is Board.tsx's own useState, so the shell that mounts the board cannot know which card to ask a brief for
feature: F-04
milestone: 4
priority: 4
size: M
status: verifying
blocked_by: [T-190]
suggested_by: executor claude-opus-5@subagent @T-112-s1
touches: [app-board, docs/architecture/components]
verifier: claude-opus-5@subagent
built_by:
verified_by:
builder: claude-opus-5@subagent
review:
---

**MEASURED WHILE BUILDING `T-112-s1`, AND IT IS NOT THE JOIN.** The join's
gap is `T-126-s2` and is corroborated there; this is the SECOND thing
standing between the registered `dispatch_brief` command and a rendered
brief, it is independent of that ruling, and it survives it. Filed
separately because a card that unparks `T-126-s2` and stops there will
still not render a brief.

`Board.tsx` takes `dispatch` and `brief` as optional props and holds the
open card entirely to itself:

    const [openRef, setOpenRef] = useState<TaskRef | undefined>(undefined);

`App.tsx` — C-05, the file that mounts the board root — renders
`<Board model={model} />` and never learns `openRef`. So the shell can
compute a `DispatchReading`, which is a fact about the whole repository,
and **cannot compute a `BriefOutcomeView`, which is a fact about ONE
card**: `readBrief(taskId, role)` needs the id of the card the user just
opened, and the only component that knows it is the one being handed the
answer.

Three shapes exist and none of them is obviously right, which is why this
is filed rather than decided:

1. **Lift `openRef` to the shell.** Honest, and it moves ephemeral VIEW
   state across a component boundary to serve one consumer — the trade
   `A RENDER-PHASE REF STAMP`'s closing sentence warns about, and the one
   T-027's planning pass refused for a different log.
2. **Fetch in `Board.tsx`.** The composition root gains an effect and an
   `invoke`, which contradicts that file's own design note in as many
   words (*"this file makes no decision about them"*) and puts I/O in the
   one board file with no test path of its own (`T-112-s4`).
3. **Fetch in `TaskDetailPanel.tsx`.** Nearest to the need — the drawer
   already knows its `taskRef` — and it makes C-09 reach C-15, an
   undeclared component edge today.

Shape 3 is the likeliest and is the one that needs the registry looked at
first; the `brief` PROP could then stay as the test seam it already is,
which is what `app/test/board-truth.test.tsx` drives.

## Where it was found

`T-112-s1` registered the command and wired `dispatch-store.ts` to it, so
the assembler is reachable from the webview for the first time. The card's
criterion 3 asked for both props to be filled from the store; neither
half is buildable today, for two DIFFERENT reasons, and that lane routed
both rather than widening its fence or deciding a parked ruling from
inside a lane. Read this beside `T-126-s2`'s corroboration of the same
date and `T-112-s4`, whose registry gap is a third, separate thing.

## RULED AT THE ARCHITECTURE SITTING, 2026-08-31 — shape 3, and this card is THIRD in a forced order

`T-126-s2` now carries the ruling for the whole seam; read it there. What
binds this card:

**Shape 3 (fetch in `TaskDetailPanel`) is confirmed as the direction**,
for the reason this card already suspected — it is nearest the need and
the drawer already knows its `taskRef`. The `brief` PROP stays as the
test seam `app/test/board-truth.test.tsx` drives.

**But its stated cost — that it makes C-09 reach C-15, an undeclared
component edge — is now the SECOND reason to do `T-112-s4` first, not a
separate problem.** That card opens the registry to give C-18 a test
path; declaring this edge is an edit to the same file in the same lane's
reach. Doing them apart means opening the registry twice.

**The forced order is `T-112-s4` → `T-126-s2` → this card.** This card is
correct that it is independent of the join's ruling and survives it; it
is not independent of the registry gap, and neither is the join.

Shape 1 (lift `openRef` to the shell) stays refused on this card's own
argument. Shape 2 (fetch in `Board.tsx`) stays refused on that file's own
design note.

## THE FORCED ORDER IS SATISFIED AT THIS LANE'S BASE

Taken from the dispatch and stated rather than re-derived: `T-112-s4`,
`T-126-s2` and `T-112-s5`'s other predecessor `T-190` are all `done` at
base `f34be88a7ae7f39ad501a9638bdc55ba5b69cae3`. Nothing here waited on
anything.

## The criteria this lane built to

**THIS CARD CARRIES NO `## Acceptance criteria` HEADING, AND THE RULED
SECTION IS THE BUILD INSTRUCTION.** These are derived from that section
and from `T-112-s1`'s criterion 3 (*"Board.tsx's props filled from the
store — HALF BUILT, HALF ROUTED"*), stated before the work so a verifier
grades against something written down.

1. **The `brief` prop has a filler.** A brief reaches the drawer without
   anything outside the board naming the card — which is the fact this
   card exists to state was impossible.
2. **It is the OPEN card's brief.** `dispatch_brief` is asked for the
   drawer's own `taskRef`, not for a constant and not for the board's
   first card. This is the whole content of shape 3.
3. **The C-09 → C-15 edge is DECLARED**, and declaring it introduces no
   cycle.
4. **The `brief` PROP survives as the test seam
   `app/test/board-truth.test.tsx` drives**, and that file is neither
   edited nor reddened — a supplied prop is authoritative and no question
   is asked at all.
5. **Shapes 1 and 2 stay refused**: `openRef` stays `Board.tsx`'s own
   state, and `Board.tsx` gains no effect and no `invoke`.
6. **The two ways a question fails to become an answer do not collapse
   into the pending silence** — an implied criterion of "fetch it", since
   `readBrief`'s own door has a `noProject` arm and `invoke` rejects
   rather than answering when the boundary fails.
7. **The OTHER half of `T-112-s1`'s criterion 3 — the `dispatch` prop —
   is NOT built and is routed**, naming the fence it needs.

## Implementation notes

The build is `2661f7a`; **this notes commit is the lane's tip** and is
named in `report-T-112-s5.md` by hash, because a file cannot state the
sha of the commit that contains it. Lane
`task/T-112-s5-board-open-card-ref`, worktree
`/Users/ujju/Projects/nputer-T-112-s5`, base `f34be88a`.

**1 — MET.** `TaskDetailPanel.tsx` gains `useAssembledBrief`, which calls
C-15's `readBrief(taskId, "executor")` when the block will render and no
prop was supplied, and hands the answer to `selectBriefPanel` unchanged.
Nothing about the outcome is decided in C-09.

**2 — MET, and it is the assertion rather than a side effect.**
`app/test/detail-assignment.test.tsx` asserts the recorded call is
`[{ cmd: "dispatch_brief", taskId: "T-960", role: "executor" }]` — WHICH
card, not that a call happened. Mutant **M1** (ask for the constant
`"T-001"`) kills 2 bodies; mutant **M2** (never ask) kills 4.

**3 — MET.** `depends_on: [C-06, C-08, C-11, C-15, C-16, C-17]`.
`cargo run -p supertaskr-index -- arch cycles --root ../..` answers
**ACYCLIC, 15 components, 44 declared edges, exit 0** (43 at the base).
The edge is one hop off an existing DAG: C-15 → C-10 → C-06 → C-01, with
no path back.

**4 — MET, and the seam is measurably load-bearing rather than merely
untouched.** `board-truth.test.tsx` is not in the diff. Mutant **M3**
(delete `if (supplied !== undefined) return supplied;`, one line, one
side) kills **5** bodies and **one of them is `board-truth.test.tsx`'s**
*"a card opened with both props renders the drawer's copyable brief"* —
so the file that pins this seam does still red when the seam breaks.

**5 — MET.** `Board.tsx`'s only change is its header comment; the
threading lines and `useState` are byte-identical. `git diff` on that
file is comment-only, and `index --check` reports it as `(content, loc
108 -> 118)` with no symbol change.

**6 — MET.** `BriefOutcomeView` gains two arms for the two facts the DOOR
produces and the assembler cannot — `noProject` (mirroring
`DispatchBriefWire`'s own) and `boundaryFailed` — with their own whole
sentences in `refusalSentence`. Both are pinned WHOLE (`toBe`) in
`select-task-detail.test.ts` beside the pending sentence they must not
collapse into, and on screen in `detail-assignment.test.tsx`. Mutants
**M6** (route `noProject` back to the pending silence) and **M7** (drop
the boundary detail in transit) each kill exactly one body.

**AND THE NO-RUNTIME CASE IS DELIBERATELY *NOT* A FAILURE.** In the
browser bundle there is no assembler — the brief is read Rust-side — so
`hasTauriRuntime()` keeps the hook idle and the pre-existing sentence
stands, which is the whole truth about that build AND is what keeps
criterion 4's file green. Mutant **M4** (drop the guard) kills exactly
one body, **and it is mine**: `board-truth.test.tsx` asserts
synchronously after the click, so the rejection lands a microtask too
late for it. That file could not have caught this, which is why the body
is here.

**7 — NOT BUILT, ROUTED, and it is not a fence problem either.**
`dispatch` needs a `LaneScan`, whose only producer is `dispatch_lanes`;
the door onto it is `T-126-s1`'s parked RULING, and the two files that
render `<Board>` are C-05's `app-shell` (`T-126-s9`). Both are already
filed; nothing new is filed for them here. While `dispatch` is absent the
block does not render at all, so **the brief still does not reach a
screen outside a suite** — this card removed the second of the two
obstacles and the first is still standing.

### What the INTEGRATOR must do, and why this lane did not

**TWO BODIES RED AT THIS TIP AND BOTH ARE C-12's `app-map` DOGFOOD
PINS.** `docs/CONVENTIONS.md`'s GRAPH REGEN bullet, T-211, rules them:
*"THE PIN RECONCILIATION IS INTEGRATION-SEAT WORK: A LANE NEVER UPDATES
THE PINS … the relation table … reconciled AT THE CHECKPOINT … A lane
that finds a pin wrong states it in its notes and leaves the file
alone."* This is that statement. The ask was written, answered NO by the
architect seat and closed; neither file is in the diff.

The values are **derived against a regenerated graph, never off a
failure** — the technique `C-15-dispatch.md` prescribes. A `git archive`
copy of this tip was regenerated in place with
`supertaskr-index index --root <copy>` (`index --check` in the copy then
reads **CURRENT**, 201 files / 2558 symbols / 2453 edges), and the two
pins were run against it:

- `app/test/architecture-dogfood.test.ts` — insert exactly one row,
  **`["C-09", "C-15", "confirmed", 1]`**, between `["C-09", "C-11",
  "planned", 0]` and `["C-09", "C-16", "confirmed", 3]`; the body's own
  name moves from *"33 confirmed, 2 undeclared, 10 planned"* to
  *"34 confirmed, 2 undeclared, 10 planned"*. **In this lane the same row
  reads `planned 0`** — the relation and observed columns come from the
  COMMITTED graph — which is exactly why a lane must not pin it.
- `app/test/map-dogfood-render.test.tsx` — the rendered edge count
  **45 → 46**; the `undeclared` count stays **2** and the two assertions
  under it are unaffected (only one assertion in that file moves).

**AND NOTHING ELSE MOVES AT THE REGEN, measured rather than forecast.**
The full app suite against the regenerated copy fails exactly those two
bodies; the other six reds in that copy are the throwaway's own artifact
— `git archive` writes fresh mtimes, so the `dist/ predates <source>`
staleness assertions in `shell-harness`, `window-manifest`,
`interview-harness`, `genesis-mount`, `map-t1-t2-dom` and
`map-tasks-lens-dom` fire. This lane's own `npm test` fails **two**, and
those two only. `arch` at the regenerated copy: `components=15 files=201
mapped=201 unmapped=0 edges=46 findings=4 drift_components=4` — files and
findings unchanged, because **this card writes no new file**.

### THE DECLARATION HAS NO KEEPER INSIDE THE LANE, MEASURED

Mutant **M8** — revert the `depends_on` line, leave the import in place,
one side only — turns both dogfood reds GREEN and reds **nothing**:
`architecture-dogfood`, `map-dogfood-render` and `detail-assignment` all
pass, 31 tests, exit 0. So no gate in this lane holds the declaration.
**Its keeper is real and fires at the merge's regen**, derived in a
second regenerated copy with the declaration absent:

    finding  D1  D1:C-09->C-15  C-09 -> C-15  file_edges=1
      file-edge  app/src/components/board/TaskDetailPanel.tsx -> app/src/lib/dispatch-store.ts
    summary  findings=5  undeclared=3        <- 4 and 2 with the declaration
    edge     C-09 -> C-15  undeclared  observed=1

That third D1 is what `architecture-dogfood`'s findings body would red
on. Routed as a suggestion (`T-112-s7`): an `[app-*]` lane cannot see
this from inside itself, and the two-copy probe above is the technique
that makes it visible.

### Where the brief was wrong

1. **ROW 4's base is `f83f7f13d4741a911c1f71fe6bfc3ba350db1f86`; this
   lane's actual base is `f34be88a7ae7f39ad501a9638bdc55ba5b69cae3`**,
   which the brief lists as the integration TIP. The worktree was already
   cut when the brief was assembled; the repository wins and the lane
   built on `f34be88a`.
2. **ROW 7 names `npm install` from app/.** A lane runs `npm ci` — the
   fence makes lockfiles read-only — and that is what ran here, exit 0.
3. **The dispatch message asks for `npm run typecheck`/lint "as
   app/package.json names them". `app/package.json` names NEITHER.** Its
   scripts are `dev`, `build`, `preview`, `test`, `tauri`; the typecheck
   is `npm run build`, which is `tsc && tsc -p tsconfig.test.json && vite
   build` and runs BOTH programs. That is what ran, exit 0. `typecheck`,
   `lint:tokens` and `lint:docs` are `tools/e2e`'s, and were run there.
4. **ROW 5's fence expansion omits `app/test/board-truth.test.tsx`**,
   which is correct (the file is C-05's) but is the file this card's own
   ruling names as the seam. The lane read that as *keep it green without
   touching it*, and mirrored its property in an in-fence file.
5. **The ADVISORY seat block reads "the card carries no acceptance
   criteria, so there is nothing to build against".** There is: the RULED
   section. The criteria above are derived from it.
