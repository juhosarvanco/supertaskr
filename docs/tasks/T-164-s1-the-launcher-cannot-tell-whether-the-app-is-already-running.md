---
id: T-164-s1
title: The launcher cannot tell whether the app is already running, because T-164's own criterion forbids it to look — and its second step is the one install channel that CORRUPTS rather than interrupts
feature: F-02
milestone: 4
priority: 8
size: S
status: planned
blocked_by: []
touches: [bin, tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts, tools/e2e/tests/app-dev.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-164
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-264-s10 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review). The launcher half of the child is inside this card's `bin` token; its rename-keeper class puts the keeper and its spec in this fence, and a headless launcher spec, tools/e2e/tests/app-dev.spec.ts, is reserved as a new file under the tracked tests directory (the lane-lock spec does not drive the launcher; the dry-run boundary stands: no live app launch). The parent takes the child's priority (8). Ordering: T-264-s9 (planned, not live) holds the same keeper files in the delegated list ahead of this card; the two are not dispatched while the other is live.

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
- WHEN a variable carrying the pre-rename environment prefix is set and
  `SUPERTASKR_APP_WORKTREE` is not THE launcher SHALL refuse, naming both
  spellings, rather than falling back to its default.
- WHEN both are set THE launcher SHALL read `SUPERTASKR_APP_WORKTREE` and
  say in as many words which one it used.
- IF the guard spells the pre-rename prefix THEN
  `tools/e2e/scripts/rename-scan.mjs` SHALL carry an enumerated class for
  it naming the ruling that holds it, and
  `only the enumerated classes of the pre-rename identifier survive in the
  corpus` SHALL stay green.
  (the bullets above are absorbed whole from T-264-s10, pile 2 batch 3a, 2026-09-14; its retirement condition kept with it)
- WHEN the compatibility guard for the pre-rename prefix is kept THE card SHALL state the observation under which that guard retires — the guard is removed only when a measured survey of the project's own shells and configuration finds no exporter of the old prefix — as the absorbed child asks; no expiry date is set here and no retirement condition is claimed to exist already.
- Amendment of 2026-09-14 to the third criterion above: WHERE no listener is found THE launcher's behaviour SHALL be byte-identical to today for every input OUTSIDE the environment guards the absorbed criteria add (a variable carrying the pre-rename prefix set without the new spelling; both set) — those inputs now refuse or announce as the absorbed criteria say, and the unchanged-behaviour promise is narrowed to that extent and no further.

## Absorbed from T-264-s10 — The launcher renamed its environment variable and a shell still exporting the pre-rename one is answered by the default, in silence — the one variable a human sets by hand is the one whose rename cannot be seen (kept whole)

Title as filed: "The launcher renamed its environment variable and a shell still exporting the pre-rename one is answered by the default, in silence — the one variable a human sets by hand is the one whose rename cannot be seen"

Filed as: status suggested, priority 8, size S, touches [bin/app-dev.mjs, tools/e2e/tests/], wake None, suggested_by verifier claude-opus-5@subagent, at T-264-s3's bench, 2026-09-10 — measured while checking that no pre-rename environment prefix survives outside docs/.

### The finding (T-264-s10)

`bin/app-dev.mjs` reads exactly one environment variable and it moved to
`SUPERTASKR_APP_WORKTREE` in T-264-s3. Measured at that lane's tip: the
file reads `process.env[ENV_VAR]` once and nowhere else, so there is one
name and no compatibility read — which is what the criterion asked for.

**The cost lands on the one caller the variable exists for.** Every other
variable in this repository is set by a script or a suite, which moved in
the same commit. This one is set by a human, by hand, in a shell that
outlives the rename: an exported pre-rename name is now simply not read,
the launcher falls back to its stated default, and the run succeeds
against a directory the human did not choose. There is no error, because
from the launcher's side nothing is wrong.

The remedy is one guard and one message: if a variable spelled with the
pre-rename prefix is set and `SUPERTASKR_APP_WORKTREE` is not, refuse
loudly and name both spellings. A REFUSAL rather than a fallback, because
the file's own header says one variable and one stated default with no
second source — and a silent fallback IS a second source wearing the
default's clothes.

Two things the card owes whoever takes it. First, a guard that spells the
pre-rename prefix puts an occurrence back in `bin/`, which the rename
scan now walks — so the guard needs an enumerated class in
`tools/e2e/scripts/rename-scan.mjs`'s table naming the ruling that holds
it, exactly as the migration refusal in the fence hook is held today.
Second, the guard is dead code the day the last such shell is gone, so it
wants a stated expiry rather than a permanent seat.

### T-264-s10's acceptance criteria as filed (absorbed into the criteria above)

- WHEN a variable carrying the pre-rename environment prefix is set and
  `SUPERTASKR_APP_WORKTREE` is not THE launcher SHALL refuse, naming both
  spellings, rather than falling back to its default.
- WHEN both are set THE launcher SHALL read `SUPERTASKR_APP_WORKTREE` and
  say in as many words which one it used.
- IF the guard spells the pre-rename prefix THEN
  `tools/e2e/scripts/rename-scan.mjs` SHALL carry an enumerated class for
  it naming the ruling that holds it, and
  `only the enumerated classes of the pre-rename identifier survive in the
  corpus` SHALL stay green.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
