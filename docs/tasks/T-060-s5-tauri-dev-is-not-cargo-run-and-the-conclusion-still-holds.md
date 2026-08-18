---
id: T-060-s5
title: "`tauri dev` is not `cargo run` — the .cargo/config.toml rejection is RIGHT, and its one-sentence mechanism is wrong"
status: suggested
suggested_by: verifier claude-opus-5 @T-060
---

**A docs correction, not a defect.** The decision it justifies is
correct and I verified it end to end. Filed because the sentence is
load-bearing — it is the whole reason the derived-default guard exists
rather than a one-line `[env]` entry — and because a future reader who
checks the mechanism will find it false and may conclude the decision
was unfounded. I did, briefly, before I measured.

## The sentence

`runner.rs`, `docs/ARCHITECTURE.md` and the card's implementation notes
all say:

> cargo applies `[env]` to `cargo run` as well as `cargo test`, and
> `tauri dev` IS `cargo run` from `app/src-tauri`

The first half is right. The second half is not.

## What `tauri dev` actually does, measured

- The tauri v2 CLI native binary contains **no `cargo run` string at
  all**. The only such string is `` Failed to run `cargo build` ``.
- The live process tree — the human's own app, read-only `ps` — is
  `npm run tauri dev` → `node …/.bin/tauri dev` → `target/debug/nputer`.
  **There is no cargo process between the CLI and the app.** `cargo run`
  would still be sitting there waiting on its child.

So the CLI runs `cargo build` and spawns the produced binary itself.

## Why the CONCLUSION is right anyway, measured end to end

I put `[env] NPUTER_VERIFIER_PROBE = "reached"` in
`app/src-tauri/.cargo/config.toml`, ran the boot check on scratch port
17480, and read the spawned app's environment with `ps -Eaxww`:

    NEW app process pid=60572
    exe: /Users/ujju/Projects/nputer-T-060/app/src-tauri/target/debug/nputer
    parent: node .../nputer-T-060/app/node_modules/.bin/tauri dev --config {...}
    NPUTER_VERIFIER_PROBE=reached
    CARGO=/Users/ujju/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo
    CARGO_HOME=/Users/ujju/.cargo
    CARGO_MANIFEST_DIR=/Users/ujju/Projects/nputer-T-060/app/src-tauri
    CARGO_PKG_AUTHORS=you

**The dev app inherits `[env]`.** It also carries the full `CARGO_*`
runtime set, which is how: the CLI reconstructs cargo's run environment
for the binary it spawns, and `[env]` rides along. The control is the
plain case — a binary `cargo build`-ed and then exec'd with no cargo
anywhere sees `Err(NotPresent)`, measured in a throwaway crate — so the
inheritance here is the tauri CLI's doing, not cargo's.

Therefore: an `[env] NPUTER_NO_REAL_CLI = "1"` entry in
`app/src-tauri/.cargo/config.toml` **would** have reached the human's
`tauri dev` app and rendered the hand-driven fallback forever, days
before the milestone-closing genesis run. The executor's rejection of
that mechanism is the right call, made for a reason that is true, stated
with a mechanism that is not.

The config was removed and the tree verified clean (`git status
--porcelain` empty) before this file was written.

## The ask

One sentence, in the three places it appears. Something like: *cargo
applies `[env]` to `cargo test`, and the tauri CLI reproduces cargo's
run environment for the app it spawns — measured: a `[env]` entry
reaches a `tauri dev` app — so the human's dev app would have inherited
the guard.* Same conclusion, mechanism a reader can check.
