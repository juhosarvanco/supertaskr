---
id: T-039
title: Session-id injection gate — a captured id must never parse as a flag
feature: F-03
milestone: 3
priority: 6
size: S
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-025-s6. **This is a GATE on T-029, not a backlog item** —
T-029 is the task that reads the session id off `.nputer/sessions.json`
and spawns from it, which is precisely the step that turns this from
unreachable into reachable. It closes before T-029 dispatches.

What the T-025 verifier measured: `argv(Some(id))` substitutes the
captured session id into the resume template unvalidated, and
`claude --help` shows `-r, --resume [value]` takes an OPTIONAL
argument — so an id beginning with `-` parses as a standalone flag
rather than as the resume value. Injecting
`--dangerously-skip-permissions` produced the argv tail
`["WebSearch", "--resume", "--dangerously-skip-permissions"]`
**while the bypass pin stayed green**, because that pin searches the
adapter TABLE and this arrives through DATA. Unreachable today (only
the CLI authors that id, and `send_turn` resumes from memory), which
is exactly why it is cheap to close now and expensive to discover
later.

Verified despite the S size: the class is an argv injection, and the
pin that should have caught it is itself part of the fix. Executor +
adversarial verifier, not S-tier's executor-only path.

## Acceptance criteria
- THE captured session id SHALL be validated against a strict
  allowlist pattern before it is stored or substituted into argv —
  the CLI's own id shape (the observed form is recorded in T-025's
  real-smoke notes; derive the pattern from that rather than
  guessing), rejecting anything containing a leading `-`, a path
  separator, whitespace, a NUL, or any character outside the shape.
- IF a stream's init line carries an id that fails validation THEN
  the turn SHALL fail with a typed error naming the rejection, the
  id SHALL NOT be written to `.nputer/sessions.json`, and no resume
  SHALL be attempted with it — loud, never silently coerced or
  truncated into something acceptable.
- IF a session id read from an EXISTING `.nputer/sessions.json`
  fails validation THEN the runner SHALL refuse to resume from it
  and surface a typed outcome (the registry is a losable runtime
  file an attacker or a corruption could reach; T-029 will read it,
  so the check must live at the READ boundary, not only at capture).
- THE bypass pin SHALL be widened to cover data-borne flags: it
  SHALL assert over the FULLY ASSEMBLED argv — template plus every
  substituted value — that no element in a value position begins
  with `-`, in addition to its existing three-spelling search of the
  adapter table. The T-025 verifier's exact injection SHALL be a
  regression test that fails without the fix.
- THE existing runner behavior SHALL be otherwise unchanged: the
  spawn/resume round trip, session capture, transcript, kill
  semantics and typed failures all keep their current tests green,
  and no new grant, dependency, or IPC surface appears.

Verification: headless — cargo tests against the fake CLI, including
the verifier's measured injection as a failing→passing pin and at
least one hostile id read from a crafted registry file. No real model
calls. @human: none.

## Implementation notes

## Verdicts
