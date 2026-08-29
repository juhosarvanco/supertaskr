# State

Updated: 2026-08-29 at the T-153 checkpoint. Current record:
docs/checkpoints/2026-08-29-T-153.md. The pre-compaction narrative
remains verbatim in docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN. ONE COMMAND ON MAIN EXITS 1 ON PURPOSE:**
`cargo run -p nputer-index -- arch cycles --root ../..` is exit 1 by
design — the declared cycle `C-08 -> C-09 -> C-08` stands until
`T-127-s1` lands; the ENFORCING copy is `cargo test`, which is green.
Its report is on stderr: `arch cycles > out.txt` on a red yields an
empty file.

## The contract this file is under

This file is REPLACED at every checkpoint from docs/STATE-template.md,
after the checkpoint's record is written to docs/checkpoints/ — the
record keeps the INSTANCE, this file keeps the MECHANISM
(docs/rooms/governing-docs.md, ADR-019). A figure appears here only
with its derive command or a ref stamp: derive at your own ref, never
quote this page. The byte budget is `npm run lint:docs`'s to enforce;
when it warns, content moves to the record or a card — a hazard is
never deleted to fit.

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane — or `node tools/e2e/scripts/brief.mjs
  --state`, which stamps the reading. Read at this rewrite: ONE
  `task/` lane live — T-154, verdict pending — plus the triage
  worktree on its own branch (2026-08-29, T-153 checkpoint). Before
  ANY dispatch run
  `brief.mjs --task T-NNN`; never read the ledger's FREE column as a
  verdict — it is keyed by slug and two slugs can name one component.
- THE HUMAN'S APP: port 1420 is read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else — never
  bind-probe, never connect (CONVENTIONS, PORT RULE; the vite listens
  on IPv6 loopback, so an IPv4-only probe answers FREE while the app
  runs). Its checkout `../nputer-app` is detached ON PURPOSE (@human's
  ruling 2026-08-25): not a lane, never removed after a merge.
- BOARD CENSUS: derived from flat `docs/tasks/T-*.md` frontmatter —
  `brief.mjs --state` prints it per status. The parser's field is
  `blockedBy`, NOT `blocked_by`: a census against the frontmatter
  spelling returns zero and reads clean.
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..`
  from app/src-tauri/ — ASK IT, never predict, and ask AGAIN after
  every write; it prints the headroom beside the size. A byte count is
  not a content check.

## Next up — hooks only; statuses are the board's

Order re-ruled 2026-08-29 at the pre-dispatch review; derive each
card's status and fence with `brief.mjs --task` at dispatch, never
from this list.

1. `T-153` is DONE and merged (198/0 on ubuntu ×4 runs). The
   push-hold now stands behind `T-153-s2` alone — the E2BIG argv
   fixture, C-14's fence, dispatched next — and lifts when it lands:
   main pushes, CI runs green end to end, draft PR #1 closes.
2. `T-154` — the fence hook, THROUGH THE PIPELINE with an
   independent verifier: the builder of the cage is not its
   inspector. Mechanism redesigned pre-dispatch (dispatch-time
   manifest; the card carries it).
3. `T-155` method evals → `T-156` health bands (now also keeper of
   NORTH_STAR's own never-derived indicators) → `T-157` session
   economics. `T-158` is DONE and merged — the front door exists,
   with its rejection arc on the card.
4. `T-159` — method v0.1.8, the metabolism release: ONE bump owning
   all method text (fence property, session hygiene, revert play,
   guard-class independence, suggestion metabolism, retirement
   conditions, the trust sentence, review reconciliation).
   `blocked_by: [T-154]`.
5. THE AMNESTY TRIAGE — one architect sitting over the ~140
   suggested cards (derive the count), before the metabolism rules
   take over arrivals.
6. @human's own items: `T-025-s2` (one real, timed genesis — the
   product's first credibility act), `T-151` (the budget number),
   and the standing D3 ruling (may the app write into docs/?).
7. Standing board hooks, unchanged: `T-135` Half B (owns ADR-018;
   never re-dispatch whole), `T-138-s3`, `T-112` (most colliding —
   derive the flip pairs), `T-140` (the file-ceiling gate the bar
   names), `T-139-s2` (wants a room), `T-149-s1…s5`, `T-092-s4`
   (the drill's vacuous restoration proof), `T-150`'s trains.

## Standing hazards — the section that saves the hour

- **The cargo cache cliff** (`T-088-s4`): `startup_arm_watches_the_initial_root`
  reds when `app/src-tauri/target/` is large and ~never when small.
  Read the lib suite's own time FIRST — every green under 9.5s, every
  red over 14.6s, nothing ever between. Do not `cargo clean`
  reflexively; lanes may be building against this checkout — `lsof`
  first.
- **`a_hostile_session_id…` is live at ~1-in-22 clean-cache**
  (`T-086-s1`, `T-102-s3`): a red is not news about your diff — run it
  alone (historically 5-in-5 green) before attributing anything.
- **Read the assertion, not the body's name** (`T-111-s9`):
  `token-scan.spec.ts`'s whole-corpus totals can red for any control
  character anywhere in the tracked corpus, under a title naming
  something else, with a remedy that looks the same either way.
- **A merged main can fail `npm run build`**: `lib/parser/dist` is a
  build artifact no merge updates, so the app compiles against
  pre-merge types. One command clears it — `npm run build` from
  lib/parser/, FIRST. Separately, an UNBUILT app tree fails `npm test`
  about a missing `app/dist`, not about your tree: build, then test.
- **`npm run typecheck` from app/ DOES NOT EXIST** — exit 1 `Missing
  script` reads exactly like a type error. The app's typecheck is the
  TWO `tsc` calls inside `npm run build`, and the second is
  load-bearing (T-073).
- **This session's `grep` is a `ugrep` shim carrying `-I`** — a
  NUL-bearing file answers "no matches" with no error. Use
  `command grep` when it matters; sweep NULs with `perl -0777`.
- **Cut scratch and drill worktrees at SHORT roots** (`T-133-s5`): a
  116–128-character root steals the board's standing region with two
  pixels of margin at 800×600.
- **Ports are machine-wide while rule 4 partitions by checkout**
  (`T-132-s6`): pass an explicit port and `lsof`-read it at zero rows
  immediately before binding, every time — a probe reserves nothing.
- **The RANGE RULE decides which two commits "the merge's diff"
  means** (CONVENTIONS' bullet, spec-kept figures): the integrator's
  pair and the executor's pair are different pairs, never
  `merge-base..tip`, and the pre-merge two-dot form hands your lane
  main's work.
- **Drill in a detached scratch worktree with its OWN
  `CARGO_TARGET_DIR`** (CONVENTIONS, POISON DRILL): a shared target
  directory replays drill-path binaries into the parent afterwards,
  and the pollution runs both ways.

## The records

- docs/checkpoints/ — one append-only record per integration
  (TEMPLATE.md sits there; ADR-019 forbids any suite, gate or
  generator from depending on the directory's contents — and since
  2026-08-29 the gate REDS when a record is committed newer than this
  file, so step 2 cannot be skipped silently). The current record is
  2026-08-27-T-092.md.
- docs/rooms/governing-docs.md and ADR-019 — this file's contract and
  the ruling behind it.
- The pre-compaction STATE, all 1,125 lines of it:
  docs/checkpoints/2026-08-27-backfill-STATE.md — and every earlier
  version at `git log -- docs/STATE.md`.
