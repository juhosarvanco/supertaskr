# State

Updated: 2026-09-01 at the T-216 close — **"the T-216 record"** is the
newest file in docs/checkpoints/; three from the same day sit beside it.
**NO task branches remain** (derive: LANES), nothing is outstanding, and
**CI IS GREEN at the tip** — a separate claim from a local battery, and
one that was FALSE for five hours while four batteries said otherwise.

**NOTHING IS BROKEN.** Designed non-zero: `npm run health` **3** while
bands await keepers (T-156-s1/s2) — never read it as clean, never "fix"
it. **AND AN EXIT MAY MEAN THE GATE NEVER RAN**: `docs-gate.mjs`'s
`CANNOT_RUN: 3` sits in a catch inside `main()`. **READ THE OUTPUT, NOT
THE CODE** — a verdict prints gate lines; a crash prints a stack trace,
and an npm ENOENT prints a missing package.json. **Re-run a suspect ONCE,
then ATTRIBUTE.**

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019). STATE keeps the
MECHANISM; the INSTANCE is stamped in the record. A figure appears here
only with its derive command. **When the byte band warns, content MOVES
to the record — a hazard is never deleted to fit**, and the remedy every
time has been a POINTER where a list had grown. **The commit subject
opens with `Checkpoint:`** (T-182).

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. **The dispatch ritual and its order
  are orchestrator 5b/5c's**, read there, not restated here. Never read
  the ledger's FREE column as a verdict (T-143).
- **THE RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE MANIFEST
  BACK, then cut the next.** T-209's guard refuses a dispatch against a
  lane whose fence it cannot read — *an unread fence is not "disjoint
  from everything"* — and refused four at once when this seat cut all
  four first. **STAMP BEFORE YOU CUT** (T-226): two consecutive cards
  merged clean, against a conflict in all three that stamped after.
- **DISJOINTNESS IS OVER EXPANDED PATH SETS, NEVER TOKENS** (rule 5,
  carrying its measurement: six lanes, every block a naming collision,
  not one real collision). **T-209 COMPUTES IT** — ask the guard, never
  assert it. `touches:` is a permission declaration, never an oracle.
- THE HUMAN'S APP: **1420 is CONVENTIONS' PORT RULE** — that document
  names the one permitted command and forbids the probe; do not restate
  it here. `../nputer-app` is detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT: THE DEFAULT IS MACHINE-WIDE, SO EVERY CONCURRENT LANE
  TAKES 14520.** SET `NPUTER_E2E_PORT=15000+<card number>` per lane;
  `E2E_PORT` binds NOTHING. lsof to zero rows before binding, never
  1420. Derive, never check (T-217's corroboration).
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT, never predict, ask AGAIN after every write.
  Never trust it from inside a drill worktree (T-153-s3).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: **DERIVE IT** — `brief.mjs --dispatch`. A hand-kept list
   here named two dead lanes and missed two live ones (T-142).
2. **THE ENFORCEMENT STACK IS COMPLETE** — write, dispatch, landing and
   push all refuse; fast paths are law; the physical layer catches what a
   hook cannot. The cards and their measurements: the 09-01 records.
   Next: **T-216-s1**, then T-222/T-223/T-224. **T-229 and T-230 pay for
   themselves** — one prevents a rejection class, one a dispatch class.
3. **T-221 BEFORE ANY CARD TOUCHES `sharedDomain`** — one unpinned `/`
   decides whether `tools/e2e` contains `tools/e2e-helpers`, three gates
   rest on it, and dropping it reds nothing.
4. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <separate
   literal paths>`; `lint:docs` is the CENSUS, exit 0 means "I wasn't
   asked".
5. **T-126-s2 IS RULED** — join to TypeScript, shape 3 refused on TEST
   REACHABILITY. **NO BLOCKER IS NAMED HERE, EVER**: `blocked_by` IS READ
   FROM THE CARD (T-138), because this line once named a blocker that had
   closed while the card named a different one.
6. **TRIAGE PART DONE, THE REST BLOCKED BY BYTES** (T-225): promotions
   chosen by ARITHMETIC rather than merit, and suggestions now DRIFTING
   on their own band. Counts derived, not quoted; **the rider list is in
   the T-216 record.**
7. **@human holds; no card is cut from these** — the FORM (reopened),
   the STEERING SPLIT (T-180 parked), T-025-s4's three permission
   questions, T-162-s1's byte floor, T-131, and @human's eye on the
   interview's narrow-width ending (jsdom applies no breakpoints, so no
   suite here can answer it).

## Standing hazards — the section that saves the hour

- **A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT OR IT IS HALF A
  SPELLING.** **`npm run boot:check` runs FROM `tools/e2e/`** (elsewhere:
  npm ENOENT, exit 254), and **`npm run health -- --readings <FILE>`
  needs BOTH the `--` and a file** — the `--` keeps npm from eating the
  flag, and the flag still refuses without a path. **An exit that is
  right for the wrong reason ends the search**, which is why this file
  states causes and not just codes.
- **A LOCAL BATTERY AND CI ARE DIFFERENT MEASUREMENTS** — only one of
  them runs somewhere else. `gh run list` after every batch; borrow the
  environment before believing a green (CONVENTIONS). **A CLASS NAMED AND
  A CLASS SWEPT ARE DIFFERENT ACTS.** The five red hours that earned both
  sentences: the 09-01 records.
- **REACH FOR THE CONSTRUCTION, NOT THE CHECK** — lane-protocol rule 4,
  which carries the class in full.
- **A WORKTREE ENTRY MUTATES IN PLACE.** A count cannot see a moved
  board; a path-only set difference cannot either. Compare whole
  `git worktree list` lines, **commit column included**.
- **SUITE CHAINS GO IN GUARDED SCRIPT FILES** (`cd <abs> || exit N`).
  Pipe, docs-gate-path and line-number traps: CONVENTIONS.
- **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203) — ~6 min
  warm, e2e 93% of it; **no cargo means no push, deliberately.** T-216
  fixed the rooting: the guard now roots on EVIDENCE and declares what it
  cannot place. **BUT A HOOK IS ONLY AS CURRENT AS THE CHECKOUT THE
  SESSION STARTED IN** (T-216-s1), and a session started in a stale
  worktree pushes ungated while believing otherwise.
- **CUT THE VERIFIER'S BENCH AT THE BASE REF, AND CUT IT WITH THE LANE**
  — phase 1 needs nothing the executor makes, so blindness becomes a
  fact about the clock rather than a discipline (orchestrator 5c,
  verifier.md, T-213). **Lane context goes in a SECOND message, and an
  AMENDMENT reaches the verifier by PATH, never as your summary of it.**
- **POISON DRILLS: kill-set CONTAINMENT, the site the property lives,
  and a DATA mutant where the property is data** — the rules and their
  measurements now live in method/roles/verifier.md step 2b.
- **A TIMING CORRELATE IS NOT A CAUSE.** Read a suite's own time and
  re-run a body ALONE before attributing. **A merged main can fail
  `npm run build`**: `lib/parser/dist` is a build artifact no merge
  updates — build the parser FIRST.
- **THE FIVE TOOLING TRAPS ARE IN `docs/CONVENTIONS.md`.**
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156), with the spellings the first bullet fixes. **A lane's token
  meter exists ONLY in its notification** — capture it as the lane
  reports, or the record carries a blank forever.
- **NARROWER HAZARDS LIVE IN THE RECORDS**: T-086-s1's 1-in-22 body,
  T-111-s9's token-scan totals, app/'s absent `typecheck`.

## The records

- docs/checkpoints/ — append-only, one per integration; the T-216 record
  is the newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
