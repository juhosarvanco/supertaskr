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

## Corroboration (2026-08-30, `T-160-s4`'s lane) — the same refusal reaching a CARD'S ACCEPTANCE CRITERION, not a spec body

Appended rather than filed beside, per `method/tasks/TASK-FORMAT.md`'s
search-before-filing clause: this card owns the class. **The instance
differs in its CONSUMER and that is why it is worth attaching.** Every
instance above is a spec BODY asserting exit 0 from `brief.mjs` against
the live repository — something a lane can fix in code. `T-160-s4`'s
instance is an ACCEPTANCE CRITERION doing it, written by the standing
triage seat, promoted at the top of its column, and unsatisfiable from
inside the lane it was dispatched to for exactly the reason stated
above.

That criterion reads *`node scripts/brief.mjs --task T-059 --preflight`
SHALL exit 0*. Measured in that lane at `@ 6904dacf2180453cb20c7488b98d11146238008a`,
which is the commit carrying the repair the criterion's own preflight
arm demanded:

    node scripts/brief.mjs --task T-059 --preflight          -> exit 1
      the only finding: fences are not disjoint — T-167-s2 crate-index
      against T-059 crate-index

    the same command over the same tree, with --root pointing at a
    DETACHED clone of that commit whose worktree list holds no task
    branch                                                   -> exit 0

`T-059` has no lane of its own. The refusal is CORRECT and it is about
`T-167-s2`, a sibling lane dispatched into the same window by the same
sitting — `docs/STATE.md`'s "Next up" names the two as parallel at that
rewrite. So the criterion's verdict is a function of which OTHER lanes
are live when it is read, which is `method/lane-protocol.md` rule four's
machine-scoped surface arriving in the one place nothing has looked at
yet: the acceptance criteria a lane is graded against. `T-168-s1`'s
absorption already established that the collision is not `tools/e2e`
specific; this establishes that it is not SPEC specific either.

**AND THE EXIT CODE IS WHERE THE TWO ANSWERS ARE WELDED TOGETHER.**
After the repair the preflight's own claim classes carry no finding at
all — paths, fence, figures, blockers and refs are all clean — and then
the assembler's live-lane finding takes the process to exit 1 under one
`brief: FOUND` heading. A reader of the exit code alone cannot tell *this
card's claims fell* from *another lane is holding a slug right now*, and
the first is a defect while the second is a schedule.

DISPOSITION HINT, the filer's and advisory: fold this into whichever of
the three arms this card takes rather than promoting it separately — the
spec bodies and the criterion want the same distinction, and repairing
only the bodies leaves the sharper instance live on the board. If the
answer is the third arm (publish the precondition), then it is owed to
the CARD-WRITING seat as well as to the suite-running one, because a
criterion is briefed to a lane that cannot see the schedule that will
refuse it.

## CORROBORATION — 2026-08-31, from inside `T-167-s8`'s lane (@ `7850f89`)

**A THIRD INSTANCE, AND IT IS NOT A SESSION-ECONOMICS BODY** — which is
the part that widens this card rather than merely confirming it.

