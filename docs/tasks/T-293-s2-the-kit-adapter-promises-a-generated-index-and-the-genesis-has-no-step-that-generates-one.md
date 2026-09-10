---
id: T-293-s2
title: "The kit's adapter tells every new project that docs/INDEX.md is its standing read once the project generates it, and the genesis has no step that generates one — a project scaffolded today reads STATE and a pointer to a file that never arrives"
feature: F-01
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-293, measured at cbdafa4e9d9853291eacf9d9bd39134cf4204a76"
blocked_by: [T-293]
touches: [method/docs-templates/, method/roles/planner.md, app/src-tauri/src/agent/kit.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293 rewrote `method/adapters/CLAUDE.md` and `method/adapters/AGENTS.md`
— the two files the genesis copies to a new project's root — to say the
standing read is docs/STATE.md and, once the project generates it,
docs/INDEX.md. That is the same hedge the adapter already carried for
docs/CAPABILITIES.md, and it is honest: this repository generates its
index from `tools/e2e/scripts/docs-scan.mjs`, which is not kit.

What the kit ships for the other governing documents is a TEMPLATE under
`method/docs-templates/`, and there is none for the index — correctly,
because the index is generated rather than filled in. So a project taken
through the genesis today gets an adapter naming a document, a scaffold
step that creates every other document it names, and nothing that ever
creates this one. Derive it:

    ls method/docs-templates/
    grep -n "docs-templates" method/roles/planner.md

**THIS IS THE UNIVERSALITY CRITERION'S PROBLEM, NOT ONLY THIS ONE'S**
(ADR-024 decision 7): the mechanism has to read its configuration from
the runtime template and the CLI has to package it, or the second
project proves the loop without the standing read the loop was cut down
to.

## Acceptance criteria

- WHEN the genesis scaffolds a project THE project SHALL end with a
  docs/INDEX.md generated from whatever governing documents it has, or
  with an adapter that does not name one — never with a pointer to a
  file nothing creates.
- WHEN the index generator runs in a project that is not this one THE
  set of documents it indexes SHALL be read from that project's own
  configuration, not from a constant naming this repository's four.
- A body SHALL prove it on a scaffolded fixture, not on this tree.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
