---
id: T-244-s4
title: "`undo` and `merge` hand operator-supplied refs to git with no `--` separator, so a value shaped like a git option is parsed as one — `git log --output=<file>` writes a file"
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "verifier claude-opus-5@subagent, in T-244's verification bench, 2026-09-09 — measured while probing the CLI front's argument handling"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`tools/e2e/scripts/undo.mjs` and `tools/e2e/scripts/merge.mjs` place
operator-supplied values into a git argv without the `--` end-of-options
separator. `--branch <name>` reaches `git log --first-parent --merges
--format=... <branch>`; `--force <sha>` and `--merge <sha>` reach
`git rev-parse <value>^{commit}`; `--verdict <sha>` the same. git parses
options anywhere ahead of `--`, so a value that looks like an option is
taken as one.

Measured on this machine, 2026-09-09:

    git log --first-parent --merges --format=%H --output=/tmp/probe.txt main
    exit=0, /tmp/probe.txt created

This is NOT a privilege boundary and it is not why it is worth fixing:
every value comes from the operator's own command line, and an operator
who can pass `--branch` can already run git. It is worth fixing because
it is the shape that becomes a hole the moment either verb is called by
something other than a hand — the seat skill (T-241), a CI step, or the
`merge` verb driven from a card id read off a file. The house already
treats this class as real: the fence hook and the push guard both parse
git invocations rather than trusting them.

There is no shell anywhere in these scripts — every spawn is `spawnSync`
with an argv array and no `shell: true` — so nothing here is command
injection, and the verifier's probes with `;id`, `$(...)` and backticks
were all refused or passed through verbatim. This is git's own option
parsing, and only that.

## What a fix would do

Insert `--` before the first operator-supplied ref in each invocation
(`git log ... -- <branch>` needs the branch ahead of `--`, so the shape
there is `git log <branch> --` or a `--end-of-options` guard, which git
2.24+ carries), or validate each value against a ref-shape pattern before
it is spawned and refuse a leading `-` the way `undo`'s positional
argument already does.

## How to know it is fixed

A body in `tools/e2e/tests/cli.spec.ts` passing `--branch
'--output=<tmpfile>'` and `--force '--output=<tmpfile>'` to a fixture
repository and asserting a non-zero refusal with the file NOT created —
with the positive control that the same fixture accepts an ordinary
branch name and an ordinary sha.
