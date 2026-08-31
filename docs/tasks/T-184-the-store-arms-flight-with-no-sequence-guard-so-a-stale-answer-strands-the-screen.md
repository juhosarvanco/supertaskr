---
id: T-184
title: The store arms flight with no sequence guard and a command that never answers leaves the latch true for ever — T-171 made the screen honest and left the store permanently able to strand it
feature: F-03
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
suggested_by: "executor claude-opus-5@subagent @T-171, routed from inside the lane; its blind verifier judged this one LOAD-BEARING and said it should be carded"
touches: [app-agent]
absorbs: [T-183]
builder:
review:
---

**ROUTED OUT OF `T-171`, AND ITS VERIFIER SINGLED THIS ONE OUT.** Of the
three findings that lane routed, the verdict named this the load-bearing
one, in as many words: *"this card makes the screen honest while leaving
the store permanently stranded."*

## The mechanism, measured rather than theorised

`reduceGenesisOutcome` and `applyGenesisStatus` in
`app/src/lib/agent-store.ts` both ARM the interview's flight state **with
no sequence guard** — nothing checks that the answer arriving belongs to
the turn currently in play. A stale or out-of-order answer therefore
re-arms flight for a turn that has already settled.

**It was not found by reading. It stranded `T-171`'s own first DOM
fixture**, which is how the executor met it: the fixture went into a
state the screen could not leave, from a store re-arming behind it.

**And a third face of the same surface**: a command that never answers
at all leaves the UI latch true for ever, because nothing else ever
clears it. `flightOf` names that case rather than guessing at it — it is
a runner LIVENESS question, and this card is where it belongs.

## Why T-171 did not close it, and why that was right

`T-171`'s fence is `app-interview`; this is `app-agent`. The lane routed
rather than widened, and the verifier re-derived the boundary from
`.nputer/lane-fence.json` rather than accepting the claim.

**What `T-171` DID buy is the reason this card is now cheap**: the
screen no longer believes a claim a settled turn contradicts, so a
stranded store produces a *recoverable* screen instead of a permanent
one. This card removes the strand at its source; that one stopped it
from being fatal.

## What a fix decides

