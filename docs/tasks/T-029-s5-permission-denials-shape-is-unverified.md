---
id: T-029-s5
title: The tool-denial fixture is a CONSTRUCTION, not a transcription — no real CLI denial has ever been observed
status: parked
suggested_by: executor claude-opus-5 @T-029
---

`TurnError::ToolDenied { denials, terminal_reason }` (T-029, folding
T-025-s1) is detected from two fields on the CLI's `result` line:
`permission_denials` and `terminal_reason`. Unlike the auth shape beside
it — which `fake_agent.rs` transcribes from a real 2.1.226 smoke and
which STATE.md records the provenance of — **the `tool-denied` scenario
was written from the CLI's documented field names, not captured from a
run.** This machine's login is revoked, so no denial could be provoked
without a model call, and T-029's fence forbids one.

What is therefore unverified: whether `permission_denials` entries are
objects with `tool_name` (assumed), bare strings (also accepted), or
something else; whether the field appears on the `result` line at all
rather than on a `system` line; and what `terminal_reason` actually reads
for a permission refusal (the fixture guesses `"refusal"`, while the
observed auth value is `"api_error"`).

The runner reads them defensively BECAUSE of this — objects or strings,
bounded at 16 entries and 128 bytes each, control-stripped
(`denial_names`, `app/src-tauri/src/agent/runner.rs`) — and a shape it
does not recognise degrades to an empty list, which falls through to the
existing `ExitNonZero`. So the failure mode is "no better than before",
never a wrong diagnosis. The auth path, which is the one with a live
user behind it, is transcribed and is unaffected.

**The close is one observation, not a build**: on an authenticated
machine, run a genesis whose planner reaches for a tool outside the
six-pattern allowlist, capture the `result` line, and reconcile
`fake_agent.rs`'s `tool-denied` scenario against it. T-025-s2 already
carries the exact command for driving the real CLI. Worth attaching to
the same session that finally observes one real planner turn.

---

**PARKED 2026-08-19 (fourth triage).** The close is one OBSERVATION, not
a build, and this machine cannot make it: the login is revoked and no
denial can be provoked without a model call, which T-029's fence forbids.
The runner reads the field defensively BECAUSE of this — objects or
strings, bounded at 16 entries and 128 bytes each, control-stripped — and
a shape it does not recognise degrades to the existing `ExitNonZero`.
So the failure mode is "no better than before", never a wrong diagnosis,
and the auth path (the one with a live user behind it) is transcribed
and unaffected.

**UNPARK AT the human-owned authenticated genesis run** recorded in
STATE: drive a planner at a tool outside the allowlist, capture the
`result` line, and reconcile `fake_agent.rs`'s constructed `tool-denied`
scenario against it. T-025-s2 carries the exact command for driving the
real CLI.

**T-069 DEPENDS ON THIS FOR ITS WIDER ARM.** T-029-s7's guard was
deliberately left narrow — requiring `result_is_error` rather than a
`terminal_reason` outside the normal-completion set — precisely because
that vocabulary is still a guess: the fixture's value is constructed
while the observed auth value is different. Until this is observed, the
conservative form is the only one resting on evidence.
