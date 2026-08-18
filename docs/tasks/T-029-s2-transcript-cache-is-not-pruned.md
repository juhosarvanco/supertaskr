---
id: T-029-s2
title: .nputer/genesis/transcript.jsonl grows without bound — append-only, never pruned, and now rehydrated on every arrival
status: suggested
suggested_by: executor claude-opus-5 @T-029
---

`sessions::append_transcript`
(`app/src-tauri/src/agent/sessions.rs`) caps ONE LINE at 256 KiB
(`TRANSCRIPT_TEXT_CAP`) and appends forever. Nothing rotates, truncates,
compacts or deletes it, and a genesis that runs a long interview with
large planner turns can leave a file measured in tens of MiB in the
user's project directory.

**T-029 makes this reachable in a way it was not before.** Until this
task nothing ever READ the file back in production — it was a write-only
cache with a test as its only reader. Now `genesis_transcript` reads the
whole file on every arrival at the interview screen
(`refreshGenesisTranscript`, called from `InterviewChat`'s mount effect),
`fs::read_to_string`s it entirely, parses every line, and then throws all
but the last 200 away (`MAX_REHYDRATED_LINES`, `agent/mod.rs`). The
BOUND is at the wrong end: the cap protects the webview, not the read.

Three honest mitigations already hold and none of them is a fix: the
file is losable by charter, so deleting it is always safe; the per-line
cap bounds any single turn; and 200 lines is a generous conversation. The
gap is that nothing bounds the FILE, and the reader now pays for the
whole of it.

Cheap closes, in order of preference: read the tail rather than the
whole file (seek from the end, or a line budget while reading); or cap
the file at N MiB with a rotate-aside on append, which matches the
`sessions.json.corrupt` precedent already in this module. Either is
small and neither changes a type.

Not a blocker: nothing here is a correctness bug and every failure mode
is a slow read, not a wrong answer.
