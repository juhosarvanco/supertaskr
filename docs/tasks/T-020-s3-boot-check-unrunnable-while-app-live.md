---
id: T-020-s3
title: The tauri boot check cannot run while the human's app holds 1420 — a recurring macOS dev-loop cost
status: suggested
suggested_by: executor claude-opus-5 @T-020
---

tools/e2e/scripts/tauri-boot-check.mjs bind-probes port 1420 and
aborts (exit 2, nothing spawned) when anything holds it, because
`tauri dev` starts vite on 1420 with `strictPort` and 1420 is the
human's live app on this machine. The guard is correct and both of its
branches are proven (T-020 §9.6: exit 2 against a real live app; exit
0 with both `[nputer]` startup lines and a clean process-tree kill
once 1420 was free; exit 1 on a forced 1-second timeout). Nothing is
broken — this is the shape of the friction, filed so it is a decision
rather than a surprise.

The cost: `npm run boot:check` is unrunnable for any developer,
verifier or integrator whose own app is open, which on a macOS dev
loop is most of the time. They get exit 2 with a correct explanation
and must stop the app for ~10 seconds. On Linux CI it never bites —
the runner has no live app — which is where the check actually earns
its keep, so the cheapest answer may well be "leave it".

Options, deliberately not decided inside a hardening task:

1. **Leave it.** The friction IS the guard doing its job, it is one
   command for a human already at the keyboard, and any override is a
   new way to accidentally contend for 1420.
2. **A narrow, loud override**: `NPUTER_BOOT_PORT` (default 1420),
   which must also pass the matching `--config`
   `{"build":{"devUrl":…,"beforeDevCommand":"npm run dev -- --port …
   --strictPort"}}` through to `tauri dev` — CLI flags only, the way
   T-020 exercised the mechanics on 14521 without touching
   tauri.conf.json. It makes the script runnable beside a live app at
   the cost of a second port-discipline surface. Note the lane's
   playwright config went the OPPOSITE way and made 1420 a hard THROW
   rather than a knob, so this should not be taken casually.

If option 2 is ever taken, the override belongs in CONVENTIONS'
port-rule bullet alongside `NPUTER_E2E_PORT`, and a lane spec should
assert that the override refuses to resolve back to 1420.
