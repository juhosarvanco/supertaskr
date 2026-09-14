---
id: T-320-s2
title: "A lane cannot regenerate the census or the index its own spec rename owes: the generator writes two files no lane fence carries, so the command dies EACCES and the lane learns nothing about the staleness it created"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-320, filed from the lane on 2026-09-14 as what the lane noticed and did not do"
blocked_by: []
touches: [tools/e2e/scripts/capabilities.mjs, tools/e2e/scripts/docs-scan.mjs, docs/conventions/commands.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

A lane that renames a spec body, or adds one, makes the committed
census and the generated index stale. The standing rule names the
remedy: run the capabilities generator, in the merge commit. But the
generator writes docs/CAPABILITIES.md and docs/INDEX.md, and no lane
fence carries either — so run inside a lane it dies with a bare EACCES
naming a path, and a lane that had not been told what that means would
read it as a broken command rather than as a fence doing its job.

Measured in T-320's own lane: the command exited on the permission
error with no sentence about the fence, the census it would have
written, or who owes the regeneration.

## What would settle it

The generator should DETECT that it is running inside a lane worktree
whose fence does not carry its outputs and say so in the house
vocabulary: what it would have regenerated, that the regeneration is
the integrator's at the merge, and that the lane owes the notes line
rather than the write. A DRY-RUN form that prints the diff without
writing would let a lane check that the staleness it created is only
its own. Neither changes who may write the files.

## Implementation notes

## Verdicts
