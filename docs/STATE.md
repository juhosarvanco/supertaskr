# State

Updated: 2026-08-14 by T-003 integrator, claude-fable-5 @fresh

## Just completed
T-003 (docs watcher + live reload; app-shell + lib-parser) is DONE
and merged — the FIRST task approved on its first verification pass
(no rejection). What ships: a Rust debounced watcher (250ms,
notify-debouncer-mini) over `<project>/docs` emits ONE full-tree
snapshot per surviving batch; the webview parses it via
@nputer/parser's browser-safe pure exports (`./pure`,
parseProjectFromFiles) and keeps per-file last-good state with a
non-blocking parse-error badge. The ≤1s change→model criterion holds
to ~2000 files / ~19MB of markdown (verifier-probed; the only breach
observed at ~29MB — suggestion T-003-s2). Zero new capabilities and
zero CSP diff (ADR-010 held). Wiring: app now depends on the parser
via `file:../lib/parser` (ADR-011) — on a fresh clone, build the
parser BEFORE the app. Full suite green on merged main: parser 78/78
+ tsc + build; app build exit 0 + tests 13/13; cargo 7/7; tauri dev
boots with both `[nputer]` lines and a clean seq=1 echo.

## In progress / broken right now
Nothing in flight; nothing broken. T-003 worktree removed, branch
kept.

## Next up (1–3)
1. @human decision: dispatch T-004 (story map board, size L) — the
   ONLY dispatchable card. Its blockers T-001/T-002/T-003 are all
   done and its planning pass is complete (commit e3fd541, spec in
   the task file); per the method's size-L rule it awaits explicit
   @human approval before dispatch. T-005/T-006 are blocked by
   T-004; T-007 by T-003+T-004.
2. Architect triage of NINE open suggestions: T-001-s1/s2/s3,
   T-002-s1/s2/s3, T-003-s1/s2/s3.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

Known caveat carried forward: the Linux halves of T-001's and
T-003's window criteria remain machine-unverified (see T-001-s3).

## Open questions
None.
