---
id: T-248-s5
title: The gate's root is derived from the script's own location, so a body that tests what the gate PRINTS must plant a real file under docs/ — the injection scan has no injectable root
feature: F-06
milestone: 4
size: S
priority: 25
status: planned
suggested_by: the T-248 rework executor, 2026-09-08, met while writing the body the verdict of 2026-09-08 asked for
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`reportInjectionScan(docsPaths, root, patterns)` takes its root as a
parameter, and the spec already spends that seam — the body that proves
a broken pattern is absorbed calls it directly with a captured
`console.log`. The BINARY has no such seam: `repoRoot` in
`docs-scan.mjs` is `path.resolve(here, "..", "..", "..")`, derived from
the script's own location, and the CLI accepts no override. So a body
whose subject is what the GATE PRINTS — as against what `scanInjection`
RETURNS — has exactly one way to give the gate a fixture: write a real
file under this repository's own `docs/` and remove it afterwards.

## What that costs today

The rework body added for criterion one's *each hit* limb does exactly
that: it writes `docs/rooms/zz-each-hit-T-248.md`, runs the real binary
over it, and removes it in a `finally`. Measured at `80fdd70`, the
tree is clean before and after the full 53-body run. Two residuals
remain, and neither is repaired by care:

- a run killed between the write and the `finally` leaves a file under
  `docs/` whose whole content is planted injection payload — in the tree
  the app's watcher is armed over, and in the corpus the merge-time
  census of criterion five reads;
- the lane's own suite therefore writes outside its fence at run time.
  That is an accepted class here (the token lint plants a control byte
  into seven tracked files, one of them under `docs/`), but it is a
  class this body did not have to join.

## Acceptance criteria

- WHEN the gate is invoked THE root it resolves docs paths against
  SHALL be reachable without moving the script — an argument, an
  environment read, or an exported entry point the spec can call with a
  root — so a body can drive the PRINTED form over a scratch tree.
- IF the seam is an argument on the CLI THEN the four exit codes and
  every documented invocation SHALL be unchanged, measured through the
  real binary.
- THE body added at `80fdd70` SHALL be moved onto the new seam, or its
  fixture write SHALL be argued in writing as the better of the two.
  Deleting the body is not one of the moves — it is the only defence
  criterion one's *each hit* limb has.

## Implementation notes

## Verdicts

## Triage (2026-09-08, the wave sitting)

Promoted as filed, F-06 milestone 4, S, p25: the binary gains a root
override so a body testing what the gate prints runs against a scratch
tree, and the one body T-248's rework planted under docs/ moves onto it.

## Acceptance criteria

- WHEN the docs gate binary is run with a root override (an environment
  variable named in CONVENTIONS, refused when it does not resolve to a
  directory holding a docs/ tree) THE gate SHALL derive its paths, its
  census and its printed spelling from that root and never from the
  script's own location.
- WHEN the override is absent THE gate SHALL behave exactly as today (a
  body pins the default root byte-for-byte against `repoRoot`).
- WHEN the "EVERY hit in one file is printed" body runs THE fixture
  SHALL live in a scratch tree under the override, and `git status
  --porcelain` in the checkout SHALL be empty before and after the run
  with no `finally` needed.
- IF the override names a path outside a repository THEN the gate SHALL
  exit 2 naming it, never scan it.
