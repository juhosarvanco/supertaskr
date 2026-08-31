---
id: T-212
title: THE LANDING GATE — a lane push may not carry a path outside its own expanded fence, because the committed diff is the one account of a write no parser can be talked out of
feature: F-06
milestone: 4
priority: 1
size: M
status: building
blocked_by: [T-209]
touches: [.claude, tools/e2e]
suggested_by: "the enforcement stack's layer (a) (peer session nputer-10, direction approved by @human); split out of a planned T-203 amendment by nputer-10 so the token gate stays dispatch-ready and T-210's blocker names the thing it actually waits for"
builder: claude-opus-5@subagent
review: independent
---

**THE COMPLETE ACCOUNT OF WHAT A LANE WROTE IS ITS COMMITTED DIFF.**
`T-025-s4` proved that deciding what an arbitrary shell command will
write is not a parsing problem this project will win, and `T-210` builds
the physical layer that makes such writes *fail*. This card is the layer
above both, and the only one whose coverage is total by construction:
whatever wrote a file — Edit, bash, a script, a build tool — only
COMMITTED content can land, and committed content is fully visible in
`git diff --name-only`. Judge the outcome, not the intention.

## What to build

**An arm on the pre-push hook** (`.claude/hooks/push-guard.mjs`, which
already imports `LANE_BRANCH_RE` at line 68): when the pushed ref
matches a lane branch —

1. derive the changed paths **MERGE-BASE-to-tip**, never
   base-at-cut-to-tip — this is what keeps a lane that legitimately
   performed a checkpoint sync (fast path B, `T-211`) from being charged
   with main's own paths, because the merge-base moves past them;
2. expand the card's `touches:` **from the card AS COMMITTED ON MAIN
   at push time** (`git show main:docs/tasks/…`) — never from a
   manifest, which the lane could edit, and **never from the lane's own
   copy at any tip**: a gate that reads a card the lane authored lets a
   lane widen its own gate by editing its own `touches:`, which
   `lane-protocol.md:182` already forbids ("a fence is not widened from
   inside the lane it fences" — the architect seat flagged this hole
   before it shipped). Main is a ref the lane cannot move, and it is
   exactly where a fast-path-A widening lands, because the widening act
   is a card amendment COMMITTED on main plus `--write-fence`
   (`T-211`);
3. intersect with **`T-209`'s one implementation** — this card takes the
   push call site; the integrator ritual takes the merge call site on
   the RANGE RULE's integrator pair; a second copy of the intersection
   is `T-057`'s defect;
4. **REFUSE the push, naming every out-of-fence path.** A refusal that
   does not say what escaped sends the seat back to guessing.

A card with an ABSENT or EMPTY `touches:` is the universal set's dual at
this gate: every changed path is out-of-fence, so the push is refused
whole (`T-209`'s rule 2, same reasoning — the least careful card must
not get the widest licence).

## What this gate cannot see, stated so it is not oversold

**A lane writing ANOTHER lane's worktree never appears in its own
diff.** That vector is `T-210`'s, and the two cards state each other's
blind spots on purpose — a guard trusted further than it measures is
this project's most repeated defect.

## Acceptance criteria

- A PUSH of a lane branch whose merge-base-to-tip diff contains a path
  outside the card's expanded fence SHALL be REFUSED, and the refusal
  SHALL name every out-of-fence path.
- **A POSITIVE CONTROL SHALL prove a lane push wholly inside its fence
  is ALLOWED**, and a second SHALL prove a NON-lane push is UNAFFECTED
  by this arm — a guard that refuses everything is indistinguishable
  from one that works.
- A lane carrying a legitimate checkpoint sync SHALL NOT be refused for
  main's own paths — a body SHALL prove the diff is computed
  merge-base-to-tip.
- A card with absent or empty `touches:` SHALL have its push refused
  whole.
- THE fence SHALL be expanded from the card as committed on MAIN at
  push time; one body SHALL prove a manifest edited inside the lane
  does not widen this gate, and a second SHALL prove a lane that edits
  its own card's `touches:` does not widen it either — the lane's copy
  of its card is admitted to the diff as a protocol write (status,
  stamps) and has NO EFFECT on this gate's fence.
- THE intersection SHALL be `T-209`'s implementation, imported — not a
  second derivation.
- THE guard SHALL be proved to FIRE end to end per `T-167-s8`'s
  three-arm shape: a real out-of-fence commit, a real push attempt
  against a bare remote, and the remote ref asserted UNCHANGED.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Why `blocked_by: [T-209]` and why this is not part of `T-203`

`T-209` builds the single intersection this gate calls; building a
second one here is the exact defect `T-209` exists to end. And `T-203`
is dispatch-ready TODAY — its token gate would have refused three real
pushes the night it was filed — so welding this gate onto it would park
a ready p1 guard behind two lanes. One hook, two arms, two cards:
`T-207`'s own precedent, one artifact per meaning.

## Read beside

`T-209` (the implementation this calls), `T-203` (the same hook's other
arm — the token gate), `T-210` (the physical layer covering this gate's
blind spot, blocked on this card), `T-211` (the fast paths whose sync
this gate's merge-base rule accommodates), `T-167-s8` (the fire-proof
shape), `T-025-s4` (why outcomes are judged, not intentions),
`method/lane-protocol.md:182`.
