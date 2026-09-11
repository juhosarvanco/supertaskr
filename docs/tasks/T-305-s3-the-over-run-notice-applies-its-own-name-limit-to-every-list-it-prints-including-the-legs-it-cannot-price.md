---
id: T-305-s3
title: "The over-run notice applies its own name limit to EVERY list it prints — the legs it cannot price are spelled out in full today, with no count, against the rule the constant beside them publishes"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-305, 2026-09-11, measured on the bench at adaace727bed7daa65638630df86ba856d63f939"
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-305's notice prints four lists. Two of them — the suites beyond the
owed set, and the spec files beyond it — go through the arm's own
`sample` helper, which stops at `OVER_RUN_NAME_LIMIT` names and says how
many more there were. The constant carries the reason on it: THE COUNT IS
THE TRUTH AND THE NAMES ARE THE SAMPLE, in that order in the sentence, so
a truncated list can never read as the whole one.

The other two lists are the legs the cost table cannot price. Both are
joined raw. Measured on the bench with forty unpriceable legs in a
planted token: all forty are spelled out, on one line, with no count in
front of them — the shape the constant's own comment records as a failure
this file already had once.

It is bounded in practice by the graded registry, which carries four
suites today, so nothing is broken. It is a rule the file publishes and
then keeps in half the places it applies.

## The shape that would work

The unpriced lists reach the reader through the same helper the named
lists do, so there is one rule and one place it lives. The clause reads
the way the others do: how many legs this table cannot price, then the
names of the few it spells.

## Acceptance criteria

- WHEN the notice reports legs the cost table cannot price THE sentence
  SHALL carry their COUNT before any name, and SHALL spell no more names
  than the arm's published limit.
- WHEN the unpriced legs are within that limit THE sentence SHALL read
  as it does today, so a short list gains no ceremony.
