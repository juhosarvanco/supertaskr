---
id: T-040
title: The app stopped launching — a second binary, and no gate that runs it
feature: F-02
milestone: 3
priority: 7
size: S
status: done
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review: self-verified
---

Found by @human on 2026-08-16, launching the app for the visual review
session — the first time anyone had run it since T-025 merged. Fixed
inline by the architect because main was broken for the user in the
moment; recorded here so the record carries it, per the succession
rule.

**The regression.** `tauri dev` shells out to bare `cargo run`, which
refuses to guess once a package declares more than one `[[bin]]`.
T-025 added `src/bin/fake_agent.rs` (the scripted CLI its tests spawn
— a deliberate, verified design choice), making two. Every launch
since died with:

    error: `cargo run` could not determine which binary to run.
    available binaries: fake_agent, nputer

**The fix**: `default-run = "nputer"` in `[package]`, with the reason
recorded beside it. One line; `cargo test` unchanged at 200 passed +
3 ignored; the app launches and prints both `[nputer]` startup lines.

**Why NOBODY caught it — the part worth keeping.** Three sessions
(executor, adversarial verifier, integrator) each ran `cargo test`,
`cargo build`, and three consecutive full suites. All of them pass
happily with two binaries: the ambiguity only bites `cargo run`, and
the only thing that runs `cargo run` is the app. No agent runs the
app, by standing rule — verification is headless and @human does the
visual checks. So the one command that would have failed was the one
command the pipeline is forbidden to issue. T-025's fence made it
worse in an honest way: it declared zero diff to every manifest, so
the executor could not have added `default-run` even had it foreseen
the need.

**The systemic hole this exposes**: `tools/e2e/scripts/tauri-boot-check.mjs`
exists precisely to prove the app boots (T-020 §7 — it spawns
`tauri dev`, scans for both `[nputer]` lines, kills the tree, exits
0), and the T-001/T-020 precedent already rules that a briefly-opened
window is not screen control. But it runs only in the dormant CI job
and in one manual T-020 drill, so it guards nothing at merge time.
Filed as T-040-s1.

## Acceptance criteria
- THE package SHALL name its runnable binary so `cargo run` (and
  therefore `tauri dev`) is unambiguous regardless of how many test
  or fixture binaries the crate carries.
- THE app SHALL launch and print both `[nputer]` startup lines.
- THE cargo suite SHALL be unchanged (200 passed + 3 ignored).

## Implementation notes

Applied by the architect, 2026-08-16, directly on main — a one-line
manifest change with the user blocked on it. Evidence: before, exit
101 with the ambiguity error, no window; after, `Finished dev profile
… Running target/debug/nputer`, then `[nputer] project folder: …`,
`[nputer] window "main" created`, and the watcher arming on the root
sentinel. `cargo test` re-run after the change: 200 passed, 0 failed,
3 ignored. Diff: `app/src-tauri/Cargo.toml`, +7 (the key plus its
recorded reason). No lockfile movement; no source change.

## Verdicts

2026-08-16 — self-verified (S-tier, architect fix under a live block).
The proof is the app running and the suite green; both pasted above.
The interesting failure was not the bug but its invisibility, which
T-040-s1 carries forward.
