---
id: T-040-s1
title: Nothing in the pipeline ever runs the app — make the boot check a merge gate
status: suggested
suggested_by: architect claude-opus-5 @T-040
---

T-040's bug was one line, and it survived an executor, an adversarial
verifier, and an integrator — each of whom ran `cargo test`, `cargo
build`, and in two cases three consecutive full suites. It survived
because the failing command was `cargo run`, and no gate in this
pipeline issues it. Verification is headless by standing rule; the
human does the visual checks; so "does the app still start" is
currently proven by nobody until a human happens to launch it.

The instrument already exists.
`tools/e2e/scripts/tauri-boot-check.mjs` (T-020 §7) spawns
`tauri dev`, scans merged stdout/stderr for BOTH `[nputer]` startup
lines, kills the process tree, and exits 0 — with a bind-probe on
1420 first so it refuses to contend with a live app, a no-output
watchdog, and an overall timeout. T-020's verifier exercised five of
its paths including a forked grandchild. It is wired into the dormant
CI job and was run manually once. It guards nothing at merge time.

The precedent for running it is already settled: T-001 and T-020 both
rule that a window opening on its own is not screen control — no
input is injected, no screenshot is taken, nothing is read off the
screen. The standing prohibition is on DRIVING the screen, not on a
process starting and stopping.

Proposal: the integrator runs `node tools/e2e/scripts/tauri-boot-check.mjs`
at any merge whose diff touches `app/src-tauri/**`, `app/src/**`, or
either manifest — the same trigger shape as the ratified graph-regen
rule, and recorded the same way in CONVENTIONS' Gotchas. Cost is one
debug build and a few seconds. It would have caught T-040 at T-025's
merge, before a human ever saw it.

Two things to decide when this is taken up: whether the 1420 bind
probe makes it unrunnable while the human has the app open (T-020-s3
already notes this — the integrator would need to skip loudly rather
than silently, or use a scratch port), and whether the same gate
belongs in the executor's green-gate list rather than only the
integrator's.
