# State

Updated: 2026-09-01 at the eight-card close. Its record — **"the 09-01
record"** wherever this file points at one — is the newest file in
docs/checkpoints/. **NO task branches remain** (derive: LANES) and no
verification is outstanding.

**NOTHING IS BROKEN.** Designed non-zero: `npm run health` **3** while
bands await keepers (T-156-s1/s2) — never read it as clean, never "fix"
it. **AND AN EXIT 1 MAY MEAN THE GATE COULD NOT RUN**: `docs-gate.mjs`'s
`CANNOT_RUN: 3` sits in a catch inside `main()`. **READ THE OUTPUT, NOT
THE CODE** — a verdict prints gate lines, a crash prints a stack trace.
Four instances, two an invented path: the boot gate is `npm run
boot:check`; `boot-gate.mjs` does not exist. **Re-run a suspect ONCE,
then ATTRIBUTE.**

## The contract this file is under

REPLACED at every checkpoint from docs/STATE-template.md, AFTER the
record is written, in the SAME commit (ADR-019). STATE keeps the
MECHANISM; the INSTANCE is stamped in the record. A figure appears here
only with its derive command. **When the byte band warns, content MOVES
to the record — a hazard is never deleted to fit**, and the remedy every
time has been a POINTER where a list had grown. **The commit subject
opens with `Checkpoint:`** (T-182).

## Live right now — derive, never quote

- LANES: `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`
  — a detached entry is NOT a lane. Dispatch = brief → PREFLIGHT →
  `--write-fence` → read the manifest back → launch. Never read the
  ledger's FREE column as a verdict (T-143).
- **THE RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE MANIFEST
  BACK, then cut the next.** T-209's guard refuses a dispatch against a
  lane whose fence it cannot read — *an unread fence is not "disjoint
  from everything"* — and refused four at once when this seat cut all
  four first.
- **DISJOINTNESS IS OVER EXPANDED PATH SETS, NEVER TOKENS** (rule 5,
  carrying its measurement: six lanes, every block a naming collision,
  not one real collision). **T-209 COMPUTES IT** — ask the guard, never
  assert it. `touches:` is a permission declaration, never an oracle.
- THE HUMAN'S APP: 1420 is read with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
  and NOTHING else — never bind-probe, never connect (the vite is on
  IPv6 loopback, so an IPv4 probe answers FREE while it runs).
  `../nputer-app` is detached ON PURPOSE: not a lane.
