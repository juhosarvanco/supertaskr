---
id: T-181
title: Every mechanically-triggered obligation was met 100% by two seats in one night and every memory-held one decayed — the checkpoint's unmechanised half (health readings, the boot gate, the audit) wants T-167-s8's shape
status: suggested
suggested_by: "nputer-bc (outgoing integrator seat) 2026-08-31, from a self-audit by the incoming seat; both seats are the evidence"
touches: [.claude, tools/e2e]
---

**CLASS PARENT: `T-167-s8`**, and this card is deliberately NOT filed as
a corroboration of it. `T-167-s8` mechanises ONE obligation (ask the
graph before a push) because one seat broke it three times in a day.
This card is the observation that the same ARGUMENT generalises, and the
generalisation has a measurement behind it that `T-167-s8` did not have.
Triage may fold them; the filer says what it considered.

## The measurement, over two seats and one night (2026-08-30/31)

Split the checkpoint's obligations by whether something MECHANICAL fires
them, and the compliance separates completely:

**MECHANICALLY TRIGGERED — met, every time, by both seats.** The DOCS
GATE (a script the integrator runs and CI holds the whole-tree half of),
`index --check` (a command with an exit code, wired into CI), the
lane-fence hook (a PreToolUse refusal), the governing-document budgets
(reported on every `lint:docs` run). Not one of these was skipped. Two of
them CAUGHT REAL DEFECTS in the seats' own work — a duplicated
frontmatter key block, and this file's own breached band.

**MEMORY-HELD — decayed inside one session, and then replicated.** The
HEALTH BANDS (`T-156`: owed at EVERY checkpoint) were run zero times
across five records. The BOOT GATE was leaned on second-hand from
in-lane runs rather than run at the merge. `cargo audit` was not run at
all. **And the decay was inherited rather than invented**: the outgoing
seat's records taught the incoming seat a checkpoint checklist with those
holes already in it, so ramping up from records — which is exactly what
this project asks a new seat to do — reproduced the gaps faithfully.
Nobody was careless; the ritual was the wrong shape.

**WHAT THE FIRST HEALTH RUN FOUND, which is the argument in one fact:**
`docs-headroom/docs/STATE.md` was **BREACHED**, not warned — and the seat
that breached it had noticed the warning twice that evening and deferred
it both times. The band had been sitting there, correct and unread, the
whole time.

## Why "we will remember from now on" is not the fix

The obvious remedy is a resolution, and the record already contains one
from the seat that made the mistake. **Tonight is the evidence that a
resolution is the weakest available instrument**: the health-band
obligation was already written down, in `docs/CONVENTIONS.md`, in
`method/` and in the record TEMPLATE's own Gates-and-Metrics section, and
it decayed anyway across five consecutive records written by two
different seats who had both read it.

`method/roles/` and CONVENTIONS are full of correct sentences. The ones
that hold are the ones something executes.

## What a fix would have to decide

1. **WHERE it fires.** `T-167-s8` chose the push. A checkpoint is not a
   git operation, so this needs its own trigger — the natural candidate
   is the commit that writes a `docs/checkpoints/` record, which is
   already the event the DOCS GATE's staleness rule keys on.
2. **WHAT it can demand without lying.** The health bands exit 3 by
   design while four bands lack keepers, so a guard that required exit 0
   would refuse every checkpoint forever. It must demand THE READING —
   that the command RAN and its census line reached the record — not a
   verdict. Same for the boot gate: the demand is "ran, with its exit and
   both `[nputer]` lines recorded", not "passed".
3. **WHICH obligations are in scope.** Health readings and the boot gate
   are per-checkpoint. `cargo audit` is periodic rather than
   per-merge — it may belong on a different trigger or stay a written
   ritual, and saying so is part of the work.
4. **THE COST, measured.** `T-167-s8`'s criteria require the wall-clock
   cost stated and argued against the frequency of the event; the same
   discipline applies here, and the boot check is the expensive member
   (it builds and opens a window).

## Acceptance criteria

- WHEN a commit adds a record under `docs/checkpoints/`, THE guard SHALL
  refuse it unless that record carries a health-band CENSUS LINE and its
  EXIT, and — where the merge's diff meets BOOT GATE's own trigger — the
  boot check's exit and both `[nputer]` lines.
- THE guard SHALL demand that a gate RAN and was RECORDED, never that it
  PASSED: `npm run health` exits 3 by design today, and a guard that read
  3 as failure would be refusing the designed state.
- THE guard SHALL take BOOT GATE's trigger from the same place the
  written gate does rather than restating it, so the two cannot drift.
- THE lane SHALL state the guard's measured wall-clock cost on this card
  and argue it against how often a checkpoint happens.
- IF the guard cannot run THEN it SHALL say so and allow, never refuse
  silently — the lane-fence hook's own fail-open shape, and for the same
  reason.
- Verification: headless. The guard is exercised in both directions, and
  the positive control is a record deliberately missing its readings.

## Disposition hint

Small, `.claude` + `tools/e2e`, outside the graph walk. **It shares both
its fence and its whole argument with `T-167-s8`**, which is planned at
F-06 p2 and not yet dispatched — so the cheapest disposition is probably
to fold this into that card as its second criterion set and let one lane
build one guard with two triggers. The filer's own recommendation is to
FOLD, and the reason to file separately anyway is that the two
obligations fire on different events and a fold that lost this card's
measurement would lose the argument for the second trigger.
