---
id: T-230-s8
title: markerEnd's typographic-quote term is inert under every census arrangement, so no body pins it — one assertion on markerEnd's own return would
feature: F-06
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-230-s7-verify, re-verdict 9cd0f4b, 2026-09-02
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

V-T-230-s7's drill MV2 dropped the typographic term from `markerEnd` and
every body stayed green (48 of 48). The verifier showed the term is inert
rather than unpinned: all eight census arrangements read identically with
and without it, because a shortened segment can only leak a CLOSING
typographic quote and `QUOTED_RUN` cannot open a run with one. Only
`markerEnd`'s own return value moves. The lane disclosed the same shape as
its M6.

## What is asked

One body drives `markerEnd` directly on a marker whose payload closes
with a typographic quote on a continuation line and asserts the returned
index, so that dropping the term reds by name. The census arrangements
need no change. Kill set: that body and no other.

## Acceptance

- A mutant dropping the typographic term reds exactly one body.
- The eight census arrangements V-T-230-s7 recorded still read identically.

