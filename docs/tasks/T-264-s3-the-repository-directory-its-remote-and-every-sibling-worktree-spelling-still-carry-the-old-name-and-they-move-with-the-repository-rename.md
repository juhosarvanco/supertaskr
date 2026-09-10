---
id: T-264-s3
title: The repository directory, its remote and every sibling-worktree spelling still carry the old name — 97 occurrences that move WITH the repository rename and not before it
feature: F-01
milestone: 4
size: M
priority: 1
status: planned
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — enumerated as the `repository-directory` survivor class while landing the identifier rename
blocked_by: []
touches: [app/, lib/, tools/, .claude/, .github/, bin/, method/, docs/reference/, docs/design/, docs/business/, docs/guide/, README.md, CLAUDE.md, AGENTS.md, .gitignore, docs/CONVENTIONS.md, docs/NORTH_STAR.md, docs/STATE.md, docs/future.md]
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

PREFLIGHT RULING (2026-09-10): "first names siblings of a repository" and "repository first" are the ORDER of two moves (the directory before its spellings), not an ordinal count over this repository's history; the move happened on 2026-09-10 and the paragraph stands as the record of why it went first.

**Absorbs:** T-264-s2, T-265-s1, T-265-s3, T-269 (the rename sitting of 2026-09-10, ruling B of the backlog review: cards sharing a fence are ONE lane; each absorbed card's criteria are kept whole below).

**PRECONDITION MET (2026-09-10):** @human renamed the GitHub repository to juhosarvanco/supertaskr, the repository directory to supertaskr and the app checkout to supertaskr-app; the seat re-pointed the remote and repaired the worktree. T-266's precondition is this rename; its remaining items (the npm placeholder, the domain, the mark, the App Store name) are @human's and stay on T-266 — its one seat write (the spellings of the old remote in .github/, CONVENTIONS and the README) is performed HERE. The census at 10f3676 with the records excluded (docs/checkpoints, docs/rooms, docs/tasks, docs/decisions, docs/research): 318 occurrences in 55 files. Records are never rewritten; the identifier-rename keeper's enumerated survivor classes shrink to what a ruling still holds (criterion 2 here, T-265-s3's last criterion).

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

## Absorbed criteria (kept whole)

### T-264-s2 — The app-dev launcher carries a 34th `NPUTER_*` variable and `bin/` is outside T-264's fence — the env prefix is renamed everywhere a program reads it EXCEPT the one launcher a human runs by hand

- WHEN this lane lands THE variable `bin/app-dev.mjs` reads SHALL be
  `SUPERTASKR_APP_WORKTREE`, and a repo-wide
  `git grep -h -o -E 'NPUTER_[A-Z0-9_]+'` outside `docs/` SHALL return
  nothing.
- IF the launcher's default target still names the pre-rename repository
  directory THEN it SHALL be left alone and named in the notes — that
  path is `T-266`'s, and a launcher pointing at a directory nobody has
  created yet is worse than one pointing at the directory that exists.

### T-265-s1 — Three `repository-directory` spellings live in docs/reference/ and T-264-s3's touches do not reach them — the lane and bench worktree names in the dispatch and verification pages move with the repository rename

- WHEN the repository directory and its remote have been renamed
  (`T-266`) THE lane and bench worktree spellings in
  `docs/reference/05-dispatch.md` and `docs/reference/07-verification.md`
  SHALL be the new ones.
- WHEN those spellings move THE two site markers T-265 added — the
  paragraph in 05-dispatch.md naming ADR-022 decision 4 and T-264-s3, and
  the parenthetical in 07-verification.md — SHALL be removed, because a
  marker that explains a survivor outlives the survivor.
- WHEN this card lands THE reference SHALL agree with
  `docs/CONVENTIONS.md`'s lane bullet on the worktree spelling, checked
  by reading both at the same ref.
- IF `T-266` has not landed THEN this card SHALL NOT be dispatched: the
  order in T-264-s3 is the point, and moving the spellings first names
  siblings of a repository directory that does not exist.

### T-265-s3 — `rename-scan.mjs`'s corpus is app/, lib/, tools/, .claude/, .github/ and five root files — every tree T-265 renamed is outside it, so a leftover identifier, a mis-cased name or a homoglyph in method/, docs/guide/, docs/reference/ or docs/business/ reds nothing

- WHEN `scanCorpus` walks the tree THE roots SHALL include `method/` and
  the governing-document and prose trees T-265's `touches:` names, so
  that a survivor there is classified rather than unseen.
- WHEN a survivor in those trees is not one of the enumerated classes
  THE unclassified-survivor body SHALL red, naming the file and the line.
- WHEN the product name appears in prose or in an identifier anywhere in
  the corpus THE case SHALL be checked against ADR-022 decision 1 — a
  capital `S` inside a backtick code span or an identifier is a finding,
  as is a lowercase `s` opening a prose sentence (`T-265-s2` rules the
  second half).
- IF a name-shaped token carries a non-ASCII homoglyph THEN the scan
  SHALL red rather than pass it as an unrecognised word.
- The new classes SHALL each carry a mutant shown failing before the
  body is believed, planted where the arming is absent (verifier.md 2b).
- IF the enumerated survivor set must grow to keep the tree green THEN
  each addition SHALL name the ruling that holds it (ADR-022 decision 4,
  `T-264-s3`, `T-269`) rather than being added to silence a red.

### T-269 — The runtime template method/runtime/nputer.yaml renames to supertaskr.yaml WITH its three readers in one lane — the compile-time embed in kit.rs, the token scan's literal path, and the interview approval string — because a git mv alone fails the Rust build

- WHEN the lane lands THE file SHALL be `method/runtime/supertaskr.yaml`
  (`git mv`), its header comment SHALL carry the new name, and the three
  readers SHALL name it: kit.rs's `include_str!` path, its `rel:` string
  and the KIT_FILES expectation; token-scan.mjs's control-corpus entry;
  the interview approval string in interview-chat-dom.test.tsx — and
  `cargo build` from app/src-tauri/ SHALL succeed at every commit of the
  lane (a half-landed rename fails the build, which is why the four move
  together).
- WHEN a genesis runs (the interview e2e or the app suite's genesis
  bodies) THE kit copied into the project SHALL carry `supertaskr.yaml`
  under runtime/, and the project's own config file SHALL be
  `.supertaskr/supertaskr.yaml`.
- WHEN method/roles/planner.md and docs/reference/12-genesis.md name the
  runtime template THE prose SHALL say the new name (the two lines T-265
  parked with the file).
- The lint:tokens control corpus SHALL still include the file under its
  new name (the `CONTROL includes tracked text format` body), and the
  suites owed by the docs gate SHALL run green.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
