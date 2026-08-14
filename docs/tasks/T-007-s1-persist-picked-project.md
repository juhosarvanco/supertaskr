---
title: Persist the last picked project across launches
status: suggested
suggested_by: executor claude-fable-5 @T-007
---

T-007's picker opens any convention-layout folder, but the choice is
process-lifetime only: relaunching the app re-runs launch resolution
(cwd `.git` walk-up, then executable walk-up) and lands back on the repo
the app lives in — or on the empty state for a packaged .app outside any
repo. A user who mostly works on picked projects re-picks every launch.

Suggest: persist the last successfully opened project dir and prefer it
at startup when it still validates (plain non-symlink docs/ present —
apply_picked_folder's exact gate; on failure fall through to the current
resolution order, never to a broken window). Where to persist is the
real decision: ARCHITECTURE already plans `.nputer/` runtime state
(C-03, sessions.json territory) — a per-user app-config file
(tauri's app-config dir) may be the smaller first step and avoids
writing into repos. Interacts with T-001-s1's still-open CLI/env
override decision: an explicit override should beat the persisted
choice; precedence order belongs in one place. Small scope; touches
app/src-tauri (read/write one path + startup resolution) and nothing in
the webview.
