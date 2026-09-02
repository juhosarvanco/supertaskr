---
id: T-239
title: THE DISPATCH RITUAL IS EIGHT HAND STEPS AND ONE ARM COULD PERFORM THEM IN ORDER, REFUSING AT THE FIRST FAILED STEP — the order is law, every step has a command, and only the seat's memory joins them
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
suggested_by: "the architect seat, 2026-09-02 — item 6 of docs/rooms/loop-efficiency.md; measured across the four lanes dispatched that night, each cut by hand in the order orchestrator 5b and 5c prescribe"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

**EVERY STEP IS RIGHT AND THEIR SUM IS TWENTY MINUTES OF A SEAT'S
ATTENTION PER LANE.** Stamp `building` on the integration branch and
commit; cut the worktree from that commit as a sibling with an absolute
path; run `--preflight`; run `--write-fence` against the worktree; read
the manifest back; cut the verifier's bench, detached, at the same base;
assemble the brief to a file; derive the lane's port and scratch stem
from the card number. Each step has a command today; the ORDER is law
(orchestrator 5b, 5c; the serial-ritual bullet in CONVENTIONS); nothing
joins them but the dispatching seat, which is the seat that inverted
the order on 2026-09-01 (T-226) and cut four worktrees before arming
any (T-209's refusal).

T-204 generates the PROMPT; this card performs the RITUAL. They meet at
the end: the arm's last line is the covering message T-204 assembles.

## The arm

`brief.mjs --dispatch-lane T-NNN --slug <slug>` [--executor <seat>
--verifier <seat>], run from the integration checkout by the holder,
performs the steps above IN ORDER and refuses at the first that fails,
leaving the tree as it found it where it can: a failed preflight after
the stamp reverts nothing (the stamp is a fact about the card, T-226)
but removes no worktree it did not cut; a failed `--write-fence` after
the cut removes the worktree it just cut and says so. Every refusal
names the step, the command it ran, and its exit — the four house codes.

## Acceptance criteria

- WHEN the arm succeeds THE tree SHALL be exactly what the eight hand
  steps leave: the stamp commit on the integration branch, the lane
  worktree on its branch at that commit, the manifest in the lane, the
  bench detached at that commit, the brief file, and one printed block
  of lane facts (branch, worktree, base hash, bench, port, scratch stem,
  brief path) — a body SHALL compare the arm's result with a hand-run
  ritual on a fixture, file for file.
- IF any step fails THEN THE arm SHALL stop at that step, name it with
  its command and exit, and SHALL NOT perform a later step; a body per
  step SHALL prove the stop.
- THE arm SHALL refuse to cut a lane whose card is not stamped
  `building` on the integration branch (T-226's parked refusal, taken
  here), and SHALL refuse to run in a checkout that is not the
  integration checkout.
- THE port and scratch stem SHALL be DERIVED from the card number by the
  spelling CONVENTIONS publishes, never typed.
- THE arm SHALL write nothing the eight steps do not already write, and
  the READ arms of `brief.mjs` SHALL remain reads (the existing body
  *THE COMMAND IS A READ* stays green).
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

orchestrator 5b and 5c, the CONVENTIONS serial-ritual and E2E PORT
bullets, T-204 (the prompt half), T-226 (the refusal this absorbs),
T-209 (the disjointness guard the arm calls), T-233 (the base row the
arm makes true by construction), and docs/rooms/loop-efficiency.md
item 6.

## Implementation notes

**THE ARM IS `brief.mjs --dispatch-lane <T-NNN> --slug <slug>`**
(`[--executor <seat>] [--verifier <seat>] [--scratch <dir>] [--dry-run]`),
and it is the THIRD writing arm of a command whose header used to say
there were two — the count was amended in the same commit, because
nothing reads that header but a person and it was about to be false.

**THE SPLIT IS THE ONE `brief.mjs` ALREADY PUBLISHES.** The DERIVATION —
`dispatchLanePlan`, the spellings, `stampCard`, `stampVerdict`,
`manifestVerdict`, `createLaneArgv` — is pure and lives in
`dispatch-brief.mjs`; the RUNNER, `runDispatchLane`, is the one function
in that module that acts, and it acts only through the `DispatchIo` it is
handed. That is what makes a `--dry-run` a plan and nothing else, and it
is what lets one body per step drive a REAL failure at that step without
cutting eight worktrees.

**THE ORDER IS `DISPATCH_STEPS` AND IT IS WRITTEN DOWN ONCE**: stamp and
commit (and read the stamp back out of the commit), cut the lane at that
commit, preflight, write the fence, read the manifest back, cut the bench
detached, assemble the brief to a file, derive the port and the scratch
stem and prove the port free. Every refusal names the step, the command
it ran and its exit in the four house codes; every worktree THIS RUN cut
is removed and named; the stamp is never taken back (T-226).

**FOR THE VERIFIER, THE FOUR PLACES A CHOICE WAS MADE:**

1. **THE SUB-COMMANDS ARE THIS COMMAND RE-ENTERED**, never the copy in
   whatever `--root` names. A dispatch that ran a different
   implementation from the one it was asked of is the stale-checkout
   split `checkout-currency.mjs` exists to catch. It also means a fixture
   root needs no built parser.
2. **STEP SEVEN ACCEPTS `FOUND` AND EVERY OTHER STEP DOES NOT.** Code 1
   from the brief means "assembled and found something" and the document
   is on disk; from the preflight it means claims that no longer hold,
   and from the fence it means no manifest was written. The `FOUND` brief
   is announced, not swallowed.
3. **STEP EIGHT PROBES THE PORT** because the bullet it derives the port
   from says "`lsof` to zero rows before binding". `lsof` answers 1 over
   no rows, so the ROWS are the verdict and its exit is recorded in the
   detail rather than reported as the step's.
4. **THE BENCH SPELLING DID NOT EXIST** and is published in this commit
   (`../nputer-V-T-NNN`, detached), read back out of the lane bullet
   rather than typed. The stale ritual clause beside the fence bullet —
   "derive the brief, PREFLIGHT the card, write the fence, stamp and cut",
   an order no seat could perform — is CORRECTED there rather than argued
   beside.

**THE POISON DRILLS.** Eleven mutants, each landing read back with
`git diff` and each restored by `shasum -a 256`: mis-report the stopping
step (kills 9 — the eight per-step bodies and the stamp read-back, and
**0 of the 40 bodies `brief.spec.ts` already had**, measured over the
whole spec); a stamp anchored on a missing key becomes a no-op (1); the
manifest read-back accepts anything (1); the port base typed instead of
read (1); the create command assembled from memory (1); the brief written
under a defaulted name (1); the dry run performs the ritual (1); a dial
accepted and ignored (1); the not-integration refusal dropped (1); the
arm list one excuse short (1, and it names the flag); and a flag added to
`brief.mjs` that nothing announces (1, the producer-side half of the
same coverage body).

**TWO MORE AFTER THE REJECTION, FOR THE TWO BODIES THAT CHANGED.** The
file-for-file body and the dry-run body each opened by requiring the
arm's own exit to be `CLEAN`. **`--dispatch-lane` joins the arming
condition, so it runs the stale-checkout catcher, and EVERY lane and
EVERY verifier's bench is behind `main` by construction** — so both
bodies were green until `main` moved and red deterministically after,
aborting before the comparison they exist for. They now accept `CLEAN` or
`FOUND` — the rule `brief.spec.ts` already states for *"THE COMMAND IS A
READ"*, arriving in a body written after it — and, when the exit is
`FOUND`, require EVERY finding to be the session's own stale checkout and
NONE to name the fixture. Drilled one side only: aiming step four's
`--write-fence` at the bench (a real step failure) reds the file-for-file
body by exactly that new assertion, and a plan that refuses before any
step reds BOTH.

**THE FENCE WAS WIDENED TWICE AND NEITHER TIME BY ME**:
`docs/CONVENTIONS.md`, because orchestrator 5b requires a new command's
SPELLING to be published there; and `tools/e2e/tests/brief-flush.spec.ts`,
because its arm-coverage body derives `brief.mjs`'s own `FLAGS` literal
and reds by name on a flag nothing announces — six new flags, so six
`NOT_AN_ARM` entries, `--dispatch-lane` as a writer and the five dials as
its modifiers.

**CORRECTION TO THIS SECTION'S FIRST WRITING, AND IT IS THE VERDICT'S**:
two `session-economics.spec.ts` bodies redded in the graded run at this
tip and were attributed here to REF SKEW. **That attribution was wrong,
and the two bodies PASS at this same tip** — re-run and measured after the
verdict: 2 passed. The reds were a function of the LIVE WORKTREE LIST and
not of any tree: while `T-205-s8`'s lane was live, its card as read at
this ref carried `touches: [tools/e2e]`, a fence containing every other
tools/e2e lane's, so `fenceOverlaps` reported nineteen overlaps and
`brief.mjs --task` answered 1 where those bodies require 0. That lane has
since been removed and the overlaps went with it. The card text at this
ref never changed — **only the machine did**, which is exactly the class
`T-205-s8`'s own title names, and it is why a figure like this one has to
carry the clock it was read at rather than a commit.

**AND THE CARD'S `Read beside` LINE CLAIMS MORE THAN THIS ARM DELIVERS.**
It names *"T-233 (the base row the arm makes true by construction)"*.
**It is not true and T-233 keeps its row.** Measured on a fixture
dispatch: the arm's own printed block reports `base hash:` as the STAMP
commit, which is where the lane really is, while the brief the arm writes
at step seven still carries ROW 4's `base commit:` as the newest
`Checkpoint:` — a DIFFERENT commit — and prints `branch: task/T-901-<slug>`
and a `create:` line with `<slug>` unsubstituted and that same checkpoint
as the base. So a dispatcher reading the arm's block and a seat reading
the brief the arm handed it are told two different bases, and the brief's
create line is still a prescription nobody performed. The arm makes ROW 4
true of ITSELF and not of the document it writes; closing that is T-233's
and is not claimed here.

**WHAT IS ROUTED AND NOT BUILT**: `T-239-s1` (the arm's last line is
T-204's covering message and nothing assembles one yet), `T-239-s2` (the
scratch DIRECTORY is defaulted where only the file name is published) and
`T-239-s3` (the bench is cut and left unbuilt).

## VERDICT, 2026-09-02 — REJECTED — verifier claude-opus-5@subagent

Judged at lane tip `6e14f34e71b8dd6fdfac276903e609cfd6be7f39`, base
`a7e38c23e80c67921cf281fa186d745fab4e5545`, on an independent bench
(`/Users/ujju/Projects/nputer-V-T-239`, detached, ports
`NPUTER_E2E_PORT=25239` / `NPUTER_BOOT_PORT=26239`; 1420 and 14520 never
touched). **Every figure below was measured by this seat.** The lane
worktree was never entered and never edited.

**REJECTED on ONE criterion, and the arm itself is not the fault.** The
first acceptance criterion's own body — *THE ARM LEAVES EXACTLY WHAT THE
EIGHT HAND STEPS LEAVE, file for file* — and the dry-run body that
carries the fifth criterion's *writes nothing* half both **abort on their
first assertion at this tip and never reach the comparison they exist
to make**. `gate-run e2e` is **RED** here. Everything else in this card
is met, several parts of it better than the criteria asked for, and the
fix is two lines in the spec.

### The blindness was CLOCK-SHAPED, and it is stamped

Phase 1 reached this seat at dispatch, before the lane's work existed;
there was no diff to decline to read. The attack set and the ground
truth were written from the card at its base ref and **sealed at
`2026-09-02T13:02:53Z`**, before the tip was named to me:

```
attack set: sha256:f3d46965934fa7f79909ced8a7fa0ba5d2d2bc62a109e969737fbc0b1b49e157 (attack-V-T-239.md)
ground truth: sha256:5aca3c2f966e3945ac4fc692d792e5c93634e38de705b004680434ac900e12e5 (ground-V-T-239.md)
seal: sha256:3327ad75883e6e4c2040c6cdd8ab240bf3b887b815b1e86764080a4bff1bc3eb (stamps-V-T-239.txt)
```

All three re-verified byte-identical at verdict time.

**THE FRAME I ACTUALLY HAD, and it is weaker than orchestrator 5d's
ideal.** Phase 1 was its own spawn and it ran before the work existed —
but it had file, git and shell tools, which 5d's phase 1 does not. The
blindness here was bought by the CLOCK and by a fence on where I was
told to look, not by the tool grant. **One leak, disclosed at the seal
and repeated here**: taking the ground truth ran `--preflight`, whose
output carries `checkout-currency`'s machine-wide sweep, which named
`/Users/ujju/Projects/nputer-T-239 @ a7e38c2` — the lane's existence and
its HEAD at the base. No diff, no commit subject, no content.

**DISCLOSED**: the phase-2 dispatch carried the executor's own figures
(mutant counts, suite totals, an account of two e2e reds). That arrived
after the seal, which is where it belongs. Nothing below is accepted on
those figures; each was re-derived here, and **on one of them the
executor and I disagree** (§R).

### R — THE REJECTION, with the command that shows it

`gate-run e2e` at the tip: **exit 1, 641 bodies, verdict RED,
reason `suite-reported-failure`**, 639 passed / 2 failed, 21.9m. The two
failures are this card's own new bodies:

```
✘ brief.spec.ts:3157 THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file
✘ brief.spec.ts:3651 THE DRY RUN PRINTS THE PLAN IN ORDER AND WRITES NOTHING
```

Both die on the same line shape — `expect(ran.status, ran.stderr).toBe(EXIT.CLEAN)`
at 3184 and 3671 — with **expected 0, received 1**, and the stderr they
print is not about the dispatch at all:

```
brief: FOUND 1 thing(s) the assembler could not settle:
  the checkout this session was started in is STALE [guard-surface-behind] —
  the judged checkout /Users/ujju/Projects/nputer-V-T-239 … does NOT contain
  89cf2964a5b710d533a1746a074e1f7a0f6f34f7 — the newest main commit touching
  .claude. It is 50 commit(s) behind main.
```

**THE ARM IS RIGHT AND THE BODIES ARE WRONG.** `--dispatch-lane` joins
`--preflight` and `--write-fence` in the `arming` condition this lane
itself introduced, so it runs the stale-checkout catcher; the catcher
found something; `FOUND` is the house code for *I derived it and found
something*. Exit 1 over a **successful** dispatch is correct behaviour.
What is not correct is a body that pins that exit to `CLEAN`, because
**whether this repository has a finding right now is a LIVE fact**.

Minimal reproduction, no suite involved — a scratch clone of the tip, a
fixture card, and the arm's own dry run:

```
node tools/e2e/scripts/brief.mjs --dispatch-lane T-901 --slug repro \
  --root <scratch> --scratch <scratch>/s --dry-run
  → exit 1, exactly ONE finding, and it is about the SESSION's checkout
```

**THE RULE THIS BREAKS IS TWELVE LINES ABOVE THE NEW CODE, IN THE BODY
THIS CARD'S OWN FIFTH CRITERION NAMES.** `brief.spec.ts:1121`, *THE
COMMAND IS A READ*, accepts `[EXIT.CLEAN, EXIT.FOUND]` and says why in
its own comment: *"whether this repository has a finding right now is a
LIVE fact — a lane cut two minutes ago can add one — and a body that
asserted it would red in somebody else's lane for somebody else's
dispatch. It is disclosed below instead."* The two new bodies assert the
exact value that comment forbids.

**AND IT IS NOT A ONE-MACHINE ACCIDENT.** `docs/CONVENTIONS.md` rules
staleness *"Reported rather than refused: a permanently-behind detached
tree must not red every dispatch, or this becomes the gate nobody
reads."* These bodies convert that deliberately non-blocking report into
a suite RED, on **every checkout behind main on `.claude`** — which is
every lane and every verifier's bench, by construction, from the moment
main touches `.claude`. It happened to the assigned verifier on the
assigned bench: the same two bodies were **green here at 15:xx** (63/63,
twice, and through eighteen mutant runs) and went red when `89cf296`
reached main. **Their green was a function of the machine's clock.**

Reproduced deterministically in isolation at the tip: `brief.spec.ts`
alone → **2 failed, 55 passed**.

**THE FIX IS TWO LINES**: accept `[EXIT.CLEAN, EXIT.FOUND]` at 3184 and
3671, as the neighbouring body does. The success of the dispatch is
already proved by everything after those lines — the worktree
administration, the three inventories, the manifest and the brief — so
nothing is lost by loosening the exit and the bodies then measure their
own subject instead of the machine's currency. **A `USAGE` or
`CANNOT_RUN` must still fail them.**

**AND THE CARD'S OWN ACCOUNT OF ITS REDS DOES NOT HOLD AT THIS REF.**
The implementation notes say the two e2e reds are `session-economics`
ref skew. Measured here at `6e14f34`: **every one of the ten
`session-economics` bodies passed**, including the two named
(*the recommended seat is a function of the CARD* and *the advisory line
is NOT a contract row*). The two reds are the ones above. Whatever was
true when that paragraph was written, it is not true at the tip handed
to verification, and a card that mis-names its own red teaches the next
reader to discount the gate.

### The criteria, re-derived

**AC1 — the tree the eight hand steps leave, and a body comparing file
for file · NOT MET AT THIS TIP.** The body is well built — it runs the
real command against one scratch repository, performs the eight steps by
hand in a second, and compares worktree administration, the stamped card
*as the commit carries it*, three full `find` inventories by set
equality, the manifest byte for byte and the brief's values. Its expected
side is asserted non-empty three times over and asserted to contain
`.nputer/lane-fence.json` (my pre-committed shape-TEN and whitelist
attacks, A1.b and A1.c, both answered). **It does not run.** A criterion
whose body aborts before its comparison is not met, however good the
comparison would have been.

**AC2 — stop at the failed step, name it with its command and exit,
perform no later step, a body per step · MET, and better than asked.**
Eight bodies generated from `DISPATCH_STEPS`, each driving
`runDispatchLane` against a stubbed `DispatchIo` that is the only
executor, injecting that step's REAL failure while every other step
succeeds — so the later step *would* have run (my A2.b: no single
arrangement decides both the subject and the control). Each asserts the
NEGATIVE (no later step attempted) **beside the POSITIVE** (every
earlier step attempted), which is the half my attack set said an absence
needs. Exit codes are pinned to specific house codes, never
`not.toBe(0)` (A2.d). The refusal is asserted to contain the step, the
spelled command and the exit (A2.e). All eight steps have a body (A2.c).

**AC3 — refuse a card not stamped `building`, and refuse a non-integration
checkout · MET.** The stamp is read back **out of the commit**
(`git show <base>:<card>`), not off the working tree the writer just
wrote — exactly my A3.a — and the body's positive control proves the
commit was made and the write attempted, so it catches a silent no-op
rather than a step that never happened. The checkout test is
`checkout-currency.mjs`'s own `isIntegrationCheckout`, imported, not a
second implementation (A3.c answered; `HEAD === refs/heads/main`, so a
lane and a bench both answer NO). A `held` seat is refused too.
**Named, not blocking**: a `vacant` seat proceeds with a finding. The
criterion names only the integration checkout and T-238 rules the holder
*declared, never inferred*, so this is inside the card — but the card's
prose says *"by the holder"*, and a dispatch into a seat nobody declared
is a dispatch nobody can be asked about (A3.d).

**AC4 — port and scratch stem DERIVED by the spelling CONVENTIONS
publishes, never typed · MET, to the standard the file already set.**
`dispatchSpellings` reads the port base, the scratch pattern and the
bench pattern out of `docs/CONVENTIONS.md`'s own backticked runs by
locator phrase, and **throws rather than defaulting** when a bullet is
reworded. The body is a DATA MUTANT that moves the document on one side
only and requires the derivation to follow — the shape `brief.spec.ts:447`
established for the lane spellings, and the only shape that can grade
this criterion (a code-only drill mis-grades a derivation guard by
construction, T-221). My own end-to-end control, run where the unit body
cannot reach: with a scratch clone whose CONVENTIONS publishes
`15000+` → `19000+`, the **real command** printed
`port: NPUTER_E2E_PORT=19901` for card T-901. Step 8 also probes the port
with `lsof` and reads the ROWS rather than the exit, which is more than
the criterion asked and is what the bullet it derives from actually says.

**AC5 — writes nothing the eight steps do not, and the READ arms stay
reads · MET in substance, and its dry-run evidence is one of the two
bodies that abort.** *THE COMMAND IS A READ* is green. The stray-write
attack (my M10) is caught, and caught only by the file-for-file body. The
module header's *"every arm but TWO is a read"* — which I recorded at the
base as a sentence about to go false with nothing to catch it — was
amended to THREE in the same commit, with the count named as the thing a
reader checks. The dry run writes nothing, byte for byte, when the body
runs.

**AC6 — headless · MET.** No new body opens a browser or reads `app/dist`.

**AC7 — `review: independent` · MET.** The field is unchanged from the
base; `builder:` and `verifier:` unchanged; `built_by:` filled by the
executor; `verified_by:` filled here and by nobody else.

### The drills — 18 mutants, 17 killed, 1 equivalent

Every mutation applied by exact anchor (each verified to match **exactly
once** before it was applied — two of my first thirteen did not, and were
re-anchored rather than run), **read back with `git diff`** before the
suite, restored with `git restore --source=<tip> --staged --worktree`,
and every restoration proved by `shasum -a 256` against
`git show <tip>:<path>`. **18-for-18 restored.** Suite: `brief.spec.ts` +
`brief-flush.spec.ts`, 63 bodies.

| mutant | what it makes true | bodies killed |
|---|---|---|
| M1 | the plan performs the cut before the stamp (`DISPATCH_STEPS` untouched) | 6 |
| M2 | a failed preflight/fence/brief is logged and the ritual runs on | 3 |
| M3 | the unwind removes nothing | 6 |
| M4 | the port base typed (`15000`) instead of read | 1 |
| M5 | the bench path typed instead of read | 1 |
| M11 | the scratch pattern typed instead of read | 1 |
| M6 | the stamp read-back accepts a commit that lacks it | 1 |
| M7 | the not-integration refusal dropped | 1 |
| M8 | `CANNOT_RUN` collapsed into `FOUND` | 1 |
| M9 | one of the seven lane-fact rows loses its label | 1 |
| M10 | the arm writes one file the hand steps do not | 1 |
| M12 | the dry run performs the ritual | 1 |
| M13 | the refusal names the step **after** the one that failed | 9 |
| M15 | a stamp key the card lacks is appended, not refused | 1 |
| M16 | a manifest naming another card is accepted | 1 |
| M17 | a create command the document no longer spells is used anyway | 1 |
| M18 | a dial accepted and then ignored | 1 |
| M19 | step 5 never stops the ritual (steps 3 and 4 untouched) | 4 |
| M14 | the missing-manifest **throw** path is dropped | **0 — equivalent** |

**M13 independently confirms the executor's own headline**: the
off-by-one stop index kills exactly nine — the eight per-step bodies and
the stamp read-back — and **zero of the 40 bodies `brief.spec.ts` already
had**.

**M14 SURVIVED AND IS AN EQUIVALENT MUTANT, NOT A HOLE.** Dropping the
`return stopAt` in the manifest step's catch leaves `text` undefined,
`JSON.parse(undefined)` throws inside `manifestVerdict`, that returns
*"not readable JSON"*, and the ritual **still stops at step 5** with the
same `n`, `id` and code. The missing-manifest case is guarded twice on
one path and either guard alone preserves the property. Read out of the
code, not inferred from the survival.

**KILL-SET CONTAINMENT, NOT COUNTS** (verifier.md 2b). Under my first
thirteen mutants the per-step bodies looked contained — step 5's kill set
`{M3, M13}` sat inside step 3's `{M2, M3, M13}` — which would have made
five of the eight restatements. **That containment was an artifact of my
probe.** M19 separates them: it kills steps 5–8 and leaves 3 and 4 alive,
so step 5's set is `{M3, M13, M19}` and neither contains the other. The
eight are separately load-bearing. M19 also demonstrates the POSITIVE
half doing work: steps 6–8 die under it because their *"every earlier
step ran"* assertion fails, not their negative.

**THE CONTROL I PROPOSED IS ONE I OWED A DEMONSTRATION FOR.** M10 — the
stray write — is my own suggested control for the fifth criterion. It
kills exactly one body and **passes the other 62**, so it is not a mutant
that reds everywhere; and the body it fails is the one whose subject it
is. Named before it was spent, as the rule requires.

### Gates at the tip, run by this seat

```
gate-run parser  exit 0   372 bodies  GREEN   @ 6e14f34
gate-run app     exit 0  1141 bodies  GREEN   @ 6e14f34
gate-run e2e     exit 1   641 bodies  RED     @ 6e14f34   (§R)
docs-gate <this card>  exit 1 — owes app, tools/e2e, lib/parser
```

`parser` and `app` agree with the executor's figures to the body; that
agreement is corroboration, not the source. `e2e` does not.

### The fence, and the two widenings

All nine paths in this one-commit diff are inside the fence as widened:
`brief.mjs`, `dispatch-brief.mjs`, `brief.spec.ts`, `brief-flush.spec.ts`,
`docs/CONVENTIONS.md`, and four files under the always-writable
`docs/tasks/`. **BOTH WIDENINGS ARE THE SEAT'S AND NEITHER IS THE
LANE'S**, verified rather than taken on report: `8a1ee82` (CONVENTIONS)
and `014380a` (brief-flush.spec.ts) are one-line commits on `main`, each
touching only this card's `touches:` line, and **neither is an ancestor
of the lane tip**. The lane's own commit carries the same widened line,
which is what a re-armed manifest requires and is not a fence widened
from inside.

`docs/CAPABILITIES.md` is not regenerated and stays the integrator's, as
routed. Seventeen new spec names land in it when it is.

### What the diff got right that the card did not ask for

- **THE STALE RITUAL CLAUSE IS CORRECTED RATHER THAN ARGUED BESIDE.**
  `docs/CONVENTIONS.md`'s fence bullet read *"derive the brief, PREFLIGHT
  the card, write the fence, stamp and cut"* — an order that contradicts
  orchestrator 5b and the serial-ritual bullet and **cannot be executed**,
  since `--write-fence` is handed the worktree the cut creates. I ruled
  it stale prose at the seal, before the diff existed, from the base text
  alone; the lane reached the same reading and rewrote the clause as the
  eight steps, naming why. The two arrived independently.
- **THE BENCH SPELLING IS PUBLISHED.** `../nputer-V-T-NNN`, detached — a
  path every bench on this machine already wore and no document stated.
  I recorded its absence as an under-specified criterion at the seal.
- **THE CREATE COMMAND IS SUBSTITUTED, NOT ASSEMBLED**, and it refuses
  rather than falling back when the document no longer spells it.
- **THE SUB-COMMANDS RE-ENTER THIS COMMAND**, not the copy in whatever
  `--root` names — the stale-checkout split, closed by construction.

### Security sweep · CLEAN

Every process the arm starts goes through one `spawnSync` with
`shell: false` and an argv ARRAY; no string is ever handed to a shell.
The one caller-supplied token that reaches `git` is `--slug`, and the
published branch pattern prefixes it with `task/`, so it can never
present as an option. The redirect fd is closed in a `finally`. No
dependency was added, no manifest touched, no secret or key in the diff,
no network call. `lsof` is spawned with a derived integer.

### Findings that are NOT the rejection

1. **T-233 IS NOT DISCHARGED BY THIS CARD, and the Read-beside line
   saying it is by construction is FALSE.** I pre-committed this at the
   base as unproven; measured at the tip against a scratch clone, one
   successful dispatch of `T-901` printed
   `base hash: e9c611e9…` (the stamp commit — correct, and the lane is
   cut there) while **the brief the same run wrote at step 7** carried
   `base commit: 898747523cd9…` (the newest `Checkpoint:`) and
   `create: git worktree add … -b task/T-901-<slug> 898747523cd9…`. Two
   contradicting base commits out of one dispatch, and the document
   handed to the executor names the wrong one, with an unsubstituted
   `<slug>`. The arm makes the right base *available*; it does not make
   the row *use* it. **No new card filed — T-233 already owns this row
   and is `status: planned`.** This note exists so nobody closes it as
   absorbed.
2. **The `--scratch` directory is defaulted to `os.tmpdir()`** where only
   the file NAME is derived. Inside the criterion (the stem is derived,
   and the derived name is what prevents collision) and already routed as
   `T-239-s2`.
3. **The bench is cut and left unbuilt** — routed as `T-239-s3`, and this
   seat paid it: `npm ci` in `tools/e2e`, `npm ci` and `npm run build` in
   `app/` before a single body could be listed.
4. `T-239-s1`, `s2` and `s3` all parse, carry `status: suggested` and
   `suggested_by`, and no title opens with a reserved indicator.

### On my own commit

This verdict is a WRITE, and `docs-gate` on this card's path owes app,
tools/e2e and lib/parser. I re-ran `parser` at my own verdict commit —
**372 GREEN** — because `verified_by:` is a parser input and D5 compares
it against `verifier:`. The e2e suite is red at the tip for the reason in
§R and my prose does not change that; re-running the 22-minute suite to
watch the same two bodies fail would add nothing a reader can use.

**I left `status: verifying` rather than stamping `rejected`.** On tasks
`rejected` is a retriable lifecycle state and it unlocks the placement
fields; it also moves board figures that several bodies count, at a tip
whose e2e suite is already red. That status change belongs with the seat
that routes the rework, in a commit whose gates can be measured for it.

**Re-verification does not need a fresh phase 1.** The defect is two
lines of a test's precondition; the contract has not moved and the sealed
set above still measures it. Judge the fix against the same two digests.

## RE-VERDICT, 2026-09-02 — APPROVED — verifier claude-opus-5@subagent

Judged at lane tip `9f85db3b1a6290b99896c7ea6cca9941b949aafb`, one commit
on top of the rejected `6e14f34`, base `a7e38c2` unchanged. Same bench
(`/Users/ujju/Projects/nputer-V-T-239`, detached, `NPUTER_E2E_PORT=25239`
/ `NPUTER_BOOT_PORT=26239`). The lane was never entered or edited.
**Every figure below was measured by this seat.**

**NO FRESH PHASE 1, as the rejection ruled**: the defect was two lines of
a test's precondition, the contract did not move, and the sealed set
still measures it. Both digests re-verified byte-identical at this
verdict's commit:

```
attack set: sha256:f3d46965934fa7f79909ced8a7fa0ba5d2d2bc62a109e969737fbc0b1b49e157 (attack-V-T-239.md)
ground truth: sha256:5aca3c2f966e3945ac4fc692d792e5c93634e38de705b004680434ac900e12e5 (ground-V-T-239.md)
```

### What moved, derived here rather than taken on report

**The four production files are BYTE-IDENTICAL to the rejected tip** —
`brief.mjs`, `dispatch-brief.mjs`, `brief-flush.spec.ts` and
`docs/CONVENTIONS.md` all hash the same at `6e14f34` and `9f85db3`. Only
`tools/e2e/tests/brief.spec.ts` and this card changed. **So the eighteen
mutants drilled against the implementation at the rejected tip carry over
unweakened**, and the re-drill below only has to answer for the two
bodies that moved and for the helper they now share.

### AC1 and AC5's writes-nothing half · MET

Both bodies now open with `expectDispatched(ran, fx, what)`, which
accepts `[CLEAN, FOUND]` — citing, in its own comment, the rule *THE
COMMAND IS A READ* states twelve lines above it and gives its reason for
— and then, **when the exit is FOUND, refuses to loosen anything else**:
every finding must be the session's own stale checkout, and none may name
the fixture the dispatch was aimed at.

Measured on this bench with a scratch clone of the tip, no suite
involved: a **successful** dispatch of a fixture card answers exit 1 with
**exactly one** finding, that finding is the staleness one, the fixture
home appears nowhere in it, and the lane worktree, the bench and the
brief are all on disk. That is precisely the shape the helper admits.

`brief.spec.ts` is **57 bodies, 57 green**; the count did not fall when
the assertion loosened.

### The re-drill — 5 mutants, 5 killed, all restored by sha256

Each anchor verified to match exactly once, each landing **read back with
`git diff`**, each restored with `git restore --source=<tip>` and proved
by `shasum -a 256` against `git show <tip>:<path>`. **5-for-5 restored.**

| mutant | what it makes true | result |
|---|---|---|
| N1 | step 4's `--write-fence` aimed at the bench — a REAL step failure | **file-for-file body red; dry run stays green** |
| N2 | the findings split returns nothing | **both bodies red** |
| N4 | a successful dispatch answers `CANNOT_RUN` | **file-for-file body red** |
| N5 | the arm writes one file the eight hand steps do not (was M10) | **file-for-file body red** |
| N6 | the dry run performs the ritual (was M12) | **dry-run body red** |

**N1 IS THE ONE THAT MATTERED, AND THE NEW ASSERTION IS WHAT CAUGHT IT** —
by name, at line 3222, before any tree was compared:

```
Error: the arm's dispatch reported a finding that is NOT the session's own
stale checkout, so something about this dispatch was found and the
comparison below would be comparing a failure
```

So the loosened exit did not cost the property the `CLEAN` assertion was
there for; it moved that property onto the thing that actually carries it.
And the dry-run body correctly stayed **green** under N1 — it performs no
step, so a step failure is not its subject.

**N2 answers the vacuity question the fix opens.** A helper that accepts
`FOUND` and then inspects findings can pass by finding none; the
`toBeGreaterThan(0)` guard is live, and both bodies red on it.

**N4 answers the rejection's own condition.** The rejection required that
`USAGE` or `CANNOT_RUN` must still fail these bodies. Exit 3 over a
successful dispatch reds the file-for-file body on the `[CLEAN, FOUND]`
membership.

**N5 and N6 are REGRESSIONS OF THE REJECTED TIP'S DRILLS**, re-run because
a loosened precondition is exactly where teeth go missing quietly. Both
are killed by the same bodies that killed them before the fix. **The
comparison is the one already drilled; only its precondition changed.**

**ON CONTAINMENT, HONESTLY.** N1's failure would also have redded the
inventory comparison a few lines later, so the new assertion's kill set
overlaps the comparison's rather than standing alone. It is not therefore
a restatement: it fires **first** and reports the right cause — *this
dispatch found something* rather than *these two directories differ* —
which is the difference between a red a reader can act on and one they
have to diagnose. N2 and N4 kill it and nothing else.

### The card's two corrections · both made, both verified

1. **The T-233 claim is withdrawn.** The notes now state that the arm
   makes ROW 4 true of ITSELF and not of the document it writes, with the
   fixture measurement recorded — the printed `base hash:` is the stamp
   commit while the brief's `base commit:` is the newest `Checkpoint:`,
   and the brief's `create:` line still carries an unsubstituted `<slug>`
   and that same checkpoint. **T-233 keeps its row.** That is the
   disposition the rejection asked for.
2. **The `session-economics` attribution is withdrawn** and re-attributed
   to the live worktree list — `T-205-s8`'s lane, while live, carried a
   whole-directory `touches: [tools/e2e]` that made `fenceOverlaps`
   report nineteen overlaps and `brief.mjs --task` answer 1. Measured
   here at this tip: **all ten `session-economics` bodies pass**, as they
   did in my rejected-tip run. The correction reaches the right lesson —
   a figure that moves with the machine carries a clock, not a commit.

**One nit, not blocking**: the `Read beside` line itself still reads
*"T-233 (the base row the arm makes true by construction)"*. The
correction is explicit, dated and in the same file, but a reader who
stops at the pointer list is still told the wrong thing.

### Gates at the tip, run by this seat

```
gate-run parser  exit 0   372 bodies  GREEN  @ 9f85db3
gate-run app     exit 0  1141 bodies  GREEN  @ 9f85db3
gate-run e2e     exit 0   641 bodies  GREEN  @ 9f85db3   (17.4m, 0 failures)
```

Inside that e2e run: `brief.spec.ts` **57/57**, `brief-flush.spec.ts`
**6/6**, `session-economics.spec.ts` **10/10**, and the two bodies this
card was rejected for — `brief.spec.ts:3230` and `:3724` — both green.
`docs-gate` on this card's path exits 1 and owes app, tools/e2e and
lib/parser; every live card's frontmatter parses with a legal status.

### Everything the rejection already found MET still stands

AC2 (eight generated stop bodies, negatives beside positives, real
failures through the io seam, specific house codes), AC3 (stamp read back
out of the commit; `isIntegrationCheckout` imported rather than
re-implemented), AC4 (port, stem and bench derived from CONVENTIONS' own
bytes, proved by a data mutant, and confirmed end-to-end by this seat
against a clone publishing `19000+`), AC6, AC7 — all measured at
`6e14f34` against files that are byte-identical here. The security sweep
is unchanged and clean: `shell: false`, argv arrays, fd closed in a
`finally`, no dependency, no secret, no network.

Routed and not built, unchanged: `T-239-s1`, `T-239-s2`, `T-239-s3`.
`docs/CAPABILITIES.md` remains the integrator's regeneration; seventeen
new spec names land in it.

### On my own commit

I re-ran `parser` at this verdict commit — `verified_by:` is a parser
input and D5 compares it against `verifier:`. I did not re-run the
22-minute e2e suite over a prose-only commit: no body reads this card's
body text, and the frontmatter change is the one line docs-gate and the
parser already judged green here.

**The card is ready to merge.** `status:` is left for the seat that
merges; this verdict does not move it.

**TWO CORRECTIONS TO MY OWN FIRST VERDICT, kept above verbatim rather
than edited.** (1) It records *"`built_by:` filled by the executor"* under
AC7. That is wrong: `built_by:` is EMPTY at both tips, and
`method/tasks/TASK-FORMAT.md` stamps `built_by` / `verified_by` / `review`
**on done**, not at `verifying` — so the field is correctly empty here and
my reading of it was not. (2) That verdict was committed on the bench, on
top of `6e14f34`, and never reached the lane; the fix pass was cut from
`6e14f34` and so does not carry it. It is carried onto the card **here**,
unaltered, so a later reader meets the rejection before the approval
instead of an approval with nothing behind it.
