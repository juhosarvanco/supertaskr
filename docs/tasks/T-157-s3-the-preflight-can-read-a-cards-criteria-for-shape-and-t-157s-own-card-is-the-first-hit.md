---
id: T-157-s3
title: The preflight can read a card's criteria for EARS shape, and T-157's own card is the first hit — a criterion that opens with IF and never reaches SHALL
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-157
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, and where it came from

T-157 built a criteria-shape reading as one of the three signals
feeding the brief's advisory seat line. On its first run against the
card that asked for it, it reported **2 of 3 acceptance criteria are
EARS-shaped** — and the one it rejected is T-157's own third:

> IF the hygiene text and the brief row disagree THEN the method text
> is the authority and the row cites it.

It opens with a pattern keyword and never reaches `SHALL`.
`method/interview/decomposition.md` gives five patterns and every one
of them carries `SHALL`; TASK-FORMAT adds that a criterion names the
gate's command and is enforceable by a test. A sentence that states
which side wins an argument is a RULING, and rulings belong in the
body — a criterion has to say what a run will do differently.

**The card was preflighted CLEAN at `409ae54`** and this was not
among the findings, which is the whole point of this suggestion: the
preflight re-derives every claim a card MAKES, and says nothing about
whether the criteria are shaped so a verifier can enforce them.

## The arm

`brief.mjs --preflight` already reads the card, already has the
five-verdict vocabulary, and already refuses a dispatch on a finding.
`session-economics.mjs` already exports `acceptanceCriteria()`,
`earsKeywords()` (READ from decomposition.md, never transcribed) and
`isEars()` — so the derivation exists and the seat that would use it
exists. What has to be decided is the VERDICT CLASS: a non-EARS
criterion is not a stale claim, and refusing a dispatch over prose
style would stop more good dispatches than bad ones.

**The honest default is a NOTE that does not gate**, in the class the
preflight already prints for "claims I cannot check" — loud enough
that a dispatcher sees it before paying for a seat, quiet enough that
the fix is a one-line card edit rather than a re-dispatch. Whoever
takes this should also read T-160-s2 first: a criterion written inside
an indented block is already invisible to the preflight, and both
cards are about the same reader.

## Acceptance criteria

- WHEN a card is preflighted THE report SHALL name every acceptance
  criterion that is not EARS-shaped, quoting the criterion, and SHALL
  name the count it read so a card with zero criteria is distinguishable
  from a card whose criteria all pass.
- THE check SHALL use the existing `isEars`/`earsKeywords` derivation
  rather than a second copy of the pattern list.
- IF the decision is that a non-EARS criterion does not refuse a
  dispatch THEN the report SHALL say so on the line, so a reader never
  has to infer whether a printed finding gated anything.
