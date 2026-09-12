---
id: T-300-s4
title: "A body that derives over the WHOLE tracked tree is invisible to the owed-set derivation, so a source change that reds it is never told it owes it"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300, measured at the lane tip, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Measured in this lane, on this card's own defect, and both halves were
run at the same tip.

`tools/e2e/tests/docs-input-gate.spec.ts` requires `unlinkedFiles()` to
be empty. That function WALKS every tracked source file: it owns a
property of the tree, and it imports nothing from the files it judges.
The owed-set derivation asks a different question — which spec files own
a changed path over the STATIC IMPORT GRAPH — and for a script that
walking body imports nothing from, the honest answer to that question is
none.

So the two disagree. With this card's docs-gate follow-up reverted in
`tools/e2e/scripts/settings.mjs`, the owed set this range derived — 11
spec files, 592 bodies — passed whole, while
`tools/e2e/tests/docs-input-gate.spec.ts` went RED on exactly the defect
the follow-up removes. The owed set was measured GREEN on a tree that
the body owning the property calls broken.

The class is wider than this one body and wider than this card. Any
suite body whose subject is a property OF THE TREE rather than of an
imported symbol sits outside the graph the derivation walks: a census,
a guard-class candidate sweep, a token scan, a keeper over comments.
Each is owed by every source change and claimed by none.

## Why this is not the whole-suite net's job

The net catches it, and that is the point being made rather than the
answer. `record.whole_suite_net` is `checkpoint-and-nightly`, so a red
of this class is found at a checkpoint and filed against the merge that
caused it — after a lane reported a green battery in good faith and its
executor was gone. The gap here is the ANNOUNCEMENT at build time,
which is the cheap half.

## What a fix looks like

Give the derivation a second ownership rule beside the import graph: a
spec that walks the tracked corpus DECLARES the corpus as its subject,
and any change inside that corpus owes it. Derived from the walking
function rather than listed by hand, so a body added next month is
covered without an edit — the shape the guard-class candidate sweep
already uses, where the candidates come off the tree and never off a
map.

## Why it was not done in T-300

`tools/e2e/scripts/gate-run.mjs` matches the gate-runner guard class and
`docs-scan.mjs` is read by several gates; both are outside this card's
fence. A lane that edits a gate its card did not fence is the write the
lane fence exists to refuse.

## Acceptance criteria

- WHEN a diff changes a tracked source file THE owed-set derivation
  SHALL name every spec whose subject is the tracked corpus itself, not
  only the specs that reach that file over the import graph.
- WHEN a body is added that walks the corpus THE derivation SHALL pick
  it up without a hand-maintained list, and a body SHALL show that by
  planting one.
