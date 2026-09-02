---
id: T-239
title: THE DISPATCH RITUAL IS EIGHT HAND STEPS AND ONE ARM COULD PERFORM THEM IN ORDER, REFUSING AT THE FIRST FAILED STEP — the order is law, every step has a command, and only the seat's memory joins them
feature: F-06
milestone: 4
priority: 3
size: M
status: building
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
suggested_by: "the architect seat, 2026-09-02 — item 6 of docs/rooms/loop-efficiency.md; measured across the four lanes dispatched that night, each cut by hand in the order orchestrator 5b and 5c prescribe"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**EVERY STEP IS RIGHT AND THEIR SUM IS TWENTY MINUTES OF A SEAT'S
ATTENTION PER LANE.** Stamp `building` on the integration branch and
commit; cut the worktree from that commit as a sibling with an absolute
path; run `--preflight`; run `--write-fence` against the worktree; read
the manifest back; cut the verifier's bench, detached, at the same base;
assemble the brief to a file; derive the lane's port and scratch stem
from the card number. Each step has a command today; the ORDER is law
(orchestrator 5b, 5c; the serial-ritual bullet in CONVENTIONS); nothing
joins them but the dispatching seat, which is the seat that inverted
the order on 2026-09-01 (T-226) and cut four worktrees before arming
any (T-209's refusal).

T-204 generates the PROMPT; this card performs the RITUAL. They meet at
the end: the arm's last line is the covering message T-204 assembles.

## The arm

`brief.mjs --dispatch-lane T-NNN --slug <slug>` [--executor <seat>
--verifier <seat>], run from the integration checkout by the holder,
performs the steps above IN ORDER and refuses at the first that fails,
leaving the tree as it found it where it can: a failed preflight after
the stamp reverts nothing (the stamp is a fact about the card, T-226)
but removes no worktree it did not cut; a failed `--write-fence` after
the cut removes the worktree it just cut and says so. Every refusal
names the step, the command it ran, and its exit — the four house codes.

## Acceptance criteria

- WHEN the arm succeeds THE tree SHALL be exactly what the eight hand
  steps leave: the stamp commit on the integration branch, the lane
  worktree on its branch at that commit, the manifest in the lane, the
  bench detached at that commit, the brief file, and one printed block
  of lane facts (branch, worktree, base hash, bench, port, scratch stem,
  brief path) — a body SHALL compare the arm's result with a hand-run
  ritual on a fixture, file for file.
- IF any step fails THEN THE arm SHALL stop at that step, name it with
  its command and exit, and SHALL NOT perform a later step; a body per
  step SHALL prove the stop.
- THE arm SHALL refuse to cut a lane whose card is not stamped
  `building` on the integration branch (T-226's parked refusal, taken
  here), and SHALL refuse to run in a checkout that is not the
  integration checkout.
- THE port and scratch stem SHALL be DERIVED from the card number by the
  spelling CONVENTIONS publishes, never typed.
- THE arm SHALL write nothing the eight steps do not already write, and
  the READ arms of `brief.mjs` SHALL remain reads (the existing body
  *THE COMMAND IS A READ* stays green).
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

orchestrator 5b and 5c, the CONVENTIONS serial-ritual and E2E PORT
bullets, T-204 (the prompt half), T-226 (the refusal this absorbs),
T-209 (the disjointness guard the arm calls), T-233 (the base row the
arm makes true by construction), and docs/rooms/loop-efficiency.md
item 6.
