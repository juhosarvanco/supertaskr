---
id: T-169-s1
title: The assignment flag's rendering pin sits in the review-badge file because a fence put it there, not because it belongs
status: suggested
suggested_by: "T-169's executor (2026-08-30): the DOM bodies landed where the fence reached, and the fence is not a taxonomy"
---

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
