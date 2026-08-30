---
id: T-164-s1
title: The launcher cannot tell whether the app is already running, because T-164's own criterion forbids it to look — and its second step is the one install channel that CORRUPTS rather than interrupts
feature: F-02
milestone: 4
priority: 20
size: S
status: planned
blocked_by: []
touches: [bin]
suggested_by: executor claude-opus-5@subagent @T-164
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-164, NOT DECIDED THERE — it is a question about
that card's own criteria, and an executor does not rule on its card.**
`bin/app-dev.mjs` runs `npm ci` in the target's `lib/parser` whenever its
derivation says an install is needed, and CONVENTIONS' own T-052 bullet
says `npm ci` is **the one channel that CORRUPTS rather than interrupts**
— it removes `node_modules` while a live vite serves out of it, and what
the NEXT read needs is destroyed. The launcher is normally run when no
app is up, which is why this is a suggestion and not a defect; but
nothing stops a human running it twice, and the second run would install
underneath the first run's app. **THE OBVIOUS GUARD IS THE ONE THING THE
CARD FORBIDS**: T-164's criteria say the script SHALL NOT touch port 1420
beyond what `tauri dev` does and SHALL NOT probe it, so the script reads
nothing about 1420 — deliberately, and it says so in its own header. The
open question is whether STATE's ONE PERMITTED READ,
`lsof -nP -iTCP:1420 -sTCP:LISTEN`, is a "probe" in that criterion's
sense: STATE draws the line at binding and connecting and calls the lsof
form the read that is allowed, so a REFUSAL built on it would take no
port, exchange no packet and reserve nothing — the T-046 detect-and-
refuse shape, applied to a human's launcher instead of to the pipeline.
**IT IS NOT A CORROBORATION OF T-052**, whose class is the PIPELINE
breaking the human's app; here the actor is the human's own launcher and
the remedy is a decision about this script's criteria, which only @human
or the orchestrator can take. If the answer is yes, the script gains one
precondition — refuse with the holder's pid and socket named, in the
refusal shape it already has, exit 3 — and if the answer is no, the
reason belongs on T-164 as a dated line so the next reader stops
re-asking.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-02 p20, WITH THE OPEN QUESTION RULED: THE ANSWER IS YES.**
Ruled at `@ 51fa31c0964c`, and the ruling is a READING of two rules this
repository already carries rather than a new policy, which is why the
seat may take it at all.

**THE RULING.** `lsof -nP -iTCP:1420 -sTCP:LISTEN` is **NOT a probe** in
T-164's fourth criterion's sense, and a refusal built on it does not
break that criterion. `docs/STATE.md` legislates the distinction in its
own words at the one place it governs this port: *"port 1420 is read
with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else — never
bind-probe, never connect"*. So the project's vocabulary already
partitions this space: **reading is what lsof does; probing is binding
or connecting.** T-164's criterion forbids what STATE forbids, and it
cannot sensibly forbid the ONE form STATE names as the permitted read —
a criterion is read against the standing rules its own project carries,
not in isolation. The refusal takes no port, exchanges no packet and
reserves nothing.

**AND THE CRITERION'S OTHER HALF SURVIVES THE RULING INTACT.** *"SHALL
NOT touch port 1420 beyond what `tauri dev` itself does"* is about
TAKING the port. An lsof read takes nothing; that is the whole reason
STATE permits it while forbidding the two forms that do.

**WHY IT IS WORTH A CARD AND NOT A ONE-LINE NOTE.** The hazard is not
cosmetic. `bin/app-dev.mjs` runs `npm ci` in the target's `lib/parser`
when its derivation says an install is needed, and CONVENTIONS' T-052
bullet names `npm ci` **the one channel that CORRUPTS rather than
interrupts**: it removes `node_modules` while a live vite serves out of
it. A human running the launcher twice destroys what the first run's app
is reading, and the failure surfaces as a module error pointing
somewhere else entirely. This is the T-046 detect-and-refuse shape
applied to a human's launcher.

**WHAT THE SEAT DOES NOT RULE.** Whether the refusal is unconditional.
A human who knows the app is up and wants to rebuild anyway is a real
case, and whether that gets a flag is the lane's design call, argued on
this card — with the standing warning that a hatch nobody needs is a
hatch that gets used.

## Acceptance criteria

- BEFORE the launcher performs any install step, IT SHALL read port
  1420 with `lsof -nP -iTCP:1420 -sTCP:LISTEN` — that exact form, the
  one STATE permits — and SHALL NOT bind and SHALL NOT connect.
- WHERE a listener is found, THE launcher SHALL refuse in the shape it
  already uses, naming the holding process and the socket, and SHALL
  exit 3. IT SHALL NOT proceed to any install step.
- WHERE no listener is found, THE launcher's behaviour SHALL be
  byte-identical to today — this card adds a precondition and changes
  nothing on the path that already works.
- THE read SHALL be honest about its own limits: `lsof` finding nothing
  proves the port was free at the moment of the read and reserves
  nothing, and the script SHALL NOT phrase its result as a guarantee.
- WHERE the lane provides an override at all, IT SHALL be explicit on
  the command line, SHALL print what it is overriding, and its reason
  SHALL be argued on this card.
- Verification: headless, through the existing dry-run surface — the
  derived plan shows the precondition and its verdict without launching
  anything. The one live launch remains @human's; the pipeline never
  drives the app.

**PREFLIGHT AT PROMOTION.** `node scripts/brief.mjs --task T-164-s1
--preflight`, run from the e2e package at `@ 51fa31c0964c`: **exit 0**,
the card ruled `startable` — `bin` is fenced by nothing else on the
board, as T-164's own fence note predicted.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
