# Checkpoint: T-171 lands — the interview concludes, "planner is thinking…" stops being a resting state, and the verifier caught THIS SEAT contaminating its own blind protocol

Date: 2026-08-31. Seat: architect/integrator. Scope: T-171 merge and
close; one assigned correction performed and drilled; a briefing failure
that is this seat's, disclosed by the verifier it damaged.

## What @human hit, and what it actually was

@human walked a genesis end to end and the screen ended on the footer
holding *"planner is thinking… · ⌘. to stop"* with a disabled button,
indefinitely: *"I don't know how to move forward from it."*

**The liveness was three flags and not one of them was a fact about a
turn.** At base the footer read `ui.busy || state.sending ||
state.phase === "running"`, and each term can outlive the turn it
describes — the phase returns to idle only on an event, two reducers
re-arm it with no sequence guard, and the UI latch survives a command
that never answers. There was no way to distinguish *a turn is running*
from *the last turn ended and nothing follows*.

**And that one boolean was also the only source for every `disabled` and
for `completionOf`'s `inFlight`** — which is why @human got a stuck
footer, a dead button and no ending from a single root cause.

**Both seats checked the walk's own files rather than reasoning.**
`first-walk/.nputer/sessions.json` reads `turns: 10, status: "idle"`;
`transcript.jsonl` carries both halves of every turn 1–10 and no
eleventh. **The last turn had landed while the screen claimed flight.**

## What landed

`flightOf` INVERTS the authority: the runner's per-turn `status` is read
first and the flags become claims a settled turn can refuse, with six
named readings — `stranded` is the one that used to render forever. The
real content is a SPLIT: `interviewBusy` is now the FACT (hint,
completion, ending) and `interviewLocked` is the MACHINERY (every
`disabled`), matching the guard that will actually answer a send.

The ending renders in the **chat column** — the half @human was reading
and the only half that survives below the lens breakpoint — names the
cold-start test as an OFFER, states that this conversation is
disqualified from being the cold session, and **offers no affordance at
all**, because spawning is `T-175`'s behind an `app-agent` fence.

Completion gained **no second source of truth**: `completionSafely` is
T-028's own `completionOf` in a `try`, because the chat renders outside
T-037's error boundary. `BANKING_MAP`, `method/`, `app/src-tauri/**` and
`BoardCrescendo.tsx` are all 0-byte diffs.

**The executor caught itself mid-build and said so**: it first enabled
the input on a stranded claim and reached for a notice whose sentence is
*"a turn is already running"* — this card's own lie in a smaller box.
Corrected and recorded rather than quietly dropped.

## THE VERDICT: APPROVED WITH ASSIGNED CORRECTIONS — 26 attacks, one survivor

