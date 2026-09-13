---
id: T-295-s6
title: "A mutant block's file is confined to the project root but not out of the repository's own git directory, and the correction step WRITES the file before the `git add` that would refuse an untracked path — so the classifier is one clause short and the ordering is the wrong way round"
feature: F-04
milestone: 4
size: S
priority: 2
status: parked
wake: T-284
suggested_by: "the T-295 verifier (phase 2), 2026-09-10, security sweep: a block naming a path inside the repository's own git directory parses and is accepted, where a traversal or an absolute path is refused"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The block reader refuses a `file:` or `spec:` that is absolute or that
normalises to a parent, and a body pins both. It does not refuse a
relative path into the repository's own git administration directory,
which is inside the root the check asks about, is not tracked, and holds
files a later commit EXECUTES.

The correction step then writes the file and stages it afterwards, so a
refusal from the staging call arrives after the write has landed.
Exploitation is narrow — the named file has to exist already and to
carry the block's `new` text verbatim, and a verdict is read off the
card at a ref rather than from a caller's path — but the ordering is
backwards for a step whose input is subagent-written text, and the
classifier is one clause short of the rule it states.

T-287 settled how this repository classifies a token naming a file that
does not exist yet. The two classifiers should not answer the same token
shape differently.

## Acceptance criteria

- WHEN a mutant block names a path inside the repository's own git
  administration directory THE reader SHALL refuse it at parse time,
  naming the path, on the same footing as a traversal.
- WHEN a correction is applied THE step SHALL establish that the path is
  writable-and-tracked BEFORE any byte is written, so a refusal leaves
  the file untouched.
- A body SHALL assert the target file is unmodified after such a
  refusal, with a positive control on an ordinary in-tree path.

## Implementation notes

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; a mutant block's file is not confined out of the git directory, and the write precedes the add that would refuse it.
