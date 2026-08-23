---
id: T-070-s1
title: The card's premise is wider than the tree — only ONE start path still reaches cliNotFound without saying what was banked, and it is the one with no native id
status: suggested
suggested_by: executor claude-opus-5 @T-070
---

T-070's card says `genesis_start`, `genesis_resume` and `genesis_fresh`
"all resolve a CLI before they answer anything else, so a user with a
saved session and no CLI on their path gets `cliNotFound` and is never
told a session was recorded at all."

**RE-DERIVED AT `2036fb2`, READING THE THREE FUNCTIONS IN
`app/src-tauri/src/agent/mod.rs`, THE TREE SAYS SOMETHING NARROWER.**

- `start_genesis` reads `sessions::load` and `sessions::find_planner`
  **before** `runner::resolve_cli`, and returns
  `StartOutcome::ResumeAvailable { native_session_id, turns, model }` —
  the turn count included — with no CLI resolved. It also returns
  `SessionIdRejected` from that same block. A user with a usable saved
  session and no CLI therefore gets the count today, on the ordinary
  path.
- `resume_genesis` reads `sessions::genesis_record` before
  `resolve_cli` too, and answers `NothingToResume` or
  `SessionIdRejected` from it. It reaches `CliNotFound` only when the
  record is GOOD — where the count exists and is dropped.
- `fresh_genesis` is the only one that resolves a CLI before it looks at
  the registry at all. The card's sentence is exactly right about this
  one.

**SO THE LIVE HOLE IS ONE ARM WIDE AND IT IS WORTH NAMING**, because it
is the arm nobody looks at: `start_genesis`'s `Ok(None)` case — a
planner entry recorded with **no** `native_session_id`, which is what a
turn 1 that never produced an init line leaves behind. That entry has a
`turns` count and a `created` stamp and is skipped by the
`ResumeAvailable` arm, so the function falls straight through to
`resolve_cli` and answers `CliNotFound { probed }`. The record exists,
the command has already read it into `registry`, and the outcome carries
none of it.

**THE ARM:** add the record to `StartOutcome::CliNotFound` the way T-070
added it to `KickoffOutcome::Ready` — the registry is already loaded at
that point in `start_genesis`, so the read is free there too, and
`resume_genesis` would need one call. The webview's `cliNotFound` card
(`interview-cli-missing` in `app/src/genesis/InterviewChat.tsx`) is
where it would render, one sentence, beside the hand-driven button that
already leads to the block T-070 taught to say it.

WHY IT WAS NOT TAKEN HERE: T-070's criteria name `KickoffOutcome::Ready`
and the hand-driven block specifically, and widening `StartOutcome`
would move `agent-store.ts`'s `StartOutcomePayload`, three DOM bodies
that construct `cliNotFound` fixtures, and the resume path — scope this
card did not carry. The universal fallback IS reachable from that card
by one click, so the information is one press away rather than absent.

**AND THE PREMISE ITSELF SHOULD BE CORRECTED IN THE RECORD**, not only
the code: a reader who takes the card's sentence at face value will
believe `start_genesis` hides the turn count, and will "fix" a path that
already answers.
