---
id: T-278-s9
title: "`continue-on-error: true` on the floor step defangs the whole gate and the parity spec answers green — no body reads a step's conditional keys, so the one edit that turns a refusal into a print is invisible to the suite that exists to keep it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-278-s2, 2026-09-09, at b1c0a0c"
blocked_by: []
touches: [tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`diskGuardProblems` derives that the floor step carries an `exit 1`, that
its `env:` declares a positive whole number of GiB, that the number in the
name agrees with the number in the `env:`, that it reads both probes, and
that it sits immediately before the lane. It never reads
`continue-on-error:`.

So one key defangs it completely. A floor step that still prints every
`df`, still computes `floor_kib`, still runs the comparison and still exits
1 — and whose failure the job ignores — is exactly the print-only guard the
spec's own mutant (5) refuses when the `exit 1` is removed, arrived at by a
different door.

MEASURED, both sides, 2026-09-09 at the T-278-s2 bench:

- `continue-on-error: true` added to the floor step in `ci.yml` at the
  T-278-s2 tip `b1c0a0c`, `workflow-parity.spec.ts` run alone:
  **27 passed, exit 0**.
- The same edit against the BASE `2e9233d` and the base spec:
  **22 passed, exit 0**.

The second reading is why this is a card and not a correction against
T-278-s2: **the hole is inherited from T-278 and predates that lane**, whose
own fence was the same two files. T-278-s2 was measured against it and is
not carrying it.

THE CLASS IS WIDER THAN THE ONE KEY. A step's conditional keys —
`continue-on-error:`, `if:`, and `timeout-minutes:` set low enough to
guarantee a kill — are all ways to leave a guard in the file and take its
effect away, and none of the three disk derivations reads any of them
except the one place `diskGuardProblems` checks the after-reading's
`if: always()`. That single check is the proof the shape was already
understood here; what is missing is its generalisation.

A NOTE ON SCOPE, so the next seat does not widen this by accident. The
free-disk step's own `if:` blindness is NOT this card: it was assigned as a
correction in T-278-s2's verdict and lands with that lane. What is left here
is the floor step's `continue-on-error:` and the class around it.

The remedy is a derivation, never a list: ask of every step the disk
derivations already name whether it declares a key that can suppress or
skip it, and red naming the key and the step. The existing
`always()` check is the shape to generalise rather than to copy beside.
