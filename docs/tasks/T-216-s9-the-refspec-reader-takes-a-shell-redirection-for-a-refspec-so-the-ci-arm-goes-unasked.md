---
id: T-216-s9
title: The refspec reader takes a shell REDIRECTION for a refspec, so every push spelled `git push origin main 2>&1 | …` declares doubt and the CI arm goes unasked
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-216-s8, measured at 89cf296 by a positive control that expected silence and got a notice
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

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
false refusal. What it costs is the T-237 arm entirely — a run in flight
is not detected, a red newest run is not announced — on every push whose
line carries a redirection or any other `&`-adjacent token after the
refspec. That is not an exotic spelling: the very line on T-216-s8's card,
the one a seat actually ran on 2026-09-02, is of this shape.

## It belongs to a family the code already names, and the family's card
was absorbed

`push-guard.mjs`'s `pushTargetBranch` header enumerates the reader's
limits and assigns two of them (`--repo=<value>` eats the only refspec; a
destination beginning with `-` reaches `gh` as `--branch`'s value) to
`T-237-s9`. **`T-237-s9` was never filed as a card of its own — it was
ABSORBED into `T-238-s1`** (see that card's *"Absorbs: T-237-s9"*
section), so the two citations in the source now point at an id no
`docs/tasks/` file carries. Whoever takes this card decides whether the
three limits are one repair or three; they are all the same scanner
reading a token that is not a refspec.

## Acceptance criteria

- A push whose line carries a shell redirection after the refspec —
  `git push origin main 2>&1 | grep x` — resolves its target branch to
  `main`, and the CI arm is ASKED.
- The declared limits that are deliberate stay declared: a bare push
  still falls back to HEAD's branch, `--all`/`--mirror` still take the
  fallback path, and no spelling gains a REFUSAL it did not have.
- The two citations of `T-237-s9` in `pushCwds`'s neighbourhood name a
  card that exists, or are re-pointed at the one that absorbed it.
- A positive control demonstrated failing: the mutant that lets the
  redirection token back into the refspec set reds the new body.
