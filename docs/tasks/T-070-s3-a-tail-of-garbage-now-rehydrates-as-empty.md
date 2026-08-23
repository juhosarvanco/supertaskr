---
id: T-070-s3
title: Bounding the read changed one answer — a tail of unparseable lines now rehydrates as empty where the whole-file read reached further back
status: suggested
suggested_by: executor claude-opus-5 @T-070
---

**THIS IS A BEHAVIOUR T-070 CHANGED, FILED BY THE EXECUTOR WHO CHANGED
IT, BECAUSE THE CARD'S OWN SENTENCE SAYS IT SHOULD NOT HAVE HAPPENED**:
*"Every failure mode here is a slow read, never a wrong answer."* After
T-070 there is one input on which the answer moves.

**THE SHAPE.** `MAX_REHYDRATED_LINES` used to bound the SURVIVORS of a
whole-file parse: read every line, keep the parseable ones, then take
the last 200 of those. It now bounds the LINES READ: take the last 200
raw lines off the end, then parse them. On a healthy transcript the two
agree exactly, and
`the_tail_read_answers_what_the_whole_file_read_would_have_kept` in
`app/src-tauri/src/agent/sessions.rs` pins that agreement across four
budgets. They diverge when the TAIL is unparseable: with 25 good lines
followed by one garbage line, a budget of 3 reads three lines and
answers two, where the old reader would have answered three. In the
limit — 200 garbage lines appended to a good transcript — the chat
rehydrates EMPTY where it used to show the last 200 good turns.

That divergence is asserted rather than left to be discovered: the same
unit body drives it, and `read_transcript_tail`'s doc comment states it.

**WHY IT IS ACCEPTABLE HERE AND STILL WORTH A CARD.** Reaching further
back to make up the shortfall is exactly the unbounded read the card
forbids — an all-garbage file would walk to byte zero. So the trade is
forced by the criterion, not chosen. And the empty answer is already the
documented, tested behaviour for a corrupt transcript
(`a_lost_or_corrupt_transcript_still_resumes_from_the_registry_and_docs`):
losable by charter, the resume comes from the REGISTRY and the banked
work from `docs/`, so nothing is lost but scrollback. Nothing in the app
writes garbage to this file; only an external writer or a torn append
can.

**THE ARM, IF IT IS EVER WANTED.** Bound the walk by BYTES rather than
by parsed lines — keep stepping backwards while the budget of lines is
unmet, but stop unconditionally at a byte ceiling (say 8 MiB). That
recovers the old answer for a merely-dirty tail while keeping the read
bounded by construction. It costs one more loop condition and one more
constant, and it needs a body of its own, since the existing byte pin
would not distinguish the two.
