---
id: T-243
title: The app opens on a folder from outside — a command-line argument or URL the skill can call — so the mirror stands beside the chat at the start of an interview, not after a dialog
feature: F-02
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human (2026-09-03): \"Should it automatically open the nputer app with the right board?\" — yes, at the start, as a follower move (ADR-021)"
blocked_by: []
touches: [app/src-tauri/src, app/src/App.tsx, tools/e2e/tests]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

Today the app's two ways in are folder-picker dialogs
(`pick_project_folder`, `pick_genesis_folder`); there is no URL scheme
and no folder argument, so nothing outside the app can open it on a
project. ADR-021 makes the app the mirror beside the agent app's chat,
and T-242's interview skill wants to open it at the START so the user
watches the board materialize — the split view with the vendor holding
the chat half. This is the entry that makes that one line possible.

## Acceptance criteria

- WHEN the app is launched with a folder argument (the exact spelling
  is the executor's, documented in CONVENTIONS' command bullet) THE
  system SHALL open that folder as the project exactly as the picker
  would — the same command seam, the same watcher, the same phase
  transitions — and SHALL refuse a path that is not a directory with
  the picker's own refusal, never a crash.
- WHEN the app is already running THE second launch on a folder SHALL
  hand the folder to the running instance (single-instance) rather
  than open a second window; IF the platform cannot THEN the report
  SHALL say which and why.
- WHEN the argument names a folder with no plan THE system SHALL land
  on the genesis front door for that folder, so an interview skill's
  open lands where the interview will write.
- IF the argument is absent THEN the front door SHALL be unchanged,
  pinned by the existing front-door specs.
- The e2e bodies covering the front door SHALL gain the argument case
  and CAPABILITIES SHALL be regenerated; the graph regen and the six
  dogfood pins are owed if any .ts/.rs under the walk moves (room 27).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
