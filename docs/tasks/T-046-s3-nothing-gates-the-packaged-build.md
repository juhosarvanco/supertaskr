---
id: T-046-s3
title: The boot gate proves `tauri dev`; nothing proves the packaged build
status: parked
suggested_by: executor claude-opus-5 @T-046
---

T-046 closes the hole T-040 exposed for the DEV path: `cargo run` is now
issued by the pipeline, so a manifest key that only `cargo run` reads
can no longer break the app invisibly. The same argument, unchanged,
applies one step to the right and is not closed.

`npm run tauri build` runs a different program: release profile,
`beforeBuildCommand` (`npm run build`) instead of `beforeDevCommand`,
`frontendDist: "../dist"` instead of `devUrl`, the bundler with its
`icon` list and `targets: "all"`, and a binary that loads assets from the
bundle rather than from a vite server. Every gate in this repo — three
suites, the token lint, the audit, the E2E lane, and now the boot check —
runs against dev artefacts. Nothing in the pipeline has ever produced or
launched a packaged nputer.

The T-040 failure class transplants exactly. A missing or misnamed icon
path, a `frontendDist` that no longer matches where vite writes, a CSP
that only bites when assets are served from the bundle, an identifier
change that breaks signing — each is a one-line config edit that leaves
`cargo test`, `cargo build`, `npm run build` and the boot check all
green, and is discovered by a human trying to ship.

Why not now: cost and reach. A release build plus bundling is minutes,
not the 6–8 seconds a warm dev boot costs, which makes it wrong for the
per-merge BOOT GATE bullet in CONVENTIONS. macOS bundling may also want
signing identity the pipeline does not have, and the packaged app's
startup lines have never been checked to appear at all in a bundled run.

Shape worth considering, in rough order of cost: (1) a
`tools/e2e/scripts/tauri-build-check.mjs` sibling that runs
`npm run tauri build --no-bundle` and asserts the binary exists and is
executable — cheap, catches the frontendDist/compile class; (2) launching
that binary and scanning for the same two `[nputer]` lines — the true
analogue of the boot check, and the ruling that permits it is the same
one (@human, 2026-08-16: a process opening and closing its own window is
not screen control); (3) full bundling, which is a launch-prep decision
tangled with signing, not a gate.

A named growth step, not a hole to leave unwritten.

Triage 2026-08-17 (architect): PARKED — LAUNCH-PREP, on cost and reach
rather than on doubt. The argument transplants exactly and the failure
class is the T-040 one: a one-line config edit that leaves `cargo
test`, `cargo build`, `npm run build` and the boot check all green and
is discovered by a human trying to ship. What parks it is that a
release build plus bundling is minutes against the boot check's 6–8
seconds, which makes it wrong for the per-merge BOOT GATE bullet;
macOS bundling may want a signing identity the pipeline does not have;
and the packaged app's startup lines have never been checked to appear
at all.

Note this is parked on COST, not on "something else already covers
it" — nothing does, and that was verified rather than assumed: no
gate in this repo has ever produced or launched a packaged nputer.
Step (1) — the `--no-bundle` sibling asserting the binary exists and
is executable — is the cheap arm and the one to take FIRST, at launch
prep, beside the standing "watch the first CI run" item.
