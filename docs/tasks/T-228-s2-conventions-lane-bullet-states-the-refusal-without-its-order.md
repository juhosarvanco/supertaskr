---
id: T-228-s2
title: CONVENTIONS' lane bullet says a card whose touches no longer match the manifest's stamp refuses with re-expand, stated without an order — false for writes under docs/tasks since T-228
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-228-verify, verdict de5e71e, 2026-09-02
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-228 reordered `decide()` in `.claude/hooks/lane-fence.mjs` to
`alwaysWritable`, then the stale-stamp comparison, then the paths, so a
write under `docs/tasks/` is allowed while the card and the manifest
disagree. CONVENTIONS' lane bullet still reads *"A card whose `touches:`
no longer matches the manifest's stamp refuses with `re-expand`"* with no
order, which is now false for `docs/tasks/` writes. No suite reads that
sentence, so nothing reds; a reader of CONVENTIONS is told the old
behaviour. The verifier could not fix it: CONVENTIONS was outside the
widened fence.

## What is asked

One sentence in the lane bullet stating the order the hook answers in,
with `docs/tasks/` named as the directory the stamp check no longer
suspends, and a pointer at T-228 rather than a restatement of its body.
CONVENTIONS is near its byte ceiling; the sentence replaces the imprecise
one rather than adding to it.

## Acceptance criteria

- The lane bullet names the order alwaysWritable, stamp, paths, and says
  a `docs/tasks/` write is allowed during a half-performed widening.
- CONVENTIONS' byte size does not grow past the warn line.
- docs-gate on CONVENTIONS runs the suites it names green.
