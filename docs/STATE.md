# State

Updated: 2026-08-30 at the T-143-s4 checkpoint — the spec-window red
is fixed at its cause (each in-flight row measured by its own block)
and THE PUSH RESUMES HERE. @human's morning filings: T-164 (launcher,
planned; its `bin` creation target is the census's fourth named
exception), T-165 (the parked F-05 decomposition hook), the
team-enablement room (the authority-inversion question), and the
AI-native-SDLC playbook directive (loop customization + skills
import — room being opened). Current record:
docs/checkpoints/2026-08-30-T-143-s4.md.
Pre-compaction narrative: docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** The one designed non-zero exit a session will
meet: `npm run health` exits 3 while four bands await keepers
(T-156-s1/s2) — never read that 3 as clean, and never "fix" it.

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, after the
record is written — the record keeps the INSTANCE, this file the
MECHANISM (ADR-019). A figure appears here only with its derive
command or a ref stamp. The byte budget is `npm run lint:docs`'s to
enforce; when it warns, content moves to the record or a card — a
hazard is never deleted to fit.

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane — or `brief.mjs --state`. At this
  rewrite: ONE live — `T-163` (verifying; its landing FLIPS five pins
  in three fences it could not reach — land it WITH its complements
  s1/s2/s3 in one checkpoint, never alone). `T-162`, `T-025-s5`
  LANDED. Dispatch
  derives the brief, PREFLIGHTS the card (T-160 — a failed preflight
  refuses the manifest), then writes the fence manifest
  (`brief.mjs --task T-NNN --write-fence <worktree>`); run
  `brief.mjs --task` before ANY dispatch; never read the ledger's
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

1. `T-143-s4` dispatches NEXT (e2e seat, freed by T-162's landing) —
   the push and the CI streak resume only when it merges. Behind it:
   the `T-163` flip-set landing (merge + s1 ARCHITECTURE slug block +
   s2 positive controls + s3 parser fixtures, ONE checkpoint), then
   `T-156-s1`, `T-160-s4`, `T-162-s2`.
2. AFTER the T-163 landing: T-112 is dispatchable per @human's ruling
   (its correction stamp carries the re-derived pairs: ONE standing
   collider). `T-025-s2` is CLOSED; `T-025-s4` carries its gating
   measurement and queues for the next sitting; the milestone-3
   completion ruling is @human's, stated on ROADMAP.
3. `T-140-s1` (promoted, shape RULED) waits on `T-135` (building) —
   the preflight refuses it until then, correctly. `T-154-s2`
   (promoted, `review: independent`) is dispatchable after the e2e
   seat frees. Watch-list on any push: `T-161` (stderr-drain
   intermittent), `T-153-s14` (one PR run answers it).
4. @human's remaining items: D5 (`model@session` per-adapter,
   cockpit-or-mirror room) — unhurried; everything else queued to
   @human was ruled at this sitting.
5. Standing hooks: `T-135` Half B (never re-dispatch whole),
   `T-139-s2` (wants a room), `T-144`, `T-127-s8/s9`, `T-149-s1…s5`,
   `T-143-s1/s2/s3`.

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
  for EVERY tools/e2e script run from the wrong cwd — and the
  persisted-cwd chain defect recurred THREE TIMES at this sitting
  before moving into a guarded script (the record has the story;
  suite chains go in script files now, never pasted).
- **This session's `grep` is a `ugrep` shim carrying `-I`** — use
  `command grep` when it matters; sweep NULs with `perl -0777`.
- **Cut scratch worktrees at SHORT roots** (`T-133-s5`): a 116-char
  root steals the board's standing region at 800×600.
- **Ports are machine-wide** (`T-132-s6`): explicit port, lsof-read
  at zero rows immediately before binding — a probe reserves nothing.
- **The RANGE RULE decides which two commits "the merge's diff"
  means** (CONVENTIONS): integrator's pair and executor's pair are
  different pairs; the pre-merge two-dot form hands your lane main's
  work.
- **Drill in a detached scratch worktree with its OWN
  `CARGO_TARGET_DIR`** (CONVENTIONS, POISON DRILL) (the bullet now names
  `<scratch>/target`, the walk-safe form — T-111-s10). A lane with uncommitted edits
  to a token-scan plant target reds the restoration proof
  (`T-156-s3`).

## The records

- docs/checkpoints/ — append-only, one per integration; no suite may
  depend on the directory, and the gate REDS when a record commits
  newer than this file. Current record: 2026-08-30-rulings-sitting.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Pre-compaction STATE: docs/checkpoints/2026-08-27-backfill-STATE.md;
  every earlier version at `git log -- docs/STATE.md`.
