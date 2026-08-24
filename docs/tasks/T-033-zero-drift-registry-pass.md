---
id: T-033
title: Zero-drift registry pass — umbrella shared-primitive story + non-code D3 story
feature: F-06
milestone: 4
priority: 17
size: M
status: building
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-map]
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
