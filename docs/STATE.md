# State

Updated: 2026-08-31 at T-179's close — record:
docs/checkpoints/2026-08-31-T-179-the-brief-learns-where-the-repository-is.md;
the queue lives in T-171's record beside it.
**NINE LANES LANDED overnight** and the GRAPH HOLD IS OVER: the emit
budget is a derived 2,145,959 with roughly a megabyte free — derive it,
never quote it. Pre-compaction:
docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** Designed non-zero exits: `npm run health` exits 3
while bands await keepers (T-156-s1/s2); the DOCS GATE's 1 means it HAS
a verdict. **Two intermittents can red a green tree** — `T-161` (stderr
tail) and `T-178` (fixture teardown), two CI sightings each. Re-run ONCE
as a second measurement, then attribute; never re-run until green and
call that evidence.

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019). A figure appears here
only with its derive command. **When the byte band warns, content MOVES
to the record — a hazard is never deleted to fit.** This file breached
its band once overnight and drifted twice more; each time the remedy was
a POINTER where a list had grown.
**AND THE COMMIT'S SUBJECT OPENS WITH `Checkpoint:`** — the triage
band's window and CONVENTIONS' dispatch base both read it (`T-182`).

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. Dispatch = brief → PREFLIGHT →
  `--write-fence` → read the manifest back → launch. Never read the
  ledger's FREE column as a verdict (T-143).
- THE HUMAN'S APP: 1420 is read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and NOTHING else — never
  bind-probe, never connect (the vite is on IPv6 loopback, so an IPv4
  probe answers FREE while it runs). `../nputer-app` is detached ON
  PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- E2E PORT: `NPUTER_E2E_PORT` (default 14520) — `E2E_PORT` binds
  NOTHING. Derive scratch ports FROM THE CARD ID; lsof to zero rows
  immediately before binding.
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT, never predict, ask AGAIN after every write.
  Never trust it from inside a drill worktree (T-153-s3).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: `T-161` and `T-140-s9`, blind verifiers out. Nine lanes
   landed overnight; the queue lives in T-171's record, so this file
   points rather than transcribes.
2. **`T-126-s2`'s UN-PARK CONDITION HAS FIRED; it wants a RULING before
   a fence** — it stands between the registered command and a rendered
   brief. Registration was necessary, NOT sufficient; this file said
   otherwise three times.
3. THE QUEUE is in T-171's record. Standing red worth a lane:
   `T-167-s8` (the pre-push guard, now also carrying `T-181`'s record
   trigger).
4. THE NEXT METHOD RELEASE has riders: `T-112-s2`, `T-154-s3`,
   `T-159-s6`, `T-154-s4`'s sentence; `T-173` and `T-176` owe a bump.
5. @human holds, and NOTHING is cut from these: the **FORM** (REOPENED
   2026-08-31 — the ruled asymmetric answer leaves every authoring act a
   file edit and @human wants customization without opening files); the
   **STEERING SPLIT** (`T-180` parked on it); T-025-s4's three remaining
   permission questions; and **thirty seconds of @human's eye on the
   interview's new ending at a narrow width** — jsdom applies no
   breakpoints, so no gate here can see it.
6. **D5 IS RULED BUT NOT ENFORCED** — nothing passes `--model`, so an
   assignment is honoured only by the session that dispatches. Set it
   deliberately on every spawn.
7. **WHAT A DISPATCHER WRITES FROM MEMORY IS THE HALF THAT IS WRONG.**
   Overnight: three of six blind briefs leaked lane facts above the
   phase-1 line (the verifiers disclosed it), and four lanes found the
   dispatch summary contradicting the derived brief beside it — a
   narrower fence, a wrong base, an install order short of ADR-011.
   **Name the contract and the hazards; point at the derivation; put
   any lane fact BELOW the blind line, labelled.**

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
- **TYPE THE DOCS GATE'S PRINTED SPELLING.** It passes an unquoted
  COMMAND SUBSTITUTION, which zsh splits; route it through a VARIABLE and
  zsh does not — the gate takes every path as ONE and answers
  "1 path(s)", plausible and wrong.
- **This shell's `grep` is a shim** carrying `-I` and rejecting
  `--include` — use `command grep`; sweep NULs with `perl -0777`.
- **An edit script's success is a GATE, not a step** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back first. Broken
  twice in 24h, once by the seat that had just written the rule down.
- **Scratch worktrees: SHORT root, detached, own `CARGO_TARGET_DIR` at
  `<scratch>/target`, stem DERIVED from the card id** (`T-133-s5`) — the
  directory is shared between sessions, and a VERIFIER cuts its own,
  because a bench carries artefacts.
- **Ports are machine-wide** (`T-132-s6`): explicit, lsof-read at zero
  rows immediately before binding; a probe reserves nothing.
- **The RANGE RULE decides which two commits "the merge's diff" means**
  (CONVENTIONS) — the integrator's pair and the executor's differ.
- **After merging a lane, REMOVE ITS WORKTREE BEFORE the verdict
  corrections** — guard limit 6: git drops its mid-merge marker at the
  merge commit while the worktree keeps the fence.
- **A PUSH CANCELS THE RUNNING CI JOB** — four superseded overnight by
  one seat's rapid pushes. Commit stamps freely; batch the PUSH.
- **THE BOOT GATE AND THE HEALTH BANDS ARE OWED AT EVERY CHECKPOINT**
  (T-046, T-156), and health takes **`--readings`** over the captured
  `cargo test`, `index --check` and e2e output — without it three bands
  answer UNREAD and the run is not a claim about the tree.

## The records

- docs/checkpoints/ — append-only, one per integration. Current:
  2026-08-31-T-179-the-brief-learns-where-the-repository-is.md.
  **A CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:`** — the
  health band's window and CONVENTIONS' dispatch base BOTH read that
  marker, and a seat dropped it for six records before a band noticed
  (`T-182`).
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
