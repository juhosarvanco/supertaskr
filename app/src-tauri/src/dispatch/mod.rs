//! C-15 (F-04) — the dispatch surface, Rust half.
//!
//! **A lane is a fact on disk, and this module reads it there.** Git
//! already writes down every registered worktree under
//! `<repo>/.git/worktrees/<name>/`: `gitdir` names the worktree's own
//! `.git` file and `HEAD` names the ref it is on. Nothing has to be kept
//! in sync for that to be true, which is the whole argument for reading
//! it rather than transcribing it — every hand-written "which lanes are
//! live" sentence in this repository's checkpoints was stale within the
//! hour.
//!
//! Three properties hold by construction and each is pinned by a test in
//! [`lanes`]:
//!
//! 1. **No subprocess.** This is a FILE READ. ADR-003 commits the app to
//!    shelling out to agent CLIs; `git` is C-12's churn surface and its
//!    own card, not this one. `no_subprocess_in_this_module` sweeps this
//!    module's own source for the process API.
//! 2. **No webview grant.** The reader is Rust-side (ADR-012), so
//!    `acl_pin.rs` is a 0-file diff in the change that added this
//!    module.
//! 3. **No write.** [`lanes::read_lanes`] opens nothing for writing and
//!    creates nothing; `the_reader_writes_nothing` asserts it against a
//!    byte-for-byte snapshot of a fixture tree rather than assuming it.
//!
//! **WHAT THIS MODULE IS NOT WIRED TO, AND WHY.** No `#[tauri::command]`
//! registers it and `lib.rs` does not declare it: registration lives in
//! `app/src-tauri/src/lib.rs`, which is C-05's `app-shell` — outside
//! T-110's `[app-dispatch]` fence and held by a live lane at that
//! dispatch. The wiring is one routed suggestion (`T-110-s1`), and until
//! it lands this module is compiled and proven through
//! `app/src-tauri/tests/dispatch_lanes.rs`, whose header carries the
//! argument.

//! Callers reach the reader as `dispatch::lanes::read_lanes`. There is
//! deliberately no `pub use` re-export block here: until `lib.rs`
//! declares this module there is no caller to be ergonomic for, and a
//! re-export nothing imports is a warning in every build that compiles
//! this file through the test entry point.

pub mod lanes;