`tools/e2e npm test` in that lane: **359 passed / 3 failed**. The two
this card already owns
(`session-economics.spec.ts`'s *"the recommended seat is a function of
the CARD…"* and *"the advisory line is NOT a contract row…"*), plus
**`dispatch-order.spec.ts`'s *"--dispatch runs on the live repository,
exits 0, and WRITES NOTHING"***, which fails by the same mechanism in a
different spec and on a different assertion — it expects the string
`"BLOCKED — the unmet blocker is named"` and gets an UNFENCEABLE report
instead.

**THE TRIGGER WAS NOT A FENCE OVERLAP THIS TIME, WHICH IS THE NEW
INFORMATION.** No live lane held `tools/e2e` against these bodies. What
broke them is a lane whose CARD IS ABSENT: `T-186` was cut on this
machine mid-suite, its card exists in no checkout cut before it, and the
assembler correctly refuses — *"a lane whose fence cannot be read is a
fence nobody can be disjoint from"* — taking the CLI to exit 1. So the
precondition these bodies actually depend on is **the whole live lane
list being READABLE**, which is strictly weaker than "no lane holds my
slug" and strictly harder for a card-writing seat to foresee.

**CONTROLLED RATHER THAN ASSUMED**: the same three bodies were run in a
detached bench at that lane's own base `bd8a8e8`, where its diff does not
exist, and failed **identically — 3 failed / 21 passed**. The reds are
the schedule, not the diff.

Filed as a corroboration and NOT as a sibling card, per
`method/tasks/TASK-FORMAT.md`: *"a second instance is worth more attached
to the first than filed beside it."*

## CORROBORATION — 2026-09-01, from `T-223`'s lane: the same two bodies, and the trigger is REF SKEW rather than the live lane list

**A FOURTH INSTANCE, AND THE NEW INFORMATION IS THAT THE MACHINE'S LANE
LIST WAS INNOCENT.** Every instance above turns on something true of the
repository at the moment the suite ran — a live lane holding the fixture
card's fence, or a lane whose card could not be read. This one turns on
something true only of the CHECKOUT THE SUITE RAN IN.

`brief.mjs` crosses a MACHINE-scoped list (the live worktrees) with a
CHECKOUT-scoped one (the card files in the tree it runs in), so its
disjointness verdict is a function of the reader's BASE. In `T-223`'s
lane, based at `28924c7`, it refused with five findings:

    fences are not disjoint: T-216-s4 tools/e2e/tests/token-scan.spec.ts
      against T-230 tools/e2e
    fences are not disjoint: T-216-s4 tools/e2e/tests/lane-lock.spec.ts
      against T-230 tools/e2e
    fences are not disjoint: T-223 tools/e2e/tests/landing-gate.spec.ts
      against T-230 tools/e2e
    fences are not disjoint: T-223 tools/e2e/scripts/dispatch-brief.mjs
      against T-230 tools/e2e
    fences are not disjoint: T-230 tools/e2e
      against T-236 tools/e2e/scripts/docs-scan.mjs

**Every one of those five is an artefact of one stale card.** `T-230`
declares `touches: [tools/e2e]` at `28924c7` and
`touches: [tools/e2e/scripts/card-preflight.mjs,
tools/e2e/tests/card-preflight.spec.ts, tools/e2e/fixtures]` at main
`aad0cf7` — narrowed in a stamp commit that landed after this lane was
cut. **At main's card set the whole wave is pairwise disjoint**, and
there is no finding to report.

**MEASURED BOTH WAYS IN ONE DETACHED BENCH, ON THE SAME MACHINE AND IN
THE SAME MINUTE**, so the live worktree list is held constant and the
only variable is the checkout's own card copies:

    session-economics.spec.ts at 28924c7  ->  2 failed / 8 passed, exit 1
    session-economics.spec.ts at aad0cf7  ->  10 passed,           exit 0

**SO THE PRECONDITION THESE BODIES DEPEND ON IS NARROWER THAN THIS CARD
HAS RECORDED AND ALSO STRICTLY HARDER TO MEET.** Not *"no live lane
holds my fixture card's fence"*, not *"the live lane list is READABLE"*,
but **"this checkout's copy of every live lane's card is current with
main"** — which no lane can secure, because `method/lane-protocol.md`
rule 2 requires it to be cut from a known-green base and the board moves
between checkpoints. That is `T-187`'s mechanism (a lane reads a stale
copy of a card) arriving in a SUITE rather than in a brief, and it is
corroborated there too.

**THE PRACTICAL COST IS THE ATTRIBUTION, NOT THE RED.** A lane meeting
these two bodies sees a refusal naming SIBLING LANES and reasonably
concludes the dispatch was defective; the wave was in fact disjoint the
whole time, and the seat that narrowed `T-230` had already done the
right thing. Arm 3 (synthesise the fixture repository) is the only arm
of the three above that removes this too, because a synthesised
repository has both a lane list and a card set of its own.

