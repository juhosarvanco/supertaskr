---
id: T-255
title: CONVENTIONS compaction landing three — the generic halves of the four seat protocols (the range rule, the lane protocol, the poison drill, the docs gate) move to the method's own files, the nputer overlay stays, every program-read sentence stays byte-identical, and the budget re-lands
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-08): \"This sounds good\" on \"keep one CONVENTIONS file, move the generic seat protocols out of it into the method's own files … and skip the topic split\" (rooms/loop-efficiency.md item 29); the method's own rule that method/ is the generic convention and CONVENTIONS the project overlay"
blocked_by: [T-254]
touches: [docs/CONVENTIONS.md, method/lane-protocol.md, method/roles, tools/e2e/scripts/docs-scan.mjs, docs/decisions/019-governing-docs-rules-truths-records.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

CONVENTIONS is two sections; Gotchas is 93 KB in thirty bullets and
four of them hold 43 KB: the range rule, the lane protocol, the poison
drill, the docs gate. They are seat protocols carrying their whole
history inline, and their generic halves belong where the kit already
ships protocols to every genesis project — method/lane-protocol.md and
the role files. This is the split by TIER the method defines (generic
in method/, overlay in CONVENTIONS), not a split by topic: no path
changes, the thirty-three spec files that read the document keep
reading it, the five headings the brief quotes stay put. T-236 landed
the second compaction (160,043 → 117,505 bytes) with the recipe this
card reuses. Blocked by T-254 because the pack decides which overlay
bullets the seats still need quoted.

## Acceptance criteria

- WHEN the landing is built THE four protocol bullets SHALL keep in
  CONVENTIONS only what is nputer-specific (ports, paths, this repo's
  slugs and gates) and a pointer to the method file that now holds the
  generic protocol; each moved RECORD sentence (a ratification, a
  retirement, a dated instance) SHALL be replaced by a citation to the
  card, record or pre-compaction ref that holds it (T-236's rule).
- WHEN the method files gain the generic halves THE method eval gate
  SHALL run with the bump's eval block, and the kit template
  (method/docs-templates/CONVENTIONS.md) SHALL be checked for the same
  drift.
- EVERY program-read sentence — the five headings dispatch-brief quotes
  (THE LANE PROTOCOL, DOCS GATE (T-084, Fresh-clone ORDER, PORT RULE:,
  DISPATCH FROM THE LAST CHECKPOINT), the Build & test command bullets
  workflow-parity derives CI from, and whatever the thirty-three spec
  files assert — SHALL be byte-identical after the landing; a spec body
  SHALL name the sentence that moved, if one does.
- WHEN the landing is measured THE new `wc -c` SHALL be recorded in
  DOC_BUDGETS with warn and fail derived the way every landing has, and
  a dated ADR-019 addendum SHALL carry the reason; the seat's own
  forecast of 95–100 KB is a forecast, and the record carries the
  reading.
- The docs gate SHALL be run on every path; CAPABILITIES SHALL be
  regenerated if a spec name moves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
