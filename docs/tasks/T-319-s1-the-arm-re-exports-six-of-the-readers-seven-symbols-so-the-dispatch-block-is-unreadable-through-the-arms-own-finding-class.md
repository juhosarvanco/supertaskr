---
id: T-319-s1
title: "The arm re-exports six of the reader's seven symbols: the dispatch block reader landed in the parser library and nothing in the dispatch arm can reach it through the arm's own finding class, so the admission work has no reader to call"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-319, noticed while landing the reader; the arm's re-export block is outside that card's fence, and T-319 claims no admission so it needed nothing from the arm"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The parser library's process settings reader is a factory bound to the
caller's own error class, and the dispatch arm binds it once and
re-exports what it answers with under the names the arm has always used.
That is what lets the arm catch a settings refusal as a refusal rather
than as a crash. T-319 added a seventh symbol to the reader, the dispatch
block reader, and the arm's re-export block still destructures six.

So today the block can be read through the library's default class,
which the arm does not catch, and cannot be read through the arm's at
all. Nothing reds: the destructuring of an absent key is silent, and no
body compares the arm's re-export list against the reader's own shape.
T-324 owns admission and is the first caller that will want it, so this
is cheap to do before that card starts and awkward inside it.

## Acceptance criteria

- WHEN the arm binds the process settings reader THE arm SHALL re-export every symbol the reader answers with, derived from the reader rather than typed, so a symbol added to the library reaches the arm without an edit here or reds by name.
- WHEN a body checks that relation THE body SHALL compare the arm's exported names against the bound reader's own keys and SHALL be shown failing where a symbol is missing, so the comparison is proved to reach a real gap rather than asserted to.
- WHEN the block reader is reached through the arm THE refusal it raises SHALL be the arm's own finding class, pinned by a body that reads a malformed block and requires that class.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
