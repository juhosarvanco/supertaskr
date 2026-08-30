# State

Updated: 2026-08-31 at standing triage sitting #5 — record:
docs/checkpoints/2026-08-31-standing-triage-5-called-by-a-band.md; the
four lanes' own records are beside it. FOUR LANES LANDED tonight and the
suggested column is 0.
**THE GRAPH HOLD IS OVER**: the graph left the docs collector, the emit
budget is a derived 2,145,959, and headroom went 410 → **1,011,549**
bytes (derive: `index --check`). Every fence is dispatchable again.
Pre-compaction: docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** Designed non-zero exits: `npm run health` exits 3
while bands await keepers (T-156-s1/s2); the DOCS GATE answering 1 on a
diff means it HAS a verdict. **Two intermittents can red a green tree** —
`T-161` (stderr tail) and `T-178` (fixture teardown ENOTEMPTY), two CI
sightings each. Re-run ONCE as a second measurement, then attribute;
never re-run until green and call that evidence.

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019; the gate reds when a
record is newer). A figure appears here only with its derive command or
a ref. **When the byte budget warns, content MOVES to the record — a
hazard is never deleted to fit.** This file BREACHED its band on
2026-08-31 because a seat deferred that twice; the health bands caught
it.

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. Dispatch = derive brief → PREFLIGHT
  the card → `--write-fence <worktree>` → read the manifest back →
  launch. Never read the ledger's FREE column as a verdict (T-143).
- THE HUMAN'S APP: 1420 is read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and NOTHING else — never
  bind-probe, never connect (the vite is on IPv6 loopback; an IPv4 probe
  answers FREE while it runs). `../nputer-app` is detached ON PURPOSE:
  not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- E2E PORT: `NPUTER_E2E_PORT` (default 14520) — `E2E_PORT` binds
  NOTHING. Derive scratch ports FROM THE CARD ID; lsof to zero rows
  immediately before binding.
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT, never predict, ask AGAIN after every write.
  Never trust it from inside a drill worktree (T-153-s3).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: `T-112-s1` and `T-153-s8` (executors). LANDED tonight:
   `T-140-s4`, `T-112-s3`, `T-177`, `T-172`.
   Sitting #5 DONE — the suggested column is 0, called by
   `triage/net-arrivals-per-window` at DRIFT rather than by a cadence.
2. THEN, no blocker left: `T-178`, `T-171`, `T-162-s1` (byte floor — its `DOC_BUDGETS` half is
   OUTSIDE its fence; decide at dispatch), `T-174`, `T-112-s4`,
   `T-167-s9`, `T-143-s6`, `T-163-s5`, `T-179`, `T-181`.
3. STANDING REDS worth a lane: `T-161`, `T-178`, `T-167-s8` (the
   pre-push graph guard — four local strikes, one CI confirmation).
4. THE NEXT METHOD RELEASE has five riders and wants a carrier card:
   `T-112-s2`, `T-154-s3`, `T-159-s6`; `T-173` and `T-176` owe a bump;
   `T-154-s4`'s sentence joins them.
5. @human holds, and NOTHING is cut from these: the **FORM**, REOPENED
   2026-08-31 (rooms/customization-form.md — the ruled asymmetric answer
   leaves every authoring act a file edit, and @human wants
   customization without opening files; Q2 moves with it, Q3–Q9 do
   not); the **STEERING SPLIT** (rooms/steering-split.md; `T-180`
   parked on it); and T-025-s4's three remaining permission questions,
   which want a watched genesis run rather than an opinion.
6. **D5 IS RULED BUT NOT ENFORCED** — nothing passes `--model`, so an
   assignment is honoured only by the session that dispatches. Set it
   deliberately on every spawn.

## Standing hazards — the section that saves the hour

- **The cargo cache cliff** (`T-088-s4`):
  `startup_arm_watches_the_initial_root` reds when `target/` is large or
  lanes contend. READ THE LIB SUITE'S OWN TIME FIRST — green under 9.5s,
  red over 14.6s. Re-run the body ALONE before attributing it; no
  reflexive `cargo clean`, lanes may be building. Fired 2026-08-31 at
  16.21s and passed alone in 1.27s.
- **`a_hostile_session_id…` is live at ~1-in-22** (`T-086-s1`): run it
  alone before blaming a diff.
- **Read the assertion, not the body's name** (`T-111-s9`): token-scan's
  totals red for any control byte anywhere, under an unrelated title.
- **A merged main can fail `npm run build`**: `lib/parser/dist` is a
  build artifact no merge updates — build the parser FIRST. An unbuilt
  app tree fails `npm test` about `app/dist`.
- **`npm run typecheck` from app/ DOES NOT EXIST** — the app's typecheck
  is the two `tsc` calls inside `npm run build` (T-073).
- **Suite chains go in GUARDED SCRIPT FILES** (`cd <abs> || exit N`);
  read every gate exit UNPIPED, never through a pipe.
- **THE ONE SPELLING IS ONE SPELLING**: the DOCS GATE's printed recipe
  uses an unquoted COMMAND SUBSTITUTION, which zsh splits. Route it
  through a variable and zsh does NOT split it — the gate takes all
  paths as ONE and answers "1 path(s)": plausible, wrong. Type the
  printed spelling or build a real array.
- **This shell's `grep` is a shim** carrying `-I` and rejecting
  `--include` — use `command grep`; sweep NULs with `perl -0777`.
- **An edit script's success is a GATE, not a step** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back first. Broken
  twice in 24h, once by the seat that had just written the rule down.
- **Cut scratch worktrees at SHORT roots** (`T-133-s5`), detached, with
  their own `CARGO_TARGET_DIR` at `<scratch>/target` and a stem DERIVED
  from the card id — the scratch directory is shared between sessions.
- **Ports are machine-wide** (`T-132-s6`): explicit, lsof-read at zero
  rows immediately before binding; a probe reserves nothing.
- **The RANGE RULE decides which two commits "the merge's diff" means**
  (CONVENTIONS): the integrator's pair and the executor's pair differ.
- **After merging a lane, REMOVE ITS WORKTREE BEFORE the verdict
  corrections** — guard limit 6: git drops its mid-merge marker at the
  merge commit while the worktree keeps the fence.
- **A PUSH CANCELS THE RUNNING CI JOB.** Four runs were superseded on
  2026-08-30 by this seat's own rapid pushes, leaving main's tip
  unverified for hours. Batch pushes; watch one run at a time.
- **THE BOOT GATE AND THE HEALTH BANDS ARE OWED AT EVERY CHECKPOINT**
  (T-046, T-156) and were skipped across four records on 2026-08-30.
  The health run found this file's own breached band. **FEED IT
  `--readings`** over the captured `cargo test`, `index --check` and
  e2e output, or three bands answer UNREAD and the run is not a claim
  about the tree.

## The records

- docs/checkpoints/ — append-only, one per integration. Current:
  2026-08-31-standing-triage-5-called-by-a-band.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
