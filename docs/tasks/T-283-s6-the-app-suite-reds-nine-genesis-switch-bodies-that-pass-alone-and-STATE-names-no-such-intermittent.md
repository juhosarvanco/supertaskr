---
id: T-283-s6
title: "The app leg redded nine bodies of `app/test/genesis-switch-truth.test.tsx` at one tip and ran GREEN over the same 1171 bodies at that same tip minutes later — the file passes 10/10 alone, and docs/STATE.md's hazard list names no app-suite intermittent for the next seat to attribute it to"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-283 phase 2, 2026-09-09, measured on the bench /Users/ujju/Projects/nputer-V-T-283 at f4c9c3f5980da128fa0b9017e4c159e759600e9d"
blocked_by: []
touches: [docs/STATE-template.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

Three readings of the same suite against the same tree
`f4c9c3f5980da128fa0b9017e4c159e759600e9d`, on the bench, minutes apart:

| run | command | result |
|---|---|---|
| 1 | `node tools/e2e/scripts/gate-run.mjs app` | **exit 1**, RED, 1171 bodies — 9 failures, all in `test/genesis-switch-truth.test.tsx` |
| 2 | `npx vitest run test/genesis-switch-truth.test.tsx` from `app/` | **exit 0** — 1 file, **10 passed** |
| 3 | `node tools/e2e/scripts/gate-run.mjs app` | **exit 0**, GREEN, 1171 bodies |

The first failure carried a 5011 ms duration against sibling failures at
33–1239 ms, and the assertions read `expected null not to be null` on
screen queries — the signature of a DOM test losing its rendezvous window
under load rather than of a broken assertion. Several lanes and an
integration merge were live on this machine at the time; `lane-protocol.md`
rule 4 already measures this exact shape from the other side
(**2 failed / 169 passed**, then **171 / 171** alone) and calls the
artifacts collision artifacts rather than defects.

**The gap is not the flake; it is the ATTRIBUTION.** `roles/verifier.md`
step 0 says STATE matters most to this seat because *"the named
intermittents live there, and misattributing a red to the diff is this
seat's most common failure"* — and `docs/STATE.md` at this ref names none
for the app suite. A seat meeting run 1 with a prose-only diff in hand has
nothing to attribute it to and will spend the hour on its own change.
`T-281-s8` is the same class already filed for the **rust** suite, which
is what makes this a pattern rather than an incident.

## Acceptance criteria

- WHEN a seat reads docs/STATE.md's standing hazards THE app suite's
  `genesis-switch-truth` bodies SHALL be named as a load-sensitive
  intermittent, with the re-run-once-then-attribute-by-name move beside
  them, exactly as the rust case is.
- WHEN the entry is written THE reading that decides it SHALL be the
  solo run of the named file, so a seat can tell a collision artifact
  from a defect in one command rather than by re-running the whole leg.
- IF the bodies are made robust to load instead THEN the STATE entry is
  not owed and the card closes on the fix, naming the mechanism that
  made the window deterministic.

## Implementation notes

## Verdicts
