---
id: T-185
title: The board cannot say its lane list is incomplete — `DispatchReading` drops `notLanes` and `truncated`, the two fields whose own doc comments forbid dropping them, and a test comment claims the two types are one shape
feature: F-04
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
touches: [app-board, app-dispatch]
suggested_by: architect/integrator seat @ the architecture sitting of 2026-08-31, measured while ruling T-126-s2 — found by checking a claim rather than by reading code
builder: claude-opus-5@subagent
review:
---

**FOUND BY CHECKING A CLAIM THAT TURNED OUT TO BE FALSE, WHICH IS THE
ONLY REASON IT WAS FOUND.** The sitting set out to test whether
`T-126-s2`'s third shape had been un-refuted by new test coverage. It had
not. But the measurement walked into this on the way, and this is the
larger finding.

## Two types for one fact, in two files, and nothing makes them agree

`app/src/lib/dispatch-store.ts:267` — what `hydrateJoin` **produces**:

    | { kind: "joined";
        rows: ReadonlyMap<string, DispatchRow>;
        notLanes: readonly WorktreeEntry[];
        truncated: boolean }
    | { kind: "unavailable"; because: LaneScanRefusal; sentence: string }

`app/src/lib/board-model.ts:660` — what the board **renders from**:

    | { kind: "joined"; rows: ReadonlyMap<string, DispatchStamp> }
    | { kind: "unavailable"; sentence: string }

**Three differences, and two of them are dropped facts:**

1. `rows` is keyed to `DispatchRow` on one side and `DispatchStamp` on
   the other.
2. **`notLanes` does not survive.** Its own doc comment at the producer
   reads *"Worktrees that are not lanes: reported, never dropped."* It is
   dropped.
3. **`truncated` does not survive.** Its own doc comment reads *"The
   reader hit its entry ceiling: the answer is a floor."* The board
   renders that floor as though it were the whole.

**`board-model.ts` does not import `dispatch-store.ts` at all** — it
imports `@nputer/parser/pure` and `./verdicts` and nothing else. So the
two shapes are structurally unrelated and no compiler, on any edit, can
notice them diverging further.

## The measurement: both fields are produced and read by NOTHING

- `notLanes` occurs **three times in the whole of `app/src`**, all of
  them inside `dispatch-store.ts`: two type declarations and one
  assignment in `hydrateJoin`. There is no consumer.
- The dispatch scan's `truncated` likewise has no consumer. Every other
  `truncated` in `app/src` is a **different fact** — `shell.docs.truncated`
  is the docs tree, and `truncatedSymbols` / `truncatedFiles` belong to
  the architecture graph.

`hydrateJoin` carefully carries both fields across the wire and hands
them to a boundary that has nowhere to put them.

## WHY THIS IS NOT A MATTER OF TASTE: the project already ruled the case

`app/src/App.tsx:660` renders a visible note when the DOCS tree is
truncated — *"docs truncated · showing first N files"* — carrying T-018's
"quiet truncation note" comment. **So this repository has already decided
that a truncated read must say so on screen.** The dispatch scan's
truncation gets no note, and could not have one, because the type it
reaches has no field for it.

The user-visible consequence is exact: **the board cannot tell @human
that its lane list is a floor rather than a count**, and cannot report a
worktree that is not a lane. Both silences are invisible from inside the
board, which is the property that makes this worth a card rather than a
comment.

## And a false claim in a test, which is how the drift is currently hidden

`app/test/select-board.test.ts:867` reads:

    /** A `DispatchReading` from rows, in the shape `hydrateJoin` produces. */

It is **false**, and provably so: the fixture beneath it builds
`{kind:"joined", rows}` with neither `notLanes` nor `truncated`, and
`DispatchJoin` requires both. Were the two types one shape, that fixture
would not compile. **The claim lives in prose, so the compiler cannot
reach it** — the same failure family as `T-033-s11`'s two engines
disagreeing about one registry, arriving here as one comment asserting an
equivalence between two types that were never connected.

