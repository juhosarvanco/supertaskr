---
id: T-295-s11
title: "A mutant block whose NEW text is a substring of its own OLD can only ever be REFUSED at the merge after T-295-s9, however honest it is — and the reader that could name that shape at read time, where a verifier is still standing, says nothing about it"
feature: F-04
milestone: 4
size: S
priority: 1
status: planned
suggested_by: "verifier claude-opus-5@subagent @T-295-s9, proposed in that lane's own notes and not filed there; measured at that card's tip"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-295-s9 makes the merge verb's correction step act on exactly two
arrangements of a mutant block's two anchors — the block's `old` text
matching once with its `new` text absent, which is the correction already
in the tree, and `old` absent with `new` once, which is the correction
owed at that one site. Every other arrangement is refused by name before
any write. That is the right answer and it closed a fault that cost main
a line of verified code.

It has a consequence the card argues for and nobody has costed. Where a
block's `new` text is a SUBSTRING of its own `old` — a clause deleted, a
guard dropped, a condition narrowed, which is an ordinary shape for a
correction — a tree that already carries `old` carries `new` inside it,
so the counts read one of each and the block is refused. The same block
refuses on its own idempotent re-run: it is applied once from the owed
state, and the state it leaves behind reads as both-present. Two counts
cannot separate that arrangement from "the correction is owed here and
its `old` text also occurs elsewhere", which is the arrangement that cost
main a line, so refusing both is correct at the merge.

The place it is NOT correct to discover this is the merge. The block is
written by a verifier, in a verdict, on a bench, while that seat is still
standing and can pick a longer anchor in one edit. By the time the verb
meets the block the verifier is gone, the merge stops, and the seat
applies the correction by hand at the site the verdict names — which is
the hand work this whole card series exists to remove.

Measured at T-295-s9's tip: `readMutantBlocks` already refuses several
block shapes at read time — two `--- old` markers, two `--- new`, an
empty `old`, `old` identical to `new`, a line number in any field, and a
path escaping the root. It does not refuse, or even mention, a `new` that
is a substring of its own `old`. Fifty-six blocks are committed under
`docs/tasks` today.

## What this would be

The reader names the shape where it can still be fixed: a block whose
`new` text is a substring of its own `old` (or the reverse) is reported
at read time, by name, with the suggestion that the anchor be widened
until the two texts are disjoint — leaving it to the seat whether that is
a refusal or a warning, since the merge's own refusal already keeps the
tree safe either way. A body plants such a block and requires the
report, with the control that a block whose anchors are disjoint draws
none.

## Implementation notes

Re-triaged 2026-09-15 by the architect seat on the owner's ruling of the
same day, after the Codex orchestrator's review: status planned, the
priority raised to the top of the queue, tier guarded provisionally (the
fence carries merge.mjs, which the guard-class map names, and a small
diagnostic is not thereby eligible for the bounded tier), size kept. The
aim is narrowed and the advice above is corrected; the contract is
consolidated from these lines before any dispatch:

- The diagnostic is a NAMED read-time report that reaches the verifier's
  completion path while the verifier still stands; invoking the same
  reader only at the merge would reword the late stop and prevent
  nothing. T-295-s9's write-time refusals stay intact, and the unsafe or
  ambiguous application stays refused.
- Warning versus refusal is chosen explicitly when the contract is
  consolidated. The lean reading is a named diagnostic with a live
  verifier-facing validation invocation and no new hard failure over the
  reading of historical verdicts; a requirement that newly produced
  executable blocks pass validation is scoped to that boundary.
- "Widen the anchor until the two texts are disjoint" is withdrawn as a
  promise: a deletion mutant can keep one anchor inside the other
  whatever context is added. The report requires an unambiguous supported
  block or answers an explicit unsupported result. Contextual application
  of overlapping anchors is a separate and larger contract that keeps the
  wrong-site regression controls.
- The promotion changes nothing in the delegated order; the card is
  dispatched only under the corresponding authorization.

## Verdicts
