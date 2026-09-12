---
id: T-317-s2
title: "The CLI's doctor declares `parser-build` for one verb and not for the seven that front the dispatch arm's own scripts, so an installed package answers a module-resolution error where it has a named repair to give"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-317, noticed while moving the reader into the parser library; cli.mjs is outside that lane's fence"
blocked_by: []
touches: [tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The CLI's verb table carries an `alsoNeeds` field and the doctor behind it
turns `parser-build` into a named diagnosis with the build command beside
it. Exactly one verb declares it today.

Since T-317 the dispatch arm imports the parser's built browser entry, so
every verb whose target script loads that arm needs the same build: the
board census, the dispatch view, the brief, the card ledger, the preflight,
the fence writer, the seat, the settings command and the merge. On a tree
with no parser build each of those now ends in a module-resolution error
rather than in the doctor's sentence — the arm's own refusal names the
build order, which is better than nothing and is still not the line the
doctor exists to print.

## Acceptance criteria

- WHEN a verb fronts a script that loads the dispatch arm THE verb SHALL declare the parser build among what it also needs, so the doctor names the missing build and the command that repairs it rather than letting the loader speak.
- WHEN the verb table is read by a body THE set of verbs declaring that need SHALL be derived from which target scripts reach the arm rather than typed, so a verb added later cannot miss it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