- BOARD CENSUS: `brief.mjs --state`; the parser's field is `blockedBy`.
- **E2E PORT: THE DEFAULT IS MACHINE-WIDE, SO EVERY CONCURRENT LANE
  TAKES 14520.** SET `NPUTER_E2E_PORT=15000+<card number>` per lane;
  `E2E_PORT` binds NOTHING. lsof to zero rows before binding, never
  1420. Derive, never check (T-217's corroboration).
- GRAPH: `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ — ASK IT, never predict, ask AGAIN after every write.
  Never trust it from inside a drill worktree (T-153-s3).

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it.>

1. IN FLIGHT: **DERIVE IT** — `brief.mjs --dispatch`. A hand-kept list
   here named two dead lanes and missed two live ones (T-142).
2. **THE STACK IS 3 GATES OF 4** — WRITE (T-199), DISPATCH (T-209),
   LANDING (T-212) all refuse. Queue: **T-203** (push gate), then
   **T-211** (the only pair fence-disjoint from T-203), then **T-210**
   (`.claude` collides with both).
3. **T-221 BEFORE ANY CARD TOUCHES `sharedDomain`** — one unpinned `/`
   decides whether `tools/e2e` contains `tools/e2e-helpers`, three gates
   rest on it, and dropping it reds nothing.
4. **ASK THE DOCS GATE WHAT A CHANGE OWES** — `docs-gate.mjs <separate
   literal paths>`; `lint:docs` is the CENSUS, exit 0 means "I wasn't
   asked".
5. **T-126-s2 IS RULED** — join goes to TypeScript, shape 3 refused on
   TEST REACHABILITY; blocker is **T-190**, not T-112-s4.
6. **TRIAGE IS OWED** — cards run to T-224, twenty in `suggested`.
   Release riders: T-112-s2, T-154-s3, T-159-s6, T-154-s4's sentence;
   T-173/T-176 owe a bump. **D5 ruled, NOT enforced** (no `--model`).
7. **@human holds; no card is cut from these** — the FORM (reopened),
   the STEERING SPLIT (T-180 parked), T-025-s4's three permission
   questions, T-162-s1's byte floor, T-131, and @human's eye on the
   interview's narrow-width ending (jsdom applies no breakpoints, so no
   suite here can answer it).

## Standing hazards — the section that saves the hour

- **REACH FOR THE CONSTRUCTION, NOT THE CHECK.** A machine-scoped
  surface bit FOUR times in one night — `git worktree list` in a gate
  (T-220), a defaulted port, a shared scratch filename, `pgrep -f
  playwright` matching sibling lanes forever — and rule 4 names the
  class, read by every seat that walked into it. A check's answer
  includes every other tenant; a construction (port from the card id, a
  marker the job owns, a board snapshotted once) cannot see them.
- **A WORKTREE ENTRY MUTATES IN PLACE.** A count cannot see a moved
  board; a path-only set difference cannot either. Compare whole
  `git worktree list` lines, **commit column included**.
- **A GATE READ THROUGH A PIPE REPORTS THE PIPE** — `false | tail -1` →
  0. There is **no root `package.json`** (scripts live in `tools/e2e/`);
  this seat read exit **254** as green four times. **Redirect, capture
  `$?`, THEN look.** Suite chains go in GUARDED SCRIPT FILES
  (`cd <abs> || exit N`).
- **NOTHING GATES THE PUSH YET** (T-203/T-216 open), and two things
  follow. A gate read BEFORE a commit does not catch what the commit
  creates — committing a record is what makes STATE stale, so read it
  AGAIN after. And the fence judges a WRITE and a LANDING but not a
  push: `push-guard.mjs:449` roots on the writer's cwd and the hook
  loads from the DISPATCHING checkout, so a lane never arms its own fix.
- **A BLIND VERIFIER'S WORKTREE IS CUT AT THE BASE REF, NEVER THE TIP**
  (T-213) — a tip carries the executor's notes, including sections
  addressed to the verifier. **Lane context goes in a SECOND message**:
  a "blind line" inside one message is not blindness, because the agent
  reads the whole prompt. The four leaks: the 09-01 record.
- **A LINE NUMBER IS A FIGURE** — a coordinate in a mutable object that
  fails silently, still pointing at a real line, just the wrong rule.
  Two falsified by merges in one night. Cite by ORDINAL.
- **POISON DRILLS: KILL-SET CONTAINMENT, NOT THE COUNT** (shape SIX,
  settled by measurement). The third proof is *something died **at the
  site the property lives*** — the failure mode is AIMING, not
  accounting. Read a mutant's landing from `git diff`, never from the
  mutator's report.
- **A TIMING CORRELATE IS NOT A CAUSE.** Read a suite's own time and
  re-run a body ALONE before attributing. **A merged main can fail
  `npm run build`**: `lib/parser/dist` is a build artifact no merge
  updates — build the parser FIRST. **And pass the docs gate SEPARATE
  LITERAL PATHS**: zsh splits an unquoted command substitution but NOT a
  variable, so a variable hands the gate every path as ONE and it
  answers "1 path(s)" — plausible and wrong.
- **FIVE TOOLING TRAPS, moved to the 09-01 record under "Tooling traps"
  rather than deleted** — the `grep` shim, the scripted edit that must
  be read back before committing, scratch-worktree construction
  (T-133-s5), the RANGE RULE (CONVENTIONS), and the push that cancels
  the running CI job. Read them once; they do not change.
- **BOOT GATE AND HEALTH BANDS ARE OWED AT EVERY CHECKPOINT** (T-046,
  T-156). Health takes **`--readings`** over captured output, and **the
  `--` is load-bearing** or npm eats the flag (exit 2). **A lane's token
  meter exists ONLY in its notification** — capture it when the lane
  reports or it is unrecoverable.
- **NARROWER HAZARDS LIVE IN THE RECORDS** per this file's contract:
  T-086-s1's 1-in-22 body, T-111-s9's token-scan totals, app/'s absent
  `typecheck`, the CI billing block (cleared).

## The records

- docs/checkpoints/ — append-only, one per integration; the 09-01 record
  is the newest, the seven-card record beside it at 2026-08-31.
  Pre-compaction: 2026-08-27-backfill-STATE.md.
- docs/rooms/governing-docs.md + ADR-019 — this file's contract.
- Every earlier version: `git log -- docs/STATE.md`.
