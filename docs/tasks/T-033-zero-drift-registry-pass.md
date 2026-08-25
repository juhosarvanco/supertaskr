---
id: T-033
title: Zero-drift registry pass — umbrella shared-primitive story + non-code D3 story
feature: F-06
milestone: 4
priority: 17
size: M
status: verifying
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-map, app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-008-s2, T-011-s2, T-024-s5 (the derive-the-pin half; the
written inventory was ratified straight into docs/CONVENTIONS.md at
the 2026-08-16 triage, the T-009-s1 pattern). Triage 2026-08-16: the map's two classes
of PERMANENT amber on this repo, each flagged at birth and deferred
deliberately (T-012 §2: "the structural fix … is exactly open
suggestion T-008-s2 — not this task"). Plan §10 wants the repo at
zero drift before launch — this task is that gate's registry half
(C-07's D3 clears separately at T-010). Decisions at dispatch
(ADR-004 — the registry is the architect's pen; record the picks in
this file's plan section before dispatch):
(1) umbrella story — author a shared-ui component (next free C id at
    authoring time) claiming app/src/lib/utils.ts +
    app/src/components/ui/** with children declaring depends_on it,
    OR declare the existing observed edges and accept the cycles,
    OR keep the amber as the standing drift demo (then this half
    closes as accept-and-record). THE SAME QUESTION IS ASKED TWICE AND
    IS RULED ONCE HERE: C-05->C-13 and C-05->C-14 are both live
    undeclared D1 rows the map draws, both created by C-05's
    `app/test/**` umbrella reaching a child component's module, and
    both were deliberately left undeclared by their integrators on the
    grounds that a `depends_on` edit is a REGISTRY ruling. Declare
    both, declare neither, or write down why umbrella TEST edges do
    not count — one answer applied to both, recorded here before
    dispatch (integrator observation, 2026-08-16);
(2) non-code story — a component-file field (`non_code: true` or the
    existing layer vocabulary) downgrading D3 to informational for
    C-01/C-11, OR accepted permanent amber recorded in their prose;
(3) **the ADR-015 one-implementation question (T-014-s1, folded here
    at the 2026-08-17 triage; its suggestion file is removed in the
    same commit as this line).** T-014 shipped a REALITY-SIDE join in
    Rust (`src/arch/`: file→component mapping, observed component
    edges including the package.path seam, the three relations,
    D1–D5) while ADR-015 assigns "the intent⨝reality⨝tasks
    derivation" to pure TypeScript and
    `docs/architecture/components/C-07-nputer-index.md` says in as
    many words "Emitting graph.json is its entire job (parsing and
    derivation live in TypeScript)". **Both cannot be literally true
    at once.** T-014 resolved it the narrowest way it could rather
    than leave a criterion unbuilt — the crate computes only the
    reality side and REFUSES (exit 3, naming the file) on anything it
    cannot read exactly — but it is still a second implementation of
    a documented one-implementation rule, and only the architect can
    say which way it reconciles. Rule ONE of: **(a)** amend C-07 and
    ADR-015 to say the crate owns the reality-side join and
    TypeScript owns the intent⨝tasks half — matches what
    `--fail-on undeclared|unmapped` already implies (both are reality
    findings), keeps the binary self-contained for the CI/agent path,
    and costs one clause in each document; **(b)** move `arch` to the
    Node CLI (C-02) when it exists — the purest reading of ADR-015
    and of T-014's plan §7, but C-02 does not exist, the engine lives
    inside `app/src/lib/architecture/` rather than in a shareable
    package, and until both are true `nputer arch` cannot exist at
    all, which is what T-014's criterion was written to prevent;
    **(c)** keep both and pin their agreement — which is **T-059**,
    and is worth doing under (a) regardless. NOT available: the crate
    shelling out to Node for the answer — ADR-003's direction is
    Node→binary, and inverting it gives the indexer a Node runtime
    dependency ADR-015 specifically keeps it free of. **T-059 is
    `blocked_by: [T-033]` and dissolves entirely under (b)**, so this
    ruling is worth making before that card is dispatched.

## THE THREE RULINGS — architect, 2026-08-25, at main `dce93b0`

**These were owed BEFORE dispatch and were not made; the card was
dispatched anyway and its lane correctly refused to supply them from
inside a worktree** (ADR-004: the registry is the architect's pen —
`T-033-s1`). The dispatch defect is the architect's. **The fence is also
corrected here**, gaining `app-shell`: criterion 1 requires registry
edits, dogfood fixture deltas and the regen in ONE change, and two of
the three live-registry fixtures are `app/test/**` = C-05. `app-shell`
was held by T-123 at dispatch and is FREE as of its merge `0358c0c`, so
the widening costs no collision.

### (1) UMBRELLA — arm (a), AND THEN DECLARE WHAT REMAINS

**Arm (c) is REFUTED BY MEASUREMENT and is no longer on the table.** The
card offers "write down why umbrella TEST edges do not count"; the lane
measured that it cannot drain either row it was written for —
`C-05->C-13` carries **5 source edges** (`App.tsx`, `GenesisScreen.tsx`)
among 17 and `C-05->C-14` carries **2 Rust source edges** (`churn.rs`,
`lib.rs`) among 8. The premise that both rows are "created by C-05's
`app/test/**` umbrella" is simply false, and it was false when the card
was written.

**AUTHOR THE SHARED-UI COMPONENT (arm (a))** claiming
`app/src/components/ui/**` and `app/src/lib/utils.ts`, at the next free
C id. The mechanism, verified rather than assumed: `components/ui/**` is
claimed today by **C-05**, and C-13 imports `Button` from it in three
modules — so the `C-13 -> C-05` direction is **an artifact of shared
primitives living inside the shell's own paths, not a dependency on the
shell**. Extracting them retires that edge at its cause. It is also
nearly free in declarations, because the children that use the
primitives already declare a dependency on the design layer.

**THEN DECLARE THE EDGES THAT SURVIVE, because they are real.** After
the extraction the remaining undeclared rows are the shell genuinely
depending on its children — `C-05 -> C-13` (it mounts the pane) and
`C-05 -> C-14` (`lib.rs` registers the runner's commands, `churn.rs` is
the shell's own Rust half). A dependency you can point at in source is
declared, not excused. The lane measured the drain arm at **findings
14 -> 3, undeclared 11 -> 0**, and the parser accepts it (264/264).

**WHY NOT ARM (b) ALONE — "declare everything and accept the cycles".**
Declaring `C-13 -> C-05` would write a cycle into the registry to
describe a `Button` import, which teaches every future reader that
cycles are normal here. Extract first, declare second: the cycles that
survive are then the ones that are genuinely real.

**THE POINT OF REACHING ZERO is that the drift signal starts meaning
something.** Eleven permanently-undeclared edges is a warning light
wired to always-on; after this, any undeclared edge is news. That is the
whole argument, and it is why "keep the amber as the standing drift
demo" is refused: a demo that never turns off is not a demo.

**ONE CYCLE SURVIVES, AND @HUMAN RULED IT OUT — THIS REGISTRY HOLDS NO
CYCLES (2026-08-25).** T-123's merge created `C-10 -> C-14` (routing in
`docs_watch.rs` asking C-14's session registry, newly visible because
T-010 made Rust indexed) beside the declared `C-14 -> C-10` — this
repository's first component cycle, and C-10's first D1.

**The architect first ruled "declare it as an argued cycle" and @human
OVERTURNED that. The overturn is right and the reasoning is recorded
because it now governs every future case.** The cycle is not a drawing
artifact: `docs_watch.rs` really does call into `agent/sessions.rs`
today, and `agent/` really does reach back. Declaring it would have
changed one markdown line and left the tangle in the source. It costs
nothing MECHANICALLY right now — both files sit in one crate, so rustc
does not object and no test gets harder — but the cost is future-tense
comprehension, and, decisively, **this project's entire product is
showing people tangles in their own code. A tool that ships a
"cycles are fine here" precedent is arguing against itself**, and a
cycle is cheapest to remove at fifteen components.

**THE STANDING RULE THIS SETS**, applied to both halves of decision (1)
so they stop looking inconsistent: **EXTRACT WHEN THE TANGLE IS AN
ACCIDENT, EXTRACT WHEN IT IS REAL — THE REGISTRY HOLDS NO CYCLES.** The
`Button` case and the session-registry case get the same answer by the
same rule, which is Martin's Acyclic Dependencies Principle and its two
sanctioned remedies (invert the dependency, or extract a component both
sides depend on).

**AND OWNERSHIP IS NOT DEPENDENCY DIRECTION**, which is what makes the
extraction cheap rather than a betrayal of T-029: giving C-14 sole
ownership of "an interview was registered for this folder" bought ONE
READER of that fact (T-057's rule), and that property survives the fact
moving to its own component. One reader is preserved; the arrow stops
pointing both ways.

**THE WORK IS `T-125`, NOT THIS CARD.** T-033 SHALL declare no cycle and
SHALL NOT perform the extraction; it records `C-10 -> C-14` as the one
row that does not drain here and names T-125 as its owner. **Zero drift
is therefore reached in two commits rather than one**, and this card's
own criterion is met by having every remaining undeclared edge either
declared or owned by a named card.

### (2) NON-CODE — add the field, opt-in, argued per component

**`non_code: true` on the component file, downgrading D3 to
informational for `C-01` (method/, markdown) and `C-11` (styles and
assets).** Neither has a file the indexer walks, and that is a
PROPERTY OF WHAT THEY ARE rather than a state they will grow out of.
The field is additive, so every existing component file parses
unchanged (criterion 3's own condition).

**IT MUST BE OPT-IN AND NEVER INFERRED, and `C-15` is the reason.**
A component with no indexed files is not automatically non-code:
`C-15-dispatch` has none either, and its D3 is **honest not-yet-built
amber that must survive this change**. Inferring the field from an
empty file list would silently convert "nobody has built this" into
"nothing will ever be built here", which is the one thing the intent
layer exists to distinguish. Each `non_code: true` carries its reason in
the component's own prose.

### (3) ADR-015 / C-07 — arm (a), and (c) is RETAINED

**Amend C-07 and ADR-015 to say the crate owns the REALITY-SIDE join
and TypeScript owns the intent ⨝ tasks half.** This describes the tree
as it already is: T-014 shipped that join, `arch drift --fail-on
undeclared|unmapped` already treats both as reality findings, and the
lane has already corrected C-07's flatly false *"Emitting graph.json is
its entire job"*, which has been wrong since T-014.

**Arm (b) is refused**: it is the purest reading of ADR-015 and it costs
the capability. C-02 does not exist, the engine is not in a shareable
package, and until both change `nputer arch` could not exist at all —
which is precisely what T-014's criterion was written to prevent. A
purer document that deletes a working command is a worse document.

**Arm (c) is NOT an alternative and is kept**: pinning the two engines'
agreement is `T-059`, it is worth doing under (a) regardless, and it is
what stops one clause in two documents from drifting into two answers.
**T-059 therefore does NOT dissolve** and stays `blocked_by: [T-033]`.

## Acceptance criteria
- WHEN the umbrella decision applies THE standing D1 findings whose
  mechanism is the shared-primitive/test umbrella SHALL drain (or be
  recorded as accepted) per the recorded decision — registry edits,
  dogfood fixture deltas, and graph regen in ONE change, every
  expectation delta listed in notes (the T-012 §2 discipline:
  changed, never silently loosened).
- WHEN the non-code decision applies THE D3 findings for C-01 and
  C-11 SHALL either downgrade to informational (C-06 parser field +
  derivation + rendering, each a small additive change with tests)
  or be recorded as accepted in the component files — after this
  task the map's findings on this repo SHALL be exactly the honest
  not-yet-built set.
- IF a format field is added THEN parse of every existing component
  file SHALL be unchanged (additive only), pinned by the live-tree
  smoke discipline.
- THE lib/parser live-registry pin SHALL assert what it MEANS —
  consistency between docs/architecture/components/ and the parsed
  set — by deriving its expectation from the directory listing rather
  than a hand-written id array, so declaring a component stops
  breaking a frozen count inside a package whose task fences say "zero
  diff under lib/parser/**"; and the enumerated reconciliation block
  in app/test/architecture-dogfood.test.ts SHALL name its two sibling
  fixtures (T-024-s5).
- THE ADR-015 / C-07 WORDING SHALL BE RECONCILED per decision (3),
  in the same change as the registry edits — one clause in each
  document, so the map and the two engines stop being describable by
  two incompatible sentences. IF arm (b) is chosen THEN the notes
  SHALL say so explicitly and name T-059 as dissolved, because a card
  that quietly stops being needed is worse than one that is closed
  (T-014-s1).

## Implementation notes

Built by `claude-opus-5 @T-033` on `task/T-033-zero-drift-registry`, base
`25a9e2c`. **TWO of five criteria are met, one is vacuous, one is met in
part, and one is NOT BUILT — and the reason is the same for all of them,
so it is stated once, first.**

### THE CARD WAS DISPATCHED WITHOUT ITS OWN DECLARED PRECONDITION

This card opens with *"Decisions at dispatch (ADR-004 — the registry is
the architect's pen; record the picks in this file's plan section before
dispatch)"* and then enumerates three. **None was recorded.** The
dispatch commit `25a9e2c` changes exactly two lines — `status: planned` →
`building`, `builder:` → `claude-opus-5` — and adds no plan section;
`git diff 25a9e2c 5fbfd4e -- docs/tasks/T-033-*.md` is empty, so it is
not a stale base either. Criteria 1, 2 and half of 5 read *"per the
recorded decision"* / *"per decision (3)"*, so their antecedent does not
exist, and an executor supplying it would be making the architect's
ruling — the single-writer failure ADR-004 exists to prevent. Routed as
`T-033-s1`, with the derived material each ruling needs filed beside it
(`T-033-s2`, `-s3`, `-s4`) so the pick is the only work left.

### THE FENCE RULING, IN WRITING — AND ITS PREMISE EXPIRED MID-LANE

STATE's rule: *widen when the fence makes THIS CARD'S OWN criterion
unbuildable; route when it makes a NEIGHBOURING defect unfixable.*
**I am on the ROUTE branch for every out-of-fence path, and the fence was
NOT widened anywhere.** Three separate grounds, in decreasing strength:

1. **`method/roles/executor.md` is absolute**: *"Widening the fence from
   inside the lane is the one repair this role may never make."* That
   governs regardless of which branch the STATE rule points at.
2. **`app/test/**` was HELD.** It is C-05's `app-shell` (read off
   `touch_slugs:`, the authority ARCHITECTURE names over its own
   signpost prose), and T-123 held it LIVE at `338a7e2` when the ruling
   was made. That is T-010's criterion-5 situation verbatim, and T-010
   ruled it: widening there *"is not a fence question, it is two live
   lanes on one fence"*.
3. **`docs/decisions/` is in no fence at all.** No component's `paths:`
   reaches it, so no `touch_slugs:` and no `touches:` can name it, and
   **every commit in this repository's history that has touched
   `docs/decisions/` is a checkpoint, a promotion or the milestone-0
   baseline** — including ADR-015's own T-014 addendum, written at
   checkpoint `d77a33e` and not on T-014's branch. No executor lane has
   ever edited an ADR. Filed as `T-033-s4`.

**GROUND 2 EXPIRED WHILE THIS LANE WAS RUNNING AND THAT IS RECORDED
RATHER THAN QUIETLY DROPPED.** Main advanced from `25a9e2c` to `5fbfd4e`
(T-031) and then to **`0358c0c`, which merges T-123 and releases
`app-shell`**. The ruling stands anyway, on grounds 1 and 3 and on the
fact that the criteria needing `app/test/**` also need a decision nobody
recorded — but a verifier re-deriving the lane list will find a free
fence where this ruling found a held one, and the sequence is why.

**AND THE FENCE COST LESS THAN THE BRIEF FORECAST.** The brief expected
criterion 4's second clause to force the question. It does not: the
enumerated reconciliation block in `app/test/architecture-dogfood.test.ts`
**already names both sibling fixtures** — `map-dogfood-render.test.tsx`
11 times and `lib/parser/test/smoke.test.ts` 19 times, including *"T-024's
THREE-FIXTURE RULE FIRES HERE"* — discharged in the ordinary course by
T-024/T-025/T-088. T-024-s5 asked for three things and two are already
done (the CONVENTIONS gotcha line, ratified; the sibling naming); the
third, the derived pin, is what this lane built. **Zero edits are owed
inside the held fence for criterion 4.**

### THE LIVE FINDING SET, RE-DERIVED AT MY OWN REF

`arch` and `arch drift --root ../..` at **`25a9e2c`**: graph **890 866
bytes · 172 files · 1874 symbols · 1842 edges**; **findings=14 — 11 D1 +
3 D3**; `undeclared=11 · unmapped=0 · declared_only=3 · ambiguous=0 ·
dangling=0`; **34 relation rows, 14 confirmed / 11 undeclared / 9
planned**; `drift_components=7`. The brief's picture is confirmed.

**THE CARD'S OWN PICTURE IS NOT, AND THE REFUTATION MATTERS TO THE
RULING.** The card says C-05→C-13 and C-05→C-14 are *"both created by
C-05's `app/test/**` umbrella"*. **Both carry real SOURCE edges**:
C-05→C-13 has 5 (`App.tsx` and `GenesisScreen.tsx` into `genesis/**`,
T-027/T-028) among its 17, and C-05→C-14 has 2 Rust ones
(`churn.rs`→`agent/runner.rs`, `lib.rs`→`agent/mod.rs`) among its 8. So
the *"umbrella TEST edges do not count"* option **cannot drain either
row** — it drains D1:C-05→C-06 (13, all test) and D1:C-05→C-09 (3, all
test) and thins the other two. Full classification in `T-033-s2`.

### CRITERION BY CRITERION

1. **NOT BUILT, ROUTED (`T-033-s2`).** No decision recorded; and the
   criterion's own *"registry edits, dogfood fixture deltas, and graph
   regen in ONE change"* puts two thirds outside this fence. The drain
   arm is nonetheless **measured, not guessed**, in a scratch worktree at
   `344a0d5`: four `depends_on` lines take findings **14 → 3**,
   undeclared **11 → 0**, drift components **7 → 3**, and the relation
   tally **14/11/9 → 25 confirmed / 0 undeclared / 9 planned**, with the
   three D3s surviving. **The declared cycles are real and nothing in the
   toolchain objects** — `lib/parser` is 264/264 at exit 0 with
   C-05↔C-08, C-05↔C-09 and C-05↔C-13 live — which makes T-008-s2's cycle
   worry a modelling objection rather than a mechanical one. The whole
   reconciliation burden is `app/test/architecture-dogfood.test.ts`,
   **4 of 10 bodies**.
2. **NOT BUILT, ROUTED (`T-033-s3`).** Same missing decision. Also
   derived: the D3 set is **three**, and only C-01 and C-11 are the
   permanent-amber story — **C-15's D3 is the honest not-yet-built signal**
   and must survive any `non_code:` field, which this card does not say.
   Arm (a) is unbuildable in fence for a reason worth its own finding:
   every app test lives in `app/test/**` (`T-033-s5`).
3. **VACUOUSLY MET.** No format field was added, so nothing could change
   the parse of an existing component file. Held anyway by measurement,
   not by argument: the whole registry parses at 264/264 and the app's
   940/940 is unmoved.
4. **MET.** First clause built: `lib/parser/test/smoke.test.ts` now
   derives its expectation from the directory listing. It asserts what it
   MEANS — for every `C-*.md` in `docs/architecture/components/`, the id
   the parser read out of the **frontmatter** equals the id spelled in the
   **filename**, and the parser drops none and invents none. Two
   independent readings, so it can still fail (drilled below). **The
   census did not vanish**, which is the "changed, never loosened" half:
   it lives on in the two app fixtures, under the very fence a
   component-declaring card already has to hold. Second clause **verified
   already satisfied on disk** — see the fence section.
5. **MET IN PART.** The in-fence half is built: C-07's *"Emitting
   graph.json is its entire job (parsing and derivation live in
   TypeScript)"* was **false from 2026-08-17**, when T-014 shipped
   `arch`/`arch drift`, and is replaced by what the binary does, with the
   open ownership question named rather than answered. **The arm was NOT
   chosen and the ADR-015 clause is NOT written** — `T-033-s4`. Arm (b)
   was **not** taken, so **T-059 is NOT dissolved** and stays
   `blocked_by: [T-033]`.

### THE DRILL — `drill-T-033`, detached at `344a0d5`

Driver and results named per-lane (`drill-T-033-driver.sh`,
`drill-T-033-results.txt`, T-088-s3). No cargo ran inside it, so no
`.drilltarget` and no phantom-file hazard; the graph delta below was
measured in the clean lane tree. Baseline 264/264 exit 0.

| # | one-sided mutation (producer, never the assertion) | read back | result |
|---|---|---|---|
| M1 | `C-14-agent-runner.md` frontmatter `id: C-14` → `id: C-99`, filename untouched | `git diff` shown | **RED, exit 1 — 1 failed / 263 passed**, and the failing body is the new one, alone |
| M2 | `git mv C-14-agent-runner.md C-99-agent-runner.md`, frontmatter untouched | `git diff --cached --stat` shown | **RED, exit 1 — 1 failed / 263 passed**, same body, alone |
| M3 | `rm C-15-dispatch.md` — a COVERAGE PROBE, not a poison | `git status` shown | **GREEN 264/264 — the honest residual** |

Restoration proved per-path by sha256 against the drill's own commit:
`C-14…` `f8891cd3…` = `f8891cd3…`, `C-15…` `0a546a28…` = `0a546a28…`,
and after the drain measurement all six touched registry files matched
byte for byte; the drill's final tracked `git status` is **empty**.

**M3 IS THE FINDING, AND IT IS DISCLOSED RATHER THAN PAPERED OVER.**
Deleting a component nothing `depends_on` does not red this body, because
consistency and census are different properties and this pin is now the
first. That is the intended trade — but it is only safe because the
census moved rather than vanished, and **that was measured, not asserted**:
the same deletion reds `architecture-dogfood.test.ts` at **5 of 10
bodies**, and M2 reds it at 1 of 10.

**SHAPE SIX, ASKED AND ANSWERED — INCLUDING WHERE I PREDICTED WRONG.**
Inside `lib/parser`'s own suite the new body kills mutants nothing else
kills: in M1 and M2 exactly one of 264 fails and it is this body, with the
other three `smoke.test.ts` bodies green. **Across the repository it is
NOT unique on the mutants drilled** — I expected the dogfood's frozen
array to miss M2 and it does not; it reds on sort ORDER, since
`C-99-…md` sorts past `C-15-…md`. The property that is unique is the
other direction: **a correct new declaration reds the census and leaves
this pin green**, which is the whole point of moving it.
**The C-07 edit adds and changes no assertion** — nothing in this
repository asserts C-07's prose (the only live-tree prose assertion
anywhere is `smoke.test.ts`'s `expect(parser?.responsibility)` on C-06) —
so it cannot be poisoned, and that is stated rather than skipped.

### GATES, DERIVED FROM MY OWN DIFF

`TREE=$(git merge-tree --write-tree 0358c0c HEAD)` → exit **0**, tree
`ae95a7c8…`; `git diff --name-only 0358c0c "$TREE"` → **7 paths** (that
forecast was taken at tip `96f3ec7`; this notes commit makes it 8, the
card itself). Never `..` and never three dots.

- **GRAPH REGEN — FIRES, 1 of 7** (`lib/parser/test/smoke.test.ts`), and
  the gate was **ASKED, not predicted**: `index --check --root ../..`
  exits **1**, a REAL red printing both count lines — committed
  `890866 · 172 · 1874 · 1842` against fresh `891026 · 172 · 1874 ·
  1843`, `files ~1` (`smoke.test.ts`, loc 113 → 153) and `edges +1`
  (`-> p:node:fs (import) symbols=[readdirSync]`). **The regen is the
  integrator's at the checkpoint and is deliberately NOT committed here.**
- **THE FIXTURE MOVEMENT IS NIL, AND THAT IS MEASURED.** A throwaway
  probe regenerated the graph in the lane tree, `index --check` went to
  **0**, `npm test` from `app/` came back **940/940 at exit 0** against
  the fresh graph, and `arch drift` reported the identical **14 findings
  / 11 undeclared / 3 declared_only**. The probe was then reverted and
  proved: `docs/architecture/graph.json` sha256 **`c38bd985…`** equals
  `git show HEAD:` byte for byte, `git diff` empty. **No `app/test/**`
  reconciliation is owed by this lane.**
- **BOOT GATE — NOT OWED, 0 of 7.** No path under `app/src-tauri/**`,
  `app/src/**`, `app/package.json` or `app/src-tauri/Cargo.toml`.
- **DOCS GATE — FIRES, exit 1, 6 of 7 under `docs/`**, invoked directly
  from the repo root with root-relative arguments, never through `xargs`.
  Four suites owed and **all four run over the final tree**. Every new
  card was `git add`ed BEFORE the gate read it, so its **0 frontmatter
  issues** is a measurement and not the `T-010-s10` hole.

### COMMANDS AND SUITES — every exit off `$?` unpiped, in order

`npm ci`+`npm run build` lib/parser **0**/**0** · `npm install`+`npm run
build` app **0**/**0** (**rebuilt**, not touched, so the three
`is not stale` bodies compare against a real dist) · `npm ci` tools/e2e
**0** · `npx vitest run` lib/parser **0** (264/264) · `npx tsc --noEmit`
lib/parser **0** · `npm test` app **0** (940/940 across 46 files) ·
`cargo test --no-fail-fast` **0** (**408 passed / 0 failed / 3 ignored**
summed over 15 `test result:` lines) · `index --check --root ../..` **1**
(the real red above) · regen `NPUTER_UPDATE_GOLDEN=1 … self_graph --
--ignored` **0** then `index --check` **0**, then restored · docs gate
**1** · `npm test` tools/e2e **0** (143/143, 1.5m) · `npx tsc --noEmit`
tools/e2e **0** · `lint:tokens --selftest` **0**, `lint:tokens` **0**
(printed TOKEN 131 / CONTROL 642 — derive these, never quote them) ·
`npm run lint:docs` **0** · final re-runs over the whole tree: parser
**0** (264/264), app **0** (940/940), cargo **0** (408/0/3).

**THE FLAKE TALLY, HONEST AND KEPT APART.** `docs_watch::tests::
startup_arm_watches_the_initial_root` and its `recv_emit` sibling did
**not** fire here: **0 red in 2 full cargo runs on this lane**. That is
recorded beside T-088's (1 in 2) and the T-010 integrator's (3 in 6)
rather than added to them, and it is weak evidence — this lane's cargo
runs were not under the concurrent load the finding names.

### ENVIRONMENT

Port 1420 read ONLY with `lsof -nP -iTCP:1420 -sTCP:LISTEN`, never
bind-probed: holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, read live at 2026-08-25 on this host — the vite server did not
restart under this lane, and no pid is quoted from the brief. Scratch
port **15100** used for E2E: `lsof` FIRST (0 rows), then bind-confirmed
free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that order, and 0 rows
again after. No `pkill`. No sibling worktree touched; the untracked `z`
left alone. No CLI spawn, no model call, no screen control.

## Verdicts
