---
id: T-046-s4
title: The boot gate cannot see regressions in the two config keys its own `--config` overlay replaces
status: suggested
suggested_by: verifier claude-opus-5 @T-046
---

T-046's override threads
`--config {"build":{"devUrl":…,"beforeDevCommand":…}}` so the check can
boot on a scratch port beside the human's app. That overlay does exactly
what it must — and in doing so it stops testing the two committed values
it replaces. The gate is blind precisely where it overlays.

**Reproduced, both directions** (worktree ../nputer-t046 at `9b2832b`,
`NPUTER_BOOT_PORT=14521 npm run boot:check`, one mutation at a time,
each reverted):

| mutation | result |
| --- | --- |
| `Cargo.toml` `default-run = "nputrr"` (T-040's class, different member) | **exit 1**, cargo's `default-run target 'nputrr' not found` quoted verbatim, with its `help: a target with a similar name exists` |
| `app/package.json` `"dev": "true"` (dev server never starts) | **exit 1**, tail shows `Warn Waiting for your frontend dev server to start on http://localhost:14521/...` |
| `tauri.conf.json` `devUrl` → `http://localhost:14999` (dead) | **exit 0 — GREEN** |
| `tauri.conf.json` `beforeDevCommand` → `npm run no-such-script-at-all` | **exit 0 — GREEN** |

The first two are the reassuring half: the gate catches other members of
the T-040 class, and its failure output is legible enough to diagnose
from without re-running anything. The last two are the hole. Either of
them ships an app that will not launch for the human, and the gate
CONVENTIONS tells the integrator and the executor to run reports green.

**Why it is narrow, and why it still matters.** The default path (no
`NPUTER_BOOT_PORT`) threads no overlay and therefore does test both keys
— that is CI's path, on a Linux runner where 1420 is free. So the hole
is specific to the OVERRIDE path, which is the one the BOOT GATE bullet
mandates for every local run beside a live app, i.e. the path that will
actually be exercised for the foreseeable future. CI is dormant until
the repo's first push.

It is also not a bug in the implementation: criterion 1 prescribes this
exact mechanism, and moving one key without the other hangs the check on
a URL nothing serves. The overlay has to move both. The question is only
whether it must DISCARD both.

**Shape worth considering.** Derive the overlay from the committed values
instead of hard-coding them, so the committed values stay load-bearing:

- `beforeDevCommand`: take the committed string and append
  `-- --port N --strictPort` rather than emitting a fresh
  `npm run dev -- …`. A committed command renamed to `npm run dev:app`,
  or broken outright, then still breaks the check. (Today the overlay
  hard-codes `npm run dev`, so it would also silently run the wrong
  script if the committed one were ever renamed — the same blindness,
  one step further.)
- `devUrl`: rewrite only the PORT of the committed URL, leaving scheme
  and host. A devUrl pointing at a dead host, or at `https` where vite
  serves `http`, is then still caught; only a wrong port is masked, and
  a wrong port is the one thing the override is entitled to change.

Both are small, both are in `bootConfigJson` alone, and both want the
same drill T-046 already has (fixture red → revert → green) re-run with
the two mutations above added to it. Neither closes the hole completely
— a config key the overlay does not name is tested either way, and one
it does name can only ever be partially tested — but they shrink it from
"two whole keys unverified" to "one integer unverified".

Until then this is an honest limit of the gate, and belongs beside the
`tauri build` limit in T-046-s3: the boot check proves the app boots on
the port you told it to, not that the committed config would have booted
it.
