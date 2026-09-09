---
id: T-279
title: A lane runs its owed suites ONCE, at its final code-and-notes commit, and the `verifying` stamp commit is exempt — the same tree was graded two or three times per lane last night, and again by the verifier and the push
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human (2026-09-09): \"Yes, file both\" — on the seat's finding that every lane ran the end-to-end leg two or three times (25–36 minutes of a lane's clock) for one tree"
blocked_by: []
touches: [method/roles/executor.md, method/lane-protocol.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At the second sitting of 2026-09-09 every lane ran the end-to-end leg
two or three times: T-278 twice, T-256 three times, T-238-s1 three
times (the lanes' own reports, each row with its ref). The leg takes
about twelve minutes, so a lane spent 25–36 minutes of its clock
grading what was, in every case but the fix passes, one tree.

The repeats come from the contract, not from the code. The executor
runs the suites its fence owes at its tip; then it writes its
implementation notes and files its suggested cards, which is a commit;
that commit moves the tip, and the docs gate counts a card write as an
input of the end-to-end suite (brief.spec reads the board), so the
contract's letter asks for the leg again. Then the `status: verifying`
stamp is one more card commit. And the verifier runs the whole battery
at that same tip (T-262), and the integrator runs it again on merged
main before the push (T-203). One tree, three to five full runs.

## Acceptance criteria

- WHEN a lane's tip carries its code AND its implementation notes AND
  its suggested cards THE executor SHALL run the suites its fence owes
  ONCE, at that commit, and the report SHALL name each suite with the
  ref it ran at and the count beside the exit.
- WHEN the last commit of a lane moves ONLY the card's `status:` line
  to `verifying` THE lane SHALL NOT re-run any suite for it, and the
  report SHALL say so in as many words — the verifier's one run at the
  tip (T-262) is what grades that commit.
- WHEN a fix pass lands after a verdict THE suites the fix's own paths
  owe SHALL be re-run at the fix's tip (scoped when T-271 has landed,
  whole until then), and the FIX PASS section SHALL name them.
- WHEN executor.md and method/lane-protocol.md are read THE order
  SHALL be stated once: code, notes and cards, the suites, the stamp —
  and the reason (one tree, graded once by the lane and once by the
  bench) stated beside it; the method eval gate SHALL run and the
  bump SHALL carry its eval block.
- IF a lane cannot tell whether its last commit moved more than the
  status line THEN it SHALL run the suites again rather than assume —
  the exemption is for the stamp alone.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
