---
id: T-216-s5
title: The shared scratchpad has no per-lane naming, so one seat's script silently drove another seat's bench — a MACHINE-scoped surface with a defaulted name, which lane-protocol rule 4 already names as a class
feature: F-06
milestone: 4
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-216-s1
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY COMMITTING IT.** This is the executor's own violation, filed
with attribution because an unattributed rule reads as advice.

**Class parent: none.** `method/lane-protocol.md` rule 4 already states
the CLASS — *"some surfaces are scoped by the MACHINE instead: a port
number, the host's list of worktrees, anything keyed on a name that is
global to the machine… NAME THE SCOPE OF EVERY SURFACE YOU DEPEND ON, and
where the answer is machine, DERIVE the value from the lane rather than
defaulting it."* `docs/STATE.md` already observes that the scratch
directory is shared. **What is missing is the spelling**, the way the E2E
PORT bullet spells `15000+<card number>`. Disposition hint: promote, and
ride it on the next card that opens `docs/CONVENTIONS.md` — it is one
bullet beside the port rule.

## The instance, 2026-09-01

Two seats — this lane and its verifier's bench — were writing to the same
scratchpad directory. Both independently wrote a four-suite battery
runner and both called it `battery.sh`. The verifier's copy landed
second, pointed at **its** bench (`/Users/ujju/Projects/V-216-s1`), its
port (`25216`) and its own output directory.

This lane then ran `battery.sh` expecting its own script, and instead ran
the verifier's — against the verifier's checkout, at a ref that was not
this lane's tip. Measured afterwards from the artifacts:

    exits.txt   8 lines where a run writes 4 — the file is APPENDED,
                so one seat's results sit under another's with nothing
                distinguishing them
    ref.txt     395c867  — the other bench's ref, not this lane's tip
    *.log       overwritten; the verifier's own suite logs are gone

**Nothing warned.** No error, no permission refusal, no diff — the script
was executable, the paths resolved, and the run reported exit 0. This is
rule 4's own sentence about machine-scoped surfaces: *every written rule
stays satisfied while they collide.*

## What the damage was, and what stopped it

Two of the four legs (parser, app) RAN in the other seat's checkout. They
are reads and both returned GREEN, but a second runner in a checkout
somebody else is certifying from is exactly the corruption rule 4 names.

**The other two legs were REFUSED by `gate-run`'s own solo lock**, which
is the machinery working as designed (T-088-s4):

    verdict=REFUSED reason=solo-lock: the solo lock is held by pid 14689
    running suite e2e … — REFUSING rather than waiting, because a reading
    taken after a wait is a reading of the wait

**So the guard that exists caught the half it was built for, and the half
it does not cover is the NAME.** The lock serialises runners; it cannot
know that the script a seat launched belongs to a different seat.

## The remedy, and why it is a spelling rather than a mechanism

Derive the scratch filename from the lane, exactly as the port rule
derives the port: `battery-T-NNN-sM.sh`, `battery-T-NNN-sM/`. A
construction beats a check — two lanes cannot pick the same name when the
name comes from the lane. This lane re-ran under
`battery-T-216-s1.sh` and the collision cannot recur for it.

**A mechanism is the expensive answer to a problem the cheap one has not
yet failed at** (rule 4's own words about the live-integrator probe). One
bullet beside the PORT RULE is the cheap one.

## Acceptance criteria

- `docs/CONVENTIONS.md` SHALL spell a per-lane naming rule for the shared
  scratch directory, in the same form as the E2E PORT bullet, and SHALL
  say that the directory is shared with every other live seat.
- The bullet SHALL name this instance, because a rule with no incident
  attached is one the next seat reads as advice.
- Verification: headless — this is a documentation fix and no code change
  should be invented for it.
