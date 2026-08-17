---
id: T-061
title: The boot gate cleans up, and sees what it overlays
feature: F-02
milestone: 3
priority: 27
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-046-s1, T-046-s2, T-046-s4 (triage 2026-08-17). The
suggestion files are removed in the same commit as this card. Three
findings in `tools/e2e/scripts/tauri-boot-check.mjs` +
`boot-port.mjs` + `tools/e2e/tsconfig.json`, and T-046-s2 explicitly
says its own drill is the one T-046-s1 changes — so they are one card
or they are three re-runs of the same drill.

THE LEAK IS DEMONSTRATED, NOT ARGUED. Three of the four terminal paths
signal the process group via `finish()` then `killTree()`. The fourth
— `child.once("exit", …)`, the T-040 case and every future "the app
failed to boot" case — prints the report and calls `process.exit(1)`
immediately with nothing signalled (re-verified at triage:
`tauri-boot-check.mjs:226-236`, no `killTree` on that path). T-046's
verifier reproduced the orphan by SIGKILLing the tauri CLI mid-boot,
denying it the chance to tear down its own `beforeDevCommand`: the
check exited 1 with a correct legible report and left **a live vite
listener on 14521 plus an orphaned esbuild helper**. On the DEFAULT
path that listener is on **1420 — the human's port**, and the gate
would have broken the very thing it exists to protect.

Two things keep that from being merge-blocking and neither is a reason
to leave it: the CONVENTIONS BOOT GATE bullet mandates a scratch port
(a convention a tired human can forget), and CI runs on ephemeral
runners (true only while CI is the sole default-path caller).

## Acceptance criteria
- THE CHILD-EXIT PATH SHALL signal the process group before exiting.
  The naive `killTree("SIGTERM")` is NOT sufficient and the notes
  SHALL say why: `killTree` signals the negated child pid, and by the
  time the `exit` event fires node has reaped the child, so that pgid
  names a group whose leader is gone — on a busy machine a recycled
  pid could put the signal somewhere else. Capture the pgid at SPAWN
  time and signal it only if a zero-signal liveness probe on that
  pgid still succeeds (T-046-s1).
- THE ORPHAN DRILL SHALL BE A SHIPPED PROCEDURE, not a one-off:
  start the check on a scratch port, SIGKILL the tauri CLI mid-boot,
  and assert no vite listener and no esbuild helper survives the
  check's exit. The verifier's transcript is the failing case to
  reproduce first.
- THE OVERLAY SHALL BE DERIVED FROM THE COMMITTED VALUES so they stay
  load-bearing. Measured, both directions, at T-046: a broken
  `default-run` exits 1 and a dead `dev` script exits 1 (the
  reassuring half), while `devUrl` pointed at a dead port and
  `beforeDevCommand` pointed at a nonexistent script BOTH exit
  **0 — GREEN**. `beforeDevCommand`: take the committed string and
  append the port flags rather than emitting a fresh `npm run dev`
  (today the overlay hard-codes it, so a renamed committed script
  would silently run the wrong one). `devUrl`: rewrite only the PORT
  of the committed URL, leaving scheme and host. This shrinks the
  hole from "two whole keys unverified" to "one integer unverified"
  — it does not close it, and the notes SHALL say so (T-046-s4).
- THE TWO MUTATIONS ABOVE SHALL JOIN THE EXISTING FIXTURE DRILL (red
  then revert then green), alongside the two that already red.
- `checkJs` SHALL be ON for `tools/e2e`'s `.mjs` scripts, with
  `scripts/**/*.mjs` added to `include`. T-046 added `allowJs` so the
  lane spec could import `boot-port.mjs`, which means tsc now READS
  those JSDoc annotations to type the spec's imports but never CHECKS
  the script against them — a wrong `@param` silently mistypes the
  spec's expectations. Expect to fix the process-kill call where the
  child pid is `number | undefined` under strict, the `recent` array
  and `seen` set inferred from empty literals, and implicit `any` on
  stream chunks (T-046-s2).
- ALL FOUR EXIT-PATH DRILLS (0 / 1 / 2 / 3) SHALL be re-run after the
  flag flip, because the kill path is exactly what changes — which is
  why T-046-s2 asked for its own task and why it is here instead.
- THE DEFAULT PATH SHALL REMAIN untouched in shape: no change to the
  two `[nputer]` startup lines, the timeouts, or the report format.

Verification: headless — `npm run typecheck` from tools/e2e, the four
exit-path drills, the orphan drill, and the four config mutations.
**Every run on a scratch port; 1420 is the human's and SHALL be probed
free and left alone.** @human: none.

## Implementation notes

## Verdicts
