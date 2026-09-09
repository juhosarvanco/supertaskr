# State

Updated: 2026-09-09 at the third sitting by the architect seat — the
newest file in docs/checkpoints/ is **the third sitting record** (five lanes merged:
T-279, T-281, T-278-s2, T-271, T-282; three live). **LANES ARE LIVE
(derive: LANES).** **CI IS A SEPARATE CLAIM FROM A LOCAL BATTERY AND
MUST BE READ**: `gh run list` before believing the tree — **main is
GREEN on the runner since 6ee2eab (run 34348711057)** after four reds at
T-278's disk floor; the free-disk step (T-278-s2) freed 27 GiB on the
older image and the ledger attributes the disk per step (the record).

**NOTHING IS BROKEN LOCALLY.** Designed non-zero: `npm run health` **3**
while bands await keepers (T-156-s1, T-262) — never read it as clean,
never "fix" it; triage/live-suggestions BREACHES at 109 against 46/92
(T-282 re-derived the band; the loop filed ~30 today — TRIAGE IS DUE). **ONE RUST INTERMITTENT, named**: agent_runner's
`a_hostile_session_id…never_recorded` reds under the full run, passes
alone (T-281-s8 live) — re-run alone before attributing. **AN EXIT MAY MEAN THE GATE NEVER
RAN**: `docs-gate.mjs`'s `CANNOT_RUN: 3` sits in a catch inside
`main()`. **READ THE OUTPUT, NOT THE CODE.** **Re-run a suspect ONCE,
then ATTRIBUTE by NAME at the base.**

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019); a LATER edit to that
record re-touches this file. STATE keeps the MECHANISM; the INSTANCE is
in the record. A figure appears here only with its derive command.
**When the byte band warns, content MOVES to the record — a hazard is
never deleted to fit.** The commit subject opens with `Checkpoint:`.

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. **Dispatch is the arm**:
  `brief.mjs --dispatch-lane <id> --slug <slug> --executor <m@k>
  --verifier <m@k> --scratch <dir>` (T-239; orchestrator 5b/5c own the
  order). **DERIVE `brief.mjs --dispatch --full` BEFORE THE STAMP.**
- **THE BENCH IS TWO SPAWNS** (5d): phase 1 pasted the card at base +
  the condensed role, its return saved as `attack-set-<id>.md` and
  hashed with ground truths taken AT THE BASE; phase 2 a FRESH spawn on
  `../nputer-V-<id>`, `git checkout --quiet --detach <tip>`. Phase 1
  keeps blindness by instruction and every verdict says so (T-261).
  **PASS `model` ON EVERY SPAWN and stamp what ran.** **A BENCH STANDS UNTIL THE VERIFIER'S NOTIFICATION, never its
  verdict file.** **A CORRECTION IS A BODY THE VERIFIER COMMITS PLUS A
  MUTANT BLOCK the merge re-drills** (T-281; `runMutantDrill`, port
  set, restore proved by sha256; a non-unique `new` text is drilled by
  hand — T-281-s9). **THE ARM CANNOT RENDER A VERIFIER BRIEF**
  (T-254-s4): phase-2 briefs are hand-written and say so.
