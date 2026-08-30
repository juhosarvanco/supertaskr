---
id: T-169-s1
title: The assignment flag's rendering pin sits in the review-badge file because a fence put it there, not because it belongs
status: parked
suggested_by: "T-169's executor (2026-08-30): the DOM bodies landed where the fence reached, and the fence is not a taxonomy"
touches: [app-board, app-shell]
---

PARKED at standing triage sitting #3, 2026-08-30 (architect seat),
`@ 51fa31c0964c` — and the parking note carries the ONE DERIVATION THE
CARD DOES NOT HAVE, because without it the next reader re-runs this
sitting's work.

**`app/test/board-truth.test.tsx` IS NOT app-board's TO REACH. IT IS
C-05's.** Derived here rather than assumed:
`command grep -n 'board-truth' docs/architecture/components/*.md`
answers `C-05-app.md:17`, inside the block headed *"THE SIXTEEN
app/test/** FILES THAT EXERCISE THE SHELL, NAMED ONE BY ONE (T-149)"* —
so the file the card wants the bodies moved to is claimed by
`app-shell`, not by `app-board` at all. That changes both halves of the
card's question:

- The **one-file move** is not a move inside a fence. A lane doing it
  needs `[app-board, app-shell]` — this card's fence, corrected here —
  and it is then a two-slug lane for a test-file move, which is the
  ceremony the shape actually costs.
- The **general question** is not "should `app-board`'s expansion reach
  the board's own DOM file". It is a RE-ROUTING: moving
  `board-truth.test.tsx` out of C-05's enumerated list into C-08's or
  C-09's `paths:`. That is a registry edit governed by CONVENTIONS'
  DECLARING-A-COMPONENT bullet (THREE live-registry fixtures move with
  it), and C-05's own *"WHY THE TEST DIRECTORY IS NOT A GLOB HERE"*
  block is the argument any re-route has to answer first.

**WHY IT IS PARKED AND NOT PROMOTED.** The card says it itself: the
bodies are green, drilled, and correct where they sit. This is
placement debt, and the honest price of paying it today is a two-slug
lane plus a three-fixture registry reconciliation for zero behaviour
change — bought at a sitting where `app-board` is held by a live lane
(`T-143-s3` at this base) and `app-shell` is the biggest train on the
board. Deciding it in the abstract, ahead of a lane that actually needs
the file, is how a registry acquires edits nobody can justify later.

**RESURFACES:** the next `app-board` card that needs to pin something
in the board's general DOM file meets this wall and decides it WITH a
customer — that seat re-derives the ownership line above at its own ref
and either moves the bodies under a `[app-board, app-shell]` fence or
routes the file. Checkable without remembering this card: the wall
announces itself as "the file I need is outside my fence".

**NOT A COLLIDER WITH ITS NEIGHBOUR, said so nobody re-derives it:**
`T-140-s5`'s finding in the same file (`app/test/review-badge.test.tsx`)
was DISCHARGED at this sitting — the orphaned import and fixture left at
`51c3dfe` — so nothing else is queued against that file.

T-169 pinned the assignment flag's rendering — the panel's both-values
provenance row and the card face's `data-assignment-violations` count —
in `app/test/review-badge.test.tsx`. That file is ADR-016's two-mark
provenance contract and nothing else; the assignment row is a different
subject that happens to render in the same block.

The reason is a fence, and it is worth someone deciding on rather than
inheriting. `touches: [lib-parser, app-board]` expands to five
`app/test/*` files, of which exactly one is a jsdom `.tsx`, while the
board's general DOM file — `app/test/board-truth.test.tsx`, where a
TaskCard/TaskDetailPanel rendering body would naturally live — is
outside every fence T-169 could carry. So the lane had two options that
were both wrong in different ways: put the bodies in a file about
something else, or leave the rendering unpinned. It chose the first and
left a comment at the site saying so.

What a triage would decide: whether the bodies move to
`board-truth.test.tsx` (a one-file move, no behaviour change), or
whether `app-board`'s expansion should reach the board's own DOM test
file at all — the second question is the general one, since any future
app-board card that renders something meets this same wall. The
component registry's `paths:` for C-08/C-09/C-17/C-18 is where that
answer would be written.

Not urgent: the bodies are green, drilled (T-169's M21–M24, one-sided,
sha256-restored) and correct where they sit. This is a placement debt,
not a coverage gap.
