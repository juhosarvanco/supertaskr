---
id: T-238-s1
title: Five residues of the holder record, recorded by T-238's verifier and not filed — a dangling citation in a refusal, a release that removes what it cannot read, a false premise about session ids, a detached integration checkout that holds no seat, and an e2e suite that writes the host's worktree list
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-238-verify, phase 2 at 7705ac4, filed by the architect seat at the merge
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts]
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
