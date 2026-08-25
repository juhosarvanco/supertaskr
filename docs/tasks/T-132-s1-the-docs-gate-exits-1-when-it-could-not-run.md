---
id: T-132-s1
title: The DOCS GATE answers 1 when it COULD NOT RUN, and exit 3 is unreachable because the failure precedes the script's own code
status: suggested
suggested_by: executor claude-opus-5 @T-132
touches: [tools/e2e]
---

**Measured in T-132's lane worktree at `b1783a6`, base `74feb67`, before
any dependency install.** The prescribed spelling was run exactly as
`docs/CONVENTIONS.md` prints it, from the repository root, with no
`xargs`:

    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

    Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'yaml' imported from
      …/tools/e2e/scripts/docs-gate.mjs
    exit 1        (read from $? on an unpiped command)

**Exit 1 means "the gate HAS a verdict — suites are owed."** The gate had
no verdict. It never executed one line of its own code: the failure is in
node's ESM resolver, before the module body runs, so `process.exit(3)`
cannot be reached and node's own uncaught-exception exit of **1** is what
the caller reads.

**THIS IS THE EXACT SUBSTITUTION CODE 3 EXISTS TO PREVENT, ARRIVING BY A
ROUTE THE LEGEND DOES NOT COVER.** The four-code legend is written as a
property of the gate; it is really a property of the gate *plus a working
module graph*, and the second half is invisible. A caller who reads 1 and
runs the three suites the gate did not name is not obviously wrong — but a
caller who reads 1, sees no path list, and treats the crash as "the gate
had something to say" has been handed a claim about the tree by a run that
was only ever a claim about the gate.

**THE TRIGGER IS ORDINARY, NOT EXOTIC.** Every fresh lane worktree has no
`tools/e2e/node_modules`, and an executor whose fence is nowhere near
`tools/e2e` has no reason to install there. The gate is a repo-root
command that reads as dependency-free.

**THE SHAPE OF A FIX, MARKED UNVERIFIED** (per `method/tasks/TASK-FORMAT.md`,
"A PROPOSED REPLACEMENT CARRIES ITS MEASUREMENT, OR SAYS IT HAS NONE" —
this half was written, not measured): a preflight in the script's entry
that resolves its own imports (or a tiny launcher that catches
`ERR_MODULE_NOT_FOUND` and re-exits **3** naming the missing package and
the install command). The positive control the gate's own precedent
demands applies here too: prove the launcher still lets an ordinary
0/1/2/3 through unchanged, or it is a wrapper that hides real verdicts.

**`npm run lint:docs` is NOT the same command** and has not been measured
for this — it runs from `tools/e2e/`, where the deps exist by
construction, which is probably why nobody has met this.
