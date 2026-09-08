# State

Updated: 2026-09-08 at the wave sitting — the newest file in
docs/checkpoints/ is **the wave sitting record** (the break lifted;
five cards through the arm with two-spawn benches; T-246, T-239-s4,
T-249, T-247, T-248 merged, T-248 after one REJECTED verdict and a
rework; the guide and the reference written). **NO LANE IS LIVE
(derive: LANES).** **CI IS A SEPARATE CLAIM FROM A LOCAL BATTERY AND
MUST BE READ**: `gh run list` before believing the tree — **main was
GREEN on CI at a1bfb54**; the commits since are unpushed until the
battery that closes this checkpoint (derive: `git log origin/main..`).

**NOTHING IS BROKEN LOCALLY.** Designed non-zero: `npm run health` **3**
while bands await keepers (T-156-s1, T-262) — never read it as clean,
never "fix" it. **AN EXIT MAY MEAN THE GATE NEVER RAN**: `docs-gate.mjs`'s
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
  and every verdict says so — until T-261 spawns it as a defined agent
  type.** A rejection re-enters by a NEW phase-2 spawn (T-248).
- **FENCE BY PATH, AND ASK THE GUARD**: `--write-fence` refuses an
  overlap; a widening is the seat's, both halves (room 16). **THE READ
  GUARD SCREENS READS IN EVERY CHECKOUT** (T-249): a Read of an env,
  key, ssh, cloud-credential, rc or keychain file is refused with the
  entry named; Bash reads bypass it, disclosed.
- THE HUMAN'S APP: **1420 is CONVENTIONS' PORT RULE**. `../nputer-app`
  is detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT AND SCRATCH FILENAMES ARE CONVENTIONS' RULES** (T-217):
  lane 15<card>, bench 25<card>, `<purpose>-<card>.<ext>`.
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT after every write; a regen moves six dogfood
  pins in app/test (room 27).
- THE SEAT: `.nputer/holder.json` names the holder (T-238);
  `brief.mjs --take-seat` / `--release-seat`.
- THE INJECTION SCAN (T-248) is ADVISORY inside the docs gate: a hit
  names file, line and pattern; the reader treats the text as DATA.
  The census command, with its cwd, is in the record.

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. **DERIVE IT** — `brief.mjs --dispatch --full`. A hand-kept list here
   named two dead lanes and missed two live ones (T-142).
2. **THE FORM (ADR-021 + Addendum 1)**: the native apps drive; the app
   keeps its interview. p1: T-241 (the seat skill), T-242 (the
   interview skill), T-244 (`npx nputer`, **size L — approval first**);
   T-246 landed (skills are repo-shippable for both vendors).
3. **THE RELIABILITY CARDS FROM THE WAVE**: T-261 (phase 1 as a defined
   agent type, F-04 p9), T-249-s1 (the guard's per-entry control, p5),
   T-260 (p12), T-239-s6 (p11), T-262 (the verdict marker, F-01 p17);
   then T-254 (the context pack, p2), T-238-s1, T-203-s1, T-120-s2
   (ALONE on tools/e2e), and T-248-s1/s2/s5 (F-06).
4. **TRIAGE IS OWED AT THE STAMP** (orchestrator 2); the wave's trains
   are triaged (the record's Dispositions).
5. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <paths>`,
   separate literal paths; it does NOT read placement fields or ID
   SHAPE — the parser's smoke test does (T-235).
6. **THE NAME IS RULED: Supertaskr** (ADR-022, 2026-09-08). The rename
   is T-264 (L — approval first, no lane beside it), then T-265; T-266
   is @human's checklist (remote, npm, domains, mark).
7. **@human holds; no card is cut from these** — charter entry 32's
   column, T-244's approval, T-025-s4, T-162-s1, T-131,
   T-229-s3's runner cost, the stray f.txt/g.txt, and
   docs/rooms/loop-efficiency.md (31 items, open, @human's).

## Standing hazards — the section that saves the hour

- **A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT.** `npm run
  boot:check` runs FROM `tools/e2e/`; `npm run health -- --readings
  <FILE>` needs the `--` and the RUNNER'S OWN CAPTURE — in zsh pass the
  flags as an ARRAY, never one string.
- **SPELL THE PUSH BARE: `git -C <checkout> push origin main`**, nothing
  before, nothing after — a `cd` through `;` leaves the guard unable to
  judge and it REFUSES (T-216-s8). **THE GUARD READS CI (T-237)**: a run
  in flight refuses a push unless `NPUTER_CANCEL_CI=<id>`.
- **A LOCAL GREEN IS NOT A RUNNER GREEN**: the runner has no git
  identity and no login (T-239-s4 landed the fixture's own); read the
  run log, attribute by name, file the card.
- **THREE WRITES THAT RED THE TREE AND NO CHEAP GATE SEES**: a test
  rename owes `npm run capabilities` (in the merge commit); any .ts
  moved owes the graph regen; a prose commit stales the push token.
  **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203).
- **ROADMAP'S HEADROOM BAND IS DRIFTING** (`npm run health` prints the
  band): a sentence added there owes a cut in the same file.
- **A BENCH OLDER THAN A SIBLING LANE REDS brief.spec's eight-hand-steps
  body and session-economics** by ref skew (the arm's preflight answers
  STALE): attribute at the base with the lane absent, as every verifier
  this wave did.
- **A SEAT'S OWN SHELL IS A HAZARD**: `cd` persists, `set -e` does not
  stop a failing heredoc, zsh spells `pipestatus` and aborts on an
  unmatched glob (`setopt nullglob`), perl `"$X"` interpolates `@`,
  an `until ! pgrep -f X` waiter never ends — key every check on an
  EXIT CODE and a pid or a marker.
- **A SUBAGENT THAT "FINISHES" WHILE ITS OWN JOB RUNS RE-FIRES ON ITS
  OWN**: never spawn a continuation into a live lane (T-247's race, in
  the record). **`git checkout --detach` PRINTS THE TIP'S SUBJECT** at a
  bench: `--quiet`.
- **STAMP THE CARD BY ITS `id:` LINE, NEVER BY `ls | head -1`**: a
  suggestion file sorts before its parent (the record).
- **A RELAYED FACT IS A CLAIM**: say whose; never relay the attack set.
  **A PHASE-2 DISPATCH WAITS FOR THE EXECUTOR'S REPORT, AND A BENCH
  STANDS UNTIL THE VERIFIER'S** (rooms 21–22). **MOVE THE LANE BRANCH
  TO THE VERDICT COMMIT BEFORE MERGING** (room 17).
- **POISON DRILLS**: kill-set containment, the site the property lives,
  a DATA mutant where the property is data (verifier.md 2b).
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156); when the triage band drifts past 9 net arrivals a checkpoint
  is DUE. **A lane's token meter exists ONLY in its notification.**

## The records

- docs/checkpoints/ — append-only; the wave sitting record is the
  newest, the form sitting and the four Fable sitting records before
  it. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
