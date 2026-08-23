---
id: T-061-s7
title: The orphan drill cannot run against pre-fix byte copies, and its ESM link failure reports itself as EXIT_LEAK — the loudest verdict it has, reached having spawned nothing
status: suggested
suggested_by: verifier claude-opus-5 @T-061-verify (filed by claude-opus-5 @T-061-integrate, which is the defect's other half)
---

**Filed by the integrator on the verifier's behalf.** This was finding 1
of T-061's APPROVED verdict, written into the card and filed as no file,
so triage — which reads `docs/tasks/*.md` — would never have seen it.
That is its own small lesson and is recorded in T-061's checkpoint.

## The defect

`tools/e2e/scripts/orphan-drill.mjs` imports `isSignalableGroup` from
`./boot-port.mjs`. That symbol **does not exist at `2036fb2`** (0
occurrences) — T-061 is the commit that adds it. So the procedure
T-061's own implementation notes prescribe under *"THE FAILING CASE,
REPRODUCED FIRST"* — byte-copy both scripts from the pre-fix ref and run
the drill against them — cannot work. The drill dies at ESM link time,
before `main()`:

    SyntaxError: The requested module './boot-port.mjs' does not
    provide an export named 'isSignalableGroup'
    DRILL_PREFIX_EXIT=1

## Two arms, and the second is the one that matters

**(a) The notes describe an unreproducible procedure.** A future
verifier following them cannot get the red direction that way. The
transcript in the notes must have come from an earlier revision of the
drill. The fix to the PROSE is to say that the pre-fix comparison needs
the MUTATION, not the byte copy.

**(b) The crash reports itself as `EXIT_LEAK`.** Exit 1 is the drill's
most alarming verdict — *the boot check left orphans and the port is
still held* — and here it is reached by a script that probed nothing and
spawned nothing. `EXIT_CANNOT_RUN` (3) exists for precisely this case
and **cannot be reached**, because the failure happens before `main()`
and therefore before any `try` the script owns.

**It is a false ALARM, never a false green**, which is why the verdict
filed it rather than rejecting on it: the output is an unmistakable
stack trace, not an `[orphan-drill] LEAK:` line, so a human reading the
output is not deceived. But the four-code contract is the machine-
readable half, and on this path it lies in the direction the codes exist
to prevent confusion about. It is the same shape as `T-084-s6` (an
empty path list answered "not owed") and `T-080`'s exit-3 row (a gate
that could not run sharing a code with a gate that found something) —
the third instance of *the could-not-run case borrowing another code*.

## Suggested fix

A top-level `try`/`catch` around a **dynamic** `import()` of the module
graph, so a link failure lands on `EXIT_CANNOT_RUN` with a sentence
saying the drill did not run. Small, and it makes the contract true on
every path rather than on the paths that reach `main()`.

## Confirmed at the merge

The integrator reproduced the drill's GOOD directions at `ea7ea0a`
(control PASS exit 0; the child-exit mutant LEAK exit 1 with four
orphans and the port held) and did NOT re-run the byte-copy case — the
verifier's measurement stands and the mechanism is plain from the
import. Left as filed, per T-061's dispatch brief.
