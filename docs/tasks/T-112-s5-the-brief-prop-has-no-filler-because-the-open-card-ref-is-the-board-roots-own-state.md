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

## Verdicts

### 2026-09-09 — claude-opus-5@subagent (phase 2)

VERDICT: APPROVED WITH ASSIGNED CORRECTIONS

attack set: sha256:4f0cd49b8c89073c2cda33c4bf7f7c588dfecf4c620517ef2a4682a106bb9be8 (attack-set-T-112-s5.md)
ground truths: sha256:d31799c0835de21f446fa967ec5d457613657a325bad4d098886b6143f547085 (ground-T-112-s5.md)

base `f34be88a7ae7f39ad501a9638bdc55ba5b69cae3` · tip
`cbc24d456370830360f4bd7ea3167d401ff1834a` · bench
`../nputer-V-T-112-s5` detached · scratch worktree
`<scratch>/V-T-112-s5-drill`, detached at the tip, for every mutant, with
its own `app/dist` built so the bundle-staleness bodies do not fire.

**THE FRAME I ACTUALLY HAD.** Phase 2 of two spawns, fresh, with tools.
Both digests verified with `shasum -a 256` before either file was opened;
both matched. **Phase 1 was tool-less BY INSTRUCTION, not by
construction** — this harness cannot deny a spawn its tools — and the
attack set's own foot reports `tool calls made: 0`. That is the honest
weaker thing and it is written down rather than rounded off.

**MY BRIEF CARRIED EXECUTOR-DERIVED SPECIFICS, AND I SAY SO RATHER THAN
PRETENDING IT DID NOT.** The dispatching seat named the executor's two
commit subjects and its hook name `useAssembledBrief`, read out of the
report's head; it also told me *which* dogfood body to expect red and why
the ask was refused. Phase 1 was above that line — its return names
neither — so the blindness that matters held, but phase 2's brief did
not, and the reader should discount my orientation accordingly. Every
figure below is my own measurement at a named ref; nothing is relayed. I
read the diff whole before opening `report-T-112-s5.md`.

**AND THE SEAT'S ONE KNOWN-FACT WAS WRONG IN MY FAVOUR.** I was told ONE
app body would be red. **Two are.** The lane's own notes name both,
correctly, so this is the seat's understatement and not the lane's
omission — but it is exactly the misattribution this role is warned about
and I record it: had I trusted the brief, I would have charged the second
red to the lane.

---

## 1. The suites, each at a named ref, through the blessed runner

Run from the bench root, `SUPERTASKR_E2E_PORT=25112`, after `npm ci` in
lib/parser, app and tools/e2e and `npm run build` in lib/parser and app
(all exit 0).

| leg | exit | bodies | ref | verdict |
|---|---|---|---|---|
| `gate-run.mjs parser` | **0** | **389** | `cbc24d4` | GREEN |
| `gate-run.mjs app` | **1** | **1170** | `cbc24d4` | RED — the two pins below |
| `gate-run.mjs rust` | **0** | **645** over 18 targets | `cbc24d4` | GREEN |
| `gate-run.mjs e2e` | **0** | **706** | `cbc24d4` | GREEN |

The count is read beside the code in every row. `+7` app bodies over the
base figure of 1163 the ground truths carry (6 DOM bodies in
`detail-assignment.test.tsx`, 1 sweep in `select-task-detail.test.ts`).
My cargo figure is **645**, not the report's 641 — `gate-run` and a bare
`cargo test` count differently; both are exit 0 and I quote mine.

**THE APP RED, CLASSIFIED BEFORE IT IS ATTRIBUTED.** Two bodies, one
cause, and `npx vitest run` names them:

    test/architecture-dogfood.test.ts  "the full relation table: 33 confirmed, 2 undeclared, 10 planned"
        expected [ …(46) ] to deeply equal [ …(45) ]  — the extra row is ["C-09","C-15","planned",0]
    test/map-dogfood-render.test.tsx   "draws the full 45-edge relation table, with TWO undeclared rows left"
        expected …(46) to have a length of 45 but got 46

Both files are **outside this lane's fence** (the manifest's 19 paths,
GT-11 — neither appears), both are C-12's `app-map` dogfood pins over the
derived relation table, and both move for the one reason: C-09 now
declares C-15, so the table gains a row. `docs/CONVENTIONS.md`'s GRAPH
REGEN bullet and T-211 put pin reconciliation at the integration seat and
forbid a lane to touch it; the ask was written, answered NO, and **neither
file is in the diff** — I checked `git diff --name-status`, which lists
ten paths and no test outside `app/test/detail-assignment.test.tsx` and
`app/test/select-task-detail.test.ts`. **Not charged to the lane. No
OTHER app body reds**, at the tip or under any mutant's control run.

