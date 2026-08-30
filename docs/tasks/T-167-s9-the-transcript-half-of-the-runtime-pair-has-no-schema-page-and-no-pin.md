---
id: T-167-s9
title: The transcript half of the runtime pair has no schema page and no pin — sessions.json is now documented and mechanically checked, transcript.jsonl is neither
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [method/runtime, app-agent]
suggested_by: executor claude-opus-5@subagent @T-167-s1
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-167-s1, NOT FIXED THERE.** That card's fence is
`method/runtime/sessions-schema.md` plus `app-agent` — ONE document, named
by path, deliberately narrowed at promotion so the blast radius would not
reach `runtime/nputer.yaml`, which is a `KIT_FILES` entry. Creating a
SECOND file under `method/runtime/` is outside it, and the bump question a
new method file raises belongs to triage before dispatch rather than to a
lane (CONVENTIONS, "what a bump is owed for").

## The asymmetry, now visible because its sibling was closed

`app/src-tauri/src/agent/sessions.rs` owns TWO runtime files, and its
module header names both in one sentence: `.nputer/sessions.json` and
`.nputer/genesis/transcript.jsonl`, "both losable by charter (ADR-017
clause 4)". After T-167-s1 the two are no longer treated alike:

- `sessions.json` has `method/runtime/sessions-schema.md`, and
  `the_written_registry_matches_the_sessions_schema_field_for_field`
  parses that document's own JSON example and compares it with a written
  entry BOTH WAYS, over a packed fixture and a packless one, with a
  positive control.
- `transcript.jsonl` has **no page in `method/runtime/` at all** — derive
  with `ls method/runtime/`, which returns exactly `nputer.yaml` and
  `sessions-schema.md` — and no test anywhere compares `TranscriptLine`'s
  written keys against any documented set.

## Why it is the same defect class, not merely a missing doc

`TranscriptLine` has the identical hazard that hid the tenth key for the
registry — a field that is skipped on write:

    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub machine: bool,

So `machine` is absent from every line where it is false, present where it
is true, and nothing states which. It is also `#[serde(rename_all =
"camelCase")]` while `SessionEntry` is snake_case, which is the same
convention split T-167-s1 had to write down for the pack object — and here
it is undocumented on the wire (`atMs`). The one assertion that touches
the spelling is a `raw.lines().all(|l| l.contains("\"atMs\""))` inside
`transcript_appends_one_line_per_half_turn_and_caps_text`, which pins ONE
key by substring and says nothing about the set.

## What a fix would decide

1. Whether the transcript gets its own page or a second section on the
   existing one. A second section is cheaper and keeps the two runtime
   files' contracts in one place, which is how `sessions.rs` already talks
   about them; a second file matches the current one-file-per-format
   layout. **This is the question that makes it a triage call and not a
   lane's.**
2. Whether the bump tests fire. Re-derive both at the fixing lane's own
   ref rather than taking T-167-s1's answer: test 1 (SHIPPED BYTES) turns
   on `KIT_FILES`, and a NEW file under `method/runtime/` is not
   automatically outside it the way an edit to an existing unshipped file
   was.
3. The pin, which should be the one T-167-s1 already built rather than a
   second implementation of it — `json_example`, `against_the_schema` and
   the non-empty guard in `sessions.rs`'s test module generalise to any
   documented object with one parameter change.

## Acceptance criteria

- THE transcript line's field set SHALL be documented under
  `method/runtime/`, with the shape DERIVED from `TranscriptLine` rather
  than transcribed from this card.
- THE document SHALL state the camelCase wire spelling and say that
  `machine` is omitted when false, absent meaning *not machine-assembled*.
- THE pin SHALL compare a written transcript line with the documented key
  set in BOTH directions, reusing T-167-s1's helpers rather than
  reimplementing them, and SHALL carry a positive control.
- THE lane SHALL re-derive both bump tests at its own ref and record the
  answer on this card, whichever way it falls.
- Verification: headless, the app crate's own `cargo test`.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
