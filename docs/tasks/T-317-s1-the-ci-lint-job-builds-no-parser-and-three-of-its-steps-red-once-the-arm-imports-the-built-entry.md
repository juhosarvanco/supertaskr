---
id: T-317-s1
title: "The CI lint job installs tools/e2e and nothing else, so the three steps that load the dispatch arm red once the arm imports the parser's built browser entry — the two steps every other job already carries, added there and kept by the parity body"
feature: F-04
milestone: 4
size: S
priority: 1
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-317, measured in the lane and reported in its notes; the lane's fence carries no workflow file, so it could not repair it"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-317 moved the process settings reader into the parser library, and the
dispatch arm now imports that library's BUILT browser entry. Every script
under the e2e package that loads the arm therefore needs the parser build,
which the project's fresh-clone order already puts first and which every
CI job but one already runs.

The exception is the lint job. It installs the e2e package and nothing
else. Measured in the T-317 lane by moving the parser's build output aside
and running that job's steps by hand: the e2e typecheck answers 2 with a
TS2307 naming the built entry, the docs gate answers 1, and the census
currency check answers 3 with the arm's own refusal text naming the build
order. With the build present all three are green, which is how the lane
measured them.

The repair is the two steps the app job and the rust job already spell:
the parser install and the parser build, in the parser package, before the
lint job's own steps. Nothing else moves.

## Acceptance criteria

- WHEN the lint job runs on a clean runner THE parser SHALL be installed and built before the steps that load the dispatch arm, spelled the way the other jobs spell it, and the three steps named above SHALL answer 0.
- WHEN the workflow parity body runs THE new steps SHALL be accounted for by it rather than left as an unjudged pair, so a later job that loads the arm without the build is a red rather than a surprise.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
