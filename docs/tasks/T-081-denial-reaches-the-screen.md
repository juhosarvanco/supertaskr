---
id: T-081
title: A denial is news when it happens — the in-band channel the runner drops, and the fixture that was a guess
feature: F-03
milestone: 4
priority: 39
size: M
status: planned
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-029-s5 (fifth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

**T-029-s5's close condition was "one observation, not a build", and the
observation happened** — one authenticated planner turn against CLI
2.1.226 on 2026-08-19, recorded at `docs/research/real-cli-observation.md`
with the protocol lines preserved verbatim at
`docs/research/captures/real-planner-turn-2026-08-19.jsonl`. It answered
all three of s5's unknowns and turned up a fourth thing nobody had asked
about. Two of the four answers cost nothing; the other two are this card.

WHAT THE OBSERVATION SETTLED, AND WHY IT IS NOT WORK:

- `permission_denials` entries **are objects carrying `tool_name`**, on
  the `result` line, cumulatively. `denial_names()` reads `tool_name`
  first — **correct as written**, and the defensive string branch is
  now known-unused rather than unknown.
- `terminal_reason` for a completed turn reads **`"completed"`**, not
  the fixture's guessed `"refusal"`. This *vindicates* the narrow guard
  (`result_is_error && !denials.is_empty()`): the wider
  "`terminal_reason` outside the normal set" form would have needed
  `"completed"` in the normal set, and this run — **two denials with
  `is_error: false`** — is precisely the denial-then-recover turn that
  must never be reported as a failure. Do not widen it.

ONE MECHANISM, AND IT IS THE THING THE OBSERVATION FOUND BY ACCIDENT:
**the CLI announces a denial the moment it happens, on a channel the
runner throws away, and the app stays silent until the turn ends.**

    {"type":"system","subtype":"permission_denied","tool_name":"Bash",
     "tool_use_id":"toolu_…","decision_reason_type":"subcommandResults",
     "message":"This Bash command contains multiple operations. The
     following part requires approval: …","uuid":"…","session_id":"…"}

It carries `tool_name`, `tool_use_id`, `decision_reason_type`, `message`
and sometimes `decision_reason` — **and never `error` or
`error_status`**, so `classify_line`'s `"system"` arm returns `Ignored`.
Re-checked on HEAD after T-069 merged: still `Ignored`.

That is the same shape of silence T-069 just closed one layer up. T-069
made a parsed denial reach the screen instead of vanishing into an empty
tail; this one never reaches the parse at all. On the observed turn the
two denials were separated from the `result` line by **roughly forty
seconds** of recovery work, and during those forty seconds a watching
human had no way to know the agent had been refused anything.

**THE FIXTURE IS STILL A CONSTRUCTION AND NOW IT DOES NOT HAVE TO BE.**
`fake_agent.rs`'s `tool-denied` scenario was written from documented
field names — s5's central complaint. A real capture now exists. The
scenario should be transcribed from it the way the auth scenario was
transcribed from the 2.1.226 smoke, including the `decision_reason_type`
values actually seen (`subcommandResults`, `other`) which nobody guessed.

## Acceptance criteria

- THE runner SHALL classify a `system`/`permission_denied` line as a
  denial event rather than `Ignored`, keyed on the `subtype` and never
  on the presence of an error field — the discriminator SHALL be a
  positive shape, because the line's defining property is what it
  LACKS and a lack cannot be matched.
- THE denial SHALL reach the frontend at the moment it arrives, carrying
  the tool name and the CLI's own `message`, bounded and control-stripped
  by the same discipline `denial_names()` already applies. A pin SHALL
  assert the bound and the stripping on this path specifically — reusing
  the helper is not the same as being covered by its tests.
- **A DENIAL THAT THE TURN LATER RECOVERS FROM SHALL NOT MAKE THE TURN A
  FAILURE.** A pin SHALL drive the observed shape end to end: two
  `permission_denied` lines, then a `result` with `is_error: false`,
  `terminal_reason: "completed"` and both denials present — and SHALL
  require the turn to succeed while both denials were surfaced live.
  This is the observed case, not a synthetic one.
- **THE SAME DENIAL SHALL NOT BE REPORTED TWICE.** The `result` line
  carries the denials cumulatively and the in-band lines carry them
  individually; `tool_use_id` is present on both and is the join key. A
  pin SHALL show one denial reported once when it arrives on both
  channels, and SHALL show a `result`-only denial (no in-band line) still
  reported — the older CLI path must not regress to silence.
- THE `fake_agent.rs` `tool-denied` scenario SHALL be transcribed from
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl` rather than
  constructed, and its provenance SHALL be stated in the file the way the
  auth scenario's is. IF the transcription changes any assertion in the
  existing suite THEN the change SHALL be reported as a finding about the
  guess, never quietly absorbed.
- IF a `permission_denied` line arrives with no `tool_name`, an empty
  `message`, or a `tool_use_id` that no later `result` corroborates THEN
  it SHALL still be surfaced with what it has — a denial the app cannot
  fully describe is not a denial the user should be denied.
- THE existing `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
  pin SHALL stay green, and the three `#[ignore]` attributes SHALL remain
  exactly three.

Verification: headless — `cargo test` from app/src-tauri against the
transcribed fixture; `npm test` from app/ for the live surface; the boot
gate, because this touches `app/src-tauri/**`. Every new assertion
poisoned and shown RED before restoration, restorations proved by hash.
**No real model call** — the capture is a file. @human: whether a live
denial notice reads as information rather than alarm.

## Implementation notes

## Verdicts