`app/test/detail-assignment.test.tsx:150` builds the same degenerate
`NO_LANES` value, so **no test in the repository has ever constructed a
reading with a populated `notLanes` or with `truncated: true`.**

## What a fix decides

1. **Whether the loss is intentional.** It may be: the board may have no
   business rendering non-lane worktrees. **If so, say it at the site and
   delete the fields at the producer** — a field produced for no reader,
   with a comment forbidding its being dropped, is worse than either
   honest alternative. If it is not intentional, `DispatchReading` grows
   the two fields and the board gains its note.
2. **Whether the two types should be ONE.** `T-057`'s rule points that
   way, but they sit on opposite sides of a real boundary and the row
   types genuinely differ. An adapter that is *named* as the lossy step
   is the third option and probably the right one.
3. **The comment goes either way.** Whatever is decided, a prose claim of
   type equivalence must not be what holds it — that is the defect this
   card is partly about.

## Acceptance criteria

- THE `notLanes` and `truncated` facts SHALL either reach a consumer or
  be removed at the producer, and whichever is chosen SHALL carry its
  reason at the site.
- WHERE the lane scan is a floor rather than a count, the board SHALL say
  so, consistent with the docs tree's existing truncation note — or the
  card SHALL state why the two cases differ.
- NO comment SHALL assert that two types are one shape; if an equivalence
  is load-bearing, a body SHALL hold it by CONSTRUCTING one from the
  other rather than by describing it.
- A body SHALL construct a reading with a populated `notLanes` and one
  with `truncated: true` — **neither has ever existed in this suite**, and
  a positive control SHALL prove each body reds without the fix.
- Verification: headless, the app suite.

## Read beside

## NOTE FROM `T-112-s4`'s LANE, 2026-08-31 — the fourth criterion has no file it may be written in

`T-112-s4` held `board-model.ts` and `select-board.test.ts` — two of this
card's named files — and **did not touch either**, so nothing here is
stale on account of that lane. What it changed is the diagnosis.

**A body that constructs a `hydrateJoin` reading and holds it against the
board's `DispatchReading` has to import BOTH `dispatch-store.ts` (C-15)
and `board-model.ts` (C-17). No test file in this repository may do that
today**: C-15 declares no `app/test/**` path at all, and no other
component's test file declares C-15 either, so the import would be the
undeclared component edge `arch drift` caught at T-169. Filed as `T-190`.
This card's `touches: [app-board, app-dispatch]` does not by itself solve
it, because a slug expands to the registry as it stood at dispatch — so
either take `T-190` as a `blocked_by`, or have the dispatch name the test
file in `touches:` directly. The mechanism is written out in
`C-18-board-root.md` and in `T-112-s6`.

**AND THE STRUCTURAL CAUSE IS THE SAME ONE.** This card asks how two
shapes for one fact drift apart unnoticed. The answer is not only that
`board-model.ts` does not import `dispatch-store.ts` — it is that
**nothing does**, so neither a compiler nor a suite is positioned to
notice. That is C-15's missing test path again, and it is why the
criterion demanding the equivalence be held BY CONSTRUCTION is the right
criterion and is currently unbuildable.

## Read beside

`T-126-s2` (where the join runs — this card is inside the boundary that
ruling names), `T-112-s4` (the registry gap that leaves this whole seam
without a test path), and `T-033-s11` (two implementations of one fact,
measured).

## THE PRODUCER CHAIN IS THREE LAYERS DEEP AND EVERY ONE OF THEM PRESERVES BOTH FACTS ON PURPOSE

Added at the same sitting, after following the fields back to their
source. **This is not a TypeScript-side oversight; it is a complete,
argued producer chain whose last boundary discards the result.**

