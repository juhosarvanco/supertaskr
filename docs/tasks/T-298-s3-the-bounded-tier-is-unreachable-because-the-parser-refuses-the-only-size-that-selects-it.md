---
id: T-298-s3
title: "The bounded tier is UNREACHABLE: the classifier selects it on size XS and the parser refuses XS as an invalid field, so no live card can carry the size that would ever reach the cheapest tier — measured by a card that tried"
feature: F-04
milestone: 4
size: S
priority: 1
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-298, measured at 885153d11a92a913382e0da2032982c21b6e0e0f, 2026-09-11"
blocked_by: []
touches: [lib/parser/src/types.ts, lib/parser/test/task.test.ts, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

ADR-024 decision 1 gives this project three tiers and the cheapest of
them is bounded. `method/tasks/TASK-FORMAT.md`'s tier table selects it on
size XS, and the arm's classifier reads that same size — a branch on `XS`
is the only route to a `bounded` verdict, and every other size falls
through to standard or guarded.

The parser will not let a card carry that size. `lib/parser/src/types.ts`
declares the legal set as S, M and L, and a card declaring anything else
is an `invalid-field` issue in the model. Three suites read the live
board and require it to parse with ZERO issues — the parser's own smoke
body, the app's architecture dogfood, and the shell frame's parse-error
count in the end-to-end lane.

So the tier a project would reach for on its smallest changes is
selectable only by a card the tree refuses to hold.

**HOW IT WAS MEASURED, and it was not by reading either file.** A
suggested card filed from the T-298 lane declared `size: XS` because the
tier table names that size. The battery answered: parser 388 of 389 with
`field 'size' must be one of S | M | L, got "XS"`, app 1170 of 1171 on
the same issue reaching the dogfood layer, and the end-to-end lane four
bodies down where the frame's parse-error list is counted, 60 expected
against 61 received. One illegal word in one frontmatter field, three red
legs, and the only thing wrong with the card was that it used the tier
table's own vocabulary.

The repair is a ruling rather than a patch: either the size set gains XS
and the three suites go with it, or the tier table stops selecting on a
size the model cannot hold and names its own condition. Whichever way it
goes, the two documents must stop disagreeing — today a project following
the method's tier table writes a card its own parser rejects.

## Acceptance criteria

- WHEN a card declares the size the tier table names for the bounded tier
  THE parser SHALL accept it as a legal field, or the tier table SHALL
  stop naming a size the parser refuses.
- WHEN the arm classifies a card that meets every bounded condition THE
  verdict SHALL be reachable end to end, from a card that lives in the
  tree, with a body proving it.
- WHEN the live board is parsed after the change THE three suites that
  require zero issues SHALL be green.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
