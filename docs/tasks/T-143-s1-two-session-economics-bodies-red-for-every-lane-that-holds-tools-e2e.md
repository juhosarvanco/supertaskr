---
id: T-143-s1
title: Two session-economics bodies red for every lane that holds tools/e2e, because they assert exit 0 from a command whose honest answer is FOUND
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-143
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND AT T-143's BASE, BEFORE ANY OF THAT LANE'S EDITS, AND
RE-MEASURED AFTER THEM — the same two bodies, the same message, the
same cause.** Routed rather than fixed: it is inside T-143's fence and
outside T-143's class, and greening somebody else's assertion to make
one's own lane look clean is the shape a verifier should distrust.

`tools/e2e/tests/session-economics.spec.ts` lines 73 and 247 both spawn
`brief.mjs --task T-157` against the LIVE repository and assert:

    expect(clean.status, clean.stderr ?? "").toBe(0);

`T-157` declares `touches: [tools/e2e]`. So the moment any lane holding
`tools/e2e` is live, the assembler correctly reports

    fences are not disjoint: T-143 tools/e2e against T-157 tools/e2e —
      the same entry (lane-protocol rule five).

and exits `FOUND` (1). The command is RIGHT and the body is wrong about
what a clean run means.

**MEASURED, both sides, at `c74890a89e96` on Mac.lan:** with the T-143
lane live, `npm test` from tools/e2e/ is **2 failed / 311 passed, exit
1** at the base commit with no lane edits, and **2 failed / 317 passed,
exit 1** with T-143's diff — the same two bodies both times.

## Why this is the machine-scoped hazard the protocol already names

`method/lane-protocol.md` rule 4, last paragraph: *"a check that joined
a MACHINE-scoped list to a CHECKOUT-scoped one … reddened in every older
lane the moment a newer lane was cut."* This is that, exactly. The
worktree list is machine-wide; the assertion is a constant. Two lanes
with disjoint fences, disjoint trees and disjoint runners still share
the machine's worktree list, and every written rule stays satisfied
while this reds.

## The sibling that already learned it

`tools/e2e/tests/brief.spec.ts` — the same command, the same class of
body — spells it:

    expect([EXIT.CLEAN, EXIT.FOUND], run.stderr ?? "").toContain(run.status);

with the reason written out: *"whether this repository has a finding
right now is a LIVE fact — a lane cut two minutes ago can add one — and
a body that asserted it would red in somebody else's lane for somebody
else's dispatch."* That comment is the fix, and it was written in the
same package.

## Acceptance criteria

- WHEN a live lane's fence overlaps the fixture card's THE two bodies
  SHALL still pass, because a `FOUND` exit is a correct answer to the
  question they are asking, which is about the ADVISORY BLOCK and not
  about the finding count.
- THE bodies SHALL keep discriminating: they exist to prove the
  recommended seat is a function of the CARD and not of the
  environment's model dials, and widening the accepted exit set must not
  weaken that. The advisory assertions below the exit check are the
  property; the exit check is a precondition.
- THE fix SHALL NOT be to change `T-157`'s fence. The card's fence is
  correct and the body's expectation is what forked from the command.
- A SWEEP of the package SHALL be recorded: every other body that spawns
  `brief.mjs` and asserts a bare `0`, with its result even when empty.
