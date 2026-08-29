---
id: T-153-s17
title: The integration revision is still spent with no `--` separator, so a checkout holding a root path named for the branch reproduces `fatal: ambiguous argument` — the same message the resolver was built to remove, by the other half of the same git rule
feature: F-01
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: verifier claude-opus-5@subagent @T-153-s9
builder:
verifier:
built_by:
verified_by:
review:
---

## The measurement

Built at 2026-08-30 from a clone of this repository: one empty file named
`main` committed at the root, nothing else changed. `git rev-parse
--verify --quiet main^{commit}` answers `0af533b7…` at exit 0, so
`resolveIntegrationRef` accepts the first candidate and returns
`rev: "main"` — correctly, by its own contract. The read behind it then
dies:

    $ git log --first-parent --format='%H %s' main
    fatal: ambiguous argument 'main': both revision and filename
    Use '--' to separate paths from revisions, like this:
    'git <command> [<revision>...] -- [<file>...]'

Driven end to end through `brief.mjs --task T-133 --root <that clone>`:
exit **3**, and the stderr carries `fatal: ambiguous argument 'main'`
verbatim, plus the raw `Command failed: git -C … log --first-parent
--format=%H %s main` — the exec error arriving through the wrapper that
`T-153-s9` exists to stop arriving through a body.

## Why it is a separate finding and not a re-litigation

`T-153-s9` fixes the case where the name resolves to NOTHING. Git's
message has two halves and the card's own hint quotes the other one:
*"Use '--' to separate paths from revisions"*. The resolver answers the
first half; the argv still omits the separator, so the second half is
untouched. It is not a regression — the same clone fails identically
against the base module at `a533a4d` — and it is not the card's measured
subject, which is why it is routed rather than assigned.

It is worth writing down because the two failures print the SAME first
line. A future session reading `fatal: ambiguous argument 'main'` in a
CI log will find `T-153-s9` and conclude the fix regressed, when the
cause is a file in the tree.

## What it would take

`context()`'s read is the one site:

    git(root, ["log", "--first-parent", "--format=%H %s", integration.rev])

becomes `[..., integration.rev, "--"]`. **The class is a revision spent
with no `--`, and the sweep is owed**: at `960555d` this is the only
site under `tools/e2e/` that spends a revision it did not read out of a
document, but `range-rule.mjs` and `health-bands.mjs` spend
document-derived hashes and `HEAD` the same way, and a hash is
ambiguous with a path exactly as a branch name is.

A body for it costs one more shape in `refShapes()` — the `local` tree
plus a committed file named for the branch — and it kills the mutant
that removes the separator. Note that the emitted PROVENANCE strings are
hand-built rather than derived from the argv, so adding the separator
changes no figure and no `card:` stamp.
