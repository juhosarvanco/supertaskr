---
title: "`startup-failed` is pinned by two literals with nothing mechanical between them"
status: suggested
suggested_by: executor claude-opus-5 @T-063
---

T-063 added the app's SECOND webview→Rust event channel. The frontend
emits `STARTUP_FAILED_EVENT` (`app/src/lib/watcher-store.ts`) and Rust
listens for `STARTUP_FAILED_EVENT` (`app/src-tauri/src/lib.rs`). Two
constants, same value, **no mechanical relationship between them.**

**The failure mode is silent, and that is the whole point.** Rename one
side and: `tsc` passes, `cargo build` passes with zero warnings, the app
suite passes, the cargo suite passes, the e2e lane passes, and the boot
check exits 0 with both `[nputer]` lines. The only symptom is that the
one failure a user reports goes back to being the one the log cannot
describe — which is the exact defect this card exists to close, arriving
by a different door. `app.listen` on a name nobody emits is not an error
in Tauri, and `emit` to a name nobody listens for is not either.

**What T-063 did about it, and why it is not enough.** The TS test
asserts the LITERAL `"startup-failed"` rather than importing the
constant, so a rename on the TS side reds
`app/test/startup-recovery.test.ts`. The Rust side has no equivalent:
`STARTUP_FAILED_EVENT` is used once, at the registration, and the tests
exercise `startup_failed_line` which never sees the name. **So a Rust-side
rename passes everything.** That is the honest hole.

**It is not new and it is not only this channel.** `model-updated` has
had the same shape since T-003, and `docs-changed` and `genesis-turn`
since T-003 and T-025 — four channels, eight literals, zero joins. The
`PickOutcome` / `ProjectStatus` / `IndexOutcome` mirrors are the same
family ("Mirror of Rust's X" is a comment, not a check), though those at
least red loudly at runtime because a shape mismatch throws where a name
mismatch is simply quiet.

**Three closers, cheapest first.** (a) One cargo test asserting
`STARTUP_FAILED_EVENT == "startup-failed"` and one vitest asserting the
same literal — two dumb pins that make a rename a two-file edit instead
of a one-file silence. Costs four lines and closes THIS channel only.
(b) A single generated or shared manifest of channel names, read by both
sides — real, and the only version that scales to four channels. (c) A
lane assertion that every `app.listen(` name in `lib.rs` appears in
`app/src/**` and vice versa — a grep-shaped gate in the family of
`workflow-parity.spec.ts`, which already DERIVES its expectations from
CONVENTIONS bullets and reds when either side drifts. (c) is probably the
right size, and `tools/e2e` already owns that idiom.

Adjacent: **T-058** owns the searchability/gate family, and this is the
same question asked of a different pair of strings.
