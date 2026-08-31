---
id: T-198
title: The pin that makes `dispatch-store.ts` reachable needs FOUR tokens in `touches:` — `T-190` priced the wall and could not cross it from a one-slug fence, and this is the card the F-04 seam actually waits on
feature: F-04
milestone: 4
priority: 1
size: S
status: done
blocked_by: []
touches: [app-dispatch, docs/architecture/components/C-15-dispatch.md, app/test/dispatch-store.test.ts, app/test/architecture-dogfood.test.ts]
suggested_by: "T-190's executor, which met criterion 2's fence wall, measured what it costs, and derived the exact token list this card carries"
builder:
review: independent
---

**`T-190` PRICED THIS WALL RATHER THAN GUESSING AT IT, AND THIS CARD IS
WHAT IT BOUGHT.** That lane could not build its own criterion 2 — a pin
driving `hydrateJoin` — from inside `[app-dispatch]`, and it established
why by measurement rather than by assertion:

- `hydrateJoin` exists at `app/src/lib/dispatch-store.ts:298`.
- **No location an `[app-dispatch]` fence reaches is collected by any
  runner**: `app/vitest.config.ts` collects `test/**` relative to `app/`.
- So the pin's test file must live at `app/test/…`, which the fence does
  not carry — and adding the registry `paths:` line **reds exactly one
  body**, in a file outside that fence.

`TASK-FORMAT` calls a card whose criterion and fence disagree **defective
by definition** and prescribes record-and-route. `T-190` recorded, priced
and routed; this is the route.

## The four tokens, and why each is load-bearing

    touches: [app-dispatch,
              docs/architecture/components/C-15-dispatch.md,
              app/test/dispatch-store.test.ts,
              app/test/architecture-dogfood.test.ts]

- **`app-dispatch`** — the module being made reachable.
- **the C-15 registry file** — where the `paths:` line is declared.
- **`app/test/dispatch-store.test.ts`** — the pin itself, which must be
  named EXPLICITLY: a fence expands to the registry **as it stood at
  dispatch**, so declaring the path does not grant the right to write the
  file it names. `T-112-s4` proved that shape the hard way and
  `T-112-s6` carries it.
- **`app/test/architecture-dogfood.test.ts`** — the one body the new
  registry line reds. Its owner is **C-12 (`app-map`)**, not C-05;
  `T-190` got that wrong from memory first, measured it, and corrected
  itself in both the file and its notes.

**A lane cut without all four cannot finish**, which is the whole reason
this card states them rather than leaving the next executor to discover
it. `T-112-s6` may be one token short for the same reason — flagged by
`T-190`, not measured.

## Why this is priority 1

`T-126-s2`'s ruling is that the join goes to TypeScript **behind a test
path**, and `T-190` established that the unreachable half is C-15's. So
this card is the last thing between a ruled architecture decision and a
lane that can execute it. **`T-126-s2`'s `blocked_by` names this card.**

## Acceptance criteria

- `app/src/lib/dispatch-store.ts` SHALL be reachable from a body a runner
  collects, and `hydrateJoin` SHALL be driven by that body rather than
  merely imported.
- **A one-side-only mutant of `hydrateJoin` SHALL be killed by the new
  body**, proving reachability behaviourally rather than structurally —
  `T-110` measured four producer mutants surviving at exit 0 on this
  side, and structural reachability is what it already had.
- THE registry line SHALL be declared, and the body it reds SHALL be
  reconciled in the same lane — its count moves by construction, not by
  accident.
- WHERE the pin makes `T-185` or `T-195` cheaper to close, the card SHALL
  say so; neither is in scope here.
- Verification: headless, the app suite plus `architecture-dogfood`.

## Read beside

`T-190` (which priced the wall — read its notes first), `T-112-s6` (the
same fence-expansion trap, one component over), `T-126-s2` (the ruling
this unblocks), and `T-110` (why structural reachability is not enough).

## Implementation notes (executor, lane `task/T-198-the-pin-that-makes-dispatch-store-reachable`)

**THE LANE'S BASE IS `146ebb6`, NOT THE BRIEF'S `f736677`.** Named up
front by the dispatching seat and filed as `T-187`; `.nputer/BRIEF.md`
row 4 derives `base commit:
f7366770bd12d4b30191632c123edb83020cf1bd` as the newest `Checkpoint:`
commit while this worktree sits at
`146ebb61f73ca56b30379e28a98ee1b85ecb4f90`. **Every other derived row
matched the tree**, including the five-path fence expansion, the three
live lanes and the slug map. Every figure below is re-derived at
`146ebb6` and none is transcribed from the brief or from `T-190`.

**WHAT CHANGED: three files, one of them new.**

