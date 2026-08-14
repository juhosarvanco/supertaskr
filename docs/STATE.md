# State

Updated: 2026-08-15 by T-005 integrator, claude-fable-5 @fresh

## Just completed
T-005 (card detail, M) is DONE and merged — the full pipeline with
one rejection. Click a card → live read-only detail panel: criteria,
blockers as re-targeting links, touches, verdicts verbatim, stamps;
in-place live updates, calm deleted/missing states. The rejection:
under a REAL trusted click, React's discrete-update flush runs
mid-propagation and detaches the clicked blocker chip before the
document-level click listener sees it, so the panel closed instead of
re-targeting — invisible to synthetic input (synthetic clicks
propagate synchronously; the builder's probes and any unit test pass
over it). Fixed structurally, not compensated: the dismissal decision
moved to pointerdown (pre-flush, always reads the intact tree;
extracted to app/src/components/board/panel-dismissal.ts) and the
trusted event order is regression-pinned (failing→passing proof on
the old vs. new wiring). Re-verification APPROVED by the eyewitness
verifier — the one who observed the original trusted-click failure
live — including an independent re-derivation of the failing test.
This merge was also the FIRST combined run of the parallel-built
T-005 + T-007: full suite green (parser 78/78, app 84/84, cargo
20/20, boot echo 25 tasks / 5 features / 0 issues).

Milestone 1: SIX of seven done (T-001–T-005, T-007).

## In progress / broken right now
Nothing building, nothing broken. Board free.

## Next up (1–3)
1. T-006 (design language, M) — the sole remaining milestone-1 card,
   awaiting the external design token sheet
   (docs/design/design-handoff.md v3, with Claude Design); dispatches
   on design's return with @human word.
2. Architect triage of the EIGHTEEN open suggestions:
   T-001-s1/s2/s3, T-002-s1/s2/s3, T-003-s1/s2/s3, T-004-s1/s2,
   T-005-s1/s2/s3/s4, T-007-s1/s2/s3.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

For the @human (visual-confirmation precedent, T-001/T-007) — the
consolidated real-input checklist:
1. Three picker dialog flows on the real screen: convention-layout
   folder → board re-renders and live-updates; docs-less folder →
   empty state names it, "keep current project" returns to the board;
   Escape/cancel → no change.
2. One real mouse click on a resolved blocker link in the detail
   panel → re-targets, does NOT close — NOW LIVE on main (the T-005
   rejection's exact repro).
3. Real-key Escape / Enter / Space on the panel (machine key
   injection cannot reach the page — T-005 builder/verifier flags).
4. Linux run (T-001-s3): the Linux halves of T-001/T-003 window
   criteria remain machine-unverified.

## Open questions
None.
