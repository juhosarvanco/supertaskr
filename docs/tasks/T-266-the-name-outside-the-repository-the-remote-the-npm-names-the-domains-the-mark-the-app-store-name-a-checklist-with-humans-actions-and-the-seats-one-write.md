---
id: T-266
title: The name outside the repository — the GitHub remote, the npm names and scope, the domains, the trademark search for the new spelling, the App Store developer name: a checklist of @human's actions, and the seat's one write (the remote URL)
feature: F-01
milestone: 4
size: S
priority: 6
status: planned
suggested_by: "@human's ruling of 2026-09-08 (ADR-022); the sweep in docs/rooms/naming.md"
blocked_by: []
touches: [.github, docs/CONVENTIONS.md, README.md]
builder:
verifier:
built_by:
verified_by:
review: self-verified
---

Everything the name touches that no lane can write: the repository's
name at GitHub, the npm package `supertaskr` and the `@supertaskr`
scope, the domains, the trademark search for the spelling without the
e, the App Store developer name. Each is @human's action; this card is
where they are ticked with a date, and the seat's one write follows
the repository rename: the remote URL in CI, CONVENTIONS and the README.

## Acceptance criteria

- WHEN @human renames the repository THE seat SHALL update every
  spelling of `juhosarvanco/nputer` in .github/, CONVENTIONS and the
  README to the new name in one commit, and the push guard's CI read
  (`gh run list`) SHALL answer for the renamed repository.
- WHEN the npm placeholder `supertaskr` is published THE README SHALL
  say `npx supertaskr` is reserved and not yet the CLI (T-244 makes it
  one).
- WHEN the domain, mark and App Store items are done THE card SHALL
  carry each with its date, in @human's words; IF the mark search finds
  a conflict THEN the room reopens before any public launch, not
  before the rename.
- Nothing under app/, lib/, tools/ or method/ moves in this card.