**I RE-DERIVED THE INTEGRATOR'S POST-REGEN VALUES RATHER THAN RELAYING
THEM.** `supertaskr-index index --root <drill worktree>` regenerated the
graph in place (`index --check` in that copy then reads **CURRENT**,
1198065 bytes / 201 files / 2558 symbols / 2453 edges, exit 0), and the
two pins run against it give exactly:

- `architecture-dogfood` — one row, **`["C-09", "C-15", "confirmed", 1]`**,
  between `["C-09","C-11","planned",0]` and `["C-09","C-16","confirmed",3]`;
  the body's name moves to *"34 confirmed, 2 undeclared, 10 planned"*.
- `map-dogfood-render` — the rendered edge count **45 → 46**.

The lane's stated values are correct. In the lane the same row reads
`planned 0` because the relation column comes from the COMMITTED graph,
which is stale by construction here — `index --check` at the tip is exit
**1** STALE, and it is a REAL stale, not the `--root` false red: it prints
both byte/file/symbol/edge counts and `files +0 -0 ~5`, where the false
red prints `committed: MISSING`.

---

## 2. The criteria, one by one, against the RULING

The card carries no `## Acceptance criteria` heading, so the RULED section
of 2026-08-31 binds. The attack set derived **eight** criteria from it
before the diff existed; the executor wrote **seven** on the card. I judge
against the ruling and give both mappings.

**C1 — the drawer fetches, and it is `TaskDetailPanel.tsx` that does.
MET.** `git diff --name-status` adds **no file**, so attack 1.1's "a
helper only Board calls" has nowhere to live. Grepping the whole board
tree for store call sites returns exactly one executable site —
`TaskDetailPanel.tsx:15` (`import { readBrief } from "@/lib/dispatch-store"`)
and `TaskDetailPanel.tsx:111` (`readBrief(askFor, BRIEF_ROLE)`). Every
other hit in `Board.tsx` is inside a comment. The call is not dead: A-M1
kills four bodies.

**C2 — the `brief` prop remains the seam. MET, and load-bearing rather
than merely untouched.** Attack 2.1 asked for the base version of
`app/test/board-truth.test.tsx` run against the lane's source; that is
vacuous here in the strongest possible way — **the file's blob is
byte-identical at both refs**, `085a3ecd1c63e219f475d2faf223d61960ce5154`
at `f34be88` and at `cbc24d4`, matching the blob the ground truths
recorded. It was not edited, not weakened, not narrowed. And A-M5 (delete
`if (supplied !== undefined) return supplied;`) kills **8** bodies
including that file's own *"a card opened with both props renders the
drawer's copyable brief, and neither prop alone will do"* and three in
`board-root.test.tsx`. Attack 2.2's precedence question is answered in
code and pinned in a body: a supplied prop wins and **no `invoke`
happens at all**. Attack 2.3/2.4: the prop still threads through Board
byte-identically; no `lazy`, `Suspense` or portal enters the path.

**C3 — the C-09 → C-15 edge is declared. MET.** I derived the real import
edge from the indexer rather than from the registry:
`index --check` at the tip reports, among `edges +12 -0`, exactly one
cross-component file edge —
`f:app/src/components/board/TaskDetailPanel.tsx -> f:app/src/lib/dispatch-store.ts (import) symbols=[readBrief]`.
C-09 owns `TaskDetailPanel.tsx` and C-15 owns `dispatch-store.ts` (GT-6),
so the edge IS C-09 → C-15, and `C-09-detail-panel.md` declares
`depends_on: [C-06, C-08, C-11, C-15, C-16, C-17]`. Direction correct
(3.2), node correct (3.3), and **no line was removed** (3.4) — the
declared-edge total goes 43 → 44, which is +1 net, so nothing was traded
away to keep a count.

**C4 — `arch cycles` stays clean. MET, and the instrument is shown
live.** At the tip: `ACYCLIC · components=15 · declared_edges=44 · exit
0`. That is a measurement and not a vacuous pass, because the positive
control fails: data mutant **A-D3**, injecting the reverse edge alongside
the true one in an isolated copy of the registry, gives
`cycle C-09 -> C-15 -> C-09 · DECLARED CYCLE · exit 1`.

