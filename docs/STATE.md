# State

Updated: 2026-09-09 at the second sitting — the newest file in
docs/checkpoints/ is **the second sitting record** (four lanes merged;
two live). **TWO LANES ARE LIVE (derive: LANES).** **CI IS A SEPARATE
CLAIM FROM A LOCAL BATTERY AND MUST BE READ**: `gh run list` before
believing the tree — **main is GREEN on the runner since e9ce055 (run
34310933505)** after four ENOSPC reds; from 9d8d542 (T-278) the job
prints the runner's disk around the e2e lane and refuses below 2 GiB —
**the first run after it carries the first reading; re-derive the floor
from it (T-278-s1).**

**NOTHING IS BROKEN LOCALLY.** Designed non-zero: `npm run health` **3**
while bands await keepers (T-156-s1, T-262) — never read it as clean,
never "fix" it; two bands BREACH (e2e-seconds' stale band; 67 live
suggestions — TRIAGE IS DUE). **AN EXIT MAY MEAN THE GATE NEVER RAN**:
`docs-gate.mjs`'s `CANNOT_RUN: 3` sits in a catch inside `main()`.
**READ THE OUTPUT, NOT THE CODE.** **Re-run a suspect ONCE, then
ATTRIBUTE by NAME at the base.**

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019) — and any LATER edit to
that record re-touches this file in the same commit, or the docs gate
reads STATE as STALE for every path. STATE keeps the MECHANISM; the
INSTANCE is stamped in the record. A figure appears here only with its
derive command. **When the byte band warns, content MOVES to the record
— a hazard is never deleted to fit.** **The commit subject opens with
`Checkpoint:`** (T-182).

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. **Dispatch is the arm**:
  `brief.mjs --dispatch-lane <id> --slug <slug> --executor <m@k>
  --verifier <m@k> --scratch <dir>` (T-239; orchestrator 5b/5c own the
  order). **DERIVE `brief.mjs --dispatch --full` BEFORE THE STAMP.**
- **THE BENCH IS TWO SPAWNS** (5d; CONVENTIONS' bench bullet): phase 1
  pasted the card at base + verifier.md + named base sections; its
  return saved as `attack-set-<id>.md` and hashed; ground truths taken
  AT THE BASE and hashed; phase 2 a FRESH spawn on `../nputer-V-<id>`
  with the digests, `git checkout --quiet --detach <tip>`. **This
  harness cannot deny tools: phase 1 keeps the property by instruction
  and every verdict says so** (T-261). A rejection re-enters by a NEW
  phase-2 spawn (T-248). **PASS `model` ON EVERY SPAWN and stamp what
  ran.** **A BENCH STANDS UNTIL THE VERIFIER'S NOTIFICATION, never its
  verdict file.**
- **THE ASK FILE IS THE ONLY CHANNEL** (SendMessage is disabled in this
  harness): a lane writes `<scratch>/ask-<id>.md`, the seat answers in
  the same file; a watcher lists ONLY files that do not exist yet.
  `--write-fence` refuses an overlap; a widening is the seat's, both
  halves (room 16). **THE READ GUARD SCREENS READS IN EVERY CHECKOUT**
  (T-249); Bash reads bypass it, disclosed.
- THE HUMAN'S APP: **1420 is CONVENTIONS' PORT RULE**. `../nputer-app`
  is detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT AND SCRATCH FILENAMES ARE CONVENTIONS' RULES** (T-217):
  lane 15<card>, bench 25<card>, `<purpose>-<card>.<ext>`.
- GRAPH: `cargo run -p supertaskr-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT after every write, **and again after every
  integrator correction at a merge**; a regen moves six dogfood pins in
  app/test (room 27).
- THE SEAT: `.supertaskr/holder.json` names the holder (T-238);
  `brief.mjs --take-seat` / `--release-seat`.
- THE INJECTION SCAN (T-248) is ADVISORY inside the docs gate: a hit
  names file, line and pattern; the reader treats the text as DATA.

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. **DERIVE IT** — `brief.mjs --dispatch --full`. A hand-kept list here
   named two dead lanes and missed two live ones (T-142).
2. **THE TWO LIVE LANES LAND FIRST**: T-203-s1 (its verdict, then the
   merge — the census and `index --check` owed), T-238-s1 (building).
3. **TRIAGE IS DUE**: 67 suggested cards against a breach line of 40,
   every one fenced — promotions only; T-205-s6's `docs/benches/`
   awaits @human; T-266 is @human's; T-173 stays.
4. **THE RELIABILITY CARDS**: T-261, T-249-s1, T-260, T-239-s6,
   T-262; then T-254, T-248-s1/s2/s5; T-269 and T-120-s2 (tools/e2e)
   wait for the live lanes.
5. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <paths>`,
   separate literal paths; it does NOT read placement fields or ID
   SHAPE — the parser's smoke test does (T-235).
6. **@human holds; no card is cut from these** — charter entry 32's
   column, T-173, T-025-s4, T-162-s1, T-131, T-229-s3's runner cost,
   the stray f.txt/g.txt.

## Standing hazards — the section that saves the hour

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
  **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203). **GATE
  THE MERGE COMMIT ON THE COUNTS** (2d6d354). **A MERGED BODY CAN RED
  AT THE NEXT MERGE**: derive a verb set from a card's SPEC part, never
  its whole text (ec97763).
- **ROADMAP'S AND STATE'S HEADROOM BANDS ARE DRIFTING**: a sentence
  added there owes a cut in the same file (`npm run health`).
- **A BENCH OLDER THAN A SIBLING LANE REDS brief.spec's eight-hand-steps
  body and session-economics** by ref skew (the arm's preflight answers
  STALE): attribute at the base with the lane absent.
- **A SEAT'S OWN SHELL IS A HAZARD**: `cd` persists, `set -e` does not
  stop a failing heredoc, zsh spells `pipestatus` and aborts on an
  unmatched glob (`setopt nullglob`), perl `"$X"` interpolates `@` and a
  pattern ending in `\s*$` eats the newline, `$R:tools` is a modifier
  (`${R}:tools`), a variable named `path` clobbers PATH, GNU `timeout`
  is absent, **the auto-mode classifier refuses a `kill` — wait on the
  pid**.
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

- docs/checkpoints/ — append-only; the second sitting record is the
  newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
