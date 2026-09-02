---
id: T-216-s9
title: The landing gate ALLOWS a merge it could not judge when a fence token does not resolve in the guard's own environment — T-214's app-shell left one path unjudged and the push went out with a notice nobody reads
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: the architect seat, from the push guard's own notice at 8a1ee82, 2026-09-02
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding, verbatim from the guard

At the push of 8a1ee82 the guard printed: *"THE LANDING GATE DID NOT
JUDGE 1 of the 6 merge commit(s) this push would add: 57a410b (T-214):
1 path(s) sit outside the RESOLVED domains of a fence carrying
unresolvable token(s) app-shell — app/test/board-truth.test.tsx. The
push is allowed and those merges are UNJUDGED."* The lane's own hook had
allowed that edit, so the slug resolved in the lane and not at the guard
(T-219-s4's class: a token the guard's environment cannot expand). The
verdict on the undetermined case is an allow with a notice, the same
shape T-216-s8 is closing for the undeterminable push, one arm over.

## What is asked

When a fence token does not resolve at the guard, the landing gate
SHALL resolve it the way the lane's hook did — through the parser's
dispatch oracle at the merge's second parent — before declaring a path
outside; and where it still cannot, it SHALL refuse rather than allow
with a notice, naming the token and the remedy (a card whose touches
spell the path). A merge judged inside its fence is unchanged.

## Acceptance criteria

- A planted merge whose card fences a slug that resolves at the second
  parent is judged INSIDE by the gate; the same merge with the slug
  unresolvable at both refs is refused by name.
- The positive control demonstrated failing: the base gate allows the
  second arrangement with a notice.
- Existing push-guard bodies green; kill sets disjoint.
