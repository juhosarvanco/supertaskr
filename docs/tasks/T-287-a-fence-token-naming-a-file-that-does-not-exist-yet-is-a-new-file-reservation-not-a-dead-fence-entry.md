---
id: T-287
title: A fence token naming a file that does not exist yet is a NEW-FILE reservation when its parent directory is tracked, not a DEAD FENCE ENTRY — narrow fences need it, since a card that adds a spec file today can only fence the whole tests directory
feature: F-04
milestone: 4
size: S
priority: 2
status: building
suggested_by: "the architect seat, 2026-09-09, applying @human's ruling E (narrow fences at triage): the dry run's preflight refused T-242's `tools/e2e/tests/interview-skill.spec.ts` and T-207's `.claude/hooks/checkpoint-gate.mjs` as DEAD FENCE ENTRIES"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The expander accepts any token with a slash or a dot as a path standing
for itself, tracked or not. The preflight then refuses the same token:
"DEAD FENCE ENTRY … expands to <path> and no tracked file is under it at
HEAD". The rule is right for a typo — a fence that reserves nothing
protects nothing — and wrong for the one case narrow fences need: a
card whose work is a NEW file. Today that card fences the directory
(`tools/e2e/tests`, `.claude/hooks`), and a directory token is held
against every lane that touches one file under it. Fifty planned cards
fence `tools/e2e` whole at the third sitting of 2026-09-09; the p1
interview card is one of them, blocked by four lanes that each hold one
spec file.

## Acceptance criteria

- WHEN a fence token names a path that is not tracked at HEAD AND its
  nearest tracked ancestor directory exists AND the token has a file
  extension THE preflight SHALL classify it as a NEW-FILE RESERVATION,
  print it as such with the ancestor it hangs from, and SHALL NOT refuse
  the card for it.
- WHEN a fence token names an untracked path whose nearest ancestor is
  also untracked, or a directory token with nothing under it, THE
  preflight SHALL keep refusing it as a DEAD FENCE ENTRY — the typo case
  is unchanged.
- WHEN a lane holding a NEW-FILE RESERVATION creates that file THE write
  hook SHALL allow it and refuse every other new file under the same
  directory; a body SHALL show the hook allowing the reserved name and
  refusing a sibling, seen red on a hook that lacks the rule.
- WHEN two cards reserve the same new file THE dispatch view SHALL treat
  the reservations as overlapping fences — one lane at a time — and a
  body SHALL pin it.
- WHEN the arm's step 3 runs on a card whose only untracked tokens are
  reservations THE dispatch SHALL proceed; a body SHALL show the
  preflight's exit unchanged by the reservation and changed by a dead
  entry.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
