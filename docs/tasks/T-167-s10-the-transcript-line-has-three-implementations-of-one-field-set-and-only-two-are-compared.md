---
id: T-167-s10
title: The transcript line has THREE implementations of one field set and only two are compared — TypeScript's TranscriptLinePayload answers to nothing
feature: F-03
milestone: 4
priority: 4
size: S
status: planned
blocked_by: []
touches: [app-agent]
suggested_by: executor claude-opus-5@subagent @T-167-s9
builder:
verifier:
built_by:
verified_by:
review: independent
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

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Absorbs T-167-s12** — the section below. `review: independent` set.

## Absorbs: T-167-s12 (2026-09-02)

Add the one-line VALUE assert on the PARSED example —
`assert_eq!(example["machine"], true, …)` in `transcript_line_keys`
(app/src-tauri/src/agent/sessions.rs) — so `"machine": false` in
`method/runtime/transcript-schema.md`'s example reds `cargo test` naming
the page and the value. Measured by T-167-s9's verifier at 07831da: that
mutation left `cargo test --lib` at 261 passed, exit 0. The second-example
redesign T-167-s12 offered is REFUSED as scope: it redesigns the pin's
expected side, and the one-liner closes the measured hole.

Criteria added by the absorption:

- WHEN the page's example carries `"machine": false` THEN `cargo test`
  from app/src-tauri SHALL red, naming the page and the value.
- THE new assertion SHALL be shown able to fail by that drill, with the
  restoration proved by sha256.
- THE existing guards and both comparison directions SHALL be unchanged.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
