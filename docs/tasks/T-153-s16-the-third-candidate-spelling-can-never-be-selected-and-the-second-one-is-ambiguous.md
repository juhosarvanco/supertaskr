---
id: T-153-s16
title: The third candidate spelling can never be selected, the second one resolves to a LOCAL branch before the remote-tracking ref, and deleting either leaves the suite green — the resolver's order is argued in prose and pinned only structurally
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

`integrationRefCandidates(branch)` in
`tools/e2e/scripts/dispatch-brief.mjs` returns
`[branch, origin/<branch>, refs/remotes/origin/<branch>]` and
`resolveIntegrationRef` takes the first that `git rev-parse --verify
--quiet <c>^{commit}` accepts. The FIRST candidate carries the safety
property and it holds — that half is verified. The other two carry three
problems, all measured at `960555d` on fixtures built from this
repository.

## ONE — the second spelling is ambiguous, and it wins

`gitrevisions` resolves `origin/main` by trying `refs/heads/origin/main`
BEFORE `refs/remotes/origin/main`. In a clone of this repository with the
local branch deleted and a local branch literally named `origin/main`
created at `HEAD~3`:

    rev-parse origin/main               -> dbfe8c1cdb68673fb9dc276aad4097ddf35f67aa
    rev-parse refs/remotes/origin/main  -> 129e3c924531fad5bcfcda8a65bfb000c8cb545e

and the brief reports `integration ref this checkout resolves:
origin/main` with `integration tip right now: dbfe8c1c…` — a third
commit that is neither the checkout's integration branch nor the remote's
tip. The module's own doc comment argues that preferring a
remote-tracking ref *"would silently answer a question about this
checkout with a fact about the remote"*; this is the same failure one
spelling over, and the candidate written to prevent it is the one below.

## TWO — the third spelling is unreachable

For `refs/remotes/origin/<b>` to resolve, `origin/<b>` must resolve too
(the same rule above), so the loop always returns at candidate two and
never reaches candidate three. The only shape that reaches it is a
`refs/tags/origin/<b>` pointing at a non-commit, which `^{commit}`
rejects. The refusal message names three spellings and the suite asserts
that it names three; nothing asserts that three can ever be SELECTED.

## THREE — the candidate set has no cardinality floor (POISON SHAPE FIVE)

Producer-side mutant, applied in a detached scratch worktree at
`960555d`, one side only:

    return [branch, `origin/${branch}`];     // third candidate deleted

`npx playwright test tests/brief.spec.ts` → **25 passed**. The mutant
SURVIVES, because the body that checks the refusal names every candidate
iterates `integrationRefCandidates(branch)` itself — *"deleting an
assertion deletes its own failure"*, the shape catalogued in
`docs/CONVENTIONS.md` with the mechanical remedy this wants: a
cardinality pin, or a coverage floor per candidate.
Restored, `shasum -a 256` back to
`f13ac1a2c95c251d7d3574551dc74082c3d209d24e9a3b3bb1af49730a0a393a`,
`git status --porcelain` empty.

## FOUR — the safety property's real content has no fixture

The whole-brief body's positive control runs against a `local` shape
built by `git init` with **no remote at all**, so "the bare name wins"
is true there for a reason that has nothing to do with preference order.
The claim that actually matters — *a remote-tracking ref can sit at a
DIFFERENT commit from the local branch of the same name, and this module
answers with the local one* — is currently argued in a comment and pinned
only by `expect(integrationRefCandidates(branch)[0]).toBe(branch)`, a
structural assertion about a list.
It IS true; measured by hand on a fourth shape (a clone with one extra
local commit): local `main` `dbabd129…`, `origin/main` `129e3c92…`, and
the brief answers `integration ref this checkout resolves: main` with the
LOCAL tip. That fourth shape belongs in `refShapes()` beside the other
three, and it is the shape under which mutant TWO of the executor's drill
(order reversed) would die behaviourally rather than structurally.

## What it would take

Swap the last two candidates, or drop the ambiguous middle one, then
decide what the emitted line PRINTS — `origin/main` is the spelling a
reader can re-run by hand and `refs/remotes/origin/main` is the one that
cannot be shadowed, and the brief's honesty assertion + the card-ledger
provenance assertion in `brief.spec.ts` both pin the current string, so
this is a two-file change and not a one-line one. Add the DIVERGENT
fourth shape, and pin the candidate list's cardinality so a deleted
spelling reds against something that did not move with it.

**None of this produces a wrong answer on any checkout this project
actually meets** — a local branch named `origin/main` is pathological.
It is filed because `T-153-s9`'s subject IS the resolution order, and an
order whose third element cannot be reached and whose deletion nothing
notices is not the order the card's prose describes.
