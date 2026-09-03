# State

Updated: 2026-09-03 at the form sitting — the newest file in
docs/checkpoints/ is **the form sitting record** (ADR-021: the
architect sits in the agent app; the charter checked in; the rename
measured; four cards filed, none dispatched). **NO LANE IS LIVE
(derive: LANES).** **@human's instruction of 2026-09-02 HOLDS: no new
execution card is dispatched; the seat is on a break.** **CI IS A
SEPARATE CLAIM FROM A LOCAL BATTERY AND MUST BE READ**: `gh run list`
before believing the tree — **main is RED on CI at origin's tip** for
T-239-s4's cause (the arm's fixture commit has no git identity on the
runner), and every push re-runs that red until T-239-s4 lands.

**NOTHING IS BROKEN LOCALLY.** Designed non-zero: `npm run health` **3**
while bands await keepers (T-156-s1/s2) — never read it as clean, never
"fix" it. **AN EXIT MAY MEAN THE GATE NEVER RAN**: `docs-gate.mjs`'s
`CANNOT_RUN: 3` sits in a catch inside `main()`. **READ THE OUTPUT, NOT
THE CODE.** **Re-run a suspect ONCE, then ATTRIBUTE by NAME at the base.**

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
  — a detached entry is NOT a lane. **The dispatch ritual and its order
  are orchestrator 5b/5c's** (T-239 built the arm). Never read the
  ledger's FREE column as a verdict (T-143).
- **STAMP BEFORE YOU CUT; CUT, ARM, THEN CUT THE NEXT; READ EVERY STAMP
  BACK**: a stamp is a no-op on a key the card lacks and a perl pattern
  ending in `\s*$` glues two lines (rooms 13–19). **DERIVE `brief.mjs
  --dispatch` BEFORE THE STAMP** (the fourth record).
- **FENCE BY PATH, AND ASK THE GUARD**: `brief.mjs --write-fence`
  refuses an overlap; remove a merged lane's worktree before arming its
  successor. **A widening is the seat's, both halves** (room 16), and
  **the blind verifier's phase 1 is the earliest reader of the fence**
  (room 23).
- THE HUMAN'S APP: **1420 is CONVENTIONS' PORT RULE**. `../nputer-app` is
  detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT AND SCRATCH FILENAMES ARE CONVENTIONS' RULES** (T-217).
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT after every write. **A regen moves six dogfood
  pins in app/test that no lane can see: run architecture-dogfood and
  map-dogfood-render BEFORE the merge commit** (room 27).
- THE SEAT: `.nputer/holder.json` names the holder (T-238);
  `brief.mjs --take-seat` / `--release-seat`.

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. **NOTHING UNTIL @human LIFTS THE BREAK.** Then, DERIVE IT —
   `brief.mjs --dispatch`. A hand-kept list here named two dead lanes
   and missed two live ones (T-142).
2. **THE FORM IS RULED (ADR-021)**: the architect sits in Claude Code or
   Codex; nputer is a skill, a CLI and a mirror; the interview is one
   interview in two lenses; the cockpit left v1. Its cards: T-241 (the
   seat skill), T-242 (the interview skill), T-243 (the app opens on a
   folder), T-244 (`npx nputer`, **size L — approval first**).
3. **HEAD OF THE QUEUE WHEN IT RESTARTS**: T-239-s4 (p2, takes main off
   red on CI), T-238-s1, T-203-s1, T-120-s2 (ALONE on tools/e2e), then
   the p3 tail in the fourth record. **Order and reasoning: the fourth
   record; the form sitting record adds the four above.**
4. **TRIAGE IS OWED AT THE STAMP** (orchestrator 2): `--dispatch --full`
   is the TRIAGE view (T-225).
5. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <paths>`;
   it does NOT read placement fields or ID SHAPE — the parser's smoke
   test does (T-235): `T-NNN-sN` only, one level.
6. **@human holds; no card is cut from these** — the RENAME
   (rooms/naming.md; measured in the form sitting record), charter
   entry 32's column, the seat's release, the FORM of customization
   (discharged — see version-planning), T-025-s4, T-162-s1, T-131,
   T-229-s3's runner cost, the stray f.txt/g.txt, and
   docs/rooms/loop-efficiency.md (27 items, open, @human's).

## Standing hazards — the section that saves the hour

- **A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT.** `npm run
  boot:check` runs FROM `tools/e2e/`; `npm run health -- --readings
  <FILE>` needs the `--` and the RUNNER'S OWN CAPTURE — in zsh pass the
  flags as an ARRAY, never one string.
- **SPELL THE PUSH BARE: `git -C <checkout> push origin main`**, nothing
  before, nothing after (T-216-s8 landed the refusal; T-216-s9 owes the
  rest). **THE GUARD READS CI (T-237)**: a run in flight refuses a push
  unless `NPUTER_CANCEL_CI=<id>`; a red newest verdict is announced.
- **A LOCAL GREEN IS NOT A RUNNER GREEN**: the runner has no git
  identity and no login; a fixture that commits must set one
  (T-239-s4). Read the run log, attribute by name, file the card.
- **THREE WRITES THAT RED THE TREE AND NO CHEAP GATE SEES**: a test
  rename owes `npm run capabilities` (in the merge commit); any .ts
  moved — a pin fix included — owes the graph regen; a prose commit
  stales the push token. **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN
  LAST** (T-203).
- **ROADMAP'S HEADROOM BAND IS DRIFTING** (640 bytes under its warn line
  at the form sitting, 5 %): a sentence added there owes a cut in the
  same file, records to the records (ADR-019; `docs-gate.mjs` prints
  the line, `npm run health` the band).
- **THE SOLO LOCK COLLIDES BETWEEN A BENCH AND ITS LANE for every
  eight-character card id** until T-202-s1's fix is proven live
  (room 26). **A BENCH OLDER THAN A SIBLING LANE REDS
  session-economics** by ref skew: attribute at the base.
- **A SEAT'S OWN SHELL IS A HAZARD**: `cd` persists, `set -e` does not
  stop a failing heredoc, zsh spells `pipestatus` and aborts a script
  on an unmatched glob (`setopt nullglob`), a grep for "Tests" matches
  the FAILED separator — key every check on an EXIT CODE.
- **A RELAYED FACT IS A CLAIM**: say whose; never relay the attack set.
  **A PHASE-2 DISPATCH WAITS FOR THE EXECUTOR'S REPORT, AND A BENCH
  STANDS UNTIL THE VERIFIER'S** (rooms 21–22).
- **MOVE THE LANE BRANCH TO THE VERDICT COMMIT BEFORE MERGING**
  (room 17) and take the LANE'S card copy on a conflict. **Build app/
  after merging app sources, BEFORE the battery** (room 18).
- **POISON DRILLS**: kill-set containment, the site the property lives,
  a DATA mutant where the property is data (verifier.md 2b).
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156); when the triage band drifts past 9 net arrivals a checkpoint
  is DUE. **A lane's token meter exists ONLY in its notification.**

## The records

- docs/checkpoints/ — append-only; the form sitting record is the
  newest, the four Fable sitting records before it. Pre-compaction:
  2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
