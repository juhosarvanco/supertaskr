---
id: T-033
title: Zero-drift registry pass — umbrella shared-primitive story + non-code D3 story
feature: F-06
milestone: 4
priority: 17
size: M
status: done
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-map, app-shell]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-033 — code commits 344a0d5, 1baed94, 784dad9
verified_by: claude-opus-5 @T-033-verify — APPROVED, 2026-08-25 — verdict commits c259f87 and 642577e
review: same-model
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

**PHASE 1B SUPERSEDES PHASE 1 BELOW. ALL FIVE CRITERIA ARE NOW MET.** The
phase-1 notes are kept verbatim under their own heading because they are
the record of what the lane did before the rulings existed, and because
the fence ruling they contain is the reason the rulings were made at all.
Read this section first; everything under *PHASE 1 (superseded)* is
history with its own dated refs.

---

# PHASE 1B — the rulings arrive, and the repo reaches zero drift

Built by `claude-opus-5 @T-033` on `task/T-033-zero-drift-registry`.
**The lane was REBASED onto `ad5a0df`** — main had moved thirty-plus
commits (T-110, T-123, T-124, T-052, T-120 merged; the rulings landed on
this card at `bb26a93` and @human's overturn at `5e6fc8c`), and this card
is *about the finding set*, so building against the old base would have
produced fixture values that were wrong at the merge. The rebase replayed
three commits with **no conflict**, and the card in this lane now carries
the architect's ruling text byte-for-byte. The pre-rebase tip is kept as
`lane-backup-T-033-9b9472b`.

## WHAT THE THREE RULINGS ASKED FOR, AND WHAT EACH ONE COST

| ruling | built | where it went beyond, or stopped short |
|---|---|---|
| (1) umbrella, arm (a) then declare | C-16 shared primitives; every surviving edge declared | claims a THIRD path, `lib/verdicts.ts` — `T-033-s6` |
| (2) `non_code`, opt-in never inferred | parser field + derivation + renderer, tests in both layers | its stated example (C-15) evaporated — `T-033-s9` |
| (3) ADR-015/C-07, arm (a) | both documents amended, T-059 kept | `docs/decisions/` is still in no fence — `T-033-s4` |

**THE RESULT, derived at `ad5a0df` before and after, by both engines.**

| | at `ad5a0df` | after |
|---|---|---|
| findings | **15** (12 D1, 1 D2, 2 D3) | **3** (1 D1, 2 informational D3) |
| undeclared | 12 | **1** |
| unmapped | 1 | **0** |
| relation rows / tally | 35 · 14 conf / 12 undecl / 9 planned | **36 · 26 / 1 / 9** |
| components with drift | 7 | **1** |
| registry | 12 components | **13** |
| indexed files | 178 | **178** — unchanged, which is the point |

The one undeclared row left is `D1:C-10->C-14`, and it is left on purpose:
declaring it writes this registry's first cycle against the confirmed
`C-14 -> C-10`, @human ruled that out, and the extraction is **T-125**.
C-10's component file names T-125 as its owner, so the card's completion
condition — *every remaining undeclared edge either declared or owned by a
named card* — holds with one row outstanding.

## THE FOUR PLACES THE REPOSITORY CONTRADICTED THE RULINGS

Every one is derived, and each is filed rather than absorbed silently.

1. **`verdicts.ts` had to move too, or the ruling contradicts itself.**
   The path list names `components/ui/**` and `lib/utils.ts`; the same
   ruling enumerates the surviving rows as `C-05->C-13` and `C-05->C-14`
   *and no others*. Measured: `C-08->C-05` is 3 `cn` edges plus
   `board-model.ts -> verdicts.ts`, and `C-09->C-05` is 1 `cn` plus
   `TaskDetailPanel.tsx -> verdicts.ts`. Extract only the two named paths
   and both rows survive on `verdicts.ts` alone — and then declaring them
   writes cycles against the declared `C-05->C-08`, while leaving them
   misses zero drift. `verdicts.ts` passes every test `utils.ts` passes
   (three consumers, **zero imports of its own**, and T-017 split it out
   *"to keep the dependency graph acyclic"*). Extended, disclosed in
   C-16's own prose, reversal costed in **`T-033-s6`**.
2. **C-15 is no longer the ruling's example.** Decision (2) says *"C-15
   has none either, and its D3 is honest not-yet-built amber that must
   survive"*. Both halves are false at my ref: T-110 merged **seven hours
   and twenty minutes after the rulings** (`dce93b0` 04:18 → `1223543`
   11:38, `merge-base --is-ancestor` exit 0), C-15 has **six** files, and
   its D3 had already cleared on its own. The rule survives its example;
   what it costs is **`T-033-s9`**.
3. **A D2 appeared that no ruling could have covered**, for the same
   reason — `app/src-tauri/tests/dispatch_lanes.rs`, this repository's
   first. Settled onto C-15 by T-010's own stated rule (a component's
   suite belongs to the component it exercises), disclosed in C-15's prose
   and in **`T-033-s8`**.
4. **`C-12 -> C-05` became a lie and was dropped.** All seven of its
   observed edges were `cn`/`verdicts`, so after the extraction it
   measured `planned observed=0` — a declared dependency with nothing
   behind it, which the map draws as INTENT. Dropping it also closed
   `C-05 <-> C-12`, a cycle @human's rule forbids and which nobody had
   noticed. Argued in C-12's own prose.

**AND ONE CYCLE SURVIVES THAT THIS CARD DID NOT CREATE AND COULD NOT
FIX**: `C-08 <-> C-09`, declared in both directions since T-012's §2
amendments and confirmed in both (6 edges and 3). It predates @human's
rule by nine days, its fix is an extraction like T-125's, and
`app/src/components/board/**` was `app-board`, held live. **`T-033-s10`**.

## CRITERION BY CRITERION

1. **MET.** The umbrella D1s drain, per the recorded decision, with the
   registry edits and both dogfood fixture deltas in ONE change — the
   fence gained `app-shell` for exactly this. Every expectation delta is
   listed below; changed, never loosened.
2. **MET.** `non_code: true` on C-01 and C-11, each carrying its reason in
   its own prose. The map's findings on this repo are now exactly the
   honest set: one owned by T-125, two informational.
3. **MET, and it is no longer vacuous.** A format field WAS added, so the
   condition fires: every existing component file parses unchanged
   (additive only), pinned by the live-tree smoke discipline — the parser
   suite is 268/268 and the whole-record `toEqual` in `component.test.ts`
   asserts `nonCode: false` on a fixture that never mentions the key, so a
   default of `true` or a field that fails to reach the record reds there.
4. **MET in phase 1 and unchanged here** — and the derived pin paid off
   immediately: declaring C-16 moved the two app fixtures and **did not
   red `lib/parser`**, which is the whole reason the pin was rewritten.
5. **MET.** Arm (a) is written into BOTH documents. Arm (b) refused, arm
   (c) retained, **T-059 does not dissolve** and stays
   `blocked_by: [T-033]` — stated explicitly because the criterion asks
   for the opposite statement if (b) had been chosen.

## THE FENCE, RE-DERIVED AT MY OWN REF

`touches: [docs/architecture/components/, lib-parser, app-map, app-shell]`.
**Not widened.** The lane list moved twice under this phase; at the last
read (`git worktree list`, live) it is **T-086 `[docs/CONVENTIONS.md]`,
T-091 `[tools/e2e]`, T-102 `[app-agent]`, T-107 `[app-interview]`** — all
four disjoint from mine. The registry files for C-13 and C-14 were edited
under the LITERAL `docs/architecture/components/` fence, which is why
`app-interview` and `app-agent` being live is not a collision: T-010's
precedent is that a slug fences a component's `paths:`, and the registry
directory is fenced separately by name.

