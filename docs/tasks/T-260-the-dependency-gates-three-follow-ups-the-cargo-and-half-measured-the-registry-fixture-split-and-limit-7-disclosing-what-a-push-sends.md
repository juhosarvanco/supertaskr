---
id: T-260
title: The dependency gate's three follow-ups — the cargo AND half measured with a data mutant and its false header example corrected, the registry fixture split per registry and per field, and limit 7 disclosing what a push sends
feature: F-04
milestone: 4
size: S
priority: 10
status: planned
suggested_by: "the T-247 blind verifier, 2026-09-08 (three suggestions T-247-s1, T-247-s2, T-247-s3, absorbed at the wave sitting's triage)"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Three findings the T-247 verdict (APPROVED at b000d82) recorded rather
than blocked on, each a small edit to the landing gate's seventh limit
or its spec, collected into one lane because all three sit in the two
files the next landing-gate lane holds anyway.

## Why this card exists

T-247 closed the landing gate's seventh limit: a dependency a lane adds
must resolve on its registry and predate the card. The blind verifier
drilled fourteen mutants and thirteen died. The survivor, and two
fixture and disclosure gaps beside it, are the three halves below.
Guard-class: the subject is what a gate refuses, so `review:
independent` is set here rather than left to the default.

Absorbs: T-247-s1 (2026-09-08) — the cargo accumulation rule's AND half
(AND within one declaration, OR across declarations) is unmeasured, and
the `nputer-index` example the hook header and the notes cite to
justify it is false of this tree (derived at f6bc5c8).
Absorbs: T-247-s2 (2026-09-08) — the registry fixture answers every
field and both registries from one server, so neither the
first-publication field nor the per-manifest routing is measured (class
parent T-203: one arrangement decides two answers).
Absorbs: T-247-s3 (2026-09-08) — limit 7 prices three costs and not the
fourth: a push adding a dependency issues one outbound GET per added
name to registry.npmjs.org or crates.io from this machine under a
self-identifying user-agent (class parent T-223: the disclosure is the
fix).
The three files are removed in this commit; these lines are the
surviving record.

## Acceptance criteria

- WHEN a Cargo manifest declares one dependency in a form where the
  AND half decides (a declaration carrying both a registry-bound and a
  path-bound term) THE spec SHALL hold a body whose expectation is a
  frozen fixture, not the hook's own fold, and a DATA mutant flipping
  the fold to plain OR SHALL red it (verifier.md 2b: where the property
  lives in data, the mutant is a data mutant).
- WHEN the hook header justifies the AND half THE example it cites
  SHALL be one that is true of this tree at the card's ref, derived and
  named (the `nputer-index` example is retracted).
- WHEN the spec's registry fixture answers THE npm and crates
  registries SHALL be two servers (or one server routing by path) with
  distinct dates, so that a body pointing the npm variable at one and
  the crates variable at the other can red on a wrong route; and the
  first-publication field and the latest-version field SHALL carry
  distinct values, so a body can red on the wrong field being read.
- WHEN limit 7 is read THE header SHALL say what the check SENDS: one
  GET per added dependency name, to which host, from the pushing
  machine, under which user-agent, and that no other field of the
  manifest leaves the machine; and CONVENTIONS' landing-gate bullet
  SHALL carry the one sentence a seat needs before its first push.
- IF any of the three bodies cannot fail (its expectation derives from
  the code under test) THEN the lane SHALL say so and re-anchor it;
  every drill's landing read from `git diff`, restoration by sha256.
