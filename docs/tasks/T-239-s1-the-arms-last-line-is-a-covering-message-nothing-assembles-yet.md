---
id: T-239-s1
title: The dispatch arm performs the eight steps and STOPS — the covering message its last line is supposed to be is T-204's, and until that lands a dispatcher still writes the handover by hand
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-239
blocked_by: [T-204]
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY BUILDING THE OTHER HALF.** T-239's own card says it in as
many words: *"T-204 generates the PROMPT; this card performs the RITUAL.
They meet at the end: the arm's last line is the covering message T-204
assembles."* The arm now performs all eight steps and prints the block of
lane facts. Its last line is that block, not a covering message, because
nothing in this tree assembles one yet.

**What is missing is the JOIN and not either half.** A dispatcher reading
the arm's output today still copies the lane facts into a prompt by hand
— which is the same shape of hand step T-239 removed one layer down, and
the same place a transcription can go wrong.

## Acceptance criteria

- WHEN `--dispatch-lane` succeeds THE arm's LAST line SHALL be the
  covering message T-204 assembles, derived from the same plan the block
  above it prints.
- THE arm SHALL still refuse at the first failed step and print no
  covering message for a dispatch that did not happen.
