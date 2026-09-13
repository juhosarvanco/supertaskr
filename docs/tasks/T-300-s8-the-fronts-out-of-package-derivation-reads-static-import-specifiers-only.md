---
id: T-300-s8
title: "The front's derivation of what a verb reaches outside its own package reads STATIC import specifiers only, so the parser library's built browser entry — loaded by a dynamic import in the dispatch arm and now in the settings command — is invisible to it, and an installed copy meets a module-not-found instead of the front's own CANNOT RUN"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300-s6, measured at that card's base and again at its tip; the blindness predates the card on both sides and is outside its criteria, which scope the reading to the settings command's own imports"
blocked_by: []
touches: [tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The front refuses a verb it cannot run rather than letting it die in the
middle, and the half that decides "can it run" for a reach outside the
package derives that reach from the script's own source. The derivation
matches an import specifier that arrives with a `from` keyword. A
dynamic import carries no `from`, so it is not matched, and the reach is
not derived.

Two scripts load the parser library's built browser entry,
`lib/parser/dist/pure.js`, exactly that way: the dispatch arm has since
T-317, and the settings command does since T-300-s6. Measured at
T-300-s6's tip, the derivation answers two reaches for the settings verb
— both of them hook files under the agent-hooks directory, reached
through a chain of static imports — and neither of them is the parser
entry. Every verb whose script reaches the arm reads the same way.

What that costs is the message. In a checkout with the parser built,
nothing: the entry is there and the front owes no refusal. In an
installed copy, or in a checkout where the parser has not been built,
the front finds no missing reach, runs the verb, and the process dies on
a load rather than on the front's own refusal. The arm's own catch still
names the build order for the verbs that reach the arm — which is what
saves this today — and the front, whose job the refusal is, never
formed an opinion.

The remedy the requirement check offers is also the wrong one for this
reach. Its sentence for an absent escape says to run from a checkout of
the project's own tooling rather than from an installed package; for a
missing `lib/parser/dist` inside a checkout the remedy is a build, and
the ADR-011 order names it.

## Acceptance criteria

- WHEN the front derives what a verb's script reaches outside its own package THE derivation SHALL see a dynamic import of a relative path as well as a static one, so a verb that loads the parser library's built browser entry names that reach; and a body SHALL show the derivation blind to a dynamically imported escape and seeing it after, with a positive control over a script whose only escape is a static one.
- WHEN the requirement check reports a reach that is a BUILD OUTPUT of this repository THE remedy it prints SHALL be the build that produces it rather than the sentence about running from a checkout, because a checkout that has not built the parser is exactly the tree this refusal will meet.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
