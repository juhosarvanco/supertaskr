---
id: T-250
title: Name the gate taxonomy in CONVENTIONS — pre-flight, revision, escalation, abort — the four types nputer already runs (preflight, the docs gate, the landing gate, the push guard, the bounded fix pass, rooms, stop-the-line) and never named
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's references/gates.md names four types; the seat's walk of the unruled list found nputer has all four unnamed"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

A reader of CONVENTIONS meets the card preflight, the docs gate, the
six-limit landing gate, the push guard, the fix-pass loop with its
rework count, the rooms and the stop-the-line rule as separate
sentences and never learns they are four kinds of one thing. GSD Core's
taxonomy (pre-flight: block entry; revision: loop with a cap and stall
detection; escalation: pause for the human; abort: stop and preserve
state) names them in a page. Naming ours is documentation, not
behaviour; it also exposes the one we run without a cap.

## Acceptance criteria

- WHEN CONVENTIONS is read THE document SHALL carry one short section
  naming the four gate types, and for each type the nputer gates of
  that type BY THEIR EXISTING NAMES, with the cap or the escalation
  line each one has — and, where a revision gate has NO cap (the fix
  pass after a REJECTED verdict), SHALL say so rather than invent one.
- The section SHALL stay under the document's byte budget (the docs
  gate prints the line) and SHALL move no existing rule; it points at
  rules by their ordinal and capitals, never by line number.
- The method evals SHALL be run if any role file is touched (they
  should not be); the docs gate SHALL be run.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
