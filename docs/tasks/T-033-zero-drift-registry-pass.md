---
id: T-033
title: Zero-drift registry pass — umbrella shared-primitive story + non-code D3 story
feature: F-06
milestone: 4
priority: 17
size: M
status: planned
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-008-s2, T-011-s2. Triage 2026-08-16: the map's two classes
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
    closes as accept-and-record);
(2) non-code story — a component-file field (`non_code: true` or the
    existing layer vocabulary) downgrading D3 to informational for
    C-01/C-11, OR accepted permanent amber recorded in their prose.

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

## Implementation notes

## Verdicts
