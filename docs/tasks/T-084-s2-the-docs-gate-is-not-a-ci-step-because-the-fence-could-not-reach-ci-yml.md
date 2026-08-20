---
id: T-084-s2
title: The DOCS GATE is a hand-run ritual plus a lane spec, and it is not a CI step because this card's fence could not reach ci.yml
status: suggested
suggested_by: executor claude-opus-5 @T-084
---

`tools/e2e/scripts/docs-gate.mjs` is invoked by hand from the repo root
and is deliberately NOT an npm script. The reason is mechanical rather
than a preference, and it is worth writing down because the next person
will reach for the script.

Adding `npm run lint:docs` to CONVENTIONS' `run from tools/e2e/:` bullet
puts a new command into the section `tools/e2e/tests/workflow-parity.spec.ts`
DERIVES its expectations from. That spec then reds by name — problem 1
of `deriveExpectedSteps`, "docs/CONVENTIONS.md lists [tools/e2e] npm run
lint:docs, which this spec has no entry for" — until the command is
entered in `CI_SEQUENCE` with its workflow step, or in `LOCAL_ONLY` with
the reason CI does not run it. `CI_SEQUENCE` requires the step to exist
in `.github/workflows/ci.yml`, and this card's fence is
`[docs/CONVENTIONS.md, tools/e2e]`. `LOCAL_ONLY` would have made a new
gate that CI never runs, which is worse than not having the command.

**NOTE THE CORRECTION THIS MEASURES.** CONVENTIONS' CI bullet says the
derivation "is silent in exactly ONE case, a command the DOC gains that
the spec does not yet claim". That sentence is FALSE at `e83ee1d`: the
loop over `doc.keys()` pushes a problem for exactly that case. The
silent case, if there is one, is something else.

**What is held meanwhile** is more than nothing:
`tools/e2e/tests/docs-input-gate.spec.ts` runs inside `npm test` from
tools/e2e, which IS a CI step, and it asserts the live tree clean and
the documented trigger equal to the derivation. So the gate's FINDINGS
are enforced today; what is not enforced is that anyone RUNS the
one-shot form before a merge — the same standing this repo gives GRAPH
REGEN's regen.

**The promotion is one commit on a fence that includes `.github/`:** add
`"lint:docs": "node scripts/docs-gate.mjs"` to tools/e2e's package.json,
the command to CONVENTIONS' tools/e2e bullet, the step to ci.yml, and
the `CI_SEQUENCE` entry beside it. Placement wants an argument: the gate
reads `git ls-files` and the parser's source, so it can run against a
bare checkout like the token lint, but it also wants `yaml`, which the
token lint deliberately does without.
