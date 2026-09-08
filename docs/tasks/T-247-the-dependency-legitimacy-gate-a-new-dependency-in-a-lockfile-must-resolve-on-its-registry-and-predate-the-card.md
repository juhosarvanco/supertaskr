---
id: T-247
title: The dependency-legitimacy gate — a dependency a lane adds must resolve on its registry and predate the card, so a hallucinated or typosquatted package cannot ride a merge into main
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — the security layer GSD Core ships (its package-legitimacy gate) and nputer lacks (T-245, map conclusion 6)"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## Why this card exists

An agent that invents a package name is the supply-chain attack of
this era: the name gets registered by someone else, the next install
pulls it. GSD Core gates this at the write (its Package Legitimacy
Gate, docs/explanation/security-model.md layer 1). nputer's landing gate
has six disclosed limits and none of them looks at a lockfile. The
census (docs/CAPABILITIES.md) has no sentence about dependencies.

## Acceptance criteria

- WHEN a lane's diff adds or changes an entry in a lockfile or manifest
  the tree already uses (package-lock.json, package.json, Cargo.lock,
  Cargo.toml — derive the set from the tree, never list it here) THE
  landing gate SHALL resolve each added name on its registry and refuse
  the landing, naming the package, IF the name does not resolve.
- WHEN the added name resolves THE gate SHALL compare the package's
  first publication date with the card's `suggested_by` date and refuse
  IF the package is YOUNGER than the card, naming both dates — a
  package registered after the card was written is the attack's shape.
- IF the registry cannot be reached THEN THE gate SHALL refuse closed
  and say so (a guard that cannot verify never answers "safe" — the
  same rule GSD's isolation guard states in its own header).
- The refusal SHALL be a disclosed limit like the six before it, with
  its positive control: a fixture lockfile carrying a name that does
  not exist reds the body BY NAME.
- CAPABILITIES SHALL be regenerated; docs/VERSIONS.md's row SHALL be
  updated at the merge.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
