---
id: T-298-s4
title: "The bench arm's phase briefs name NO model for the seat they dispatch — the executor's brief prints the model as a read from the runtime template and the verifier's two spawns get it only as a stamped card field, so the one seat whose model the dispatcher types by hand is the one the arm renders for"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-298 phase 2, measured at 9169545120b54c6e0845efa6de1b65ed524bd3b6, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-298's second criterion says the model is read from the runtime
template and PRINTED IN THE BRIEF. The arm answers that in two places
and both are real: row 1 of the assembled brief carries
`model: <value> — read from <the template> as roles.<key>`, and the
dispatch's own lane facts carry one line per seat, with an override
announced as one. Every attack on those two lines failed at the
verification: a sentinel written into the live template moves the
printed value and moves back, and a deleted default refuses even with a
session model set in the environment.

The bench arm is the gap. `benchPlan` and the two renderers it drives —
`renderPhase1` and `renderPhase2` — dispatch the VERIFIER seat, which on
the guarded tier is two spawns, and neither rendered brief carries a
model line at all. Grepping both renderers for the word finds nothing.

The model does reach that seat, which is why this is a card and not a
rejection: the dispatch stamped `verifier:` on the card from the
template, and both phase briefs carry the card verbatim, so the value is
inside the block a seat reads. But it arrives as a frontmatter field
among fifteen others rather than as this seat's model, it is the STAMP
rather than a read, and nothing says which file it came from. The
practical consequence was visible in this very pass: the dispatching
seat hand-wrote the phase 2 spawn's model into a postscript outside the
arm's rendering, which is the exact hand-supplied value the criterion
exists to remove.

The repair is small and the reader is already there. `roleModel` and
`roleModels` are exported, the bench plan already knows the tier and the
card, and a phase brief that names its own seat's model closes the last
dispatch path where a model is typed rather than read.

## Acceptance criteria

- WHEN the bench arm renders a phase brief THE seat's model SHALL be
  read from the runtime template's role defaults and printed on its own
  line in that brief, naming the file and the key it was read from,
  exactly as the assembled brief's row 1 does.
- WHEN the template names no model for the verifier THE bench SHALL
  refuse before it writes a ground file, a seal or a brief, naming the
  role, the key and the file.
- WHEN a body drives both phase renderers THE model line SHALL be
  discriminated by a value planted in the fixture's own template and
  present nowhere else in that tree, so a value remembered from the card
  or from the session cannot satisfy it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
