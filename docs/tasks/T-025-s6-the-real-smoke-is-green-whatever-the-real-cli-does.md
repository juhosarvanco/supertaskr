---
id: T-025-s6
title: The real smoke is green whatever the real CLI does — it asserts nothing, so the one authorized real run's verdict lives in stdout and no exit code carries it
feature: F-03
milestone: 3
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-025-s5
blocked_by: []
touches: [app/src-tauri/tests]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE FIXING THE DEADLINE (T-025-s5), NOT FIXED THERE.** It is
inside that lane's fence and outside its class: T-025-s5 was ruled to
change the smoke's DEADLINE and nothing else, and widening a lane to
add assertions to the body it was sent to time is how a fence stops
meaning anything.

`real_cli_smoke_records_the_stream_schema`
(`app/src-tauri/tests/agent_runner.rs`) contains no assertion of any
kind. It starts a genesis, waits for a terminal event, and `println!`s
four things: the start outcome, the terminal event, the settled status
and the session registry. Every path through it that does not panic
exits 0 — including:

- a `Failed { AuthFailed }` terminal event 400 ms in, which is what this
  machine produced for the whole of 2026-08-16 → 2026-08-29 and what
  T-025-s2 was parked on;
- a `Failed { StartTimeout }` or `Failed { Stall }` from the runner's
  own bounds;
- `StartOutcome` never reaching `Started` at all — a `cliNotFound`
  prints as a start outcome and the body waits out its whole deadline,
  then panics for the only reason it CAN panic, which reports as a
  timeout rather than as the resolution failure it is.

So the body's name is a promise its code does not keep: it records the
stream schema when there IS one, and is equally green when there is
none. **This is the same class as the defect T-025-s5 fixed** — that
card's own words for the 20 s panic were *"the failure path passing a
test it was never given"* — one layer up: here the whole body passes on
every path, healthy or not.

**WHY IT MATTERS RIGHT NOW.** @human's standing authorization (rulings
sitting, 2026-08-30) buys exactly ONE closing real run, taken by the
integration seat, and T-025-s2 closes on what that run prints. The
verdict is therefore read off `--nocapture` stdout by a human, and
nothing in the tree distinguishes "a real planner turn ran to a terminal
`Completed`" from "the CLI refused at auth in under a second" except
that human reading carefully. A run that costs a ruling to authorize
should not report itself only in prose.

**THE TENSION THIS CARD DOES NOT RESOLVE, and it is why this is a
suggestion rather than a fix.** The body is deliberately a RECORDER: its
docstring says it exists "to record the real stream's line shapes as the
fake fixtures' provenance", and a recorder that reds on an unexpected
real-CLI behaviour destroys the recording it was run for. Assertions and
recording pull opposite ways here, and which wins is a ruling, not a
preference. Two shapes to choose between:

1. **Assert the PREMISE, never the content.** Red only when the body did
   not observe a real turn at all: `StartOutcome::Started`, a native
   session id in the settled status, at least one text delta, and a
   terminal event that is `Completed`. Everything about the stream's
   SHAPE stays printed and unasserted, so the provenance recording is
   untouched and only "there was nothing to record" fails.
2. **Leave the body green and make the RUN's report the artifact** —
   e.g. the operator commits the captured stream beside
   `docs/research/captures/real-planner-turn-2026-08-19.jsonl` (which
   this same file already reads as a fixture) and the verdict is that
   file existing, not an exit code.

Shape 1 is the smaller change and the one this suggestion leans toward;
shape 2 is what the current body implicitly assumes and has never been
written down.

## Acceptance criteria

- THE real smoke SHALL distinguish, in its own exit status, a run that
  observed a real planner turn from a run that observed no turn at all —
  or the project SHALL record, on this card, the ruling that it
  deliberately does not and what carries the verdict instead.
- THE smoke SHALL keep every gate it has (`#[ignore]`,
  `NPUTER_REAL_CLI=1`, the one deliberate `NO_REAL_CLI_VAR` opt-out) and
  its real-cadence deadline (T-025-s5).
- WHERE assertions are added, THE stream's line SHAPES shall stay
  printed and unasserted, so the body remains the fixtures' provenance
  recording rather than a schema lock.
- THE lane SHALL NOT spawn a real turn as its proof; fixture suites
  green is the evidence, exactly as at T-025-s5.