- **`app/test/dispatch-store.test.ts` — NEW.** C-15's first collected
  body: five bodies over `hydrateJoin`.
- **`docs/architecture/components/C-15-dispatch.md`** — the `paths:`
  line (2 → 3 entries), two corrections to prose that this lane
  measured false, and a `T-198` section carrying the drill table.
- **`app/test/architecture-dogfood.test.ts`** — the one body the
  registry line reds, reconciled. **C-12's file (`app-map`)**, which is
  why the card names it explicitly.

### Criterion by criterion

**1. "`dispatch-store.ts` SHALL be reachable from a body a runner
collects, and `hydrateJoin` SHALL be driven by that body rather than
merely imported." MET, and the second clause is the one that cost
something.**

Reachability, re-derived at this ref with `T-190`'s four forms over
`app/src` and `app/test`:

    from "…dispatch-store"             1 file   app/test/dispatch-store.test.ts
    bare side-effect import            0
    require("…dispatch-store")         0
    dynamic import("…dispatch-store")  0

The three zeros are correct rather than a miss — the pin imports
statically. **POSITIVE CONTROL (shape TEN):** the identical pattern
returns **12 files for `board-model`** and **12 for `task-detail`**, so
the search works; and at the base commit `146ebb6` the same search
returns **0 for `dispatch-store`**, which is the flip this card exists
to produce. Collection is not inferred from the config: vitest reports
`✓ test/dispatch-store.test.ts (5 tests)` by name.

**2. "A one-side-only mutant of `hydrateJoin` SHALL be killed by the new
body." MET — seven drills, table under criterion 3's drill section
below.** The canonical mutant is the exact one `T-190`'s blind verifier
proved survives: delete `rows.set(row.taskId, row)` so the Map is always
empty. It reded the app suite at **exit 1, `1 failed | 49 passed (50)`,
`2 failed | 1103 passed (1105)`**.

**3. "THE registry line SHALL be declared, and the body it reds SHALL be
reconciled in the same lane — its count moves by construction, not by
accident." MET, and "by construction" was taken literally.**

The new fixture value was derived from a **throwaway probe `it()`** run
against the live model inside this lane's own file, with the registry
line already in place and the file already written, and **removed before
the commit** — the T-088 technique the dogfood file itself prescribes.
It printed, and these are the values the fixture was written from:

    registry paths        3 entries (the one that moves)
    c15.files             6  — UNCHANGED
    fileComponent C-15    6  — UNCHANGED
    fileComponent.size  199  — UNCHANGED
    c15 findings, derived.issues, project.issues, graph issues   all []

**AND THAT CORRECTS `C-15-dispatch.md`'s OWN FORECAST, WHICH IS THE
FINDING THIS CRITERION TURNED UP.** That file predicted a lane which
also WRITES the file moves `c15?.files`, the `fileComponent` tally and
the tree-wide count *with* the `paths:` array. **It does not.**
`architecture-dogfood.test.ts`'s `liveModel()` parses the registry LIVE
but reads the graph from the **committed** `docs/architecture/graph.json`,
which a lane does not regenerate (T-009-s1). So exactly ONE assertion
moves in-lane. `T-190`'s blind verifier reached the same result
independently (its non-blocking observation 2), so this is two
measurements against one forecast; the forecast's direction is right and
only its timing is wrong, which is the dangerous shape — a lane
budgeting for four reds and meeting one goes looking for three that were
never coming. Corrected in place, with the forecast kept rather than
deleted.

**Reconciliation proved rather than asserted (drill 7):** reverting the
`paths:` line ONE SIDE ONLY reds `app/test/architecture-dogfood.test.ts
> dogfood: the nputer repo through its own derivation engine > C-15 HAS
TERRITORY AT LAST: five files under its declared globs, D3 cleared` —
**failing-body count 1**, exit 1. So the fixture edit is load-bearing
and is not a cosmetic follow-on.

**4. "WHERE the pin makes `T-185` or `T-195` cheaper to close, the card
SHALL say so." MET, and the two answers differ — measured, not
inherited.**

- **`T-185` — MEASURABLY CHEAPER, and its fourth criterion is now half
  discharged.** That criterion says a body constructing a reading with a
  populated `notLanes` and one with `truncated: true` **has never existed
  in this suite**. Both exist now, and neither is decorative: mutants 4
  and 5 (`notLanes: []`, `truncated: false`) each red exactly one body.
  What remains `T-185`'s is the half no lane may take on its own —
  holding that reading against the board's `DispatchReading` BY
  CONSTRUCTION needs an import of `board-model.ts` (C-17), a
  cross-component edge C-15 does not declare and an unruled architecture
  decision. **The file that import belongs in now exists and is
  declared**, which is precisely what `T-185`'s own note said was
  missing.
