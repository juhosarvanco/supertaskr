---
id: T-288
title: "a_cancelled_interview_leaves_a_dead_child_an_untouched_docs_and_a_resumable_project cancels on a pid rather than on the init line, so under load the session id is never captured and the reopen offers Started instead of ResumeAvailable"
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

Hunting T-281-s8's intermittent needed contention, and 8 concurrent
copies of the `agent_runner` target on this 10-core Mac supplied it. At
that load a second body reds, and it is NOT T-281-s8's:

    thread 'a_cancelled_interview_leaves_a_dead_child_an_untouched_docs_and_a_resumable_project'
      panicked at tests/agent_runner.rs:5768:18:
    a cancelled interview must stay resumable, got Started { turn: 1 }

Measured twice, at the same ref, on the tree WITH T-281-s8's fix in it —
so this is a separate defect and not a leftover of that one:

- 9 reds in 64 runs at 8× oversubscription, before the fix
- 3 reds in 40 runs at 8× oversubscription, after it

**Never once at 1×**: 20 runs of the target solo and 720 runs of a single
body under 12× load produced none of these. CI has not taken it either.
That is why this is a suggestion at p4 and not a p1 — but the shape is
the same class of hazard T-281-s8 was, and the same argument applies: an
unnamed intermittent gets attributed to whatever diff is nearest.

## The finding

The body cancels as soon as it has read the child's pid. Under load the
fake agent has not yet emitted its init line by then, so no
`native_session_id` is ever captured; the registry entry is written
without one, and the reopen therefore offers a fresh `Started` rather
than the `ResumeAvailable` the body asserts. The arrangement's assumption
is "by the time there is a pid there is an init line", and the two are
not ordered.

The fix is the fixture's, not the runner's: cancel on the *event* the
body actually depends on (`SessionRegistered`, or whichever event carries
the captured id) rather than on the pid. `wait_for` already exists in the
file for exactly this.

A second line appears in the same captured output and may be a second
face of the same thing, or may not — it is recorded rather than
diagnosed:

    [supertaskr] agent: session registry write failed: No such file or directory (os error 2)

## Acceptance criteria

- WHEN the body runs under 8× oversubscription of the whole target THEN
  it SHALL pass, measured over at least 40 runs, with the reproduction
  and the count in the notes.
- WHEN the cancel is armed THEN it SHALL be ordered after the event that
  carries the captured session id, not after the pid read.
- The body's subject is unchanged: a cancelled interview still leaves a
  dead child, an untouched `docs/`, and a resumable project.
