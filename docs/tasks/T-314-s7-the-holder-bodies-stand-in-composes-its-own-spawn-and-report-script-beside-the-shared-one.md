---
id: T-314-s7
title: "`pushUnderHarness` composes its own spawn-and-report script beside the one T-314-s6 shared, so the stand-in harness is one module and two recipes"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-314-s6, at b7274d54: the symlink half of that file's stand-in was collapsed into the shared module and the script half was left, because touching it would have changed what T-238's holder bodies assert"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/fake-harness.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-314-s6 moved the stand-in harness into tools/e2e/tests/fake-harness.ts
— the symlink named the way the real harness is, the script a stand-in
runs, and the wait for it — and pointed both
tools/e2e/tests/card-preflight.spec.ts and
tools/e2e/tests/push-guard.spec.ts at it. It collapsed two copies of the
SYMLINK half into one.

The SCRIPT half still has two writers. `pushUnderHarness`, in
tools/e2e/tests/push-guard.spec.ts, builds its own inline program: it
imports the currency module, puts the seat into one named state from
inside the stand-in, runs the wired hook through a shell, and writes
back a JSON report whose shape — a status, a stderr and the harness's
own pid — is the shared `harnessScript`'s report with one field
dropped. The two programs agree today about how a stand-in reports; that
agreement is a convention nothing checks, and T-057's rule is that a
recipe in two places is two chances to disagree.

It was deliberately left alone at T-314-s6: that lane's second criterion
pins the bodies that already used the helper to what they assert, and
`pushUnderHarness` does more than spawn a CLI — the seat-writing
preamble and the shell invocation are the subject of the bodies that use
it. Sharing the report shape without changing those bodies is a
separate, careful edit.

## Acceptance criteria

- WHEN a stand-in harness reports back to the spec that started it THE report's SHAPE SHALL come from one place, so a field renamed in tools/e2e/tests/fake-harness.ts cannot leave `pushUnderHarness` reading a name nothing writes.
- WHEN the report shape is shared THE bodies that use `pushUnderHarness` in tools/e2e/tests/push-guard.spec.ts SHALL be unchanged in what they assert, including the seat state each one composes and the pid each one names, pinned by a mutant at the shared report site that reds at least one body there and one in tools/e2e/tests/card-preflight.spec.ts.
- WHEN the shared piece cannot cover the seat-writing preamble THE card SHALL say so in its notes and leave that half where it is, rather than widening the helper into a second home for the holder state machine.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