- **`T-195` — CHEAPER ONLY AT THE EDGES, and `C-15-dispatch.md`'s
  earlier paragraph is right.** Mutant 6 pins that the reason-bearing
  field cannot be DROPPED in transit, swept over all four
  `LaneScanRefusal` arms. **That is not `T-195`**: its exposure is the
  sentence's post-em-dash WORDING, authored in `lanes.rs` and rendered
  by `task-detail.ts`, neither reachable from here. `T-195`'s lane
  should still take the presentation side, as its own first decision
  says. What it gains is that the wire half is no longer unpinnable.

**5. "Verification: headless, the app suite plus `architecture-dogfood`."
MET.** No app was launched, no port bound, no screen read, and no
`tauri dev`. Port 1420 was read ONCE with the one permitted command —
`lsof -nP -iTCP:1420 -sTCP:LISTEN`, exit 1, **nothing is listening**
(read 2026-08-31T06:44:50Z on Juhos-MacBook-Pro.local; a live fact, so it
carries a time and a host rather than a commit). No port was derived or
bound, because nothing in this card needed one.

### The five bodies, and why each earns its place

Poison shape SIX asks for a mutant a body uniquely kills. **Every body
has one with count exactly ONE.**

| body | its own mutant, count 1 |
|---|---|
| keys every row by its OWN task id | every key maps to the LAST row |
| a DUPLICATE task id: the LAST row wins | first duplicate wins |
| carries `notLanes` WHOLE | `notLanes: []` |
| carries `truncated` | `truncated: false` |
| the refusal arm, all four arms | the `sentence` dropped |

**The first two are the pair worth reading.** They look like neighbours
and are blind to different things: the duplicate-id body cannot see
"every key maps to the last row" (its own expectation IS the last row)
and the ordinary-rows body cannot see "first wins" (its fixture has no
duplicates). **Neither covers the other, in either direction, and that
is measured rather than argued.**

The duplicate-id body pins a claim `hydrateJoin`'s own doc comment makes
and nothing held: *"the last one would win here. That is stated rather
than guarded."* Stated-and-unheld is how a doc comment becomes false.

**The refusal sweep is ONE body over four arms on purpose** — the claim
is that the module is OPAQUE to the refusal, and four near-identical
bodies would be four restatements of one fact (shape SIX). Its corpus is
asserted `toHaveLength(4)` **before** the loop is trusted, which is shape
TEN's one-line remedy applied inside the body.

**An `instanceof Map` assertion was deliberately NOT written.** The
return type already guarantees it, so it would restate the compiler; the
body asserts `.size`, `.get()` and `[...keys()]` instead, which are facts
about what the loop did.

### Drills — seven, all one side only, all restored and hash-proven

Drilled AT A COMMIT (`dde0273`), per T-072-s1. Each mutation was checked
to occur **exactly once** before it was applied (a substitution count is
not the same as the intended text), the mutated text was **read back
through `git -C <worktree> diff`**, the whole app suite was run with the
**exit code captured before any pipe**, then
`git restore --source=HEAD --staged --worktree -- <path>` with **both
sides named**, and the restoration proven by sha256 against
`git show HEAD:<path>` with `git status --porcelain --untracked-files=all`
empty as the companion.

| # | mutant, one side only | target | failing bodies | app suite |
|---|---|---|---|---|
| 1 | delete `rows.set(row.taskId, row)` | `dispatch-store.ts` | **2** | `1 failed \| 49 passed (50)`, `2 failed \| 1103 passed (1105)`, exit 1 |
| 2 | every key maps to the LAST row | `dispatch-store.ts` | **1** | `1 failed \| 49 passed (50)`, `1 failed \| 1104 passed (1105)`, exit 1 |
| 3 | first duplicate wins | `dispatch-store.ts` | **1** | same shape, exit 1 |
| 4 | `notLanes: []` | `dispatch-store.ts` | **1** | same shape, exit 1 |
| 5 | `truncated: false` | `dispatch-store.ts` | **1** | same shape, exit 1 |
| 6 | refusal `sentence` dropped | `dispatch-store.ts` | **1** | same shape, exit 1 |
| 7 | the `paths:` line reverted | `C-15-dispatch.md` | **1** | same shape, exit 1 |

**COUNT 2 ON DRILL 1 IS AN ANSWER TO SHAPE SIX, NOT A MISS.** A count
above one *"names the bodies that already cover you, in the reporter's
own output"* — here the two Map bodies, both named above — and each of
them still has its own count-1 mutant, so neither is a duplicate.

