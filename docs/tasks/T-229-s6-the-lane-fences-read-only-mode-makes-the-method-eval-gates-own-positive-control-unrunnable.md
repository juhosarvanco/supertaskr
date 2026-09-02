---
id: T-229-s6
title: The lane fence's read-only mode makes the METHOD EVAL GATE's own positive control unrunnable in exactly the lanes that owe the gate
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [tools/method-evals/lib/fixture-root.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-155`** (the method gets an eval suite whose positive
control is RUN, never assumed). This card is about the control not being
runnable where it is owed.

**MEASURED, in the T-229-s4 lane at `a0d72d4719f56d2f8fecc14fd344c62b84f50a43`:**

    node tools/method-evals/run.mjs             -> exit 0   (6 model-free evals)
    node tools/method-evals/run.mjs --selftest  -> exit 3
      MF-01: COULD NOT RUN — EACCES: permission denied, open
      '<tmp>/nputer-method-eval-mf01-control-XXXXXX/project/method/roles/executor.md'

and, from a DETACHED worktree cut from that same commit, both exit **0**.
The tree is identical; only the file modes differ.

**THE CAUSE IS THE FENCE, NOT THE METHOD.** A dispatched lane enforces
its fence physically by MODE — at that ref, 654 tracked files in the
lane are `r--r--r--` and only the two fence paths are writable.
`tools/method-evals/lib/fixture-root.mjs` builds each eval's fixture with
`cpSync`, which PRESERVES mode, so the copied `method/roles/executor.md`
lands read-only in the temp project; MF-01's `--selftest` arm then tries
to write its degraded copy of that file and gets `EACCES`. Setting
`TMPDIR` into a writable scratch directory reproduces it byte for byte,
which rules out the temp directory as the cause.

**WHY IT MATTERS RATHER THAN BEING A CURIOSITY.** The METHOD EVAL GATE
fires *at any merge whose diff touches `method/**`* — so the sessions
that owe `--selftest` are precisely the sessions holding a lane whose
fence includes a `method/` path, and precisely those sessions cannot run
it. `--selftest` is what makes the gate a check rather than a ritual
(CONVENTIONS: THE POSITIVE CONTROL IS PART OF THE SUITE AND IS RUN,
NEVER ASSUMED), and exit 3 is honest about failing rather than silently
green — which is why this is a repair and not an incident. The lane that
found it worked around it by re-running in a detached worktree; that
workaround is a per-session discovery, not a rule anybody has written
down.

## Acceptance criteria
- WHEN `fixture-root.mjs` materialises a fixture project THE copy SHALL
  be writable regardless of the source tree's modes (e.g. `cpSync` with
  a mode reset, or a `chmodSync` walk after the copy).
- WHEN `run.mjs --selftest` runs inside a checkout whose tracked files
  are mode `444` THE suite SHALL exit 0 over all six model-free evals,
  with a positive control that still detects each planted degradation.
- IF the fixture cannot be made writable THEN the eval SHALL still
  report `COULD NOT RUN` with the reason, never a pass.
