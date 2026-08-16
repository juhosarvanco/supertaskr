---
id: T-031
title: Board completeness pass — containment sweep, verdict parity, card-level issues
feature: F-02
milestone: 4
priority: 15
size: M
status: planned
blocked_by: []
touches: [app-board, app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-017-s1, T-017-s2, T-017-s3, T-019-s1, T-024-s4, T-024-s6
(the board-badge half; the parser half lives in T-030 and the map-badge
half in T-032). Triage 2026-08-16:
all four live in the same files (TaskDetailPanel, GhostCard,
verdicts.ts, the board-model join) and share the hostile-fields
fixture discipline; T-017-s1/s2 explicitly compose as one commit.
Launch-prep: the board is the launch screenshot surface, and the
splitter fix stops a once-rejected face reading `rejected ×2`.

## Acceptance criteria
- THE remaining file-derived text surfaces SHALL contain pathological
  unbroken runs with the T-017 treatment: GhostCard's provenance line
  (`suggested · <suggested_by>`), TaskDetailPanel's h2 title and
  ref/id line, and the panel chips/stamps printing raw frontmatter
  (blocker ids, touches slugs, built_by/verified_by, file-path
  footer) — break-words on wrapping text, a board-truth-style class
  pin per surface, and a hostile-fields fixture (the T-004-s1 repro
  generalized: 10k-char unbroken suggested_by, blocker id, stamp)
  asserted headlessly at DOM level (T-017-s1).
- THE VerdictBlock text container SHALL gain the notes body's
  overflow containment (`overflow-x-auto`, matching NotesDisclosure)
  plus a class pin, so an unbroken run in a REJECTED repro scrolls in
  place instead of widening the panel (T-017-s2).
- THE verdict splitter SHALL anchor at column 0 (test the RAW line,
  not line.trim()) so indented verbatim quotes of earlier headers
  fold into their parent entry and rejected ×N stops counting quoted
  headers; both quote forms (blockquote `>` and indented) SHALL be
  pinned in detail-presentation.test.ts (T-017-s3).
- THE board SHALL surface soft issues on the affected card: a pure
  lens joins model.issues to cards by their `file` field; the card
  face wears a small issue mark and the detail panel lists the
  messages verbatim; the header aggregate count is unchanged
  (T-019-s1).
- THE genesis pane's north-star title SHALL carry the T-017 treatment
  (`break-words` on the title, `min-w-0` on its flex ancestor, no
  truncate/line-clamp) with a class pin and the same hostile fixture:
  it is the pane's one unbounded text surface — every other one is
  bounded (chips clip at 44 chars, artifact rows and backbone names
  `truncate`) — and `firstSentence(vision)` returns the whole
  collapsed blob when no `.!?` is found, so a mid-write NORTH_STAR.md
  is the realistic way to hit it (T-024-s4).
- THE board's model badge SHALL be bounded: ModelBadge
  (app/src/components/board/badges/ModelBadge.tsx) carries no
  `truncate` and no `max-w` today, so a stamp whose model half is not
  a single clean token widens the card. Defense in depth BEHIND
  T-030's parser fix, which is the load-bearing half; pinned with a
  live compound stamp as the fixture (T-024-s6).
- Zero new tokens; tokens-only styling; both schemes; hostile field
  content renders as text nodes only. Visual judgment stays @human.

## Implementation notes

## Verdicts
