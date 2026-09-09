---
id: T-289
title: "the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists asserts a 900 ms grace was paid, but under oversubscription the resistant descendant is never scheduled to resist and the reap returns in 30 ms"
feature: F-01
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-281-s8, 2026-09-09, at 1b5061ec — found while amplifying the load that reproduces T-281-s8's own flake"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The same 8× oversubscription that surfaced T-288 surfaces this, on the
tree WITH T-281-s8's fix in it:

    thread 'the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists'
      panicked at tests/agent_runner.rs:1255:5:
    the exit reap returned after 30 ms of a 900 ms grace while a resistant
    same-group descendant was still running - it abandoned it

Three readings, 30 ms / 31 ms / 32 ms of a 900 ms grace. Counts:

- 8 reds in 64 runs at 8× oversubscription, before T-281-s8's fix
- 3 reds in 40 runs at 8× oversubscription, after it

**Never at 1×.** As with T-288, this is a suggestion rather than a
finding CI is waiting on.

## The finding

The body's subject is that a descendant which REFUSES to die costs the
reap the whole grace. The arrangement establishes "refuses to die" by
starting a resistant grandchild and checking `pid_alive` — but liveness
is not resistance. Under starvation the grandchild has been forked and
has not yet run its signal handler, so the reap's own liveness poll finds
the group empty and returns in 30 ms, which is the CORRECT behaviour for
what the process tree actually looked like. The assertion reads that
correct behaviour as an abandonment.

So the defect is in what the body waits for, not in the reap: it needs
the descendant to have *reached* its resistant state — a handshake the
fixture can observe — before the exit is driven. Whether the fixture can
supply one, and what it costs, is the card's real question; a bare sleep
would trade a flake for a slower flake.

## Acceptance criteria

- WHEN the body runs under 8× oversubscription of the whole target THEN
  it SHALL pass, measured over at least 40 runs, with the reproduction
  and the count in the notes.
- WHEN the exit is driven THEN the descendant SHALL be observably
  resistant first — a handshake, not an elapsed-time guess.
- The body's subject is unchanged: a same-group descendant that resists
  still costs the exit reap the full grace, and the grace is still read
  from the clock rather than asserted.
