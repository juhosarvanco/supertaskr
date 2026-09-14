---
id: T-320-s1
title: "The express path's conventions bullet puts its chapter over its own warn band, and the argument behind the rule has nowhere to go: the reference chapter that owns the topic is outside the lane's fence, so the rule and its history landed in one file"
feature: F-04
milestone: 4
size: XS
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-320, filed from the lane on 2026-09-14 as what the lane noticed and did not do"
blocked_by: []
touches: [docs/conventions/dispatch-and-scratch.md, docs/reference/05-dispatch.md, tools/e2e/scripts/docs-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-290's standard is that a conventions bullet carries its RULE, the
keeper that enforces it and the card that made it, while the history,
the measurements and the argument live in the reference chapter that
owns the topic. Every other bullet in the dispatch chapter closes with a
line pointing at docs/reference/05-dispatch.md for exactly that.

T-320's express bullet does not, because that reference chapter is
outside T-320's fence. The rule therefore carries its own argument
inline, and the chapter moved past its warn line: the docs gate reports
it, the merge carries the warning, and nothing is wrong except that the
content is in the wrong file.

## What would settle it

Move the express bullet's argument — why the no-grant refusal is the one
departure from the ordinary cut, why an unknown observation is not a
mismatch, why the measurements are stamped rather than timed — into
docs/reference/05-dispatch.md, leave the rule and its pointer line in
the chapter, and re-derive the chapter's DOC_BUDGETS row at the landing
commit by the formula ADR-019 addendum 7 states. Nothing about the
behaviour changes; this is where the text lives.

## Implementation notes

## Verdicts
