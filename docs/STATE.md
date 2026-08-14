# State

Updated: 2026-08-15 by T-007 integrator, claude-fable-5 @fresh

## Just completed
T-007 (app opens own repo; app-shell) is DONE and merged — size M
(architect resize S→M for the dialog IPC surface). The headline: the
folder picker adds ZERO new webview surface — the native dialog is
invoked Rust-side only (no npm dialog bindings shipped), capabilities
still carry exactly `core:default`, verifier-proven via a
mock-runtime ACL probe (`plugin:dialog|*` all denied from the
webview; pattern recorded as ADR-012). Launch resolution is honest
now: cwd walk-up → canonicalized-exe walk-up → none → friendly empty
state + picker (the silent cwd fallback that would watch a
nonexistent /docs is gone). The watcher is re-armable (control
thread, arms the new watch before dropping the old, idle-alive with
no project — the minimal internal slice of T-003-s1), and
cross-project isolation is pinned: global monotonic seq, model reset
on projectDir change, a same-named file can never fall back to the
OLD project's last-good content. Full suite green on merged main:
parser 78/78 + tsc + build; app build exit 0 + tests 61/61; cargo
20/20; tauri dev boots clean — project folder resolved via cwd
walk-up, window created, watcher armed, seq=1 echo 21 tasks / 5
features / 0 issues (21 matches docs/tasks/ exactly).

## In progress / broken right now
T-005 (card detail, M) on branch t005-card-detail: fix pass landed
(pointerdown dismissal), re-verification IN PROGRESS in its own
worktree (/Users/ujju/Projects/nputer-t005 — do not enter) —
integrates separately when its verdict is APPROVED. Nothing broken.

## Next up (1–3)
1. T-005 re-verdict → integrate when APPROVED.
2. T-006 (design language, M) — the sole remaining milestone-1 card,
   awaiting the external design token sheet
   (docs/design/design-handoff.md v3, sent to Claude Design);
   dispatches when it returns and the board is free.
3. Then: architect triage of the FOURTEEN open suggestions —
   T-001-s1/s2/s3, T-002-s1/s2/s3, T-003-s1/s2/s3, T-004-s1/s2,
   T-007-s1/s2/s3 — and the domain (.dev/.fi/.com) + trademark
   sweep for "nputer".

For the @human (visual-confirmation precedent, T-001/T-007): the
three dialog-widget flows on the real screen — pick a
convention-layout folder → board re-renders and live-updates; pick a
docs-less folder → empty state names it, "keep current project"
returns to the board; Escape/cancel → no change (fixtures: any
folder with a docs/*.md tree vs. any folder without). After T-005
merges: one real click on a blocker link. Standing: the Linux halves
of T-001/T-003 window criteria remain machine-unverified (T-001-s3).

## Open questions
None.
