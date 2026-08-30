---
id: T-143-s1
title: Two session-economics bodies assert exit 0 from a brief the live lane list can correctly refuse, so they red in any lane holding a fence their fixture card names — the machine-scoped check inside a spec
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
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

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 3 — ONE CARRIER FOR ONE DEFECT FAMILY

Absorbs: T-162-s2, T-168-s1

**THREE CARDS DESCRIBED ONE DEFECT AND THE SITTING COLLAPSED THEM, per
`method/tasks/TASK-FORMAT.md` — two files describing one class are two
triage decisions that can disagree.** The absorbed evidence is kept
below rather than summarised away, because each of the three measured
something the others did not.

### From `T-162-s2` — the proof it is not anybody's diff

Reproduced at the BASE commit with none of that lane's changes present:
a detached scratch worktree cut at `25850bd`, same command, same
refusal, same exit 1. So the red is not a function of the diff under
test; it is a function of the machine's worktree list at the moment the
suite runs. That card also named the two bodies by line — `:73` *"the
recommended seat is a function of the CARD, and an environment full of
model dials does not move it"* and `:247` *"the advisory line is NOT a
contract row — it is printed outside the row set and derives none of
it"* — and its suite run was 318 passed / 2 failed, every other body
green.

It also set out THREE ARMS, which are the choice this card inherits:

1. **Pick a fixture card with a fence no seat holds.** Cheapest, and it
   moves the problem rather than removing it — the next card to reuse
   that fence reds the spec again.
2. **Ask the brief for a card, not for a clean exit.** Both bodies are
   about the advisory block, not about disjointness. Risk: a matcher
   widened to pass is the loosening docs/CONVENTIONS.md forbids, so the
   tolerance has to be NARROW — this finding class by name — and it
   needs its own poison drill.
3. **Synthesise the card**, the way `card-preflight.spec.ts` already
   builds a scratch repository and copies the governing docs in. Most
   work, no coupling to the live board at all, and it is the shape the
   neighbouring specs already use.

Arm 3 matches this repository's own precedent and is where that card's
evidence pointed. **The lane chooses and argues; this card does not
pre-empt it, because arms 2 and 3 have different costs and only the lane
sees the file.**

### From `T-168-s1` — the collision is not `tools/e2e`-specific

T-168's diff was two documents under `docs/research` and `docs/rooms`,
and the same two bodies still red — because the live lane holding the
colliding fence was on `docs/checkpoints/`, not on `tools/e2e`:

    fences are not disjoint: T-156-s1 docs/checkpoints/ against
    T-157 docs/checkpoints/ — the same entry (lane-protocol rule five).

Measured in that worktree, unpiped: `brief.mjs --task T-157` (whose
fence a live lane held) exit **1**; `brief.mjs --task T-164` (fence
`bin`, held by nobody) exit **0**. So the trigger is ANY overlap with
the fixture card's fence — the fixture card declares two entries and
either one is enough — which is why the fix may not be "pick a fence
today's lanes do not hold".

**And it exposes a standing hazard worth stating wherever hazards
live**: the DOCS GATE owes `npm test` from `tools/e2e/` to any diff
under `docs/`, which is most docs lanes, and this project dispatches two
or three lanes at once as a matter of routine. So a docs lane can be
handed a red that belongs to a sibling's fence, arriving under a title
about model dials and advisory lines, layers from its cause.

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
- THE lane SHALL pick one of the three arms above, name it in the body
  where the next reader meets it, and state why that body is safe to
  brief — a card pinned by name into a body any future parallel dispatch
  can red is the defect recurring under a new id.
- THE fix SHALL NOT be to change `T-157`'s fence. The card's fence is
  correct and the body's expectation is what forked from the command.
- A SWEEP of the package SHALL be recorded: every other body that spawns
  `brief.mjs` and asserts a bare `0`, with its result even when empty.
- IF the lane concludes the bodies are correct and the suite simply may
  not be run beside a colliding lane, THEN that precondition SHALL be
  published where the executor owed this suite by the DOCS GATE reads it
  before spending the run — a precondition nobody publishes is a trap.
- Verification: headless, and the run is the proof. Run the suite while
  a scratch worktree holds a lane whose card overlaps the fixture card's
  fence, and again with no such lane; both runs answer the same.
