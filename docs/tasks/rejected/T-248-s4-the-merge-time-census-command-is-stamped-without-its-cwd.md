---
id: T-248-s4
title: The merge-time census command is stamped without its cwd, and this project's own STATE names that as a standing hazard
feature: F-06
milestone: 4
size: S
priority: 3
status: rejected
suggested_by: the T-248 blind verifier (claude-opus-5@subagent), 2026-09-08, measured at 1c60da3 on the bench
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-248's criterion five asks for the hit count "stamped in the checkpoint
record with its derive command". The command the lane derived is
space-safe and xargs-free, which is the hard part and is right:

    paths=(${(0)"$(git ls-files -z docs/)"})
    node tools/e2e/scripts/docs-gate.mjs "${paths[@]}"

It carries no cwd. docs/STATE.md's standing hazards open with **"A
COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT."**

## The measurement

From the repository root it reports `2 hit(s) in 2 of 739 path(s)` at
`1c60da3`, twice, identically. From `tools/e2e/` the same two lines
build an EMPTY array — there is no `docs/` below that directory — and
the gate exits 2.

The failure is therefore LOUD, not silent: the base gate's own
"AN EMPTY PATH LIST IS A FAILED RANGE, NOT A CLEAN GATE" refusal catches
it, and no wrong number can be stamped from the wrong directory. That is
why this is a suggestion and not a defect.

## Acceptance criteria

- WHEN a census figure is stamped in a record THE derive command SHALL
  carry the directory it is run from, in the shape the other commands in
  STATE and CONVENTIONS use.
- WHEN the command is run from a directory that cannot produce the
  corpus THE gate SHALL refuse rather than answer — already true, and
  the record SHALL say so beside the figure.

## Triage (2026-09-08, the wave sitting)

**discharged — the work landed at the wave checkpoint** (docs/checkpoints/2026-09-08-the-wave-sitting-the-break-lifted-five-cards-through-the-arm-four-merged-one-rejected-and-reworked-ci-green-the-guide-and-the-reference-written.md): the record stamps the injection census with its command AND its cwd ("from the repo root"), which is this card's whole ask; the standing-hazard line in STATE that names the class stays.
