---
id: T-248
title: The injection scan on docs writes — every seat reads what other seats wrote, so the docs gate scans a card's or a record's text for instructions aimed at a model and names them, advisory first
feature: F-06
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's prompt-injection guard on .planning/ writes (T-245); nputer's docs/ is read by every seat and scanned by nothing"
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

nputer's whole design routes every seat through docs/: cards, briefs,
verdicts, rooms, records. A card body an executor wrote is the next
verifier's input; a record a lane wrote is the next architect's. GSD
Core scans `.planning/` writes for injection patterns
(hooks/gsd-prompt-guard.js, advisory) and scans reads too
(gsd-read-injection-scanner.js). nputer has the blind verifier's hashed
attack set and hostile-payload-verified fences, and nothing that reads
prose for "ignore your instructions".

## Acceptance criteria

- WHEN the docs gate runs on a changed path under docs/ THE gate SHALL
  scan the text for instruction-shaped content aimed at a model
  (imperatives addressed to "you" with tool or role words, hidden
  Unicode, HTML comments carrying directives — the pattern set is the
  executor's, kept in ONE file with each pattern's positive control)
  and SHALL print each hit with file, line and pattern name.
- WHEN a hit is found THE gate SHALL be ADVISORY (exit unchanged) in
  this card; a later card may make named patterns blocking once the
  false-positive rate on this repository's own docs/ is measured and
  written down.
- WHEN the pattern file changes THE spec SHALL fail unless every pattern
  has a planted positive that fires and a planted negative that does
  not (proof of teeth).
- IF the scan cannot run THEN THE gate SHALL say so on its own line —
  never a silent pass (STATE's "AN EXIT MAY MEAN THE GATE NEVER RAN").
- The seat's own docs — this repository's cards and rooms — SHALL be
  scanned once at the merge and the hit count stamped in the checkpoint
  record with its derive command.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