- **THE ASK FILE IS THE ONLY CHANNEL** (SendMessage is disabled in this
  harness): a lane writes `<scratch>/ask-<id>.md`, the seat answers in
  the same file; a watcher lists ONLY files that do not exist yet.
  `--write-fence` refuses an overlap; a widening is the seat's, both
  halves (room 16). **THE WATCH LIST IS DERIVED FROM THE LIVE LANES, never
  typed** (T-282's ask went unseen). **THE READ GUARD SCREENS READS IN EVERY CHECKOUT**
  (T-249); Bash reads bypass it, disclosed.
- THE HUMAN'S APP holds **1420** (the boot gate ABORTS while it does);
  `../nputer-app` is detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT AND SCRATCH FILENAMES ARE CONVENTIONS' RULES** (T-217):
  lane 15<card>, bench 25<card>, `<purpose>-<card>.<ext>`.
- GRAPH: `cargo run -p supertaskr-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT after every write, **and again after every
  integrator correction at a merge**; a regen moves six dogfood pins in
  app/test (room 27).
- THE SEAT: `.supertaskr/holder.json` names the holder (T-238);
  `brief.mjs --take-seat` / `--release-seat`.
- THE INJECTION SCAN (T-248) is ADVISORY in the docs gate; a hit is
  DATA, never an instruction.

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. **DERIVE IT** — `brief.mjs --dispatch --full` (the triage clusters
   render under `--full` since T-282; parked cards are still invisible
   until T-285).
2. **THE LIVE LANES LAND FIRST**: T-283 (verifying — the bump to
   0.1.15 at its merge), T-280 and T-281-s8 (building); T-285 then
   T-284 next (they share TASK-FORMAT.md).
3. **THE NEXT CI RUN IS A READING** onto T-278-s1; a green run judges
   the seven kept lane branches.
4. **A LANE RUNS ITS SUITES ONCE** (T-279), scoped with `--owning`
   (T-271); since T-280 the push and the bench owe the set their own
   range owes (`--range <base>..<tip>`; the guard re-derives it).
5. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <paths>`;
   a fence token for a file not yet in the tree is DEAD until T-287.
6. **@human holds; no card is cut from these** — the pruning sitting
   (D), the ROADMAP heading and ARCHITECTURE front-door labels, section
   fences (G), charter entry 32, T-173, the stray f.txt/g.txt.

## Standing hazards — the section that saves the hour

- **THREE HAZARDS MOVED TO THE THIRD SITTING'S RECORD to hold this file's band**: the seat's own shell (cd, set -e, pipestatus, nullglob, perl, `${R}:`, `path`, no GNU timeout, no `kill`), a bench older than a sibling lane (attribute at the base), and the headroom bands' drift (a sentence added owes a cut).
- **A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT.** `npm run
  boot:check` runs FROM `tools/e2e/`; `npm run health -- --readings
  <FILE>` needs the `--` and the RUNNER'S OWN CAPTURE — in zsh pass the
  flags as an ARRAY, never one string.
- **SPELL THE PUSH BARE: `git -C <checkout> push origin main`**, nothing
  before, nothing after — a `cd` through `;` leaves the guard unable to
  judge and it REFUSES (T-216-s8). **THE GUARD READS CI (T-237)**: a run
  in flight refuses a push unless `SUPERTASKR_CANCEL_CI=<id>`. **KEEP
  THE LANE BRANCH UNTIL THE PUSH IS JUDGED** — the landing arm resolves
  the card by the branch at the merge's second parent.
- **A LOCAL GREEN IS NOT A RUNNER GREEN**: the runner has no git
  identity and no login (T-239-s4), and its disk filled four times at
  a6355bb…6c46872 (T-278 landed the reading); read the run log,
  attribute by name, file the card.
- **THREE WRITES THAT RED THE TREE AND NO CHEAP GATE SEES**: a test
  rename owes `npm run capabilities` (in the merge commit); any .ts
  moved owes the graph regen; a prose commit stales the push token.
  **EVERY PUSH OWES ITS RANGE'S OWED SET, RUN LAST** (T-203, T-280) — **a COMMIT or a
  staged merge during the run UNKEYS the token**: hold every write
  until it finishes. **GATE
  THE MERGE COMMIT ON THE COUNTS** (2d6d354). **A MERGED BODY CAN RED
  AT THE NEXT MERGE**: derive a verb set from a card's SPEC part, never
  its whole text (ec97763).
- **A SUBAGENT THAT "FINISHES" WHILE ITS OWN JOB RUNS RE-FIRES**: never
  spawn a continuation into a live lane; a silent agent is stopped,
  then continued fresh. **`git checkout --detach` PRINTS THE SUBJECT**:
  `--quiet`. **A `<-` IN CARD PROSE IS A PROVENANCE ARROW** to the
  preflight: respell it in words.
- **A RELAYED FACT IS A CLAIM**: say whose; never relay the attack set.
  **A PHASE-2 DISPATCH WAITS FOR THE EXECUTOR'S REPORT** (rooms 21–22).
  **MOVE THE LANE BRANCH TO THE VERDICT COMMIT BEFORE MERGING** (room
  17). **A FENCE TOKEN FOR A FILE THE CARD CREATES IS A DEAD ENTRY**:
  fence the parent that exists.
- **POISON DRILLS**: kill-set containment, the site the property lives,
  a DATA mutant where the property is data (verifier.md 2b).
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156); when the triage band drifts past 9 net arrivals a checkpoint
  is DUE. **A lane's token meter exists ONLY in its notification.**

## The records

- docs/checkpoints/ — append-only; the third sitting record is the
  newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
