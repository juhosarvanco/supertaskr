---
id: T-223
title: THE LANDING GATE RESOLVES LOCAL `main` FIRST, and `git update-ref` moves that ref from inside the lane — so the sentence the no-self-widening claim rests on is false
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: [T-212]
touches: [.claude, tools/e2e]
suggested_by: "T-212's independent verifier, from a reproduction: the card's build step 2 and `landing-gate.mjs`'s module header both assert main is a ref the lane cannot move, and `git update-ref` accepts exactly that write where `git branch -f` refuses it"
builder: unassigned
review: independent
---

**THE CLAIM IS LOAD-BEARING AND IT IS NOT TRUE.** `T-212`'s landing gate
reads a lane's fence from the card AS COMMITTED ON THE INTEGRATION
BRANCH, and both the card and `.claude/hooks/landing-gate.mjs`'s module
header justify that choice with the same sentence — main is "a ref the
lane cannot move". `integrationRefCandidates` then tries the LOCAL
`main` first, and local `main` is movable from inside a lane worktree.

## The reproduction, run at T-212's verification

In a throwaway repository with `main` checked out in worktree A and a
lane branch checked out in worktree B, from B:

    git branch -f main <sha>
    -> fatal: cannot force update the branch 'main' used by worktree at ...

    git update-ref refs/heads/main <sha>
    -> ACCEPTED; main moved

`git branch -f` carries the checked-out-elsewhere guard. `git
update-ref` does not. So a lane can point local `main` at any commit —
including one whose copy of its own card carries a wider `touches:` —
and the landing gate will expand THAT fence and admit paths the real
main would refuse. This is the widening-from-inside-the-lane that rule 5
forbids and that this gate's whole read-from-main design exists to
prevent, reached by a route the design did not consider.

## Why this is small and still worth a card

It is NOT a hole an ordinary lane falls into: it takes a deliberate
plumbing command, and a seat willing to run it could equally reach for
`git push --no-verify`. The guard's floor is unchanged. What is wrong is
that a guard states an ABSOLUTE it does not have, in the one paragraph a
reader consults to decide how far to trust it — rule 5's *"a guard
described as total is worse than no guard"*, and this project's own
habit of pinning a constant against the program that owns it.

## What to build

1. **Correct the sentence** in `landing-gate.mjs`'s header and in
   `T-212`'s card: main is the ref the lane's own COMMITS cannot move,
   which is the property actually relied on, and a local ref rewrite is
   a disclosed limit beside the other four.
2. **Consider preferring `refs/remotes/origin/<branch>`** where it
   resolves, falling back to the bare name. Weigh it rather than assume
   it: `T-153-s9` measured that `actions/checkout` on a `pull_request`
   event leaves no local branch, and the candidate ORDER in
   `dispatch-brief.mjs` is owned there and asserted identical by a body
   — so a reorder here is a change to a shared, pinned fact and not a
   one-line edit. A remote-tracking ref is also writable by
   `update-ref`, so this narrows the window rather than closing it.
3. **A body** that moves local `main` with `update-ref` inside the
   fixture and asserts what the gate then does, so the limit is measured
   rather than argued.

## Read beside

`T-212` (the gate), `method/lane-protocol.md` rule 5 (the law, and the
disclosure obligation), `T-153-s9` (why the candidate order is what it
is), `T-216` (the other open rooting question on the same hook).
