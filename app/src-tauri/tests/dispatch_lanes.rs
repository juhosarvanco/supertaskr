//! T-110: the compile-and-test entry point for `src/dispatch/**`.
//!
//! **THIS FILE IS TWO LINES OF WIRING AND IT NEEDS ITS ARGUMENT WRITTEN
//! DOWN, because it sits outside the card's fence.**
//!
//! T-110's `touches:` is `[app-dispatch]` = C-15 =
//! `app/src-tauri/src/dispatch/**` + `app/src/lib/dispatch-store.ts`.
//! Rust compiles no file that no module declares, so `cargo test` — the
//! verification the card itself prescribes ("headless — `cargo test`
//! from app/src-tauri against temp-directory fixtures") — cannot reach
//! `src/dispatch/**` unless something outside the fence names it. There
//! are exactly two candidates:
//!
//! 1. `app/src-tauri/src/lib.rs`, which is C-05's `app-shell`. That slug
//!    was HELD by a live lane (T-123) at this dispatch, so a one-line
//!    `pub mod dispatch;` there would have broken the pairwise-disjoint
//!    fence the four-lane dispatch was cut on — and
//!    `method/roles/executor.md` names widening the fence from inside the
//!    lane as "the one repair this role may never make".
//! 2. `app/src-tauri/tests/`, which is claimed by NO component in
//!    `docs/architecture/components/` — the same standing as
//!    `app/src-tauri/src/bin/`, and the same choice T-113 made three
//!    hours earlier when a lane fenced `[app-agent]` wrote
//!    `tests/agent_runner.rs` and `src/bin/fake_agent.rs` without
//!    widening anything.
//!
//! This is the second. It holds no assertion of its own: every test body
//! lives inline in `src/dispatch/lanes.rs`, INSIDE the fence, and this
//! file exists only so the compiler sees them. Registering the reader as
//! a Tauri command — and declaring `pub mod dispatch;` in `lib.rs` so the
//! app binary carries it — is `T-110-s1`, routed rather than annexed. The
//! commit that takes that suggestion DELETES this file, because
//! `#[path]` would then compile the module a second time.

#[path = "../src/dispatch/mod.rs"]
mod dispatch;
