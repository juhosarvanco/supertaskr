---
id: T-271-s6
title: "The runner cannot know which seat called it, so T-271's ONE-SEAT rule for the scoped form is enforced by prose alone — a verifier can scope its one run and nothing refuses it"
feature: F-06
size: S
priority: 30
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-271, 2026-09-09, at a0ec8ad — ran `gate-run.mjs e2e --owning docs/CONVENTIONS.md` from the verifier's own bench and was not refused"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs]
---

T-271's second acceptance criterion says the runner SHALL NOT accept the
scoped form when a VERIFIER runs the owed suites. As landed, the runner
accepts `e2e --owning <paths>` from every caller: there is no seat gate,
because there is nothing in this repository for one to read. Verified at
a0ec8ad — `.supertaskr/holder.json` (T-238) carries `pid`, `startedAt`,
`program`, `checkout`, `takenAt` and `host`, and NO role; `gate-run.mjs`
names the word `verifier` five times and every one is a comment or the
usage string.

What DOES hold is real and should not be understated: a scoped verdict
is `SCOPED-GREEN`/`SCOPED-RED`, `judgeToken` accepts exactly `GREEN`, and
a scoped run overwrites the leg's own token entry — so a lane that only
ever scoped cannot push, and a scoped run POISONS a standing green rather
than leaving it. That closes the INTEGRATOR half of the criterion
mechanically. The VERIFIER half is closed by prose only: CONVENTIONS says
the verifier's one run is the full four legs, and nothing enforces it.

The gap is narrow but it is exactly the one @human's amendment asked
about. A verifier scoping its one run would move a cross-spec red out of
the lane's ceremony and onto merged main, where the answer is the revert
play — and no gate anywhere would notice, because a verifier's verdict is
prose and no token is minted for it.

## Acceptance criteria

- WHEN a caller DECLARES a seat that is not the executor THE runner SHALL
  refuse `--owning` at the usage code, naming the seat and saying the
  full leg is owed — the declaration read from one named environment
  variable the runner defines and documents, so the refusal exists before
  anything can set it.
- WHEN no seat is declared THE runner SHALL behave exactly as it does
  today, so this change cannot red a lane that has not adopted it.
- A body SHALL show the refusal firing on a declared verifier seat and
  NOT firing with the declaration absent, against the same paths.
- The card SHALL record that a declared seat is SPOOFABLE BY
  CONSTRUCTION and is a guard against the honest mistake rather than
  against a determined caller, so no later reader mistakes it for
  enforcement.
