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
//!
//! **THE JOIN IS HERE AND NOT IN TYPESCRIPT, AND THAT IS THIS CARD'S
//! REBUILD — AND `T-126-s2` PUT IT IN BOTH.** [`join`] takes what
//! [`lanes`] read plus the board's stamps and names the four states the
//! card is about. T-110's first pass wrote it in
//! `app/src/lib/dispatch-store.ts`, where no suite could reach it —
//! `app/vitest.config.ts` collects `test/**` only, and both that config
//! and `app/test/**` were C-05's `app-shell`, outside that card's fence —
//! so four one-side-only producer mutants survived the whole app suite at
//! exit 0. The same rule under `src/dispatch/**` is inside C-15's own
//! path and runs under `cargo test`, which is why it moved here.
//!
//! `T-198` then declared C-15's own `app/test/**` path and landed
//! `app/test/dispatch-store.test.ts`, discharging the one objection the
//! 2026-08-31 architecture sitting left standing against a TypeScript
//! join — so `T-126-s2` built it, and `dispatch-store.ts`'s `joinLanes`
//! is what the webview reaches. [`join`] stays compiled, unreachable from
//! the webview, still exercised by `cargo test`, and still depended on by
//! [`brief`] for its `LaneScanRefusal`; whether it is REMOVED is
//! `T-126-s8`, a decision the ruling did not take. The drift between the
//! two spellings is held by a pin rather than by a promise —
//! `the_rust_join_and_this_one_spell_one_rule` reads [`join`]'s source
//! and requires the two vocabularies to agree.

//! Callers reach the two halves as `dispatch::lanes::read_lanes` and
//! `dispatch::join::join_lanes`. There is deliberately no `pub use`
//! re-export block here: until `lib.rs` declares this module there is no
//! caller to be ergonomic for, and a re-export nothing imports is a
//! warning in every build that compiles this file through the test entry
//! point.

pub mod brief;
pub mod join;
pub mod lanes;

/// The fixture repositories BOTH halves are proved against, in ONE place
/// — a temp-directory `.git/worktrees` written byte for byte the way git
/// writes it. Test-only, so the app binary carries none of it.
#[cfg(test)]
pub mod fixtures;
