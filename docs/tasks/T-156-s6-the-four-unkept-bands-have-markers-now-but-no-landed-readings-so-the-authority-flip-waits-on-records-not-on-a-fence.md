---
id: T-156-s6
title: Three of the four unkept bands have a marker now and still no landed reading, so the authority flip waits on records rather than on a fence — and the config still points at a card that no longer exists
feature: F-06
milestone: 4
priority: 17
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-156-s1
builder:
verifier:
built_by:
verified_by:
review:
---

**WHAT `T-156-s1` LANDED WAS THE MARKER, WHICH IS THE HALF THAT NEEDED A
DIFFERENT FENCE. WHAT IT COULD NOT LAND IS THE AUTHORITY, AND THAT IS
NOT ONLY A FENCE PROBLEM.** `docs/checkpoints/TEMPLATE.md` now owes five
stamped lines instead of three, and three of them are band markers:

| band | marker that now exists | can it be kept? |
|---|---|---|
| `machinery/gate-seconds` | the record's `Gate runtime:` total, named there as this band's only reading | yes, once records carry it |
| `north-star/cold-start-pass-rate` | the record's `Cold start:` line — switch or not, first try or not, every gap named | yes, as a FLOOR (see below) |
| `north-star/drift-incidents` | the record's `Drift incidents:` line, `0` written as a reading | yes, once records carry it |
| `north-star/rejection-rate-by-size` | **none** — still wants a ratified verdict marker in method/tasks/TASK-FORMAT.md | no, and it is not this card's |

## The sequencing constraint, which is the actual finding

A band cannot be flipped off `authority.kind: "none"` by this card's own
reasoning. `machinery/gate-seconds`' own measured reason says why, and it
says it about itself: *"there is no landed measurement to set a band
from, and setting one from a guess would be the known-vacuous keeper
docs/NORTH_STAR.md's bar calls a stop-the-line defect."* **The markers
landing does not create readings — checkpoints do.** So the work is:

1. Let records accumulate the three lines. Each checkpoint that writes
   them is one reading.
2. When there are enough to state a limit with a measurement rather than
   a guess, set `drift`/`breach` from those readings and flip
   `authority.kind` to `"readings"` with the marker named in words.
3. **The authority is a HAND, not a scanner.** ADR-019's Records clause
   forbids any suite, gate or generator from depending on
   docs/checkpoints/, and the template now restates that where it binds:
   the reading reaches `npm run health` carried by hand into a
   `--readings` file at the checkpoint that wrote it, the same path the
   suite and graph readings already take. A walk of docs/checkpoints/ is
   the wrong build of this card and would break ADR-019.
4. `north-star/cold-start-pass-rate`'s denominator is **switches that
   reached a checkpoint**, not all switches — a session that never
   integrates writes no record. The template names that bias; whoever
   sets the band's limits reads the census as a floor and says so on the
   band's `measured.reason`.

## The small true thing while you are in that file

`tools/e2e/scripts/health-bands.config.mjs` routes three keepers to
**`T-156-s2`**, and that card no longer exists: the standing triage of
2026-08-30 absorbed it into `T-156-s1` and removed the file in the same
commit. So `npm run health` prints a pointer to a card nobody can read,
three times per run, today. `machinery/gate-seconds`' keeper string is
stale in the other direction — it names the write that has now happened
(*"a Gates line in docs/checkpoints/TEMPLATE.md that stamps the total,
which this card's fence [tools/e2e] cannot write — routed as
T-156-s1"*). Both are one-line repairs inside `[tools/e2e]` and neither
is worth its own card.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 17 — AND THE HEADLINE MOVED UNDER THE CARD WHILE IT SAT

**RE-DERIVED AT `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`, and the
"no landed readings" premise is no longer true.** The markers landed and
records started carrying them the same day:

    for m in "Gate runtime:" "Cold start:" "Drift incidents:"; do
      grep -l "$m" docs/checkpoints/*.md | grep -v TEMPLATE; done

answers 5 records for `Gate runtime:` and 3 each for `Cold start:` and
`Drift incidents:`. So step 1 of this card's own sequence is RUNNING
rather than blocked, which is the good news — and it does not move step
2, because a limit set from three readings would be the guess this
card's own reasoning refuses.

**WHAT THE PROMOTION TAKES, and what it deliberately leaves.** The two
stale keeper strings are live wrongness printed on every run and they
are inside the fence; they are taken. The authority flip is NOT taken —
it waits on readings, the wait is the finding, and this card records the
census so the next reader starts from a number instead of a belief. Both
halves stay on one card because separating them would leave the flip
with no home, which is how a sequencing constraint becomes a shelf.

## Acceptance criteria

- THE health config SHALL name no card that does not exist. The three
  keeper strings routing to an absorbed id are the instance; derive the
  set at the lane's own ref rather than trusting this body, because
  triage moves card ids and this card is exactly that hazard's witness.
- THE gate-seconds keeper string SHALL be re-stated against what now
  exists rather than against what was owed when it was written — the
  record template's stamped line has landed, so the string asking for it
  is stale in the opposite direction.
- THE lane SHALL re-derive the landed-reading census for each unkept
  band with the command above, record the answer here with its date,
  and state in one sentence per band whether that count can carry a
  limit yet.
- THE lane SHALL NOT flip any band off its no-authority setting from
  this card's reasoning alone, and SHALL NOT invent a limit. A limit set
  from a guess is the known-vacuous keeper docs/NORTH_STAR.md's bar
  calls a stop-the-line defect, and it is the failure this card exists
  to prevent, not to commit.
- THE lane SHALL NOT make anything walk docs/checkpoints/. ADR-019
  forbids a suite, gate or generator depending on that directory; the
  reading reaches the health command carried BY HAND into a readings
  file at the checkpoint that wrote it, which is the same path the suite
  and graph readings already take.
- Verification: headless. The health command runs at the lane's ref and
  its output names no absent card, shown by the derived set before and
  after.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
