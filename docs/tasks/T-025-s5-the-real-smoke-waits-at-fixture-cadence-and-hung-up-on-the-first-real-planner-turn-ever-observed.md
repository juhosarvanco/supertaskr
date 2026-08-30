---
id: T-025-s5
title: The real-CLI smoke waits at fixture cadence — its twenty-second deadline hung up on the first real planner turn this project ever observed, mid-sentence and behaving
feature: F-02
milestone: 3
priority: 1
size: S
status: planned
blocked_by: []
touches: [app/src-tauri/tests]
suggested_by: integrator nputer-4e @T-025-s2 real-smoke run, 2026-08-30
builder:
verifier:
built_by:
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
