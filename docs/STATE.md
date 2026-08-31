# State

Updated: 2026-08-31 at the fourteen-lane close — record:
docs/checkpoints/2026-08-31-four-lanes-and-a-spec-that-tested-itself.md; the
queue lives in T-171's record beside it.
**NO task branches remain** (derive: the LANES command below) and the
GRAPH HOLD IS OVER: the emit budget is a derived 2,145,959 with roughly a
megabyte free — derive it, never quote it. Pre-compaction:
docs/checkpoints/2026-08-27-backfill-STATE.md.

**NOTHING IS BROKEN.** CI stopped STARTING for ~4h on 2026-08-31 (an
account BILLING block, not minutes — the reason lives in check-run
ANNOTATIONS, nowhere else); @human cleared it and `146ebb6` is green,
including `cargo audit`. Designed non-zero exits: `npm run health` exits
3 while bands await keepers (T-156-s1/s2); the DOCS GATE's 1 means it HAS
a verdict. **Re-run a suspect ONCE as a second measurement, then
ATTRIBUTE** — never re-run until green and call that evidence. (`T-161`
and `T-178`'s causes are both fixed.)

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

1. IN FLIGHT: **DERIVE IT, never transcribe** — `brief.mjs --dispatch`.
   A hand-kept list here named two dead lanes and missed two live ones
   inside one sitting (`T-142`).
2. **ASK THE DOCS GATE WHICH SUITES A CHANGE OWES**: `node
   tools/e2e/scripts/docs-gate.mjs <changed paths>`. `npm run lint:docs`
   is the CENSUS — its exit 0 means "I wasn't asked", not "nothing owed".
3. **`T-126-s2` IS RULED**: the join goes to TypeScript; shape 3 was
   refused on TEST REACHABILITY. Blocker is **`T-190`** (C-15 has no test
   path), not `T-112-s4`. Newest cards run to `T-196`; **twelve sit in
   `suggested` and a triage sitting is owed.** An ADR is @human's.
4. NEXT METHOD RELEASE riders: `T-112-s2`, `T-154-s3`, `T-159-s6`,
   `T-154-s4`'s sentence; `T-173`/`T-176` owe a bump.
5. @human holds, and NOTHING is cut from these: the **FORM** (REOPENED
   2026-08-31 — the ruled answer leaves every authoring act a file edit
   and @human wants customization without opening files); the **STEERING
   SPLIT** (`T-180` parked on it); T-025-s4's three permission questions;
   and **thirty seconds of @human's eye on the interview's new ending at
   a narrow width** — jsdom applies no breakpoints.
6. **D5 IS RULED BUT NOT ENFORCED** — nothing passes `--model`, so an
   assignment is honoured only by the dispatching session.
7. **WHAT A DISPATCHER WRITES FROM MEMORY IS THE HALF THAT IS WRONG** —
   nine instances overnight. Point at the derivation. **A verifier's
   brief carries NO lane fact: a "blind line" inside one message is not
   one, because the agent reads the whole prompt. Send lane context in a
   SECOND message, after the attack set is saved.**

## Standing hazards — the section that saves the hour

- **A GATE READ THROUGH A PIPE REPORTS THE PIPE**, so a hard failure
  reads as a clean pass: `false | tail -1` → 0, `pipefail` → 1. There is
  **no root `package.json`** (scripts live in `tools/e2e/`); this seat
  read exit **254** as green four times. **Redirect, capture `$?`, THEN
  look.**
- **THE FENCE HOOK JUDGES NOTHING in this shape** (`T-199`): lanes are
  SIBLINGS, outside the dispatching checkout, and `lane-fence.mjs`'s
  limit 2 allows an outside path UNJUDGED. Seven lanes' compliance was
  DISCIPLINE. **Never tell a lane a hook enforces its fence.**
- **`brief.mjs` TRUNCATES piped stdout at 64 KiB** (`T-197`) — redirect
  to a file; it reds a standing e2e body no lane caused.
- **A TIMING CORRELATE IS NOT A CAUSE.** Read a suite's own time and
  re-run a body ALONE before attributing. (The "cargo cache cliff" was
  retired 2026-08-31: `T-088-s4` proved the cause was a missing
  rendezvous, not the cache — after a 13 GiB `cargo clean` on the old
  attribution.)
- **A merged main can fail `npm run build`**: `lib/parser/dist` is a
  build artifact no merge updates — build the parser FIRST. An unbuilt
  app tree fails `npm test` about `app/dist`.
- **Suite chains go in GUARDED SCRIPT FILES** (`cd <abs> || exit N`).
- **FIVE narrower hazards MOVED to the checkpoint records** rather
  than deleted, per this file's contract: `T-086-s1`'s 1-in-22 body,
  `T-111-s9`'s misnamed token-scan totals, and app/'s absent
  `typecheck` script.
- **PASS THE DOCS GATE SEPARATE LITERAL PATHS.** zsh splits an unquoted
  COMMAND SUBSTITUTION but NOT a variable, so a variable hands the gate
  every path as ONE and it answers "1 path(s)" — plausible and wrong.
  `T-192` read this line as naming only one direction and hit the other.
- **This shell's `grep` is a shim** carrying `-I` and rejecting
  `--include` — use `command grep`; sweep NULs with `perl -0777`.
- **An edit script's success is a GATE, not a step** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back first. Broken
  twice in 24h, once by the seat that had just written the rule down.
- **Scratch worktrees: SHORT root, detached, own `CARGO_TARGET_DIR` at
  `<scratch>/target`, stem DERIVED from the card id** (`T-133-s5`) — the
  directory is shared between sessions, and a VERIFIER cuts its own,
  because a bench carries artefacts.
- **The RANGE RULE decides which two commits "the merge's diff" means**
  (CONVENTIONS) — the integrator's pair and the executor's differ.
- **A PUSH CANCELS THE RUNNING CI JOB** — four superseded overnight by
  one seat's rapid pushes. Commit stamps freely; batch the PUSH.
- **THE BOOT GATE AND THE HEALTH BANDS ARE OWED AT EVERY CHECKPOINT**
  (T-046, T-156), and health takes **`--readings`** over the captured
  `cargo test`, `index --check` and e2e output — without it three bands
  answer UNREAD and the run is not a claim about the tree.

## The records

- docs/checkpoints/ — append-only, one per integration. Current:
  2026-08-31-four-lanes-and-a-spec-that-tested-itself.md.
  **A CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:`** — two
  consumers read it; `T-182` states the rule in CONVENTIONS.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
