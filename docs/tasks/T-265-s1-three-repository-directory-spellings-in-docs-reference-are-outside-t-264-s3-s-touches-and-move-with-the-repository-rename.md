---
id: T-265-s1
title: "Three `repository-directory` spellings live in docs/reference/ and T-264-s3's touches do not reach them — the lane and bench worktree names in the dispatch and verification pages move with the repository rename"
feature: F-01
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent, at T-265's lane, 2026-09-08 — the survivors left when the prose rename swept docs/reference/"
blocked_by: [T-266]
touches: [docs/reference/05-dispatch.md, docs/reference/07-verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264-s3`.** That card enumerates the
`repository-directory` survivor class — every spelling that is a sibling
of, or a route to, a directory named after the repository — and holds it
until `T-266` renames the repository and its remote (ADR-022 decision 4,
@human's). Its `touches:` are
`[app/, lib/, tools/, .claude/, docs/CONVENTIONS.md]`.

**Three occurrences of that class live in `docs/reference/`, which that
line does not reach**, and T-265 met them while sweeping the reference:

- `docs/reference/05-dispatch.md:121` — `../nputer-T-NNN` in the lane's
  own create command.
- `docs/reference/05-dispatch.md:129` — `nputer-V-T-NNN`, the bench.
- `docs/reference/07-verification.md:16` — the same bench spelling.

T-265 left all three and marked each at the site with the reason and the
two card ids, because renaming them alone would make the reference
describe worktrees nobody creates and would contradict
`docs/CONVENTIONS.md`, which still spells the old name for exactly the
same reason. Those two site markers are the other thing this card
removes.

**Why it is separate from T-264-s3 rather than folded into it:** that
card is `status: suggested` on the board with a settled `touches:` line,
and widening another card's fence is not a lane's move. Whoever picks up
T-264-s3 after T-266 should pick this up in the same sitting — the two
are one edit in two fences.

## Acceptance criteria

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
