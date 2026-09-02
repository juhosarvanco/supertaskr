---
id: T-236-s6
title: arch_cmd.rs carries an unused Path import, so every cargo build of the app crate prints a warning that is not news
feature: F-06
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [app/src-tauri/src/arch_cmd.rs]
suggested_by: executor claude-opus-5@subagent @T-236-s1
builder:
verifier:
built_by:
verified_by:
review: independent
---

**NO CLASS PARENT FOUND** — searched the live board for a card owning
compiler warnings in the app crate and found none. **DISPOSITION HINT:
promote at the lightest ceremony, or fold into the next lane whose fence
already reaches this file** — it is one word on one line, and its whole
value is that the next cargo run stops printing something a reader has to
decide to ignore.

**FOUND WHILE BUILDING T-236-s1, OUTSIDE ITS FENCE.** That lane is fenced
to `app/src-tauri/src/dispatch/brief.rs` alone, so this was recorded and
routed rather than fixed.

`app/src-tauri/src/arch_cmd.rs` opens with
`use std::path::{Path, PathBuf};` and never names `Path`, so every
`cargo build` and `cargo test` of the `nputer` crate emits
`warning: unused import: Path`. It was present at this lane's base
`80ab11ca99c4dd5064e865404b85bd389034d71c` — the file is untouched by
T-236-s1's diff — and the suite is green with it, so nothing is broken.

**WHY IT IS WORTH A LINE ANYWAY.** A build that always prints a warning
teaches every reader to skim warnings, and the next real one arrives into
that habit. `PathBuf` is used and stays; only `Path` goes.
