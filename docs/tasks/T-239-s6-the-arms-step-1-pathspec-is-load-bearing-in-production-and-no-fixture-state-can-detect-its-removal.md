---
id: T-239-s6
title: The arm's step-1 pathspec is load-bearing in production and no body can detect its removal — the ritual fixture's only dirty path at step 1 IS the card, so `-- plan.card` and `-- .` commit the same tree and the mutation is EQUIVALENT
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-239-s4, measured at 50b83d4, 2026-09-08
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`tools/e2e/scripts/dispatch-brief.mjs:3790` commits the stamp under an
explicit pathspec, and its own comment says why:

    // THE PATHSPEC IS LOAD-BEARING. The integration checkout is shared
    // with a human running the app (docs/CONVENTIONS.md), so a commit
    // that swept up whatever else was in the tree would be this arm
    // taking somebody else's work with it.

**No body in the suite can detect that pathspec being removed.**
MEASURED while drilling T-239-s4 at `50b83d4`: the mutant

    -  ["git", "-C", plan.root, "commit", "--quiet", "-m", message, "--", plan.card]
    +  ["git", "-C", plan.root, "commit", "--quiet", "-m", message, "--", "."]

run over the WHOLE of `brief.spec.ts` under an environment with git's
identity auto-detection disabled: **exit 0, 58 passed, zero bodies
killed.** The landing was read from `git diff`, not from a report.

The reason is fixture STATE rather than a missing assertion. The ritual
fixture is committed clean (`Checkpoint: fixture base`) and the arm's
only write before step 1's commit is the card file itself, so at the
moment the pathspec is applied the card is the ONLY dirty path in the
tree. `-- <the card>` and `-- .` therefore commit the identical tree and
the mutation is EQUIVALENT — it is not that the guard is weakly
asserted, it is that the fixture cannot express the condition the guard
exists for.

The control that this is a real hole and not a dead assertion: a
different mutation of the same function at a site the fixture CAN
express — `io.write(plan.cardFile, stamped.text + "\n")` — is killed by
*THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file*
(1 failed / 57 passed, same arming). The body measures the arm; it just
cannot measure this.

## What is asked

A body SHALL dirty a path in the ritual fixture that is NOT the card
before the arm runs — a stray file of the shape CONVENTIONS' own
`f.txt`/`g.txt` hazard names — and SHALL assert that the arm's step-1
commit leaves it uncommitted and in the worktree. That is the property
the comment claims and the only arrangement under which removing the
pathspec can red.

## Nearest class relative, named rather than merged

`T-140-s9` (done) is the same CLASS — a guard whose own bodies survive
its removal — at a different site and by a different mechanism (three
redundant guards there, an equivalent mutant under fixture state here).
Triage may judge them one class and fold this in; the two mechanisms are
distinct enough that this is filed beside it rather than appended to it.

## Why it is not in T-239-s4

Out of that card's question. T-239-s4 is the fixture's git identity; this
is the arm's pathspec, and the two share only the function they sit in.
The finding is a SUGGESTION and blocks nothing (method/roles/verifier.md
step 6).