- **`lanes.rs`** sets `truncated` in two places — on a read error and on
  the entry ceiling — and its doc comment says a repository that exceeds
  the ceiling *"gets a FLOOR with `truncated: true`."* That file also
  carries an **argued rejection of the obvious repair**: truncating as the
  collection is built is called *"the WRONG one"*, because truncating
  before the sort *"returns whichever entries the filesystem happened to
  hand back first, which trades a deterministic answer for a smaller
  `Vec`."* The flag exists so a bounded answer can still be an HONEST one.
- **`join.rs`** partitions the scan and its `LaneRegistration::of` comment
  reads: *"`None` for every entry that is not a lane — those are **carried
  whole** in `DispatchJoin::Joined::not_lanes` rather than dropped."*
- **`hydrateJoin`** carries both across the wire verbatim.
- **`DispatchReading` has nowhere to put either**, and the board renders
  from that.

**So a design decision argued at length in Rust — that a truncated answer
must announce itself rather than silently shrink — is undone at the
TypeScript boundary by a type with two fewer fields.** Three sites say
"never dropped" and "the answer is a floor"; the fourth drops them.

That is the strongest available argument that the loss is UNINTENDED, and
it narrows this card's first decision considerably: deleting the fields
at the producer would mean deleting `lanes.rs`'s determinism argument
too, which is almost certainly wrong. **The likely correct answer is that
`DispatchReading` grows both fields and the board gains its note** — but
the lane should still make the case rather than inherit this one.

## Implementation notes (executor, 2026-08-31, lane `task/T-185-dispatch-reading-fields`)

Base `209e5d3`. Implementation commit `e18f3eb`; every figure below is
measured at that ref unless it names another.

### The case the card asked the lane to make, made

**`DispatchReading` GROWS both fields, and they are REQUIRED.** The
producer chain's three layers all argue for these facts and the fourth
boundary discarded them; deleting them at the producer would delete
`lanes.rs`'s determinism argument with them, so the loss was repaired
rather than ratified. The reason is written at the site, in the type's
own doc comment, and again at the producer in `dispatch-store.ts`.

**REQUIRED rather than optional is the whole repair, and it is the one
design decision this card actually turns on.** An optional `truncated`
reads as `false` at every site that omits it — the silent floor this card
is about, wearing a type annotation. That choice is what makes the
out-of-fence finding below unavoidable, and it was taken knowingly.

### What consumes them, and the asymmetry that is the interesting half

`selectDispositions` is the one consumer and it re-decides nothing:

- `truncated` -> `DispositionModel.scanIsFloor`. Every claim about there
  being ROOM is qualified: the `dispatchable` reason gains a `FLOOR:`
  clause, and the headline gains `THE LANE LIST IS A FLOOR, NOT A COUNT`.
- **`at-ceiling` is deliberately NOT qualified.** A floor can only be an
  undercount, so lanes the reader missed can only reinforce a cap that is
  already reached. Hedging it would be a false hedge, and a body forbids
  one (mutant M5).
- `notLanes` -> `DispositionModel.notLanes`, named entry by entry in the
  headline. It invalidates nothing: a worktree that is not a lane holds
  no fence and counts against no ceiling, and a body pins that too
  (mutant M2).

**The on-screen note (criterion 2).** `BriefPanel`'s `copyable` arm gains
`floor: string | null` and `TaskDetailPanel` renders it as
`detail-brief-floor`, muted and factual, in `App.tsx`'s own
`docs-truncation-note` idiom. It rides on `copyable` alone because that
is the arm that invites an ACT — `withheld` and `unavailable` already
refuse, and a floor cannot make a refusal wrong.

### The criteria

