---
id: T-033
title: Zero-drift registry pass — umbrella shared-primitive story + non-code D3 story
feature: F-06
milestone: 4
priority: 17
size: M
status: building
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

## Verdicts
