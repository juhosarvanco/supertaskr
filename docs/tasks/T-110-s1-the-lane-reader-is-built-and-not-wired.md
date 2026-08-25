---
id: T-110-s1
title: The lane reader is built and not wired — one mod declaration and one zero-argument command, both in lib.rs
status: suggested
suggested_by: executor claude-opus-5 @T-110
---

T-110 built `dispatch::lanes::read_lanes` to its criteria and could not
connect it to anything, because both connectors live in **one file
outside `[app-dispatch]`**: `app/src-tauri/src/lib.rs`, C-05's
`app-shell`, held by T-123's live lane at that dispatch.

## What is missing, exactly

1. **`pub mod dispatch;`** beside `pub mod agent;` / `pub mod churn;`.
   Rust compiles no file that no module declares, so without this line
   the reader is not in the app binary at all.
2. **One `#[tauri::command]`** returning `LaneScan`, plus its
   `generate_handler!` entry — taking the app's IPC surface from
   FOURTEEN to FIFTEEN (derive both ends and intersect, the way T-029 and
   T-013 did; do not trust this figure).

**The command should be ZERO-ARGUMENT**, which is ADR-012's narrowness
rule applied rather than cited: the project root is already Rust-side in
`WatchState`, so no path needs to cross the webview boundary in either
direction — the same shape the four genesis commands and `repo_churn`
take. `acl_pin.rs` stays a 0-file diff at the 92-grant `core:default`
set; an app command is not a grant.

## What the commit that takes this must also do

**Delete `app/src-tauri/tests/dispatch_lanes.rs`.** That file is two
lines of `#[path]` wiring that exists only so `cargo test` can reach the
module while `lib.rs` cannot be touched; once `lib.rs` declares the
module, `#[path]` would compile it a SECOND time. Its own header carries
the argument for why it was written that way — including the fact that
`app/src-tauri/tests/**` is claimed by no component in
`docs/architecture/components/`, which is the standing T-113 used three
hours earlier for `tests/agent_runner.rs`.

## The fence

    touches: [app-dispatch, app-shell]

Dispatch it when `app-shell` is free. It is small enough to ride another
`app-shell` card rather than take a lane of its own — T-111 (`app-board`)
and T-112 (`app-dispatch, app-board`) both need this wiring before
anything they build can see a real lane, and **neither of them carries
`app-shell` today**, so the whole F-04 slice is currently fenced away
from its own delivery path. That is the finding worth acting on, not the
two lines.
