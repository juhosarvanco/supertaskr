---
id: T-301
title: The app's settings screen — the same profile and switches, rendered from the same schema with the same explanations and measured costs, editing the same runtime template through the app's file writer
feature: F-02
milestone: 4
size: M
tier: standard
priority: 3
status: parked
wake: 2026-09-20
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [app/src/, app/src-tauri/src/, app/test/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The mirror app renders the board off files; the settings are a file too. One schema, three renderers (T-300 the terminal, this card the app, T-302 the skill).

## Acceptance criteria

- WHEN the settings screen opens THE profile and the switches SHALL render from the schema with their explanations and the project's band readings, and a change SHALL write the runtime template through the app's existing file writer with the constraints enforced.
- WHEN the template changes on disk THE screen SHALL re-render from the file (the board's own arrival mechanism), and a body SHALL show a forbidden combination refused in the screen with the constraint's text.

## Amendment of 2026-09-12 — the mirror first

The owner ruled on 2026-09-12 that the app is a mirror first. This section supersedes the
first criterion's write clause and narrows the second criterion's refusal; the original
criteria above stay as history.

- The first criterion's rendering clause stands: the profile and the switches render from
  the schema with their explanations and the project's band readings. Its write clause,
  that a change writes the runtime template through the app's file writer, is superseded:
  this card writes nothing. The edit is a follow-up card after T-300 lands, in which a click
  runs the terminal command through the native half and the screen re-renders from disk.
- The second criterion's re-render clause stands. Its refusal clause is narrowed: a
  forbidden combination present in the template on disk is shown on the screen as a
  diagnostic naming the constraint; refusing an edit belongs to the follow-up card.
- The shared reader is read from lib/parser once it lands there; until then this lane is
  not resumed. This card resumes only when both the reader in lib/parser and T-300's
  adoption follow-up are merged on its dispatch base.
- The recovery clone's app-side candidate (its settings screen, data source and tests at
  its commit e1e1b14b) is input material for the executor, read as reference; its expanded
  contract of twenty-three paths is not adopted, and its native writer is not used.
- Size and tier are re-derived by the arm at resumption; the fence stays the app's three
  directories.

## Amendment of 2026-09-12, second — the labels and the third prerequisite

The nine cards filed on 2026-09-12 sequence the settings track as T-317, then T-300-s6, then T-299-s6, and T-299-s6 names this card and T-302 as the remaining consumers of the switch labels. This section supersedes the first amendment's resume condition only, and adds one rendering obligation; everything else above stands.

- This card resumes only when T-317, T-300-s6 and T-299-s6 are merged on its resumption base, not merely verdicted.
- The screen SHALL show, beside each switch's value, its label (operational, manual or declarative) and, for a manual switch, its action, read through the parser library's browser entry; a declarative switch SHALL be shown as read-only in the screen's own terms. Editing stays with the follow-up card that runs the terminal command.
- The executor's brief SHALL be rendered only after this section is on the card, so the requirement is in the sealed contract and never added to a live lane.

## Amendment of 2026-09-13, third — the design step with the owner

The owner ruled on 2026-09-13, reading the customization-form room, that this screen is designed with the owner before it is built: the seat tells the owner when it is time to design it and brings a proposal, and no lane builds the screen from the card alone. This section adds one prerequisite to the second amendment's resume condition; everything else above stands.

- This card resumes only when, in addition to the three merges the second amendment names, a design ruling is recorded on this card: what a person does on the screen, how the resolved values and their reasons are previewed, how a diagnostic on a forbidden combination is shown, and where the models section from T-318 sits. The seat proposes; the owner rules; the ruling is paraphrased here, dated, before the executor's brief is rendered.
- The edit follow-up card (a click runs the terminal command through the native half) is not cut until the same design ruling covers the edit flow and the shape of a refused edit.
- The design step is the owner's to take up; it is not started by the seat without telling the owner, and it does not begin a lane.

## Parked 2026-09-13 — formally, on the owner's ruling, until the design ruling; resumed later through a fresh dispatch

The owner ruled on 2026-09-13 that this card is parked formally and resumed later through a FRESH dispatch after the design ruling the third amendment requires; the design sitting and the fresh dispatch are separate authorizations. The wake date is a placeholder for that ruling. The lane had stood dormant at its dispatch stamp since the quota interruption of 2026-09-11 with its executor's work uncommitted; before the worktrees were removed the seat preserved and verified that work on the owner's instruction:

- The unfinished candidate — five modified files (app/src-tauri/src/lib.rs, app/src/App.tsx, app/src/components/shell/PaneRail.tsx, app/test/crescendo-dom.test.tsx, app/test/map-shell-dom.test.tsx), seven untracked files (app/src-tauri/src/settings.rs, app/src/components/shell/SettingsScreen.tsx, process-settings.ts, settings-source.ts, app/test/process-settings.test.ts, settings-screen.test.tsx, settings-source.test.ts) and the lane's fence manifest and lock under .supertaskr/ — is committed whole on the evidence branch `evidence/T-301-wip-2026-09-13` (15 files, 6170 insertions), one commit above the task branch `task/T-301-settings-screen`, which stays at de5805b1. Neither is a resumption and neither is for merging.
- The same fifteen files are archived outside every checkout under the evidence directory beside the checkouts (`supertaskr-evidence/T-301-2026-09-13/`: the tar archive, a sha256 manifest of all fifteen, the diff of the five modified files against de5805b1, the status listing and the branch tips), and the archive was extracted and its manifest verified before the worktrees were removed.
- The recovery clone's candidate (its own T-301 checkout at e1e1b14b, whose working tree equals that commit) was compared file by file: three files are byte-identical (App.tsx, PaneRail.tsx, map-shell-dom.test.tsx) and nine differ, several substantially (the recovery's settings.rs is 2420 lines to the lane's 996; its process-settings.ts 8 lines to the lane's 708). The two are different candidates from a common start; the recovery clone does not contain this lane's work, so the fresh dispatch reads BOTH as input material, as the first amendment already says of the recovery's.
- The lane worktree and the bench worktree are removed through the normal procedure once the preservation above is verified, so the card's fence (app/src/, app/src-tauri/src/, app/test/) no longer reads as live against the app cards.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
