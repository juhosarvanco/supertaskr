---
id: T-025-s5
title: The real-CLI smoke waits at fixture cadence — its twenty-second deadline hung up on the first real planner turn this project ever observed, mid-sentence and behaving
feature: F-02
milestone: 3
priority: 1
size: S
status: done
blocked_by: []
touches: [app/src-tauri/tests]
suggested_by: integrator nputer-4e @T-025-s2 real-smoke run, 2026-08-30
builder:
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-30, rulings sitting)**: @human ruled the
real smoke RUN, the run happened, and this defect is the whole distance
between that ruling and its evidence.

## The measurement (2026-08-30, this machine, claude 2.1.226)

`NPUTER_REAL_CLI=1 cargo test --test agent_runner real_cli_smoke --
--ignored --nocapture` from app/src-tauri/. The 2026-08-16 park reason
(revoked OAuth) is STALE — auth passed. The runner registered native
session `677664de-…`, streamed real text ("I'll start by reading the
planner role definition." / "I'll read the interview plan and templates
before scaffolding."), and ran `Read`, `Bash`, `Read` through the
allowlist with no denial. Then `wait_for`'s HARD-CODED twenty-second
deadline (tests/agent_runner.rs, shared by every fixture body) panicked
mid-turn, and the harness killed a healthy turn — cleanly: process
group reaped in 550 ms, no SIGKILL, which is the failure path passing a
test it was never given. A real stage-0 scaffold runs minutes; every
other stream this harness has seen lands in milliseconds. The deadline
is measuring the fixture, not the turn — T-153-s5's "the old assertion
was measuring the measuring platform", one suite over.

## Acceptance criteria

- THE real smoke SHALL wait at real cadence — its own deadline, minutes
  not seconds, stated at the definition site with this run cited. THE
  fixture bodies SHALL keep their twenty seconds; a slow fixture is a
  defect and twenty seconds is its alarm.
- THE smoke SHALL keep every gate it has (`#[ignore]`,
  `NPUTER_REAL_CLI=1`, the one deliberate opt-out) — nothing here makes
  a real model reachable by accident.
- THE lane SHALL NOT spawn a real turn as its proof: fixture suites
  green is the lane's evidence, and the ONE closing real run is the
  integration seat's, on @human's standing authorization from this
  sitting — recorded on T-025-s2 when it happens.
- THE cargo suite SHALL be green from app/src-tauri/, exits unpiped.

## Implementation notes

Built in lane `task/T-025-s5-real-smoke-deadline`, worktree
`/Users/ujju/Projects/nputer-T-025-s5`, cut from `25850bda47f4`. One file
changed: `app/src-tauri/tests/agent_runner.rs`. No production code, no
harness restructuring beyond the deadline.

**THE SHAPE: a deadline PARAMETER, with every existing call site
untouched behind a wrapper.** `wait_for` keeps its exact signature and
now delegates to a new `wait_for_within(events, within, label, pred)`,
passing `FIXTURE_DEADLINE`. The real smoke — and nothing else in the
repo — calls `wait_for_within` directly with `REAL_CLI_DEADLINE`. Two
named constants replace what were five bare `Duration::from_secs(20)`
literals in this file, so `git grep 'from_secs(20)' app/src-tauri/tests/`
now returns exactly one line: `FIXTURE_DEADLINE`'s definition. The
substitution is literal-for-constant — every fixture body waits the same
twenty seconds it waited before, byte for byte in behaviour — and it is
what makes this card's second criterion a property one can read at one
site instead of a claim about five.

**THE DEADLINE: fifteen minutes (`REAL_CLI_DEADLINE`, 900 s), derived at
the definition site with the 2026-08-30 run cited there in full.** The
derivation, in four steps, all of it in the doc comment:

1. It must sit ABOVE the production runner's own bounds, so a genuinely
   stuck real turn is ended by the RUNNER as a typed `StartTimeout` or
   `Stall` — the very thing this smoke exists to record — rather than
   destroyed by a harness panic that records nothing. `RunnerConfig::default()`
   (`app/src-tauri/src/agent/runner.rs`, the config this smoke uses)
   worst-cases at `start_timeout` 30 s + `stall_timeout` 300 s +
   `kill_grace` 5 s = **335 s**. That is the FLOOR, not the answer.
2. `stall_timeout` is idle-since-the-last-line, so it never bounds a
   healthy turn's WALL CLOCK — every delta resets it, and a stage-0
   scaffold streaming steadily for ten minutes trips nothing in the
   runner. This deadline is the only wall clock over a real turn, so it
   has to be a real turn's budget, not a stall detector wearing one.
3. 900 s is ~2.7x that floor: the runner's typed failure arrives first in
   every mode the runner can see, and a panic here means only "the runner
   failed to bound itself" — a finding, not noise.
4. The two errors are not symmetric, and the asymmetry buys the slack.
   Too small destroys the evidence the run exists to collect (2026-08-30
   is the worked example, and it destroyed it while LOOKING like a
   defect). Too large costs one human, hand-running an `#[ignore]`d body
   under `--nocapture`, a wait they can end with ^C. No suite and no CI
   can reach the constant.

**THE GATES ARE UNTOUCHED, verified by diff**: `#[ignore]` with its
reason string, the `NPUTER_REAL_CLI != "1"` early return, and the single
deliberate `NO_REAL_CLI_VAR = "0"` opt-out all stand exactly as they
were. The diff inside the body is two lines: `wait_for` → `wait_for_within`
with the constant, plus its comment.

**THE SWEEP (class: a fixture-cadence deadline on the real smoke's
path).** Five hard-coded 20 s deadlines existed in this file. Two are on
the smoke's path and three are not:
- `wait_for` (the defect) — FIXED, the smoke now waits at real cadence.
- `settle` — ON the path, and it KEEPS twenty seconds with the reason
  written into its doc comment. `run_turn` reaps the child and terminates
  the group BEFORE the terminal event is classified and emitted, so by
  the time `wait_for_within` has returned, all this poll waits on is
  `agent/mod.rs`'s post-turn bookkeeping: a transcript append and a
  session-registry upsert, both local disk. No model is on this side of
  the terminal event.
- `collect_turn`, `wait_for_file`, and the inline loop in
  `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
  — NOT on the smoke's path; fake-driven only. Renamed to the constant,
  unchanged in value.
Sweep beyond this file: `grep -rn NPUTER_REAL_CLI app lib tools method`
returns only this file and `runner.rs`'s `real_cli_arms_forbidden`
doc-comment reference. There is no second real-CLI body anywhere in the
repo, so the class has exactly one member and it is fixed.

**THE STATED COST OF THE LONGER DEADLINE, named rather than
discovered.** The smoke prints `start_genesis`'s outcome and then waits,
without checking it. If the start never reaches `Started` — a
`cliNotFound`, an unsupported version — no turn is spawned, no event
ever arrives, and the wait now runs the full fifteen minutes before
panicking with a timeout, where it used to waste twenty seconds. This is
not what the deadline needs fixed and was deliberately NOT fixed here
(the card says restructure nothing beyond the deadline, and a guard on
the start outcome is a new assertion in a body that has none). It is
cheap in practice — a hand-run, `--nocapture`, with `[real-smoke] start:`
already on screen naming the failure, and ^C one keystroke away — and it
is routed: `T-025-s6`'s shape 1 is exactly the guard that would close it.

**NO REAL TURN WAS SPAWNED BY THIS LANE** — the card's third criterion.
Evidence is the fixture suite: `cargo test` from `app/src-tauri/`, green,
exit read unpiped. The one closing real run is the integration seat's, on
@human's standing authorization from the 2026-08-30 rulings sitting, and
it is recorded on T-025-s2 when it happens.

**GATES.** `cargo test` from `app/src-tauri/`: **exit 0**, read unpiped —
525 passed, 0 failed, 4 ignored across 15 binaries (the real smoke among
the ignored, as it must be). The lib suite finished in **4.05 s**, well
inside the cargo-cache-cliff's green band, so
`startup_arm_watches_the_initial_root` passing means what it says.
`npm run lint:docs` from tools/e2e/ (DOCS GATE, owed because this card is
a docs input): **exit 0** — 23 readers, 0 frontmatter issues, budgets
hold. GRAPH REGEN fires (the diff touches a `*.rs` file outside docs/)
and is the integrator's at merge: `index --check` reports STALE for
exactly this one file, `~1 file, symbols 127 -> 130` (`FIXTURE_DEADLINE`,
`REAL_CLI_DEADLINE`, `wait_for_within`), fresh index 1,023,730 of
1,040,000 bytes. BOOT GATE fires on `app/src-tauri/**` and is likewise
the integrator's. Positive control that the gates still refuse: with
`NPUTER_REAL_CLI` unset, `cargo test --test agent_runner real_cli_smoke
-- --ignored --nocapture` prints *"NPUTER_REAL_CLI=1 not set - refusing
to call a real model"* and returns without spawning anything.

**CONFLICTS BETWEEN CARD AND TREE: none.** Every claim the card makes
about the tree held at `25850bda47f4` — `wait_for`'s hard-coded twenty
seconds at line 177, the smoke at line 4668, the three gates, the shared
helper. The one thing the card does not say and the tree does: `settle`
is a second harness deadline on the smoke's path, and the notes above
record why it correctly stays at twenty.

**SUGGESTION FILED**: `T-025-s6` (`status: suggested`) — the real smoke
asserts nothing, so it is green on every path including a 400 ms
`AuthFailed`, and the one authorized real run's verdict lives only in
stdout. Named rather than fixed: it is inside this lane's fence and
outside its class, and it is the tension between "recorder" and
"assertion" that a ruling has to settle.

**CEREMONY ROW.** `touches: [app/src-tauri/tests]` is a bare path and
not a slug, and CONVENTIONS' THE SHIPPED PARTITION, IN SLUGS puts every
bare path that is neither a registry slug nor a `method/` path reaching
a `KIT_FILES` entry on the NOT SHIPPED side. So this is the ceremony
table's first row — S, diff outside shipped code, no verifier owed —
and the status is stamped `done` per method/roles/executor.md step 6.
The merge is NOT this lane's: the dispatch reserved it for the
integration seat, which also owns the closing real run.
