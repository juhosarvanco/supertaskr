---
id: T-314-s1
title: "The two push guards compose the same arms in two places and nothing compares the two lists, so an arm added to the PreToolUse guard is silently absent from the pre-push hook and the one difference that is deliberate lives only in a header comment"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-314, measured at that card's own tip; the duplication is what that card's own design created and its criteria scope the hook to the token, the owed set and the unchanged-tree check"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

There are now two places that decide whether a push may proceed, and both
compose the same arms in the same order out of the same exported
functions. `decideWith` in `.claude/hooks/push-guard.mjs` runs the holder
arm, the landing gate, the cheap checks, the verdict token, the CI arm and
the graph check. `decideWith` in `.claude/hooks/pre-push-guard.mjs` runs
the holder arm, the landing gate, the cheap checks, a per-update verdict
token and the graph check.

The difference is one arm and it is deliberate: the CI arm makes a network
round trip with a fifteen-second hang bound, and a git hook runs on every
push including ones no session typed. That argument is written out in the
pre-push guard's header. Nothing anywhere enforces it, and nothing
enforces the six that ARE shared either.

So the next card that adds an arm to the older guard — and the older
guard has taken a new arm at T-203, T-212, T-237 and T-238 — adds it to
one of the two guards. The lane that does it will see every body in
`tools/e2e/tests/push-guard.spec.ts` pass, because every body about the
new arm will be written against the guard it was added to. The failure is
silent by construction: the pre-push hook's refusals are a subset of the
other's and a subset never reds anything, it just lets a push through.

The same holds for the ORDER, which both files argue is load-bearing: the
cheap checks run before the expensive ones, the landing gate runs before
the manifest is opened, the token arm runs before the graph. Two hand-kept
orders drift the way two hand-kept lists drift.

## Acceptance criteria

- WHEN either guard's arm list changes THE suite SHALL red naming the arm and the guard it is missing from, derived from the two modules rather than from a list a body holds, so a deliberate difference is recorded once and an accidental one cannot be silent.
- WHEN a difference is deliberate THE guard that omits the arm SHALL declare it in a place the derivation reads, so the CI arm's omission is data the check consults rather than prose beside it.
- WHEN that body runs THE derivation SHALL be shown failing on a copy of one guard with an arm removed, so the comparison is proved to reach the arms rather than asserted to.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
