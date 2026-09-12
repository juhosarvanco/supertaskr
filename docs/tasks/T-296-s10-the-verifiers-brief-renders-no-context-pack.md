---
id: T-296-s10
title: "The verifier's brief renders no context pack — `brief.mjs --task <id> --role verifier` exits 3 with zero four-column tables, so every phase-2 verifier since the tiers has read the conventions by the index fallback and said so in its verdict"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the seat (2026-09-12): the T-300 verifier's verdict names the gap as a dispatch fault the role file defines; the recovery sitting of 2026-09-11 reproduced the same exit 3 for its T-303-s1 verifier and fell back to the indexed conventions"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The bench verb renders phase 2 from the sealed inputs and the card at the base, and hands the verifier ground rules and paths; the CONTEXT PACK that carries the rules a fence implicates is the dispatch brief's, rendered for the executor role. Asked for the verifier role, the brief assembler exits 3 and reports zero tables with the required four-column header where it expected one, so no pack reaches the bench. The verifier role file calls a missing pack a dispatch fault and prescribes the fallback: open the conventions at the sections the index names and say so. The T-300 verifier did exactly that on 2026-09-12 and opened two bullets of a document past its warn line; the recovery's T-303-s1 verifier did the same on 2026-09-11. The rule the pack exists to keep, that a seat reads what its fence implicates and nothing more, is kept by the verifier's discipline rather than by the arm.

## Acceptance criteria

- WHEN the brief assembler is asked for the verifier role of a card THE render SHALL carry a context pack derived from the card's fence by the same reader map the executor's pack uses, and SHALL exit 0.
- WHEN the bench verb renders phase 2 THE render SHALL name the pack's path beside the sealed inputs, and a body SHALL show a fence whose rule reaches the verifier's pack.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
