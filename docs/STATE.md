# State

Updated: 2026-08-29 — the deferred step-2 regeneration for the T-092
and T-093 checkpoints, performed at @human's direction after the
architect's own report named the skip; the gate that now reds on that
skip landed in the same commit. Current record:
docs/checkpoints/2026-08-27-T-092.md. The pre-compaction narrative
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
  --state`, which stamps the reading. Read at this rewrite: ZERO
  `task/` lanes (2026-08-29, ref `958be8a`). Before ANY dispatch run
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

Hooks written 2026-08-27; derive each card's status and fence with
`brief.mjs --task` at dispatch, never from this list.

1. ADR-019 phases 2–7 COMPLETE
   (docs/checkpoints/2026-08-27-adr019-compaction.md; gate values in
   the ADR's addenda). T-092 and T-093 are DONE at CONVENTIONS' seat,
   their records beside it. Live from their wake: `T-092-s4` — the
   drill's restoration proof passes on a failed restore — and the
   suggestion trains of `T-150`.
2. `T-135` Half B — @human's look owed on its §6/§7; owns ADR-018.
   Must NOT be re-dispatched whole: Half A is on main, criteria 1–3
   discharged.
3. `T-138-s3` — `deriveReadFirst` row 3 over-reports NORTH_STAR and
   drops the product pointer; also owns `brief.spec.ts:706`'s
   machine-wide-joined-to-per-checkout shape.
4. `T-112` — the obvious next F-04 card AND the board's most colliding
   (the `app/src/assets` + `app/src/styles` flip pairs): sequence
   deliberately, derive the pairs.
5. `T-140` — the graph's floor is ~802 bytes per file, so the map
   stops working at about a thousand files; the budget bounds what the
   map may know, the floor bounds what it can reach.
6. `T-139-s2` — the snapshot crosses IPC as JS source that is
   EVALUATED; wants a room before a lane.
7. `T-149-s1`…`s5` — the app-shell-umbrella follow-ups.
8. `T-025-s2` — @human: one real, timed, end-to-end genesis on an
   authenticated machine is milestone 3's whole remaining gate.
9. The graph-budget VALUE call now rides `T-151` (planned): a raise
   of 8,575 bytes maximum, the margin it would eat being the design —
   @human's number, on the T-139 pattern.
10. ADR-020's three cards (ratified 2026-08-29, from the AI-native
    SDLC comparison): `T-154` the fence hook — the property at the
    moment of the write; `T-155` method evals; `T-156` health bands.
11. `T-153` — the first CI run's inotify red; pushes are HELD until
    it lands, because every push re-runs CI into the known red.

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
