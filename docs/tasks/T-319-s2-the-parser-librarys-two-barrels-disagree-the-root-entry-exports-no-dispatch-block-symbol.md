---
id: T-319-s2
title: "The parser library's two barrels disagree: the browser entry exports the dispatch block reader and its vocabulary, the root entry exports none of it, and nothing in the package requires the two to agree"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-319, noticed while exporting the reader; the root entry is outside that card's fence, whose criteria name the pure entry only"
blocked_by: []
touches: [lib/parser/src/index.ts, lib/parser/test/process-settings.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The parser package publishes two entries: a root entry that adds the
filesystem layer, and a browser-safe entry the app's webview imports.
Both re-export the process settings module, and until T-319 they named
the same symbols. T-319 added the dispatch block reader, its types and
its vocabulary to the browser entry only, because the root entry sits
outside that card's fence.

The two barrels are hand-kept lists and nothing compares them. A caller
that imports the package by its root entry — which is the ordinary
spelling for anything running in Node — cannot reach the dispatch block
reader at all, and the failure it gets is a name that does not exist
rather than a sentence about why. The general shape is worth a body: a
symbol added to one barrel and not the other is invisible to the
typecheck, to both suites and to every gate.

## Acceptance criteria

- WHEN the package's two entries are compared THE root entry SHALL export every process settings symbol the browser entry exports, so a Node caller and a browser caller read the same module.
- WHEN a body checks that relation THE body SHALL derive both export sets rather than list them, SHALL name any symbol only one barrel carries, and SHALL be shown failing with a symbol removed from one side, so it is proved to catch the gap it exists for.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
