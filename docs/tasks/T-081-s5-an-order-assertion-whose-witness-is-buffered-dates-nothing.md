---
id: T-081-s5
title: An order assertion whose witness is itself buffered dates nothing
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

A candidate poison shape, found on this branch and fixed on it, offered
without an ordinal because the taxonomy's renumbering is overdue by three
(STATE's "Next up" 3: SEVEN is unowned, `T-078-s13` proposes EIGHT,
`T-080-s7` proposes NINE).

**The shape.** A body claims an ORDER — *this happened before that* — and
picks as its witness an event whose own emission is DEFERRED. The witness
then arrives late no matter what the code under test does, so the
ordering the body asserts holds under the very reordering the body exists
to detect. It is not vacuous: the assertion runs, its value matters, and
it reds under a poison that deletes the witness entirely. It simply
cannot see the mutation it was written for.

**The instance, measured.** T-081's central claim is that a permission
denial reaches the screen WHEN IT HAPPENS rather than when the turn ends
— which is an order claim, because both readings deliver the same two
events with the same contents. The first draft used a text delta as the
witness: the fixture streamed a delta after the denials and the body
asserted some delta's `seq` was greater than the last denial's.

Deltas are COALESCED. `flush_pending` runs when the window expires, when
an `Activity` or `Denial` line arrives, or at the end of the relay loop —
so a delta streamed after the denials is still pending when the `result`
line is read, and it flushes AFTER a runner that batched its denials at
that line. The assertion passes under the batching mutant. It passed for
a second reason too, on the sibling fixture: with the in-band arm
disabled entirely, both denials were re-emitted from the `result` line's
cumulative record with the correct ids, so a count-and-ids assertion was
green while the whole live channel was dead.

**The fix is a witness that is emitted, not buffered.** `Activity` is
sent the instant its line is classified, so both fixtures now use a
`tool_use` line as the marker — which is also what the real planner did:
it answered the refusal by decomposing the command and running the
pieces. The assertion became "the tool the planner reached for AFTER
being refused sits after the denials in the event log", and it reds under
the batching mutant.

**The general rule, if it is worth writing down:** when a test asserts
that A precedes B, check whether B's arrival time is a property of B or
of the transport. If the transport can hold B, B cannot date A.

**AND THE SECOND QUESTION CAUGHT SOMETHING TOO**, which is worth
recording as a live worked example of shape SIX rather than as a new
shape: the first draft of the no-double-reporting body asserted the
denial ids over the same fixture the recovery body already drove, and
killed no mutant that body did not already kill. It was replaced by a
fixture that MIXES the channels — one denial on both, one on the result
line only — over which the two failure directions are separable: delete
the join and there are three events, delete the late emit and there is
one. The drill's second question ("does any other test already drive this
exact call?") is what found it.
