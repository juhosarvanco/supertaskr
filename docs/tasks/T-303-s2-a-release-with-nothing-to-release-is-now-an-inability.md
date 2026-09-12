---
id: T-303-s2
title: "A release asked by a session that cannot name itself is an inability even where there is nothing to release — rule whether a VACANT integration checkout answers CANNOT RUN or a clean nothing, and pin the answer with a body either way"
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-303-s1
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**WHAT MOVED, AND WHY IT MOVED.** T-303-s1 made both ownership commands
derive the acting session's identity BEFORE they branch, because the
release path used to retire a claim without ever asking which session
was retiring it. The precondition is right and the card's own criteria
rest on it. Its side effect is that the refusal now reaches a case that
has nothing to do with ownership at all: a release asked of an
integration checkout where NO record exists. That used to be a clean
nothing and is now CANNOT RUN, because the identity is derived before
the state is looked at.

**WHY IT IS WORTH A RULING RATHER THAN A PATCH.** Both answers are
defensible and the choice is a contract, not a bug. "A session that
cannot name itself cannot retire a claim" is the sentence the
precondition was built on, and a vacant checkout is genuinely a claim
this command did not establish anything about. Against it: a cleanup
step that releases a seat it may never have taken now has to tell an
inability from a failure, and a runner with no harness in its ancestry
is exactly where that step runs. Nothing in the tree states which of
those the command owes.

**THE SHAPE OF THE WORK.** Read the four-code contract the command
already keeps, rule the vacant case against it, and pin whichever answer
is ruled with a body that drives the command in a checkout with no
record from an ancestry carrying no harness. Today no body asserts
either sentence for that case, so the behaviour can move again without
anything going red — which is the part that is unambiguously wrong
whichever way the ruling goes.

## Acceptance criteria

- WHEN a release is asked of an integration checkout holding NO record,
  by a session whose identity cannot be derived, THE command SHALL
  answer the ruled code and SHALL say which of the two sentences it is
  saying.
- WHEN that case is exercised THE suite SHALL carry a body asserting the
  ruled code, and a positive control proving the same command answers
  differently for a session whose identity IS derivable.
