---
id: T-299-s1
title: "The merge side's process bodies live in the brief's spec because T-299's fence named that file, and a body about the merge verb belongs in the merge verb's own spec — three bodies and two imports to move"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-299, measured at 689a66c3cf99c1963d170d9e47734746cdcf708a, 2026-09-10"
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-299 wired two of the six named behaviours into the merge verb:
`keeperSteps` reads `merge.keepers` and `regenPlace` reads
`merge.regen_graph` and `merge.regen_census`. The bodies that hold
those reads are in `tools/e2e/tests/brief.spec.ts`, which imports
`keeperSteps`, `regenPlace` and `tailPlan` out of the merge verb to
get at them.

That is a fence artefact and nothing else. T-299's `touches:` named the
brief's spec and not the merge's, so a body about the merge had nowhere
else to go, and the lane said so in its own comment rather than widening
the fence by hand. The result is that a reader looking for the merge
verb's behaviour finds two of its steps asserted in another file, and
the behaviour census attributes them to the wrong capability heading.

## What a fix looks like

Move three bodies and their two imports:

- THE REGENERATIONS' PLACE IS READ FROM THE SECTION
- THE CHEAP KEEPERS ARE READ FROM THE SECTION
- THE STANDARD PROFILE REPRODUCES THE MERGE PLAN THIS VERB BUILT BEFORE
  THE SWITCHES EXISTED

The third is the no-regression keeper and belongs beside the merge
verb's other plan-shape bodies for the same reason as the other two.
Nothing about the producers changes; this is a move, and the census
regeneration at the merge is what proves it landed.

## Why it was not done in T-299

`tools/e2e/tests/merge.spec.ts` is outside that card's fence. A lane
that edits a file its card did not fence is the class of write the lane
fence exists to refuse, and moving the bodies is cheap enough that
widening the fence for it would have cost more than filing this.

## Acceptance criteria

- WHEN the merge verb's process bodies are read THEY SHALL be in the
  merge verb's own spec file, and the brief's spec SHALL no longer
  import from the merge verb.
- WHEN the behaviour census is regenerated THE three sentences SHALL
  appear under the merge heading rather than the brief heading.