**CORROBORATION 2026-09-02, from `T-229`'s lane (a method-text card
holding NO `tools/e2e` fence at all).** The class is wider than this
card's own title: the red does not need the lane to hold `tools/e2e`,
only for the live board to hold a PAIR of lanes whose fences overlap
there. At tip `a60309c`, `gate-run.mjs e2e` returned RED / 548 bodies
with two failures — `session-economics.spec.ts:179` and
`brief-flush.spec.ts:337` — the first on `brief.mjs` exit 1 carrying
seven disjointness findings, every one of them naming `T-225`,
`T-230-s3`, `T-237` and `T-133` and none naming `T-229`.

**MEASURED AGAINST THE BASE, WHICH IS THE ATTRIBUTION THIS CARD SAYS IS
THE REAL COST.** `brief.mjs --task T-133 --root <checkout>` run from one
process against three checkouts, minutes apart on one machine:
`a60309c` (this lane's tip, five new cards) exit 1 / 15 findings;
`0c7227b` (this lane's first commit, no new cards) exit 1 / 15;
`179a7cc` (this lane's BASE, before any byte of the work) exit 1 / 15.
Identical at all three, so nothing in the lane produced it.

`brief-flush.spec.ts:337` is the same cause one step removed: it
compares two live reads and the disclosure block it diffs carries the
finding list, so a lane list that MOVES mid-run changes the byte count
between the two reads (66,579 against 66,907 here). It passed on a
re-run alone at the same tip while the other body still failed — four
lanes and four verifier benches were cut on this machine during the
run. **So the pair fails DIFFERENTLY and only one of them is
deterministic**, which is worth knowing before somebody attributes the
flaky-looking half to the machine and the other half to a diff.

## CORROBORATION, 2026-09-02 — the same two bodies, a THIRD cause, and a positive control at main

Measured by T-238's lane at `e881a5c` on Mac.lan. The four-suite
battery's e2e leg reads **2 failed / 592 passed, exit 1**, and the two
are this card's own pair — `session-economics.spec.ts:179` and `:365`.

**THE CAUSE IS THIS CARD'S CLASS AND NOT THIS CARD'S FINDING**, which is
why it is a corroboration rather than a second card. The card's own
instance is a DISJOINTNESS refusal (`fences are not disjoint`); this one
is a different refusal from the same arm:

    T-219-s3 holds a worktree on refs/heads/task/T-219-s3-carve-out-arm-reachable
      and no live card declares that id — a lane whose fence cannot be read is
      a fence nobody can be disjoint from.

Both are the assembler being RIGHT about the live lane list while the
body asserts exit 0. The mechanism is the one this card names: a
MACHINE-scoped list joined to a CHECKOUT-scoped board.

**THE THIRD CAUSE IS REF SKEW, AND IT MAKES THE PAIR RED FOR EVERY LANE
RATHER THAN ONLY FOR ONE HOLDING `tools/e2e`.** The lane whose worktree
is named does not have to share a fence with the fixture card — it only
has to be a lane whose CARD does not exist at the reading lane's base.
`T-219-s3` was cut at 07:40:36 on this machine; its card is on `main`
and is absent from this lane's base `a03259f`, so the assembler cannot
read a fence it can see a worktree for.

**MEASURED BOTH WAYS, WHICH IS WHAT MAKES IT AN ATTRIBUTION RATHER THAN
A GUESS.** The same e2e suite in the same lane read **594 passed, exit
0** at 07:33 — before that lane existed — and **592 passed / 2 failed**
at 08:2x, on a tree one assertion apart. And the POSITIVE CONTROL: the
same two bodies, run from a detached bench at `main` (`fb2a944`), where
every live lane's card IS on the board, pass — **2 passed, exit 0**.

**AND THE POPULATION MOVES WHILE YOU WATCH.** By the time the control
was run, `T-219-s3`'s worktree was gone and four other lanes had
appeared (`T-018-s6`, `T-215-s1`, `T-225-s1`, `T-229-s6`), all of them
cut after this lane's base and all of them producing the same finding.
So a lane cannot wait this out: the pair reds for as long as the board
it reads is older than the machine it runs on.
