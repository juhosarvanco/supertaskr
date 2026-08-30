---
id: T-154-s2
title: The guard sees the writing session's own lane, and two of the three incidents that motivated it are writes from a seat that has none
feature: F-04
milestone: 4
priority: 4
size: M
status: building
blocked_by: []
touches: [.claude, tools/e2e, docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-154
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review: independent
---

**PROMOTED at the rulings sitting (2026-08-30): @human ruled lane-less
seats' writes IN SCOPE.** A write from a checkout that is not a lane
(the integration checkout above all) to a path some LIVE lane's
manifest reserves is refused mechanically — with the carve-outs the
ruling names, stated as criteria, not left to the hook's judgement:
`docs/tasks/` stays unfenceable, a card's own file is outside every
fence, and the integration seat's ordinary writes (docs/STATE.md,
docs/checkpoints/, the dispatch and closing stamps) are never a lane's
to veto. `review: independent` per TASK-FORMAT — the builder of a cage
is not its inspector. The cost question below (a hook reading sibling
worktrees on every write) is the executor's to measure and the card's
to answer honestly; a guard too slow to keep on is the gate nobody
runs, and saying so with a measurement is an acceptable outcome.

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

## Implementation notes
<!-- executor appends before finishing -->

### Understanding, confirmed before touching anything

I am extending `.claude/hooks/lane-fence.mjs` so that the seat with NO
lane is seen: after `decide` settles that the writing checkout is not on
a `task/T-NNN-…` branch — the arm that today allows unconditionally —
the hook learns EVERY LIVE LANE'S fence and refuses a write to a
repository-relative path some live lane's manifest reserves, with the
ruling's carve-outs applied as stated criteria and never as the hook's
judgement: `docs/tasks/` (taken from each manifest's own
`alwaysWritable`, which is the parser's `UNFENCEABLE_PATHS`), a card's
own file (each manifest's `excluded`), and the integration seat's
standing writes, `docs/STATE.md` and `docs/checkpoints`. The lane arm
is left BYTE-IDENTICAL — a checkout on a task branch keeps exactly its
current behaviour, which is the card's own condition — and v1's
positive control is preserved in both directions: a manifest is only
ever consulted for a checkout whose own HEAD is a lane branch, so a
stray manifest still locks nobody out, and every refusal in the new arm
rests on a POSITIVE, readable reservation. The learning is a
zero-dependency walk of git's own worktree administration
(`<common>/worktrees/*/HEAD` + `gitdir`) rather than a `git worktree
list` subprocess, and I measure both rather than asserting either,
because the cost question is this card's to answer honestly and a guard
too slow to keep on is the gate nobody runs. My fence is
`[.claude, tools/e2e, docs/CONVENTIONS.md]`; `method/lane-protocol.md`
rule 5's own sentence about a lane-less seat is OUTSIDE it and is
routed rather than edited, exactly as T-154 routed its rule-5 text.
`docs/tasks/` is writable for these notes and the suggestions I file. I
do not stamp `done`: `review: independent`, so this lane stops at
`verifying`.

Standing triage 2026-08-30 (architect seat): PARKED — NOT RULED. docs/STATE.md states in as many words that "`T-154-s2` still needs a ruling", and that ruling is @human's; this card questions whether a guard should see the writing session's own lane, which is a policy call about what the method permits rather than a defect with a derivable answer. Two of the three incidents that motivated the guard are writes from a seat that HAS no lane, so the card is arguing the guard's premise, not its implementation — exactly the class a triage seat may route but not settle.
RESURFACES: @human rules the question STATE has queued. IF the ruling says a lane-less seat's writes are in scope THEN this promotes as a guard-class card and dispatches `review: independent` (TASK-FORMAT: the builder of a cage is not its inspector); IF it says the guard's current premise stands THEN this is DECLINED with the ruling named as the reason.
