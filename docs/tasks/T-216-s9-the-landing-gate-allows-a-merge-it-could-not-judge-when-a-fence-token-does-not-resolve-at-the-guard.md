---
id: T-216-s9
title: The landing gate ALLOWS a merge it could not judge when a fence token does not resolve in the guard's own environment — T-214's app-shell left one path unjudged and the push went out with a notice nobody reads
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: the architect seat, from the push guard's own notice at 8a1ee82, 2026-09-02
blocked_by: [T-238-s1]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding, verbatim from the guard

At the push of 8a1ee82 the guard printed: *"THE LANDING GATE DID NOT
JUDGE 1 of the 6 merge commit(s) this push would add: 57a410b (T-214):
1 path(s) sit outside the RESOLVED domains of a fence carrying
unresolvable token(s) app-shell — app/test/board-truth.test.tsx. The
push is allowed and those merges are UNJUDGED."* The lane's own hook had
allowed that edit, so the slug resolved in the lane and not at the guard
(T-219-s4's class: a token the guard's environment cannot expand). The
verdict on the undetermined case is an allow with a notice, the same
shape T-216-s8 is closing for the undeterminable push, one arm over.

## What is asked

When a fence token does not resolve at the guard, the landing gate
SHALL resolve it the way the lane's hook did — through the parser's
dispatch oracle at the merge's second parent — before declaring a path
outside; and where it still cannot, it SHALL refuse rather than allow
with a notice, naming the token and the remedy (a card whose touches
spell the path). A merge judged inside its fence is unchanged.

## Acceptance criteria

- A planted merge whose card fences a slug that resolves at the second
  parent is judged INSIDE by the gate; the same merge with the slug
  unresolvable at both refs is refused by name.
- The positive control demonstrated failing: the base gate allows the
  second arrangement with a notice.
- Existing push-guard bodies green; kill sets disjoint.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-216-s8 merge

The architect seat. Three push-guard residues after T-216-s8, one lane behind T-238-s1 on the same file: the landing gate's unjudged merge (this card), the redirection read as a refspec (T-216-s10) and the refusal's generality unpinned for pushd, GIT_DIR and a non-literal -C (T-216-s11).

## Absorbs: T-216-s10 (2026-09-02, at the T-216-s8 merge)

The refspec reader takes a shell REDIRECTION for a refspec, so every push spelled `git push origin main 2>&1 | …` declares doubt and the CI arm goes unasked

**FOUND WHILE BUILDING T-216-s8, NOT FIXED THERE**, because fixing it
moves an arm's verdict and that card's fourth criterion forbids exactly
that (*"No other arm's verdict moves"*). The path is inside T-216-s8's
own fence; the SCOPE is not.

## The finding, measured

T-216-s8's positive control drives the finding's own command line with
its separator repaired — `cd <checkout> && git push origin main 2>&1 |
grep -E "REFUSED|To github"` — in a fixture where every arm is green, and
expected an ordinary silent allow. It got exit 0 and this on stderr:

    CI WAS NOT ASKED: the refspec `2>` is a value only a shell knows. A
    run is looked up BY BRANCH, and this guard reads the branch the push
    LANDS on — off the refspec where the line spells one, off HEAD where
    it does not. The push is allowed and the remote's state is
    UNVERIFIED.

`segments` splits on `[\n;|&]+`, so `… origin main 2>&1` ends its segment
at the `&` and leaves `2>` as the push invocation's last token.
`pushTargetBranch` then reads `origin` as the repository, `main` and `2>`
as two refspecs, sees two distinct targets, and declares the branch
undetermined. The redirection was never a refspec and git never saw it as
one.

## Why it matters, and how much

BOUNDED AND ONE-DIRECTIONAL, exactly like the sibling limits the reader's
own header already declares: it is a FALSE NEGATIVE and can never be a
false ref

## Absorbs: T-216-s11 (2026-09-02, at the T-216-s8 merge)

The unplaceable-push refusal is pinned only where the sentence names `cd`, so narrowing it back to the `cd` family passes the whole suite

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
