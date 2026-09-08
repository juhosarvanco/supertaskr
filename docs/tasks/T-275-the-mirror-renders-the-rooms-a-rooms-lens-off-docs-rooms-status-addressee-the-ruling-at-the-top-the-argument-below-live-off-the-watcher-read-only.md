---
id: T-275
title: "The mirror renders the rooms — a rooms lens off docs/rooms/: every room with its status, its type, the card it belongs to, the addressee it waits on and the ruling at the top, the argument below, live off the watcher, read-only"
feature: F-02
milestone: 4
size: M
priority: 4
status: planned
suggested_by: "@human, 2026-09-09: \"Add rooms to the mirror app in v1\" (the rooms layer of method/README.md's dashboard, brought forward from v2)"
blocked_by: []
touches: [lib/parser/src/, lib/parser/test/, app/src/rooms/, app/src/components/shell/, app/src/App.tsx, app/test/, tools/e2e/tests/rooms.spec.ts, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Rooms are where the questions measurement cannot settle are argued and
ruled, and today they are visible only as files. The mirror renders the
board and the map from the same files; the rooms lens is the third
lens, read-only like the others: the app writes nothing to a room, and
a ruling is written by the seat or the human in the file.

## Why this card exists

@human ruled it into v1 after the loop-efficiency room was walked
(2026-09-09). Thirteen rooms exist; four carry this week's rulings; a
person considering the project cannot see them without a checkout. The
parser already reads frontmatter for cards and components; rooms carry
`type` (consultation, debate, escalation), `status` (open, resolved),
`task` (the card, when one) and `max_rounds`, and their body opens with
the ruling section when ruled.

## Acceptance criteria

- WHEN the app opens a project THE shell SHALL offer a Rooms lens
  beside the board and the map, listing every file under docs/rooms/
  with its type, status, the card it names (linked to the card in the
  board), and the @-addressee it waits on when open (the first
  `@human` / `@planner` mention in its body), open rooms first, newest
  ruling first among the resolved.
- WHEN a room is selected THE lens SHALL render its body as it stands in
  the file — the ruling section at the top where one exists, the
  argument below, nothing reordered or hidden — and the parser SHALL
  expose the room as a record with the same flagging discipline as a
  card (a room whose frontmatter does not parse is listed with its
  error, never dropped).
- WHEN a room file changes on disk THE lens SHALL update through the
  docs watcher at its debounce, like the board (ADR-017's rule: what the
  app shows comes from files landing, never from what a model said).
- IF a room's status is not in the vocabulary (open, resolved) THEN the
  parser SHALL flag it and the lens SHALL show the flag; the vocabulary
  lives in one place in lib/parser and the method's rooms/ template
  names the same words (a body compares them).
- The app SHALL write nothing to docs/rooms/ (the lens is read-only; a
  body drives every control and asserts no write), and the rooms lens
  SHALL be a component of its own in the registry (C-19, `app-rooms`)
  so a rooms card fences it and no other pane.
- The e2e spec `rooms.spec.ts` SHALL name each sentence above as a test
  so the census carries them; the dogfood registry pins move with the
  new component.