1. **What the sequence token IS.** The runner already carries a per-turn
   `status` that `flightOf` reads — whether the guard keys on that, on a
   turn number, or on a session-scoped id is the design question, and it
   should be the SAME token the screen already trusts rather than a
   second one invented here (T-057's two-implementations rule).
2. **What an out-of-sequence answer DOES.** Dropping it silently is one
   option and is probably wrong — this project's own doctrine is that a
   silent drop is worse than a named one. A recorded, non-fatal
   observation is the shape to consider.
3. **The liveness half.** A command that never answers is not the same
   as one that answers late, and the fix for the first is a bound rather
   than a guard. Say whether both are in scope; if only one is, say
   which and route the other.

## Acceptance criteria

- WHEN an answer arrives for a turn that is not the one in play THE
  store SHALL NOT arm flight, and a body SHALL prove it with the
  out-of-order answer constructed rather than described.
- THE guard SHALL key on a token the screen already trusts rather than
  introducing a second source of truth.
- WHERE a command can never answer, the store SHALL NOT be left claiming
  flight for ever; if the answer is a bound, the bound SHALL carry its
  reason at its site.
- A body SHALL prove the pair END TO END: a stale answer, and a screen
  that does not enter the state `T-171` had to teach it to leave.
- Verification: headless, the app suite. **`T-183` is this card's other
  half** — the store refusing to disarm, where this is the store arming
  without evidence — and whichever is dispatched first should read the
  other; triage may well fold them.

## ABSORBED AT STANDING TRIAGE SITTING #6 (2026-08-31): T-183 — the same surface, faced the other way

**Both cards asked for this in their own text**, and the filer's
recommendation was explicit on each: *"they are the same surface from two
directions and should probably be one lane."* This sitting agrees, and
the reason is mechanical rather than editorial — **they name the same
file, the same fence, and the same two functions.** `T-183`'s
`cancelGenesis` and this card's `reduceGenesisOutcome` /
`applyGenesisStatus` all live in `app/src/lib/agent-store.ts` under
`[app-agent]`. Two lanes could not run concurrently, and whichever ran
second would open a file the first had just rewritten.

**T-183's half, carried here intact**: `cancelGenesis` resets nothing
when the runner answers `{kind:"idle"}`, so the escape the footer
advertises — *"⌘. to stop"* — did nothing on @human's walk. That is the
store refusing to DISARM; this card carries the store ARMING without
evidence. **A guard that fixes only the arming leaves the user with no
working control, and a cancel that fixes only the disarming leaves the
next stale answer free to re-arm it.** Either alone is a half-fix that
looks whole.

**The folded card therefore owes four criteria, not three** — T-183's
two are added verbatim below and neither is softened by the merge:

- WHEN the runner answers `{kind:"idle"}` to a cancel THE store SHALL
  clear its own flight claim rather than leaving it set, and a body SHALL
  pin that with a positive control proving the claim was set first.
- THE cancel path SHALL be safe to invoke twice in succession.

**And the design questions compose rather than conflict.** T-183's first
question — what `cancel` MEANS when the runner says there is nothing to
cancel — has the same answer as this card's first: the token the SCREEN
already trusts. `flightOf` makes exactly that inference on the render
side already, so **making the store agree with the screen settles both
halves with one decision**, which is the strongest argument for the fold
and the one that would have been missed by running them apart.

`T-183`'s file is removed; this card is the survivor and its id is the
one to cite. **The executor SHALL read `T-171`'s DOM bodies first** —
they are what met this defect live.

## Implementation notes

### The lane read a STALE COPY OF ITS OWN CARD, which is T-187's class met live

This lane was cut before the triage sitting that absorbed `T-183`
landed. Its brief, its dispatch summary and the card in its worktree all
described the card as it stood at the base: `status: suggested`, no board
fields, no `absorbs:`, four criteria and a note that triage *might* fold
`T-183`. **The absorption was already intended and was reported to this
lane in its dispatch summary; the tree did not carry it yet, and the
lane's own contract makes the tree the authority.** So the arming and
liveness halves were built first, the disagreement was named rather than
guessed at, and the absorbed half was built after the lane took main in.

Recorded because `T-187` is exactly this card and nothing compared the
two automatically — the collision surfaced only when the merge forecast
conflicted.

**AND THE SAME CLASS BIT THIS LANE A SECOND TIME, ON IDS.** Its two
routed cards were filed as `T-185`/`T-186`, collided with a triage
sitting's own `T-185`–`T-188`, were renumbered to `T-189`/`T-190`, and
collided AGAIN — `T-189` taken on main while this lane built, `T-190`
reserved for another lane. They are `T-191` and `T-192`. Nothing derives
the next free id, so two seats filing concurrently both pick
maximum-plus-one and neither can see the other. Evidence is recorded on
`T-187`, which owns the class.

### What was decided, at the three decision points the card set

**1. What the sequence token IS.** `GenesisTurn.status` — the runner's
own per-turn measurement, which is the field `flightOf` already puts in
front of the flags on the render side. The guard is that same inference
moved to the ARMING side. No seq counter was added and no turn-number
bookkeeping was invented: a turn number alone says WHICH turn and not
whether it is still live.

**2. What an out-of-sequence answer DOES.** It is refused and RECORDED,
never silently dropped. The record names the turn, that turn's status at
the moment of refusal, and which arming site refused it. Non-fatal by
construction: nothing renders it and nothing branches on it.

**3. The liveness half — BOTH are in scope, with different shapes,
because they are different defects.** A late answer is stale EVIDENCE
and can be weighed against the turn it names, so it takes a GUARD. A
command that never answers is an ABSENCE — nothing to weigh, the `await`
never returns, the caller's latch is never released — so it takes a
BOUND. The bound is derived from the one Rust-side wait a command body
can contain, and the derivation is CHECKED by a body against the runner
rather than left in a comment.

### And the absorbed half settled on the same decision, which is the fold's own argument

`cancel` answering `{kind:"idle"}` now disarms. The reason is the one
the absorption section predicted: `idle` is the runner's measurement,
the store's flag is a claim, and the measurement wins — the same rule
as the arming guard, pointing the other way.

**It settles the TURNS and not only the flags, and that is the half a
plausible fix would have missed.** `flightOf` reads `turn.status ===
"running"` BEFORE any flag, so a cancel that cleared `sending`/`phase`
and left a turn stuck at `running` would still leave the footer claiming
a turn nobody is running. It would have looked like a fix and changed
nothing on screen.

**The idle disarm is itself guarded by the seq watermark**, because an
`idle` is a fact about the moment it was ASKED and can resolve after a
new turn has started. Obeying a stale one would cancel a live turn —
this card's own defect with the sign reversed.

### The asymmetries a verifier should attack

- **The DISARMING direction of the status pull is deliberately
  unguarded**, while the disarming direction of `cancel` IS guarded. The
  distinction: a status pull carries the turn it is about and cannot
  contradict a running turn's own events, whereas `idle` carries no turn
  at all and therefore reaches every turn in the list. If that
  distinction is wrong, this is where it is wrong.
- **An UNKNOWN turn still arms, and so does a RUNNING one.** No evidence
  is not contrary evidence. A guard refusing unknown turns would break
  every first turn, whose answer routinely beats its own `started`
  event. There is a body for that arm specifically.
- **The guard is scoped to the flight claim** and to nothing else in the
  status fold; session id, versions and project dir still land from a
  stale pull. A choice, not an oversight.
- **`lastOutcome` is left alone on a refused answer**, because a refused
  `accepted` in the notice slot reads as a failure report for a turn
  that succeeded.
- **`cancelGenesis` is NOT bounded** while the three flight-arming
  commands are. Nothing latches behind cancel, and `CancelOutcome` has
  no error arm for a bound to answer with.
- **A cancelled turn is settled to `cancelled` and the phase to `idle`
  even when the phase was `failed`.** That is the pre-existing branch's
  behaviour, kept rather than quietly widened; `lastError` survives.

### The known RED this lane hands off, and why it is not a regression

`T-171`'s DOM body *"A STRANDED CLAIM IS REFUSED"* now fails — on its
own POSITIVE CONTROL, the line asserting that the fixture really
reproduces the stranded claim. It cannot any more: that fixture strands
the store by pulling a `running` status over a turn that has already
completed, which is precisely the route this card closes. The body's
SUBJECT is untouched and still worth having; only its way of
manufacturing the precondition is gone.

**Measured, not inferred**: the same body passes at this lane's base with
only the store file reverted, and fails with it restored, the store file
byte-identical before and after.

That body is `app-interview`, not this card's `app-agent`. Routed rather
than taken. **A one-line change makes it green and keeps its meaning** —
`stranded` is still reachable by a status pull naming a turn this webview
holds no events for, so the fixture needs a different turn number rather
than a different idea.

### Where the acceptance criteria stopped at the fence

The END-TO-END criterion's screen half is a DOM assertion in
`app-interview`. Its STORE half is built here and driven through the real
module singleton, the real event channel, the real status pull and the
real cancel command, with only the IPC boundary mocked — the same walk
that stranded `T-171`'s fixture, asserted against the store. The DOM half
is routed with the fixture repair, as one card, because they are one edit
in one file.

### Routed, not taken

- **`T-191` (`app-interview`)** — re-express `T-171`'s strand fixture so
  it manufactures the claim by a route this card leaves open, and add the
  screen half of the end-to-end criterion in the same body.
- **`T-192` (`app-shell`)** — the liveness defect has a SIBLING outside
  this fence. `runIndexRepo` and `runPicker` in the shell store take a
  latch synchronously, `await` an unbounded command, and release in a
  `finally`; a command that never answers leaves the button dead for the
  session. Found by this card's own class sweep.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

**2026-08-31 · claude-opus-5@subagent · blind verifier seat (guard-class,
`review: independent`) · APPROVED WITH ASSIGNED CORRECTIONS.**

Measured at lane tip **`8e3460d`** (`task/T-184-the-store-arms-flight-with-no-sequence-guard`),
base **`f510e30`**. Every figure below carries that pair; the lane
committed `8e3460d` while this seat was reading, so the ref is named
rather than left implied.

### The blindness, stated so it is auditable — and two disclosures

Phase 1 read ONLY: this card **at its base ref** `f510e30` (byte-identical
to `main`'s copy, sha256 `fc4e205e…`, so the absorbed `T-183` half was
already in the base card), `docs/STATE.md`, `docs/ARCHITECTURE.md`,
`docs/CONVENTIONS.md`, `docs/CAPABILITIES.md`, `method/roles/verifier.md`,
`.nputer/lane-fence.json`, and the BASE code — `agent-store.ts`,
`agent-store.test.ts`, `crescendo.ts` (`flightOf`), `crescendo.test.ts`,
`interview-source.ts` — all at `f510e30`. The attack set was written to
disk and hashed BEFORE the first `git diff`: **20 attacks (A1–A20) plus
fence, security and gate sweeps, naming 17 intended mutants**, sha256
`2e4a6e80495b65b45f5d2da514e7955d9f00080ca4e03658e5eb1a8de0a9ba03`,
mtime 2026-08-31 04:39:38 local. The diff, the Implementation notes and
the routed cards were opened only after that.

**DISCLOSURE 1 — the brief could not structurally separate the two
phases, and this seat says so rather than resting on a guarantee**
(roles/verifier.md). The paragraph the brief placed "below the blind
line" arrived in the SAME message as the duties and was therefore in
context before phase 1 could begin. It leaked two lane facts: that the
lane reports a failing body outside its own fence, measured at both refs
and routed; and that the lane found one of its own bodies un-poisonable
and repaired it. It named no figure. Both were re-derived here from
scratch rather than accepted — the red was measured at both refs by this
seat, and the repair was reproduced by an independent mutant.

**DISCLOSURE 2 — this seat's own leak, and it is the worse of the two.**
Before writing the attack set I ran `git log --oneline main..HEAD` to
size the lane, which `roles/verifier.md` forbids ("you do NOT read the
executor's notes, reasoning, or commit messages"). Six subjects were
visible; one of them — *"the store checks an arming answer against its
own turn, and bounds a command that never answers"* — leaks the fix's
SHAPE. The attack set was written after that and is contaminated to that
extent. Mitigation, such as it is: every mutant below was defined against
the BASE file's own text, and the attack set was recorded as properties
of the card rather than of the fix. The honest reading is that A1–A3 and
A8–A10 would have been written anyway from the card's three decision
points, and that I cannot prove it.

**DISCLOSURE 3 — a conflict between the brief and the role contract.**
The brief told me to read `docs/ROADMAP.md`; `roles/verifier.md` says a
verifier does NOT read it ("you judge whether this card is right, not
whether it was the right card to pick"). I followed the role contract and
did not read ROADMAP. Flagged, not silently resolved.

### The contract has SIX criteria, and the card's own arithmetic is wrong

Counted off the card itself (not from any summary): four original SHALL
bullets plus the two absorbed from `T-183` verbatim, **six**, plus the
verification line. The card's sentence *"The folded card therefore owes
four criteria, not three"* does not match its own bullet list. That
sentence is present at `f510e30` and on `main`, so it is the CARD's
defect and not this lane's — recorded so the next reader counts bullets
rather than trusting the prose.

### Gates, run by this seat, exits captured UNPIPED from guarded scripts

| where | command | exit | result |
|---|---|---|---|
| `app/` @ `f510e30` | `npm run build` | **0** | the typecheck gate (the two `tsc` calls; there is no `npm run typecheck` here — T-073) |
| `app/` @ `f510e30` | `npm test` | **0** | **49 files, 1077/1077** — the clean baseline |
| `app/` @ `8e3460d` | `npm run build` | **0** | typecheck clean at the tip |
| `app/` @ `8e3460d` | `npm test` | **1** | **49 files, 1092 passed / 1 FAILED (1093)** |

The lane adds 16 bodies and takes exactly one away. Nothing was
misattributed to STATE's named intermittents: the failure is
deterministic, it is not `T-161`, `T-178` or `T-086-s1`, and no cargo
suite was involved, so `T-088-s4`'s cache cliff is not in play.

### FINDING 1 (merge-blocking, and NOT a defect in this diff)

**The app suite — this card's own named verification — is RED at the
lane tip.** `app/test/interview-chat-dom.test.tsx > the ending, and the
footer that used to lie about it (T-171) > A STRANDED CLAIM IS REFUSED`
fails at its own POSITIVE CONTROL, `interview-chat-dom.test.tsx:1596`:
`the fixture must actually reproduce the stranded claim: expected false
to be true`.

**Measured at both refs by this seat, independently of the lane's
claim:** that spec is **51/51 green at `f510e30`** and fails at
`8e3460d`. It is diff-caused, not pre-existing and not intermittent.

**Routing was correct and widening was not available.** The fence
manifest gives this lane `app/src/lib/agent-store.ts`,
`app/test/agent-store.test.ts`, the three `app-agent` Rust paths and
`docs/tasks`. `app/test/interview-chat-dom.test.tsx` is `app-interview`,
and `.claude/hooks/lane-fence.mjs` REFUSES the write mechanically — "a
fence cannot be widened from inside the lane it fences"
(CONVENTIONS). CONVENTIONS blesses exactly this shape: *"a red the
executor's own fence forbids fixing is still news… file it as a
suggestion and say so in the notes."* The lane filed `T-191` and devoted
a headed section to it. **This is why the finding is not a rejection: a
fresh executor would inherit the same fence and the same inability.**

**The lane's repair claim is TRUE, and this seat reproduced it.**
Changing `strandTheClaim`'s pull from `turn: 1` to `turn: 2` in the
scratch worktree returns that spec to **51/51, exit 0** — one character,
with the body's meaning intact, because `stranded` is still reachable
from a pull naming a turn the webview holds no settled events for.
Mutation read back with `git -C <dir> diff`; restored
`--source --staged --worktree`; sha256 `9406294a…` before and after.

**ASSIGNED TO THE INTEGRATOR:** `T-191` lands with this merge or
immediately before it, and no checkpoint closes with `npm test` from
`app/` at exit 1. CI has been enforcing since 2026-08-29; merging this
lane alone reds `main` for whoever picks it up next.

### FINDING 2 (assigned correction, in-fence)

**`withAnswerBound`'s `finally { clearTimeout(timer) }` is unpinned — no
body kills its removal.** Mutant `M11-cleartimeout-removed` (`0+/1-`,
diff read back, restore sha256-proven) leaves the spec at **33/33, exit
0**. The site makes a claim the suite cannot red: *"The timer is cleared
on every exit — answered, unanswered or thrown — because a dangling
thirty-second timer per command would hold a process open and make the
bound observable in a way it should not be."* CONVENTIONS rules the
case — a claim no body can red is the finding.

**ASSIGNED** (to this card's own follow-up, or to `T-192` which already
owns the class): add one body in `app/test/agent-store.test.ts` — both
paths are inside this lane's fence — asserting the timer count returns to
its pre-call value after a healthy answer and after a rejection
(`vi.getTimerCount()` under fake timers is sufficient and needs no new
export). Behavioural risk today is low — `Promise.race` has already
settled, so a surviving timer changes no outcome — which is precisely
why only a body can hold the claim.

### FINDING 3 (notes-only correction)

The Implementation notes say: *"A cancelled turn is settled to
`cancelled` and the phase to `idle` even when the phase was `failed`.
That is the pre-existing branch's behaviour, kept rather than quietly
widened."* **True of the `cancelled` branch; not true of `idle`.** At
`f510e30` an `{kind:"idle"}` answer did nothing at all, so clearing
`phase: "failed"` → `"idle"` on `idle` IS new behaviour, not kept
behaviour. It is defensible (`lastError` survives, nothing in `app/src`
branches on `phase === "failed"`, and `data-phase` is the only consumer),
but the sentence as written would tell the next reader not to look.
**ASSIGNED: correct that sentence.**

### The attack set, executed — including everything that FAILED to break it

**Mutants: 19 constructed, all one-sided against the code under test, all
read back with `git -C <dir> diff` before the suite ran, all restored
`--source=<ref> --staged --worktree` and PROVEN by sha256 against `git
show <ref>:<path>` (`9dec7c5a10f406b5f10467bb13d83f3d9409894e42d6850ced
530e4bfadaea6f`, identical on all 19). 18 killed, 1 survived.** Drilled in
a DETACHED scratch worktree cut by this seat at a named commit, stem
DERIVED from the card id (`T-184-vfy`), at a short root; no cargo was
involved so no `CARGO_TARGET_DIR` arm was needed, and no `cargo clean`
was run.

| mutant | one-sided change | killed by |
|---|---|---|
| M1 | `applyGenesisStatus` guard → `null` | the stale-pull body **+** the end-to-end body |
| M2 | `reduceGenesisOutcome` guard → `null` | late-answer **+** token bodies |
| M4 | `settledTurn`: `!== "running"` → `=== "running"` | four bodies |
| M5 | settled set narrowed to `"completed"` only | **token body alone** |
| M6 | the refusal stops RECORDING | late-answer + token |
| M7 | refusal leaves `phase: "running"` | late-answer + token |
| M8 | refusal leaves `sending: true` | late-answer + token |
| M10 | `COMMAND_ANSWER_BOUND_MS` × 1000 | **the constant-pinning body alone** |
| M14 | the `idle` branch removed | four cancel bodies |
| M15 | `"idle"` → `"cancelled"` | four cancel bodies |
| M16 | cancel keeps `prev.phase` | four cancel bodies |
| M17 | cancel identity return removed | three cancel bodies |
| MU | `cancelled` widened to EVERY running turn | **the settles-only-its-own-turn body alone** |
| MW | cancel seq watermark → `true` | **the stale-idle body alone** |
| MX | `refreshGenesisStatus` stops calling `setState` | **the two end-to-end bodies alone** |
| MY | `cancelGenesis` stops calling `setState` | **the through-the-real-store body alone** |
| MB1 | `sendGenesisTurn` unbounded | **the never-answers send body alone** |
| MB2 | `startGenesis` unbounded | **the never-answers start body alone** |
| MB3 | the real answer discarded for the bound's | **the healthy-command body alone** |
| MB4 | a rejection swallowed into the bound's answer | **the rejection body alone** |
| MD | the DISARMING direction guarded too | **the disarming body alone** |
| ME | the guard widened onto the rest of the fold | **the stale-pull body alone** |
| MF | the refusal writes `lastOutcome` | **the late-answer body alone** |
| **M11** | **`clearTimeout` removed from the `finally`** | **NOTHING — 33/33 green. FINDING 2.** |

**POISON SHAPE SIX, asked of every one of the 16 new bodies rather than
assumed: each kills at least one mutant no sibling body kills.** The two
that most invited the charge both answer it — the end-to-end pair is the
only thing that sees `MX`, and the `cancelled`-settles-only-its-own-turn
body is the only thing that sees `MU`. **No shape SIX in this diff.**

**The lane's own un-poisonable-body repair is INDEPENDENTLY VERIFIED.**
`MU` is the mutant that body's comment says its first draft (a one-turn
fixture) could not see. Constructed here from the base text without
reading the lane's drill: killed, by that body and by nothing else. The
fixture now carries two `running` turns, which is the smallest fixture
that can see a widening — the "too small to see the mutant it is named
for" question, asked and answered.

### The attacks that FAILED to break it — a verdict listing only hits is not a measurement

- **A18, my headline prediction, MISSED.** `fresh_genesis` really does
  restart turn numbering (`agent/mod.rs`: `guard.turn = 1`) and the store
  never clears `turns`, so a turn-number-keyed guard should refuse to arm
  a fresh session's turn 1 over a completed one. It does refuse. But
  probed through `flightOf`, the SCREEN reads `{inFlight:false}` under
  BOTH the lane (`because:"idle"`) and the base (`because:"stranded"`) —
  because T-171 already treats a settled `landed` turn as non-evidence.
  **No user-visible regression.** Single-flight in that window is the
  Rust latch's (`begin_turn` → `Busy`), not this store's.
- **A19 (the guard eats the DISARM) — defended by construction.** The
  guard is computed only when `status.phase === "running"`; `idle` and
  `failed` disarm unconditionally, and `MD` proves a body holds it.
- **A3 (existence vs settledness) — defended.** An UNKNOWN turn arms and
  a `running` turn arms, both with named positive controls.
- **A2 (turn number compared against the seq watermark) — not present.**
  The guard reads `prev.turns[].turn`/`.status`; the fixtures use turn 4
  against seq 1 and turn 1 against seq 2, so a seq-keyed guard could not
  hide there.
- **A6 (C2 — a second source of truth) — defended, and checked rather
  than believed.** `staleFlightClaim` is the one new state field;
  `grep` confirms it is WRITTEN in two places in `app/src` and READ
  nowhere outside the tests. Nothing branches on it. The guard's token is
  `GenesisTurn.status`, the same field `flightOf` puts in front of the
  flags. **C2 holds.**
- **A8/A9 (the bound is a comment / the bound fires on a healthy turn) —
  both defended.** The bound is real (`MB1`/`MB2`), a healthy command is
  untouched (`MB3`), and a rejection is not converted into an absence
  (`MB4`). The 30 s derivation is not merely written down, it is TRUE:
  `runner.rs` really carries `probe_timeout: 10s` and
  `start_timeout: 30s`, checked here against the file.
- **A11/A12 (the end-to-end body cannot tell this fix from T-171's
  rescue) — MISSED, and this was my sharpest attack.** The bodies drive
  the real module singleton, the real `genesis-turn` channel, the real
  status pull and the real cancel command; `MX` and `MY` prove they see
  wiring nothing else sees; and asserting `isTurnInFlight === false` does
  foreclose `stranded`, which `flightOf` returns only inside its
  `claimed` branch. The screen half is genuinely absent — see FINDING 1 —
  but the store half is not vacuous.
- **A14 (the positive control is not a control) — defended.** Each
  refusal is set against the same state with ONE field changed, and the
  controls are asserted with their own messages.
- **A16/A17 (C6 asserted as "did not throw" / fixture too small) —
  defended.** "Safe twice" is asserted BY IDENTITY (`toBe`), which `M17`
  kills, and the real store body presses the chord twice.
- **Fence (X1): CLEAN.** The diff writes `app/src/lib/agent-store.ts`,
  `app/test/agent-store.test.ts` and four files under `docs/tasks/` —
  every one inside the manifest or its `alwaysWritable`.
- **Security sweep (X2): CLEAN.** No dependency change (`package.json`
  and the lock are untouched). No new IPC command — the frontend command
  scan in `crescendo-dom.test.tsx` still passes, and both new call sites
  still spell their command names at the `invoke` site so the scan can
  see them. No secret, key or developer path. `StaleFlightClaim` carries
  only a number and two enums — no model-adjacent text, so no new
  rendering sink (ADR-009 untouched). `UNANSWERED_COMMAND_MESSAGE` is a
  static literal. The app program's node-free boundary holds:
  `npm run build`'s second `tsc` is exit 0 with the new
  `node:fs`/`node:path` imports confined to the test program.

### Observations, recorded and NOT blocking

1. **Pre-existing, not this lane's:** a re-`started` event for a turn
   already in `turns` keeps the old text, so a fresh session's turn 1
   concatenates onto the previous session's — probed here as
   `"session onesession two"`. Identical at `f510e30`. Worth a card.
   **I did not mint an id**, deliberately: this lane has just recorded
   two live id-allocation collisions on `T-187` and a third from this
   seat would be the same defect, this time with the evidence in hand.
2. A refused arming answer always returns a NEW object, so `setState`
   fires a re-render for a field nothing renders. Harmless; noted because
   the identity contract elsewhere in this file is deliberate.
3. `reduceGenesisOutcome`'s refusal on a `cancelled`-branch race — a
   `cancelled { turn: 2 }` resolving after turn 3 started disarms the
   store for turn 3 — is left unguarded where `idle` is guarded. The
   screen is protected by `flightOf` reading turn 3's `running` status
   first, so this is an observation, not a defect.

### Re-run at MY OWN tip (roles/verifier.md step 7)

This verdict is a WRITE, and prose is a code input here. Gates re-run at
the tip THIS SEAT created, after committing — result recorded in the
commit that carries this verdict.

