---
id: T-167-s10
title: The transcript line has THREE implementations of one field set and only two are compared — TypeScript's TranscriptLinePayload answers to nothing
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [app-agent]
suggested_by: executor claude-opus-5@subagent @T-167-s9
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-167-s9, NOT FIXED THERE.** That card asked for a
page and a pin over the RUST writer; a TypeScript-side comparison is a
different instrument and was not in its criteria. The path is inside its
fence, so this is a scope call rather than a fence one.

## The count is three, and the pin joins two of them

One transcript line's field set is written down in three places:

- `TranscriptLine` in `app/src-tauri/src/agent/sessions.rs` — the WRITER.
- `method/runtime/transcript-schema.md` — the page, new at T-167-s9.
- `TranscriptLinePayload` in `app/src/lib/agent-store.ts` — the READER,
  and its own doc comment calls itself a "Mirror of Rust's
  `TranscriptLine`".

`the_written_transcript_matches_the_transcript_schema_field_for_field`
compares the first two, in both directions, with a positive control. **The
third is compared with nothing.** A key added to the Rust struct and to
the page reds no TypeScript body; a key REMOVED from the wire leaves
`TranscriptLinePayload` declaring a field that never arrives, and the
interface is structural so nothing complains.

## Why it is the same defect class

It is the exact shape T-167-s1 named and T-167-s9 repeated: *a
transcription is a second implementation of the field set, and the two
disagree in silence.* The registry's tenth key hid for the same reason.
Here the mirror is a THIRD copy, and the word "Mirror" in its comment is
the aspirational sentence — the same kind `sessions.rs`'s header carried
before T-167-s1 made it mechanical.

The hazard has a live instance to reason from rather than a hypothetical:
`machine` is optional on BOTH sides for the same stated reason, so the two
agree today by having been written by hands that were paying attention.
Nothing on the merge path checks that the next hand does.

## What a fix would decide

1. **Which document is the authority for the TypeScript side.** The page
   is the natural answer — it already is for Rust — but the TS suite has
   no `include_str!`, so it needs a path resolved at test time and that is
   the question the DOCS GATE's ROOT_ANCHOR_LEDGER exists to argue.
   T-167-s1's Rust comment says in as many words why it did NOT climb to
   the repository root; a TypeScript reader cannot use that escape.
2. **Whether a structural interface can be compared at all.** A TS
   `interface` erases at runtime, so the key set is not enumerable the way
   `serde_json::Value`'s is. The likely shapes are a `satisfies`-checked
   literal key list beside the interface, or moving the mirror to a value
   the test can read.
3. Whether the same argument reaches the OTHER payload mirrors in
   `agent-store.ts`, which are numerous — this card names one and does not
   assume the answer generalises.

## Acceptance criteria

- WHEN `TranscriptLine` and `TranscriptLinePayload` name different field
  sets THEN a body in app/'s own suite SHALL red, naming both sides.
- THE comparison SHALL derive at least one side rather than transcribing
  it, and SHALL carry a positive control, per the shape T-167-s1 and
  T-167-s9 already use.
- Verification: headless, `npm test` from app/.
