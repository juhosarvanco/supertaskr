---
id: T-029-s3
title: The fresh-session and resume affordances need a CLI to be reachable, so the one screen that offers them is the one a CLI-less user never sees
status: suggested
suggested_by: executor claude-opus-5 @T-029
---

T-029 renders the resume offer, the unusable-saved-session affordance and
"Start a fresh session" inside `InterviewChat` — the LEFT half of the
genesis split. Every one of them is driven by a typed outcome from
`genesis_start`, `genesis_resume` or `genesis_fresh`, and all three of
those resolve a CLI before they can answer anything else
(`runner::resolve_cli`, called in `start_genesis`, `resume_genesis` and
`fresh_genesis` in `app/src-tauri/src/agent/mod.rs`).

The consequence, which is small but real: a user with a saved session and
NO CLI on their path gets `cliNotFound` from `genesis_start` and never
sees that a session was recorded at all. The information exists —
`sessions::genesis_record` reads it from `.nputer/sessions.json` with no
CLI anywhere in the call — but nothing surfaces it on that path. The
hand-driven mode they are routed to is correct and complete, and it says
nothing about the four turns they already banked with a CLI they have
since uninstalled or renamed.

**This is the same delivery-not-detection shape T-029's whole spine is
about, one layer out**, which is why it is filed rather than fixed: the
fix is a judgment about what the hand-driven card should say, not a
mechanism. The obvious version is for `KickoffOutcome::Ready` to carry
the `GenesisRecord` when one exists, so the hand-driven block can say
"there are 4 banked turns here; docs/ has them" — one field, one
sentence, no new command.

Ordering note for whoever takes it: `genesis_kickoff` deliberately does
NOT resolve a CLI (that is what makes it the universal fallback), so the
record read is free there.
