---
id: T-216-s11
title: The unplaceable-push refusal is pinned only where the sentence names `cd`, so narrowing it back to the `cd` family passes the whole suite
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @V-T-216-s8, measured at 8b5000d by a mutant no body killed
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-216-s8 shipped the right BEHAVIOUR and a narrower PIN than the
behaviour: a push the guard cannot place is refused whatever defeated the
scan, but every body that drives the refusal drives a sentence naming
`cd`, so an edit that narrowed the refusal to the `cd` family would keep
the whole suite green. This is a coverage gap, not a defect — nothing is
wrong at `8b5000d` — and it is filed rather than folded into that card's
verdict because it fails none of its acceptance criteria.

## The finding, measured

Drilled at `8b5000d` against `push-guard.spec.ts`'s 86 bodies, one side
only, the landing read back from `git diff` and restored by sha256:

    return (resolved.unresolved.includes("cd") ? block : allow)(
      "push-repository-unresolved",

**86 passed, 0 failed — the mutant survives.** It is shape SEVEN, derived
from the card's criteria with the spec file closed: the criteria name one
command line, and the prose above them names the CLASS (*"a push the
guard cannot place"*).

`pushCwds` returns eleven distinct sentences. Four name `cd` and are
driven by bodies; the rest are not driven at all:

- `` `pushd` moves the working directory to a place this line never names ``
  (also `popd`)
- `` `GIT_DIR` re-points the repository from the environment ``
- `` `--git-dir` re-points the repository away from any directory this
  guard can name `` (also `--work-tree`, `--namespace`)
- `a `-C` whose value is not a literal path`
- `the push would run in <dir>, which is not a directory now`
- `this line pushes from N different working directories`

Each is a real refusal at `8b5000d` — probed from the bench,
`pushd <dir>; git push origin main` and `echo cd <dir>; git push origin
main` both exit **2**, and neither sentence contains `cd` — and none of
them would notice losing it.

## What is asked

WHEN the repository a push acts on is undetermined for a reason that does
not involve the word `cd`, THEN the guard SHALL refuse at exit 2, and a
body SHALL pin it. One body over a TABLE of the unresolved sentences is
the shape that fits: the resolver already has such a table
(*"the working directory at the push is read only where the text
determines it"*), and this is its verdict half.

## Acceptance criteria

- A mutant that fires the refusal only for sentences naming `cd` reds at
  least one body — demonstrated failing, not asserted.
- At least the `pushd`, environment-repointing and multiple-directory
  sentences are driven, each at exit 2.
- The kill set of the new body is not contained in any existing body's.
- No arm's verdict moves; `push-repository-unresolved-outside` stays a
  silent allow.

**THE ID MAY COLLIDE.** `T-216-s9` was claimed on main while this lane
held it and `T-216-s10` was renamed for that reason; the card-id
namespace is branch-scoped and nothing warns. Re-check at the merge.
