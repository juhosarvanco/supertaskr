# State

Updated: 2026-08-15 by integrator (T-006 merge — milestone 1
complete), claude-fable-5 @fresh

## Just completed
MILESTONE 1 COMPLETE. T-006 (design language pass) merged — the last
of the seven milestone-1 tasks, every one through the full pipeline
on the method itself. Three carried one rejection each (T-001
security, T-002 security, T-005 trusted-input race); four approved
first-pass (T-003, T-004, T-006, T-007). Every merge traces to a card
with a verdict. The design language is applied: six diverged status
colors, bundled Geist/Geist Mono (vendored, zero new deps), two-mark
review provenance per ADR-016. Post-merge suite green — lib/parser
78/78 + tsc + build, app build + 94/94, cargo 20/20 — and a headless
render sanity on the BUILT dist confirmed the board renders this
repo's live tree with the new tokens in both schemes (status fills +
wordmark exact, fonts same-origin, zero parse failures).

Triage at integration (sanctioned, one obvious item): T-006-s1
(parser smoke backbone stale) REJECTED — already fixed on main
(67cccd7) before integration. The file moved to docs/tasks/rejected/
with the one-line reasoning: `status: rejected` on a minimal file is
a hard parse failure, so in-place rejection has no legal encoding —
interim convention recorded in CONVENTIONS, ratification filed as
T-006-s5.

## In progress / broken right now
Nothing building, nothing broken. Board free.

## Next up (1–3)
1. @human, OUTSTANDING: (1) the screenshot-ready judgment (T-006
   criterion 2) — run the app on this repo, BOTH schemes; your live
   instance hot-reloaded the new design at this merge. (2) The
   consolidated real-input checklist (visual-confirmation precedent,
   T-001/T-007): three picker dialog flows (valid pick → live board ·
   docs-less pick → named empty state, keep-current works · cancel →
   no change); one real mouse click on a resolved blocker link in the
   detail panel → re-targets, does NOT close (the T-005 rejection's
   repro); real-key Escape / Enter / Space on the panel; Linux run
   (T-001-s3 — Linux halves of T-001/T-003 still machine-unverified).
2. Frontier: milestone 2 = the map vertical slice
   (rooms/map-sequencing.md) — T-008 (component-files parser, M,
   lib-parser) and T-009's L planning pass (crate-index) are the next
   dispatches, disjoint touches, awaiting @human word.
3. Architect triage of the TWENTY-TWO open suggestions:
   T-001-s1/s2/s3, T-002-s1/s2/s3, T-003-s1/s2/s3, T-004-s1/s2,
   T-005-s1/s2/s3/s4, T-006-s2/s3/s4/s5, T-007-s1/s2/s3
   (21 forecast after s1's rejection, +1: s5 filed at integration —
   the rejected-suggestion encoding gap). Then the domain
   (.dev/.fi/.com) + trademark sweep for "nputer".

## Open questions
None.
