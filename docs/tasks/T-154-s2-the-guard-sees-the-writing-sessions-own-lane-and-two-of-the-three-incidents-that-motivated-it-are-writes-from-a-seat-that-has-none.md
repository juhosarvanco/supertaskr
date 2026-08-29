---
id: T-154-s2
title: The guard sees the writing session's own lane, and two of the three incidents that motivated it are writes from a seat that has none
status: suggested
suggested_by: executor claude-opus-5 @T-154
---

**T-154's spec paragraph and T-154's redesigned mechanism do not cover
the same set, and the difference is not a defect in either — it is a
gap that wants its own card.**

The card opens: *"Three logged incidents would have been blocked
mechanically: `db4c903` (an architect edit inside T-138's held fence),
T-126's breach (verdict `de05430` …), and the architect session's
2026-08-29 report ('I edited a file a live lane held')."*

The mechanism it then specifies — and which landed — arms on the
**WRITING session's own branch**: `decide` in
`.claude/hooks/lane-fence.mjs` settles lane-ness from the checkout's own
HEAD before it looks for a manifest, and a checkout that is not on a
`task/T-NNN-…` branch is allowed. That is deliberate and load-bearing:
it is the positive control the card's own second criterion requires, and
it is what keeps a stray manifest from ever locking an integrator out.

**But an architect editing a file inside a live lane's fence is doing it
FROM THE INTEGRATION CHECKOUT**, which is not a lane, so this guard
stands aside — correctly, by its own rules. It blocks an executor
reaching OUT of its fence. It does not block a seat with no fence
reaching IN. Two of the three incidents the card cites are the second
shape; T-126's breach is the first, and that one is covered.

## What the second shape would take

Not a variation on this hook — a different question. The hook would have
to know **every live lane's** fence, not its own: read
`git worktree list --porcelain`, filter on the branch (the spelling
`laneSpellings` publishes), read each lane's own
`.nputer/lane-fence.json`, and refuse a write in the integration
checkout to any path some other lane's manifest reserves. Every piece
exists — `lanesFrom` and `knownPathOracle` in
`tools/e2e/scripts/dispatch-order.mjs` already do the lane half for the
board — but a hook that reads sibling worktrees on every keystroke is a
different cost and a different failure surface from one that reads one
file, and the zero-dependency budget that makes v1 work at all would
have to stretch to a `git` subprocess or to walking `.git/worktrees/*`
by hand.

**IT ALSO NEEDS A RULING BEFORE IT NEEDS CODE.** A seat in the
integration checkout writes there legitimately and constantly — the
dispatch stamp, the checkpoint, the closing stamp, `docs/STATE.md` —
and `method/lane-protocol.md` rule 5's carve-outs (`docs/tasks/` is
unfenceable, a card's own file is outside every fence) were written for
a LANE reading its own fence, not for a third party reading someone
else's. Which of an architect's ordinary writes a live lane may veto is
a question for triage, and answering it in a hook would be the hook
deciding it.

Filed rather than built: T-154's fence reached `.claude/` and
`tools/e2e`, so the code was reachable and the RULING was not.
