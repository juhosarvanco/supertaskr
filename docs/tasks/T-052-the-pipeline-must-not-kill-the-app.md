---
id: T-052
title: The pipeline must not kill the app — one checkout, two owners
feature: F-02
milestone: 4
priority: 8
size: M
status: planned
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Nine instances across 2026-08-16/17, escalating from cosmetic to
fatal. The project's founding demo is "open the app and watch nputer
build itself on its own board" — and the pipeline that does the
building repeatedly disrupts, and finally kills, the app doing the
watching. Both behaviours are correct in isolation. They share one
working tree.

**The ladder, as observed:**
1–4. Hot reloads and restarts under the human mid-review (T-037,
   T-041, T-049 merges wrote `app/src`; T-047 wrote Rust and the app
   restarted, pid 1753 → 8392).
5. A lib-only merge (T-030) rebuilt `lib/parser/dist`, which the app
   serves through the `file:` symlink — the board's model badges
   changed under the human with no file under `app/` touched.
6. T-042's merge changed behaviour but not appearance (JS moved, CSS
   byte-identical) — invisible drift.
7. **Fatal, mechanism A**: `tauri dev` watches `app/src-tauri` while
   git rewrites it mid-merge. The watcher fired between git's unlink
   and write, `cargo` read a tree with no
   `crates/nputer-index/Cargo.toml`, and the app **exited 101**.
   Captured verbatim in the relaunch log.
8. **Fatal, mechanism B (the likelier cause of the same death)**: the
   integrator discipline runs FRESH INSTALLS on merged main
   (`npm ci`), which removes `node_modules` under the human's running
   vite. T-014's integrator found 1420 free and both pids gone, and
   exonerated the boot check (its kill is process-group scoped).
   Cause recorded honestly as undetermined between this and "the
   human quit".
9. A `zz-scope-probe.ts` appeared in the MAIN checkout's
   `app/src-tauri/crates/nputer-index/` and triggered two rebuilds.
   Agents are fenced to worktrees; which session wrote it is
   **unknown**, and that is recorded rather than guessed.

**Why this is a method question, not a bug.** Every rule involved is
individually right: fresh installs prove a merge on a clean tree;
`tauri dev` must watch its sources; the human must be able to run the
app while work proceeds. The method has no rule about the shared
tree, so the collision is invisible until something dies.

## Acceptance criteria
- THE method SHALL state, where an integrator will read it, that the
  main checkout may be in use by a human running the app, and SHALL
  name what an integrator may do to it. At minimum the fresh-install
  step needs a rule: run it somewhere that is not the human's
  `node_modules`, or detect a live dev server and refuse loudly (a
  skipped gate is news, never silence — the T-046 form).
- THE rule SHALL cover the `lib/parser/dist` path too: a merge that
  touches no file under `app/` can still change what the running app
  serves, through the `file:` dependency symlink. A reader who only
  knows "my diff is docs-only" must still learn this.
- WHEN an integrator's own work would disturb a running app THE
  checkpoint SHALL record it — the pipeline already reports this
  faithfully nine times over, and the practice SHALL be ratified
  rather than left to each session's conscience.
- THE recommendation for the human SHALL be recorded with its
  trade-offs: a second checkout for the live app is the obvious fix
  and costs a second `node_modules` and a second Rust target dir
  (measured before recommending); the alternative is accepting that
  the app restarts when the pipeline merges.
- IF a probe or scratch file is ever written into the main checkout
  THEN the method SHALL name it a violation and say where such files
  belong — instance 9 has no known author, which is itself the
  argument for writing the rule down.

Verification: headless — the method text, plus a demonstration that
the fresh-install rule actually protects a running server (start one
on a scratch port, run the integrator sequence, confirm it survives
or refuses loudly). @human: whether to adopt the two-checkout
recommendation, which is a workflow choice only they can make.

## Implementation notes

## Verdicts