**C5 — shape 2 stays refused. MET.** `Board.tsx`'s diff is
**comment-only** — `index --check` reports it as `(content, loc 108 ->
118)` with **no symbol change**, and grepping the added lines for
`useEffect|await|async|invoke|then(|import` returns nothing (exit 1).
Attack 5.3 is the one that needed care and it is NOT triggered: the
paragraph the lane edited is the *account* paragraph (*"and `T-112-s5`
carries the account"*), while the DESIGN NOTE proper — *"Both props are
optional and are threaded VERBATIM — this file makes no decision about
them"* — is untouched, and the replacement text says in as many words
that fetching here **was refused on this file's own note**. That is
recording a change, not licensing one.

**C6 — shape 1 stays refused. MET.** `app/src/App.tsx` is not in the diff
at all. `const [openRef, setOpenRef] = useState<TaskRef | undefined>(undefined);`
is byte-identical (it moves 73 → 83 only because the header comment grew).
No `createContext`, no module-level mutable: the sole `let` added
anywhere is `let live = true` **inside** the effect, which is per-effect
closure state and the opposite of lifting.

**C7 — async honesty. MET on every observable, with one guard unheld —
see the correction.** Re-fetch on a reused drawer (1.3) is real: the
re-target body renders `T-960`, then re-renders the same root at `T-962`
without unmounting, and asserts `calls` is `["T-960","T-962"]`. The
dependency array (1.4) is `[askFor]` and is pinned — A-M7 narrows it to
`[]` and the re-target body reds. Error is distinct from empty (7.3):
`boundaryFailed` carries its own whole sentence, `toBe`-pinned beside the
pending one in `select-task-detail.test.ts`, and A-M6 kills it. Sticky
error across a switch (7.5) cannot happen: the answer is keyed and the
key is pinned by A-M4b. No unhandled rejection escapes (7.6): the
rejection is taken by `.then`'s second argument, and the suite runs clean.
**Where it is thinner than the attack set asked:** there is no loading
affordance DISTINCT from the never-asked state — a pending fetch renders
*"the assembler has not answered for this card yet"*, which is literally
true and is asserted mid-flight in the re-target body, so I do not call it
a defect; and the unmount-mid-flight path (7.2) is not exercised by any
body, which is the correction below.

**C8 — the call is right. MET.** The arg assertion is exact —
`expect(calls).toEqual([{ cmd: "dispatch_brief", taskId: "T-960", role: "executor" }])`
— which is WHICH card, not that a call happened (attack 8.1/1.5). I
cross-checked both arguments against the real signatures rather than the
fixture: `readBrief(taskId: string, role: "executor" | "verifier")` and,
Rust-side, `Role` is `#[serde(rename_all = "camelCase")]` over
`Executor | Verifier`, so `"executor"` is one of exactly two accepted
spellings (8.2). The id passed is `detail?.id`, model-derived, not a
`TaskRef` object. Call count is one per settled mount and A-M3 proves the
role is pinned, A-M2 the id (8.3).

**WHERE THE TWO LISTS DIFFER.** The executor's seven and the attack set's
eight are not one a superset of the other:

- The executor has **no criterion for C7's staleness half** — its 6 covers
  only the door's two arms. The property is built and pinned anyway
  (A-M4b, A-M7), so this is a gap in the LIST, not in the work.
- The executor has **no criterion for C8** — the role, the exact args and
  the call count are asserted in a body but never claimed as a criterion.
- The attack set has **no counterpart to the executor's 7** (the
  `dispatch` half of `T-112-s1`'s criterion 3 is NOT built and is routed).
  That is a scoping statement derived from a different card, and filing it
  is right: it is the sentence that stops a reader believing a brief now
  reaches a screen. It does not.
- The rest map one-to-one: 1+2↔C1, 4↔C2, 3↔C3+C4, 5↔C5+C6, 6↔C7's door
  half.

---

## 3. The poison drill — my own mutants, at the site the property lives

Detached scratch worktree, work committed first, one side per mutant,
**every landing read from `git diff`** and every restore proved by
`shasum -a 256` against the pristine values plus an empty
`git status --porcelain`. Pristine
`TaskDetailPanel.tsx` = `c36eb847b9225ce2ad6f3fd8f3b37bbace5ff75e156131672a60696cf58c85a3`;
every restore printed it back.

**A note on the first attempt, because it is the exact failure this method
names.** My first drill reported all fourteen mutants "survived". They had
not run: the file list was an unquoted zsh scalar, zsh does not word-split
one, and vitest answered `No test files found, exiting with code 1` — an
**exit 1 over ZERO bodies**, a harness failure wearing a red. Reading the
count as well as the code is what caught it. Everything below is the
re-run, with the list as an array.

Kill sets are over a seven-file set (118 bodies: `detail-assignment`,
`board-truth`, `select-task-detail`, `board-root`, `detail-presentation`
and the two dogfood files); the two dogfood pins red in every run and are
excluded as baseline. Survivals were re-confirmed against the **full**
1170-body suite.

| ID | mutation (one side) | result | the body it reds |
|---|---|---|---|
| **A-M1** | the `readBrief` call disabled | **KILLED ×4** | *asks dispatch_brief for the open card's id…*; *`noProject` reaches the reader…*; *a REJECTED invoke…*; *a re-targeted drawer…* |
| **A-M2** | asks for the constant `"T-001"` | **KILLED ×2** | *asks dispatch_brief for the open card's id…*; *a re-targeted drawer…* |
| **A-M3** | `BRIEF_ROLE` → `"verifier"` | **KILLED ×1** | *asks dispatch_brief for the open card's id…* |
| **A-M4** | the in-flight `live` guard deleted | **SURVIVED** | nothing, in 1170 bodies — see the correction |
| **A-M4b** | the answer un-keyed (`answer.taskId !== askFor` dropped) | **KILLED ×1** | *a re-targeted drawer never shows the PREVIOUS card's brief* |
| **A-M5** | a supplied prop stops winning | **KILLED ×8** | incl. `board-truth.test.tsx`'s own body and three in `board-root.test.tsx` |
| **A-M6** | a rejection swallowed into `noSuchCard` | **KILLED ×1** | *a REJECTED invoke reaches the reader as the app's own boundary failing* |
| **A-M7** | the dep array narrowed to `[]` | **KILLED ×1** | *a re-targeted drawer never shows the PREVIOUS card's brief* |
| **A-M8** | the `blockWillRender` gate ignored — it always asks | **SURVIVED** | nothing, in 1170 bodies — see the correction |
| **A-M9** | the `hasTauriRuntime()` guard dropped | **KILLED ×1** | *with no Tauri runtime it asks nothing…* |
| **A-M10** | `noProject` collapsed into the assembler's silence | **KILLED ×1** | *`noProject` reaches the reader as ITS OWN fact…* |
| **A-D1** *(data)* | the declared C-15 edge deleted, the import left | **SURVIVED — and turns the suite GREEN** | 118/118, exit 0 |
| **A-D2** *(data)* | the edge declared BACKWARDS (C-15 → C-09) | **SURVIVED** `arch cycles` | ACYCLIC, 44 edges, exit 0 |
| **A-D3** *(data)* | the reverse edge injected alongside | **KILLED** | `arch cycles`: `cycle C-09 -> C-15 -> C-09`, exit 1 |
| **A-D4** *(data)* | the fixture brief's line changed at the PRODUCER | **KILLED ×1** | *asks dispatch_brief for the open card's id…* — so the assertion is on the brief's VALUE |
| **A-D5** *(data)* | the answer is about `T-999` while `T-960` is open | **SURVIVED** | nothing, in 1170 bodies |
| **F1** | a `readBrief` call planted in `Board.tsx` | **no new red** (structural) | — |
| **F2** | `openRef` lifted to `App.tsx` | not planted — `App.tsx` is out of fence, which is the keeper | — |

**CONTAINMENT, NOT THE COUNT.** Reading the table by BODY rather than by
mutant: *the open card's id* is killed by {M1,M2,M3,D4}; *re-target* by
{M1,M2,M4b,M7}; *noProject* by {M1,M10}; *boundary* by {M1,M6};
*no-runtime* by {M9}; *supplied prop* by {M5}. **No body's set is
contained in another's**, so none of the six bodies this lane added is a
restatement of another. A-M4b and A-M7 share a single killing body, which
is a property of that body being load-bearing for two things, not of
either mutant being redundant.

**WHERE THE PROPERTY LIVES IN DATA, THE MUTANT IS A DATA MUTANT.** Five of
them (D1–D5) — and they are what separated the registry claim from the
suite, which no code mutant could have.

**A-D1 SAID PLAINLY, BECAUSE THE ATTACK SET PRE-COMMITTED TO IT.** Delete
the C-15 entry from C-09's `depends_on`, leave the import, and the app
suite goes from two red to **118/118 exit 0**: no gate inside this lane
holds the declaration, and removing it makes the lane LOOK better.
**A-D2 adds the same for direction** — declaring the edge backwards is
invisible to `arch cycles` too. Both are the finding the lane already
routed as `T-112-s7`, measured independently here and, on the direction
half, widened.

---

## 4. Security sweep

- **S1 — no HTML injection. CLEAN, and measured rather than reasoned.**
  Zero `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` in the whole
  of `app/src`. The brief renders as a React text child inside `<pre>`. I
  planted the fixture the attack set asked for — a brief whose line is
  `<img src=x onerror="globalThis.__pwned=1"><script>…</script>` — and
  asserted `img` and `script` element counts are 0, `__pwned` is
  undefined, and the literal text is on screen. Passes.
- **S3 — the Rust payload. NO HOLE, at the base or here, and the attack
  set's expectation of a pre-existing one is FALSE.** `task_id` is never
  joined into a path. `brief_for_card` calls `list_dir("docs/tasks")` — a
  constant rel path joined to the project root — and uses the id only as a
  **basename filter**, `name.starts_with(&format!("{task_id}-"))`, over
  `p.rsplit('/').next()`. A basename cannot contain `/`, so a
  traversal-shaped id matches nothing and yields `NoSuchCard`. The length
  bound `task_id_within_bounds` sits on the testable seam (T-112-s1's own
  correction 1). **This card touches no Rust at all**, so it cannot widen
  what is not open. Reported at the base as the sweep requires, with the
  finding being that there is none.
- **S4/S5/S7 — CLEAN.** The reachable file set is the tasks directory. The
  one string on this path authored outside the app is the rejection's
  message, and it travels verbatim into `refusalSentence`; I planted a
  hostile one and it renders as text, creating no element. It is
  boundary-authored (a missing command, a serde failure), not
  attacker-supplied, and it names no host path.
- **S6 — CLEAN.** No anchors, no `href`, no `javascript:` in the panel.
- **S2 — no change.** No new truncation and none removed; the fetched
  answer travels the same render path the prop already did.
- **Dependencies: none added.** No `package.json` or lockfile in the diff.
- **No secrets or keys in the diff.**

Nothing here is REJECTED-level.

---

## 5. ASSIGNED CORRECTIONS

Both are the same class and it is the class this feature's own `T-112-s1`
verdict named: **a bound that nothing can poison is a bound nothing
keeps.** Neither changes behaviour; each pins a property the new code
states about itself and nothing holds. The integrator performs them at
the landing, held to lane standards.

**CORRECTION 1 — pin the gate on asking.** `useAssembledBrief`'s design
note claims in capitals *"IT ASKS ONLY WHEN THE BLOCK WILL RENDER, WHICH
IS `dispatch` BEING PRESENT"*. Mutant **A-M8** deletes that gate —

    -  const askFor = blockWillRender && supplied === undefined ? taskId : undefined;
    +  const askFor = supplied === undefined ? taskId : undefined;

— and survives all **1170** bodies. Add to
`app/test/detail-assignment.test.tsx`, inside the T-112-s5 describe:

    it("asks NOTHING when the dispatch prop is absent, because the block will not render", async () => {
      const calls = installTauri(async (taskId) =>
        ({ kind: "answered", outcome: briefFor(taskId, "a brief nobody asked for") }));
      const dom = await renderSettled(briefModel(false), "T-960", undefined, undefined);
      expect(calls).toEqual([]);
      expect(dom.querySelector('[data-testid="detail-brief"]')).toBeNull();
    });

**AND THIS CONTROL IS MINE, SO I CHECKED IT, BOTH WAYS.** Appended to
that file in the scratch worktree at the tip: **16 passed (16), exit 0** —
it passes against the implementation as built. Then, with **A-M8**
applied — the arming absent — **1 failed | 15 passed (16)**, and the one
failure is this body by name. Its positive control is the first T-112-s5
body: the same fixture and the same recorder WITH `dispatch`, asserting
exactly one call, so the empty log is a fact about the gate and not about
a recorder that never worked. The two security bodies I appended beside
it stayed green under A-M8, so the body is aimed at the gate and at
nothing else.

**CORRECTION 2 — resolve the unheld `live` flag, one way or the other.**
Mutant **A-M4** deletes `if (!live) return;` from the resolution arm and
survives all **1170** bodies, because the answer key already decides every
observable outcome. Either pin it (a body that unmounts the drawer
mid-flight and asserts no write follows — attack 7.2, which no body
reaches) or state in the code that it is redundant with the key, so a
later seat deleting it knows which it is deleting. **I do not prescribe
which**: the choice is a judgement about defence in depth, and the defect
is that the code does not say. Filed also as `T-112-s10` so it is not lost
if the integrator takes the second option.

---

## 6. Findings filed as `status: suggested`

- **`T-112-s10`** — the drawer's staleness contract: the `live` flag is
  held by no body (A-M4), and nothing checks that the ANSWER is about the
  card it was asked for (A-D5 survives 1170 bodies — the drawer renders
  `T-999`'s brief text under `T-960`'s heading and every assertion
  passes). Not reachable today; written down rather than fixed in a hurry.
- **`T-112-s11`** — shape 2's refusal has no keeper while shape 1's is
  kept by the fence. F1 plants a `readBrief` call in `Board.tsx` and reds
  **nothing new**. Read it beside the lane's own `T-112-s7`: both point at
  the same unwired instrument (`arch drift --fail-on undeclared`), from
  opposite sides.

I did not fold either into the verdict, and neither blocks.

---

## 7. What the integrator must do at the merge

1. **GRAPH REGEN, then the pins — in that order.** `index --check` is exit
   1 STALE at this tip and five indexed files moved. Regenerate, then
   reconcile `architecture-dogfood`'s table with **one** row,
   `["C-09","C-15","confirmed",1]`, its body name moving to *"34
   confirmed, 2 undeclared, 10 planned"*, and `map-dogfood-render`'s edge
   count **45 → 46** with `undeclared` unchanged at 2. **Re-derived here,
   not relayed**; re-derive again if another lane lands first.
2. **Perform corrections 1 and 2**, drilling correction 1 with A-M8 —
   the demonstration is above and reproduces.
3. **Nothing else moves**: no new file, no file-count move, no findings
   move, no `arch cycles` move (44 declared edges, ACYCLIC), and
   `capabilities:check` is CURRENT — this lane adds no e2e spec body.
4. Move the lane branch to this verdict commit before merging (room 17).

## 8. The gates my own commits could move

This verdict and the two cards are writes under `docs/tasks/`, and prose
is a code input here. `docs-gate.mjs` on the two new cards answers
**FIRES** (exit 1 — the gate RAN) and names `npm test from app/`,
`npm test from tools/e2e/` and `npx vitest run from lib/parser/`; its
census line reads *"every live task card's frontmatter parses, with a
legal status"*, `0 frontmatter issue(s) in the live tree`, and the
injection scan reports **0 hits**. Those three suites are re-run at the
tip THIS verdict creates, and the figures are recorded in the commit that
carries them — the figures in section 1 are stamped at `cbc24d4` and stay
true there forever.

### FOOT — the gates re-run at the tip THIS VERDICT created

The verdict commit is `f57802a409b7ffd0cce8af217600b1f807debc48`. It and
the two filed cards are writes under `docs/tasks/`, and `docs-gate.mjs`
named three suites owed. All three, through the blessed runner from the
bench root, **at `f57802a`**:

| leg | exit | bodies | ref |
|---|---|---|---|
| `gate-run.mjs parser` | **0** | **389** | `f57802a` | GREEN |
| `gate-run.mjs app` | **1** | **1170** | `f57802a` | RED — the same two pins |
| `gate-run.mjs e2e` | **0** | **706** | `f57802a` | GREEN |

`npx vitest run` from app/ at `f57802a` names the failures:
**1168 passed | 2 failed (1170), 49 of 51 files** — byte for byte the two
`app-map` dogfood pins that were red at `cbc24d4`, and nothing else. **My
commit moved no count and added no red**, which is the whole reason this
foot exists.

`rust` is not owed: the docs gate names `npm test from app/`, `npm test
from tools/e2e/` and `npx vitest run from lib/parser/`, and no `.rs` or
`app/src-tauri/**` path is touched by this verdict; its figure stays
stamped at `cbc24d4` (645 bodies, exit 0, GREEN).

**AND THIS RECORDING COMMIT IS ITSELF A WRITE, WHICH IS THE REGRESS THE
RULE ACKNOWLEDGES RATHER THAN SOLVES.** It adds prose inside a card whose
frontmatter is unchanged and already parsed; after it, `docs-gate.mjs`
still answers *"every live task card's frontmatter parses, with a legal
status"* with **0** frontmatter issues and **0** injection hits, and the
parser suite — the one a card's own fence has redded before (T-274) — is
re-run at the final tip. Every figure above carries the ref it was
measured at, which is the form that stays true.
