---
id: T-319-s4
title: "The settings listing renders every switch and never the dispatch block: the generated reference chapter documents the approval mode, the recovery policy and the grant, and the command a reader actually runs shows none of them"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-319, noticed while adding the reference section; the listing reads a loaded process that carries the schema and the resolved switches only, and the function that loads it is outside that card's fence"
blocked_by: []
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-319 put the dispatch approval mode, the recovery policy and the grant
in the runtime template as one block, declared once in the process
schema, and rendered that declaration into the generated settings
reference. The reference says what the block IS. Nothing says what this
project's block SAYS.

The terminal's settings listing renders the profile and every switch at
the value this project resolves it to. It cannot render the block,
because the one function that opens the schema and the template off disk
answers a parsed schema and resolved switches and nothing else — so the
listing has the declaration and not the values. A reader who wants to
know whether work is running under a grant, and under which one, has no
command to ask.

This is the missing half of the surface rather than a defect in what
landed: the block is declarative until the admission card makes it
operational, and a listing that showed it would be the first place
anybody could see it at all.

## Acceptance criteria

- WHEN the process is loaded off disk THE loaded value SHALL carry the dispatch block as the reader answers it, including the explicit no-grant state for a template that carries none, so every surface reads one reading of it.
- WHEN the settings listing runs THE listing SHALL render the approval mode, the recovery policy and the current grant with its revision, its giver and its instant, or SHALL say in as many words that this project carries no grant, pinned by a body over a template with a block and a body over one without.
- WHEN the block is rendered THE listing SHALL name what nothing in the tree enforces — the advisory rows, and that no dispatch is admitted or refused by the block while its rows are declarative — so a mode is never mistaken for a guarantee about the work.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
