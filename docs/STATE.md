# State

Updated: 2026-08-30 at the second RULINGS SITTING — record:
docs/checkpoints/2026-08-30-the-rulings-sitting-2-eight-answers.md.
**@human cleared EIGHT open items in one pass** — the record has them.
**TWO LANES LIVE** — derive them, never quote this line. **The graph is
still at 410 bytes** (1,039,590 by `wc -c`): the code queue is held
until `T-140-s4` MERGES, because the ruling released the card and not
the constraint. Pre-compaction:
docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** Designed non-zero exits a session will meet:
`npm run health` exits 3 while four bands await keepers (T-156-s1/s2),
and the DOCS GATE answering 1 on a diff means it HAS a verdict (suites
owed) — never read either as a fault. **Two intermittents can red a
green tree**: `T-161` (stderr tail, two CI sightings) and `T-178`
(fixture teardown ENOTEMPTY, two sightings, one of them main's own tip).
Re-run once as a second measurement, then attribute — never re-run until
green and call it evidence.

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, after the
record is written — the record keeps the INSTANCE, this file the
MECHANISM (ADR-019). A figure appears here only with its derive
command or a ref stamp. The byte budget is `npm run lint:docs`'s to
enforce; when it warns, content moves to the record or a card — a
hazard is never deleted to fit. **Never commit a record without
regenerating this file in the SAME commit** — the gate reds when a
record's commit is newer, and it caught the previous seat doing it.

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane — or `brief.mjs --state`. At this
  rewrite: NO lanes. Dispatch derives the brief, PREFLIGHTS the card
  (T-160 — a failed preflight refuses the manifest), then writes the
  fence manifest (`brief.mjs --task T-NNN --write-fence <worktree>`);
  run `brief.mjs --task` before ANY dispatch; never read the ledger's
  FREE column as a verdict (the `--state` join misreads suffixed
  branch slugs — T-143's card).
- THE HUMAN'S APP: port 1420 is read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else — never
  bind-probe, never connect (the vite listens on IPv6 loopback; an
  IPv4-only probe answers FREE while the app runs). `../nputer-app`
  is detached ON PURPOSE (@human 2026-08-25): not a lane.
- BOARD CENSUS: `brief.mjs --state` prints it per status; the
  parser's field is `blockedBy`, NOT `blocked_by`. The suggested
  column holds only post-amnesty arrivals — they queue for T-159's
  rules, never a second amnesty.
- E2E PORT: the variable is `NPUTER_E2E_PORT` (preflight.ts) — an
  `E2E_PORT` export binds NOTHING and the suite silently uses its
  default. lsof the port to zero rows first.
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..`
  from app/src-tauri/ — ASK IT, never predict, ask AGAIN after every
  write. Never regen or trust CURRENT from inside a drill worktree
  (T-153-s3: a non-`target` target dir is inside the walk).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: `T-112-s3` (row 3 APPLIES the role file's reading step)
   and `T-140-s4` (graph leaves the collector, budget rises, banner
   retired). **`T-140-s4`'s MERGE is what ends the 410-byte hold** —
   until then only fences outside the graph walk may merge.
2. THE HOLD, stated once: eight of sitting #4's ten promotions reach
   indexed source. `tools/e2e` and `docs/**` are outside the walk and
   are the only safely mergeable fences meanwhile.
3. NEXT IN `tools/e2e` once `T-112-s3` clears: **`T-178`** — two reds
   in one evening, both on other seats' work — then `T-163-s5`,
   `T-179`, `T-167-s8` p2, `T-167-s6`, `T-164-s2`+`T-156-s5` as one
   lane.
4. AFTER THE GRAPH LANDS: `T-112-s1` (registration — until it lands the
   drawer's brief block never renders), then `T-162-s1` (implement the
   byte floor; its `DOC_BUDGETS` half is OUTSIDE its fence — decide at
   dispatch, not inside the lane), then the walk's cards
   (`T-171`/`T-172`/`T-173`/`T-176`/`T-177`).
5. THE NEXT METHOD RELEASE HAS FIVE RIDERS and is worth cutting as a
   card: `T-112-s2`, `T-154-s3`, `T-159-s6` park on it; `T-173` and
   `T-176` owe a bump when they land; `T-154-s4`'s sentence joins them.
6. @human holds: the **STEERING SPLIT** (rooms/steering-split.md — how
   much is steered from nputer vs from Claude/Codex, per concern;
   `T-180` is PARKED on its resolution and is NOT startable).
   the **FORM**, REOPENED by @human 2026-08-31 (rooms/customization-form.md):
   Q1's asymmetric answer leaves every authoring act a file edit, and
   @human wants customization without opening files. Q2 moves with it;
   Q3-Q9 do not. NOTHING is cut from it until @human returns.
   **D5 IS RULED BUT NOT
   ENFORCED**: nothing passes `--model`, so an assignment is honoured
   only by the session that dispatches — set it deliberately.

## Standing hazards — the section that saves the hour

- **The cargo cache cliff** (`T-088-s4`): `startup_arm_watches_the_initial_root`
  reds when `app/src-tauri/target/` is large. Read the lib suite's
  own time FIRST — green under 9.5s, red over 14.6s, never between.
  No reflexive `cargo clean`; lanes may be building — `lsof` first.
- **`a_hostile_session_id…` is live at ~1-in-22 clean-cache**
  (`T-086-s1`): run it alone before attributing anything to a diff.
- **Read the assertion, not the body's name** (`T-111-s9`):
  token-scan's whole-corpus totals red for any control character
  anywhere in the tracked corpus, under an unrelated title.
- **A merged main can fail `npm run build`**: `lib/parser/dist` is a
  build artifact no merge updates — `npm run build` from lib/parser/
  FIRST. An UNBUILT app tree fails `npm test` about `app/dist`.
- **`npm run typecheck` from app/ DOES NOT EXIST** — exit 1 `Missing
  script` reads like a type error; the app's typecheck is the two
  `tsc` calls inside `npm run build` (T-073). The same trap holds
  for EVERY tools/e2e script run from the wrong cwd — suite chains go
  in guarded script files with `cd || exit N`, never pasted.
- **THE ONE SPELLING IS ONE SPELLING BECAUSE EVERY VARIANT BREAKS
  DIFFERENTLY** — and this shell adds a variant CONVENTIONS does not
  name. The DOCS GATE's printed recipe passes an unquoted COMMAND
  SUBSTITUTION, which zsh word-splits correctly. Route it through a
  variable instead (`P=$(…)`, then `docs-gate.mjs $P`) and **zsh does
  NOT split unquoted parameter expansions**: the gate takes the whole
  list as ONE path and answers "1 path(s)" — plausible, wrong, exit 1
  either way. Measured at sitting #4 on its own diff (19 paths). Type
  the printed spelling, or build a real array.
- **This session's `grep` is a `ugrep` shim carrying `-I`** — use
  `command grep` when it matters; sweep NULs with `perl -0777`.
- **An edit script's success is a GATE, not a step** (`18d8166`): never
  chain `commit` after a scripted edit — read the diff first, or let
  the script's own non-zero exit stop the chain.
- **Cut scratch worktrees at SHORT roots** (`T-133-s5`): a 116-char
  root steals the board's standing region at 800×600.
- **Ports are machine-wide** (`T-132-s6`): explicit port, lsof-read
  at zero rows immediately before binding — a probe reserves nothing.
- **The RANGE RULE decides which two commits "the merge's diff"
  means** (CONVENTIONS): integrator's pair and executor's pair are
  different pairs; the pre-merge two-dot form hands your lane main's
  work.
- **Drill in a detached scratch worktree with its OWN
  `CARGO_TARGET_DIR`** (CONVENTIONS, POISON DRILL) at `<scratch>/target`,
  the walk-safe form (T-111-s10). A lane with uncommitted edits to a
  token-scan plant target reds the restoration proof (`T-156-s3`).
- **After merging a lane, REMOVE ITS WORKTREE BEFORE the verdict
  corrections** — the lane-fence guard's limit 6: git drops its
  mid-merge marker at the merge commit while the worktree keeps the
  fence, so corrections into it are refused for that window.

## The records

- docs/checkpoints/ — append-only, one per integration; no suite may
  depend on the directory, and the gate REDS when a record commits
  newer than this file. Current record:
  2026-08-30-the-rulings-sitting-2-eight-answers.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Pre-compaction STATE: docs/checkpoints/2026-08-27-backfill-STATE.md;
  every earlier version at `git log -- docs/STATE.md`.