**Correction performed.** The ending read *"The board BESIDE this is the
product of the walk"* — and below `lg` the board half is `hidden`, so the
sentence was false in exactly the window the chat column exists to
serve. **Shape SEVEN, measured: mutating that clause killed ZERO bodies
across the whole suite.** Reworded width-independently ("Your new board
is the product of the walk"), and pinned: the new assertion refuses
`beside` / `to the right` / `on the right` by name and requires the
clause still to name what was produced. **Drilled at the merge —
restoring the spatial claim now fails that body BY NAME, exit 1, and the
restoration is sha256-identical.**

## THE BRIEFING FAILURE IS THIS SEAT'S, AND THE VERIFIER DISCLOSED IT

`method/roles/verifier.md` makes phase 1 blind: the attack set is written
from the CONTRACT before any fact about what was built. **This seat's
brief named three executor-derived specifics above that line** — the
executor's boot port `14171`, that it had *"three commits"*, and that it
reported *"a large mutant count"*.

The verifier recorded it in its verdict rather than proceeding quietly,
and confirmed none of the three seeded an attack: it derived its own port
(`15171`), cut its own bench, and re-derived the diagnosis from
first-walk's files. **So the damage was nil and the protocol still
worked — because the verifier disclosed rather than because the brief was
clean.**

**THE CLASS, AND IT IS THE SEAT'S TO FIX:** a dispatcher writing a blind
brief is holding the executor's report in context, and the natural way to
warn a verifier about a hazard is to quote the report. Three of the six
verifier briefs written tonight carry that shape. The remedy is a rule
this seat now owes itself: **a blind brief names the CONTRACT and the
HAZARDS, and quotes the executor's REPORT for nothing.** Where a warning
genuinely needs a fact from the lane, it belongs BELOW the phase-1 line,
labelled as such.

## Routed, and verified as genuinely out of fence

Three findings in `agent-store.ts` and the Rust runner, which
`.nputer/lane-fence.json` does not carry:

1. **⌘. cannot clear the state its own label advertises** — `cancelGenesis`
   resets nothing when Rust answers `{kind:"idle"}`, so the escape the
   footer offered @human did nothing on the walk.
2. **`reduceGenesisOutcome` and `applyGenesisStatus` arm flight with no
   seq guard** — measured, not theorised: it stranded this card's own
   first DOM fixture, which is how it was found. **The verifier judged
   this load-bearing and says it should be carded**: this card makes the
   screen honest while leaving the store permanently able to strand it.
3. A command that never answers leaves the UI latch true forever.

## Gates

- `index --check` — **CURRENT**, regenerated: **1,141,994 of 2,145,959
  (53.2%), 1,003,965 left**, 199 files, 2,432 symbols, 2,351 edges
- `cargo test` — **256 passed, exit 0**, lib suite 9.24s (inside the
  green line)
- `npx vitest run` from lib/parser — **344 passed, exit 0**
- `npm run build` / `npm test` from app/ — **0** / **1077 passed, exit
  0** (1,059 at base; the lane added 15 and the correction one more)
- `npm test` from tools/e2e — **335 passed, exit 0**
- `lint:tokens` / `lint:docs` / `capabilities:check` — **0 / 0 / 0**
- **BOOT GATE — OWED AND RUN, exit 0**, port 17401 derived, lsof zero
  rows before binding, both `[nputer]` lines. 1420 read with `lsof`
  only: zero rows.
- **HEALTH — 9 inside, 1 drifting, 0 BREACHED, 0 unread, 4 UNKEPT.** The
  drift is `docs-headroom/docs/STATE.md` at 8.06% against a 10% line —
  **this file again, and it is trimmed in this same commit** by moving
  the accumulated queue detail into this record, which is the contract's
  own remedy rather than deleting a hazard to fit.

## WHAT A HUMAN STILL OWES THIS SCREEN

The verifier was explicit and this seat agrees: **verification here is
headless, jsdom applies no breakpoints**, so the below-`lg` claim rests
on class lists plus the e2e spec's own 1023/800 assertions and not on
anyone having seen it. @human's eye is owed thirty seconds on the ending
at a narrow width. That is not a defect and it is not a gate — it is the
honest edge of what this pipeline can prove, and `T-049-s1` already
names the class.

## Board and the queue, moved here out of STATE

`T-171` done, `review: same-model`. **Seven lanes landed tonight**:
`T-140-s4`, `T-112-s3`, `T-177`, `T-172`, `T-153-s8`, `T-112-s1`,
`T-171`. One in flight: `T-178` (fixture teardown).

**The queue after this record**, so STATE can carry a pointer instead of
a list: `T-126-s2` (un-park condition FIRED, wants a ruling — it stands
between the registered command and a rendered brief), the `agent-store`
findings above, `T-112-s5`, `T-179`, `T-172-s1`, `T-140-s8`, `T-140-s9`,
`T-182`, `T-162-s1`, `T-174`, `T-112-s4`, `T-167-s9`, `T-143-s6`,
`T-163-s5`, `T-167-s8` (now carrying `T-181`'s second trigger), `T-161`.

## Owed after this record

- **@human, untouched overnight as asked**: the FORM question (reopened),
  the steering split, the three permission questions — plus the
  thirty-second look at the ending above.
- The `agent-store` findings want cards at the next sitting; the
  verifier's judgement that finding 2 is load-bearing should carry.
