---
id: T-281-s12
title: "a_relative_search_path_element_reaches_no_process asserts its tattle file exists the instant resolve_cli returns, and under oversubscription the probed child has not written it yet — the body's own positive control fails to arm and the run reds"
feature: F-01
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281-s8, 2026-09-09, at 1b5061ec"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Reproducing T-281-s8's flake at its base needed contention, and the bench
supplied it as **12 concurrent copies of the whole `agent_runner` target**
on a 10-core Mac. That arrangement red the card's own body — and it red a
**third** body neither `T-288` nor `T-289` covers:

    thread 'a_relative_search_path_element_reaches_no_process'
      panicked at tests/agent_runner.rs:4121:5:
    the tattler never fires at all - arm one proved nothing

Measured on both sides of that lane's diff, 360 target runs each under
twelve concurrent copies: **5 of 360 at the base `1b5061ec`, 5 of 360 at
the tip `fb8379d`**. Identical rates, so it predates T-281-s8's fix and
is untouched by it — a separate defect, and neither `T-288` nor `T-289`
covers it.

## The finding

The body runs two arms against one fixture. Arm one asserts a RELATIVE
`PATH` element reaches no process. Arm two is its positive control — the
same directory spelled absolutely must reach one — and it is the arm that
makes arm one mean anything, as the body's own comment says: *"A tattle
file that never appears proves nothing unless the tattler is shown to
work."*

Arm two calls `resolve_cli` with the absolute spelling, and then asserts
`tattle.exists()` **immediately**. The tattle file is written by the
PROBED CHILD, and nothing orders that write against `resolve_cli`'s
return: the resolver has what it wanted (the version line) and returns,
while under oversubscription the child has not been scheduled to finish
writing. So the control does not arm, and the body reds — loudly and
correctly, which is the good half: the guard did its job and refused to
let arm one pass vacuously.

**It is the same class as `T-288`**: an arrangement that assumes one
observable orders another when nothing makes it so. It differs in what it
costs — here the casualty is a POSITIVE CONTROL, which is the shape
`method/roles/verifier.md` 2b and CONVENTIONS' A NEGATIVE ASSERTION NEEDS
A POSITIVE CONTROL both single out.

## The fix is the fixture's

Wait for the tattle rather than assume it: poll `tattle.exists()` to a
bounded deadline whose exhaustion still PANICS with this same message, in
the shape `wait_for` and `FIXTURE_DEADLINE` already give this file. That
keeps the control's meaning exactly — *the tattler must be shown to work*
— while removing the assumption that it has already worked by the time
the resolver returns.

Two things to check while there, both derived and neither measured: every
other body that asserts on a file the probed child writes has the same
shape, and `plant_binary`'s tattler could flush before it prints the
version line rather than after, which would order the two at the source.
