---
id: T-290-s1
title: "A sentence read by an anchored regular expression is invisible to every literal census, and the probe that found the eight in THE RANGE RULE lived only in a lane's scratch directory"
feature: F-01
milestone: 4
size: M
priority: 1
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-290, measured in the lane and reported in its notes; the probe is a scratch script the lane could not land as a keeper without a body to hold it"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-290 moved forensics out of this project's conventions and had to prove
that no sentence a program reads moved with them. It built a census of
every string literal, in every tracked source that names the document,
that the document carries verbatim: 164 of them, all still present after
the move. That census is sound and it is not enough.

`parseRangeRule` in tools/e2e/scripts/range-rule.mjs demands TWELVE
measurements out of one bullet with ANCHORED REGULAR EXPRESSIONS — the
T-027 path counts, the T-078 counts, the scored range, the flip totals,
the ceiling's denominator and more. Not one of them is a string literal,
so the literal census reported the bullet's measurements as free to move
and the lane moved eight of them. The blessed gate-runner caught it as a
SCOPED-RED. A piped run before it had reported "1031 passed, exit 0" —
the exit of `tail`, not of playwright, which is the hazard this
project's own rule about a gate read through a pipe already names.

What the lane did instead was RUN the readers: every candidate move was
tried against every parser this repository points at the document, and
kept only where all of them still answered. That probe is the thing worth
keeping, and today it is a scratch script in one lane's directory. The
next seat that edits a rule has the literal census and nothing else.

## Acceptance criteria

- WHEN a sentence of this project's conventions is edited or moved THE check SHALL be able to answer whether a reader still finds what it parses, by RUNNING each document parser rather than by matching string literals, and a parser that no longer answers SHALL be reported by name with the bullet it was reading.
- WHEN the check runs over the tree as it stands THE answer SHALL be green, and a planted edit that removes one measurement a parser reads SHALL be reported — the positive control, run where the arrangement is absent and recorded as reddening.
- WHEN a new parser of the document is added THE check SHALL pick it up from the tree rather than from a list, or SHALL say in as many words that it is a list and name what maintains it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