**ONE PATH OUTSIDE THE FENCE, NAMED PLAINLY**:
`docs/decisions/015-indexer-rust-derivation-ts.md`. Criterion 5 requires
it and the ruling says *"Amend C-07 and ADR-015"*, so it was written on
the card's own authority — but `docs/decisions/` is in no component's
`paths:`, no `touch_slugs:` and no card's `touches:`, and the fence
correction at `bb26a93` did not add it. Every previous ADR edit in this
repository's history is a checkpoint, a promotion or the milestone-0
baseline. `T-033-s4` carries it.

## THE POISON DRILL — `drill-T-033-b`, detached at `1baed94`

Driver and results named per-lane and living **outside the repository**.
Baseline: parser 268/268, architecture-derive 52/52, map-visuals 41/41,
dogfood 10/10, map-dogfood 8/8 — all exit 0. Every mutation is
producer-side, read back with `git diff` before its run, restored and
proved per-path by sha256 against the drill's own commit.

| # | one-sided producer mutation | result |
|---|---|---|
| M1 | `component.ts`: refusal → `Boolean()` coercion | **RED** parser 1/268, the *"string 'false' is the trap"* body alone |
| M2 | `derive.ts`: `informational: component.nonCode` → `true` | **RED** architecture-derive 4/52 — **and dogfood GREEN**, which is the finding |
| M3 | `isDriftFinding` → always true | **RED** map-visuals 2/41, map-dogfood 1/8 — **and dogfood GREEN**, which is a DEFECT, fixed below |
| M4 | drop `non_code: true` from C-11's file | **RED** dogfood 2/10, map-dogfood 2/8 |
| M5 | return `verdicts.ts` to C-05 | **RED** dogfood 4/10, map-dogfood 2/8 |

Restorations: `component.ts` `3f832849…`, `derive.ts` `146fcdda…`,
`map-visuals.ts` `bd9b4bc7…`, `C-11-design-tokens.md` `6343056e…`,
`C-16-shared-primitives.md` `57a6c3b4…`, `C-05-app.md` `1b9dd184…`, each
equal to the drill commit's own blob; final tracked `git status` empty;
post-drill parser 268/268 and dogfood 10/10 at exit 0.

**M3 IS THE DRILL EARNING ITS KEEP, AND IT FOUND A REAL DEFECT IN MY OWN
CHANGE.** `isDriftFinding` was written in `map-visuals.ts` while
`derive.ts` kept testing `!finding.informational` inline — **two
implementations of one rule**, T-057's disease, and my own comment claimed
*"ONE predicate, three callers"*, which was prose the suite could not
check (the T-096 lesson, committed by the person quoting it). The mutant
proved it: the visuals copy reddened the rings and left the dogfood's
`hasDrift` assertion green. The predicate moved into `derive.ts` beside
the finding type, `map-visuals` re-exports it, the live fixture now pins
that the two agree — and **re-drilled at `784dad9` the same mutation reds
all three layers** (map-visuals 2, dogfood 1, map-dogfood 2), which is the
two copies becoming one, measured.

**M2 IS A GAP RATHER THAN A DEFECT, AND IT IS DISCLOSED.** The inferring
mutant — the exact bug decision (2) is written to prevent — survives BOTH
live-registry fixtures, because after this card the only two file-less
components are the two that are flagged, so "read" and "infer" agree on
every component that exists. The property is pinned in unit fixtures in
both layers, on synthetic unflagged components. `T-033-s9`.

## EVERY EXPECTATION DELTA, changed and never loosened

`lib/parser/test/component.test.ts` — `nonCode: false` joins the
whole-record `toEqual`; four new bodies (true, false, the C-15 property,
non-boolean refusal over five spellings).
`app/test/architecture-derive.test.ts` — two D3 literals gain
`informational: false`; two new bodies (the downgrade with C-02 as its
positive control in the same body; "never comes from an empty file list").
`app/test/map-visuals.test.ts` — the component factory gains
`nonCode: false`, the D3 fixture gains `informational: false`; two new
bodies (ring set vs panel; the footer).
`app/test/architecture-dogfood.test.ts` — SEVEN bodies: the census 12 → 13
ids and declared count; C-15's paths gain a third glob and its files
5 → 6; `fileComponent.size` HOLDS at 178 (asserted as a non-move, because
an extraction that changed it would have widened something) and
`unmappedFiles` → `[]`; the tally gains `["C-16", 3]`, C-05 65 → 62, C-15
5 → 6, and `["unmapped", 1]` leaves; the findings array 15 rows → 3; the
relation table 35 rows → 36 with the tally 14/12/9 → 26/1/9; the
package.path seam body's fourth consumer flips undeclared → confirmed
(with its count asserted beside it so "confirmed" cannot be reached by the
edge emptying); the drift array 8 → 1 with `declaredOnly` UNCHANGED as the
control that proves the two facts came apart rather than both vanishing.
`app/test/map-dogfood-render.test.tsx` — FOUR bodies: node count HOLDS at
13 while the bucket leaves and C-16 arrives (asserted by identity, since
the total is a coincidence); the drift-face body loses every count it
carried and gains C-10 as its positive control, plus the two D3 rings
going out while their findings remain; the edge table 35 → 36 with
undeclared 12 → 1, asserted by `data-edge` identity; the C-05 panel body
inverts whole — no chip, no `"without declaring the dependency"` sentence,
with C-10's panel and C-11's informational explanation as controls.

**ONE ASSERTION IS DELIBERATELY LEFT AT ITS PRE-REGEN VALUE**, marked in
the file with an `*** INTEGRATOR ***` banner: `["C-05","C-12","confirmed",
32]` **goes to 33 at the checkpoint regen**, because this lane's own
fixture edit adds `import { edgeKey } from "../src/architecture/MapEdge"`
to `map-dogfood-render.test.tsx`. Measured, not forecast: the graph was
regenerated in a throwaway probe, the whole app suite ran **962/962 with
that row at 33**, the probe was reverted and the committed graph proved
byte-identical by sha256 (`b99f819b…`). **Nothing else in either fixture
moves under that regen.**

## GATES, DERIVED FROM MY OWN DIFF

- **GRAPH REGEN — FIRES**, and the gate was ASKED rather than predicted:
  `index --check --root ../..` exits **1**, a real red printing both count
  lines — committed `920597 · 178 files · 1959 symbols · 1878 edges`
  against fresh `921664 · 178 · 1960 · 1882`, **12 files modified, 0 added
  or removed**. The regen is the integrator's at the checkpoint and is
  deliberately NOT committed here.
- **BOOT GATE — OWED and NOT RUN, said loudly.** The diff touches
  `app/src/**` (four files), which is the trigger. See below.
- **DOCS GATE — FIRES.** Run from the repo root with root-relative
  arguments, never through `xargs`, with every new card `git add`ed first.

## COMMANDS AND SUITES — exits off `$?` unpiped, counts derived

`npm ci` + `npm run build` lib/parser **0**/**0** · `npm install` +
`npm run build` app **0**/**0** (**rebuilt**, not touched) · `npx vitest
run` lib/parser **0** — **268 passed (268)**, up from 264 by the four new
bodies · `npx tsc --noEmit` lib/parser **0** · `npm test` app **0** —
**962 passed (962) across 46 files**, up from 958 by the four new bodies ·
`cargo test --no-fail-fast` **0** — **455 passed / 0 failed / 3 ignored**
summed over **16** `test result:` lines · `index --check` **1** (the real
red above) · regen probe **0**, re-check **0**, app **962/962** against
the fresh graph, restored and proved.

`npm test` tools/e2e **1 then 0** — see below · `npx tsc --noEmit`
tools/e2e **0** · `lint:tokens --selftest` **0**, `lint:tokens` **0**
(printed TOKEN 132 / CONTROL 696 — derive these, never quote them) ·
`npm run lint:docs` **0** · boot check `NPUTER_BOOT_PORT=15101 npm run
boot:check` **0**, both `[nputer]` lines observed · docs gate **1** (23 of
35 paths under `docs/`, four suites owed, all four run).

