---
id: T-293-s1
title: "The merge ritual regenerates the census and STAGES it; the standing read's index rides the same command and is staged by nobody — and its own trigger, a governing document's opener, is not one the ritual watches"
feature: F-01
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-293, measured at cbdafa4e9d9853291eacf9d9bd39134cf4204a76"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293 made `npm run capabilities` write TWO generated documents:
docs/CAPABILITIES.md, which it always wrote, and docs/INDEX.md, the
standing read's one-line index of the governing documents (ADR-024
decision 2). The merge ritual's plan is unchanged and now covers half of
that command's output.

Derive it at any ref after T-293's merge:

    grep -n "capabilities:add" tools/e2e/scripts/merge.mjs

The step's argv is `git add docs/CAPABILITIES.md`, and `cli.spec.ts`'s
body `a merge STAGES the census and the graph it regenerated, by the
argv it runs` pins exactly that list — so a merge that regenerates the
census leaves a regenerated docs/INDEX.md unstaged in the working tree,
and the commit lands without it.

**AND THE TRIGGER IS THE OTHER HALF.** `movesSpecNames(paths)` is what
plans the regeneration at all, and the index goes stale from something
that function cannot see: a governing document's OPENER — its first
heading, the sentence its opening paragraph uses to say what it is, or
its section headings. A merge whose diff moves one of those regenerates
nothing, and the docs gate reds on the next run against a tree nobody
touched afterwards.

**HOW BADLY IT BITES TODAY, honestly**: the two triggers barely overlap.
A spec name moving changes the census but not the index, because the
index's line for the census names its TOPICS, which are the spec file
basenames; only adding or removing a spec FILE moves both. So the
unstaged case is real and rare, and the missed-trigger case is the one a
seat will actually meet.

## Acceptance criteria

- WHEN a merge's diff moves a governing document's opener THE ritual
  SHALL plan the regeneration, on a trigger derived from the same set
  `docs-scan.mjs` indexes rather than a second hand-kept list.
- WHEN the ritual regenerates THE staging step SHALL stage every
  document that command writes, and a body SHALL red when one of them is
  dropped from the argv.
- The ritual SHALL keep planning neither step for a diff that moves
  neither — the positive control the existing body already carries.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
