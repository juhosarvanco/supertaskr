---
id: T-298-s3
title: "The bounded tier is UNREACHABLE: the classifier selects it on size XS and the parser refuses XS as an invalid field, so no live card can carry the size that would ever reach the cheapest tier — measured by a card that tried"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "executor claude-opus-5@subagent @T-298, measured at 885153d11a92a913382e0da2032982c21b6e0e0f, 2026-09-11"
blocked_by: []
touches: [lib/parser/src/types.ts, lib/parser/test/task.test.ts, method/tasks/TASK-FORMAT.md, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/session-economics.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

## Amendment of 2026-09-13 — the bounded size vocabulary (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — the bounded size vocabulary. The selected repair is to add XS to the parser's legal sizes and the task format's size vocabulary, preserving S, M and L. The arm's existing bounded conditions and guarded overrides are unchanged; XS is necessary under that selector and is not sufficient by itself. The fence additionally grants tools/e2e/tests/brief.spec.ts. A body takes a tracked fixture card through parsing and the arm's classification and reaches bounded only when every current bounded condition holds; controls retain the guarded-path result and the existing refusal or standard result when the keeper conditions are unmet. Existing invalid-size refusals remain, and the live-board checks already required by this card still run. The owner chose the XS route on 2026-09-13, as the review recommended.

## Widening of 2026-09-14 — the seat's, both halves (the lane's second ask)

The XS ceremony row goes FIRST, because the ceremony table is written lightest-first and a tool in this tree (lightestTier in tools/e2e/scripts/session-economics.mjs) reads it as such; that reds one body of tools/e2e/tests/session-economics.spec.ts, which had the size S typed into it as the lightest tier. The fence gains that spec so the lane replaces the typed value with the invariant this card creates — the lightest ceremony row and the size the tier table admits bounded on are one size — while the body's mutant arm stays as it is. The consequence the lane measured — the seat-verdict size signal reads S as TRY instead of KNOW once XS is the lightest row, 487 of 701 sized cards at 9d7a1582 — is a change in what the advisory recommends, not ruled by the amendment, and is filed by the lane as its own card rather than decided here; tools/e2e/scripts/session-economics.mjs stays outside this fence.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 1 — the bounded tier is unreachable: the classifier selects on a size the parser refuses, so the cheapest tier of ADR-024 decision 1 can never run. Not dispatched by this sitting.
