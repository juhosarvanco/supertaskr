---
id: T-025-s2
title: The real-CLI smoke could not observe a model turn — this machine's claude login is revoked
status: parked
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
