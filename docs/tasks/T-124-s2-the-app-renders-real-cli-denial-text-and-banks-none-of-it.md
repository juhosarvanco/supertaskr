---
id: T-124-s2
title: The app renders the CLI's real permission text and banks none of it — this card's own evidence survives only because a human retyped it off the screen
status: suggested
suggested_by: executor claude-opus-5 @T-124
---

**FOUND WHILE LOOKING FOR SOMEWHERE DURABLE TO PUT T-124'S EVIDENCE.**
The three refusals T-124 is built on are real `claude` 2.1.226 permission
text from a live genesis turn. They exist today because a human read them
off the running app and typed them into `docs/STATE.md` — and STATE is
rewritten at every checkpoint, so by the time T-124 was dispatched they
survived only in a task card body and in the history of a file nobody
re-reads. **The app itself kept nothing.**

## Derived, not assumed

- `sessions::TranscriptLine` — the ONLY thing appended to
  `.nputer/genesis/transcript.jsonl` — is
  `{ turn, role, text, atMs, machine }`. There is no denial field.
  `git grep -c denial app/src-tauri/src/agent/sessions.rs` is **0**.
- Denials reach the screen through the live event channel:
  `runner::StreamLine::Denial` → the `genesis-turn` event →
  `agent-store.ts`'s `GenesisDenial`, which carries `toolName`,
  `toolUseId` and the CLI's `message`. **That path is entirely in
  memory.** Nothing on it writes to disk.
- `TurnError::ToolDenied` persists only `denials: Vec<String>` — the
  tool NAMES (`["Bash"]`). The `message`, which is the whole of the
  evidence, is not among them.

So the app has a channel that surfaces the single most expensive kind of
observation this project can make — real-CLI behaviour, which
`real_cli_arms_forbidden` structurally forbids any test from
reproducing (T-047-s6, T-060) — and it is write-only to a pane.

## Why it matters more than it looks

`docs/research/captures/` holds five files and is the project's durable
form for real-CLI evidence. The one JSONL in it
(`real-planner-turn-2026-08-19.jsonl`) is what let T-124 corroborate one
of its three reasons byte for byte; the other two are uncorroborable by
construction, and always will be. **The difference between the two turns
is not importance — it is that somebody happened to capture one.**

T-101's notice is what made denials visible at all, and its own
@human look is what produced this evidence. The next look will produce
more. There is currently no path from "the app saw it" to "the repository
has it" that does not run through a person retyping.

## What the fix might be — deliberately not decided here

Options, cheapest first:

1. **Add the denial to the transcript.** `TranscriptLine` gains an
   optional denial record, `append_transcript` writes it, and
   `read_transcript_tail` parses it. Additive and `#[serde(default)]`, so
   an older transcript still parses — the same discipline `machine: bool`
   already uses. But `transcript.jsonl` is `.nputer/` runtime data,
   LOSABLE BY CHARTER (ADR-017 clause 4), so this makes the evidence
   survive a checkpoint, not a `rm -rf .nputer`.
2. **A capture-on-demand command.** A zero-argument command that writes
   the current turn's raw stream to a file the human then moves into
   `docs/research/captures/`. Fits ADR-012 (zero webview grants, nothing
   sensitive transiting the boundary) and keeps the app a lens: the APP
   proposes, the human commits.
3. **Neither — write the protocol down instead.** Make "capture the
   JSONL before the pane scrolls" an explicit step of any @human look at
   a real-CLI turn. Costs nothing and is the option that would have
   worked on 2026-08-24.

## Fence note

The Rust half (`sessions.rs`, `mod.rs`, `runner.rs`) is **inside
`[app-agent]`**, which is why T-124 could see it. The render and store
half (`agent-store.ts` is app-agent, but the chat that draws a rehydrated
transcript is C-13/C-05) is not, and option 2 adds a command, which is an
ARCHITECTURE-level addition to C-14's documented four-then-eight. T-124
did not build any of this: none of it is on its acceptance criteria, and
its own card's strongest instruction is that a change made to look
productive is worse than no change.
