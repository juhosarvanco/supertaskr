# The Loop

A card's journey from an idea to a merge, and what you do along the way.
Seven steps. The first is yours; the last six run without you unless a
gate, a verdict or a decision needs a human.

## 1. The interview

You describe the idea. The Architect asks seven questions, one at a
time — the vision, the first user, what success means, the non-goals,
the riskiest assumption, the constraints, the first milestone — and
banks each answer to disk as you give it. When the interview ends you
have the five governing documents and a board: the first cards, each
with acceptance criteria written in a form a test can hold.

**Your part:** answer. If you write a page of thoughts first, the
planner drafts the answers from it and you correct them **(v1, on the
board)**.

## 2. The board

The board is the story map: features across the top, cards underneath,
statuses and blockers read from the files. Each card carries what it
touches, which becomes its fence; its criteria, which become its tests;
and, once the decision list lands **(v1, on the board)**, its decisions
— the points where the planner would otherwise have guessed, written
as questions with a proposed answer.

**Your part:** decide. In audit mode you answer a card's decisions
before it can run. In auto mode the proposed answers are taken and you
review them in one batch at the next checkpoint. You choose the mode
per project, and per card **(v1, on the board)**. Today the planner
records the defaults it took in its report, and the verifier judges them.

## 3. Dispatch

The Architect asks the board what can start: which cards have no unmet
blocker and whose fences do not overlap a live lane. It picks by
priority, then runs one command that performs the ritual in order —
stamp the card, cut a worktree on its own branch, re-check the card's
claims against the tree, write the fence into the lane, cut the
verifier's bench at the same commit, assemble the brief, prove the port
is free — and stops. Then it spawns two seats.

**Your part:** none, unless the card is large, in which case it waits
for your approval.

## 4. Build

The builder reads its brief: the card in full, the standing documents,
its fence. It works only inside its worktree. A hook refuses any write
outside the fence at the moment it is attempted. The builder runs the
tests its card owes, plants a defect to prove each new guard can fail,
restores the tree byte for byte, records every command with its exit
code, and stamps the card. It never sees the verifier's attack plan.

## 5. Verify

The verifier's bench was cut when the lane was cut, before any diff
existed. Its first phase reads only the card and writes an attack plan:
every way a build could satisfy the criteria's letter while failing
their intent, and every measurement it wants taken before it looks.
That plan is sealed with a hash. Its second phase, a separate session,
receives the plan and the diff, runs the attacks, judges the guards,
sweeps for security defects, and appends a verdict to the card citing
the plan's hash. APPROVED, or REJECTED with reproducible failures.

**Your part:** none. A REJECTED verdict goes back to the builder for a
fix pass; the verifier judges again.

## 6. Merge

The Architect moves the lane branch to the verdict commit and merges
without fast-forward. Before the merge lands, the landing gate reads the
diff against the fence declared on the main branch: a path outside the
fence refuses the landing by name; a dependency that does not resolve
on its registry and a debt marker with no card join it **(v1, on the
board)**. The behaviour census is
regenerated from the tests. The architecture graph is re-indexed. The
full battery runs last. The push guard reads CI before anything leaves
the machine.

## 7. Record

Every merge lands with a checkpoint: what merged, at which commits,
which gates ran with which exits, what the brief got wrong, five
stamped metric lines, and the dispositions. The live state document is
regenerated from a template in the same commit, so the next session, or
the next model, can read the folder cold and explain the project, the
state and the next dispatch without asking anyone.

Then the loop begins again at step 3.

## Where you are needed

| when | what | how long |
|---|---|---|
| the interview | seven answers | thirty minutes to a board |
| a card's decisions | pick from proposed answers | minutes per card, or a batch per checkpoint |
| an open question | a ruling in your words | when a seat opens a room |
| a large card | an approval | one word |
| a checkpoint | read the record | as much as you like; it is written for you |

Everything else is the loop's.
