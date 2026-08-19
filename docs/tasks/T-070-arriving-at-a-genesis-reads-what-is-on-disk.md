---
id: T-070
title: Arriving at a genesis reads what is on disk — bounded, and without a CLI
feature: F-03
milestone: 3
priority: 13
size: M
status: planned
blocked_by: []
touches: [app-agent, app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-029-s2, T-029-s3 (fourth triage, 2026-08-19). The suggestion
files are removed in the same commit as this card. Both are the same
seam — what the app reads out of `.nputer/` when the interview screen
mounts — and T-029 is what made that seam reachable in production for
the first time.

THE BOUND IS AT THE WRONG END. `sessions::append_transcript` caps ONE
LINE at `TRANSCRIPT_TEXT_CAP` (256 KiB) and appends forever; nothing
rotates, truncates, compacts or deletes. Until T-029 nothing ever read
the file back in production — it was a write-only cache whose only
reader was a test. Now `genesis_transcript` reads the WHOLE file on
every arrival at the interview screen, `fs::read_to_string`s it, parses
every line, and throws all but the last `MAX_REHYDRATED_LINES` (200)
away. The cap protects the webview; nothing protects the read. Three
honest mitigations hold and none is a fix: the file is losable by
charter so deleting it is always safe, the per-line cap bounds any
single turn, and 200 lines is a generous conversation. Every failure
mode here is a slow read, never a wrong answer — which is why this is
sized beside its sibling rather than alone.

AND THE ONE SCREEN THAT COULD SAY SO NEEDS A CLI TO BE REACHED.
`genesis_start`, `genesis_resume` and `genesis_fresh` all resolve a CLI
before they answer anything else, so a user with a saved session and no
CLI on their path gets `cliNotFound` and is never told a session was
recorded at all. The information exists and costs nothing:
`sessions::genesis_record` reads `.nputer/sessions.json` with no CLI
anywhere in the call. The hand-driven mode they are routed to is correct
and complete, and it says nothing about the turns they already banked
with a CLI they have since uninstalled or renamed. **This is the same
delivery-not-detection shape T-029's whole spine is about, one layer
out.** Ordering note for the executor: `genesis_kickoff` deliberately
does NOT resolve a CLI — that is what makes it the universal fallback —
so the record read is free there.

## Acceptance criteria
- THE transcript read SHALL be bounded AT THE READ, not only at the
  webview: read the tail (seek from the end, or a line budget while
  reading) so a file measured in tens of MiB costs a bounded read rather
  than a whole-file parse. `TRANSCRIPT_TEXT_CAP`'s per-line cap stays.
  IF a file cap with rotate-aside is chosen instead THEN it SHALL follow
  the `sessions.json.corrupt` precedent already in this module, and the
  losable-by-charter property SHALL be preserved either way.
- A pin SHALL prove the read is bounded by CONSTRUCTION and not by the
  fixture: a transcript whose line count and byte size both exceed the
  rehydration budget by a wide margin SHALL be shown to cost a read
  proportional to the budget, not to the file.
- `KickoffOutcome::Ready` SHALL carry the `GenesisRecord` when one
  exists, so the universal fallback answers the question the CLI-gated
  commands cannot.
- THE hand-driven block SHALL say what was banked — the turn count and
  where the artifacts are — in one sentence. No new command, no CLI on
  the path, no new IPC surface.
- A pin SHALL drive the CLI-LESS path end to end and assert the banked
  count reaches the DOM, so "the record exists" and "the record is
  delivered" cannot be confused for one another. WHAT the hand-driven
  card says is a copy judgment; THAT it says something is this card's
  criterion.

Verification: headless. Rust unit and integration tests for the bounded
read and the record carry; one app-side DOM test for the CLI-less
arrival. No real CLI, no model.

FENCE NOTE: the Rust half is `agent/mod.rs` and `agent/sessions.rs`; the
TypeScript half is one block in `InterviewChat.tsx`. **This card cannot
run beside T-069** — both hold `app-agent`.

## Implementation notes

## Verdicts
