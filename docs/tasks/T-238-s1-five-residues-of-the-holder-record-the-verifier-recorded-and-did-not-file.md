---
id: T-238-s1
title: Five residues of the holder record, recorded by T-238's verifier and not filed — a dangling citation in a refusal, a release that removes what it cannot read, a false premise about session ids, a detached integration checkout that holds no seat, and an e2e suite that writes the host's worktree list
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
suggested_by: verifier claude-opus-5@subagent @T-238-verify, phase 2 at 7705ac4, filed by the architect seat at the merge
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/checkout-currency.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FIVE THINGS THE VERDICT RECORDED AND ROUTING LEFT TO THE SEAT.** T-238
merged APPROVED; none of these blocked it, and each is one bounded
edit in the files that lane held.

1. **A dangling citation in a user-facing refusal.** The holder arm's
   refusal text cites `HARNESS_ARGV0_BASENAME`, a name nothing exports;
   a reader following it finds nothing. The refusal SHALL cite the
   derivation's real header.
2. **`--release-seat` removes a record it cannot read and prints
   "RELEASED … unopposed".** An unreadable record is a shape failure and
   SHALL be refused with the reason, never released past.
3. **The card's own premise was false as measured.** "A Bash tool call
   carries no session id" — `CLAUDE_CODE_SESSION_ID` and `CLAUDE_PID`
   ARE exported to the tool shell; only `CLAUDE_PROJECT_DIR` was
   re-measured unset. The ancestry derivation is still the better
   instrument (it survives a harness that stops exporting them, and it
   names the process the way `ps` can check), and the header SHALL say
   so with the measurement, not with the false premise.
4. **A detached integration checkout holds no seat.** The arms decide
   "the integration checkout" by branch; a detached HEAD at main's tip
   is not one, and a seat working detached there is unrecorded. The
   arms SHALL say so rather than stay silent.
5. **The e2e suite now writes the host's worktree list.** The moved
   bodies register temporary worktrees in the shared
   `git worktree list` while they run (cleaned up correctly across every
   run the verifier made), and battery 18's one red at d2702e4 was the
   integration checkout's sweep body seeing a sibling verifier's
   temporary worktree appear and vanish mid-run. Registering fixtures in
   the shared list is the machine-scoped hazard rule 4 names; the
   fixture SHALL be a clone or a worktree of a scratch repository, never
   of the host's.

- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-219-s4 merge

The architect seat. The holder's residues and the push guard's refspec residues share three files; one lane, after T-225-s2 frees brief.mjs.

## Absorbs: T-237-s8 (2026-09-02)

The identity's own home file lists its limits and does not name the ONE machine where it will not derive at all — a CI runner — so the limit is stated only in the file that consumes it

**A POINTER THAT PROMISES MORE THAN THE FILE IT POINTS AT CARRIES.**
`.claude/hooks/push-guard.mjs`'s holder section says, in as many words:

    THE LIMITS ARE THE IDENTITY'S AND THEY ARE STATED WHERE IT IS
    DERIVED, in `checkout-currency.mjs`

and then lists three — a seat that never arms, a seat that commits
without pushing, and the one-harness fact. That pointer is the right
shape: one home for the limits, and a consumer that refers to it rather
than copying it. **It is now incomplete in the direction that cost main
a red.** `sessionIdentity` derives from the nearest ancestor process
that IS the harness, and there is a whole class of machine where no such
ancestor exists: a CI runner, whose tree is `node <- bash <- Runner`.
Every local checkout has the ancestor and is green; the runner has none,
and on 2026-09-02 that difference reddened main through a body that
armed the arm from the real process tree (T-238-s2, absorbed into
T-237-s2 and closed there).

**T-237-s2 NAMED THAT C

## Absorbs: T-237-s9 (2026-09-02)

Two residues of the refspec reader the verifier filed rather than blocked on — a `--repo=<value>` eats the only refspec, and a destination beginning with `-` reaches `gh` as `--branch`'s value

**FILED RATHER THAN FOLDED IN, AND THE REASON IS THE FIX PASS'S OWN
SHAPE.** T-237-s2's verifier rejected the three residuals on ONE defect
(`--all`/`--mirror` let a live run through) and recorded these two beside
it as *"findings that do NOT block, filed rather than folded in"*. The fix
pass repaired the blocker and DECLARED these in the reader's limits block,
because a fix pass that widens its own diff is a fix pass the verifier has
to judge twice. They are carried here so the declaration has a repair
behind it.

## 1. `--repo=<value>` supplies the repository and the scanner still eats
a positional for one

`git push --repo=origin HEAD:main` is read as: `--repo=origin` skipped as
a one-token option, `HEAD:main` taken as the REPOSITORY, no refspecs left
— so `pushTargetBranch` falls back to HEAD's branch and the spelled
target `main` is never asked about. A FALSE NEGATIVE only: it can cost a
refusal, never cause one.

## 2. A destination beginning with `-` reaches `gh` as `--branch`'s