1. **MET.** Both facts reach a consumer; the reason is at the site in
   three places (`board-model.ts`'s `DispatchReading`, its `NotLaneHold`,
   and `dispatch-store.ts`'s two field comments).
2. **MET.** `detail-brief-floor` renders beside the copyable brief and is
   ABSENT — not empty — when the scan was a count. Two bodies, one each
   way (M7 and M11).
3. **HALF MET, HALF ROUTED as `T-185-s1`.** The false comment is gone and
   what replaced it states the LIMIT rather than a louder claim. Holding
   the equivalence BY CONSTRUCTION needs one body importing both C-15 and
   C-17, which is a cross-component edge whose registry line and drift
   fixture this fence does not reach. Not built, routed, named.
4. **MET.** Five bodies in `select-board.test.ts`, one in
   `select-task-detail.test.ts`, two in `detail-assignment.test.tsx` —
   the first constructions of a populated `notLanes` and of
   `truncated: true` on the BOARD side (`T-198` built the producer side).
   Every one has a positive control and a mutant it uniquely kills.
5. **MET, with one out-of-fence red.** See below.

### The drill ledger — twelve mutants, one side only, sha256-restored

Drilled at `e18f3eb` in this worktree, each mutation in `app/src` (never
in a test body), read back with `git diff --unified=0` before the suite
ran, restored with `git restore --source=e18f3eb --staged --worktree`,
and proven by sha256 against the pre-drill hash. **All twelve restored:
`restored=true` for every row.** No cargo is involved, so arm (c)'s
compile-time-path hazard is absent by construction — the same shape
`T-198` used on this seam.

**READ THE DELTA, NOT THE ABSOLUTE.** The suite's standing baseline in
this lane is `2 failed | 1111 passed (1113)`, and those two are the
out-of-fence file below. `failed` is the raw reading; `delta` subtracts
the standing two.

| mutant, one side only | failed | delta | the body it kills |
|---|---|---|---|
| M9 `notLanes.length === 0` -> `true` | **1** | 1 | a populated `notLanes` REACHES the board and is named |
| M2 ceiling counts `notLanes` | 3 | 1 | a not-a-lane worktree holds no fence |
| M10 `floorLine` fires always | 3 | 1 | `truncated: true` makes the lane list a FLOOR |
| M4 `floorCaveat = ""` | 3 | 1 | a card cleared against a FLOOR is told so |
| M5 `at-ceiling` hedged too | 3 | 1 | AT-CEILING takes no floor caveat |
| M12 the note EDITS the brief | 3 | 1 | a copyable brief off a TRUNCATED scan |
| M7 rendered note deleted | 3 | 1 | puts the FLOOR note on screen |
| M11 rendered note always fires | 3 | 1 | and shows NO floor note when it is a count |
| M1 `notLanes: []` in the return | 4 | 2 | the two `notLanes` bodies |
| M3 `floorLine = ""` | 4 | 2 | the FLOOR headline body + the at-ceiling body |
| M6 `floor: null` in the panel | 4 | 2 | the panel-model body + the DOM body |
| M8 CANONICAL `scanIsFloor = false` | 7 | 5 | every floor body in the card |

**EVERY ONE OF THE EIGHT NEW BODIES HAS A MUTANT IT KILLS ALONE** (the
first eight rows), which is poison shape SIX's own remedy: a count of one
IS the non-duplication, measured rather than argued. M9's absolute of
**1** is not a typo and is worth reading — its mutation stops
`notLanes.length` from being evaluated at all, which incidentally
confirms that the two standing failures are exactly that expression.

### Gates, derived at `e18f3eb` over 7 paths, and re-derived at the tip

The RANGE RULE's executor form: `git merge-tree --write-tree main HEAD`
exited **0** at tree `4e093bf`, and `git diff --name-only main 4e093bf`
returned **7** paths, all under `app/`. The notes commit adds three under
`docs/tasks/`, so the gate set is derived against the tree the tip WILL
have and the DOCS GATE reading below is taken there.

| gate | trigger | verdict |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx` outside `docs/` | **FIRES.** `index --check` **exit 1 STALE** — a real red, not the `--root` false one: it prints both counts and a `~` diff. `files +0 -0 ~7`, symbols 2453 -> 2455, edges +3 -1, bytes 1152374 -> 1153257. **The regen is the integrator's** (T-009-s1). |
| BOOT GATE | `app/src/**` | **FIRES by the letter, NOT RUN — said loudly rather than skipped in silence.** See below. |
| DOCS GATE | a path under `docs/` a code suite reads | **FIRES at the tip** (three files under `docs/tasks/`). Reading in the report. |
| METHOD EVAL | `method/**` | **NOT OWED** — zero `method/` paths in the forecast. |

**THE GRAPH DELTA CARRIES NO CROSS-COMPONENT EDGE, and that is the fact
the integrator wants rather than the byte count.** All three added edges
are internal: two `type_ref`s inside `board-model.ts`
(`DispatchReading -> NotLaneHold`, `DispositionModel -> NotLaneHold`) and
one re-emitted `select-board.test.ts -> board-model.ts` import whose only
change is `NotLaneHold` joining its symbol list. **`files` stays 200**,
so `files +0 -0` still holds and no fixture reconciliation is forecast.
Derive it against the REGENERATED graph before running the suite rather
than off a failure — that instruction is `C-15-dispatch.md`'s own and it
applies here unchanged.

**BOOT GATE, not run, with the reason.** Its trigger matches
(`app/src/**`), and running it means a cold `tauri dev` — a full Tauri
cargo build in a worktree with no `target/`, beside a live app on 1420.
The lane's diff is pure webview TypeScript: no manifest, no Rust, no
`app/src-tauri/**` path in the forecast, so the T-040 regression class
this gate exists for is not reachable by it. **That is an argument, not a
measurement, and it does not discharge the gate** — it is recorded here
so the integrator runs it rather than inherits a silence.

### THE ONE THING THIS LANE COULD NOT DO, AND IT IS A FENCE DEFECT

`app/test/board-truth.test.tsx` is **C-05's** (`app-shell`) and this
card's fence is `[app-board, app-dispatch]`. Its line 873 builds a
`DispatchReading` as a bare structural literal — deliberately, its own
header explains why — and a REQUIRED field addition therefore reds it:

- `tsc -p tsconfig.test.json` **exit 2**: two `TS2322`s at lines 906 and
  942, both *"missing … notLanes, truncated"*, **and nothing else in the
  program**. Every in-fence file typechecks.
- `npm test` **exit 1**: `2 failed | 1111 passed (1113)`,
  `1 failed | 49 passed (50)` files. Both failures are that file's two
  `T-112-s1` threading bodies, both a `TypeError` on `.length` of
  `undefined`. **1105 + the 8 new bodies = 1113**, so nothing was lost.

**One constant, four symptoms, and the repair is two tokens** — written
out verbatim on `T-185-s2`, which routes the finding with its
measurement. The lane did not apply it: `roles/executor.md` and
`lane-protocol.md` rule 5 both forbid widening a fence from inside it,
and `tasks/TASK-FORMAT.md` rules that a card whose criteria and fence
disagree is a defective card rather than a hard call for the lane.

**THE ALTERNATIVE WAS AVAILABLE AND WAS REFUSED ON THE CARD'S OWN
ARGUMENT.** Optional fields keep that fixture green untouched, and they
reintroduce exactly the defect this card names. The lane took the honest
type and routed the fence, following the shape `T-198` used one card ago
when it handed off `index --check` STALE by construction and named what
the integrator owed.

### For the verifier

- The asymmetry (M5) is the claim most worth attacking: is `at-ceiling`
  really sound under a floor? The argument is that a floor is an
  undercount and `>=` is monotone in `inFlight.length`.
- `NotLaneHold` carries `kind` and `name` only, because those are the
  two fields ALL FOUR arms of C-15's `WorktreeEntry` share. A wider
  mirror would not be structurally satisfied by `UnreadableEntry`.
- The two standing red bodies are `T-185-s2`'s, not this card's, and the
  proof is that they are in one out-of-fence file and that the tsc
  program is otherwise clean.

### Routed, never silently omitted

- **`T-185-s1`** — criterion 3's by-construction half; needs C-15's
  `depends_on:` and C-12's `architecture-dogfood.test.ts`.
- **`T-185-s2`** — the fence defect above, with both gate readings.

### The suites the DOCS GATE named, run

`node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only main 0f4e21e)`
— **exit 1, FIRES**, 3 paths under `docs/`, owing three suites. Its
FIRST invocation exited 1 with `ERR_MODULE_NOT_FOUND: yaml` on a fresh
worktree, which is that gate's ONE named hole — *"READ THE MESSAGE, NOT
THE CODE"*: exit 1 there means COULD NOT RUN, not "has a verdict". It was
re-run after `npm ci` in tools/e2e and the reading below is that run's.

| suite the gate named | reading |
|---|---|
| `npx vitest run` from lib/parser/ | **exit 0**, 344 passed (16 files) |
| `npm test` from app/ | **exit 1**, 2 failed \| 1111 passed (1113) — both in `board-truth.test.tsx`, see above |
| `npm test` from tools/e2e/ | **exit 1**, 1 failed \| 400 passed — `dispatch-order.spec.ts`, and it is NOT this lane's |

Also run and green, none of them owed by a trigger this diff matches:
`npm run lint:tokens` **exit 0** (TOKEN 165 files, CONTROL 1058),
`npm run capabilities:check` **exit 0 CURRENT**, `npm run typecheck` from
tools/e2e **exit 0**, `npx tsc --noEmit` from lib/parser **exit 0**,
`arch cycles` **exit 0 ACYCLIC** (15 components, 43 declared edges —
unmoved, this lane edits no registry file).

### THE E2E RED IS `T-197`'s AND HERE IS THE PROOF RATHER THAN THE CLAIM

`tools/e2e/tests/dispatch-order.spec.ts:200` fails at
`expect(run.stdout).toContain("critical path:")`, and its captured stdout
ends MID-TOKEN at `T`. Measured at `cca2002`:

    node tools/e2e/scripts/brief.mjs --dispatch > file    exit 0, 69289 bytes
      contains "critical path:"  1     contains "worst blocker:"  1
    node tools/e2e/scripts/brief.mjs --dispatch | cat > file   65536 bytes
      contains "critical path:"  0     contains "worst blocker:"  0

**65536 is 64 KiB exactly**, and the piped file ends on the same
mid-token `T` the spec's capture shows. The tool's own output carries
both asserted strings; the PIPE destroys them. That is `T-197` by name.

**AND IT DOES NOT DEPEND ON THIS LANE'S CARDS.** Measured against a
DETACHED scratch checkout of this lane's own base `209e5d3`, driven
through `brief.mjs --root`, so the base tree is read with no file of this
lane's in it:

    base tree 209e5d3   69280 bytes, exit 0, both strings present
    this tip  cca2002   69289 bytes
    delta                   +9 bytes
    base overage over the 64 KiB cap   +3744 bytes

**The base was already 3,744 bytes past the cliff and this lane moved it
by 9** — 0.24% of an overage that predates the lane entirely. The two
routed cards are `status: suggested` and are not in the dispatch order at
all, so they contribute nothing to that stream. The scratch checkout was
detached, stemmed from this card's id, and removed after the reading.

This lane's forecast contains **zero** paths under `tools/`, which is
`T-197`'s fence. Reported, not chased.

### The class sweep criterion 3 implies

**CLASS: a prose comment asserting that two types are one shape.** One
search, over `app/src`, `app/test` and `lib/parser/src`, for a claim
about the shape `hydrateJoin`/`DispatchJoin` produces. **ONE live
instance, and it is the one this card names** — at the tip the only hit
is this lane's own retraction quoting the old text.

**The sweep is shown capable of finding something before its zero is
written down**: the identical query at the base ref `209e5d3` returns
`select-board.test.ts:868`, the original false claim. The four surviving
`Structurally satisfied by` comments are the HONEST form — they assert a
direction of assignability, not an equality, and `DispatchReading` <-
`DispatchJoin` still holds and is now TIGHTER by two fields.
