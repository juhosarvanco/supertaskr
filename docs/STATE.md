# State

Updated: 2026-09-01 at the T-210 close — **"the 09-01 record"** is the
newest file in docs/checkpoints/; two more from the same day sit beside
it. **NO task branches remain** (derive: LANES), nothing is outstanding,
and **CI IS GREEN** — which is a separate claim from a local battery and
was FALSE for five hours while four batteries said otherwise.

**NOTHING IS BROKEN.** Designed non-zero: `npm run health` **3** while
bands await keepers (T-156-s1/s2) — never read it as clean, never "fix"
it. **AND AN EXIT 1 MAY MEAN THE GATE COULD NOT RUN**: `docs-gate.mjs`'s
`CANNOT_RUN: 3` sits in a catch inside `main()`. **READ THE OUTPUT, NOT
THE CODE** — a verdict prints gate lines, a crash prints a stack trace.
Four instances, two an invented path: the boot gate is `npm run
boot:check`; `boot-gate.mjs` does not exist. **Re-run a suspect ONCE,
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
  — a detached entry is NOT a lane. Dispatch = brief → PREFLIGHT →
  `--write-fence` → read the manifest back → launch. Never read the
  ledger's FREE column as a verdict (T-143).
- **THE RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE MANIFEST
  BACK, then cut the next.** T-209's guard refuses a dispatch against a
  lane whose fence it cannot read — *an unread fence is not "disjoint
  from everything"* — and refused four at once when this seat cut all
  four first.
- **DISJOINTNESS IS OVER EXPANDED PATH SETS, NEVER TOKENS** (rule 5,
  carrying its measurement: six lanes, every block a naming collision,
  not one real collision). **T-209 COMPUTES IT** — ask the guard, never
  assert it. `touches:` is a permission declaration, never an oracle.
- THE HUMAN'S APP: 1420 is read with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
  and NOTHING else — never bind-probe, never connect (the vite is on
  IPv6 loopback, so an IPv4 probe answers FREE while it runs).
  `../nputer-app` is detached ON PURPOSE: not a lane.
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
2. **THE STACK IS COMPLETE**: WRITE (T-199), DISPATCH (T-209), LANDING
   (T-212), PUSH (T-203) all refuse; fast paths are law (T-211); the
   PHYSICAL layer (T-210) catches the shell writes a hook cannot see.
   Next: **T-216**, then T-222/T-223/T-224. **T-229 and T-230 pay for
   themselves** — one prevents a rejection class, one a dispatch class.
3. **T-221 BEFORE ANY CARD TOUCHES `sharedDomain`** — one unpinned `/`
   decides whether `tools/e2e` contains `tools/e2e-helpers`, three gates
   rest on it, and dropping it reds nothing.
4. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <separate
   literal paths>`; `lint:docs` is the CENSUS, exit 0 means "I wasn't
   asked".
5. **T-126-s2 IS RULED** — join to TypeScript, shape 3 refused on TEST
   REACHABILITY. **NO BLOCKER IS NAMED HERE**: this line said T-190 long
   after T-190 closed while the card said T-198. **`blocked_by` IS READ
   FROM THE CARD** — T-138's whole lesson, re-earned.
6. **TRIAGE PART DONE, THE REST BLOCKED BY BYTES** (T-225): three cards
   carry a recorded PROMOTE that cannot be applied. Counts derived, not
   quoted. Riders: T-112-s2, T-154-s3, T-159-s6, T-154-s4's sentence;
   T-173/T-176 owe a bump. **D5 ruled, NOT enforced** (no `--model`).
7. **@human holds; no card is cut from these** — the FORM (reopened),
   the STEERING SPLIT (T-180 parked), T-025-s4's three permission
   questions, T-162-s1's byte floor, T-131, and @human's eye on the
   interview's narrow-width ending (jsdom applies no breakpoints, so no
   suite here can answer it).

## Standing hazards — the section that saves the hour

- **A LOCAL BATTERY AND CI ARE DIFFERENT MEASUREMENTS**: main was RED
  five hours while four batteries said GREEN, twice, from fixtures
  inheriting MACHINE git config. `gh run list` after every batch; borrow
  the environment before believing a green (CONVENTIONS). **A CLASS
  NAMED AND A CLASS SWEPT ARE DIFFERENT ACTS** — the second red was the
  first one's sibling, left standing after a correct diagnosis.
- **REACH FOR THE CONSTRUCTION, NOT THE CHECK** — lane-protocol rule 4,
  which carries the class in full. It bit FIVE times in one sitting,
  every seat having read the rule first.
- **A WORKTREE ENTRY MUTATES IN PLACE.** A count cannot see a moved
  board; a path-only set difference cannot either. Compare whole
  `git worktree list` lines, **commit column included**.
- **SUITE CHAINS GO IN GUARDED SCRIPT FILES** (`cd <abs> || exit N`).
  Pipe, docs-gate-path and line-number traps: CONVENTIONS.
- **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203) — ~6 min
  warm, e2e 93% of it; **no cargo means no push, deliberately.** The
  refusal names and the reasoning: CONVENTIONS. T-216 fixes the rooting
  — the guard roots on the WRITER's cwd while the hook loads from the
  DISPATCHING checkout, so a lane never arms its own fix.
- **CUT THE VERIFIER'S BENCH AT THE BASE REF, AND CUT IT WITH THE LANE**
  — phase 1 needs nothing the executor makes, so blindness becomes a
  fact about the clock rather than a discipline (orchestrator 5c,
  verifier.md, T-213). **Lane context goes in a SECOND message.**
- **POISON DRILLS: kill-set CONTAINMENT, the site the property lives,
  and a DATA mutant where the property is data** — the rules and their
  measurements now live in method/roles/verifier.md step 2b.
- **A TIMING CORRELATE IS NOT A CAUSE.** Read a suite's own time and
  re-run a body ALONE before attributing. **A merged main can fail
  `npm run build`**: `lib/parser/dist` is a build artifact no merge
  updates — build the parser FIRST.
- **THE FIVE TOOLING TRAPS ARE IN `docs/CONVENTIONS.md`** — moved there
  2026-09-01 on T-146's rule: **a MECHANISM lives in a governing
  document, a record takes the INSTANCE**, and STATE is byte-capped.
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156). Health takes **`--readings`**, and the **`--` is load-bearing**
  or npm eats the flag (exit 2). **A lane's token meter exists ONLY in
  its notification** — capture it as the lane reports.
- **NARROWER HAZARDS LIVE IN THE RECORDS**: T-086-s1's 1-in-22 body,
  T-111-s9's token-scan totals, app/'s absent `typecheck`.

## The records

- docs/checkpoints/ — append-only, one per integration; the 09-01 record
  is the newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
