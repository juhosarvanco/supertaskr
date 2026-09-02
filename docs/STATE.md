# State

Updated: 2026-09-02 at the wave-1 close — the newest file in
docs/checkpoints/ is **the Fable sitting record**; the retired seat's
catcher/sweep record sits beside it. **TWO lanes are live (derive:
LANES)**, both dispatched from this sitting. **CI IS A SEPARATE CLAIM
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
record is written, in the SAME commit (ADR-019). STATE keeps the
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
2. **THE WAVE LANDED**: T-223, T-230, T-216-s4 and T-236 (the CONVENTIONS
   compaction) are done; **every lane can measure its own battery
   again**. Next, as fences free: T-237, T-238, T-239 (the room's
   cards), T-120-s2 (the e2e split), then the held promotions once
   T-225's filter lands. **The order with its reasoning: the Fable
   record's Next section.**
3. **TRIAGE IS OWED AT THE STAMP** (orchestrator 2): the wave filed
   sixteen suggestions and the band drifts — derive the count, never
   quote it.
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
  somewhere else. `gh run list` after every batch; **a push cancels the
  running job**, so read the last run before the next push. **THREE
  WRITES THAT RED THE TREE AND NO CHEAP GATE SEES**: a test rename owes
  `npm run capabilities` (the integrator's, in the merge commit); a
  triage stamp owes the placement fields and a ONE-LEVEL suffix id
  (T-235); a prose commit stales the push token.
- **A SEAT'S OWN SHELL IS A HAZARD**: a `cd` persists across tool calls,
  and a `perl -pi` pattern ending in `\s*$` swallows the newline and glues
  the next frontmatter line on — three instances this sitting, all caught
  by READING THE DIFF BACK before the commit (room item 12).
- **A RELAYED FACT IS A CLAIM**: say whose. Two covering-message
  sentences this sitting were false (room item 11, the Fable record).
- **A WORKTREE ENTRY MUTATES IN PLACE** — compare whole `git worktree
  list` lines, commit column included.
- **EVERY PUSH OWES THE FOUR-SUITE BATTERY, RUN LAST** (T-203), ~7 min
  warm, e2e most of it; **no cargo means no push.** **A HOOK IS ONLY AS
  CURRENT AS THE CHECKOUT THE SESSION STARTED IN**: `brief.mjs
  --preflight`'s sweep names every checkout on this machine — RUN IT
  BEFORE YOU TRUST A PUSH (T-216-s1).
- **ONE HOLDER OF THE INTEGRATION CHECKOUT AT A TIME**, and nothing on
  disk says who: check the harness's session list and `ps` for
  `gate-run` before writing there (T-238, the Fable record).
- **CUT THE VERIFIER'S BENCH WITH THE LANE** (orchestrator 5c) — every
  verdict this sitting was blind by the clock. **An AMENDMENT reaches the
  verifier by PATH, never as your summary.**
- **POISON DRILLS**: kill-set containment, the site the property lives,
  a DATA mutant where the property is data — verifier.md step 2b.
- **A TIMING CORRELATE IS NOT A CAUSE.** Re-run a body ALONE before
  attributing; a merged main can fail `npm run build` — build the parser
  FIRST.
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156). **A lane's token meter exists ONLY in its notification.**
- **NARROWER HAZARDS LIVE IN THE RECORDS**: T-086-s1's 1-in-22 body,
  T-111-s9's token-scan totals, app/'s absent `typecheck`.

## The records

- docs/checkpoints/ — append-only, one per integration; the Fable
  sitting record is the newest. Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
