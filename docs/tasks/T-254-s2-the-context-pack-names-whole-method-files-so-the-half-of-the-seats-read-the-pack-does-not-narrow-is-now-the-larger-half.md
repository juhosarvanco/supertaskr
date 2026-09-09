---
id: T-254-s2
title: "The context pack names whole method files and their sizes — 49,274 bytes of lane-protocol.md among them — so the half of the seat's read the pack does NOT narrow is now the larger half"
feature: F-04
milestone: 4
size: M
priority: 4
status: suggested
suggested_by: "T-254's executor, 2026-09-09, reading its own pack output back"
blocked_by: [T-254]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
---

## What was noticed

The pack's first part names the method files the seat's role file names,
with their sizes. For an executor at T-254's ref that is five files and
127,983 bytes: lane-protocol.md 49,274, TASK-FORMAT.md 43,184,
orchestrator.md 18,255, verifier.md 11,880, decomposition.md 5,390 —
within a few kilobytes of docs/CONVENTIONS.md itself.

The pack narrows CONVENTIONS by naming BULLETS and leaves method/ whole.
The brief already narrows inside those files everywhere else: ROW 4 cites
`lane-protocol.md` rule four by address rather than transcribing it, ROW
11 quotes rule six and the ceremony ROW rather than the table, and
`numberedStep` exists precisely to take one step out of a role file. So
the machinery for a bullet-level answer over method/ is present; nothing
spends it on the pack's first part.

## Acceptance criteria

- WHEN the pack names a method file THE entry SHALL name the RULES or
  STEPS of that file the seat's own row set already cites, by ordinal and
  with the size of each, rather than the file's whole size alone.
- WHEN a method file is named by no row THE pack SHALL still name the
  file whole and SAY that nothing narrowed it, so an unnarrowed entry is
  visible rather than assumed.
- IF the ordinals a file publishes cannot be read THEN the pack SHALL say
  so and name the file whole — the failure is disclosed, never a silently
  shorter list.
