# State

Updated: 2026-09-02 at the third Fable checkpoint — the newest file in
docs/checkpoints/ is **the third Fable sitting record** (the holder on
disk, the landing gate derives the card, the guard refuses its own
dispatcher); the first two sit beside it. **Lanes are live (derive: LANES)**, all
dispatched from this sitting. **CI IS A SEPARATE CLAIM
FROM A LOCAL BATTERY AND MUST BE READ**: `gh run list` before believing
the tree; one red this sitting was T-018-s2's intermittent and a re-run
read green.

**NOTHING IS BROKEN.** Designed non-zero: `npm run health` **3** while
bands await keepers (T-156-s1/s2) — never read it as clean, never "fix"
it. **AND AN EXIT MAY MEAN THE GATE NEVER RAN**: `docs-gate.mjs`'s
`CANNOT_RUN: 3` sits in a catch inside `main()`. **READ THE OUTPUT, NOT
THE CODE** — a verdict prints gate lines; a crash prints a stack trace,
and an npm ENOENT prints a missing package.json. **Re-run a suspect ONCE,
then ATTRIBUTE.**

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019) — and any LATER edit to
that record re-touches this file in the same commit, or the docs gate
reads STATE as STALE for every path (the third record's follow-up). STATE keeps the
MECHANISM; the INSTANCE is stamped in the record. A figure appears here
only with its derive command. **When the byte band warns, content MOVES
to the record — a hazard is never deleted to fit.** **The commit subject
opens with `Checkpoint:`** (T-182).

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. **The dispatch ritual and its order
  are orchestrator 5b/5c's**, read there, not restated here. Never read
  the ledger's FREE column as a verdict (T-143).
- **THE RITUAL IS SERIAL AND YOU STAMP BEFORE YOU CUT** — CONVENTIONS
  carries both rules. **AND AMEND EVERY CARD OF A WAVE BEFORE THE FIRST
  STAMP**: a lane's base carries its later siblings' cards as they stood,
  so a fence narrowed after the first cut reds session-economics in every
  earlier lane by ref skew (T-143-s1, T-187; the Fable record).
- **FENCE BY PATH, AND ASK THE GUARD**: `brief.mjs --write-fence` refuses
  an overlap and a still-live merged worktree counts — remove a merged
  lane's worktree before arming its successor (rule 6; the Fable record).
- THE HUMAN'S APP: **1420 is CONVENTIONS' PORT RULE**. `../nputer-app` is
  detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT AND SCRATCH FILENAMES ARE CONVENTIONS' RULES**, beside the
  PORT RULE — one family, derived per lane, never defaulted (T-217).
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT, never predict, ask AGAIN after every write.
  Never trust it from inside a drill worktree (T-153-s3).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: **DERIVE IT** — `brief.mjs --dispatch`. A hand-kept list
   here named two dead lanes and missed two live ones (T-142).
2. **SIXTEEN LANDED THIS SITTING** (T-229 v0.1.9, T-225, T-237, T-238
   among them). Next, as fences free: T-120-s2 (the e2e split, ALONE on
   tools/e2e in the first quiet window — the e2e-seconds breach grows
   with every merge), T-239 (the dispatch arm), T-225-s2, T-219-s4,
   T-229-s8. **Order and reasoning: the third Fable record.**
3. **TRIAGE IS OWED AT THE STAMP** (orchestrator 2): `brief.mjs
   --dispatch --full` is the TRIAGE view since T-225; the default
   answers what can START. Derive the count, never quote it.
4. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <separate
   literal paths>`; `lint:docs` is the CENSUS, exit 0 means "I wasn't
   asked". **AND IT DOES NOT READ PLACEMENT FIELDS OR ID SHAPE** — the
   parser's smoke test does (T-235, three instances).
5. **T-126-s2 IS RULED** — join to TypeScript, shape 3 refused on TEST
   REACHABILITY. **NO BLOCKER IS NAMED HERE, EVER**: `blocked_by` IS READ
   FROM THE CARD (T-138).
6. **@human holds; no card is cut from these** — the FORM (reopened),
   the STEERING SPLIT (T-180 parked), T-025-s4's three permission
   questions, T-162-s1's byte floor, T-131, the interview's narrow-width
   ending, and now docs/rooms/loop-efficiency.md (open, @human's).

## Standing hazards — the section that saves the hour

- **A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT OR IT IS HALF A
  SPELLING.** `npm run boot:check` runs FROM `tools/e2e/`; `npm run
  health -- --readings <FILE>` needs BOTH the `--` and a file — and the
  file is the RUNNER'S OWN CAPTURE (`gate-run` prints its path), not the
  verdict log, or two bands read UNREAD.
- **A LOCAL BATTERY AND CI ARE DIFFERENT MEASUREMENTS** — only one runs
  somewhere else. **THE PUSH GUARD NOW READS CI (T-237)**: a push while a
  run is in flight is REFUSED unless `NPUTER_CANCEL_CI=<that run's id>`
  is set; a red newest verdict is ANNOUNCED with the failing step; an
  unreachable `gh` is disclosed and allowed. Read the announcement. **THREE
  WRITES THAT RED THE TREE AND NO CHEAP GATE SEES**: a test rename owes
  `npm run capabilities` (the integrator's, in the merge commit); a
  triage stamp owes the placement fields and a ONE-LEVEL suffix id
  (T-235); a prose commit stales the push token.
- **A SEAT'S OWN SHELL IS A HAZARD**: a `cd` persists across tool calls,
  a `perl -pi` pattern ending in `\s*$` swallows the newline, zsh spells
  the pipe array `pipestatus` — caught by READING THE DIFF BACK (room 12).
- **A RELAYED FACT IS A CLAIM**: say whose. Two covering-message
  sentences this sitting were false (room item 11, the Fable record).
- **A WORKTREE ENTRY MUTATES IN PLACE** — compare whole `git worktree
  list` lines, commit column included.
- **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203), ~7 min
  warm, e2e most of it; **no cargo means no push.** **A HOOK IS ONLY AS
  CURRENT AS THE CHECKOUT THE SESSION STARTED IN**: `brief.mjs
  --preflight`'s sweep names every checkout on this machine — RUN IT
  BEFORE YOU TRUST A PUSH (T-216-s1).
- **ONE HOLDER OF THE INTEGRATION CHECKOUT, RECORDED ON DISK (T-238)**:
  `.nputer/holder.json` — `brief.mjs --take-seat` from that checkout
  (refuses a live other holder, takes over a dead one), `--release-seat`
  when you retire; the arming steps and the push guard read it.
- **THE RITUAL'S MEASURED HAZARDS LIVE IN THE ROOM AND THE RECORDS**
  (docs/rooms/loop-efficiency.md items 13–19, the Fable records): cut,
  ARM, then cut the next; fast path A has two halves, both the seat's;
  a stamp is a no-op on a key the card lacks; attribute a red by NAME
  at the base, never by count.
- **CUT THE VERIFIER'S BENCH WITH THE LANE** (orchestrator 5c); an
  amendment reaches it by PATH. **MOVE THE LANE BRANCH TO THE VERDICT
  COMMIT BEFORE MERGING** (`git branch -f task/<lane> <sha>`), or the
  landing gate cannot derive the card (room item 17).
- **POISON DRILLS**: kill-set containment, the site the property lives,
  a DATA mutant where the property is data — verifier.md step 2b.
- **A TIMING CORRELATE IS NOT A CAUSE.** Re-run a body ALONE before
  attributing; a merged main can fail `npm run build` — build the parser
  FIRST, and build app/ after merging app sources, BEFORE the battery
  (battery 14's stale-dist red).
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156). **A lane's token meter exists ONLY in its notification.**
- **NARROWER HAZARDS LIVE IN THE RECORDS**: T-086-s1's 1-in-22 body,
  T-111-s9's token-scan totals, app/'s absent `typecheck`.

## The records

- docs/checkpoints/ — append-only, one per integration; the second
  Fable sitting record is the newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
