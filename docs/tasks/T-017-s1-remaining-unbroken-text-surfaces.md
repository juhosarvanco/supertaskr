---
title: Sweep the remaining unbroken-text surfaces (ghost provenance, panel header, chips, stamps)
status: suggested
suggested_by: executor claude-fable-5 @T-017
---

T-017 contained pathological unbroken TITLES on task cards, ghost
cards, and the new parked entries — exactly the absorbed criterion.
While placing those utilities I inventoried the board's other
file-derived text surfaces, and several share the same latent
overflow-visible gap for an unbroken run (all inert, none currently
rendering wrong in the live tree):

- GhostCard's provenance line (`suggested · <suggested_by>`) — a
  pathological unbroken suggested_by would bleed exactly like the
  titles did (same span anatomy, no break utility).
- TaskDetailPanel's `<h2>` title and the `data-task-ref`/id line — an
  unbroken run here widens the panel's scroll context rather than
  bleeding across the app (the aside's overflow-y-auto makes
  overflow-x auto too), so it is contained but grows a horizontal
  scrollbar over the whole panel instead of wrapping.
- Panel chips and stamps that print raw frontmatter (blocker ids,
  touches slugs, built_by/verified_by values, the file-path footer) —
  same class of field, same default overflow.

Suggest one small sweep applying the T-017 treatment (`break-words`
on wrapping text; the panel header could take it too) with a
board-truth-style class pin per surface. A verifier browser probe with
a hostile-fields fixture (the T-004-s1 repro generalized: 10k-char
unbroken suggested_by, blocker id, stamp) would close the layout half
headless tests cannot see. Touches app-board only; zero tokens.
