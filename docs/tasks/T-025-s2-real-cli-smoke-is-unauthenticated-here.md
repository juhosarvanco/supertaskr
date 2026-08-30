---
id: T-025-s2
title: The real-CLI smoke could not observe a model turn — this machine's claude login is revoked
status: done
suggested_by: executor claude-opus-5 @T-025
---

T-025's Verification line owes the milestone closer "one real-CLI local
smoke run observed". The executor ran it once, as instructed, and it
proved **more than half** of what it was for — but not all of it, and
the gap should be recorded rather than quietly counted as done.

What the smoke DID establish, first-hand, against the installed
`claude 2.1.226` at `/opt/homebrew/bin/claude`:

- criterion 4's login-shell probe resolves the real binary and records
  the real version (`2.1.226 (Claude Code)`) into status;
- the adapter's full argv is ACCEPTED by the real CLI — no flag was
  rejected, and `--verbose` was separately measured to be still required
  (dropping it refuses at argument-validation time);
- the real stream's first line is a `system`/`init` carrying
  `session_id` and `model`, and the runner captured both: the registry
  recorded `native_session_id: e7954de6-…` and `model: claude-sonnet-5`,
  which is the capture-from-stream criterion working against reality;
- `.nputer/sessions.json` was written in the schema's shape;
- the failure path is typed, resumable, and never panics.

What it could NOT establish: an actual planner TURN. Every attempt
returns HTTP 401 — `Failed to authenticate. API Error: 401 OAuth access
token has been revoked.` This is the machine's own auth state, not the
runner's doing: a manual invocation with the FULL ambient environment
(no `env_clear`) fails identically, so the runner's env hygiene is not
the cause and forwarding a key would not have helped (and is forbidden
anyway — ADR-003).

So these remain unobserved, and no cargo suite can ever cover them
(no model in any suite, by charter):

- whether the kickoff prompt actually lands the planner in stage 0 and
  produces a first question rather than a wall;
- whether `--permission-mode acceptEdits` plus the six Bash patterns are
  sufficient for the real stage-0 scaffold (the T-023 dry run was
  hand-driven, so the ALLOWLIST specifically has never been exercised by
  a real agent — if a pattern is too narrow, the CLI denies loudly in
  band and the turn fails, which is safe but would be a poor first run);
- whether the 150 ms coalescing window feels right against real
  generation cadence;
- the conversational quality question T-023's dry run already left open.

Ask: run this once on an authenticated machine before the milestone
closes —

    NPUTER_REAL_CLI=1 cargo test --test agent_runner real_cli_smoke \
      -- --ignored --nocapture

from `app/src-tauri/`, and read the printed events. It writes only into
a temp dir. If the allowlist turns out to be short, the fix is one
adapter entry line plus its justification, and the six patterns' test
pins exactly what changed.

Triage 2026-08-16 (architect): PARKED — @HUMAN, and not buildable work
by anyone in this pipeline. This machine's `claude` OAuth token is
revoked, a manual invocation with the FULL ambient environment fails
identically (so env hygiene is not the cause), and forwarding a key is
forbidden by ADR-003 and would not have helped. The ask is one command
on an authenticated machine and it is carried in STATE's @human list.
It GATES T-025-s4, also parked: the Bash allowlist cannot be narrowed
safely without watching one real stage-0 scaffold.

Re-affirmed at triage 2026-08-17 (third pass): still unbuildable by
anyone here, and **its stature has grown rather than decayed**. T-027
merged the interview, so the flagship screen now exists and has never
once been driven by a real model; with T-028 and T-029 buildable, ONE
REAL OBSERVED PLANNER TURN is the only thing left between milestone 3
and an honest claim. Three cards created at this triage now depend on
it for their measurements rather than their code: T-056 (render volume
under a long streaming turn — every stream this screen has seen is a
fixture landing in milliseconds) most directly. The exact command is
above and in STATE's @human list. Nothing about the park changes; what
changes is that it is now the project's single highest-value @human
item.

Rulings sitting 2026-08-30 (@human ruled: run it now; integrator nputer-4e ran it): **THE PARK REASON IS STALE AND MORE THAN HALF THE GAP CLOSED.** Auth passed on this machine (claude 2.1.226). Observed first-hand: native session registered (`677664de-…`), real text deltas ("I'll start by reading the planner role definition."), and `Read`/`Bash`/`Read` executed through the allowlist with no denial — the first real planner turn this project has ever watched, and it was doing stage 0 correctly when the HARNESS hung up: `wait_for`'s fixture-calibrated twenty-second deadline panicked mid-turn (then cancelled cleanly — reaped in 550 ms, no SIGKILL, the failure path passing for free). Still unobserved: the turn's END — the scaffold and the first question. That distance is carded as `T-025-s5` (promoted at this sitting). RESURFACES: T-025-s5 lands; then the integration seat re-runs this smoke once to the terminal event on @human's standing authorization from this sitting, and this card closes on what it prints.

CLOSED 2026-08-30 (integration seat, the run @human authorized at the rulings sitting, after T-025-s5's deadline landed at merge 5346d7c): **the smoke ran to its terminal event — Completed, 1 passed, 72.21s, exit 0 unpiped.** Observed end to end: session registered (`a4c9961e-…`), stage-0 scaffold written to the temp project (docs/ five + three empty dirs, CLAUDE.md, AGENTS.md, .gitignore carrying .nputer/, git initialized, nputer.yaml seeded), STATE stamped naming stage 1, and the interview OPENED with a real Q1 (problem-and-person, one concrete scene, the skip-and-bank-`[?]` escape) — a first question, not a wall. ONE Bash call was DENIED by the allowlist mid-turn ("Contains shell syntax (string) that cannot be statically analyzed") — the denial arrived IN BAND as a typed `denied` event (T-081's shape working against reality), the planner routed around it with Write plus a simpler Bash, and the turn completed anyway: the allowlist is narrow, and it fails LOUD and SAFE. That measurement is stamped on T-025-s4, which it gates. The registry held the session; the failure path was never entered. Full stream: the T-025-s5 checkpoint record names the capture.
