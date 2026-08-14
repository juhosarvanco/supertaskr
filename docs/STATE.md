# State

Updated: 2026-08-14 by T-004 integrator, claude-fable-5 @fresh

## Just completed
T-004 (story map board, read-only; app-board + app-shell) is DONE
and merged — size L, and the SECOND consecutive first-pass approval.
The size-L planning-pass experiment held: zero deviations from the
plan, zero rooms opened, and all ten smallest-choice decisions were
audited genuine (each fills a real plan silence; none contradicts
plan text). What ships: the board as a pure lens over the T-003
store — `selectBoard(model)` in app/src/lib/board-model.ts, thin
components under app/src/components/board/, six `--status-*` token
pairs + the pulse mechanism in tokens.css/index.css (T-006 edits
VALUES only, never the mechanism). The app now renders the LIVE
story map: F-01…F-05 columns in ROADMAP order plus a trailing
unmapped column, F-02 filling teal top-down (T-001–T-004 done,
same-model badges), T-005–T-007 gray, the eleven suggestions as
dashed ghosts, milestone slice line across the board. Zero new
dependencies, zero IPC/capability/CSP diff (ADR-010 held again).
Full suite green on merged main: parser 78/78 + tsc + build; app
build exit 0 + tests 41/41; cargo 7/7; tauri dev boots with all
[nputer] lines and the board rendering this repo's own tree — the
checkpoint edit itself round-tripped watcher → board live, T-004
flipping amber → teal in place (same DOM node, no reload).

## In progress / broken right now
Nothing in flight; nothing broken. T-004 worktree removed, branch
kept.

## Next up (1–3)
1. @human word on dispatching T-005 (card detail, M) + T-007 (app
   opens own repo, S) IN PARALLEL — the frontier T-005/T-006/T-007
   is ALL unblocked now that T-004 landed. Touch analysis: T-005
   [app-board] and T-007 [app-shell] are disjoint → parallel-safe.
   T-006 (design language, M) [app-shell, app-board] overlaps BOTH
   and additionally awaits the external design input (design handoff
   committed 86883f9, sent to Claude Design) — T-006 dispatches when
   the token sheet returns and the board is free.
2. Architect triage of ELEVEN open suggestions: T-001-s1/s2/s3,
   T-002-s1/s2/s3, T-003-s1/s2/s3, T-004-s1/s2.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

Known caveat carried forward: the Linux halves of T-001's and
T-003's window criteria remain machine-unverified (see T-001-s3).

## Open questions
None.
