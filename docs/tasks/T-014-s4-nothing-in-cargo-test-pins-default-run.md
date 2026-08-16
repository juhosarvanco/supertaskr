---
id: T-014-s4
title: A third workspace binary landed and only the boot gate stands between it and T-040
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

T-014 adds `[[bin]] nputer-index` to the workspace. `cargo run` from
`app/src-tauri/` — which is exactly what `tauri dev` shells out to —
now chooses among **three** binaries across **two** default-member
packages: `nputer`, `fake_agent` (T-025's fixture, the binary that
caused T-040) and `nputer-index`.

It works, and it was probed rather than assumed. In a scratch workspace
of exactly this shape (root package with two bins + `default-run`, a
default-member child with a third bin), bare `cargo run` runs the root
package's binary; with the `default-run` line deleted it fails with
cargo's `could not determine which binary to run`, listing all three.
The real workspace agrees: `cargo run --bin __no_such_bin__` reports
"no bin target named … in default-run packages" and lists all three, and
the boot gate on scratch port 14522 booted the app and printed both
`[nputer]` startup lines, exit 0.

So `default-run = "nputer"` — one line added by T-040 for a two-binary
problem — is now load-bearing for a THREE-binary problem in TWO
packages, and the only thing that would notice its loss is the boot
gate: a CONVENTIONS-level, human-or-CI ritual, not `cargo test`. T-046
measured that the gate does catch it. But every gate that catches it is
outside the fast loop, and the surface it guards just got wider without
the guard changing.

**The cheap close**: one assertion in a suite that already runs on every
`cargo test` — read `app/src-tauri/Cargo.toml`, require
`default-run = "nputer"`, and say in the failure message why (with the
T-040 reference). It is a manifest read, no build, no spawn. The
awkwardness is ownership: the natural home is the app crate's own
suite (`app/src-tauri/src/**`, outside T-014's fence), and putting it in
`nputer-index` would mean the indexer crate asserting something about
its parent. That choice is why this is filed and not built.

The sharper version of the same worry, worth a sentence at triage: a
FOURTH binary, or a rename of the `nputer` bin, breaks `default-run`
in a way whose only symptom is that the app stops launching — the exact
T-040 signature, invisible to `cargo test`, `cargo build` and three
full suites.
