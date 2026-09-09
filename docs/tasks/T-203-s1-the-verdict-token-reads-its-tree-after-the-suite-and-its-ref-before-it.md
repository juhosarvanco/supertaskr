---
id: T-203-s1
title: The verdict token reads its TREE after the suite and its REF before it, so a run that spans a commit mints a GREEN for a tree it never graded — `token-stale` cannot see it and the token itself shows the disagreement
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: "T-126-s2's executor, from its OWN token file — a killed e2e leg wrote ref=300d04b beside tree=48d50df, two commits apart, at 2026-09-02"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE TOKEN'S TWO IDENTIFIERS ARE READ AT DIFFERENT TIMES, AND A LONG
SUITE IS LONG ENOUGH FOR THEM TO DISAGREE.**

- `gate-run.mjs` captures `ref` with `currentRef(root)` — `git rev-parse
  HEAD` — **before** it spawns the suite (its own comment: *"The ref the
  run happened at. A count without one is not a figure."*).
- `writeToken` (`.claude/hooks/gate-token.mjs`) reads `git rev-parse
  HEAD^{tree}` **when the token is written**, which is after the suite
  finishes.

So a commit landing between those two reads produces a token whose `ref`
names the commit the suite actually graded and whose `tree` names a
LATER one. `dirty` is measured at the same late moment.

## Observed, not reasoned — this lane's own token

    "e2e": { "exit": -1, "bodies": 0, "verdict": "REFUSED",
             "ref": "300d04b…", "tree": "48d50df…" }

`300d04b`'s tree is `c5c9935`; `48d50df` is `56535cc`'s. Two commits
apart, in one token, written by one run. The e2e leg takes tens of
minutes on a loaded machine and this repository's own conventions say so
— *"On a loaded machine the e2e leg can exceed ten minutes"* — so the
window is not a corner case, it is the ordinary shape of an e2e run
beside a working seat.

## Why this defeats the refusal it was built for

`push-guard.mjs` keys on the tree being pushed, and `token-stale` means
*"wrong tree"*. A token minted this way carries the RIGHT tree by
construction — the current one — while grading an older one, so the
refusal that exists to catch exactly this cannot fire. The
`CONVENTIONS.md` remedy in the gate-runner bullet is a DISCIPLINE
(*"the battery is run LAST, after every commit"*), which is the class of
rule this repository keeps writing down and breaking; the instrument can
enforce it instead.

**THIS LANE WAS NOT BITTEN, AND THAT IS LUCK RATHER THAN SAFETY.** Its
verdict was `REFUSED reason=zero-bodies` because the run was killed, so
no false GREEN was minted. A run that had simply finished would have
written GREEN against `48d50df`.

## The repair, and it is small

Capture the tree BESIDE the ref, before the suite spawns, and hand it to
`writeToken` — the `opts.tree` parameter already exists in that module's
signature. Then either refuse (`token-unkeyed`, whose name already fits)
or record both when the tree has moved by write time, so the token can
never claim a tree the suite did not see. A body in
`tools/e2e/tests/gate-run.spec.ts` commits between the spawn and the
write and requires the token not to claim the new tree.

## Fence

`tools/e2e/scripts/gate-run.mjs` (where `ref` is captured and
`writeToken` is called), `.claude/hooks/gate-token.mjs` (where the tree
is read), and `tools/e2e/tests/gate-run.spec.ts` for the body.

## The id was checked free rather than assumed

`T-203` carries the token's own card and had **no** `T-203-s*` anywhere —
in this lane's tree or on `main` — when this was filed
(`grep -rno 'T-203-s[0-9]\+'` over `docs/ method/ tools/ .claude/`, and
`git grep -ho` on `main`, both empty). Filed under `T-203` rather than
under the filing lane's own card because `TASK-FORMAT`'s *search before
filing* puts a finding with the card that owns its class, and the class
here is the verdict token's, not the dispatch join's.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-126-s2 merge

The architect seat. The runner captures ref before the suite and the token tree after it, so a run spanning a commit mints a token for a tree it never graded; the push guard cannot see it. A guard-class defect. No dispatch follows today by the user's instruction.
