---
id: T-224-s4
title: "`touches:` on the integration branch's own NON-MERGE commits is never asked — the merge arm enumerates `rev-list --merges`, and limit 5's residue list does not name the gap"
feature: F-06
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2), at T-224's bench 7cebf35, 2026-09-08 — attack A1.11 of the sealed set; the allow is CORRECT by design and the silence about it is the finding
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**NOT A DEFECT IN THE ARM — A GAP IN WHAT LIMIT 5 SAYS ABOUT IT.**
`mergeLandingVerdict` enumerates what a push would add with
`git rev-list --merges <remote>..HEAD`. A NON-MERGE commit made straight
onto the integration branch is not in that list, so a `touches:` line
moved by such a commit is never compared. Measured at `7cebf35`, driving
the exported function over a fixture whose only new commit is a direct
card amendment on `main`:

    verdict=allow  code=landing-gate-no-new-merges
    reason: refs/remotes/origin/main..HEAD carries no merge commit to judge

**AND THAT ALLOW IS RIGHT.** `AMENDMENT_ROUTE` in the same module
prescribes exactly this as the sanctioned route — *"a card amendment
COMMITTED ON MAIN plus a re-run of `brief.mjs --task <id> --write-fence`
(T-211's fast path A) — on main, by triage"*. An arm that refused it
would refuse the route its own refusal text sends the seat to, which is
the `T-223` trap the module header already argues against once.

**WHAT IS OWED IS A SENTENCE, NOT A GUARD.** Limit 5's residue list at
`7cebf35` names five things the arm cannot see, (a) through (e), and none
of them is this one. A reader who has just been told the arm judges
"both landing moments" can reasonably conclude that a card amendment
reaching `main` is always compared somewhere, and it is not: the
integration checkout's own direct commits are judged by nothing. That is
the honest limit, and on this project the disclosure IS the fix
(`T-223`, and this card's own parent).

## What to build

- A sixth entry under limit 5 — `(f)` — naming the direct non-merge
  commit on the integration branch, saying it is the SANCTIONED route
  rather than a hole, and pointing at `AMENDMENT_ROUTE` for who may take
  it.
- A body in `landing-gate.spec.ts` that drives the merge arm over a range
  whose only new commit is a direct card amendment on the integration
  branch and asserts the announced `landing-gate-no-new-merges` allow —
  so the disclosure has a reader, which is the property `T-224`'s own
  disclosure bodies established.

## Read beside

`T-224` (the arm and its limit 5), `T-211` (fast path A), `T-223` (the
disclosure-is-the-fix precedent this card follows).
