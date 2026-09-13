---
id: T-300-s9
title: "Loading the parser library's built browser entry is spelled once per consumer in tools/e2e, each with its own catch naming the same build order, and the newest consumer carries no message at all because evaluation ORDER hands it somebody else's"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300-s6, noticed while adding the fourth consumer; the duplication predates the card and is outside its criteria, which scope the change to which module the settings command reads the loop through"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/settings.mjs, tools/e2e/tests/dispatch-order.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The e2e package declares no dependency on the parser, so every consumer
inside it loads the parser's built entry by relative path and refuses
loudly when the build is absent. There are three such refusals, each
written out where it is used: the dispatch arm's, for the browser-safe
entry; the dispatch-order module's, in a named loader for the root
entry; and the suite's preflight assertion, which checks the file into
existence before any body runs. All three name the same ADR-011 build
order in their own words.

T-300-s6 added a fourth consumer and DID NOT add a fourth message, on
purpose and with the reason written beside it: the settings command
imports the arm statically, the arm is evaluated before the command's own
body, and the arm's catch is measured to be the one that prints. A copy
of the message in the command would be a refusal no arrangement can
reach. That reasoning is sound and it is also fragile in a way worth
naming: it holds only while the command keeps importing the arm, and
nothing in the tree says so.

The shape the repository already has for this is the dispatch-order
module's named loader, which exists so the refusal has one spelling and
a body can drive it. What is missing is that the other consumers use it.

## Acceptance criteria

- WHEN a script under the arm's own directory loads the parser library's built entry THE load SHALL go through ONE named loader carrying ONE refusal that names the build order, and every such site SHALL call it rather than spelling a catch of its own — the browser-safe entry and the root entry being two arguments to the same loader, not two loaders.
- WHEN that loader refuses THE refusal SHALL be reachable from a consumer that spells no message of its own, and a body SHALL drive it there rather than at the loader alone, so the guarantee stops resting on which module a runtime happens to evaluate first.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
