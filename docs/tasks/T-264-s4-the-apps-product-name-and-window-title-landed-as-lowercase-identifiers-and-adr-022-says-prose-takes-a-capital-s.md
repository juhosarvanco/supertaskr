---
id: T-264-s4
title: The app's productName and window title landed as the lowercase IDENTIFIER `supertaskr`, and ADR-022 decision 1 gives prose a capital S — the two strings a user actually reads are the prose pass's, not the identifier pass's
feature: F-01
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — decided at the tauri.conf.json edit and routed rather than guessed
blocked_by: []
touches: [app/src-tauri/tauri.conf.json]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264`**, and the question it could not answer from
inside its own scope. ADR-022 decision 1: *"one word, capital S in
prose, lowercase `supertaskr` as an identifier"*. Decision 2 lists
*"the app's product name and bundle identifier `dev.supertaskr.app`"*
among the IDENTIFIERS, and gives the exact spelling only for the bundle
id. Decision 4 orders the identifier rename (T-264) before the prose
rename (T-265).

`app/src-tauri/tauri.conf.json` carried `"productName": "nputer"` and
`"title": "nputer"` — both lowercase — and T-264 moved them to
`"supertaskr"`, which is the faithful identifier-level rename and
changes the case of nothing. **But those two strings are the two the
user reads**: the window's title bar and the bundle's name in Finder and
in the installer. If they are prose, they take the capital S and the
edit belongs with `T-265`.

**IT IS A RULING, NOT A MEASUREMENT**, which is why it is filed rather
than taken: nothing in the tree can decide whether a window title is
prose, and a lane that decided it by itself would be a lane making a
naming ruling from inside a mechanical rename.

## Acceptance criteria

- WHEN this is ruled THE `productName` and window `title` in
  `app/src-tauri/tauri.conf.json` SHALL carry the ruled spelling, and
  the bundle identifier SHALL stay `dev.supertaskr.app` whatever the
  ruling — an identifier is lowercase under decision 1 either way.
- IF the ruling is that they are prose THEN this card SHALL be absorbed
  into `T-265` rather than dispatched on its own, because a two-string
  edit does not earn a lane beside the pass that owns the question.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
