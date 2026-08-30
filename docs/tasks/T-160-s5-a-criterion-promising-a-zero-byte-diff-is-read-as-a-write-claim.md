---
id: T-160-s5
title: A criterion that promises a path will NOT change reads to the ownership arm exactly like one that promises it will, so the sharpest false positive is a card being careful
feature: F-04
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: verifier claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review:
---

## The shape

`T-160`'s uncovered-criterion arm refuses when a criteria path exists,
sits outside the card's expanded fence, and is owned by a DECLARED
component: the reasoning is that the card could have fenced it by naming
that slug and did not, so its absence is a fence claim. Nothing in the
prose separates a write target from a citation, and the arm says so in
its own printed `cannot:` row.

**One citation shape is worth separating, because it is the exact
opposite of a write claim.** Measured at `2771ae9` over the whole board,
`T-056`'s criteria carry:

- BLAST RADIUS: `app-interview` only. `tools/e2e/**`,
  `app/src/lib/agent-store.ts`, app-shell, Rust and parser SHALL be
  zero-byte task-branch diffs.

The arm refuses `T-056` on `app/src/lib/agent-store.ts` — a path the
criterion names in order to promise it will NOT be touched. A card is
being careful in exactly the way this repository asks cards to be
careful, and the careful sentence is what buys the refusal.

## What this card is NOT asking for

Not a narrowing taken on the strength of one instance. `T-160`'s own
module header refuses every wide reading it tried because it measured
the corpus first, and this arm's whole defence is that it was calibrated
that way. The same standard applies to narrowing it.

## What to measure first

Over every card the schedule draws, partition the arm's hits by whether
the criteria line carrying the path also carries a NEGATIVE-scope
phrase — the `zero-byte`, `SHALL NOT`, `untouched`, `BLAST RADIUS`
family — and read every member of both partitions by hand. The
derivation is one pass of the same census the arm is calibrated with:

    tools/e2e/scripts/card-preflight.mjs — pathClaims + ownersOf,
    over every id in the parser's dispatch order

At `2771ae9` the arm fires 19 times across 16 cards (18 on done cards,
1 on a planned one), so the whole corpus is small enough to read
exhaustively rather than sample.

## Acceptance criteria

- THE partition above SHALL be derived at the executing ref and every
  member of both halves read, with the count and the ref recorded — a
  count with no ref is the thing this card's parent exists to remove.
- IF the negative-scope partition is wholly false positives THEN the arm
  SHALL exclude that shape and the exclusion SHALL be named in the
  printed `cannot:` row, with a body pinning both halves — the refused
  twin and the excluded one.
- IF it is not THEN the measurement SHALL be recorded and the arm left
  exactly as it is, because a narrowing that costs a true positive is
  worse than the noise it removes.
