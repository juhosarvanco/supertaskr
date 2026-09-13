---
id: T-300-s11
title: "The settings listing's readings reader catches EVERY failure and answers with an empty map, so a corrupt meters file, an unreadable tree and a project that has simply never merged anything are one answer on the listing — and the one that is a defect is the one that looks like the other two"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300-s7, noticed while constructing the empty-window fixture; the card's criteria ask the body to assert the empty window honestly and say nothing about how the reader reports a failure"
blocked_by: []
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The settings listing reads the loop bands off the tree through one
function whose whole body sits inside a try with a bare catch that
answers with an empty map. The comment above it argues the right thing
for the case it was written for: a project that adopted this method last
week has no merges, no meters file and possibly no git history, and the
honest rendering there is every switch against the seat's estimate.

The catch is wider than that argument. A meters file with one truncated
line, a git that cannot answer, a records file the process cannot read —
every one of them lands in the same catch and produces the same empty
map, and the listing then prints exactly what it prints for the healthy
new project: every switch at the seat's estimate, awaiting its bands.

The band report does not have this problem, and the difference is
instructive rather than incidental. A line the reader could not
understand takes every loop band DARK there, deliberately, and the run
exits 3 — "this run is not a claim about the tree". The listing has no
such vocabulary: it has a reading and an estimate, and a failure wears
the estimate's clothes.

T-300-s7 constructed a populated window and an empty one and asserted
both. Neither is this third state, and neither body could see it: a
reader that threw would have produced the empty window's own output.

## Acceptance criteria

- WHEN the readings reader cannot answer for a reason that is NOT "this project has recorded nothing" THE listing SHALL say so on its own line, naming what it could not read, rather than rendering the same page a project with no records gets.
- WHEN the reader answers empty because the project genuinely carries no record THE listing SHALL keep the text it prints today, so the new-project case is unchanged and the difference between the two is visible on the page.
- WHEN a body drives this THE failing arrangement SHALL be constructed — a meters file whose last line is truncated, which is the shape a crashed append leaves — and the body SHALL red if the listing's two answers are made identical again.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
