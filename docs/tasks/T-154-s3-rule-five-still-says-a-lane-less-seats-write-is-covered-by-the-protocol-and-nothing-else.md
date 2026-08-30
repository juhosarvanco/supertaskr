---
id: T-154-s3
title: Rule five still says a lane-less seat's write is covered by the protocol and nothing else, and it is now covered by the guard
feature: F-04
milestone: 4
priority: 30
size: S
status: suggested
blocked_by: []
touches: [method/lane-protocol.md]
suggested_by: executor claude-opus-5 @T-154-s2
builder:
verifier:
built_by:
verified_by:
review:
---

`method/lane-protocol.md` rule 5 closes with the guard's declared
limits, and one of them is now false. Verbatim, from the paragraph
beginning *"AND THE LIMITS ARE DISCLOSED IN THE SAME BREATH"*:

> **A write mediated by a shell — a redirect, a `sed -i`, a script —
> does not pass through them, and stays covered by this protocol and by
> nothing else.** So does any write by a seat that holds no lane.

The second sentence was true when it was written and is not true now.
@human ruled on 2026-08-30 (`T-154-s2`) that a lane-less seat's writes
are in scope, and the guard refuses one to any path a live lane's
manifest reserves — with `docs/tasks/`, a card's own file and the
integration seat's standing writes carved out, and a detached checkout
not judged at all so the poison drill still works. The shell half of
that paragraph stands unchanged.

**WHY THIS IS NOT IN `T-154-s2`'s DIFF.** `method/` is outside that
card's `touches:`, exactly as it was outside `T-154`'s effective fence
for the same reason: method text rides a shared version bump rather
than a lane's own (the three-file bump trap, docs/CONVENTIONS.md's
first gotcha). `T-154` routed its rule-5 sentence to `T-159`'s v0.1.8
release and that landed; this one wants the next method release the
same way, and `T-159-s1` is the standing shape for riders that queue
for one.

## Acceptance criteria

- WHEN the next method release is assembled THE rule-5 limits paragraph
  SHALL say that a lane-less seat's write is now a property of the
  write, name the carve-outs as criteria, and keep the shell limit
  unchanged.
- The sentence SHALL point at the guard's own decision function rather
  than restate it, per that paragraph's own closing instruction.
