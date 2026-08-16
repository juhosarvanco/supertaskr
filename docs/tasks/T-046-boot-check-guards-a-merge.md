---
id: T-046
title: The boot check guards a merge — and stops refusing to run
feature: F-02
milestone: 3
priority: 7
size: S
status: planned
blocked_by: []
touches: [tools/e2e/, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-020-s3, T-040-s1. Triage 2026-08-16: these arrived hours
apart and are one task. T-040-s1 proposes making
tools/e2e/scripts/tauri-boot-check.mjs a merge gate, because T-040 —
a one-line manifest regression that stopped the app launching at all —
survived an executor, an adversarial verifier and an integrator, all
of whom ran `cargo test`, `cargo build` and three consecutive suites.
It survived because the only failing command was `cargo run`, and no
gate in this pipeline issues it. T-020-s3 records why the instrument
cannot be used as-is: it bind-probes 1420 and exits 2 when anything
holds it, which on a macOS dev loop is most of the time. A gate that
no-ops whenever the human's app is open is not a gate. T-020-s3's
option 2 was written as "do not take this casually"; T-040-s1 is the
reason to take it.

STANDING-RULE NOTE, for the human to confirm rather than inherit:
this task has the pipeline start the app. T-001 and T-020 both ruled
that a window opening and closing on its own is NOT screen control —
no input injected, no screenshot taken, nothing read off the screen;
the prohibition is on DRIVING the screen. This task relies on that
ruling and does not extend it. **Do not dispatch without that nod.**

## Acceptance criteria
- THE boot check SHALL be runnable beside a live app via a narrow,
  loud `NPUTER_BOOT_PORT` (default 1420), which also threads the
  matching `--config`
  `{"build":{"devUrl":…,"beforeDevCommand":"npm run dev -- --port …
  --strictPort"}}` through to `tauri dev` — CLI flags only, never an
  edit to tauri.conf.json, the exact mechanics T-020 already exercised
  on 14521.
- IF `NPUTER_BOOT_PORT` resolves to 1420 THEN the script SHALL REFUSE
  loudly — the override must never become a second way to contend for
  the human's app — and a lane spec SHALL assert the refusal, the same
  shape as the playwright config's existing 1420 throw. The override
  SHALL be recorded in CONVENTIONS' PORT RULE bullet beside
  `NPUTER_E2E_PORT`.
- THE existing three exit paths SHALL be unchanged and still proven:
  exit 0 with both `[nputer]` startup lines and a clean process-tree
  kill; exit 1 on timeout; exit 2 on a busy port with its correct
  explanation.
- THE integrator practice SHALL be ratified in docs/CONVENTIONS.md
  beside the T-009-s1 graph-regen rule: at any merge whose diff
  touches `app/src-tauri/**`, `app/src/**` or either manifest, run the
  boot check and record the result. IF the check cannot run THEN the
  integrator SHALL say so LOUDLY in the checkpoint — a skipped gate is
  news, never silence.
- THE T-040 regression SHALL be the fixture proving the gate works:
  with `default-run` removed from app/src-tauri/Cargo.toml the check
  SHALL exit non-zero with the ambiguity error captured. The one
  command that would have caught it, now issued by the pipeline.
- WHETHER the same gate belongs in the EXECUTOR's green-gate list
  rather than only the integrator's SHALL be decided and recorded in
  this file before dispatch (T-040-s1's second open question).

Verification: headless — the script kills its own process tree; the
lane spec for the 1420 refusal runs under `npm test`. Nothing binds or
contacts 1420 during verification. @human: none, beyond confirming the
standing-rule note above.

## Implementation notes

## Verdicts
