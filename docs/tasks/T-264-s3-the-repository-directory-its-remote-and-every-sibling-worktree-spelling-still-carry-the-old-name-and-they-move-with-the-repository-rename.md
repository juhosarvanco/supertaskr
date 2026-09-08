---
id: T-264-s3
title: The repository directory, its remote and every sibling-worktree spelling still carry the old name — 97 occurrences that move WITH the repository rename and not before it
feature: F-01
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — enumerated as the `repository-directory` survivor class while landing the identifier rename
blocked_by: [T-266]
touches: [app/, lib/, tools/, .claude/, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264`.** ADR-022 decision 2 enumerates the identifiers
the rename lands, and the repository DIRECTORY is not among them;
decision 4 puts the remote, the npm names, the domains and the mark with
@human, and `T-266` is that checklist. So one class of survivor was
enumerated rather than renamed, and it is the largest:
`repository-directory`, **108 occurrences at the lane's tip** —
`tools/e2e/scripts/rename-scan.mjs`'s own table names it and
`only the four enumerated classes of the pre-rename identifier survive
in the code tree` holds the survivor set to that table.

**WHAT IS IN THE CLASS**, and why each is held rather than moved:

- `../nputer-app` — @human's live detached app checkout. It EXISTS under
  that name right now; renaming the spelling would make CONVENTIONS
  describe a directory nobody has, and `bin/app-dev.mjs` (out of
  T-264's fence, `T-264-s2`) would still default to the old one.
- `../nputer-T-NNN` and `../nputer-V-T-NNN` — the lane and bench
  worktree spellings CONVENTIONS publishes and `brief.mjs`,
  `dispatch-brief.mjs` and `app/src-tauri/src/dispatch/brief.rs` derive
  their answers from. Two of them are live on this machine as
  `nputer-T-264` and `nputer-V-T-264`.
- `/Users/ujju/Projects/nputer` and `github.com/juhosarvanco/nputer` —
  the repository root and its remote, both @human's under decision 4.

**THE ORDER IS THE POINT.** Every one of these is a sibling of, or a
route to, a directory named after the repository. Moving the spellings
first names siblings of a repository directory that does not exist;
moving the repository first makes each spelling a one-line follow.

## Acceptance criteria

- WHEN the repository directory and its remote have been renamed
  (`T-266`) THE lane worktree spelling, the bench spelling and the app
  checkout's spelling in `docs/CONVENTIONS.md` SHALL be the new ones,
  and every derivation and fixture that reads them SHALL move in the
  same commit.
- WHEN the class is empty THE `repository-directory` entry SHALL be
  removed from `KEPT_CLASSES` in `tools/e2e/scripts/rename-scan.mjs`,
  and `every enumerated survivor class is occupied` SHALL stay green.
- IF the repository has not been renamed THEN this card SHALL NOT be
  dispatched — `blocked_by: [T-266]` is the whole of its ordering.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
