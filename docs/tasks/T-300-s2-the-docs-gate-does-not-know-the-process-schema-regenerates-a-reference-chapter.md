---
id: T-300-s2
title: "The docs gate does not know that `method/runtime/process-schema.yaml` regenerates a reference chapter, so a lane that edits the schema is never told it owes the regeneration"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300, measured at the lane tip, 2026-09-11"
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`docs/reference/15-settings.md` is GENERATED from
`method/runtime/process-schema.yaml` (T-300), and its currency is kept
by a body in `tools/e2e/tests/cli.spec.ts` that compares the committed
bytes against a fresh generation. That body is the safety net and it
works — but it reds AFTER the fact, in whichever lane happens to run the
end-to-end leg next.

What is missing is the ANNOUNCEMENT. The docs gate answers "what does
this change owe" for a path under `docs/`; it has no answer for a path
under `method/` that regenerates a page under `docs/`. So a lane whose
fence is the schema alone edits a switch, runs the suites its own fence
owes, and is never told that a committed page in the reference is now
stale. The same gap exists for the merge's regeneration step, which
regenerates the census and the graph and knows nothing about this page.

This is the shape the project already has a rule about: a generated
document goes stale silently, and the cheap gate that would have said so
is the one nobody wrote.

## What a fix looks like

Teach the derivation that the schema is an INPUT to that page — derived
from the generator rather than listed, the way the census's readers are
derived — so `docs-gate.mjs` on a diff touching the schema prints the
regeneration it owes, and so the merge's regeneration step can run it
the way it already runs the census.

## Why it was not done in T-300

`tools/e2e/scripts/docs-gate.mjs` and `docs-scan.mjs` are outside that
card's fence, and both are read by several gates. A lane that edits a
gate its card did not fence is the write the lane fence exists to
refuse.

## Acceptance criteria

- WHEN the docs gate is asked about a diff touching the process schema
  THE output SHALL name the reference chapter that schema regenerates
  and the command that regenerates it.
- WHEN the chapter is stale against the schema THE gate SHALL say so by
  name, rather than leaving it to the end-to-end leg.
