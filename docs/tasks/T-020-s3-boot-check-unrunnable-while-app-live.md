---
id: T-020-s3
title: The tauri boot check cannot be run end-to-end while the human's app holds 1420
status: suggested
suggested_by: executor claude-opus-5 @T-020
---

tools/e2e/scripts/tauri-boot-check.mjs bind-probes port 1420 and
aborts (exit 2, nothing spawned) when anything holds it, because
`tauri dev` starts vite on 1420 with `strictPort` and 1420 is the
human's live app on this machine. The guard is correct and it worked
exactly as designed during T-020's own verification — which is also
the problem: the human's app WAS running, so the shipped script's
happy path (both `[nputer]` startup lines detected, process tree
killed clean, exit 0) could not be exercised with the shipped file.

T-020 proved the mechanics against a scratchpad copy differing in
three mechanical lines (repoRoot literal, `TAURI_PORT` 14521, and a
`--config` override moving `tauri dev`'s vite to 14521 — CLI flags
only, tauri.conf.json untouched): both lines detected in 8 s, clean
SIGTERM tree kill, exit 0, no strays; and the forced 1-second timeout
path failing loudly with which needles were MISSING. Every logic path
is byte-identical to the shipped file, but the shipped file itself has
never completed a run on this machine.

The immediate consequence is an @human step that will recur for every
verifier and integrator of this lane: stop the live app, run
`node tools/e2e/scripts/tauri-boot-check.mjs`, expect exit 0, restart
the app. On Linux CI it never bites — the runner has no live app — so
this is a macOS-dev-loop cost only.

Options, deliberately not decided inside a hardening task:

1. **Leave it.** The friction is the guard doing its job, it is one
   command for a human who is already at the keyboard, and CI is where
   the check actually earns its keep. Any override is a way to
   accidentally contend for 1420.
2. **A narrow, loud override**: `NPUTER_BOOT_PORT` (default 1420) that
   also passes the matching `--config` `devUrl` /
   `beforeDevCommand` to `tauri dev`, printing a banner that the run
   is NOT on the production dev port. Makes the shipped script
   self-verifiable at the cost of a second port-discipline surface —
   note that the lane's playwright config went the opposite way and
   made 1420 a THROW rather than a knob, so this option should not be
   taken casually.

If option 2 is ever taken, the override belongs in CONVENTIONS'
port-rule bullet alongside `NPUTER_E2E_PORT`, and a lane spec should
assert that the override refuses to resolve back to 1420.
