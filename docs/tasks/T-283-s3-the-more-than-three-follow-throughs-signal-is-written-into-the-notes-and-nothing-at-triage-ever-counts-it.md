---
id: T-283-s3
title: "The under-specification signal T-283 adds is a sentence a lane writes into its own notes and a seat is asked to remember at triage — nothing counts follow-through headings across merged cards, so the one figure that would say which cards are being written too thin has no reader"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-283, 2026-09-09, at the dispatch stamp 677941a"
blocked_by: [T-283]
touches: [tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-283's fifth criterion asks a lane whose follow-throughs exceed three to
say so in its notes, and asks the seat to read that at triage as a sign
the card was under-specified. Both halves landed in
`method/roles/executor.md` step 5 as prose.

**THE SIGNAL HAS NO READER.** Nothing walks `docs/tasks/` counting
`In-fence follow-through` entries per merged card, so the figure exists
once, in one card's notes, and is seen only by whoever happens to open
that card. The comparison the criterion actually wants — *are cards
getting thinner?* — is across cards and over time, which is the shape the
health bands already have: a measured rate, a band, a breach that is news
at the checkpoint. The rate is cheap to derive (the heading is a fixed
string this method publishes) and it is the only quantitative feedback
the in-fence rule produces about the DECOMPOSITION rather than about the
lane.

**AND THE BAND'S THRESHOLD IS NOT THREE.** Three is a per-lane sentence
in the notes; the interesting figure is the share of merged cards
carrying any follow-throughs at all and the mean per card, both of which
should be derived from measured history rather than typed — the shape
T-282 gave the backlog band.

## Acceptance criteria

- WHEN the health bands run THE follow-through rate SHALL be derived from
  the merged cards' own notes, never transcribed, and reported with the
  ref it was measured at.
- WHEN a card's notes carry more than three follow-through entries THE
  reading SHALL name that card, so the triage sitting reads a list rather
  than a number.
- WHEN no merged card carries the heading THE band SHALL report zero
  distinguishably from a walk that could not run — an exit over zero
  cards is not a rate of zero.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
