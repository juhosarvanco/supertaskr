---
id: T-294-s4
title: "The shard's spec list is SPLICED into the lane step's script text, four hundred lines after the same workflow establishes that a value reaches a program through `env:` and never through the shell"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-294, measured at 4c9f7d7d7a93a80a932872d4412791f761508da0, 2026-09-10"
blocked_by: [T-294]
touches: [.github/, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-294's asking step carries a comment that states the rule in as many
words: the two commit ids arrive through the environment and never
through the shell, because `${{ }}` interpolation splices the payload
into the SCRIPT TEXT while an `env:` binding hands it to the process as
a value. The step obeys it — both ids are bound under `env:` and
shape-checked against a commit id before either reaches `git`.

The lane step in the shard job does the opposite with the shard's own
spec list: the list is interpolated into the run script, so the shell
that runs the leg is assembled from a value the job before it computed.

## Why this is not a security finding, and is still worth an hour

THE VALUES ARE THE REPOSITORY'S OWN TRACKED SPEC FILENAMES, derived from
the tree the runner checked out — not from an event payload. And the
trust boundary is unchanged by it: the asking job already RUNS a program
out of that same tree, so anything that could bend the spec list could
run its own code one job earlier, with the same read-only token and the
same absent secrets. The workflow's `permissions:` block is
`contents: read` with no per-job widening, which is what makes both
statements true.

What is worth fixing is the INCONSISTENCY. A file that argues a rule in
one step and departs from it in another teaches the next reader that the
rule is a preference. The departure is also the shape that stops being
harmless the moment a filename is ever derived from anything but a
tracked path.

## The shape of the fix

Bind the shard's list under `env:` and let the shell split it — the
splitting is why the value is unquoted, and that is worth a sentence at
the site rather than a reader's guess. One body in
`tools/e2e/tests/workflow-parity.spec.ts` derives that the lane step
reads the list from the environment rather than from the script text,
which is a property `shardProblems` already has the shape to carry.

## What would tell us this is not worth doing

If a future step genuinely needs the list inside the script text — a
loop over the shard's specs, say — the rule bends and the comment should
say which way. The reason to file this now is that no such need exists
today.