`dispatch-store.ts` restored to
`sha256 3bc8162eb5741d2bf520026131316fd60bb88b4c42b3fa061fa7313e14bed964`
after every one of drills 1–6, and `C-15-dispatch.md` to
`sha256 35d99adcda3bb233ecb08862e3cd7c74bd22d6107d4d319a3f0b9b1173c54636`
after drill 7. **The store's hash is byte-identical to the one `T-190`'s
blind verifier recorded for the same file in a different lane**, which
is a free cross-lane corroboration that no drill left a residue.

**SCOPE OF THE DRILLS, STATED RATHER THAN IMPLIED:** every mutant was run
under the app suite only. They were **not** run under `cargo test`,
`lib/parser`'s vitest or the e2e lane. "Failing-body count N" is a claim
about `npm test` from `app/`.

**NO DRILL TOUCHED AN OUT-OF-FENCE PATH.** `T-190`'s drill 2 wrote a file
outside its fence to measure that the hook permits it; this lane did not
repeat that, because the answer is already recorded and the write is the
thing the fence forbids.

### Gates, derived from this lane's own diff

The diff is `app/test/dispatch-store.test.ts` (new),
`app/test/architecture-dogfood.test.ts`,
`docs/architecture/components/C-15-dispatch.md` and this card.

- **DOCS GATE — FIRES.** `node tools/e2e/scripts/docs-gate.mjs
  docs/architecture/components/C-15-dispatch.md`, run from the
  repository root with a **separate literal path argument**: **exit 1**,
  `FIRES — 1 path(s) under docs/ are code inputs`, naming **four**
  suites. It also reports *"every live task card's frontmatter parses,
  with a legal status"* and *"governing-document budgets hold"*.
  **A FIRST RUN OF THIS GATE EXITED 1 FOR A REASON THAT WAS NOT A
  VERDICT** — `ERR_MODULE_NOT_FOUND: yaml` — because `tools/e2e` had no
  `node_modules` yet. That is the exact hazard the standing rule names:
  an exit code read without its output would have been recorded as a
  gate result. Installed (`npm ci`, exit 0) and re-run.
