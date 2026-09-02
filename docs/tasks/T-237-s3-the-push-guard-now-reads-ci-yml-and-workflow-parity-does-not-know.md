---
id: T-237-s3
title: The push guard now READS `.github/workflows/ci.yml` at push time, and the spec that owns that file does not know — a renamed step degrades a refusal's most useful sentence in silence
feature: F-06
milestone: 4
priority: 3
size: S
status: building
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**A NEW READER OF THE WORKFLOW, AND THE WORKFLOW'S OWN KEEPER HAS NOT
BEEN TOLD.** T-237 made `.claude/hooks/push-guard.mjs` read
`.github/workflows/ci.yml` at push time: `gh` names the step that failed,
and the guard looks that step up in the workflow to answer *"which
package was it testing, and does this push change anything under it"*.
That derivation is deliberate — NEVER TYPE A PATH YOU CAN DERIVE — and it
creates a dependency nothing yet keeps.

The failure mode is the quiet one. Rename a step in `ci.yml` and:

* `workflow-parity.spec.ts` stays green — it pins COMMANDS against
  docs/CONVENTIONS.md, not step NAMES;
* T-237's own spec stays green for three of its four pinned steps;
* and the guard's announcement silently degrades from *"that step runs
  in tools/e2e/, and this push DOES change something under it"* to
  *"that step's package is unknown here"*.

T-237 pins four steps by name against the real workflow, which catches
those four and nothing else. The general property — **every step in
every workflow that declares a `working-directory` names a directory that
exists, and the guard's own scanner can read every one of them** — belongs
beside the workflow's other keepers, not inside a hook's spec.

## Acceptance criteria

- THE workflow spec SHALL enumerate every step in every workflow file
  and, for each that declares a `working-directory`, assert that the
  push guard's own `stepWorkingDirectory` returns exactly that value and
  that the directory exists in the tree.
- THE enumeration SHALL be asserted NON-EMPTY before its zero is
  written down — a scanner that matched no steps would pass the loop
  above by finding nothing (docs/CONVENTIONS.md, A NEGATIVE ASSERTION
  NEEDS A POSITIVE CONTROL, and the census clause).
- A FIXTURE SHALL show the assertion able to fail: a step whose
  `working-directory` names a directory that is not there, and a step
  the scanner cannot read, each reddening by name.
- WHERE the guard's `CI_WORKFLOW_REL_PATH` no longer names a file in the
  tree THE spec SHALL red rather than skip.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-237's merge (44a95c3). The
workflow's keeper does not know the guard reads it; one body in
workflow-parity.spec.ts that renames a step in a fixture copy of ci.yml
and shows the guard's step lookup degrade by name closes it. Fence is one
spec, free now.