**THE CARGO SUITE IS GREEN AND THAT IS NOW NEWS RATHER THAN NOISE.** The
`docs_watch` intermittent was settled at `43803fe` as an 8.7 GB build
cache rather than a flake; the baseline is a cleaned cache and **no
`cargo clean` was run by this lane**. **455 / 0 / 3 over 16 `test result:`
lines, twice**, on two independent full runs.

**THE E2E SUITE RED ONCE AND IT IS NOT THIS LANE'S — CITED, NOT
RE-RUN-AWAY.** First run on scratch port **15102**: **145 passed / 1
failed, exit 1**, on `tools/e2e/tests/token-scan.spec.ts:201` (*"P6 reds a
planted bare motion utility..."*) with *"restored its MTIME too - a
content-exact restore that moves the clock reds an mtime guard"*. That is
**`T-120-s3`** (primary account) and **`T-052-s4`**: a defect that reds
**once per fresh checkout and is green forever after**, already hit by two
independent lanes in one evening - this lane is the third, and the
duplication is what `T-052-s4` says is itself the finding. My diff
contains **zero paths under `tools/`**. Second run on port **15103**:
**146 passed, exit 0**, which is exactly the documented behaviour.
Recorded as a range, because a single green would be the less true of the
two.

## PHASE 1 (superseded) — the notes written before the rulings existed

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

### 2026-08-25 — `claude-opus-5 @T-033-verify` — **APPROVED**

Verified adversarially from the BOUNDED card at `git show
ad5a0df:docs/tasks/T-033-zero-drift-registry-pass.md` — the planner's
spec plus the architect's three rulings, and none of the executor's
notes. Every number below was re-derived at tip **`935693f`** in my own
detached worktree `../nputer-T-033-verify`; the lane's worktree was not
entered, its files not touched. Nothing in the dispatch brief or in this
card was taken as authority.

## RULING ONE — THE MID-FLIGHT REBASE WAS LEGITIMATE. IT IS NOT A FINDING.

The lane re-based itself onto `ad5a0df`, replaying three commits, keeping
the pre-rebase tip as `lane-backup-T-033-9b9472b`.
`method/roles/integrator.md` step 1 says *"never rebase it"*. **That
prohibition does not reach this act, and the reasoning is recorded so the
precedent is legible rather than inferred.**

1. **Addressee.** The sentence is step 1 of the INTEGRATOR's role, inside
   the instruction about how to merge. `method/lane-protocol.md` — the
   file that rules one task/one branch/one worktree, the base commit, the
   sibling path and the fence — contains **no** prohibition on rebasing a
   lane. Read in full here; it is not there.
2. **Stated harm.** The rule names its harm precisely: *"a rebase replays
   the approved commits as new ones, so the tip the verifier approved is
   no longer in the history and the verdict names a commit nobody can
   diff."* **No verdict existed** — this is the first, and the rebase
   preceded even `status: verifying`. And the pre-rebase tip survives as a
   named ref, so even the weak form is false: I diffed it.
3. **Second stated harm** — that the merge commit carries both parents —
   is untouched. A rebase moves a base; the integrator still runs
   `git merge --no-ff`.
4. **The new base satisfies lane-protocol rule 2 exactly as the old one
   did**: `ad5a0df` is a non-merge commit on `main`, stated as a hash, and
   its gates are green under this lane (455/0/3, 962/962, 268/268,
   146/146, all below).
5. **THE JUSTIFICATION IS MATERIAL, NOT RHETORICAL — MEASURED.** Main
   advanced **89 paths** between `25a9e2c` and `ad5a0df`, and **3 of them
   intersect this lane's own 35**: `app/test/architecture-dogfood.test.ts`
   (**+173/-26**), `app/test/map-dogfood-render.test.tsx` (**+40/-7**) and
   this card. *(This line read `+199/-…` and `+47/-…` until the
   re-derivation below: 199 and 47 are `git diff --stat`'s TOTAL changed
   lines, not insertions. Corrected in place, and the error is recorded
   rather than quietly fixed — the ruling is unaffected, since main
   rewrote both fixtures either way.)* This card's entire deliverable is fixture NUMBERS derived
   from the tree. Built on the old base they would have been derived from
   a tree main had already rewritten, and the merge would have hand-
   reconciled them. **The rebase eliminated the overlap rather than hiding
   it**: `git merge-base main 935693f` is now `ad5a0df` itself, so the
   prescribed pre-merge form, the three-dot form and even the two-dot form
   return the identical 35-path set (`diff` over sorted lists, exit 0 in
   both directions).

**THE REPLAY IS FAITHFUL, PROVED THREE WAYS.**

    git range-diff 25a9e2c..9b9472b ad5a0df..ebbfae3   ->  =  =  !
    git diff 25a9e2c 9b9472b   vs   git diff ad5a0df ebbfae3
        789 lines each; `diff` reports THREE lines, all base-side:
          - one blob index line
          - one CONTEXT line: `touches:` gains `app-shell` FROM THE NEW BASE
          - one hunk header offset, @@ -110 -> @@ -242
    git diff --name-only 9b9472b ebbfae3   ->  89 paths
    git diff --name-only 25a9e2c ad5a0df   ->  89 paths, `diff` exit 0
        i.e. the pre/post-rebase tips differ by EXACTLY main's advance.

**THE RULING TEXT SURVIVED BYTE-FOR-BYTE.** The `## THE THREE RULINGS`
section at `ad5a0df` and at `935693f` have the identical sha256
`6e91317b6042548ac72031a180e85e27b1ec0f0e2b8606278eceee7d82be4a39`, and
`## Acceptance criteria` diffs clean. The only change anywhere above
`## Implementation notes` is `status: building -> verifying`.

The brief's own check, `git diff --name-only lane-backup-T-033-9b9472b
task/T-033-zero-drift-registry`, returns **119** against a union of
main's-advance-and-lane's-own of **121**. The two absentees are
`docs/tasks/T-033-s5-…md` and `lib/parser/test/smoke.test.ts`, whose blobs
are **byte-identical at both tips** (`6af24762…`, `149b0e18…`) — the
replay reproduced them exactly, so they cannot appear in a tip-to-tip
diff. That is confirmation, not discrepancy.

**THE PRECEDENT, stated so it binds narrowly:** a lane may re-base itself
**before any verdict exists**, onto a known-green non-merge commit, if
the pre-rebase tip is preserved as a named ref and the replay is proved
faithful by `range-diff` plus a tip-to-tip set comparison against main's
own advance. From the moment a verdict is written, the integrator's
"never rebase" binds absolutely — that is when the harm it names becomes
possible.

**NO SECOND REBASE IS WARRANTED.** Main is now 13 commits past `ad5a0df`,
touching 13 paths, **0 of which intersect this lane's 35** (`comm -12`,
empty).

## RULING TWO — EXTENDING THE RULING TO `verdicts.ts` WAS CORRECT.

**The ruling contradicts itself, and it is measurable.** Derived by me
from `arch drift --root <archive of ad5a0df>`, not read from the notes:

    D1:C-08->C-05  file_edges=4
      TaskCard.tsx -> lib/utils.ts
      badges/ModelBadge.tsx -> lib/utils.ts
      badges/SizeBadge.tsx -> lib/utils.ts
      lib/board-model.ts -> lib/verdicts.ts        <-- survives the ruling's extraction
    D1:C-09->C-05  file_edges=2
      TaskDetailPanel.tsx -> lib/utils.ts
      TaskDetailPanel.tsx -> lib/verdicts.ts       <-- survives the ruling's extraction

The ruling directs extraction of `app/src/components/ui/**` and
`app/src/lib/utils.ts`, and in the same breath enumerates the surviving
undeclared rows as `C-05->C-13` and `C-05->C-14` **"and no others"**.
Extract those two paths and **both** `C-08->C-05` and `C-09->C-05` stay
alive, on `verdicts.ts` alone, one edge each. The two halves of the
ruling cannot both be satisfied.

**Every remaining disposition is then closed.** Declaring them writes
`C-08->C-05` beside the declared `C-05->C-08` (confirmed, 4 edges) and
`C-09->C-05` beside `C-05->C-09` — two cycles, forbidden by @human's
standing rule of the same day. Leaving them undeclared misses criterion
1. The ruling as literally written is unbuildable.

**The resolution is determined by the ruling's own principle**, not
chosen: *extract when the tangle is an accident, extract when it is real
— the registry holds no cycles*, whose sanctioned remedy the ruling
itself names is "extract a component both sides depend on."
`verdicts.ts` meets every test `utils.ts` meets, verified in source at my
own ref: **zero imports of its own** (no import line in the file), and
exactly three consumers — `board-model.ts` (C-08), `TaskDetailPanel.tsx`
(C-09), `task-waves.ts` (C-12). T-017's own header says, verbatim, that
it was split out *"to keep the dependency graph acyclic"*. C-16 comes out
a genuine leaf and the tool agrees independently: `observed_deps=0`.

**ADR-004 protects the architect's PEN, not the architect's ARITHMETIC.**
Stopping to route would have cost a full dispatch cycle to obtain a
ruling the standing rule already determines uniquely, on a card whose
every other disposition is forbidden. The lane measured the
contradiction, resolved it by the ruling's own stated rule, **disclosed
it in bold in the new component's own prose**, and costed the one-line
reversal in `T-033-s6`. That is the behaviour the method wants.

**The precedent does NOT generalise past its cause.** It holds because
the extension was FORCED by a measurable internal contradiction and
DETERMINED by the ruling's own principle. A lane extending a ruling on
preference rather than on arithmetic is a different case and gets a
different answer.

**The same reasoning carries the two settlements the rulings could not
have covered, and both are disclosed.** `C-12 -> C-05` measured `planned
observed=0` after the extraction (all seven of its observed edges moved:
`C-12 -> C-16 confirmed observed=7`, exactly), and keeping it would have
left `C-05 <-> C-12` standing against `C-05 -> C-12 confirmed observed=32`
— forced by the same rule, argued in C-12's prose. The D2 on
`app/src-tauri/tests/dispatch_lanes.rs` postdates the rulings by seven
hours and is settled onto C-15 by T-010's own precedent, disclosed in
C-15's prose and in `T-033-s8`.

## THE DIFF, DERIVED WITH THE PRESCRIBED PRE-MERGE FORM

    git merge-tree --write-tree ad5a0df 935693f   ->  exit 0 (READ FIRST)
                                                      tree 38cec7e031ce081c2ccce8c3dff40f3203b71276
    git diff --name-only ad5a0df 38cec7e0…        ->  35   THE PRESCRIBED FORM
    git diff --name-only ad5a0df...935693f  (3 dots, forbidden)  ->  35
    git diff --name-only ad5a0df..935693f   (2 dots, forbidden)  ->  35
    git diff --name-only main..935693f      (forbidden)          ->  48

**ALL THREE NON-FORBIDDEN-ENDPOINT FORMS AGREE, AND THE SET IDENTITY WAS
CHECKED WITH `diff` OVER SORTED LISTS IN BOTH DIRECTIONS — exit 0 each
time, never by comparing counts.** They agree for a reason that is
specific to this lane and must not be generalised: **the rebase made
`ad5a0df` the literal merge base**, so `A...B` and `A..B` degenerate onto
the prescribed range. This is the SIXTH merge running where three dots
returns the right answer, and it teaches nothing. `main..935693f`
overstates by **13** paths — 1.37x — and all 13 are pure left-endpoint
drift (main's advance since `ad5a0df`), disjoint from the branch.

## THE HEADLINE NUMBERS, RE-DERIVED — NOT ACCEPTED

`cargo run -p nputer-index -- arch|arch drift --root ../..` from
`app/src-tauri` at `935693f`, and the same binary pointed at a
`git archive ad5a0df` extraction for the before column (graph sha256
`b99f819b…` on both sides, so the comparison is clean):

| | at `ad5a0df` | at `935693f` | claimed | verdict |
|---|---|---|---|---|
| findings | **15** | **3** | 15 -> 3 | **CONFIRMED** |
| undeclared | **12** | **1** | 12 -> 1 | **CONFIRMED** |
| unmapped | **1** | **0** | 1 -> 0 | **CONFIRMED** |
| relation rows | **35** | **36** | 35 -> 36 | **CONFIRMED** |
| tally conf/undecl/planned | **14 / 12 / 9** | **26 / 1 / 9** | same | **CONFIRMED, counted row by row** |
| indexed files | **178** | **178** | unchanged | **CONFIRMED** |
| components | **12** | **13** | 12 -> 13 | **CONFIRMED** |

**THE ONE SURVIVING UNDECLARED ROW IS `D1:C-10->C-14`**, one file edge,
`app/src-tauri/src/docs_watch.rs -> app/src-tauri/src/agent/sessions.rs`,
named to `T-125` in C-10's own prose. A lane that DECLARED it would have
violated @human's standing rule; leaving it named and owned is the only
disposition the ruling permits, and the card's completion condition —
every remaining undeclared edge declared or owned by a named card —
holds.

Also confirmed by measurement rather than by report: **C-05 files 65 ->
62, C-16 takes exactly 3** (`button.tsx`, `utils.ts`, `verdicts.ts` — the
whole of `components/ui/` is one file), **C-15 5 -> 6**, mapped 177 ->
178, and no path is declared twice anywhere in the registry
(`ambiguous=0`, and an independent sweep of every `paths:` entry across
the thirteen files finds no duplicate glob and no duplicate id).

## THE DECLARED CYCLE — PRE-EXISTING, CONFIRMED, AND OUT OF FENCE

`C-08 <-> C-09` is declared in both directions and observed in both (6
and 3). **Both directions were written at `8c1da7d`, 2026-08-15
15:12:20 — T-008's original registry** — and `git log -S` over each
`depends_on:` line finds **no other commit touching either**. From there
to the architect's ruling `bb26a93` (2026-08-25 04:24:22) is 9 days 13
hours: **"nine days" is right**. This merge INHERITS the violation and
does not create one; the lane adds only `C-16` (a leaf) to each side.
`T-033-s10` files it correctly, with one wrong attribution corrected
below.

**THE DECLARED GRAPH AT THE TIP HAS EXACTLY ONE CYCLE.** Walked by hand
over all thirteen `depends_on:` lists: nothing declares `C-05` any more,
`C-16` and `C-07` and `C-01` and `C-11` are sinks, and the only back edge
in the whole registry is the `C-08`/`C-09` pair. **This card introduces
no cycle**, which is the strongest form of the rule it was built to.

## THE INTEGRATOR BANNER COVERS EXACTLY ONE ASSERTION — PROVED, NOT READ

`grep -rn '\*\*\* INTEGRATOR'` over the whole tree returns **one** hit,
`app/test/architecture-dogfood.test.ts:1534`. (Two older
`INTEGRATOR JUDGMENT` comments at :233 and :336 are prose from earlier
cards, not deferred assertions.) Then measured rather than trusted, in my
own worktree:

    shasum -a 256 docs/architecture/graph.json  -> b99f819b…  (920 597 bytes)
    NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored  -> exit 0
                                               -> 61ca13bf…  (921 915 bytes)
    index --check --root ../..                 -> exit 0, CURRENT
    npm test (app)                             -> exit 1: Test Files 1 failed | 45 passed
                                                          Tests  1 failed | 961 passed (962)
      the ONLY failure: architecture-dogfood.test.ts:1522
        - 32
        + 33      at ["C-05","C-12","confirmed", …]
    git checkout -- docs/architecture/graph.json
    shasum -a 256 docs/architecture/graph.json -> b99f819b…  RESTORED, PROVED

**ONE assertion moves, it is the banner's, and 961 of 962 are unmoved.**
No second assertion is hiding behind it. The integrator's regen is safe
to run and its whole reconciliation is that one literal.

## GATES, DERIVED FROM MY OWN 35-PATH DIFF

- **GRAPH REGEN — FIRES** (the diff carries `.ts`/`.tsx` outside `docs/`)
  and the gate was ASKED: `index --check --root ../..` **exit 1**, a real
  red printing both count lines. **Leaving it red at the lane tip is
  CORRECT, not a defect**: `docs/CONVENTIONS.md` puts the regen on the
  INTEGRATOR *"with the CHECKPOINT"*, and says why — the checkpoint edits
  the indexed fixture files, so a graph regenerated into the merge is
  stale again. The lane obeys the written rule.
- **BOOT GATE — OWED** on 4 of 35 (`app/src/**`) **and RUN, exit 0**:
  `NPUTER_BOOT_PORT=15292 npm run boot:check`, both `[nputer]` startup
  lines observed, process tree stopped. The lane declared it owed-and-not-
  run; it is now run and green.
- **DOCS GATE — FIRES, exit 1**, invoked from the repo root with all
  **23** `docs/` paths as ROOT-RELATIVE arguments, never through `xargs`.
  **4 suites owed, 12 derived readers, census 130 sites in 22 files, 0
  frontmatter issues.** All four suites run and green below.

## SUITES — every exit off its own unpiped `$?`, every COUNT derived

- **cargo `--no-fail-fast`: 455 passed / 0 failed / 3 ignored, exit 0**,
  summed over **16** `test result:` lines. **Run TWICE, both green**, lib
  suite **3.97s** and **4.10s** — the isolated-target-dir band, so the
  `docs_watch` cache cliff is not in play. **Neither Rust intermittent
  fired**: `a_hostile_session_id…` green in both, `T-124-s3` green in
  both. **No `cargo clean` was run by this pass**; the worktree has its
  own fresh target dir.
- **app `npm run build` exit 0**, then **`npm test` 962 passed (962)
  across 46 files, exit 0**. *(Recorded honestly: my FIRST `npm test` ran
  before the build and reported 14 failed / 948 passed across 6 files —
  every one of them `no build output at app/dist/assets`, the suite's own
  refuse-rather-than-skip guard. That is run order, not this diff;
  `docs/CONVENTIONS.md` puts `npm run build` first. Declared rather than
  discarded.)*
- **lib/parser `npx vitest run` 268 passed (268) across 12 files, exit
  0**; `npx tsc --noEmit` **exit 0**. The live smoke asserts
  `expect(result.issues).toEqual([])` against this repo's own `docs/`, so
  the new `C-16` file and the two `non_code:` files parse clean by
  construction.
- **tools/e2e `npm test`: run 1 exit 1 (145 passed / 1 failed) on scratch
  port 15290, run 2 exit 0 (146 passed) on 15291. BOTH DECLARED.** The
  failure is `tools/e2e/tests/token-scan.spec.ts:201` with the documented
  `T-120-s3` signature — **`Expected: 1787659357414.476` against
  `Received: 1787659357414`**, a fractional millisecond against a whole
  one, first run in a fresh checkout. My diff contains **zero paths under
  `tools/`**. Not re-run into silence; recorded as a range.
- **e2e `npm run typecheck` exit 0 · `lint:docs` exit 0 ·
  `lint:tokens --selftest` exit 0** (65 TOKEN + 4 CONTROL samples, 87
  walk-policy, 9 evidence-floor) **· `lint:tokens` exit 0** at **TOKEN 132
  / CONTROL 696** — derived at my ref; CONTROL is `git ls-files` and is
  not a constant.

## SECURITY SWEEP — LIGHT HERE, AND RUN ANYWAY

A registry change adds no input path, and this diff adds none either.
Derived, not assumed:

- **ZERO `.rs` files in the entire 35-path diff.** `acl_pin.rs` is a
  **0-file diff**. No manifest, no lockfile, no `capabilities/**`, no
  `tauri.conf.json`, no `.nputerignore`, no `ci.yml` — one grep over the
  path list, no matches.
- **No dependency added anywhere.** No secret, key, token or credential
  pattern in **2 107 added lines**.
- **The new component declares no path it does not own.** All three of
  C-16's globs were C-05's in the same change; `arch` reports
  `ambiguous=0` and an independent sweep finds no glob claimed twice.
- **The one genuinely new input surface is `non_code:` in the parser, and
  it holds under attack.** I probed the built parser directly with
  fifteen spellings. Refused with an `invalid-field` issue and defaulted
  false: `"false"`, `"true"`, `0`, `1`, `[true]`, `{a: 1}`, **`yes`** and
  **`off`** — the last two matter, because a YAML-1.1 reader would coerce
  them to booleans and this one will not. Accepted only real booleans.
  `non_code:` (null) is absent-equivalent, consistent with `layer:`.
  Unknown spellings (`NON_CODE`, `nonCode`) land in `extra`, never
  coerced. **A `__proto__: true` key in the same frontmatter lands as an
  own data property in `extra` and does not pollute anything** —
  `non_code: true` beside it still reads correctly.

## THE POISON DRILL — MINE, RUN NOT TRUSTED

Detached worktree `../drill-T-033-verify` at `935693f`, its own
`CARGO_TARGET_DIR=../drill-T-033-verify-target`, driver and results named
per-lane and living outside the repository. Producer side only, never an
assertion. Each mutation read back with `git diff` **before** its run,
restored, and proved by sha256 **against the drill commit's own blob**.
Baseline: the four architecture suites **111/111 exit 0**, parser
**268/268 exit 0**.

| # | one-sided producer mutation | result |
|---|---|---|
| V-M1 | `derive.ts`: `isDriftFinding` -> `return true` | **RED 6/111 in FOUR files** — map-visuals **2**, architecture-derive **1**, **architecture-dogfood 1**, map-dogfood-render **2** |
| V-M2 | `derive.ts`: `informational: component.nonCode` -> `true` | **RED 4/52** architecture-derive; **BOTH live fixtures GREEN** |
| V-M3 | `component.ts`: refusal -> `Boolean()` coercion | **RED 1/268**, the *"string 'false' is the trap"* body alone |
| V-M4 | `derive.ts`: `nonCode: component.nonCode` -> `false` on the derived record | **RED 3/111** across three files, both live fixtures included |
| V-M5 | a registry file whose frontmatter id disagrees with its filename | **RED**, the derived live-registry pin alone |

**THE M3 RE-DRILL IS CONFIRMED AND THE DEFECT IS GENUINELY FIXED.** The
lane reports that its own drill caught two implementations of one rule
behind a comment claiming *"ONE predicate, three callers"* — prose no
suite could check — and that after moving the predicate into the engine
the same mutation reds all three layers. **Independently reproduced:
V-M1 reds `architecture-dogfood.test.ts > drift flags land on the right
nodes`, which is precisely the `hasDrift` assertion that stayed GREEN
when the two copies existed.** One predicate, and the live fixture now
proves it.

**V-M2's SURVIVAL IS ACCEPTABLE AND IS NOT A FINDING.** The inferring
mutant — the exact bug decision (2) exists to prevent — survives both
live fixtures because after this card the only two file-less components
are the two that carry the flag, so "read" and "infer" agree on every
component that exists. That is a property of the tree, not an omission:
no live-registry assertion can distinguish them until a genuinely unbuilt
component appears again. The property IS pinned where it can be, and V-M2
proves the pin bites — **4 reds** in the unit layer, including a body
named for it. `T-033-s9` files it. I would not accept the survival if the
unit layer were silent; it is not.

**V-M5 is my own addition and closes criterion 4's substance**: the
derived pin that replaced the frozen id array genuinely reds on a
frontmatter id that disagrees with its filename, while
`finds zero issues in the live tree` correctly stays green (a valid
record with an empty glob is a D3, not a parse issue).

Restorations, each equal to the drill commit's own blob:
`derive.ts` `5abd74e9…`, `map-visuals.ts` `8ec55557…`, `MapPanel.tsx`
`88e4f397…`, `component.ts` `3f832849…`, `C-16-shared-primitives.md`
`57a6c3b4…`. Final `git status` empty; post-drill **111/111** and
**268/268**, both exit 0.

## CRITERION BY CRITERION, ATTACKED LITERALLY

1. **MET.** The umbrella D1s drain per the recorded decision, and the
   registry edits and BOTH dogfood fixture deltas are in one change. I
   attacked the "graph regen in ONE change" clause and it does not bite:
   a registry edit cannot move `graph.json` (`docs/` is excluded from the
   walk), the graph movement here comes only from the lane's TypeScript,
   and `docs/CONVENTIONS.md` assigns that regen to the checkpoint by
   name. Every expectation delta is enumerated in the notes and I found
   none loosened — the `declaredOnly` list is held at `["C-01","C-11"]`
   across the change as the control that proves `hasDrift` and
   `declaredOnly` came apart rather than both vanishing.
2. **MET.** `non_code: true` on C-01 and C-11, each arguing its reason in
   its own prose, each with a stated falsification condition. The map's
   findings on this repo are now exactly one owned by T-125 and two
   informational.
3. **MET, and it is not vacuous.** A format field WAS added, so the
   condition fires. Additive: `non_code` appears in no component file
   before this change (grepped), so the only parse difference for an
   existing file is that the key would stop landing in `extra` — and none
   carried it. The whole-record `toEqual` in `component.test.ts` asserts
   `nonCode: false` on a fixture that never mentions the key, so a
   default of `true` or a field that never reaches the record reds there;
   V-M3 proves the refusal path reds too.
4. **MET.** The live-registry pin now derives its expectation from
   `readdirSync` over `docs/architecture/components/` and compares it to
   the ids the parser read out of frontmatter — two independent readings,
   proven to red by V-M5. The second clause is a state rather than a
   delta and holds: the enumerated reconciliation block in
   `architecture-dogfood.test.ts` names `lib/parser/test/smoke.test.ts`
   **19** times and `map-dogfood-render.test.tsx` **14**.
5. **MET.** Arm (a) is written into BOTH documents — C-07's prose and
   ADR-015's Decision section plus a dated addendum. Arm (b) refused in
   writing, arm (c) retained, and the criterion's conditional is
   satisfied in its true direction: **T-059 does NOT dissolve** and stays
   `blocked_by: [T-033]`, said explicitly.

## FOUR CORRECTIONS — none of them a criterion failure, all reproducible

**These are wrong figures in a correct change. They do not block the
merge and they are not suggestions; they are corrections to the record,
made here so the integrator reads true numbers.**

1. **THE GRAPH REGEN FORECAST IS STALE AT ITS OWN TIP.** The notes record
   fresh `921664 · 178 files · 1960 symbols · 1882 edges`. At `935693f`
   the gate says **`921915 · 178 · 1960 · 1883`**. I reproduced the
   lane's figure exactly by pointing the gate at a `git archive 1baed94`
   extraction — so it was measured at `1baed94` and never re-derived
   after `784dad9` moved the predicate into the engine, which is the
   commit that adds the extra edge and 251 bytes. **This is this card's
   own class of failure happening to this card**: a figure that went
   stale between measurement and publication. Nothing follows from it
   operationally — the integrator asks the gate, and I verified the one
   deferred assertion (32 -> 33) at the TIP, not at `1baed94`.
2. **"components with drift 7 -> 1" IS NOT DERIVED BY BOTH ENGINES**,
   though the table it sits in says *"derived at `ad5a0df` before and
   after, by both engines."* Six of the seven rows are confirmed by both;
   this one is produced by neither as written. TypeScript's own live
   fixture reads **8 -> 1** (`["C-01","C-05","C-08","C-09","C-10","C-11",
   "C-13","unmapped"]` -> `["C-10"]`). Rust `arch` reports
   `drift_components` **8 -> 3**. **7 is TypeScript's 8 minus the
   synthetic `unmapped` bucket, and no command prints it.** The "1" is
   unambiguous and correct.
3. **`T-033-s10` ATTRIBUTES THE `C-08 <-> C-09` DECLARATION TO "T-012's
   §2 amendments".** It is **T-008**, `8c1da7d`, and `git log -S` over
   each `depends_on:` line finds no other commit touching either. The
   DATE (2026-08-15) and the "nine days" are both right; only the card is
   wrong.
4. **`docs/ARCHITECTURE.md` DOES NOT KNOW C-16 EXISTS, AND THE LANE DID
   NOT ROUTE IT** — its notes contain zero occurrences of that filename.
   The slug block reads `app-shell -> C-05, C-10, C-11` and C-16 carries
   `touch_slugs: [app-shell]`, so the block is now understated by one.
   **This is NOT a fence violation — the file is outside
   `[docs/architecture/components/, lib-parser, app-map, app-shell]` and
   the lane was right not to touch it** — and the block says of itself
   *"Derived mechanically from `docs/architecture/components/C-*.md` at
   this checkpoint — read the field, never this prose"*, which puts it on
   the checkpoint by written rule (`method/roles/integrator.md` step 3).
   **INTEGRATOR: this is yours, and it is the one doc-truth gap this
   merge carries.** No suggestion is filed because the ritual already
   owns it.

## FILED SEPARATELY

`T-033-s11` — the Rust reader was not taught `non_code` (zero hits under
`crates/nputer-index/`), so the two engines classify the same live D3
differently and `arch drift --fail-on any` can never go green even after
T-125 clears the last undeclared row. Not a criterion failure and not
this card's work; it lands in `T-059`'s neighbourhood, which this card
deliberately kept alive.

## THE ENVIRONMENT

Port **1420** read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` only (node
88948, @human's vite) and never bind-probed; `/Users/ujju/Projects/nputer-app`
never entered. Scratch ports **15290 / 15291 / 15292**: `lsof` first (0
rows), bind-confirmed free on `127.0.0.1` **and** `::1`, freed after (0
rows). No `pkill`, no `cargo clean`. The lane's worktree
`../nputer-T-033` was never entered; `-T-091`, `-T-102`, `-T-107`
untouched; the untracked `z` left alone. No CLI spawn, no model call, no
screen control. My own worktrees are `../nputer-T-033-verify` and the
drill's `../drill-T-033-verify`, both detached siblings outside the
repository.

**APPROVED at `935693f`.** Every criterion is met, every headline number
re-derived independently agrees, the extension of the ruling was forced
and correctly disclosed, the rebase was legitimate and faithfully
replayed, the security sweep is clean, the drill's own self-caught defect
is confirmed fixed, and the deferred assertion is exactly one. Merge it.

### Addendum, same pass — an independent cycle derivation, TESTED not accepted

An architect-side probe walked `app/src/**` statically (resolve `@/` and
relative specifiers, map files to components by `paths:`, Tarjan for
file-level SCCs, DFS for component cycles) — a different method from
`nputer-index` and from this lane's reasoning. I re-derived its checkable
claims at my own ref rather than taking them.

**CONFIRMED, and each strengthens the approval:**

- **Declared component cycles 2 -> 1.** Walked by hand over every
  `depends_on:` at both refs: at `ad5a0df` they are `C-08 <-> C-09` AND
  **`C-05 <-> C-12`** (`C-05` declared `C-12`, `C-12` declared `C-05`); at
  `935693f` only `C-08 <-> C-09` remains. Two methods, one answer. **This
  is independent corroboration that dropping `C-12 -> C-05` closed a real
  declared cycle**, which is what C-12's own prose claims and which
  nothing before this card had noticed.
- **The two edges closing `C-08 <-> C-09` are exactly as named**, read
  verbatim: `app/src/components/board/TaskCard.tsx:3` imports `cardRef`
  from `@/lib/task-detail` (C-09's), and
  `app/src/components/board/TaskDetailPanel.tsx:12` imports
  `CHIP_BORDER_CLASSES, STATUS_CLASSES` from `./TaskCard` (C-08's).
- **`app-shell` goes from 3 components to 4** — grepping `touch_slugs:`
  across the registry at both refs gives `C-05, C-10, C-11` at `ad5a0df`
  and `+ C-16` at `935693f`. **This is the same fact as correction 4
  above, seen from the other side**, and it does not count against the
  card: `T-033-s7` flags it deliberately and argues the conservative
  choice.

**WHERE IT MUST NOT BE READ AT FACE VALUE, and my measurement wins:**

- Its **"components with drift 4 -> 0"** is **NOT zero drift on this
  repository**, and recording it as such would erase the one thing
  @human's ruling parked. The probe walks `app/src/**` only. The single
  surviving undeclared row is `D1:C-10->C-14`
  (`app/src-tauri/src/docs_watch.rs -> app/src-tauri/src/agent/sessions.rs`)
  — **Rust, outside its walk by construction**. Over the whole indexed
  tree `arch drift` gives **D1-source components 5 -> 1**, not 4 -> 0.
- The same scope limit bounds its **"real-import component cycles 9 ->
  1"**: over the full graph the base also carries `C-10 <-> C-14`
  observed, which its walk cannot see. **9 is a floor on `app/src`, not a
  repository census.** The endpoint agrees with mine; the path to it is
  narrower than the tree.
- Its file-level DAG result does **not** contradict `T-033-s10`. That
  file says the pair is *"a real two-way dependency in the source"*,
  which is true at COMPONENT level; the probe's point is that no FILE
  sits in a cycle. Both hold, at different levels, and s10's decision to
  route rather than fix is right under either reading.

**`T-127` — verified as a fact on disk, and deliberately not depended
on.** A file `docs/tasks/T-127-…md` exists **untracked** in the main
checkout (`git status` reports `??`), `status: planned`,
`blocked_by: [T-033]`, `touches: [crate-index, docs/architecture/components/]`,
absorbing `T-033-s7` and `T-033-s10`. **It is on no committed ref** —
neither `main` nor this tip — so nothing on this branch references it and
this verdict does not rest on it. Noted because it is adjacent: it opens
`crates/nputer-index` for a cycle gate, and `T-033-s11` names a second
gap in that same crate that T-127 does not cover.

### Addendum, same pass — EVERY RANGE AND COUNT RE-DERIVED INLINE AFTER A SHARED-SCRATCH HAZARD

**The cost is recorded here because the architect asked for it to be, and
because a verdict that hid a re-derivation would be worth less than the
re-derivation.** Mid-pass, the architect reported a MEASURED incident: one
verification pass wrote `prescribed.txt` into a scratch directory shared
with other live sessions, another session wrote its own `prescribed.txt`
to the same path, and the first pass read back **a different lane's path
list**. Not hypothetical, and it produces a wrong answer that looks
perfectly well-formed.

**I WAS EXPOSED, AND BY THE EXACT FILENAME.** This pass wrote
`prescribed.txt` — that file, that name — into the shared scratchpad
root, along with `main_advance.txt`, `replay_delta.txt`, `union.txt`,
`patch_pre.txt`, `patch_post.txt`, `p.sorted`, `three.sorted`,
`twodot.sorted` and `backup_tip.txt`, and **read several of them back**.
Those files are behind the 35-path count, the set-identity checks, the
89/89 rebase-fidelity claim, the 789-line patch comparison, the 119-vs-121
comparison, and — most load-bearing of all — **the "3 paths intersect"
figure that is the material justification for approving the rebase**. A
bare path list is the worst possible thing to trust by filename, because
another lane's list has the same SHAPE and no wrong-looking bytes.

**RE-DERIVED WITH NOTHING ON DISK**, using `diff <(cmd) <(cmd)` and
`comm -12 <(cmd) <(cmd)` so no intermediate file exists to be overwritten:

| figure | as published | re-derived inline | |
|---|---|---|---|
| `merge-tree --write-tree ad5a0df 935693f` exit / tree | 0 / `38cec7e0…` | 0 / `38cec7e0…` | same |
| prescribed pre-merge form | 35 | **35** | same |
| three-dot / two-dot | 35 / 35 | **35 / 35** | same |
| prescribed vs three-dot, vs two-dot (`diff` exit) | 0 / 0 | **0 / 0** | same |
| `merge-base(main, 935693f)` | `ad5a0df` | **`ad5a0df`** | same |
| main's advance `25a9e2c..ad5a0df` | 89 | **89** | same |
| replay delta `9b9472b..ebbfae3` | 89, `diff` exit 0 | **89, exit 0** | same |
| **lane's 35 ∩ main's advance** | **3** | **3**, and the same three paths by name | same |
| pre/post-rebase patch lines | 789 / 789 | **789 / 789** | same |
| substantive lines differing | 3 | **3** (blob index, one context line, one hunk header) | same |
| backup-to-tip vs union | 119 / 121 | **119 / 121**, same two absentees | same |
| forbidden `765924d..935693f` | 48 | **48** | same |
| main's advance since base, at `765924d` | 13, ∩ = 0 | **13, ∩ = 0** | same |
| docs paths / boot trigger / `.rs` files | 23 / 4 / 0 | **23 / 4 / 0** | same |
| added lines / secret hits | 2 107 / 0 | **2 107 / 0** | same |
| rulings-section sha256, both refs | `6e91317b…` | **`6e91317b…` on both** | same |
| `app-shell` census, base -> tip | C-05,C-10,C-11 -> +C-16 | **same** | same |
| current merge vs `main` | base `ad5a0df`, 36 / 24 / ∩ 0 | **`ad5a0df`, 36 / 24 / ∩ 0** | same |

**NOT ONE PATH LIST OR COUNT MOVED.** No collision reached this pass.

**ONE FIGURE WAS WRONG ANYWAY, AND IT WAS MY OWN MISREADING, NOT A
COLLISION** — which is the useful half of paying this cost. The rebase
justification above cited the two fixtures as `+199` and `+47`. **`git
diff --stat` prints TOTAL CHANGED LINES, not insertions.** `--numstat`
gives **173/26** and **40/7** (and 173+26 = 199, 40+7 = 47, 173+40 = 213
insertions — the stat footer I had already read and not reconciled).
Corrected in place above with the old text kept, per this repository's own
practice for a signpost the measurement has overtaken. **The ruling does
not move**: main rewrote both fixtures substantially under this lane
either way, which is the whole of the argument.

**WHY THE `arch` FIGURES DID NOT NEED THE SAME TREATMENT — derived, not
waved through.** Two independent grounds. First, those outputs are
**self-authenticating**: the before-column file's first line names
`/Users/ujju/Projects/scratch-T-033-base/docs/architecture/graph.json`, a
directory created by this pass alone, and the after-column lists
`component C-16 Shared primitives`, which exists on no other branch in
this repository. No other session's output could wear either string.
Second and better, **there is a git-sourced witness that never touched
scratch at all** — the dogfood body's own title, read straight out of
each ref:

    git show ad5a0df:app/test/architecture-dogfood.test.ts
      it("the full relation table: 14 confirmed, 12 undeclared, 9 planned"
    git show 935693f:app/test/architecture-dogfood.test.ts
      it("the full relation table: 26 confirmed, 1 undeclared, 9 planned"
      expect(derived.fileComponent.size).toBe(178);
      expect(drift).toEqual(["C-10"]);
      expect(derived.components.filter((c) => c.nonCode).map((c) => c.id)).toEqual(["C-01", "C-11"]);
      expect(derived.findings.filter(isDriftFinding).map((f) => f.id)).toEqual(["D1:C-10->C-14"]);

Those are ASSERTIONS, not labels, and the suite carrying them ran
**962/962 green** at this tip — so the relation tally, the file count, the
drift set and the surviving undeclared row are confirmed from a second
source with no scratch file anywhere in the path. *(Counting the raw
`"confirmed"`/`"undeclared"`/`"planned"` strings over the body is NOT a
valid check and is recorded so nobody repeats it — it returns 15/12/9 and
28/6/10, because the comments around the rows contain the words too.)*

**SUITES RE-RUN AFTER THIS WRITE, AND THE THIRD DERIVED AS NOT OWED.**
The docs gate names five content readers of a `docs/tasks/` path — three
in `lib/parser`, two in `app` — and two FILE-LIST readers in `tools/e2e`
(`shell-frame.spec.ts`, `window-contract.spec.ts`) that `walk()` `docs/`
and consume the listing. **This edit appends prose to an existing card and
adds or removes no file under `docs/`**, so the e2e pair's answer cannot
move; that is the same derivation this repository already records for
`docs/STATE.md`, applied to its own case rather than quoted. `npm test`
from `tools/e2e/` was green at 146/146 on the write that DID add a file
(`T-033-s11`, port 15293) and again at 146/146 on port 15294.

**THE STANDING FIX, so this costs the next pass nothing:** scratch files
get a directory named for the pass — `scratchpad/T-033-verify/` — or,
better where the answer is one number, no file at all. `diff <(a) <(b)`
and `comm -12 <(a) <(b)` answer every set-identity question in this
verdict without writing a byte, and nothing a concurrent session does can
reach them.

**THE VERDICT IS UNCHANGED: APPROVED at `935693f`.**

## Integration

Merged 2026-08-25 by a third hand that neither built nor verified this
card. Main-before **`1ed6ae9`** (T-102's checkpoint), lane tip
**`642577e`**, merge **`8f8ec31`**, checkpoint the commit after it.
`review: same-model` per T-104's ruling SEVEN — the independence that
pays is INFORMATIONAL, not model diversity.

**THE TIP WAS NOT THE ONE I WAS DISPATCHED AGAINST, AND THAT IS THE
FIRST THING THIS SECTION SHOULD SAY.** The brief named `c259f87` as the
verdict commit. The branch was at **`642577e`** — the verifier's second
pass, which re-derived every range and count inline after a
shared-scratch hazard and corrected one figure (`--stat` totals read as
insertions: `+199/+47` is `173/26` and `40/7` by `--numstat`). I merged
the TIP, having proved `c259f87` is an ancestor of it and that the
advance touches exactly one file — this card. Merging the brief's sha
would have discarded a verifier's own correction and shipped a figure
already known wrong.

**THE PROCESS VIOLATION HAPPENED TWICE ON THIS LANE, NOT ONCE.** Both
verdict commits were written by repointing the shared branch ref with
`git update-ref` from a detached worktree rather than committing inside
the lane. **The proof is in the reflog and it is unambiguous**:
`task/T-033-zero-drift-registry@{0}` and `@{1}` carry EMPTY reflog
messages, while `@{2}` and every entry below it read `commit:`. The
second one landed AFTER the dispatching pass had already repaired the
worktree, so it re-staled the same index a second time. When I arrived
the lane worktree reported a staged deletion of 114 lines from this
card — which was **staleness, not dirt**, proved rather than assumed: the
working file's sha256 (`976040fc…`) is byte-identical to `c259f87`'s
blob while HEAD was `642577e`. One `git add -A` there would have
committed a revert of the verifier's second pass. Nothing was lost:
`935693f` and `c259f87` are both ancestors of `642577e`. Routed to
**`T-128`** and **`T-104`**; the verification was NOT re-run, because the
mechanism was wrong and the finding was not.

**THE RANGE, AT MY OWN REFS.** `git merge-tree --write-tree 1ed6ae9
642577e` exit **0** (read from `$?` BEFORE the substitution), tree
`f6ba7731…`; prescribed `git diff --name-only 1ed6ae9 <TREE>` = **36**;
three-dot = 36, `diff` exit 0; main's advance `ad5a0df..1ed6ae9` = **34**;
intersection **EMPTY**; forbidden two-dot = **70**, and 36 + 34 = 70 with
the union byte-identical to the two-dot set, so the two are disjoint as
SETS and not merely as counts. The merge's own diff `1ed6ae9..8f8ec31` is
**36**, identical to the forecast, and `git rev-parse HEAD^{tree}` equals
the forecast tree byte for byte — **nothing was written into the merge
commit.**

**ALL THREE GATES FIRED.** GRAPH REGEN 12 of 36 → regenerated at the
checkpoint, and **TWICE**, which is the reusable finding: the first regen
went CURRENT at 925 217 bytes, then reconciling the deferred fixture
assertion moved `architecture-dogfood.test.ts` from `loc 1754` to `1755`
and `index --check` went STALE again **with every headline count
identical** — same bytes, same 178 files, same 1968 symbols, same 1886
edges. A checkpoint that regenerated once and compared byte counts would
have shipped a stale graph and had no number that could tell it. BOOT
GATE 4 of 36, exit **0**, port 15296. DOCS GATE 24 of 36, exit **1**,
**all FOUR suites owed** and all four green, 0 frontmatter issues.

**THE ONE DEFERRED ASSERTION WAS EXACTLY ONE, AS PROMISED.** The lane
left `["C-05","C-12","confirmed", 32]` with a comment addressed to the
integrator. Asked rather than predicted: the post-regen app suite came
back **961/962 with that single row red** at `expected 32, received 33`,
and **962/962** once moved. `map-dogfood-render.test.tsx` did not move
and the parser pin held at 268/268 — the lane's forecast was exact.

**ONE THING THE BRIEF AND THE VERDICT BOTH MISSED, AND IT BLOCKS THE
SUITE.** `npm run build` from `app/` fails at **exit 2** on a merged main
with `TS2339: Property 'nonCode' does not exist on type
'ComponentRecord'` — because this card adds `nonCode` to
`lib/parser/src/types.ts` and `lib/parser/dist` is a BUILD ARTIFACT that
no merge updates. CONVENTIONS' fresh-clone ORDER already governs it
(lib/parser first, then app) and it bit in a fully-installed checkout,
which is the case that order is not usually read as covering. `npm run
build` from `lib/parser/` clears it. This is also `integrator.md` rule
2's channel — and it is CLOSED here by measurement rather than by
assumption: both `@nputer/parser` symlinks are RELATIVE
(`../../../lib/parser`), so each resolves inside its own checkout and the
human's app has its own `dist/`. Rebuilding main's parser cannot reach
the running product.

**THE FENCE WAS NOT WIDENED, AND THE ONE PATH OUTSIDE IT IS THE
VERIFIER'S OWN DISCLOSURE**, carried forward rather than smoothed over:
`docs/decisions/015-indexer-rust-derivation-ts.md` is in no component's
`paths:`, no `touch_slugs:` and no card's `touches:`. Criterion 5 and the
architect's ruling both require the edit, so it was written on the card's
own authority and routed as **`T-033-s4`**.

**`docs/ARCHITECTURE.md`'s derived slug block did not know C-16 existed**
— correction 4 of the verdict's four, out of fence for the lane and
therefore the checkpoint's by written rule. Fixed here: `app-shell ->
C-05, C-10, C-11, C-16`. **No gate in this repository reads that block**,
which is `T-089-s7`'s argument for computing it instead.

The eleven `T-033-s*` findings stay `status: suggested` exactly as filed,
`T-033-s11` included — triage is not the integrator's (T-083's ruling).
