# State

Updated: 2026-08-30 by the standing-triage-4 seat — the ARCHITECT/
INTEGRATOR SEAT CHANGED HANDS today and this is the incoming seat's
first record: docs/checkpoints/2026-08-30-standing-triage-4.md.
**The suggested column is 0** (14 dispositioned: 10 promoted, 4 parked;
4 cards filed; T-161 corroborated). ZERO LANES.
**GRAPH AT 410 BYTES HEADROOM (1,039,590/1,040,000 by `wc -c`) — AND
THAT NOW BLOCKS THE QUEUE**: eight of the ten promotions reach indexed
source and cannot be dispatched until @human rules T-140-s4. The two
that CAN go are `[tools/e2e]`, outside the walk: T-112-s3 and T-163-s5,
which contend with each other on that one package.
Pre-compaction narrative: docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** The one designed non-zero exit a session will
meet: `npm run health` exits 3 while four bands await keepers
(T-156-s1/s2) — never read that 3 as clean, and never "fix" it. The
DOCS GATE answering exit 1 on a diff is also designed: 1 means it HAS a
verdict (suites owed), not that something is wrong.

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

1. **BLOCKED ON @human, and it is the whole code queue**: `T-140-s4`
   (the graph limit). At 410 bytes any indexed diff can cross the
   budget. Until it is ruled, dispatch only fences outside the walk.
2. DISPATCHABLE TODAY, and they contend on one package: `T-112-s3`
   (row 3 APPLIES the role file's reading step) and `T-163-s5` (two
   live-checkout bodies grade an exit they accept either way). One
   lane at a time — the second refuses at `--write-fence`.
3. FIRST AFTER THE RULING: `T-112-s1` (registration — until it lands
   the drawer's brief block never renders), then the e2e train
   (`T-167-s8` p2, `T-167-s6`, `T-164-s2`+`T-156-s5` as one lane).
4. THE NEXT METHOD RELEASE HAS FIVE RIDERS and is worth cutting as a
   card: `T-112-s2`, `T-154-s3`, `T-159-s6` name it as their
   resurfacing condition; `T-173` and `T-176` owe a bump when they
   land. Watch-list on any push: `T-161` (stderr-drain, TWO CI
   sightings), `T-178` (fixture-teardown ENOTEMPTY, one), `T-018-s2`.
5. @human's open items: `T-140-s4` (blocking), `T-154-s4` (one word),
   milestone-3's closing word, the v1/v2/v3 markup, `T-162-s1`,
   `T-169-s2`, M4, `T-025-s4`'s four routed questions, and `T-112`'s
   closing evidence. D3 and D5 are RULED (rooms/cockpit-or-mirror.md).

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
  2026-08-30-standing-triage-4.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Pre-compaction STATE: docs/checkpoints/2026-08-27-backfill-STATE.md;
  every earlier version at `git log -- docs/STATE.md`.