- **GRAPH REGEN — FIRES, and is the integrator's.** The diff adds a
  `.ts` outside `docs/`. `index --check` is **STALE at exit 1** in the
  lane, by construction: `files +1 -0 ~1`, `edges +9 -0`. **All nine
  added edges land on `app/src/lib/dispatch-store.ts` (C-15's own) or on
  `p:vitest` (a PACKAGE edge, not a component one)**, so no
  cross-component edge is created — derived from the index output, not
  forecast. `arch cycles` **ACYCLIC, exit 0**, 15 components / 43
  declared edges. `arch` **exit 0**, summary byte-identical to base:
  `components=15 files=199 mapped=199 unmapped=0 edges=45 findings=4
  drift_components=4`, with C-15 still `files=6 drift=-` because that
  figure comes from the committed graph.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`
  or either manifest (`app/package.json`, `app/src-tauri/Cargo.toml`).
  This diff touches `app/test/**` and `docs/**` and none of the three.
  **`app/src/lib/dispatch-store.ts` was mutated by six drills and
  restored by hash; it is not in the diff** — checked against
  `git status --porcelain --untracked-files=all`, empty.
- **METHOD EVAL GATE — NOT OWED.** Trigger is `method/**`; zero paths.
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of
  these.

### Suites, with the counts and not only the exits

Measured at this lane's ref. The base column is this worktree at
`146ebb6` before any edit.

    npm test        from app/        BASE  49 files / 1100 tests   exit 0
    npm test        from app/        TIP   50 files / 1105 tests   exit 0
    npm run build   from app/  (tsc x2 + vite)                     exit 0
    npx vitest run  from lib/parser/  16 files / 344 tests         exit 0
    cargo test --no-fail-fast   18 targets, 601 passed / 0 failed / 4 ignored   exit 0
    npm test        from tools/e2e/   1 failed / 366 passed         exit 1

**THE ONE RED IS `T-197` AND IS NOT THIS DIFF — ATTRIBUTED BY MECHANISM,
NOT BY A RE-RUN.**
`tools/e2e/tests/dispatch-order.spec.ts:200 › --dispatch runs on the live
repository, exits 0, and WRITES NOTHING`, failing at line 214 on
`toContain("BLOCKED — the unmet blocker is named")`. Measured at this
lane's ref:

    node scripts/brief.mjs --dispatch > FILE    70092 bytes   exit 0
    node scripts/brief.mjs --dispatch | cat     65536 bytes   exit 0

65,536 is the macOS pipe buffer exactly, and both exit 0 — the defect
`T-197` cards, cause `process.exit()` against Node's asynchronous stdout.
The three strings this spec asserts sit at bytes **66,228**
(`BLOCKED — …`), **68,825** (`critical path:`) and **68,996**
(`worst blocker:`) — **all three past the cut**, which is why the body
reds and why WHICH assertion fails moves between runs (T-190 measured
the first at 65,767 at `57c1b39`; the board has grown since).

**AND THIS DIFF CONTRIBUTES ZERO BYTES TO THAT OUTPUT, WHICH IS THE
AIRTIGHT HALF RATHER THAN AN INHERITED CLAIM.** The dispatch listing
carries frontmatter-derived lines and live worktree facts only, never a
card's body: four distinct phrases from these notes return **0 hits**
each in the full 70,092-byte output, against a positive control
(`STARTABLE NOW`) that returns 1. So nothing this card wrote could have
pushed any assertion past the buffer. `T-190`'s lane separately proved
the same body reds at BASE content; between the two the attribution is
complete and **the red is not charged to this diff**.

**A LIVE-ENVIRONMENT NOTE FOR THE DISPATCHING SEAT, not a defect.** This
lane's WORKTREE (not its diff) coarsely fences four cards in that same
listing — `T-185`, `T-112-s5`, `T-188` and `T-095` — and the tool says so
itself for two of them: *"Both expand through C-15, so this may be the
COARSE fence rather than a real overlap."* `T-095` is fenced only because
this lane holds `app/test/architecture-dogfood.test.ts` through C-12.
All four free up when this worktree is removed.

**`T-190` RECORDED 1094 TESTS AT `57c1b39`; THIS LANE MEASURES 1100 AT
`146ebb6`** — the suite grew by six between the two refs, which is why
the correction clause asks for a re-derivation rather than a transcript.

### Where the brief was wrong

1. **The base commit — disclosed by the dispatcher, confirmed here.**
   Row 4 derives `f7366770…`; the worktree is at `146ebb61f73c`. Filed
   as `T-187`. **Every other derived row matched the tree.**
2. **"A PreToolUse hook enforces the fence" is FALSE in this session's
   shape, and the dispatching seat corrected it before I started.**
   `T-199` carries it: this lane's worktree sits outside the dispatching
   checkout's root, so `lane-fence.mjs` stands aside **unjudged**. **This
   lane's fence was therefore kept as a DISCIPLINE, not by a mechanism** —
   the disclosure `roles/executor.md` requires when a guarantee is really
   a habit. Checked by hand at every commit:
   `git status --porcelain --untracked-files=all` never showed a path
   outside the four the fence and `alwaysWritable: ["docs/tasks"]` allow.
3. **`C-15-dispatch.md`'s reconciliation forecast is wrong about
   timing**, measured above. That is a repository document rather than
   the brief, and it is corrected in this commit rather than routed.

### For the verifier

- **The claim most worth attacking is drill 1.** Re-cut the canonical
  mutant yourself — delete `rows.set(row.taskId, row)` — and check it
  reds. `T-190`'s verifier proved the SAME mutant passes the whole app
  suite and both `tsc` programs at exit 0 with no collected body
  importing the module; if it still passes here, this card did nothing.
- **The second is the import census's ONE.** A one with a dead control
  proves as little as a zero with a dead control. Re-run the positive
  control (`board-model`, `task-detail`) and require 12 each.
- **The third is the count-1 claim for each of the five bodies.** They
  are what says no body here is a shape-SIX duplicate, and rows 2 and 3
  of the drill table are the pair most likely to be wrong if any is.
- **The fourth is my correction to `C-15-dispatch.md`'s forecast.** I
  claim three tallies do NOT move in-lane. Re-derive with your own probe
  rather than trusting either sentence — the file's previous text says
  the opposite and was written by a lane that measured carefully.
- **The GRAPH REGEN list is explicitly NOT warranted complete.** I name
  four assertions that move at the regen; derive them from a throwaway
  probe against the regenerated graph, because the first red hides the
  rest.

## Verdicts

### 2026-08-31 — APPROVED — verifier claude-opus-5@subagent (blind pass)

**PHASE 1 WAS WRITTEN BEFORE THE DIFF WAS OPENED.** The attack set was
composed from the card at its base ref `146ebb6` plus the base tree
alone, saved and hashed **before** `git diff`, the implementation notes,
`.nputer/BRIEF.md` or any lane report was read:
`sha256 b99384cad444adc8c82e21e9b72987190647a1d94f779e21a4e9c157bb7b36f6`,
213 lines, sealed 2026-08-31T06:59:41Z.

**CONTAMINATION: NONE SELF-INFLICTED, AND THE BRIEF WAS CLEAN.** I ran
no `git log` and read no commit message at any point — orientation used
`rev-parse`, `merge-base`, `ls-tree`, `cat-file -e` and
`git show <ref>:<path>` only, none of which carries a subject line. The
dispatching brief carried no T-198 lane fact. **Three disclosures for
the record, none of which is an executor-derived specific about this
diff:** (1) the brief named the standing `brief.mjs` truncation and the
`T-199` fence fact as live conditions — both are in `docs/STATE.md`'s
own standing set, so they reached me from the standing docs rather than
from the lane; (2) my environment's git block listed recent commits from
a **different** worktree (`T-163-s4`), not this lane; (3)
`method/roles/verifier.md` subtracts `docs/ROADMAP.md` from the brief's
reading list, and the role file won — I did not read it.

**PHASE 1's OWN ANSWER TO THE QUESTION THE CARD LIVES OR DIES ON,
recorded before the diff and quoted from the sealed file.** Criterion 2
says "**A** one-side-only mutant … SHALL be killed" — singular. So the
weakest conforming pin is one happy-path body asserting `join.kind`,
which is collected, does drive `hydrateJoin` rather than merely import
it, and satisfies C1 and C2 **to the letter while changing almost
nothing**. I predicted such a pin would leave `notLanes`, `truncated`,
the refusal arm and the duplicate-id case alive at exit 0 — the T-110
repeat. **The lane did not build that pin.** Five bodies were built, and
every mutant I derived from the criteria with the test file closed dies.

### The drills — NINE, all mine, all one side only, zero survivors

Constructed from the base file, not reused from anyone. `dispatch-store.ts`
is byte-identical at base and HEAD (`sha256 3bc8162e…`), so the lane
changed **no production code** and my base-derived mutants apply exactly.
Each was applied alone, **read back with `git -C <worktree> diff`**, run
under the whole app suite with the **exit captured before any pipe**,
then restored with `git restore --source=HEAD --staged --worktree` and
**proven by sha256** against `git show HEAD:<path>`.

| # | mutant, one side only | target | failing bodies |
|---|---|---|---|
| M1 | delete `rows.set(row.taskId, row)` — the canonical gutting | `dispatch-store.ts` | **2** |
| M6 | first duplicate wins | `dispatch-store.ts` | **1** |
| M7 | every key maps to the LAST row | `dispatch-store.ts` | **1** |
| M3 | `notLanes: []` | `dispatch-store.ts` | **1** |
| M4 | `truncated: false` | `dispatch-store.ts` | **1** |
| M5 | refusal `sentence` dropped | `dispatch-store.ts` | **1** |
| M8 | refusal `because` swapped | `dispatch-store.ts` | **1** |
| R1 | the `paths:` line REMOVED | `C-15-dispatch.md` | **1** (dogfood) |
| R2 | a spurious path ADDED | `C-15-dispatch.md` | **1** (dogfood) |

All nine RED at exit 1. `dispatch-store.ts` restored to
`sha256 3bc8162eb5741d2bf520026131316fd60bb88b4c42b3fa061fa7313e14bed964`
after each of M1–M8, and `C-15-dispatch.md` to
`sha256 5a37a12228ac4e74735cc6caab86e270ca7075a5f0b8af87e6aed99bab32c1ab`
after R1–R2.

**M1's COUNT OF 2 IS EXPLAINED AND I MEASURED THE EXPLANATION RATHER
THAN ACCEPTING IT.** Shape SIX wants each body to kill a mutant of its
own. M6 reds the duplicate-id body **alone** and M7 reds the ordinary-rows
body **alone**, so the two bodies M1 hits together are blind to different
things in both directions and neither is a duplicate of the other. The
lane's notes claim exactly this pair; I built both mutants myself and got
count 1 each.

**M8 IS MINE AND WAS A SHAPE-SEVEN PROBE.** The lane pinned the refusal's
`sentence`; I attacked the other half of that arm to look for a mutant no
body kills. It dies at count 1 — the sweep body pins `because` as well.
I found no shape-seven survivor.

**R2 IS MINE AND IS THE ONE CONTROL THE LANE DID NOT RUN — it is the
reason this verdict can call the reconciliation legitimate.** The lane's
drill 7 reverted the `paths:` line, i.e. the REMOVAL direction only. A
removal reds under `toContain` just as it does under `toEqual`, so that
drill alone cannot distinguish a preserved exact matcher from a weakened
one. **R2 ADDS a spurious path and still reds**, which only an exact
`toEqual` does. The worst outcome available in this lane — quietly
widening the only exact-array pin over a live component's `paths:` into a
superset check — provably did not happen: the matcher is untouched and
only the expected VALUE gained a third literal entry.

### Phase 1's other settled question, answered independently

**What a registry `paths:` change breaks, and who owns it.** It breaks
`app/test/architecture-dogfood.test.ts › … › C-15 HAS TERRITORY AT LAST`,
and the owner is **C-12 (`app-map`)** — derived, not taken from prose:
`command grep -n 'architecture-dogfood' docs/architecture/components/*.md`
returns C-12 as the only component carrying it as a **`paths:` entry**
(`C-12-map-pane.md:17`, `touch_slugs: [app-map]`); the C-05 and C-09 hits
are prose sentences. Run against a live control first (15 files match a
token I knew was present), per shape TEN.

**Reconciling it in-lane is LEGITIMATE, not a moving expectation.** The
fixture is a census of DECLARED territory, not a behavioural claim about
C-15's code; when the territory genuinely gains a path, updating the
census is reconciliation. The boundary I set in phase 1 was that the
matcher must survive and the expected side must stay literal rather than
becoming derived from the registry it pins. Both hold, and R2 proves the
first by measurement.

**THE FENCE HELD, JUDGED BY READING THE MANIFEST AGAINST THE DIFF** —
not by assuming anything was blocked, since `T-199` establishes the hook
stands aside unjudged for a sibling worktree. `.nputer/lane-fence.json`
allows five paths plus `alwaysWritable: ["docs/tasks"]`; the diff's four
files all fall inside. **The manifest independently corroborates the
card's core reasoning**: `app-dispatch` expanded to only the TWO paths
C-15 declared *at dispatch*, so the new test path genuinely could not
have been written without its own explicit token.

### Gates, at my own ref `3805079` — counts, not exits alone

    npm test        from app/        50 files / 1105 tests        exit 0
    npm run build   from app/        tsc x2 + vite                exit 0
    npx vitest run  from lib/parser/ 16 files / 344 tests         exit 0
    cargo test --no-fail-fast        18 targets, 601 passed / 0 failed / 4 ignored   exit 0
    npm test        from tools/e2e/  1 failed / 366 passed        exit 1  (T-197)
    index --check                    STALE, by construction       exit 1
    arch cycles                      ACYCLIC, 15 components / 43 edges   exit 0
    capabilities --check             CURRENT (29121 bytes)        exit 0
    docs-gate.mjs (4 separate literal paths, from the repo root)  exit 1 FIRES

The base app suite was 49 files; the tip is 50. **Collection is proven by
the runner's own file count moving, not by the file existing.** The docs
gate named four owed suites and **all four were run**. Its first
invocation from `tools/e2e/` exited **2** — called wrong, because a plain
relative path has two readings — which is the gate refusing to answer a
question it could not read; re-run from the repository root with absolute
literal paths it returned a verdict.

`cargo test` ran in 14s wall **including a cold build** with 0 failures,
so this is not the `T-088-s4` cache cliff; 601/0 matches the count STATE
records post-clean.

**`index --check` STALE IS CORRECT AND IS THE INTEGRATOR'S, NOT A
DEFECT.** It is a REAL stale, not the `--root` false red: the second line
prints both counts and a file diff (`committed 199 files` / `fresh 200`,
`files +1 -0 ~1`, `edges +9 -0`) rather than `committed: MISSING`. **All
nine new edges land on `dispatch-store.ts` (C-15's own) or on `p:vitest`
— zero cross-component edges** — which is why `arch cycles` is still
ACYCLIC, and `arch`'s summary came back exactly as the lane quotes it:
`components=15 files=199 mapped=199 unmapped=0 edges=45 findings=4
drift_components=4`, C-15 at `files=6 drift=-`.

**THE ONE e2e RED IS `T-197` AND IS ATTRIBUTED BY MECHANISM, NOT BY A
RE-RUN.** `tests/dispatch-order.spec.ts:200`. I reproduced the cause at
my own ref: `brief.mjs --dispatch` **redirected** yields 77,568 bytes at
exit 0 and **piped** yields exactly 65,536 — the macOS pipe buffer. The
three strings the body fails on sit at byte offsets **73,704**, **76,301**
and **76,472**, all more than 8 KB past the cut, while the two that pass
sit at 1,313 and 9,561. **This diff contributes zero bytes to that
output**: two distinct phrases from the lane's notes return 0 hits in the
77,568-byte listing against a live positive control (`STARTABLE NOW`, 1
hit). Not charged to this lane.

### Criteria

1. **Reachable and DRIVEN — MET.** Import census at my ref: the specifier
   form returns **1 file** (`app/test/dispatch-store.test.ts`) and the
   other three forms 0 each; at base it returns **0**. Positive controls
   alive: **12 files each** for `board-model` and `task-detail`. Driven,
   not merely imported — proven by M1–M8 rather than by the import.
2. **A one-side-only mutant killed — MET, and far past the letter.**
   Eight mutants of `hydrateJoin`, zero survivors.
3. **Registry line declared and the body it reds reconciled — MET.**
   R1 and R2 prove the reconciled assertion is load-bearing in both
   directions.
4. **Says where it makes `T-185`/`T-195` cheaper, neither in scope — MET.**
   Both the card and `C-15-dispatch.md` carry the distinction, and neither
   card's work was performed here.
5. **Headless — MET.** No app launched, no `tauri dev`, no screen read.
   1420 read once with `lsof -nP -iTCP:1420 -sTCP:LISTEN` only: nothing
   listening. My e2e run bound port **14198, derived from this card id**,
   lsof'd to zero rows immediately before binding.

**SECURITY SWEEP — CLEAN.** No dependency or manifest change in the
range. The pin imports `vitest` and the module under test and nothing
else: no fs, network, `child_process`, `process.env`, `eval` or dynamic
require; its fixtures are in-memory literals with synthetic paths and no
real credential, host or personal data. No new input path, endpoint or
authz surface. (My secret-shaped grep returned three hits which are all
the substring `sk-` inside the word "ta**sk-**detail" — false positives,
recorded rather than quietly dropped.)

**THE LANE'S OWN CORRECTION TO `C-15-dispatch.md` IS RIGHT, AND I
RE-DERIVED IT WITH MY OWN PROBE AS ITS NOTES INVITE.** The file forecast
that `c15?.files`, the `fileComponent` tally and the tree-wide count move
in-lane with the `paths:` array. They do not: reading the **committed**
`docs/architecture/graph.json` directly gives **199 total files**, C-15
matching **6**, and `app/test/dispatch-store.test.ts` **absent from the
committed graph** — so exactly one assertion moves in the lane. The green
app suite is the second, independent confirmation, since the untouched
6-entry `c15?.files` assertion would have red otherwise.

### Non-blocking observations — no correction assigned

1. **The lane's drill figures were measured at `dde0273`; HEAD is
   `3805079`.** Not an error — the notes name their ref — and I re-ran
   every one at HEAD and got identical counts, so the table holds at the
   tip a reader will actually pick up.
2. **The removal-only drill shape is a method gap worth naming**, not a
   defect in this card: where the property under test is a matcher's
   EXACTNESS, a drill must mutate in both directions, because a removal
   reds under `toContain` too. R2 is the missing half and it passes here.
   Described for the dispatching seat rather than filed, since minting a
   card id is not this seat's.
3. **The brief listing has grown from the 70,092 bytes the lane measured
   to 77,568 at my ref** — three sibling lanes are live. It changes no
   conclusion; it is why a figure without its ref goes stale.

**VERDICT: APPROVED.** The card's own hazard — that structural
reachability proves nothing — is the one thing this lane demonstrably
did not do. `status`, `review:` and `verified_by` are stamped on
completion and are left to the integrator; the GRAPH REGEN at merge is
owed and the lane's list of what moves is explicitly not warranted
complete.

### Step 7 — the gates re-run at the tip THIS VERDICT created (`743f35b`)

`method/roles/verifier.md` step 7: appending a verdict is a WRITE, and it
creates a tip nobody has tested. The docs gate names what this card's own
prose owes — **three suites, and correctly not `cargo test`**, since no
cargo reader reads `docs/tasks`:

    npm test        from app/         50 files / 1105 tests   exit 0
    npx vitest run  from lib/parser/  16 files / 344 tests    exit 0
    npm test        from tools/e2e/   1 failed / 366 passed   exit 1  (T-197, unchanged)
    docs-gate.mjs (the card, absolute literal path)  0 frontmatter issue(s);
      "every live task card's frontmatter parses, with a legal status";
      "governing-document budgets hold"              exit 1 (a verdict)

**THE GATE CASE IS CLOSED**: this verdict's prose did not break the
frontmatter it sits under, and the e2e figure is byte-for-byte the one
measured before the commit — same count, same body — so nothing this
verdict wrote moved a suite.

**COLLECTION, DERIVED AT BOTH ENDS RATHER THAN INHERITED.** Files matching
the runner's own `test/**/*.test.{ts,tsx}` include: **49 at base
`146ebb6`, 50 at `743f35b`** (`git ls-tree`), and the runner independently
reports 50 passed files. Two routes, same answer.

**ONE SHAPE-TEN NEAR-MISS IN MY OWN INSTRUMENTATION, DISCLOSED RATHER THAN
DROPPED.** My first wait for the tip e2e run tested for an exit-marker file
that **still existed from the earlier run** — a check that would have
reported a 10:13 result against a 10:16 commit. I caught it on the mtimes
before any figure was recorded, removed the marker and re-waited; the
number above is from the real post-commit run (log stamped 10:21:04). It
is recorded because this brief required shape TEN of every check
**including my own**, and an unrecorded near-miss and an unrun check look
identical to the next reader.
